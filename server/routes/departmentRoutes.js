const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { idParam, departmentRules } = require('../middleware/validators');
const departmentController = require('../controllers/departmentController');

const router = express.Router();

router.use(authenticateToken);

router.get('/', departmentController.list);
router.post('/', authorizeRole('ADMIN'), departmentRules, validate, departmentController.create);
router.put('/:id', authorizeRole('ADMIN'), idParam, departmentRules, validate, departmentController.update);
router.delete('/:id', authorizeRole('ADMIN'), idParam, validate, departmentController.remove);

module.exports = router;
