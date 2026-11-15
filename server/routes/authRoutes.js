const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  registerRules,
  loginRules,
  profileRules,
  passwordRules
} = require('../middleware/validators');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/register', registerRules, validate, authController.register);
router.post('/login', loginRules, validate, authController.login);
router.get('/me', authenticateToken, authController.me);
router.put('/profile', authenticateToken, profileRules, validate, authController.updateProfile);
router.put('/password', authenticateToken, passwordRules, validate, authController.changePassword);

module.exports = router;
