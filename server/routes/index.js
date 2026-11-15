const express = require('express');
const pool = require('../config/db');
const authRoutes = require('./authRoutes');
const complaintRoutes = require('./complaintRoutes');
const adminRoutes = require('./adminRoutes');
const resourceRoutes = require('./resourceRoutes');
const departmentRoutes = require('./departmentRoutes');
const allocationRoutes = require('./allocationRoutes');
const categoryRoutes = require('./categoryRoutes');

const router = express.Router();

router.get('/health', async (req, res, next) => {
  try {
    await pool.query('SELECT 1 AS ok');
    res.json({ success: true, message: 'CSMS API is running.', data: { database: 'connected' } });
  } catch (error) {
    next(error);
  }
});

router.use('/auth', authRoutes);
router.use('/complaints', complaintRoutes);
router.use('/admin', adminRoutes);
router.use('/resources', resourceRoutes);
router.use('/departments', departmentRoutes);
router.use('/allocations', allocationRoutes);
router.use('/categories', categoryRoutes);

module.exports = router;
