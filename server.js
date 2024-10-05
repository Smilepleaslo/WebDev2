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

// GET request for categories
app.get("/api/categories", (req, res) => {
    db.query("SELECT * FROM category", (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

// GET request for searching fundraiser details
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

// GET method for fundraiser details including donations
app.get("/api/fundraiser/:id", (req, res) => {
    const { id } = req.params;

    let fundraiserQuery = `
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

    let donationQuery= `
        SELECT 
            D.DONATION_ID, 
            D.GIVER, 
            D.AMOUNT, 
            D.DATE 
        FROM DONATION D
        WHERE D.FUNDRAISER_ID = ?
    `;


    db.query(fundraiserQuery, [id], (err, fundraiserResults) => {
        if (err) throw err;

        if (fundraiserResults.length === 0) {
            return res.status(404).json({ message: "Fundraiser not found"});
        }

        db.query(donationQuery, [id], (err, donationResults) => {
            if (err) throw err;
            res.json({
                fundraiser: fundraiserResults[0],
                donations: donationResults
            });
        });
    });
});

//POST method for a new donation
app.post("/api/donation", (req, res) => {
    const { fundraiserId, giver, amount} = req.body;

    if(!fundraiserId || !giver || ! amount) {
        return res.status(400).json({ message: "All fields are required!!" });
    }

    const donationQuery =`
        INSERT INTO DONATION (FUNDRAISER_ID, GIVER, AMOUNT)
        VALUES (?, ?, ?)
        `;
        
    db.query(donationQuery, [fundraiserId, giver, amount], (err, results)=> {
        if (err) throw err;

        res.json({
            message: 'Donation added successfully'
        });
    });
});

// POST method for new fundraiser
app.post("/api/fundraiser", (req, res) => {
    const { organizer, caption, targetFunding, city, categoryId } = req.body;

    if (!organizer || !caption || !targetFunding || !city || !categoryId) {
        return res.status(400).json({ message: "All fields are required!!"});
    }

    const fundraiserQuery= `
        INSERT INTO FUNDRAISER (ORGANISER, CAPTION, TARGET_FUNDING, CITY, ACTIVE, CATEGORY_ID)
        VALUES (?, ?, ?, ?, TRUE, ?)
        `;

    db.query(fundraiserQuery, [organizer, caption, targetFunding, city, categoryId], (err, results)=> {
        if (err) throw err;

        res.json({
            message: 'Fundraiser added successfully'
        });
    });
});

// PUT method for updating existing user
app.put("/api/fundraiser/:id", (req, res) => {
    const {id} = req.params;
    const { organizer, caption, targetFunding, city, categoryId } =req.body;

    if (!organizer || !caption || !targetFunding || !city || !categoryId) {
        return res.status(400).json({ message: "all fields are required!!"});
    }

    const updateQuery=`
        UPDATE FUNDRAISER
        Set ORGANISER = ?, CAPTION = ?, TARGET_FUNDING = ?, CITY = ?, CATEGORY_ID = ?
        WHERE FUNDRAISER_ID = ?
        `;

    db.query(updateQuery, [organizer, caption, targetFunding, city, categoryId, id], (err, results)=> {
        if (err) throw err;

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: "Fundraiser not found" });
        }

        res.json({
            message: 'Fundraiser updated successfully'
        });
    });
});


// DELETE method for removing a fundraiser data
app.delete("/api/fundraiser/:id", (req,res) => {
    const {id} = req.params;
    
    const deleteFundraiserQuery = `
    DELETE FROM FUNDRAISER WHERE FUNDRAISER_ID = ?
    `;

    db.query(deleteFundraiserQuery, [id], (err, deleteResults) =>{
        if (err) throw err;

        if (deleteResults.affectedRows === 0) {
            return res.status(404).json({ message: "Fundraiser not found" });
        }
        res.json({
            message: 'Fundraiser deleted successfully'
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});