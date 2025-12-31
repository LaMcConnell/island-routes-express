const express = require("express");
const server = express();

const cors = require("cors");
server.use(express.json());

const port = 8088;
const fs = require("fs");
const path = require('path');


server.use(cors({
    origin: `http://localhost:${port}`,
    methods: ['GET', 'POST'],
    credentials: true
}));

// Start server
server.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

// Serve static files (recommended)
server.use(express.static(path.join(__dirname)));

// Root route
server.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

server.get("/get-fares", async (req, res) => {

    try {
        let fares = await loadRoutesFaresData();

        if (fares) {
            res.json({ fares });
        } else {
            res.status(404).json({ error: "Failed to load fares data."});
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load fares data." });
    }
});

server.get("/get-route-fares", async (req, res) => {

    const routeFareId = req.query.routeId;
    const faresData  = await loadRoutesFaresData();

    try {
        const route = faresData.routes.find(route => route.route === routeFareId);

        if (route) {
            res.json({ route });
        } else {
            res.status(404).json({ error: "Fares not found for route " + routeFareId +"." });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load route data." });
    }
});

server.get("/locations", async (req, res) => {

    try {
        const officeData  = await loadOfficeLocations();

        if (officeData) {
            res.json({ officeData });
        } else {
            res.status(404).json({ error: "Failed to load locations data."});
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load locations data." });
    }
});

server.get('/location-name', async (req, res) => {

    const locationId = req.query.id;
    const officeData  = await loadOfficeLocations();

    const office = officeData.offices.find(o => o.id === locationId);

    if (office) {
        res.json({ name: office.name });
    } else {
        res.status(404).json({ error: "Location not found." });
    }
});

server.get("/get-schedules", async (req, res) => {

    try {
        const scheduleData  = await loadRouteSchedules();

        if (scheduleData) {
            res.json({ scheduleData });
        } else {
            res.status(404).json({ error: "Failed to load scheduling data."});
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load scheduling data." });
    }
});

server.post("/save-booking", (req, res) => {

    try{
        if (Object.keys(req.body).length === 0) {
            res.status(400).json({error: "Required booking information is missing!"});
        }
        else{
            let payload = req.body;
            let saveStatus = "Booking Confirmed! Payment of: " + payload.paymentAmount + " received.";
            res.send(saveStatus);
        }
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error, payment for Booking has failed." });
    }
});

async function loadRoutesFaresData(){

    const filePath = path.join(__dirname, "filestore", "routes_fares.json");
    const faresData = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(faresData);
}

// Catch-all 404
server.get(/.*/, (req, res) => {
    res.status(404).send(
        path.join(__dirname, "../notfound.html")
    );
});

async function loadOfficeLocations(){

    const filePath = path.join(__dirname, "filestore", "office_locations.json");
    const faresData = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(faresData);
}

// Catch-all 404
server.get(/.*/, (req, res) => {
    res.status(404).send(
        path.join(__dirname, "../notfound.html")
    );
});

async function loadRouteSchedules(){

    const filePath = path.join(__dirname, "filestore", "route_schedules.json");
    const faresData = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(faresData);
}

// Catch-all 404
server.get(/.*/, (req, res) => {
    res.status(404).send(
        path.join(__dirname, "../notfound.html")
    );
});