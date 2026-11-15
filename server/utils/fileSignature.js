const SIGNATURES = [
  { mime: 'image/jpeg', test: (buf) => buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff },
  { mime: 'image/png', test: (buf) => buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 },
  { mime: 'image/webp', test: (buf) => buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP' }
];

const ALLOWED_MIME = SIGNATURES.map((item) => item.mime);
const MAX_BYTES = 5 * 1024 * 1024;

function detectImageMime(buffer) {
  const match = SIGNATURES.find((item) => item.test(buffer));
  return match ? match.mime : null;
}

module.exports = { ALLOWED_MIME, MAX_BYTES, detectImageMime };
