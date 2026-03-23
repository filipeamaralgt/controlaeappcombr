import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.controlae.app',
  appName: 'Controlaê',
  webDir: 'dist',
  // DEVELOPMENT: loads from Lovable preview (remove server block for production APK)
  server: {
    url: 'https://98d4bac3-6a74-44f9-b432-704135205842.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#0f172a',
      showSpinner: true,
      spinnerColor: '#22c55e',
      androidScaleType: 'CENTER_CROP',
    },
  },
  android: {
    backgroundColor: '#0f172a',
  },
};

export default config;
