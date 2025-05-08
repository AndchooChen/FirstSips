const fs = require('fs');
const path = require('path');

// Path to the TextInputState.js file
const textInputStatePath = path.resolve(
  __dirname,
  '../node_modules/react-native/Libraries/Components/TextInput/TextInputState.js'
);

// Check if the file exists
if (!fs.existsSync(textInputStatePath)) {
  console.error(`File not found: ${textInputStatePath}`);
  process.exit(1);
}

// Read the file content
let content = fs.readFileSync(textInputStatePath, 'utf8');

// Replace the problematic import
content = content.replace(
  "const Platform = require('../../Utilities/Platform');",
  "const Platform = require('react-native/Libraries/Utilities/Platform');"
);

// Write the modified content back to the file
fs.writeFileSync(textInputStatePath, content);

console.log(`Successfully fixed Platform import in ${textInputStatePath}`);

// Now let's also check if we need to create the Platform.js file
const platformDirPath = path.resolve(
  __dirname,
  '../node_modules/react-native/Libraries/Utilities'
);

// Ensure the directory exists
if (!fs.existsSync(platformDirPath)) {
  fs.mkdirSync(platformDirPath, { recursive: true });
  console.log(`Created directory: ${platformDirPath}`);
}

// Path to create the Platform.js file
const platformFilePath = path.join(platformDirPath, 'Platform.js');

// Check if we need to create the file
if (!fs.existsSync(platformFilePath)) {
  // Find the actual Platform.js file
  const possiblePlatformPaths = [
    path.resolve(__dirname, '../node_modules/react-native/Libraries/Utilities/Platform.ios.js'),
    path.resolve(__dirname, '../node_modules/react-native/Libraries/Utilities/Platform.android.js'),
    path.resolve(__dirname, '../node_modules/react-native/Libraries/Utilities/Platform.native.js'),
  ];

  let sourcePlatformPath = null;
  for (const p of possiblePlatformPaths) {
    if (fs.existsSync(p)) {
      sourcePlatformPath = p;
      break;
    }
  }

  if (sourcePlatformPath) {
    // Copy the file
    fs.copyFileSync(sourcePlatformPath, platformFilePath);
    console.log(`Copied ${sourcePlatformPath} to ${platformFilePath}`);
  } else {
    // Create a simple re-export
    const platformContent = `
/**
 * This is a workaround for module resolution issues.
 */
module.exports = require('react-native/Libraries/Utilities/Platform.native.js');
`;
    fs.writeFileSync(platformFilePath, platformContent);
    console.log(`Created Platform.js file at: ${platformFilePath}`);
  }
} else {
  console.log(`Platform.js file already exists at: ${platformFilePath}`);
}

console.log('Fix completed successfully!');
