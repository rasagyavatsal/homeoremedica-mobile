const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add .db extension to assetExts so Metro bundles the database file
config.resolver.assetExts.push('db');

module.exports = config;
