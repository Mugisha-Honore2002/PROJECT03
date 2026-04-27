const express = require('express');
const router  = express.Router();
const {
    getMarksByEnrollment,
    getMarksByGroup,
    setQuiz1,
    setQuiz2,
    setGroupWork,
    setContinuousAssessment,
    setAllCA,
    setMidsem,
    setExam,
    setAllMarks
} = require('../Controllers/marksControllers');
const { verifyToken, isTeacher, isStudent, isSupervisorOrTeacher } = require('../middleware/auth');

// teacher only (enter marks)
router.put('/quiz1/:enrollment_id', verifyToken, isTeacher, setQuiz1);
router.put('/quiz2/:enrollment_id', verifyToken, isTeacher, setQuiz2);
router.put('/group-work/:enrollment_id', verifyToken, isTeacher, setGroupWork);
router.put('/ca/:enrollment_id', verifyToken, isTeacher, setContinuousAssessment);
router.put('/all-ca/:enrollment_id', verifyToken, isTeacher, setAllCA);
router.put('/midsem/:enrollment_id', verifyToken, isTeacher, setMidsem);
router.put('/exam/:enrollment_id', verifyToken, isTeacher, setExam);
router.put('/all/:enrollment_id', verifyToken, isTeacher, setAllMarks);

// supervisor or teacher (view grade sheet)
router.get('/group/:course_group_id', verifyToken, isSupervisorOrTeacher, getMarksByGroup);

// student (view own marks)
router.get('/enrollment/:enrollment_id', verifyToken, isStudent, getMarksByEnrollment);

module.exports = router;
