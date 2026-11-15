const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');

const register = asyncHandler(async (req, res) => {
  // Role is never taken from the client. Registration always creates a CITIZEN.
  const result = await authService.register({
    fullName: req.body.full_name,
    email: req.body.email,
    phone: req.body.phone,
    password: req.body.password
  });

  res.status(201).json({
    success: true,
    message: 'Registration successful.',
    data: result
  });
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login({
    email: req.body.email,
    password: req.body.password
  });

  res.json({
    success: true,
    message: 'Login successful.',
    data: result
  });
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.userId);
  res.json({ success: true, data: { user } });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user.userId, {
    fullName: req.body.full_name,
    phone: req.body.phone
  });
  res.json({ success: true, message: 'Profile updated.', data: { user } });
});

const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user.userId, {
    currentPassword: req.body.current_password,
    newPassword: req.body.new_password
  });
  res.json({ success: true, message: 'Password updated.' });
});

module.exports = { register, login, me, updateProfile, changePassword };
