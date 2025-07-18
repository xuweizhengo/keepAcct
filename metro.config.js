const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    alias: {
      '@': './src',
      '@components': './src/components',
      '@services': './src/services',
      '@utils': './src/utils',
      '@types': './src/types',
      '@store': './src/store',
      '@screens': './src/screens',
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);