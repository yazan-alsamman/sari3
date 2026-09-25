import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.hoshblass.sareee.client",
  appName: "سريع حوش بلاس",
  webDir: "out",
  server: {
    androidScheme: "https",
  },
  plugins: {
    SpeechRecognition: {
      // Native STT permissions requested at runtime via the plugin
    },
  },
};

export default config;
