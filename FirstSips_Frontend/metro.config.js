// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 🚨 This is the important fix
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
