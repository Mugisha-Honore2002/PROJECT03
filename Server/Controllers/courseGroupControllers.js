const db = require("../db");

// ─── CREATE COURSE GROUP ──────────────────────────────────────
const createCourseGroup = async (req, res) => {
    try {
        const { course_id } = req.params;
        const { group_label, capacity } = req.body;

        if (!group_label) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const checkCourse = await db.query(
            "SELECT * FROM course WHERE id = $1",
            [course_id]
        );

        if (checkCourse.rows.length === 0) {
            return res.status(404).json({ error: "Course not found" });
        }

        const checkGroup = await db.query(
            "SELECT * FROM course_group WHERE course_id = $1 AND group_label = $2",
            [course_id, group_label]
        );

        if (checkGroup.rows.length > 0) {
            return res.status(400).json({ error: "Group already exists for this course" });
        }

        const sql = `
            INSERT INTO course_group (course_id, group_label, capacity)
            VALUES ($1, $2, $3)
            RETURNING *
        `;

        const newGroup = await db.query(sql, [course_id, group_label, capacity || 50]);

        res.status(201).json(newGroup.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ─── GET ALL GROUPS FOR A COURSE ──────────────────────────────
const getGroupsByCourse = async (req, res) => {
    try {
        const { course_id } = req.params;

        const checkCourse = await db.query(
            "SELECT * FROM course WHERE id = $1",
            [course_id]
        );

        if (checkCourse.rows.length === 0) {
            return res.status(404).json({ error: "Course not found" });
        }

        const result = await db.query(
            `SELECT
                cg.id, cg.group_label, cg.capacity,
                t.id            AS teacher_id,
                t.full_name     AS teacher_name,
                COUNT(se.id)    AS enrolled_students
             FROM course_group cg
             LEFT JOIN teacher_group_assignment tga ON tga.course_group_id = cg.id
             LEFT JOIN teacher                  t   ON t.id  = tga.teacher_id
             LEFT JOIN student_enrollment       se  ON se.course_group_id  = cg.id
             WHERE cg.course_id = $1
             GROUP BY cg.id, cg.group_label, cg.capacity, t.id, t.full_name
             ORDER BY cg.group_label`,
            [course_id]
        );

        res.status(200).json(result.rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ─── GET COURSE GROUP BY ID ───────────────────────────────────
const getCourseGroupById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            `SELECT
                cg.id, cg.group_label, cg.capacity,
                c.id            AS course_id,
                c.code          AS course_code,
                c.name          AS course_name,
                t.id            AS teacher_id,
                t.full_name     AS teacher_name,
                COUNT(se.id)    AS enrolled_students
             FROM course_group cg
             LEFT JOIN course                   c   ON c.id  = cg.course_id
             LEFT JOIN teacher_group_assignment tga ON tga.course_group_id = cg.id
             LEFT JOIN teacher                  t   ON t.id  = tga.teacher_id
             LEFT JOIN student_enrollment       se  ON se.course_group_id  = cg.id
             WHERE cg.id = $1
             GROUP BY cg.id, cg.group_label, cg.capacity, c.id, c.code, c.name, t.id, t.full_name`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Course group not found" });
        }

        res.status(200).json(result.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ─── UPDATE COURSE GROUP ──────────────────────────────────────
const updateCourseGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const { group_label, capacity } = req.body;

        if (!group_label) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const checkGroup = await db.query(
            "SELECT * FROM course_group WHERE id = $1",
            [id]
        );

        if (checkGroup.rows.length === 0) {
            return res.status(404).json({ error: "Course group not found" });
        }

        // check if new label is already taken by another group in the same course
        const checkDuplicate = await db.query(
            "SELECT * FROM course_group WHERE course_id = $1 AND group_label = $2 AND id != $3",
            [checkGroup.rows[0].course_id, group_label, id]
        );

        if (checkDuplicate.rows.length > 0) {
            return res.status(400).json({ error: "Group label already exists for this course" });
        }

        const sql = `
            UPDATE course_group
            SET group_label = $1, capacity = $2
            WHERE id = $3
            RETURNING *
        `;

        const updated = await db.query(sql, [group_label, capacity || 50, id]);

        res.status(200).json(updated.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ─── DELETE COURSE GROUP ──────────────────────────────────────
const deleteCourseGroup = async (req, res) => {
    try {
        const { id } = req.params;

        const checkGroup = await db.query(
            "SELECT * FROM course_group WHERE id = $1",
            [id]
        );

        if (checkGroup.rows.length === 0) {
            return res.status(404).json({ error: "Course group not found" });
        }

        await db.query("DELETE FROM course_group WHERE id = $1", [id]);

        res.status(200).json({ message: "Course group deleted successfully" });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ───────────────────────── EXPORTS ───────────────────────────
//  ============================================================
module.exports = {
    createCourseGroup,
    getGroupsByCourse,
    getCourseGroupById,
    updateCourseGroup,
    deleteCourseGroup
};