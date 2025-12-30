
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

const bookingData = JSON.parse(sessionStorage.getItem("bookingData"));

if (bookingData) {
    updateSummaryPage();
}

function updateSummaryPage() {

    document.getElementById('summaryDeparture').textContent = bookingData.departureLocation;
    document.getElementById('summaryDestination').textContent = bookingData.destinationLocation;
    document.getElementById('summaryDepartureDate').textContent = bookingData.departureDate;
    document.getElementById('summaryDepartureTime').textContent = bookingData.departureTime;
    document.getElementById('summaryTotal').textContent = '$' + bookingData.totalFare.toFixed(2);

    if (bookingData.tripType === 'round') {
        document.getElementById('returnSummary').classList.remove('hidden');
        document.getElementById('returnDeparture').textContent = bookingData.returnLocation;
        document.getElementById('returnDestination').textContent = bookingData.returnDestination;
        document.getElementById('summaryReturnDate').textContent = bookingData.returnDate;
        document.getElementById('summaryReturnTime').textContent = bookingData.returnTime;
    }

    generatePassengerInputs();
}

function generatePassengerInputs() {
    const container = document.getElementById('passengerInputs');
    container.innerHTML = '';

    let passengerNum = 1;
    const types = ['adults', 'children', 'seniors', 'students'];
    const typeLabels = ['Adult', 'Child', 'Senior', 'Student'];

    types.forEach((type, index) => {
        const count = bookingData.passengerTypes[type];
        for (let i = 0; i < count; i++) {
            const div = document.createElement('div');
            div.className = 'form-group';
            div.innerHTML = `
                        <label for="passenger${passengerNum}">Passenger ${passengerNum} (${typeLabels[index]}) - Full Name</label>
                        <input type="text" id="passenger${passengerNum}" required>
                    `;
            container.appendChild(div);
            passengerNum++;
        }
    });
}

function submitPayment() {

    const cardHolderName = document.getElementById('cardHolderName').value;
    const cardHolderEmail = document.getElementById('cardHolderEmail').value;
    const cardNumber = document.getElementById('cardNumber').value;
    const cardExpiry = document.getElementById('cardExpiry').value;
    const cardCvc = document.getElementById('cardCvc').value;

    const trip = document.getElementById('summaryDeparture').textContent + "-" + document.getElementById('summaryDestination').value;
    const paymentAmount = document.getElementById('summaryTotal').textContent;

    if (!cardHolderName || !cardNumber || !cardExpiry || !cardCvc) {
        alert('Please fill in all payment details');
        return;
    }

    // Validate passenger names
    for (let i = 1; i <= bookingData.totalPassengers; i++) {
        const passengerName = document.getElementById(`passenger${i}`).value;
        if (!passengerName) {
            alert('Please fill in all passenger names');
            return;
        }
    }

    // Validate expiry format
    const expiryPattern = /^(0[1-9]|1[0-2])\/\d{4}$/;
    if (!expiryPattern.test(cardExpiry)) {
        alert('Please enter expiration date in MM/YYYY format');
        return;
    }

    paymentDetails = {
        cardHolderName,
        cardHolderEmail,
        paymentAmount,
        trip
    };

    saveBookingPaymentDetails(paymentDetails);
}

async function saveBookingPaymentDetails(paymentDetails) {

    try{
        let response = await fetch(server_path + "/save-booking", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(paymentDetails)
        });

        if (response.ok) {
            let saveResponse = await response.text();
            alert(saveResponse);
            window.open('/booking.html', '_blank');
        }
        else{
            alert("Sorry, your payment has failed! Please contact customer support!");
        }
    }
    catch(error){
        alert(error.message);
    }
}