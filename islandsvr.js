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

    let routesData = await loadRoutesFaresData();
    res.send(routesData);
});

server.get("/get-route-fares", async (req, res) => {

    const routeFareId = req.query.routeId;
    const faresData  = await loadRoutesFaresData();

    try {
        const route = faresData.routes.find(route => route.route === routeFareId);

        if (route) {
            res.json({ route });
        } else {
            res.status(404).json({ error: "Fares not found for route " + routeFareId });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load route data" });
    }
});

server.get("/locations", async (req, res) => {
    res.json(office_locations);
});

server.get('/location-name', (req, res) => {

    const locationId = req.query.id;
    const office = office_locations.offices.find(o => o.id === locationId);

    if (office) {
        res.json({ name: office.name });
    } else {
        res.status(404).json({ error: "Location not found" });
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




})
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

const office_locations = {
    "offices": [
        {"id": "loc-001", "name": "Kingston", "open": "4:30AM", "closed": "8:00PM", "address": "New Kingston, Kingston 5"},
        {"id": "loc-002", "name": "Spanish Town", "open": "5:30AM", "closed": "8:00PM", "address": "Spanish Town (Angels), St. Catherine"},
        {"id": "loc-003", "name": "Ocho Rios", "open": "6:30AM", "closed": "7:00PM", "address": "Drax Hall, St. Ann"},
        {"id": "loc-004", "name": "Falmouth", "open": "8:00AM", "closed": "6:00PM", "address": "Falmouth, Trelawny"},
        {"id": "loc-005", "name": "Montego Bay (Airport)", "open": "5:30AM", "closed": "7:00PM", "address": "Montego Bay Airport, St. James"},
        {"id": "loc-006", "name": "Mandeville", "open": "5:00AM", "closed": "7:30PM", "address": "Mandeville, Manchester"},
        {"id": "loc-007", "name": "May Pen", "open": "8:00AM", "closed": "4:00PM", "address": "May Pen, Clarendon"},
        {"id": "loc-008", "name": "Lucea", "open": "7:30AM", "closed": "6:00PM", "address": "Lucea, Hanover"},
        {"id": "loc-009", "name": "Negril", "open": "5:00AM", "closed": "7:00PM", "address": "Negril, Westmoreland"},
        {"id": "loc-010", "name": "Savanna-La-Mar", "open": "6:00AM", "closed": "6:00PM", "address": "Savanna-La-Mar, Westmoreland"}
    ]
};