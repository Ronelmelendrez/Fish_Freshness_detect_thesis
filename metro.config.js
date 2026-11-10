// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Serve `.tflite` model files as bundled assets so `require()` can resolve them.
// React Native does not know this extension by default.
config.resolver.assetExts.push('tflite');

module.exports = config;