// const db = require("../db");

// // ── TEACHER: claim an available (unassigned) group ────────────
// const claimGroup = async (req, res) => {
//     try {
//         const { teacher_id, course_group_id } = req.params;

//         // check group exists
//         const grp = await db.query("SELECT * FROM course_group WHERE id = $1", [course_group_id]);
//         if (grp.rows.length === 0) return res.status(404).json({ error: "Course group not found" });

//         // check not already assigned
//         const existing = await db.query(
//             "SELECT * FROM teacher_group_assignment WHERE course_group_id = $1",
//             [course_group_id]
//         );
//         if (existing.rows.length > 0) return res.status(400).json({ error: "Group already taken by another teacher" });

//         const result = await db.query(
//             `INSERT INTO teacher_group_assignment (teacher_id, course_group_id)
//              VALUES ($1, $2) RETURNING *`,
//             [teacher_id, course_group_id]
//         );

//         res.status(201).json(result.rows[0]);
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).json({ error: "Server Error", details: err.message });
//     }
// };

// // ── TEACHER: release a group they own ─────────────────────────
// const releaseGroup = async (req, res) => {
//     try {
//         const { teacher_id, course_group_id } = req.params;

//         const existing = await db.query(
//             "SELECT * FROM teacher_group_assignment WHERE teacher_id = $1 AND course_group_id = $2",
//             [teacher_id, course_group_id]
//         );
//         if (existing.rows.length === 0) return res.status(404).json({ error: "Assignment not found" });

//         await db.query(
//             "DELETE FROM teacher_group_assignment WHERE teacher_id = $1 AND course_group_id = $2",
//             [teacher_id, course_group_id]
//         );

//         res.status(200).json({ message: "Group released successfully" });
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).json({ error: "Server Error", details: err.message });
//     }
// };

// // ── GET all groups available (not yet assigned) for a course ──
// const getAvailableGroupsByCourse = async (req, res) => {
//     try {
//         const { course_id } = req.params;

//         const result = await db.query(
//             `SELECT cg.id, cg.group_label, cg.capacity,
//                     COUNT(se.id) AS enrolled_students
//              FROM course_group cg
//              LEFT JOIN student_enrollment se ON se.course_group_id = cg.id
//              WHERE cg.course_id = $1
//                AND cg.id NOT IN (SELECT course_group_id FROM teacher_group_assignment)
//              GROUP BY cg.id, cg.group_label, cg.capacity
//              ORDER BY cg.group_label`,
//             [course_id]
//         );

//         res.status(200).json(result.rows);
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).json({ error: "Server Error", details: err.message });
//     }
// };

// // ── GET all groups assigned to a specific teacher ─────────────
// const getGroupsByTeacher = async (req, res) => {
//     try {
//         const { teacher_id } = req.params;

//         const result = await db.query(
//             `SELECT
//                 cg.id, cg.group_label, cg.capacity,
//                 c.id   AS course_id,
//                 c.code AS course_code,
//                 c.name AS course_name,
//                 COUNT(se.id) AS enrolled_students
//              FROM teacher_group_assignment tga
//              JOIN course_group cg ON cg.id = tga.course_group_id
//              JOIN course       c  ON c.id  = cg.course_id
//              LEFT JOIN student_enrollment se ON se.course_group_id = cg.id
//              WHERE tga.teacher_id = $1
//              GROUP BY cg.id, cg.group_label, cg.capacity, c.id, c.code, c.name
//              ORDER BY c.name, cg.group_label`,
//             [teacher_id]
//         );

//         res.status(200).json(result.rows);
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).json({ error: "Server Error", details: err.message });
//     }
// };

// // ── SUPERVISOR: assign a teacher to a group manually ──────────
// const assignTeacherToGroup = async (req, res) => {
//     try {
//         const { teacher_id, course_group_id } = req.params;

//         const grp = await db.query("SELECT * FROM course_group WHERE id = $1", [course_group_id]);
//         if (grp.rows.length === 0) return res.status(404).json({ error: "Course group not found" });

//         // remove old assignment if any, then insert new
//         await db.query("DELETE FROM teacher_group_assignment WHERE course_group_id = $1", [course_group_id]);
//         const result = await db.query(
//             `INSERT INTO teacher_group_assignment (teacher_id, course_group_id)
//              VALUES ($1, $2) RETURNING *`,
//             [teacher_id, course_group_id]
//         );

//         res.status(201).json(result.rows[0]);
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).json({ error: "Server Error", details: err.message });
//     }
// };

// // ── SUPERVISOR: unassign a teacher from a group ───────────────
// const unassignTeacherFromGroup = async (req, res) => {
//     try {
//         const { course_group_id } = req.params;

//         await db.query("DELETE FROM teacher_group_assignment WHERE course_group_id = $1", [course_group_id]);

//         res.status(200).json({ message: "Teacher unassigned from group" });
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).json({ error: "Server Error", details: err.message });
//     }
// };

// // ── GET all groups with assignment status (for supervisor) ────
// const getAllGroupsWithAssignment = async (req, res) => {
//     try {
//         const result = await db.query(
//             `SELECT
//                 cg.id, cg.group_label, cg.capacity,
//                 c.id   AS course_id,
//                 c.code AS course_code,
//                 c.name AS course_name,
//                 t.id   AS teacher_id,
//                 t.full_name AS teacher_name,
//                 COUNT(se.id) AS enrolled_students
//              FROM course_group cg
//              JOIN course c ON c.id = cg.course_id
//              LEFT JOIN teacher_group_assignment tga ON tga.course_group_id = cg.id
//              LEFT JOIN teacher t ON t.id = tga.teacher_id
//              LEFT JOIN student_enrollment se ON se.course_group_id = cg.id
//              GROUP BY cg.id, cg.group_label, cg.capacity, c.id, c.code, c.name, t.id, t.full_name
//              ORDER BY c.name, cg.group_label`
//         );

//         res.status(200).json(result.rows);
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).json({ error: "Server Error", details: err.message });
//     }
// };

// // ── GET all available groups for student enrollment ───────────
// // Groups that have a teacher AND are not full
// const getAvailableGroupsForStudent = async (req, res) => {
//     try {
//         const result = await db.query(
//             `SELECT
//                 cg.id, cg.group_label, cg.capacity,
//                 c.id   AS course_id,
//                 c.code AS course_code,
//                 c.name AS course_name,
//                 t.full_name AS teacher_name,
//                 COUNT(se.id) AS enrolled_students
//              FROM course_group cg
//              JOIN course c ON c.id = cg.course_id
//              JOIN teacher_group_assignment tga ON tga.course_group_id = cg.id
//              JOIN teacher t ON t.id = tga.teacher_id
//              LEFT JOIN student_enrollment se ON se.course_group_id = cg.id
//              GROUP BY cg.id, cg.group_label, cg.capacity, c.id, c.code, c.name, t.full_name
//              HAVING COUNT(se.id) < cg.capacity
//              ORDER BY c.name, cg.group_label`
//         );

//         res.status(200).json(result.rows);
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).json({ error: "Server Error", details: err.message });
//     }
// };

// module.exports = {
//     claimGroup,
//     releaseGroup,
//     getAvailableGroupsByCourse,
//     getGroupsByTeacher,
//     assignTeacherToGroup,
//     unassignTeacherFromGroup,
//     getAllGroupsWithAssignment,
//     getAvailableGroupsForStudent,
// };
const db = require("../db");

// ── TEACHER: claim an available group ─────────────────────────
// POST /api/assignment/claim/:course_group_id
// teacher_id comes from the JWT token, NOT from the URL
const claimGroup = async (req, res) => {
    try {
        const { course_group_id } = req.params;
        const teacher_id = req.user.teacher_id;   // ← from JWT

        const grp = await db.query("SELECT * FROM course_group WHERE id = $1", [course_group_id]);
        if (grp.rows.length === 0)
            return res.status(404).json({ error: "Course group not found" });

        const existing = await db.query(
            "SELECT * FROM teacher_group_assignment WHERE course_group_id = $1",
            [course_group_id]
        );
        if (existing.rows.length > 0)
            return res.status(400).json({ error: "Group already taken by another teacher" });

        const result = await db.query(
            `INSERT INTO teacher_group_assignment (teacher_id, course_group_id)
             VALUES ($1, $2) RETURNING *`,
            [teacher_id, course_group_id]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};

// ── TEACHER: release a group they own ─────────────────────────
// DELETE /api/assignment/release/:course_group_id
const releaseGroup = async (req, res) => {
    try {
        const { course_group_id } = req.params;
        const teacher_id = req.user.teacher_id;   // ← from JWT

        const existing = await db.query(
            "SELECT * FROM teacher_group_assignment WHERE teacher_id = $1 AND course_group_id = $2",
            [teacher_id, course_group_id]
        );
        if (existing.rows.length === 0)
            return res.status(404).json({ error: "Assignment not found or not yours" });

        await db.query(
            "DELETE FROM teacher_group_assignment WHERE teacher_id = $1 AND course_group_id = $2",
            [teacher_id, course_group_id]
        );

        res.status(200).json({ message: "Group released successfully" });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};

// ── GET all available groups (no teacher assigned) ────────────
// GET /api/assignment/available
const getAvailableGroups = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT
                cg.id, cg.group_label, cg.capacity,
                c.id   AS course_id,
                c.code AS course_code,
                c.name AS course_name,
                COUNT(se.id) AS enrolled_students
             FROM course_group cg
             JOIN course c ON c.id = cg.course_id
             LEFT JOIN student_enrollment se ON se.course_group_id = cg.id
             WHERE cg.id NOT IN (SELECT course_group_id FROM teacher_group_assignment)
             GROUP BY cg.id, cg.group_label, cg.capacity, c.id, c.code, c.name
             ORDER BY c.name, cg.group_label`
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};

// ── GET groups assigned to the logged-in teacher ──────────────
// GET /api/assignment/my-groups
const getMyGroups = async (req, res) => {
    try {
        const teacher_id = req.user.teacher_id;   // ← from JWT

        const result = await db.query(
            `SELECT
                cg.id, cg.group_label, cg.capacity,
                c.id   AS course_id,
                c.code AS course_code,
                c.name AS course_name,
                COUNT(se.id) AS enrolled_students
             FROM teacher_group_assignment tga
             JOIN course_group cg ON cg.id = tga.course_group_id
             JOIN course       c  ON c.id  = cg.course_id
             LEFT JOIN student_enrollment se ON se.course_group_id = cg.id
             WHERE tga.teacher_id = $1
             GROUP BY cg.id, cg.group_label, cg.capacity, c.id, c.code, c.name
             ORDER BY c.name, cg.group_label`,
            [teacher_id]
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};

// ── SUPERVISOR: manually assign a teacher to a group ──────────
// POST /api/assignment/assign  body: { teacher_id, course_group_id }
const assignTeacherToGroup = async (req, res) => {
    try {
        const { teacher_id, course_group_id } = req.body;

        if (!teacher_id || !course_group_id)
            return res.status(400).json({ error: "Missing teacher_id or course_group_id" });

        const grp = await db.query("SELECT * FROM course_group WHERE id = $1", [course_group_id]);
        if (grp.rows.length === 0)
            return res.status(404).json({ error: "Course group not found" });

        // replace any existing assignment
        await db.query("DELETE FROM teacher_group_assignment WHERE course_group_id = $1", [course_group_id]);

        const result = await db.query(
            `INSERT INTO teacher_group_assignment (teacher_id, course_group_id)
             VALUES ($1, $2) RETURNING *`,
            [teacher_id, course_group_id]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};

// ── SUPERVISOR: remove teacher from a group ───────────────────
// DELETE /api/assignment/unassign/:course_group_id
const unassignTeacherFromGroup = async (req, res) => {
    try {
        const { course_group_id } = req.params;
        await db.query("DELETE FROM teacher_group_assignment WHERE course_group_id = $1", [course_group_id]);
        res.status(200).json({ message: "Teacher unassigned from group" });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};

// ── SUPERVISOR: all groups with assignment status ─────────────
// GET /api/assignment/all
const getAllGroupsWithAssignment = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT
                cg.id, cg.group_label, cg.capacity,
                c.id   AS course_id,
                c.code AS course_code,
                c.name AS course_name,
                t.id   AS teacher_id,
                t.full_name AS teacher_name,
                COUNT(se.id) AS enrolled_students
             FROM course_group cg
             JOIN course c ON c.id = cg.course_id
             LEFT JOIN teacher_group_assignment tga ON tga.course_group_id = cg.id
             LEFT JOIN teacher t ON t.id = tga.teacher_id
             LEFT JOIN student_enrollment se ON se.course_group_id = cg.id
             GROUP BY cg.id, cg.group_label, cg.capacity, c.id, c.code, c.name, t.id, t.full_name
             ORDER BY c.name, cg.group_label`
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};

// ── STUDENT: groups with a teacher that still have space ──────
// GET /api/assignment/open-groups
const getAvailableGroupsForStudent = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT
                cg.id, cg.group_label, cg.capacity,
                c.id   AS course_id,
                c.code AS course_code,
                c.name AS course_name,
                c.description AS course_description,
                t.full_name AS teacher_name,
                COUNT(se.id) AS enrolled_students
             FROM course_group cg
             JOIN course c ON c.id = cg.course_id
             JOIN teacher_group_assignment tga ON tga.course_group_id = cg.id
             JOIN teacher t ON t.id = tga.teacher_id
             LEFT JOIN student_enrollment se ON se.course_group_id = cg.id
             GROUP BY cg.id, cg.group_label, cg.capacity, c.id, c.code, c.name, c.description, t.full_name
             HAVING COUNT(se.id) < cg.capacity
             ORDER BY c.name, cg.group_label`
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};

// kept for backward compat if anything uses the old param-based routes
const getAvailableGroupsByCourse = async (req, res) => {
    try {
        const { course_id } = req.params;
        const result = await db.query(
            `SELECT cg.id, cg.group_label, cg.capacity, COUNT(se.id) AS enrolled_students
             FROM course_group cg
             LEFT JOIN student_enrollment se ON se.course_group_id = cg.id
             WHERE cg.course_id = $1
               AND cg.id NOT IN (SELECT course_group_id FROM teacher_group_assignment)
             GROUP BY cg.id, cg.group_label, cg.capacity
             ORDER BY cg.group_label`,
            [course_id]
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};

const getGroupsByTeacher = async (req, res) => {
    try {
        const { teacher_id } = req.params;
        const result = await db.query(
            `SELECT cg.id, cg.group_label, cg.capacity,
                    c.id AS course_id, c.code AS course_code, c.name AS course_name,
                    COUNT(se.id) AS enrolled_students
             FROM teacher_group_assignment tga
             JOIN course_group cg ON cg.id = tga.course_group_id
             JOIN course       c  ON c.id  = cg.course_id
             LEFT JOIN student_enrollment se ON se.course_group_id = cg.id
             WHERE tga.teacher_id = $1
             GROUP BY cg.id, cg.group_label, cg.capacity, c.id, c.code, c.name
             ORDER BY c.name, cg.group_label`,
            [teacher_id]
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};

module.exports = {
    claimGroup,
    releaseGroup,
    getAvailableGroups,
    getMyGroups,
    getAvailableGroupsByCourse,
    getGroupsByTeacher,
    assignTeacherToGroup,
    unassignTeacherFromGroup,
    getAllGroupsWithAssignment,
    getAvailableGroupsForStudent,
};