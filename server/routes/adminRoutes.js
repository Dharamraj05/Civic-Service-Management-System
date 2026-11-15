const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { complaintFilterRules } = require('../middleware/validators');
const adminController = require('../controllers/adminController');
const allocationController = require('../controllers/allocationController');

const router = express.Router();

router.use(authenticateToken, authorizeRole('ADMIN'));

router.get('/dashboard', adminController.dashboard);
router.get('/concepts', adminController.concepts);
router.get('/reports', adminController.reports);
router.get('/complaints', complaintFilterRules, validate, adminController.complaints);
router.get('/complaints/queue', allocationController.queue);

module.exports = router;
