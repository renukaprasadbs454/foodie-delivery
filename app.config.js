require('dotenv').config();

module.exports = ({ config }) => {
  const appEnv = process.env.APP_ENV || process.env.NODE_ENV || 'development';
  const apiBaseUrl =
    process.env.EXPO_PUBLIC_API_URL ||
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    process.env.API_BASE_URL ||
    (config.extra && config.extra.apiBaseUrl) ||
    'http://localhost:8080';

  const wsUrl =
    process.env.EXPO_PUBLIC_WS_URL ||
    process.env.WS_URL ||
    (config.extra && config.extra.wsUrl) ||
    (apiBaseUrl.startsWith('https://')
      ? `${apiBaseUrl.replace(/^https:\/\//, 'wss://')}/ws`
      : `${apiBaseUrl.replace(/^http:\/\//, 'ws://')}/ws`);

  const easProjectId =
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
    process.env.EAS_PROJECT_ID ||
    (config.extra && config.extra.eas && config.extra.eas.projectId) ||
    null;
    
  const owner = process.env.EXPO_PUBLIC_OWNER || process.env.EXPO_OWNER || config.owner || 'rpbs454s-team';
  const slug = process.env.EXPO_PUBLIC_SLUG || process.env.EXPO_SLUG || config.slug || 'foodie';

  const extraConfig = {
    ...config.extra,
    appEnv,
    apiBaseUrl,
    wsUrl,
  };

  if (easProjectId) {
    extraConfig.eas = { projectId: easProjectId };
  }

  return {
    ...config,
    name: appEnv === 'production' ? 'Foodie Delivery' : `Foodie Delivery (${appEnv})`,
    slug,
    owner,
    version: '0.1.0',
    orientation: 'portrait',
    icon: './src/assets/icon.png',
    userInterfaceStyle: 'automatic',
    scheme: 'foodie-delivery',
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.foodie.delivery',
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './src/assets/android-icon-foreground.png',
        backgroundImage: './src/assets/android-icon-background.png',
        monochromeImage: './src/assets/android-icon-monochrome.png',
      },
      package: 'com.foodie.delivery',
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'https',
              host: 'app.foodie.example',
              pathPrefix: '/',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    web: {
      favicon: './src/assets/favicon.png',
    },
    plugins: [
      'expo-asset',
      'expo-font',
      'expo-secure-store',
      'expo-notifications',
      [
        'expo-image-picker',
        {
          photosPermission: 'Allow Foodie Delivery to upload your profile photo for KYC.',
        },
      ],
      'expo-document-picker',
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'Allow Foodie Delivery to use your location while online for delivery offers and assignment tracking.',
          isAndroidBackgroundLocationEnabled: true,
          isIosBackgroundLocationEnabled: true,
        },
      ],
    ],
    extra: extraConfig,
  };
};
