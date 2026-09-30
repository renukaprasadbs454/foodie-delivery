const path = require('path');
const https = require('https');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = projectRoot;


/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Allow Metro to follow pnpm symlinks hierarchically
config.resolver.disableHierarchicalLookup = false;

const reactNativeWebPath = path.dirname(
  require.resolve('react-native-web/package.json', { paths: [projectRoot, workspaceRoot] })
);

// 4. Resolve shared-rn and web aliases
config.resolver.resolveRequest = (context, moduleName, platform) => {


  if (platform === 'web') {
    if (moduleName === 'react-native' || moduleName.startsWith('react-native/')) {
      return {
        type: 'sourceFile',
        filePath: path.resolve(reactNativeWebPath, 'dist/index.js'),
      };
    }
    if (moduleName === 'react-native-maps') {
      return context.resolveRequest(context, '@teovilla/react-native-web-maps', platform);
    }
  }

  return context.resolveRequest(context, moduleName, platform);
};

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      if (req.url && req.url.startsWith('/api/')) {
        let targetHost = (process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.foodie.kwiko.org').replace(/\/+$/, '');
        if (targetHost.includes('127.0.0.1:8082') || targetHost.includes('localhost:8082')) {
          targetHost = 'https://api.foodie.kwiko.org';
        }
        const targetUrl = targetHost + req.url;
        const isHttps = targetHost.startsWith('https');
        const httpLib = isHttps ? require('https') : require('http');
        const hostHeader = targetHost.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
        const options = {
          method: req.method,
          headers: {
            ...req.headers,
            host: hostHeader,
          },
        };
        if (isHttps) {
          options.servername = hostHeader;
        }
        const proxyReq = httpLib.request(targetUrl, options, (proxyRes) => {
          res.writeHead(proxyRes.statusCode || 200, {
            ...proxyRes.headers,
            'access-control-allow-origin': '*',
            'access-control-allow-headers': '*',
            'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          });
          proxyRes.pipe(res, { end: true });
        });
        proxyReq.on('error', (err) => {
          console.error('[Metro API Proxy Error]:', err.message);
          res.writeHead(502, {
            'Content-Type': 'application/json',
            'access-control-allow-origin': '*',
            'access-control-allow-headers': '*',
          });
          res.end(JSON.stringify({ success: false, error: { code: 'BAD_GATEWAY', message: err.message } }));
        });
        req.pipe(proxyReq, { end: true });
        return;
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = config;

