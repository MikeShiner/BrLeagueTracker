import { Server } from './server';

export const app = new Server();
if (process.env.devMode) app.loadDevModeDefaults();
