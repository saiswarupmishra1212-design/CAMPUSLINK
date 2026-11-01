import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.campuslink.app',
  appName: 'CampusLink',
  webDir: 'dist',
  server: {
    // Change this IP to your server's actual local/hosted IP when testing on device
    // For production, replace with your hosted backend URL
    url: 'http://10.0.2.2:5000',   // 10.0.2.2 = Android emulator → localhost
    cleartext: true,               // allow HTTP (needed for local dev)
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
