const express = require('express');
const router  = express.Router();
const {
    registerTeacher,
    loginTeacher,
    getAllTeachers,
    getTeachersBySupervisor,
    getTeacherById,
    updateTeacher,
    updateTeacherPassword,
    deleteTeacher
} = require('../Controllers/teacherController');
const { verifyToken, isSupervisor, isTeacher } = require('../middleware/auth');

// public routes
router.post('/login', loginTeacher);

// supervisor only
router.post('/register/:supervisor_id', verifyToken, isSupervisor, registerTeacher);
router.get('/', verifyToken, isSupervisor, getAllTeachers);
router.get('/supervisor/:supervisor_id', verifyToken, isSupervisor, getTeachersBySupervisor);
router.delete('/:id', verifyToken, isSupervisor, deleteTeacher);

// teacher only
router.get('/:id', verifyToken, isTeacher, getTeacherById);
router.put('/:id', verifyToken, isTeacher, updateTeacher);
router.put('/:id/password', verifyToken, isTeacher, updateTeacherPassword);

module.exports = router;
