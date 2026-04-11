// const express = require('express');
// const router  = express.Router();
// const {
//     claimGroup,
//     releaseGroup,
//     getAvailableGroupsByCourse,
//     getGroupsByTeacher,
//     assignTeacherToGroup,
//     unassignTeacherFromGroup,
//     getAllGroupsWithAssignment,
//     getAvailableGroupsForStudent,
// } = require('../Controllers/assignmentController');
// const { verifyToken, isSupervisor, isTeacher, isStudent } = require('../middleware/auth');
// // 
// // ── teacher routes ────────────────────────────────────────────
// // teacher claims an available group for themselves
// router.post('/claim/:teacher_id/:course_group_id',     verifyToken, isTeacher,    claimGroup);
// // teacher releases a group they own
// router.delete('/release/:teacher_id/:course_group_id', verifyToken, isTeacher,    releaseGroup);
// // get groups NOT yet assigned for a course (teacher browsing)
// router.get('/available/course/:course_id',             verifyToken, isTeacher,    getAvailableGroupsByCourse);
// // get all groups assigned to a specific teacher
// router.get('/teacher/:teacher_id',                     verifyToken, isTeacher,    getGroupsByTeacher);

// // ── supervisor routes ─────────────────────────────────────────
// // supervisor manually assigns a teacher to a group
// router.post('/assign/:teacher_id/:course_group_id',    verifyToken, isSupervisor, assignTeacherToGroup);
// // supervisor removes a teacher from a group
// router.delete('/unassign/:course_group_id',            verifyToken, isSupervisor, unassignTeacherFromGroup);
// // supervisor sees all groups with their assignment status
// router.get('/all',                                     verifyToken, isSupervisor, getAllGroupsWithAssignment);

// // ── student routes ────────────────────────────────────────────
// // student sees all groups that have a teacher and are not full
// router.get('/available/student',                       verifyToken, isStudent,    getAvailableGroupsForStudent);

// module.exports = router;
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
router.post('/claim/:course_group_id',      verifyToken, isTeacher,    claimGroup);
router.delete('/release/:course_group_id',  verifyToken, isTeacher,    releaseGroup);
router.get('/available',                    verifyToken, isTeacher,    getAvailableGroups);
router.get('/my-groups',                    verifyToken, isTeacher,    getMyGroups);

// ── supervisor routes ─────────────────────────────────────────
router.post('/assign',                      verifyToken, isSupervisor, assignTeacherToGroup);
router.delete('/unassign/:course_group_id', verifyToken, isSupervisor, unassignTeacherFromGroup);
router.get('/all',                          verifyToken, isSupervisor, getAllGroupsWithAssignment);

// ── student routes ────────────────────────────────────────────
router.get('/open-groups',                  verifyToken, isStudent,    getAvailableGroupsForStudent);

module.exports = router;