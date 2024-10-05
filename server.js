const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors"); 
const mysql = require("mysql2");

const app = express();
const PORT = 3060;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());


//setting up mySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Apocalypse_07',
    database: 'crowdfunding_db'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to mySQL database!');
});

app.get("/api/homepage", (req, res) => {
    res.sendFile(path.join(__dirname, "homepage.html"));
});

app.get("/api/searchfundraiser", (req, res) => {
    res.sendFile(path.join(__dirname, "searchfundraiser.html"));
});

app.get("/api/fundraiser", (req, res) => {
    res.sendFile(path.join(__dirname, "fundraiser.html"));
});

//get request for active fundraisers
app.get("/api/fundraisers", (req, res) => {
    const query = `
        SELECT
            F.FUNDRAISER_ID, 
            F.ORGANISER, 
            F.CAPTION, 
            F.TARGET_FUNDING, 
            F.CURRENT_FUNDING, 
            F.CITY, 
            F.ACTIVE, 
            F.CATEGORY_ID, 
            C.NAME AS CATEGORY_NAME 
        FROM FUNDRAISER F
        JOIN CATEGORY C ON F.CATEGORY_ID = C.CATEGORY_ID
        WHERE F.ACTIVE = TRUE
    `;
    db.query(query, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});


app.get("/api/categories", (req, res) => {
    db.query("SELECT * FROM category", (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

app.get("/api/fundraiser/search", (req,res) =>{
    const {organizer, city, category} = req.query;

    let query = `
        SELECT
            F.FUNDRAISER_ID, 
            F.ORGANISER, 
            F.CAPTION, 
            F.TARGET_FUNDING, 
            F.CURRENT_FUNDING, 
            F.CITY, 
            F.ACTIVE, 
            F.CATEGORY_ID, 
            C.NAME AS CATEGORY_NAME 
        FROM FUNDRAISER F
        JOIN CATEGORY C ON F.CATEGORY_ID = C.CATEGORY_ID
        WHERE F.ACTIVE = TRUE
    `;

    const conditions = [];
    const queryParams = [];

    if (organizer) {
        conditions.push("F.ORGANISER = ?");
        queryParams.push(organizer);
    }

    if (city) {
        conditions.push("F.CITY = ?");
        queryParams.push(city);
    }

    if (category) {
        conditions.push("C.NAME = ?");
        queryParams.push(category);
    }
    
    if (conditions.length > 0) {
        query += " AND " + conditions.join(" AND ");
    }

    db.query(query, queryParams, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

app.get("/api/fundraiser/:id", (req, res) => {
    const { id } = req.params;

    let query = `
        SELECT
            F.FUNDRAISER_ID, 
            F.ORGANISER, 
            F.CAPTION, 
            F.TARGET_FUNDING, 
            F.CURRENT_FUNDING, 
            F.CITY, 
            F.ACTIVE, 
            F.CATEGORY_ID, 
            C.NAME AS CATEGORY_NAME 
        FROM FUNDRAISER F
        JOIN CATEGORY C ON F.CATEGORY_ID = C.CATEGORY_ID
        WHERE F.FUNDRAISER_ID = ?
    `;

    db.query(query, [id], (err, results) => {
        if (err) throw err;
        res.json(results[0]);
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});