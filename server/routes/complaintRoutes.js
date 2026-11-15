const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { complaintRules, idParam, complaintStatusRules, flagRules } = require('../middleware/validators');
const { optionalEvidence, requiredEvidence } = require('../middleware/upload');
const complaintController = require('../controllers/complaintController');

const router = express.Router();

router.use(authenticateToken);

router.get('/my', authorizeRole('CITIZEN'), complaintController.mine);
router.post('/', authorizeRole('CITIZEN'), optionalEvidence, complaintRules, validate, complaintController.create);
router.get('/:id', idParam, validate, complaintController.getOne);
router.post(
  '/:id/evidence',
  authorizeRole('CITIZEN'),
  idParam,
  validate,
  requiredEvidence,
  complaintController.addEvidence
);
router.get(
  '/:id/evidence/:evidenceId/file',
  idParam,
  validate,
  complaintController.evidenceFile
);
router.post(
  '/:id/flags',
  authorizeRole('ADMIN'),
  idParam,
  flagRules,
  validate,
  complaintController.flag
);
router.patch(
  '/:id/status',
  authorizeRole('ADMIN'),
  idParam,
  complaintStatusRules,
  validate,
  complaintController.updateStatus
);
router.patch('/:id/cancel', idParam, validate, complaintController.cancel);

module.exports = router;
