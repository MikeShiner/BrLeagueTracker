import { Captain } from './types';

export interface Config {
  startTime?: Date;
  numberOfGames: number;
  refreshTimeSeconds: number;
  captains: Captain[];
}

export const config: Config = {
  startTime: new Date('2020-10-18T08:30:00Z'),
  numberOfGames: 5,
  refreshTimeSeconds: 120,
  captains: [
    { platform: 'atvi', id: 'Warscyther', teamName: 'Brothers In Arms' },
    { platform: 'psn', id: 'TAdams944', teamName: 'Callout LichVegas' },
    { platform: 'psn', id: 'durrant1993', teamName: 'CoD and Chips' },
    { platform: 'psn', id: 'TinyEggMan', teamName: 'Ultra Legends Pheonix Rebirth' },
    { platform: 'atvi', id: 'Bastable#7922822', teamName: 'Balltrick' },
  ],
};
