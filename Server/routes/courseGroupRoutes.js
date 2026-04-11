const express = require('express');
const router  = express.Router();
const {
    createCourseGroup,
    getGroupsByCourse,
    getCourseGroupById,
    updateCourseGroup,
    deleteCourseGroup
} = require('../Controllers/courseGroupControllers');
const { verifyToken, isSupervisor, isSupervisorOrTeacher } = require('../middleware/auth');

// supervisor only
router.post('/create/:course_id', verifyToken, isSupervisor, createCourseGroup);
router.put('/:id', verifyToken, isSupervisor, updateCourseGroup);
router.delete('/:id', verifyToken, isSupervisor, deleteCourseGroup);

// supervisor or teacher
router.get('/course/:course_id', verifyToken, isSupervisorOrTeacher, getGroupsByCourse);
router.get('/:id', verifyToken, isSupervisorOrTeacher, getCourseGroupById);

module.exports = router;
