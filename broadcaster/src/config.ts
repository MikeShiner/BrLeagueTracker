import { Captain } from './types';

export interface Config {
  startTime?: Date;
  playlistThisWeek: string;
  numberOfGames: number;
  refreshTimeSeconds: number;
  captains: Captain[];
}

export const config: Config = {
  startTime: process.env.startTime ? new Date(process.env.startTime) : undefined,
  playlistThisWeek: "BR Trio's",
  numberOfGames: 5,
  refreshTimeSeconds: 120,
  captains: [
    { platform: 'atvi', id: 'JayyDM21#8298228', teamName: 'Justice 4 Van Dijks Leg' },
    { platform: 'atvi', id: 'TheGreatSlav#4543432', teamName: 'Pussy Slayers of Verdansk' },
    { platform: 'psn', id: 'durrant1993', teamName: 'CoD and Chips' },
    { platform: 'atvi', id: 'Charlie6#7131618', teamName: 'Ra.aS' },
    { platform: 'atvi', id: 'zackody', teamName: 'PBW' },
    { platform: 'atvi', id: 'Bastable#7922822', teamName: 'Murder On Verdansk Floor' },
    { platform: 'atvi', id: 'Captainjoo#7115956', teamName: 'Princesses of Verdansk' },
    { platform: 'xbl', id: 'Redeyeguy42', teamName: "Gulag 'em By The Pussy" },
  ],
};
