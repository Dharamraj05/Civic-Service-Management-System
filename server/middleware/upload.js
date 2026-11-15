const multer = require('multer');
const { ALLOWED_MIME, MAX_BYTES } = require('../utils/fileSignature');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter(req, file, done) {
    if (ALLOWED_MIME.includes(file.mimetype) || file.mimetype === 'application/octet-stream') {
      return done(null, true);
    }
    return done(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
  }
});

function optionalEvidence(req, res, next) {
  if (!req.is('multipart/form-data')) {
    return next();
  }
  upload.single('evidence')(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        error.statusCode = 400;
        error.message = 'Photo must be 5 MB or smaller.';
      } else {
        error.statusCode = 400;
        error.message = 'Use a JPEG, PNG, or WEBP image.';
      }
    }
    return next(error);
  });
}

function requiredEvidence(req, res, next) {
  upload.single('evidence')(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError) {
      error.statusCode = 400;
      error.message = error.code === 'LIMIT_FILE_SIZE'
        ? 'Photo must be 5 MB or smaller.'
        : 'Use a JPEG, PNG, or WEBP image.';
    }
    return next(error);
  });
}

module.exports = { optionalEvidence, requiredEvidence };
