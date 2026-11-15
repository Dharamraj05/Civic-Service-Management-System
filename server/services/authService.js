const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const ApiError = require('../utils/ApiError');

const BCRYPT_ROUNDS = 10;

function signToken(user) {
  return jwt.sign(
    { userId: user.user_id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

function publicUser(user) {
  return {
    user_id: user.user_id,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    created_at: user.created_at
  };
}

async function register({ fullName, email, phone, password }) {
  const existingEmail = await userModel.findByEmail(email);
  if (existingEmail) {
    throw new ApiError(409, 'An account with this email already exists.');
  }
  const existingPhone = await userModel.findByPhone(phone);
  if (existingPhone) {
    throw new ApiError(409, 'An account with this phone number already exists.');
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await userModel.createCitizen({ fullName, email, phone, passwordHash });
  return {
    token: signToken(user),
    user: publicUser(user)
  };
}

async function login({ email, password }) {
  const user = await userModel.findByEmail(email);
  const passwordOk = user ? await bcrypt.compare(password, user.password_hash) : false;

  // Same message for unknown email and wrong password.
  if (!user || !passwordOk) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  return {
    token: signToken(user),
    user: publicUser(user)
  };
}

async function getProfile(userId) {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new ApiError(401, 'Account not found. Please log in again.');
  }
  return publicUser(user);
}

async function updateProfile(userId, { fullName, phone }) {
  const phoneOwner = await userModel.findByPhone(phone);
  if (phoneOwner && phoneOwner.user_id !== userId) {
    throw new ApiError(409, 'An account with this phone number already exists.');
  }
  const user = await userModel.updateProfile(userId, { fullName, phone });
  return publicUser(user);
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const hash = await userModel.findPasswordHash(userId);
  if (!hash) {
    throw new ApiError(401, 'Account not found. Please log in again.');
  }
  const matches = await bcrypt.compare(currentPassword, hash);
  if (!matches) {
    throw new ApiError(400, 'Current password is incorrect.');
  }
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await userModel.updatePassword(userId, passwordHash);
}

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
};
