export interface CaptainCollection {
  week: number;
  game: number;
  timestamp: string;
  teamName: string;
  captain: {
    activisionId: string;
    mobile: number;
  };
}
