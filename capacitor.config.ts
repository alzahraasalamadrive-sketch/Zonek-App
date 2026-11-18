import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zonak.app',
  appName: 'زونك — Zonak',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_zonak',
      iconColor: '#185FA5',
      sound: 'tea_chime.wav',
    },
  },
  android: {
    backgroundColor: '#F5F2EA',
    allowMixedContent: false,
  },
  ios: {
    backgroundColor: '#F5F2EA',
    contentInset: 'automatic',
  },
};

export default config;
