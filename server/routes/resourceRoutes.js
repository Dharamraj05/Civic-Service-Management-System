const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { idParam, resourceRules, statusRules } = require('../middleware/validators');
const resourceController = require('../controllers/resourceController');

const router = express.Router();

router.use(authenticateToken, authorizeRole('ADMIN'));

router.get('/', resourceController.list);
router.post('/', resourceRules, validate, resourceController.create);
router.put('/:id', idParam, resourceRules, validate, resourceController.update);
router.patch('/:id/status', idParam, statusRules, validate, resourceController.updateStatus);
router.delete('/:id', idParam, validate, resourceController.remove);

module.exports = router;
