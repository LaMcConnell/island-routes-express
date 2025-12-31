
const server_path = "http://localhost:8088";

document.addEventListener("DOMContentLoaded", async () => {
    await loadRouteSchedules();
});

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

async function loadRouteSchedules() {

    try {
        let response = await fetch(server_path + "/get-schedules");

        if (!response.ok) {
            throw new Error("Failed to fetch schedules.");
        }

        let schedulesResponse = await response.json();

        scheduleData = schedulesResponse.scheduleData;

        populateFilterDropdowns(scheduleData.routes);
        renderScheduleTable(scheduleData.routes, scheduleData.timeSlots);
        setupFilterListeners();

    } catch (error) {
        console.error("Error loading schedules:", error);
        const scheduleBody = document.getElementById("schedule-body");
        scheduleBody.innerHTML = '<tr><td colspan="9" class="error">Failed to load schedules. Please try again later.</td></tr>';
    }
}

function populateFilterDropdowns(routes) {
    const departureSelect = document.getElementById("departure-select");
    const destinationSelect = document.getElementById("destination-select");

    const departures = [...new Set(routes.map(route => route.departure))].sort();
    const destinations = [...new Set(routes.map(route => route.destination))].sort();

    departureSelect.innerHTML = '<option value="">All Departures</option>';
    destinationSelect.innerHTML = '<option value="">All Destinations</option>';

    departures.forEach(departure => {
        const option = document.createElement("option");
        option.value = departure;
        option.textContent = departure;
        departureSelect.appendChild(option);
    });

    destinations.forEach(destination => {
        const option = document.createElement("option");
        option.value = destination;
        option.textContent = destination;
        destinationSelect.appendChild(option);
    });
}

function setupFilterListeners() {
    const departureSelect = document.getElementById("departure-select");
    const destinationSelect = document.getElementById("destination-select");
    const resetBtn = document.getElementById("reset-btn");

    departureSelect.addEventListener("change", applyFilters);
    destinationSelect.addEventListener("change", applyFilters);
    resetBtn.addEventListener("click", resetFilters);
}

function applyFilters() {
    const departureSelect = document.getElementById("departure-select");
    const destinationSelect = document.getElementById("destination-select");

    const selectedDeparture = departureSelect.value;
    const selectedDestination = destinationSelect.value;

    let filteredRoutes = scheduleData.routes;

    if (selectedDeparture) {
        filteredRoutes = filteredRoutes.filter(route => route.departure === selectedDeparture);
    }

    if (selectedDestination) {
        filteredRoutes = filteredRoutes.filter(route => route.destination === selectedDestination);
    }

    renderScheduleTable(filteredRoutes, scheduleData.timeSlots);
}

function resetFilters() {
    const departureSelect = document.getElementById("departure-select");
    const destinationSelect = document.getElementById("destination-select");

    departureSelect.value = "";
    destinationSelect.value = "";

    renderScheduleTable(scheduleData.routes, scheduleData.timeSlots);
}

function renderScheduleTable(routes, timeSlots) {
    const scheduleBody = document.getElementById("schedule-body");
    scheduleBody.innerHTML = "";

    if (!routes || routes.length === 0) {
        scheduleBody.innerHTML = '<tr><td colspan="9" class="no-data">No schedules found matching your criteria.</td></tr>';
        return;
    }

    routes.forEach(route => {
        const row = document.createElement("tr");
        const routeCell = document.createElement("td");
        routeCell.innerHTML = `<strong>${route.departure}</strong> → <strong>${route.destination}</strong>`;
        row.appendChild(routeCell);

        const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
        weekdays.forEach(() => {
            const dayCell = document.createElement("td");
            dayCell.innerHTML = timeSlots.weekday.join("<br>");
            row.appendChild(dayCell);
        });

        const weekendDays = ["Saturday", "Sunday"];
        weekendDays.forEach(() => {
            const dayCell = document.createElement("td");
            dayCell.innerHTML = timeSlots.weekend.join("<br>");
            row.appendChild(dayCell);
        });

        const durationCell = document.createElement("td");
        durationCell.textContent = route.duration;
        row.appendChild(durationCell);

        scheduleBody.appendChild(row);
    });
}