import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

const executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
  (existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined);

export default defineConfig({
  testDir:'./tests',
  fullyParallel:true,
  workers:2,
  timeout:20000,
  use:{
    baseURL:'http://127.0.0.1:4173',
    viewport:{width:390,height:844},
    isMobile:true,
    hasTouch:true,
    launchOptions:{executablePath},
  },
  webServer:{
    command:'node tests/server.mjs',
    url:'http://127.0.0.1:4173',
    reuseExistingServer:!process.env.CI,
  },
});
