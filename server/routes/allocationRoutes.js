const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  idParam,
  manualAllocationRules,
  autoAllocationRules,
  reassignRules
} = require('../middleware/validators');
const allocationController = require('../controllers/allocationController');

const router = express.Router();

router.use(authenticateToken, authorizeRole('ADMIN'));

router.get('/', allocationController.list);
router.post('/auto', autoAllocationRules, validate, allocationController.auto);
router.post('/manual', manualAllocationRules, validate, allocationController.manual);
router.patch('/:id/start', idParam, validate, allocationController.start);
router.patch('/:id/complete', idParam, validate, allocationController.complete);
router.patch('/:id/reassign', idParam, reassignRules, validate, allocationController.reassign);

module.exports = router;
