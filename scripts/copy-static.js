// Copies src/static/ into build/ unchanged (no hashing), for files that need a
// fixed URL, like the link-preview images in og/ (https://core9.ai/og/...).
// Run by `npm run b` after the Parcel build.
const fs = require('fs');
const path = require('path');

const from = path.join(__dirname, '..', 'src', 'static');
const to = path.join(__dirname, '..', 'build');
fs.cpSync(from, to, { recursive: true });
console.log('copied src/static/ into build/');
