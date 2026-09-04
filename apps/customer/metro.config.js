const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');
const sharedRnRoot = path.resolve(workspaceRoot, 'packages/shared-rn');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

config.resolver.disableHierarchicalLookup = false;

// 4. Force resolution using resolveRequest to guarantee a single instance including subpaths!
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'foodie-shared-rn') {
    return context.resolveRequest(context, path.resolve(sharedRnRoot, 'src/index.ts'), platform);
  }

  const dedupedPackages = [
    'react',
    ...(platform === 'web' ? [] : ['react-native']),
    'react-redux',
    '@react-navigation/native',
    '@react-navigation/native-stack'
  ];

  for (const pkg of dedupedPackages) {
    if (moduleName === pkg || moduleName.startsWith(pkg + '/')) {
      return context.resolveRequest(
        context,
        moduleName.replace(pkg, path.resolve(projectRoot, 'node_modules', pkg)),
        platform
      );
    }
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
