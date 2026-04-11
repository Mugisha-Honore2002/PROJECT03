const db = require("../db");

// ─── CREATE COURSE (by supervisor) ───────────────────────────
const createCourse = async (req, res) => {
    try {
        const { supervisor_id } = req.params;
        const { code, name, description } = req.body;

        if (!code || !name) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const checkSupervisor = await db.query(
            "SELECT * FROM supervisor WHERE id = $1",
            [supervisor_id]
        );

        if (checkSupervisor.rows.length === 0) {
            return res.status(404).json({ error: "Supervisor not found" });
        }

        const checkCourse = await db.query(
            "SELECT * FROM course WHERE code = $1",
            [code]
        );

        if (checkCourse.rows.length > 0) {
            return res.status(400).json({ error: "Course code already exists" });
        }

        const sql = `
            INSERT INTO course (supervisor_id, code, name, description)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;

        const newCourse = await db.query(sql, [supervisor_id, code, name, description]);

        res.status(201).json(newCourse.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ─── GET ALL COURSES ──────────────────────────────────────────
const getAllCourses = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT
                c.id, c.code, c.name, c.description, c.created_at,
                s.full_name AS supervisor_name
             FROM course c
             LEFT JOIN supervisor s ON s.id = c.supervisor_id
             ORDER BY c.name`
        );

        res.status(200).json(result.rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ─── GET ALL COURSES BY SUPERVISOR ───────────────────────────
const getCoursesBySupervisor = async (req, res) => {
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
            `SELECT id, code, name, description, created_at
             FROM course
             WHERE supervisor_id = $1
             ORDER BY name`,
            [supervisor_id]
        );

        res.status(200).json(result.rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ─── GET COURSE BY ID ─────────────────────────────────────────
const getCourseById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            `SELECT
                c.id, c.code, c.name, c.description, c.created_at,
                s.full_name AS supervisor_name
             FROM course c
             LEFT JOIN supervisor s ON s.id = c.supervisor_id
             WHERE c.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Course not found" });
        }

        res.status(200).json(result.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ─── GET COURSE WITH ALL ITS GROUPS ──────────────────────────
const getCourseWithGroups = async (req, res) => {
    try {
        const { id } = req.params;

        const checkCourse = await db.query(
            "SELECT * FROM course WHERE id = $1",
            [id]
        );

        if (checkCourse.rows.length === 0) {
            return res.status(404).json({ error: "Course not found" });
        }

        const result = await db.query(
            `SELECT
                c.id, c.code, c.name, c.description,
                cg.id           AS group_id,
                cg.group_label,
                cg.capacity,
                t.id            AS teacher_id,
                t.full_name     AS teacher_name
             FROM course c
             LEFT JOIN course_group               cg  ON cg.course_id       = c.id
             LEFT JOIN teacher_group_assignment   tga ON tga.course_group_id = cg.id
             LEFT JOIN teacher                    t   ON t.id                = tga.teacher_id
             WHERE c.id = $1
             ORDER BY cg.group_label`,
            [id]
        );

        res.status(200).json(result.rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ─── UPDATE COURSE ────────────────────────────────────────────
const updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, description } = req.body;

        if (!code || !name) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const checkCourse = await db.query(
            "SELECT * FROM course WHERE id = $1",
            [id]
        );

        if (checkCourse.rows.length === 0) {
            return res.status(404).json({ error: "Course not found" });
        }

        // check if new code is already taken by another course
        const checkCode = await db.query(
            "SELECT * FROM course WHERE code = $1 AND id != $2",
            [code, id]
        );

        if (checkCode.rows.length > 0) {
            return res.status(400).json({ error: "Course code already taken" });
        }

        const sql = `
            UPDATE course
            SET code = $1, name = $2, description = $3
            WHERE id = $4
            RETURNING *
        `;

        const updated = await db.query(sql, [code, name, description, id]);

        res.status(200).json(updated.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ─── DELETE COURSE ────────────────────────────────────────────
const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;

        const checkCourse = await db.query(
            "SELECT * FROM course WHERE id = $1",
            [id]
        );

        if (checkCourse.rows.length === 0) {
            return res.status(404).json({ error: "Course not found" });
        }

        await db.query("DELETE FROM course WHERE id = $1", [id]);

        res.status(200).json({ message: "Course deleted successfully" });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ───────────────────────── EXPORTS ───────────────────────────
//  ============================================================
module.exports = {
    createCourse,
    getAllCourses,
    getCoursesBySupervisor,
    getCourseById,
    getCourseWithGroups,
    updateCourse,
    deleteCourse
};