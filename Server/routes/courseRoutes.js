const express = require('express');
const router  = express.Router();
const {
    createCourse,
    getAllCourses,
    getCoursesBySupervisor,
    getCourseById,
    getCourseWithGroups,
    updateCourse,
    deleteCourse
} = require('../Controllers/courseControllers');
const { verifyToken, isSupervisor, isSupervisorOrTeacher } = require('../middleware/auth');

// supervisor only
router.post('/create/:supervisor_id',           verifyToken, isSupervisor, createCourse);
router.put('/:id',                              verifyToken, isSupervisor, updateCourse);
router.delete('/:id',                           verifyToken, isSupervisor, deleteCourse);

// supervisor or teacher
router.get('/',                                 verifyToken, isSupervisorOrTeacher, getAllCourses);
router.get('/supervisor/:supervisor_id',        verifyToken, isSupervisorOrTeacher, getCoursesBySupervisor);
router.get('/:id/groups',                       verifyToken, isSupervisorOrTeacher, getCourseWithGroups);
router.get('/:id',                              verifyToken, isSupervisorOrTeacher, getCourseById);

module.exports = router;
