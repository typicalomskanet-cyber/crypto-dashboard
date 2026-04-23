import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'ai.devin.cryptodashboard',
  appName: 'Crypto Dashboard',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
}

export default config
