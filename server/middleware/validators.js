const { body, param, query } = require('express-validator');

const registerRules = [
  body('full_name').trim().isLength({ min: 2, max: 120 }).withMessage('Enter the full name (2–120 characters).'),
  body('email').trim().isEmail().withMessage('Enter a valid email address.').normalizeEmail(),
  body('phone').trim().matches(/^[0-9]{10,15}$/).withMessage('Enter a phone number with 10 to 15 digits.'),
  body('password')
    .isLength({ min: 8, max: 72 })
    .withMessage('Password must be 8 to 72 characters.')
    .matches(/[A-Za-z]/)
    .withMessage('Password must include a letter.')
    .matches(/[0-9]/)
    .withMessage('Password must include a number.')
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Enter a valid email address.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.')
];

const profileRules = [
  body('full_name').trim().isLength({ min: 2, max: 120 }).withMessage('Enter the full name (2–120 characters).'),
  body('phone').trim().matches(/^[0-9]{10,15}$/).withMessage('Enter a phone number with 10 to 15 digits.')
];

const passwordRules = [
  body('current_password').notEmpty().withMessage('Current password is required.'),
  body('new_password')
    .isLength({ min: 8, max: 72 })
    .withMessage('New password must be 8 to 72 characters.')
    .matches(/[A-Za-z]/)
    .withMessage('New password must include a letter.')
    .matches(/[0-9]/)
    .withMessage('New password must include a number.')
];

const complaintRules = [
  body('title').trim().isLength({ min: 5, max: 160 }).withMessage('Title must be 5–160 characters.'),
  body('description').trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be 10–2000 characters.'),
  body('address').trim().isLength({ min: 5, max: 255 }).withMessage('Address must be 5–255 characters.'),
  body('category_id').isInt({ min: 1 }).withMessage('Select a service category.').toInt(),
  body('priority').isInt({ min: 1, max: 4 }).withMessage('Priority must be 1 (Critical) through 4 (Low).').toInt(),
  body('latitude')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90.'),
  body('longitude')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180.')
];

const idParam = [param('id').isInt({ min: 1 }).withMessage('Invalid id.').toInt()];

const departmentRules = [
  body('department_name').trim().isLength({ min: 2, max: 120 }).withMessage('Department name must be 2–120 characters.'),
  body('description').optional({ nullable: true }).trim().isLength({ max: 500 }).withMessage('Description is too long.')
];

const resourceRules = [
  body('department_id').isInt({ min: 1 }).withMessage('Select a department.').toInt(),
  body('resource_name').trim().isLength({ min: 2, max: 120 }).withMessage('Resource name must be 2–120 characters.'),
  body('resource_type').trim().isLength({ min: 2, max: 80 }).withMessage('Resource type is required.'),
  body('registration_or_identifier').trim().isLength({ min: 2, max: 60 }).withMessage('Identifier must be 2–60 characters.'),
  body('status')
    .optional()
    .isIn(['AVAILABLE', 'MAINTENANCE', 'OFFLINE'])
    .withMessage('Status must be AVAILABLE, MAINTENANCE, or OFFLINE. BUSY is set by allocation.'),
  body('current_location').optional({ nullable: true }).trim().isLength({ max: 255 }).withMessage('Location is too long.')
];

const statusRules = [
  body('status')
    .isIn(['AVAILABLE', 'MAINTENANCE', 'OFFLINE'])
    .withMessage('Status must be AVAILABLE, MAINTENANCE, or OFFLINE.')
];

const complaintStatusRules = [
  body('status')
    .isIn(['CANCELLED', 'IN_PROGRESS', 'COMPLETED'])
    .withMessage('Use CANCELLED, IN_PROGRESS, or COMPLETED. Assignment is done through the allocation API.'),
  body('remarks').optional({ nullable: true }).trim().isLength({ max: 255 })
];

const manualAllocationRules = [
  body('complaint_id').isInt({ min: 1 }).withMessage('complaint_id is required.').toInt(),
  body('resource_id').isInt({ min: 1 }).withMessage('resource_id is required.').toInt(),
  body('remarks').optional({ nullable: true }).trim().isLength({ max: 255 })
];

const autoAllocationRules = [
  body('mode').optional().isIn(['next', 'pass']).withMessage('mode must be next or pass.'),
  body('complaint_id').optional({ nullable: true }).isInt({ min: 1 }).withMessage('complaint_id must be a positive integer.').toInt()
];

const reassignRules = [
  body('resource_id').isInt({ min: 1 }).withMessage('resource_id is required.').toInt(),
  body('remarks').optional({ nullable: true }).trim().isLength({ max: 255 })
];

const flagRules = [
  body('flag_type')
    .isIn(['WRONG_PHOTO', 'WRONG_INFORMATION', 'INSUFFICIENT_EVIDENCE', 'OTHER'])
    .withMessage('Select a review finding.'),
  body('reason').trim().isLength({ min: 10, max: 500 }).withMessage('Enter a reason between 10 and 500 characters.')
];

const complaintFilterRules = [
  query('status')
    .optional({ checkFalsy: true })
    .isIn(['NEW', 'WAITING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
    .withMessage('Unknown status filter.'),
  query('category_id').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('Invalid category filter.').toInt(),
  query('priority').optional({ checkFalsy: true }).isInt({ min: 1, max: 4 }).withMessage('Invalid priority filter.').toInt()
];

module.exports = {
  registerRules,
  loginRules,
  profileRules,
  passwordRules,
  complaintRules,
  idParam,
  departmentRules,
  resourceRules,
  statusRules,
  complaintStatusRules,
  manualAllocationRules,
  autoAllocationRules,
  reassignRules,
  complaintFilterRules,
  flagRules
};
