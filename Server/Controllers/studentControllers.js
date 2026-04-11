const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db = require('../db');

// ─── REGISTER STUDENT ─────────────────────────────────────────
const registerStudent = async (req, res) => {
    try {
        const { full_name, email, password } = req.body;

        if (!full_name || !email || !password) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const checkStudent = await db.query(
            "SELECT * FROM student WHERE email = $1",
            [email]
        );

        if (checkStudent.rows.length > 0) {
            return res.status(400).json({ error: "Student already exists" });
        }

        const password_hash = await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO student (full_name, email, password_hash)
            VALUES ($1, $2, $3)
            RETURNING id, full_name, email, created_at
        `;

        const newStudent = await db.query(sql, [full_name, email, password_hash]);

        res.status(201).json(newStudent.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ─── LOGIN STUDENT ────────────────────────────────────────────
const loginStudent = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Missing email or password" });
        }

        const result = await db.query(
            "SELECT * FROM student WHERE email = $1",
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
                student_id: result.rows[0].id,
                role: "student"
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
        );

        const studentData = result.rows[0];
        delete studentData.password_hash;

        res.status(200).json({
            message: "Login successful",
            token:   token,
            student: studentData
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error" });
    }
};


// ─── GET ALL STUDENTS ─────────────────────────────────────────
const getAllStudents = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT id, full_name, email, created_at
             FROM student
             ORDER BY full_name`
        );

        res.status(200).json(result.rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ─── GET STUDENT BY ID ────────────────────────────────────────
const getStudentById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            `SELECT id, full_name, email, created_at
             FROM student
             WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Student not found" });
        }

        res.status(200).json(result.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ─── GET STUDENT WITH ALL ENROLLMENTS ────────────────────────
const getStudentEnrollments = async (req, res) => {
    try {
        const { id } = req.params;

        const checkStudent = await db.query(
            "SELECT * FROM student WHERE id = $1",
            [id]
        );

        if (checkStudent.rows.length === 0) {
            return res.status(404).json({ error: "Student not found" });
        }

        const result = await db.query(
            `SELECT
                se.id               AS enrollment_id,
                se.enrolled_at,
                c.id                AS course_id,
                c.code              AS course_code,
                c.name              AS course_name,
                cg.id               AS group_id,
                cg.group_label,
                t.full_name         AS teacher_name,
                m.quiz1,
                m.quiz2,
                m.group_work,
                m.continuous_assessment,
                m.midsem,
                m.exam,
                m.total
             FROM student_enrollment se
             JOIN course_group              cg  ON cg.id  = se.course_group_id
             JOIN course                    c   ON c.id   = cg.course_id
             LEFT JOIN teacher_group_assignment tga ON tga.course_group_id = cg.id
             LEFT JOIN teacher              t   ON t.id   = tga.teacher_id
             LEFT JOIN marks               m   ON m.enrollment_id = se.id
             WHERE se.student_id = $1
             ORDER BY c.name, cg.group_label`,
            [id]
        );

        res.status(200).json(result.rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ─── UPDATE STUDENT ───────────────────────────────────────────
const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, email } = req.body;

        if (!full_name || !email) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const checkStudent = await db.query(
            "SELECT * FROM student WHERE id = $1",
            [id]
        );

        if (checkStudent.rows.length === 0) {
            return res.status(404).json({ error: "Student not found" });
        }

        const sql = `
            UPDATE student
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


// ─── UPDATE STUDENT PASSWORD ──────────────────────────────────
const updateStudentPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { old_password, new_password } = req.body;

        if (!old_password || !new_password) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const result = await db.query(
            "SELECT * FROM student WHERE id = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Student not found" });
        }

        const isMatch = await bcrypt.compare(old_password, result.rows[0].password_hash);

        if (!isMatch) {
            return res.status(401).json({ error: "Old password is incorrect" });
        }

        const password_hash = await bcrypt.hash(new_password, 10);

        await db.query(
            "UPDATE student SET password_hash = $1 WHERE id = $2",
            [password_hash, id]
        );

        res.status(200).json({ message: "Password updated successfully" });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ─── DELETE STUDENT ───────────────────────────────────────────
const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;

        const checkStudent = await db.query(
            "SELECT * FROM student WHERE id = $1",
            [id]
        );

        if (checkStudent.rows.length === 0) {
            return res.status(404).json({ error: "Student not found" });
        }

        await db.query("DELETE FROM student WHERE id = $1", [id]);

        res.status(200).json({ message: "Student deleted successfully" });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ───────────────────────── EXPORTS ───────────────────────────
//  ============================================================
module.exports = {
    registerStudent,
    loginStudent,
    getAllStudents,
    getStudentById,
    getStudentEnrollments,
    updateStudent,
    updateStudentPassword,
    deleteStudent
};