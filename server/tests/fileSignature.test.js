const assert = require('assert');
const { detectImageMime } = require('../utils/fileSignature');

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const webp = Buffer.concat([
  Buffer.from('RIFF'),
  Buffer.from([0x10, 0x00, 0x00, 0x00]),
  Buffer.from('WEBP')
]);
const exe = Buffer.from([0x4d, 0x5a, 0x90, 0x00]);

assert.strictEqual(detectImageMime(jpeg), 'image/jpeg');
assert.strictEqual(detectImageMime(png), 'image/png');
assert.strictEqual(detectImageMime(webp), 'image/webp');
assert.strictEqual(detectImageMime(exe), null);
console.log('File signature tests passed.');
