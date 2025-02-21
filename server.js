const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();
app.use(cors());
app.use(express.json());

// MySQL Database Connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "878819",
  database: "study_room"
});

db.connect(err => {
  if (err) {
    console.error("MySQL connection error:", err);
    return;
  }
  console.log("MySQL Connected");
});

/* ---------- Admin Endpoints ---------- */

// Endpoint to check if an admin password is set
app.get("/admin/check", (req, res) => {
  const query = "SELECT password_hash FROM admin LIMIT 1";
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0 || !results[0].password_hash) {
      return res.json({ passwordSet: false });
    }
    return res.json({ passwordSet: true });
  });
});

// Endpoint to set or update the admin password
app.post("/admin/set-password", async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: "Password is required." });
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const checkQuery = "SELECT * FROM admin LIMIT 1";
    db.query(checkQuery, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0) {
        const insertQuery = "INSERT INTO admin (password_hash) VALUES (?)";
        db.query(insertQuery, [hashedPassword], (err) => {
          if (err) return res.status(500).json({ error: err.message });
          return res.json({ message: "Password set successfully." });
        });
      } else {
        const updateQuery = "UPDATE admin SET password_hash = ? WHERE id = ?";
        db.query(updateQuery, [hashedPassword, results[0].id], (err) => {
          if (err) return res.status(500).json({ error: err.message });
          return res.json({ message: "Password updated successfully." });
        });
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Endpoint to verify admin login
app.post("/admin/login", (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: "Password is required." });
  const query = "SELECT password_hash FROM admin LIMIT 1";
  db.query(query, async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0 || !results[0].password_hash) {
      return res.status(400).json({ error: "No password set. Set a password first." });
    }
    const storedHash = results[0].password_hash;
    const match = await bcrypt.compare(password, storedHash);
    if (match) {
      return res.json({ success: true });
    } else {
      return res.status(401).json({ error: "Incorrect password." });
    }
  });
});

/* ---------- Student and Seat Endpoints ---------- */

// API to Register Student
app.post('/register', (req, res) => {
    const { name, surname, email, phone, hall, seat_number, seat_type, payment_method, remaining_fees, fees_amount, registration_date } = req.body;
    const checkQuery = `
        SELECT * FROM students 
        WHERE hall = ? AND seat_number = ? 
        AND MONTH(registration_date) = MONTH(?) 
        AND YEAR(registration_date) = YEAR(?)
    `;
    db.query(checkQuery, [hall, seat_number, registration_date, registration_date], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length > 0) {
            return res.status(400).json({ message: 'Student is already registered for this seat in this hall this month!' });
        } else {
            const insertQuery = `
                INSERT INTO students (name, surname, email, phone, hall, seat_number, seat_type, payment_method, remaining_fees, fees_amount, registration_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            db.query(insertQuery, [name, surname, email, phone, hall, seat_number, seat_type, payment_method, remaining_fees, fees_amount, registration_date], (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Student registered successfully', id: result.insertId });
            });
        }
    });
});

// API to Fetch All Students
app.get('/students', (req, res) => {
    const query = 'SELECT * FROM students';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// API to Fetch a Single Student by ID
app.get('/students/:id', (req, res) => {
    const query = 'SELECT * FROM students WHERE id = ?';
    db.query(query, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results[0]);
    });
});

// API to Edit Student
app.put('/students/:id', (req, res) => {
    const { name, surname, email, phone, hall, seat_number, seat_type, payment_method, remaining_fees, fees_amount, registration_date } = req.body;
    const query = `
        UPDATE students 
        SET name = ?, surname = ?, email = ?, phone = ?, hall = ?, seat_number = ?, seat_type = ?, payment_method = ?, remaining_fees = ?, fees_amount = ?, registration_date = ?
        WHERE id = ?
    `;
    db.query(query, [name, surname, email, phone, hall, seat_number, seat_type, payment_method, remaining_fees, fees_amount, registration_date, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Student updated successfully' });
    });
});

// API to Delete Student
app.delete('/students/:id', (req, res) => {
    const query = 'DELETE FROM students WHERE id = ?';
    db.query(query, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Student deleted successfully' });
    });
});

// API to Fetch Seats for a Hall (with optional month filtering)
app.get('/seats/:hall', (req, res) => {
    const hall = req.params.hall;
    let query = 'SELECT seat_number, registration_date FROM students WHERE hall = ?';
    const params = [hall];
    if (req.query.month) {
        query += ' AND MONTHNAME(registration_date) = ?';
        params.push(req.query.month);
    }
    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
