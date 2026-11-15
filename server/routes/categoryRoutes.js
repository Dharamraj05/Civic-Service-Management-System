const express = require('express');
const categoryController = require('../controllers/categoryController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', categoryController.list);
router.get('/resource-types', authenticateToken, authorizeRole('ADMIN'), categoryController.resourceTypes);

module.exports = router;
