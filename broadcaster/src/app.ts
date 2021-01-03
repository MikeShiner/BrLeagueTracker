import { Server } from './server';

export const app = new Server(!!process.env.ssl);
if (process.env.devMode) app.loadDevModeDefaults();
