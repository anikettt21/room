const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcrypt");

// Check if admin password exists
router.get("/check-password", (req, res) => {
    db.query("SELECT password FROM admin LIMIT 1", (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (result.length > 0) {
            res.json({ exists: true });
        } else {
            res.json({ exists: false });
        }
    });
});

// Set admin password (hash before saving)
router.post("/set-password", async (req, res) => {
    const { password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if a password exists
    db.query("SELECT * FROM admin", (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });

        if (result.length > 0) {
            // Update existing password
            db.query("UPDATE admin SET password = ? WHERE id = 1", [hashedPassword], (err) => {
                if (err) return res.status(500).json({ error: "Failed to update password" });
                res.json({ success: true, message: "Password updated successfully" });
            });
        } else {
            // Insert new password
            db.query("INSERT INTO admin (password) VALUES (?)", [hashedPassword], (err) => {
                if (err) return res.status(500).json({ error: "Failed to set password" });
                res.json({ success: true, message: "Password set successfully" });
            });
        }
    });
});

// Verify admin password
router.post("/verify-password", (req, res) => {
    const { password } = req.body;

    db.query("SELECT password FROM admin LIMIT 1", async (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });

        if (result.length === 0) return res.status(401).json({ error: "No password set" });

        const match = await bcrypt.compare(password, result[0].password);
        if (match) {
            res.json({ success: true, message: "Access granted" });
        } else {
            res.status(401).json({ error: "Incorrect password" });
        }
    });
});

module.exports = router;
