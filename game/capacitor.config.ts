import type { CapacitorConfig } from '@capacitor/cli';

// Capacitor config for wrapping the PWA build into Android / iOS shells.
// To generate native projects, run (inside `game/`):
//   npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
//   npm run build
//   npx cap add android && npx cap add ios
//   npx cap copy && npx cap sync
const config: CapacitorConfig = {
  appId: 'ai.cognition.devin.chronicleofdevilgods',
  appName: 'Chronicle of Devil Gods',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
  },
  ios: {
    contentInset: 'always',
  },
};

export default config;
