const express = require('express');
const router  = express.Router();
const {
    registerSupervisor,
    loginSupervisor,
    getAllSupervisors,
    getSupervisorById,
    updateSupervisor,
    updateSupervisorPassword,
    deleteSupervisor
} = require('../Controllers/SupervisorController');
const { verifyToken, isSupervisor } = require('../middleware/auth');

// public routes
router.post('/register',        registerSupervisor);
router.post('/login',           loginSupervisor);

// protected routes
router.get('/',                 verifyToken, isSupervisor, getAllSupervisors);
router.get('/:id',              verifyToken, isSupervisor, getSupervisorById);
router.put('/:id',              verifyToken, isSupervisor, updateSupervisor);
router.put('/:id/password',     verifyToken, isSupervisor, updateSupervisorPassword);
router.delete('/:id',           verifyToken, isSupervisor, deleteSupervisor);

module.exports = router;
