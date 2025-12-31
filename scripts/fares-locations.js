
const server_path = "http://localhost:8088";

document.addEventListener("DOMContentLoaded", async () => {
    await updateRouteFaresTable();
    await updateOfficeLocations();
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

async function updateRouteFaresTable() {

    let response = await fetch(server_path + "/get-fares");

    if (!response.ok){
        throw new Error("Failed to fetch fares.");
    }
    let faresResponse = await response.json();

    let locationsResponse = await fetch(server_path + "/locations");
    if (!locationsResponse.ok) {
        throw new Error("Failed to fetch locations");
    }

    let locationsData = await locationsResponse.json();
    let locations = locationsData.officeData.offices;

    const tbody = document.querySelector("#fares-table tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    faresResponse.fares.routes.forEach((route) => {

        const tr = document.createElement("tr");
        const departingLocation = locations.find(o => o.id === route.start)?.name;
        const destinationLocation = locations.find(o => o.id === route.end)?.name;

        const routeName = `${departingLocation} - ${destinationLocation}`;
        if (!departingLocation || !destinationLocation) {
            return;
        }
        tr.innerHTML = `
            <td><div>${routeName}</div></td>
            <td><div>${formatCurrency(route.fares?.adult)}</div></td>
            <td><div>${formatCurrency(route.fares?.child)}</div></td>
            <td><div>${formatCurrency(route.fares?.senior)}</div></td>
            <td><div>${formatCurrency(route.fares?.student)}</div></td>
        `;
        tbody.appendChild(tr);
    });
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

async function updateOfficeLocations() {

    let locResponse = await fetch(server_path + "/locations");

    if (!locResponse.ok) {
        throw new Error("Failed to fetch locations");
    }
    let locationsData = await locResponse.json();
    let locations = locationsData.officeData.offices;

    const tbody = document.querySelector("#offices-table tbody");
    tbody.innerHTML = "";

    locations.forEach((location) => {

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><div>${location.name}</div></td>
            <td><div>${location.open}</div></td>
            <td><div>${location.closed}</div></td>
            <td><div>${location.address}</div></td>
        `;
        tbody.appendChild(tr);
    });
}