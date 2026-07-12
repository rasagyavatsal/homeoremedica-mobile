const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

// Find the workspace root (two levels up from apps/mobile)
const workspaceRoot = path.resolve(__dirname, '../..');

const config = getDefaultConfig(__dirname);

// Add .db extension to assetExts so Metro bundles the database file
config.resolver.assetExts.push('db');

// Watch the shared package and workspace root for changes
config.watchFolders = [...(config.watchFolders || []), workspaceRoot];

// Ensure Metro can resolve packages from the workspace root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
