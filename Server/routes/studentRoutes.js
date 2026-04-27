const express = require('express');
const router  = express.Router();
const {
    registerStudent,
    loginStudent,
    getAllStudents,
    getStudentById,
    getStudentEnrollments,
    updateStudent,
    updateStudentPassword,
    deleteStudent
} = require('../Controllers/studentControllers');
const { verifyToken, isSupervisor, isStudent } = require('../middleware/auth');

// public routes
router.post('/register', registerStudent);
router.post('/login', loginStudent);

// supervisor only
router.get('/', verifyToken, isSupervisor, getAllStudents);
router.delete('/:id', verifyToken, isSupervisor, deleteStudent);

// student only
router.get('/:id/enrollments', verifyToken, isStudent, getStudentEnrollments);
router.get('/:id', verifyToken, isStudent, getStudentById);
router.put('/:id', verifyToken, isStudent, updateStudent);
router.put('/:id/password', verifyToken, isStudent, updateStudentPassword);

module.exports = router;
