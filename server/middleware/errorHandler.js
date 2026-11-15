function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON body.'
    });
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'That value is already in use. Check email, phone, identifier, or an active allocation.'
    });
  }

  if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
    return res.status(409).json({
      success: false,
      message: 'This record is referenced by other data and cannot be deleted.'
    });
  }

  if (err.code === 'ER_NO_SUCH_TABLE') {
    return res.status(503).json({
      success: false,
      message: 'A required table is missing. Run database/migrate_evidence.sql in MySQL Workbench, then retry.'
    });
  }

  if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ER_ACCESS_DENIED_ERROR') {
    return res.status(503).json({
      success: false,
      message: 'Database is unavailable. Check that MySQL is running and server/.env is correct.'
    });
  }

  const statusCode = err.statusCode || 500;
  const isServerError = statusCode >= 500;

  if (isServerError) {
    console.error(err);
  }

  const message = isServerError && process.env.NODE_ENV === 'production'
    ? 'Something went wrong. Please try again.'
    : err.message || 'Internal server error';

  return res.status(statusCode).json({
    success: false,
    message
  });
}

module.exports = errorHandler;
