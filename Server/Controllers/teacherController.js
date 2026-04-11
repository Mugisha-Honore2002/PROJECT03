const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require("../db");

// ────────────────────────── REGISTER TEACHER (by supervisor) ──────────────────────────
// ======================================================================================
const registerTeacher = async (req, res) => {
    try {
        const { full_name, email, password } = req.body;
        const { supervisor_id } = req.params;

        if (!full_name || !email || !password) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const checkSupervisor = await db.query(
            "SELECT * FROM supervisor WHERE id = $1",
            [supervisor_id]
        );

        if (checkSupervisor.rows.length === 0) {
            return res.status(404).json({ error: "Supervisor not found" });
        }

        const checkTeacher = await db.query(
            "SELECT * FROM teacher WHERE email = $1",
            [email]
        );

        if (checkTeacher.rows.length > 0) {
            return res.status(400).json({ error: "Teacher already exists" });
        }

        const password_hash = await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO teacher (supervisor_id, full_name, email, password_hash)
            VALUES ($1, $2, $3, $4)
            RETURNING id, supervisor_id, full_name, email, created_at
        `;

        const newTeacher = await db.query(sql, [supervisor_id, full_name, email, password_hash]);

        res.status(201).json(newTeacher.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message }); 
    }
};


// ────────────────────────── LOGIN TEACHER ──────────────────────────
//  ==================================================================
const loginTeacher = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Missing email or password" });
        }

        const result = await db.query(
            "SELECT * FROM teacher WHERE email = $1",
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
                teacher_id: result.rows[0].id,
                role: "teacher"
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
        );

        const teacherData = result.rows[0];
        delete teacherData.password_hash;

        res.status(200).json({
            message: "Login successful",
            token:   token,
            teacher: teacherData
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error" });
    }
};
 

// ────────────────────────── GET ALL TEACHERS ──────────────────────────
//  =====================================================================
const getAllTeachers = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT id, supervisor_id, full_name, email, created_at
             FROM teacher
             ORDER BY full_name`
        );

        res.status(200).json(result.rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ────────────────────────── GET ALL TEACHERS BY SUPERVISOR ──────────────────────────
//  ===================================================================================
const getTeachersBySupervisor = async (req, res) => {
    try {
        const { supervisor_id } = req.params;

        const checkSupervisor = await db.query(
            "SELECT * FROM supervisor WHERE id = $1",
            [supervisor_id]
        );

        if (checkSupervisor.rows.length === 0) {
            return res.status(404).json({ error: "Supervisor not found" });
        }

        const result = await db.query(
            `SELECT id, supervisor_id, full_name, email, created_at
             FROM teacher
             WHERE supervisor_id = $1
             ORDER BY full_name`,
            [supervisor_id]
        );

        res.status(200).json(result.rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ────────────────────────── GET TEACHER BY ID ──────────────────────────
//  ======================================================================
const getTeacherById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            `SELECT id, supervisor_id, full_name, email, created_at
             FROM teacher
             WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Teacher not found" });
        }

        res.status(200).json(result.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ────────────────────────── UPDATE TEACHER ──────────────────────────
//  ===================================================================
const updateTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, email } = req.body;

        if (!full_name || !email) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const checkTeacher = await db.query(
            "SELECT * FROM teacher WHERE id = $1",
            [id]
        );

        if (checkTeacher.rows.length === 0) {
            return res.status(404).json({ error: "Teacher not found" });
        }

        const sql = `
            UPDATE teacher
            SET full_name = $1, email = $2
            WHERE id = $3
            RETURNING id, supervisor_id, full_name, email, created_at
        `;

        const updated = await db.query(sql, [full_name, email, id]);

        res.status(200).json(updated.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ────────────────────────── UPDATE TEACHER PASSWORD ──────────────────────────────────
//  ====================================================================================
const updateTeacherPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { old_password, new_password } = req.body;

        if (!old_password || !new_password) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const result = await db.query(
            "SELECT * FROM teacher WHERE id = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Teacher not found" });
        }

        const isMatch = await bcrypt.compare(old_password, result.rows[0].password_hash);

        if (!isMatch) {
            return res.status(401).json({ error: "Old password is incorrect" });
        }

        const password_hash = await bcrypt.hash(new_password, 10);

        await db.query(
            "UPDATE teacher SET password_hash = $1 WHERE id = $2",
            [password_hash, id]
        );

        res.status(200).json({ message: "Password updated successfully" });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ────────────────────────── DELETE TEACHER ──────────────────────────
//  ===================================================================
const deleteTeacher = async (req, res) => {
    try {
        const { id } = req.params;

        const checkTeacher = await db.query(
            "SELECT * FROM teacher WHERE id = $1",
            [id]
        );

        if (checkTeacher.rows.length === 0) {
            return res.status(404).json({ error: "Teacher not found" });
        }

        await db.query("DELETE FROM teacher WHERE id = $1", [id]);

        res.status(200).json({ message: "Teacher deleted successfully" });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ────────────────────────── EXPORTS ──────────────────────────
//  ============================================================
module.exports = {
    registerTeacher,
    loginTeacher,
    getAllTeachers,
    getTeachersBySupervisor,
    getTeacherById,
    updateTeacher,
    updateTeacherPassword,
    deleteTeacher
};