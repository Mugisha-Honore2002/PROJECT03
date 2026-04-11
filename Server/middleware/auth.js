// ============================================================
// middleware/auth.js
// ============================================================
const jwt  = require('jsonwebtoken');
const db   = require('../db');

// ─── VERIFY TOKEN ─────────────────────────────────────────────
const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];

        if (!authHeader) {
            return res.status(401).json({ error: "No token provided" });
        }

        const token = authHeader.split(' ')[1]; // Bearer <token>

        if (!token) {
            return res.status(401).json({ error: "Invalid token format" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();

    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: "Token has expired, please login again" });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: "Invalid token" });
        }
        return res.status(500).json({ error: "Server Error" });
    }
};


// ─── ROLE MIDDLEWARES ─────────────────────────────────────────

const isSupervisor = async (req, res, next) => {
    try {
        if (!req.user.supervisor_id) {
            return res.status(403).json({ error: "Access denied. Supervisors only." });
        }

        // verify supervisor still exists in db
        const result = await db.query(
            "SELECT id FROM supervisor WHERE id = $1",
            [req.user.supervisor_id]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({ error: "Supervisor no longer exists" });
        }

        next();

    } catch (err) {
        return res.status(500).json({ error: "Server Error" });
    }
};


const isTeacher = async (req, res, next) => {
    try {
        if (!req.user.teacher_id) {
            return res.status(403).json({ error: "Access denied. Teachers only." });
        }

        // verify teacher still exists in db
        const result = await db.query(
            "SELECT id FROM teacher WHERE id = $1",
            [req.user.teacher_id]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({ error: "Teacher no longer exists" });
        }

        next();

    } catch (err) {
        return res.status(500).json({ error: "Server Error" });
    }
};


const isStudent = async (req, res, next) => {
    try {
        if (!req.user.student_id) {
            return res.status(403).json({ error: "Access denied. Students only." });
        }

        // verify student still exists in db
        const result = await db.query(
            "SELECT id FROM student WHERE id = $1",
            [req.user.student_id]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({ error: "Student no longer exists" });
        }

        next();

    } catch (err) {
        return res.status(500).json({ error: "Server Error" });
    }
};


const isSupervisorOrTeacher = async (req, res, next) => {
    try {
        if (!req.user.supervisor_id && !req.user.teacher_id) {
            return res.status(403).json({ error: "Access denied. Supervisors or Teachers only." });
        }

        // verify whoever is making the request still exists in db
        if (req.user.supervisor_id) {
            const result = await db.query(
                "SELECT id FROM supervisor WHERE id = $1",
                [req.user.supervisor_id]
            );
            if (result.rows.length === 0) {
                return res.status(403).json({ error: "Supervisor no longer exists" });
            }
        }

        if (req.user.teacher_id) {
            const result = await db.query(
                "SELECT id FROM teacher WHERE id = $1",
                [req.user.teacher_id]
            );
            if (result.rows.length === 0) {
                return res.status(403).json({ error: "Teacher no longer exists" });
            }
        }

        next();

    } catch (err) {
        return res.status(500).json({ error: "Server Error" });
    }
};


// ───────────────────────── EXPORTS ───────────────────────────
// =============================================================
module.exports = {
    verifyToken,
    isSupervisor,
    isTeacher,
    isStudent,
    isSupervisorOrTeacher
};