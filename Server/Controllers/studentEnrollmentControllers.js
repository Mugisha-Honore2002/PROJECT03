const db = require('../db');

// ─── ENROLL STUDENT IN A COURSE GROUP ────────────────────────
const enrollStudent = async (req, res) => {
    try {
        const { student_id, course_group_id } = req.params;

        const checkStudent = await db.query(
            "SELECT * FROM student WHERE id = $1",
            [student_id]
        );

        if (checkStudent.rows.length === 0) {
            return res.status(404).json({ error: "Student not found" });
        }

        const checkGroup = await db.query(
            "SELECT * FROM course_group WHERE id = $1",
            [course_group_id]
        );

        if (checkGroup.rows.length === 0) {
            return res.status(404).json({ error: "Course group not found" });
        }

        // check if student is already enrolled in this group
        const checkEnrollment = await db.query(
            "SELECT * FROM student_enrollment WHERE student_id = $1 AND course_group_id = $2",
            [student_id, course_group_id]
        );

        if (checkEnrollment.rows.length > 0) {
            return res.status(400).json({ error: "Student already enrolled in this group" });
        }

        // check if group is full
        const capacityCheck = await db.query(
            `SELECT cg.capacity, COUNT(se.id) AS enrolled
             FROM course_group cg
             LEFT JOIN student_enrollment se ON se.course_group_id = cg.id
             WHERE cg.id = $1
             GROUP BY cg.capacity`,
            [course_group_id]
        );

        const { capacity, enrolled } = capacityCheck.rows[0];
        if (parseInt(enrolled) >= parseInt(capacity)) {
            return res.status(400).json({ error: "Course group is full" });
        }

        const sql = `
            INSERT INTO student_enrollment (student_id, course_group_id)
            VALUES ($1, $2)
            RETURNING *
        `;

        const newEnrollment = await db.query(sql, [student_id, course_group_id]);

        // initialize empty marks row for this enrollment
        await db.query(
            `INSERT INTO marks (enrollment_id)
             VALUES ($1)
             ON CONFLICT (enrollment_id) DO NOTHING`,
            [newEnrollment.rows[0].id]
        );

        res.status(201).json(newEnrollment.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ─── UNENROLL STUDENT FROM A COURSE GROUP ────────────────────
const unenrollStudent = async (req, res) => {
    try {
        const { student_id, course_group_id } = req.params;

        const checkEnrollment = await db.query(
            "SELECT * FROM student_enrollment WHERE student_id = $1 AND course_group_id = $2",
            [student_id, course_group_id]
        );

        if (checkEnrollment.rows.length === 0) {
            return res.status(404).json({ error: "Enrollment not found" });
        }

        await db.query(
            "DELETE FROM student_enrollment WHERE student_id = $1 AND course_group_id = $2",
            [student_id, course_group_id]
        );

        res.status(200).json({ message: "Student unenrolled successfully" });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ─── GET ALL ENROLLMENTS ──────────────────────────────────────
const getAllEnrollments = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT
                se.id               AS enrollment_id,
                se.enrolled_at,
                s.id                AS student_id,
                s.full_name         AS student_name,
                s.email,
                c.id                AS course_id,
                c.code              AS course_code,
                c.name              AS course_name,
                cg.id               AS group_id,
                cg.group_label
             FROM student_enrollment se
             JOIN student        s   ON s.id  = se.student_id
             JOIN course_group   cg  ON cg.id = se.course_group_id
             JOIN course         c   ON c.id  = cg.course_id
             ORDER BY s.full_name, c.name`
        );

        res.status(200).json(result.rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ─── GET ENROLLMENT BY ID ─────────────────────────────────────
const getEnrollmentById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            `SELECT
                se.id               AS enrollment_id,
                se.enrolled_at,
                s.id                AS student_id,
                s.full_name         AS student_name,
                s.email,
                c.id                AS course_id,
                c.code              AS course_code,
                c.name              AS course_name,
                cg.id               AS group_id,
                cg.group_label,
                t.full_name         AS teacher_name
             FROM student_enrollment se
             JOIN student        s   ON s.id  = se.student_id
             JOIN course_group   cg  ON cg.id = se.course_group_id
             JOIN course         c   ON c.id  = cg.course_id
             LEFT JOIN teacher_group_assignment tga ON tga.course_group_id = cg.id
             LEFT JOIN teacher   t   ON t.id  = tga.teacher_id
             WHERE se.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Enrollment not found" });
        }

        res.status(200).json(result.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ─── GET ALL STUDENTS IN A GROUP ──────────────────────────────
const getStudentsByGroup = async (req, res) => {
    try {
        const { course_group_id } = req.params;

        const checkGroup = await db.query(
            "SELECT * FROM course_group WHERE id = $1",
            [course_group_id]
        );

        if (checkGroup.rows.length === 0) {
            return res.status(404).json({ error: "Course group not found" });
        }

        const result = await db.query(
            `SELECT
                s.id                AS student_id,
                s.full_name,
                s.email,
                se.id               AS enrollment_id,
                se.enrolled_at,
                m.quiz1,
                m.quiz2,
                m.group_work,
                m.continuous_assessment,
                m.midsem,
                m.exam,
                m.total
             FROM student_enrollment se
             JOIN student s  ON s.id = se.student_id
             LEFT JOIN marks m ON m.enrollment_id = se.id
             WHERE se.course_group_id = $1
             ORDER BY s.full_name`,
            [course_group_id]
        );

        res.status(200).json(result.rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ─── GET ALL ENROLLMENTS FOR A STUDENT ───────────────────────
const getEnrollmentsByStudent = async (req, res) => {
    try {
        const { student_id } = req.params;

        const checkStudent = await db.query(
            "SELECT * FROM student WHERE id = $1",
            [student_id]
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
             JOIN course_group   cg  ON cg.id = se.course_group_id
             JOIN course         c   ON c.id  = cg.course_id
             LEFT JOIN teacher_group_assignment tga ON tga.course_group_id = cg.id
             LEFT JOIN teacher   t   ON t.id  = tga.teacher_id
             LEFT JOIN marks     m   ON m.enrollment_id = se.id
             WHERE se.student_id = $1
             ORDER BY c.name, cg.group_label`,
            [student_id]
        );

        res.status(200).json(result.rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ───────────────────────── EXPORTS ───────────────────────────
//  ============================================================
module.exports = {
    enrollStudent,
    unenrollStudent,
    getAllEnrollments,
    getEnrollmentById,
    getStudentsByGroup,
    getEnrollmentsByStudent
};