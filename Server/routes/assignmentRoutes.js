const express = require('express');
const router  = express.Router();
const {
    claimGroup,
    releaseGroup,
    getAvailableGroups,
    getMyGroups,
    assignTeacherToGroup,
    unassignTeacherFromGroup,
    getAllGroupsWithAssignment,
    getAvailableGroupsForStudent,
} = require('../Controllers/assignmentController');
const { verifyToken, isSupervisor, isTeacher, isStudent } = require('../middleware/auth');

// ── teacher routes ────────────────────────────────────────────
router.post('/claim/:course_group_id', verifyToken, isTeacher, claimGroup);
router.delete('/release/:course_group_id', verifyToken, isTeacher, releaseGroup);
router.get('/available', verifyToken, isTeacher, getAvailableGroups);
router.get('/my-groups', verifyToken, isTeacher, getMyGroups);

// ── supervisor routes ─────────────────────────────────────────
router.post('/assign', verifyToken, isSupervisor, assignTeacherToGroup);
router.delete('/unassign/:course_group_id', verifyToken, isSupervisor, unassignTeacherFromGroup);
router.get('/all', verifyToken, isSupervisor, getAllGroupsWithAssignment);

// ── student routes ────────────────────────────────────────────
router.get('/open-groups', verifyToken, isStudent, getAvailableGroupsForStudent);

module.exports = router;