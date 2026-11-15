const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

function authenticateToken(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError(401, 'Authentication required.'));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      userId: payload.userId,
      role: payload.role
    };
    return next();
  } catch (error) {
    return next(new ApiError(401, 'Session expired or token is invalid. Please log in again.'));
  }
}

/**
 * Role-based access control.
 * Use after authenticateToken. Example: authorizeRole('ADMIN').
 */
function authorizeRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to access this resource.'));
    }
    return next();
  };
}

module.exports = { authenticateToken, authorizeRole };
