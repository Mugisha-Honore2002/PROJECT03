const express = require('express');
const router  = express.Router();
const {
    enrollStudent,
    unenrollStudent,
    getAllEnrollments,
    getEnrollmentById,
    getStudentsByGroup,
    getEnrollmentsByStudent
} = require('../Controllers/studentEnrollmentControllers');
const { verifyToken, isSupervisor, isStudent, isSupervisorOrTeacher } = require('../middleware/auth');

// student only
router.post('/:student_id/:course_group_id',    verifyToken, isStudent, enrollStudent);
router.delete('/:student_id/:course_group_id',  verifyToken, isStudent, unenrollStudent);
router.get('/student/:student_id',              verifyToken, isStudent, getEnrollmentsByStudent);

// supervisor only
router.get('/',                                 verifyToken, isSupervisor, getAllEnrollments);

// supervisor or teacher
// ⚠ specific routes MUST come before /:id to avoid route conflict
router.get('/group/:course_group_id',           verifyToken, isSupervisorOrTeacher, getStudentsByGroup);
router.get('/:id',                              verifyToken, isSupervisorOrTeacher, getEnrollmentById);

module.exports = router;
