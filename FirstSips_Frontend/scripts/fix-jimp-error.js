const fs = require('fs');
const path = require('path');

// Path to the jimp.js file
const jimpPath = path.resolve(
  __dirname,
  '../node_modules/jimp-compact/dist/jimp.js'
);

// Check if the file exists
if (!fs.existsSync(jimpPath)) {
  console.error(`Jimp file not found: ${jimpPath}`);
  console.log('Skipping Jimp fix as the file was not found.');
  process.exit(0);
}

// Read the file content
let content = fs.readFileSync(jimpPath, 'utf8');

// Find the parseBitmap method
const parseBitmapRegex = /Jimp\.prototype\.parseBitmap\s*=\s*function\s*\([^)]*\)\s*\{/;
const match = content.match(parseBitmapRegex);

if (!match) {
  console.error('Could not find parseBitmap method in Jimp file');
  process.exit(1);
}

// Add error handling to the parseBitmap method
const originalMethod = match[0];
const patchedMethod = `${originalMethod}
  try {
    // Add error handling for null buffer
    if (!this.bitmap || !this.bitmap.data) {
      console.warn('Jimp: Empty or null bitmap detected, creating empty image');
      this.bitmap = { width: 1, height: 1, data: Buffer.alloc(4) };
      return;
    }
`;

// Replace the method
content = content.replace(originalMethod, patchedMethod);

// Add a closing bracket for the try block at the end of the method
const methodEndRegex = /(\}\s*;)(\s*Jimp\.prototype\.)/;
content = content.replace(methodEndRegex, '  } catch (err) { console.error("Jimp error:", err); }$1$2');

// Write the modified content back to the file
fs.writeFileSync(jimpPath, content);

console.log(`Successfully patched Jimp at ${jimpPath}`);
