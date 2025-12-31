
let bookingData = {};

const minSeatsPerTrip = 1;
const maxSeatsPerTrip = 42;
const server_path = "http://localhost:8088";

fetch('/masters/header.html')
    .then(res => res.text())
    .then(html => {
        document.getElementById('site-header').innerHTML = html;

        // set active link
        const page = document.body.dataset.page;

        if (page) {
            const link = document.querySelector(`a[data-page="${page}"]`);
            if (link) link.classList.add('active');
        }
    });

fetch('/masters/footer.html')
    .then(response => response.text())
    .then(html => {
        document.getElementById('site-footer').innerHTML = html;
    });

$(document).ready(function(){

    populateOfficeSelect('office-origin');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    $("#departure-date").datepicker({
        format: 'dd-mm-yyyy',
        autoclose: true,
        todayHighlight: true

    }).on('changeDate', function(e) {
        const dateObject = e.date;
        const oneYearAheadOfToday = new Date(today);
        oneYearAheadOfToday.setFullYear(today.getFullYear() + 1);
        oneYearAheadOfToday.setHours(0, 0, 0, 0);

        if (dateObject < today) {

            document.getElementById("invalid-departure-date").innerHTML = "The 'Departure Date' selected has passed.";
            document.getElementById("invalid-departure-date").style.color = "red";

            $("#departure-time").prop('disabled', true);
            $('input[name="trip-type"]').prop('disabled', true);

        }else if (dateObject > oneYearAheadOfToday) {

            document.getElementById("invalid-departure-date").innerHTML = "The 'Departure Date' selected must be less than a year ahead from today.";
            document.getElementById("invalid-departure-date").style.color = "red";

            $("#departure-time").prop('disabled', true);
            $('input[name="trip-type"]').prop('disabled', true);
        }
        else{
            $("#departure-time").prop('disabled', false);
            $('input[name="trip-type"]').prop('disabled', false);
            document.getElementById("invalid-departure-date").innerHTML = "";
        }

        getRouteTimes("departure-time");
    });

    $("#return-date").datepicker({
        format: 'dd-mm-yyyy',
        autoclose: true,
        todayHighlight: true

    }).on('changeDate', function(e) {

        const dateObject = e.date;
        const oneYearAheadOfToday = new Date(today);
        const selectedDepartureDate = document.getElementById("departure-date").value;

        const dateParts = selectedDepartureDate.split('-');
        const day = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1; // Month is 0-indexed
        const year = parseInt(dateParts[2]);

        const departureDate = new Date(year, month, day, 0, 0, 0, 0);
        departureDate.setHours(0, 0, 0, 0);

        oneYearAheadOfToday.setFullYear(today.getFullYear() + 1);
        oneYearAheadOfToday.setHours(0, 0, 0, 0);

        if (dateObject < today) {

            document.getElementById("invalid-return-date").innerHTML = "The 'Return Date' selected has passed.";
            document.getElementById("invalid-return-date").style.color = "red";

            $("#return-time").prop('disabled', true);
            $('input[name="trip-type"]').prop('disabled', true);

        }
        else if(dateObject < departureDate){

            document.getElementById("invalid-return-date").innerHTML = "The 'Return Date' selected cannot be earlier than the date of departure.";
            document.getElementById("invalid-return-date").style.color = "red";

            $("#return-time").prop('disabled', true);
            $('input[name="trip-type"]').prop('disabled', true);
        }
        else if (dateObject > oneYearAheadOfToday) {

            document.getElementById("invalid-return-date").innerHTML = "The 'Return Date' selected must be less than a year ahead from today.";
            document.getElementById("invalid-return-date").style.color = "red";

            $("#return-time").prop('disabled', true);
            $('input[name="trip-type"]').prop('disabled', true);
        }
        else{
            $("#return-time").prop('disabled', false);
            $('input[name="trip-type"]').prop('disabled', false);
            document.getElementById("invalid-return-date").innerHTML = "";
        }

        getRouteTimes("return-time");
    });

    $("#departure-time").on('change', function() {
        const timeValue = $(this).val();
        const departureDate = document.getElementById("departure-date").value;
        const date = new Date(departureDate);

        if (!date) {
            alert("Please select a Departure Date.");
            return;
        }

        validateTime(departureDate, timeValue, "departure-time")
    });

    $("#return-time").on('change', function() {
        const timeValue = $(this).val();
        const returnDate = document.getElementById("return-date").value;
        const date = new Date(returnDate);

        if (!date) {
            alert("Please select a Return Date.");
            return;
        }

        validateTime(returnDate, timeValue, "return-time")
    });

    $('input[name="trip-type"]').prop('checked', false);

});

function toggleInfo(divId, radio) {
    document.querySelectorAll('.return-info').forEach(div => div.style.display = 'none');
    document.getElementById(divId).style.display = 'block';

    if(divId === "return-trip"){
        document.getElementById("passengers").style.display = 'block';
    }
}

async function populateOfficeSelect(selectId) {
    const routeOrigin = document.getElementById(selectId);
    routeOrigin.innerHTML = '<option value="">-- Departing From --</option>';

    let locationsResponse = await fetch(server_path + "/locations");
    if (!locationsResponse.ok) {
        throw new Error("Failed to fetch locations");
    }

    let locationsData = await locationsResponse.json();
    let locations = locationsData.officeData.offices;

    locations.forEach(office => {
        const option = document.createElement('option');
        option.value = office.id;
        option.textContent = office.name;

        routeOrigin.appendChild(option);
    });
}

async function getLocationName(locationId) {
    let locationResponse = await fetch(server_path + "/location-name?id="+locationId);

    if (!locationResponse.ok) {
        throw new Error("Failed to fetch locations");
    }

    const data = await locationResponse.json();
    return data.name;
}

async function loadRoutesFaresData(){

    const response = await fetch(server_path + "/get-fares");

    if (!response.ok){
        throw new Error("Failed to fetch fares");
    }

    const data = await response.json();

    if (!Array.isArray(data.fares.routes)) {
        throw new Error("Invalid routes response.");
    }

    return data.fares.routes;
}

async function filterDestinationRoutes(origin) {

    try {

        const routeDepartureOfficeId = document.getElementById(origin).value;
        const routeDestination = document.getElementById('office-destination');

        document.getElementById('office-origin-required').innerHTML = "";
        routeDestination.innerHTML = '<option value="">-- Destination --</option>';
        
        const destinationRouteFares = await loadRoutesFaresData();

        for (const dest of destinationRouteFares) {
            if (dest.start === routeDepartureOfficeId) {
                const option = document.createElement('option');
                option.id = dest.route;
                option.value = dest.end;
                option.textContent = await getLocationName(dest.end);

                routeDestination.appendChild(option);
            }
        }

        document.getElementById("balanceOfSeats").innerHTML = "";
        
    } catch (err) {
        console.error(err);
    }
}

async function showFaresByRoute() {

    const destination = document.getElementById("office-destination");
    const routeId = destination.options[destination.selectedIndex].id;

    const routeInfo = await getFaresByRoute(routeId);
    const fare = routeInfo["route"].fares;

    document.getElementById("adult-fare-amt").innerHTML = formatCurrency(fare?.adult);
    document.getElementById("child-fare-amt").innerHTML = formatCurrency(fare?.child);
    document.getElementById("senior-fare-amt").innerHTML = formatCurrency(fare?.senior);
    document.getElementById("student-fare-amt").innerHTML = formatCurrency(fare?.student);

    document.getElementById("balanceOfSeats").style.display = "inline-block";
    document.getElementById("balanceOfSeats").innerHTML = maxSeatsPerTrip.toString();
}

function formatCurrency(amount) {
    if (amount === null || amount === undefined || amount === "") {
        return "";
    }

    return "$" + Number(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}
function validateOriginOfDeparture(){
    const origin = document.getElementById("office-origin").value;

    if(origin === ""){
        document.getElementById('office-origin-required').innerHTML = "Please select your location of departure!";
        document.getElementById('office-origin-required').style.color = "red";
    }
}

function getRouteTimes(routeTimeId){

    const routeTimeElement = document.getElementById(routeTimeId);
    routeTimeElement.innerHTML = '<option value="">-- Select a Time --</option>';

    routeTimes.trips.forEach(trip => {
        const option = document.createElement('option');
        option.id = trip.id;
        option.value = trip.time;
        option.textContent = trip.time;

        routeTimeElement.appendChild(option);
    });
}

async function getFaresByRoute(routeId){

    let routeFareResponse = await fetch(server_path + "/get-route-fares?routeId="+routeId);
    console.log("get route Fare Response is here");

    if (!routeFareResponse.ok) {
        throw new Error("Failed to fetch locations");
    }

    return await routeFareResponse.json();
}

function calculateFare(passengerFareId, amtPassengersId, passengerType){

    let bookingGrandTotal = 0
    let passengerFareTotal = 0;
    let totalNumberOfSeatsInShoppingCart = 0;

    const error_label = amtPassengersId + "-err"
    const tripType = document.querySelector('input[name="trip-type"]:checked')?.value;

    let numberOfAdultSeatsInCart = document.getElementById("adult-count").value !== "" ? document.getElementById("adult-count").value : 0;
    let costOfAdultSeatsInCart = document.getElementById("adult-fare-total").innerHTML !== "" ? document.getElementById("adult-fare-total").innerHTML.replace(/[$,]/g, "") : 0;

    let numberOfChildSeatsInCart = document.getElementById("child-count").value !== "" ? document.getElementById("child-count").value : 0;
    let costOfChildSeatsInCart = document.getElementById("child-fare-total").innerHTML !== "" ? document.getElementById("child-fare-total").innerHTML.replace(/[$,]/g, "") : 0;

    let numberOfSeniorSeatsInCart = document.getElementById("senior-count").value !== "" ? document.getElementById("senior-count").value : 0;
    let costOfSeniorSeatsInCart = document.getElementById("senior-fare-total").innerHTML !== "" ? document.getElementById("senior-fare-total").innerHTML.replace(/[$,]/g, "") : 0;

    let numberOfStudentSeatsInCart = document.getElementById("student-count").value !== "" ? document.getElementById("student-count").value : 0;
    let costOfStudentSeatsInCart = document.getElementById("student-fare-total").innerHTML !== "" ? document.getElementById("student-fare-total").innerHTML.replace(/[$,]/g, "") : 0;

    const isAdultCount = amtPassengersId === "adult-count";
    const isChildCount = amtPassengersId === "child-count";
    const isSeniorCount = amtPassengersId === "senior-count";
    const isStudentCount = amtPassengersId === "student-count";

    if(isAdultCount){
        totalNumberOfSeatsInShoppingCart = (parseInt(numberOfChildSeatsInCart) + parseInt(numberOfSeniorSeatsInCart) + parseInt(numberOfStudentSeatsInCart));
        bookingGrandTotal = (parseInt(costOfChildSeatsInCart) + parseInt(costOfSeniorSeatsInCart) + parseInt(costOfStudentSeatsInCart));
    }

    if(isChildCount){
        totalNumberOfSeatsInShoppingCart = (parseInt(numberOfAdultSeatsInCart) + parseInt(numberOfSeniorSeatsInCart) + parseInt(numberOfStudentSeatsInCart));
        bookingGrandTotal += (parseInt(costOfAdultSeatsInCart) + parseInt(costOfSeniorSeatsInCart) + parseInt(costOfStudentSeatsInCart));
    }

    if(isSeniorCount){
        totalNumberOfSeatsInShoppingCart = (parseInt(numberOfAdultSeatsInCart) + parseInt(numberOfChildSeatsInCart) + parseInt(numberOfStudentSeatsInCart));
        bookingGrandTotal += (parseInt(costOfAdultSeatsInCart) + parseInt(costOfChildSeatsInCart) + parseInt(costOfStudentSeatsInCart));
    }

    if(isStudentCount){
        totalNumberOfSeatsInShoppingCart = (parseInt(numberOfAdultSeatsInCart) + parseInt(numberOfChildSeatsInCart) + parseInt(numberOfSeniorSeatsInCart));
        bookingGrandTotal += (parseInt(costOfAdultSeatsInCart) + parseInt(costOfChildSeatsInCart) + parseInt(costOfSeniorSeatsInCart));
    }

    let numberOfSeatsToAddToCart = document.getElementById(amtPassengersId).value;
    let numberOfRemainingSeatsAvailable = maxSeatsPerTrip - totalNumberOfSeatsInShoppingCart;

    const seatsAvailable = maxSeatsPerTrip > totalNumberOfSeatsInShoppingCart;

    if(seatsAvailable && (numberOfSeatsToAddToCart > maxSeatsPerTrip)){
        document.getElementById(error_label).innerHTML = "Error, max seating (" + maxSeatsPerTrip + ") exceeded.";
        document.getElementById(error_label).style.color = "red";
    }
    else if(seatsAvailable && (numberOfSeatsToAddToCart < minSeatsPerTrip)){
        document.getElementById(error_label).innerHTML = "Error, min seating of (" + minSeatsPerTrip + ") required.";
        document.getElementById(error_label).style.color = "red";
    }
    else {
        document.getElementById(error_label).innerHTML = "";
    }

    if(seatsAvailable){

        if(numberOfSeatsToAddToCart > numberOfRemainingSeatsAvailable){
            document.getElementById(error_label).innerHTML = "Error, available seats (" + numberOfRemainingSeatsAvailable + ") exceeded.";
            document.getElementById(error_label).style.color = "red";
        }
        else{
            let farePerPassenger = document.getElementById(passengerFareId).innerHTML.replace("$", "");
            passengerFareTotal +=  parseInt(farePerPassenger.replace(/,/g, '')) * numberOfSeatsToAddToCart;

            if(tripType === "Round"){
                passengerFareTotal += passengerFareTotal * 2;
            }

            bookingGrandTotal += passengerFareTotal;
            numberOfRemainingSeatsAvailable -= numberOfSeatsToAddToCart;
            totalNumberOfSeatsInShoppingCart = maxSeatsPerTrip - numberOfRemainingSeatsAvailable;

            document.getElementById(passengerType).innerHTML = formatCurrency(passengerFareTotal);
            document.getElementById("grand-total").innerHTML = formatCurrency(bookingGrandTotal);

            document.getElementById("balanceOfSeats").style.display = "inline-block";
            document.getElementById("balanceOfSeats").innerHTML = numberOfRemainingSeatsAvailable.toString();
            document.getElementById("totalNumberOfSeatsAddToCart").innerHTML = totalNumberOfSeatsInShoppingCart.toString();
        }
    }
    else{

        document.getElementById(error_label).innerHTML = "Sorry, no more seats available.";
        document.getElementById(error_label).style.color = "red";

        document.getElementById("balanceOfSeats").innerHTML = numberOfRemainingSeatsAvailable.toString();
        document.getElementById("balanceOfSeats").style.color = "red";
    }

    $("#checkout").prop('disabled', false);
}

function resetPassengerFares(){

    document.getElementById("adult-fare-total").innerHTML = "";
    document.getElementById("child-fare-total").innerHTML = "";
    document.getElementById("senior-fare-total").innerHTML = "";
    document.getElementById("student-fare-total").innerHTML = "";

    document.getElementById("adult-count").value = "";
    document.getElementById("adult-count-err").innerHTML = "";

    document.getElementById("child-count").value = "";
    document.getElementById("child-count-err").innerHTML = "";

    document.getElementById("senior-count").value = "";
    document.getElementById("senior-count-err").innerHTML = "";

    document.getElementById("student-count").value = "";
    document.getElementById("student-count-err").innerHTML = "";

    document.getElementById("balanceOfSeats").innerHTML = maxSeatsPerTrip.toString();
    document.getElementById("balanceOfSeats").style.color = "black";

}

function validateTime(selectedDate, selectedTime, datePicker) {

    const invalidElementId = "invalid-" + datePicker;
    const timeParts = selectedTime.match(/(\d+):(\d+)(AM|PM)/i);
    const trip = datePicker === "departure-time" ? "departure" : "return";

    let hours = parseInt(timeParts[1]);
    const minutes = parseInt(timeParts[2]);
    const period = timeParts[3].toUpperCase();

    if (period === 'PM' && hours !== 12) {
        hours += 12;
    } else if (period === 'AM' && hours === 12) {
        hours = 0;
    }

    const dateParts = selectedDate.split('-');
    const day = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1; // Month is 0-indexed
    const year = parseInt(dateParts[2]);

    const selectedDateTime = new Date(year, month, day, hours, minutes, 0, 0);
    const selectedDateOnly = new Date(year, month, day, 0, 0, 0, 0);

    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const departureSelectedDate = document.getElementById("departure-date").value;
    const departureSelectedTime = document.getElementById("departure-time").value;
    const departureTimeParts = departureSelectedTime.match(/(\d+):(\d+)(AM|PM)/i);

    const dateParts_ = departureSelectedDate.split('-');
    const day_ = parseInt(dateParts_[0]);
    const month_ = parseInt(dateParts_[1]) - 1; // Month is 0-indexed
    const year_ = parseInt(dateParts_[2]);

    let hours_ = parseInt(departureTimeParts[1]);
    const minutes_ = parseInt(departureTimeParts[2]);
    const period_ = departureTimeParts[3].toUpperCase();

    const departureDateTime = new Date(year_, month_, day_, hours_, minutes_, 0, 0);

    // Check if selected date is today
    if (selectedDateOnly.getTime() === today.getTime()) {

        // Condition 1: Time must be at least 1 hour ahead
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

        if (selectedDateTime < now) {
            document.getElementById(invalidElementId).innerHTML = "Sorry, " + trip + " time selected has already passed. Please select an upcoming time.";
            document.getElementById(invalidElementId).style.color = "red";
        }
        else if (selectedDateTime < oneHourFromNow) {
            document.getElementById(invalidElementId).innerHTML = "Sorry, " + trip + " must be at least 1 hour ahead for same-day bookings. Please select an upcoming time.";
            document.getElementById(invalidElementId).style.color = "red";
        }
        else{
            document.getElementById(invalidElementId).innerHTML = "";
        }
    }
    else if (selectedDateOnly.getTime() > today.getTime()){

        if(trip === "return"){

            if (selectedDateTime.getTime() === departureDateTime.getTime()) {
                document.getElementById(invalidElementId).innerHTML = "Sorry, Departure and Return times cannot be the same for same-day bookings. Please select an upcoming time.";
                document.getElementById(invalidElementId).style.color = "red";
            }
            else if (selectedDateTime.getTime() < departureDateTime.getTime()){
                document.getElementById(invalidElementId).innerHTML = "Sorry, Return time cannot be earlier than the Departure time. Please select an upcoming time.";
                document.getElementById(invalidElementId).style.color = "red";
            }
            else{
                document.getElementById(invalidElementId).innerHTML = "";
            }
        }
    }
    else{
        document.getElementById(invalidElementId).innerHTML = "";
        $('input[name="trip-type"]').prop('disabled', false);
    }
}

async function proceedToCheckout(){

    const departureLocation = await getLocationName(document.getElementById('office-origin').value);
    const destinationLocation = await getLocationName(document.getElementById('office-destination').value);
    const returnLocation = await getLocationName(document.getElementById('office-destination').value);
    const returnDestination = await getLocationName(document.getElementById('office-origin').value);

    const departureDate = document.getElementById('departure-date').value;
    const departureTime = document.getElementById('departure-time').value;
    const returnDate = document.getElementById('departure-date').value;
    const returnTime = document.getElementById('return-time').value;

    const tripType = document.querySelector('input[name="trip-type"]:checked').value;

    const totalNumAdults = parseInt(document.getElementById('adult-count').value) || 0;
    const totalNumChildren = parseInt(document.getElementById('child-count').value) || 0;
    const totalNumSeniors = parseInt(document.getElementById('senior-count').value) || 0;
    const totalNumStudents = parseInt(document.getElementById('student-count').value) || 0;

    const totalPassengers = totalNumAdults +totalNumChildren + totalNumSeniors + totalNumStudents;

    const totalAdultsFare = parseFloat(document.getElementById('adult-fare-total').innerHTML.replace(/[$,]/g, "")) || 0;
    const totalChildrenFare = parseFloat(document.getElementById('child-fare-total').innerHTML.replace(/[$,]/g, "")) || 0;
    const totalSeniorsFare = parseFloat(document.getElementById('senior-fare-total').innerHTML.replace(/[$,]/g, "")) || 0;
    const totalStudentsFare = parseFloat(document.getElementById('student-fare-total').innerHTML.replace(/[$,]/g, "")) || 0;

    const totalFare = totalAdultsFare + totalChildrenFare + totalSeniorsFare + totalStudentsFare;

    bookingData = {
        departureLocation,
        destinationLocation,
        departureDate,
        departureTime,
        returnLocation,
        returnDestination,
        returnDate,
        returnTime,
        tripType,
        totalPassengers,
        totalFare,
        passengerTypes: {
            adults: totalNumAdults,
            children: totalNumChildren,
            seniors: totalNumSeniors,
            students: totalNumStudents
        }
    };

    if (tripType === 'return') {
        const returnDate = document.getElementById('return-date').value;
        const returnTime = document.getElementById('return-time').value;

        bookingData.returnDate = returnDate;
        bookingData.returnTime = returnTime;
    }

    sessionStorage.setItem("bookingData", JSON.stringify(bookingData));

    // Navigate to next page
    window.location.href = "/booking-summary.html";
}

const routeTimes = {
    "trips": [
        {"id": "t001", "time": "06:00AM"},
        {"id": "t002", "time": "07:00AM"},
        {"id": "t003", "time": "08:00AM"},
        {"id": "t004", "time": "10:00AM"},
        {"id": "t005", "time": "01:30PM"},
        {"id": "t006", "time": "03:30PM"},
        {"id": "t007", "time": "05:00PM"}
    ]
}