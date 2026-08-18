const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');
const sharedRnRoot = path.resolve(workspaceRoot, 'packages/shared-rn');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

config.watchFolders = [
  ...(config.watchFolders ?? []),
  sharedRnRoot,
  workspaceRoot
];
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  'foodie-shared-rn': sharedRnRoot,
};
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
  path.resolve(sharedRnRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
