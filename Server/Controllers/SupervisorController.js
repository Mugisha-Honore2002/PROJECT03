const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");




// ───────────────────── REGISTER SUPERVISOR ───────────────────
//  ============================================================
const registerSupervisor = async (req, res) => {
    try {
        const { full_name, email, password } = req.body;

        if (!full_name || !email || !password) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const checkSupervisor = await db.query(
            "SELECT * FROM supervisor WHERE email = $1",
            [email]
        );

        if (checkSupervisor.rows.length > 0) {
            return res.status(400).json({ error: "Supervisor already exists" });
        }

        const password_hash = await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO supervisor (full_name, email, password_hash)
            VALUES ($1, $2, $3)
            RETURNING id, full_name, email, created_at
        `;

        const newSupervisor = await db.query(sql, [full_name, email, password_hash]);

        res.status(201).json(newSupervisor.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ──────────────────── LOGIN SUPERVISOR ───────────────────────
//  ============================================================
const loginSupervisor = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Missing email or password" });
        }

        const result = await db.query(
            "SELECT * FROM supervisor WHERE email = $1",
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: "Invalid email or password" });
        }

        const validPassword = await bcrypt.compare(
            password,
            result.rows[0].password_hash
        );

        if (!validPassword) {
            return res.status(400).json({ error: "Invalid email or password" });
        }

        const token = jwt.sign(
            {
                supervisor_id: result.rows[0].id,
                role: "supervisor"
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
        );

        const supervisorData = result.rows[0];
        delete supervisorData.password_hash;

        res.status(200).json({
            message: "Login successful",
            token:      token,
            supervisor: supervisorData
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error" });
    }
};


// ──────────────────── GET ALL SUPERVISORS ────────────────────
//  ============================================================
const getAllSupervisors = async (req, res) => {
    try {
        const result = await db.query(
            "SELECT id, full_name, email, created_at FROM supervisor ORDER BY full_name"
        );

        res.status(200).json(result.rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};
 

// ──────────────────── GET SUPERVISOR BY ID ───────────────────
//  ============================================================
const getSupervisorById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            "SELECT id, full_name, email, created_at FROM supervisor WHERE id = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Supervisor not found" });
        }

        res.status(200).json(result.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ──────────────────── UPDATE SUPERVISOR ──────────────────────
//  ============================================================
const updateSupervisor = async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, email } = req.body;

        if (!full_name || !email) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const checkSupervisor = await db.query(
            "SELECT * FROM supervisor WHERE id = $1",
            [id]
        );

        if (checkSupervisor.rows.length === 0) {
            return res.status(404).json({ error: "Supervisor not found" });
        }

        const sql = `
            UPDATE supervisor
            SET full_name = $1, email = $2
            WHERE id = $3
            RETURNING id, full_name, email, created_at
        `;

        const updated = await db.query(sql, [full_name, email, id]);

        res.status(200).json(updated.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ──────────────────── UPDATE PASSWORD ────────────────────────
//  ============================================================
const updateSupervisorPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { old_password, new_password } = req.body;

        if (!old_password || !new_password) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const result = await db.query(
            "SELECT * FROM supervisor WHERE id = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Supervisor not found" });
        }

        const isMatch = await bcrypt.compare(old_password, result.rows[0].password_hash);

        if (!isMatch) {
            return res.status(401).json({ error: "Old password is incorrect" });
        }

        const password_hash = await bcrypt.hash(new_password, 10);

        await db.query(
            "UPDATE supervisor SET password_hash = $1 WHERE id = $2",
            [password_hash, id]
        );

        res.status(200).json({ message: "Password updated successfully" });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ──────────────────── DELETE SUPERVISOR ──────────────────────
//  ============================================================
const deleteSupervisor = async (req, res) => {
    try {
        const { id } = req.params;

        const checkSupervisor = await db.query(
            "SELECT * FROM supervisor WHERE id = $1",
            [id]
        );

        if (checkSupervisor.rows.length === 0) {
            return res.status(404).json({ error: "Supervisor not found" });
        }

        await db.query("DELETE FROM supervisor WHERE id = $1", [id]);

        res.status(200).json({ message: "Supervisor deleted successfully" });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ───────────────────────── EXPORTS ───────────────────────────
//  ============================================================
module.exports = {
    registerSupervisor,
    loginSupervisor,
    getAllSupervisors,
    getSupervisorById,
    updateSupervisor,
    updateSupervisorPassword,
    deleteSupervisor
};