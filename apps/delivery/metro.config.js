const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');
const sharedRnRoot = path.resolve(workspaceRoot, 'packages/shared-rn');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Allow Metro to follow pnpm symlinks hierarchically
config.resolver.disableHierarchicalLookup = false;

// 4. Force resolution of react and react-native to the local bundle instance
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  'foodie-shared-rn': sharedRnRoot,
  'react': path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
  'react-redux': path.resolve(projectRoot, 'node_modules/react-redux'),
  '@react-navigation/native': path.resolve(projectRoot, 'node_modules/@react-navigation/native'),
};

module.exports = config;
