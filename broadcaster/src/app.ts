import { Server } from './server2';

export const app = new Server();
if (process.env.devMode) app.loadDevModeDefaults();
