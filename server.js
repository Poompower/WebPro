const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;
const db = new sqlite3.Database('UDEE.db', (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// Set the view engine to ejs
app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/assets", express.static(path.join(__dirname, "assets")));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session management
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Route for the home page
app.get('/', (req, res) => {
    res.render('start');
});

// API route for user registration
app.post('/register', (req, res) => {
    const { username, password, firstName, lastName, telephone, email } = req.body;
    let errors = [];

    // ตรวจสอบว่า username, email และ fullname ต้องไม่ซ้ำ และ telephone ต้องเป็นเลข 10 หลัก
    if (!/^[0-9]{10}$/.test(telephone)) {
        errors.push("หมายเลขโทรศัพท์ต้องมี 10 หลัก");
    }

    db.get("SELECT * FROM tenant WHERE tenant_username = ? OR email = ? OR (firstName = ? AND lastName = ?)",
        [username, email, firstName, lastName], (err, row) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ status: 'error', message: 'Database error' });
            }
            if (row) {
                return res.status(400).json({ status: 'error', message: 'Username, Email หรือ Full Name ถูกใช้ไปแล้ว' });
            }

            // ถ้าผ่านเงื่อนไข ให้ INSERT ลงฐานข้อมูล
            db.run("INSERT INTO tenant (tenant_username, tenant_password, firstName, lastName, telephone, email) VALUES (?, ?, ?, ?, ?, ?)",
                [username, password, firstName, lastName, telephone, email],
                function (err) {
                    if (err) {
                        console.log(err, 'cannot insert user');
                        return res.status(500).json({ status: 'error', message: 'Database error' });
                    }
                    console.log('Insert user success');
                    res.status(200).json({ status: 'success', message: 'User registered successfully' });
                }
            );
        }
    );
});

// API route for user login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get("SELECT * FROM tenant WHERE tenant_username = ? AND tenant_password = ?", [username, password], (err, row) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ status: 'error', message: 'Database error' });
        }
        if (!row) {
            return res.status(400).json({ status: 'error', message: 'Invalid username or password' });
        }

        // Create a session for the user
        req.session.user = {
            id: row.id,
            username: row.tenant_username,
            firstName: row.firstName,
            lastName: row.lastName
        };

        res.status(200).json({ status: 'success', message: 'Login successful' });
    });
});

// Route for the ref page
app.get('/ref', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }
    res.render('ref', { user: req.session.user });
});

// Route for the owner login page
app.get('/owner-login', (req, res) => {
    res.render('owner-login');
});

// API route for owner login
app.post('/owner-login', (req, res) => {
    const { username, password } = req.body;

    db.get("SELECT * FROM owners WHERE owner_username = ? AND owner_password = ?", [username, password], (err, row) => {
        if (err) {
            console.log(err);
            return res.send('<script>alert("Database error"); window.location.href = "/owner-login";</script>');
        }
        if (!row) {
            return res.send('<script>alert("Invalid owner username or password"); window.location.href = "/owner-login";</script>');
        }

        // Create a session for the owner
        req.session.owner = {
            id: row.id,
            username: row.owner_username
        };

        res.redirect('/owner');
    });
});

// Route for the owner page
app.get('/owner', (req, res) => {
    if (!req.session.owner) {
        return res.redirect('/owner-login');
    }
    res.render('owner', { owner: req.session.owner });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
