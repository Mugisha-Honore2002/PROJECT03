const db = require('../db');


// --- CALCULATION OF MARKS -------------------------
const recalcTotal = async (enrollment_id) => {
    await db.query(
        `UPDATE marks
         SET total = ROUND((
             COALESCE(quiz1, 0) +
             COALESCE(quiz2, 0) +
             COALESCE(group_work, 0) +
             COALESCE(continuous_assessment, 0) +
             COALESCE(midsem, 0) +
             COALESCE(exam, 0)
         ) / 5.0, 2),
         updated_at = NOW()
         WHERE enrollment_id = $1`,
        [enrollment_id]
    );
};


// ─── GET MARKS BY ENROLLMENT ID ──────────────────────────────
const getMarksByEnrollment = async (req, res) => {
    try {
        const { enrollment_id } = req.params;

        const checkEnrollment = await db.query(
            "SELECT * FROM student_enrollment WHERE id = $1",
            [enrollment_id]
        );
        if (checkEnrollment.rows.length === 0)
            return res.status(404).json({ error: "Enrollment not found" });

        const result = await db.query(
            "SELECT * FROM marks WHERE enrollment_id = $1",
            [enrollment_id]
        );
        if (result.rows.length === 0)
            return res.status(404).json({ error: "Marks not found" });

        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ─── GET ALL MARKS FOR A GROUP ────────────────────────────────
const getMarksByGroup = async (req, res) => {
    try {
        const { course_group_id } = req.params;

        const checkGroup = await db.query(
            "SELECT * FROM course_group WHERE id = $1",
            [course_group_id]
        );
        if (checkGroup.rows.length === 0)
            return res.status(404).json({ error: "Course group not found" });

        const result = await db.query(
            `SELECT
                s.id                    AS student_id,
                s.full_name,
                se.id                   AS enrollment_id,
                m.id                    AS marks_id,
                m.quiz1,
                m.quiz2,
                m.group_work,
                m.continuous_assessment,
                m.midsem,
                m.exam,
                m.total,
                m.updated_at
             FROM student_enrollment se
             JOIN student    s   ON s.id = se.student_id
             LEFT JOIN marks m   ON m.enrollment_id = se.id
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


// ─── ENTER QUIZ 1 ─────────────────────────────────────────────
const setQuiz1 = async (req, res) => {
    try {
        const { enrollment_id } = req.params;
        const { quiz1 } = req.body;

        if (quiz1 === undefined) return res.status(400).json({ error: "Missing quiz1 value" });
        if (quiz1 < 0 || quiz1 > 10) return res.status(400).json({ error: "quiz1 must be between 0 and 10" });

        const check = await db.query("SELECT * FROM student_enrollment WHERE id = $1", [enrollment_id]);
        if (check.rows.length === 0) return res.status(404).json({ error: "Enrollment not found" });

        await db.query(
            `INSERT INTO marks (enrollment_id, quiz1)
             VALUES ($1, $2)
             ON CONFLICT (enrollment_id)
             DO UPDATE SET quiz1 = $2, updated_at = NOW()`,
            [enrollment_id, quiz1]
        );

        await recalcTotal(enrollment_id);

        const updated = await db.query("SELECT * FROM marks WHERE enrollment_id = $1", [enrollment_id]);
        res.status(200).json(updated.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ─── ENTER QUIZ 2 ─────────────────────────────────────────────
const setQuiz2 = async (req, res) => {
    try {
        const { enrollment_id } = req.params;
        const { quiz2 } = req.body;

        if (quiz2 === undefined) return res.status(400).json({ error: "Missing quiz2 value" });
        if (quiz2 < 0 || quiz2 > 10) return res.status(400).json({ error: "quiz2 must be between 0 and 10" });

        const check = await db.query("SELECT * FROM student_enrollment WHERE id = $1", [enrollment_id]);
        if (check.rows.length === 0) return res.status(404).json({ error: "Enrollment not found" });

        await db.query(
            `INSERT INTO marks (enrollment_id, quiz2)
             VALUES ($1, $2)
             ON CONFLICT (enrollment_id)
             DO UPDATE SET quiz2 = $2, updated_at = NOW()`,
            [enrollment_id, quiz2]
        );

        await recalcTotal(enrollment_id);

        const updated = await db.query("SELECT * FROM marks WHERE enrollment_id = $1", [enrollment_id]);
        res.status(200).json(updated.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ─── ENTER GROUP WORK ─────────────────────────────────────────
const setGroupWork = async (req, res) => {
    try {
        const { enrollment_id } = req.params;
        const { group_work } = req.body;

        if (group_work === undefined) return res.status(400).json({ error: "Missing group_work value" });
        if (group_work < 0 || group_work > 10) return res.status(400).json({ error: "group_work must be between 0 and 10" });

        const check = await db.query("SELECT * FROM student_enrollment WHERE id = $1", [enrollment_id]);
        if (check.rows.length === 0) return res.status(404).json({ error: "Enrollment not found" });

        await db.query(
            `INSERT INTO marks (enrollment_id, group_work)
             VALUES ($1, $2)
             ON CONFLICT (enrollment_id)
             DO UPDATE SET group_work = $2, updated_at = NOW()`,
            [enrollment_id, group_work]
        );

        await recalcTotal(enrollment_id);

        const updated = await db.query("SELECT * FROM marks WHERE enrollment_id = $1", [enrollment_id]);
        res.status(200).json(updated.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ─── ENTER CA (lump sum) ──────────────────────────────────────
const setContinuousAssessment = async (req, res) => {
    try {
        const { enrollment_id } = req.params;
        const { continuous_assessment } = req.body;

        if (continuous_assessment === undefined) return res.status(400).json({ error: "Missing continuous_assessment value" });
        if (continuous_assessment < 0 || continuous_assessment > 10) return res.status(400).json({ error: "continuous_assessment must be between 0 and 10" });

        const check = await db.query("SELECT * FROM student_enrollment WHERE id = $1", [enrollment_id]);
        if (check.rows.length === 0) return res.status(404).json({ error: "Enrollment not found" });

        await db.query(
            `INSERT INTO marks (enrollment_id, continuous_assessment)
             VALUES ($1, $2)
             ON CONFLICT (enrollment_id)
             DO UPDATE SET continuous_assessment = $2, updated_at = NOW()`,
            [enrollment_id, continuous_assessment]
        );

        await recalcTotal(enrollment_id);

        const updated = await db.query("SELECT * FROM marks WHERE enrollment_id = $1", [enrollment_id]);
        res.status(200).json(updated.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ─── ENTER ALL CA AT ONCE ─────────────────────────────────────
const setAllCA = async (req, res) => {
    try {
        const { enrollment_id } = req.params;
        const { quiz1, quiz2, group_work } = req.body;

        if (quiz1 === undefined || quiz2 === undefined || group_work === undefined)
            return res.status(400).json({ error: "Missing required fields" });
        if (quiz1 < 0 || quiz1 > 10) return res.status(400).json({ error: "quiz1 must be between 0 and 10" });
        if (quiz2 < 0 || quiz2 > 10) return res.status(400).json({ error: "quiz2 must be between 0 and 10" });
        if (group_work < 0 || group_work > 10) return res.status(400).json({ error: "group_work must be between 0 and 10" });

        const check = await db.query("SELECT * FROM student_enrollment WHERE id = $1", [enrollment_id]);
        if (check.rows.length === 0) return res.status(404).json({ error: "Enrollment not found" });

        // also set continuous_assessment = quiz1 + quiz2 + group_work
        const ca = quiz1 + quiz2 + group_work;

        await db.query(
            `INSERT INTO marks (enrollment_id, quiz1, quiz2, group_work, continuous_assessment)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (enrollment_id)
             DO UPDATE SET quiz1 = $2, quiz2 = $3, group_work = $4,
                           continuous_assessment = $5, updated_at = NOW()`,
            [enrollment_id, quiz1, quiz2, group_work, ca]
        );

        await recalcTotal(enrollment_id);

        const updated = await db.query("SELECT * FROM marks WHERE enrollment_id = $1", [enrollment_id]);
        res.status(200).json(updated.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ─── ENTER MIDSEM ─────────────────────────────────────────────
const setMidsem = async (req, res) => {
    try {
        const { enrollment_id } = req.params;
        const { midsem } = req.body;

        if (midsem === undefined) return res.status(400).json({ error: "Missing midsem value" });
        if (midsem < 0 || midsem > 30) return res.status(400).json({ error: "midsem must be between 0 and 30" });

        const check = await db.query("SELECT * FROM student_enrollment WHERE id = $1", [enrollment_id]);
        if (check.rows.length === 0) return res.status(404).json({ error: "Enrollment not found" });

        await db.query(
            `INSERT INTO marks (enrollment_id, midsem)
             VALUES ($1, $2)
             ON CONFLICT (enrollment_id)
             DO UPDATE SET midsem = $2, updated_at = NOW()`,
            [enrollment_id, midsem]
        );

        await recalcTotal(enrollment_id);

        const updated = await db.query("SELECT * FROM marks WHERE enrollment_id = $1", [enrollment_id]);
        res.status(200).json(updated.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ─── ENTER EXAM ───────────────────────────────────────────────
const setExam = async (req, res) => {
    try {
        const { enrollment_id } = req.params;
        const { exam } = req.body;

        if (exam === undefined) return res.status(400).json({ error: "Missing exam value" });
        if (exam < 0 || exam > 40) return res.status(400).json({ error: "exam must be between 0 and 40" });

        const check = await db.query("SELECT * FROM student_enrollment WHERE id = $1", [enrollment_id]);
        if (check.rows.length === 0) return res.status(404).json({ error: "Enrollment not found" });

        await db.query(
            `INSERT INTO marks (enrollment_id, exam)
             VALUES ($1, $2)
             ON CONFLICT (enrollment_id)
             DO UPDATE SET exam = $2, updated_at = NOW()`,
            [enrollment_id, exam]
        );

        await recalcTotal(enrollment_id);

        const updated = await db.query("SELECT * FROM marks WHERE enrollment_id = $1", [enrollment_id]);
        res.status(200).json(updated.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


// ─── ENTER ALL MARKS AT ONCE ──────────────────────────────────
const setAllMarks = async (req, res) => {
    try {
        const { enrollment_id } = req.params;
        const { quiz1, quiz2, group_work, continuous_assessment, midsem, exam } = req.body;

        if (midsem === undefined || exam === undefined)
            return res.status(400).json({ error: "Missing required fields (midsem, exam)" });
        if (midsem < 0 || midsem > 30) return res.status(400).json({ error: "midsem must be between 0 and 30" });
        if (exam < 0 || exam > 40) return res.status(400).json({ error: "exam must be between 0 and 40" });

        const check = await db.query("SELECT * FROM student_enrollment WHERE id = $1", [enrollment_id]);
        if (check.rows.length === 0) return res.status(404).json({ error: "Enrollment not found" });

        // auto-calculate total: (quiz1+quiz2+group_work+ca+midsem+exam) / 5
        const ca = continuous_assessment ?? ((quiz1 ?? 0) + (quiz2 ?? 0) + (group_work ?? 0));
        const total = Math.round(((quiz1 ?? 0) + (quiz2 ?? 0) + (group_work ?? 0) + ca + midsem + exam) / 5 * 100) / 100;

        await db.query(
            `INSERT INTO marks (enrollment_id, quiz1, quiz2, group_work, continuous_assessment, midsem, exam, total)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (enrollment_id)
             DO UPDATE SET
                quiz1                 = $2,
                quiz2                 = $3,
                group_work            = $4,
                continuous_assessment = $5,
                midsem                = $6,
                exam                  = $7,
                total                 = $8,
                updated_at            = NOW()
             RETURNING *`,
            [enrollment_id, quiz1 ?? null, quiz2 ?? null, group_work ?? null, ca, midsem, exam, total]
        );

        const updated = await db.query("SELECT * FROM marks WHERE enrollment_id = $1", [enrollment_id]);
        res.status(200).json(updated.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};


module.exports = {
    getMarksByEnrollment,
    getMarksByGroup,
    setQuiz1,
    setQuiz2,
    setGroupWork,
    setContinuousAssessment,
    setAllCA,
    setMidsem,
    setExam,
    setAllMarks,
};