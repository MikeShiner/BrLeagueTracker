export interface CaptainCollection {
  week: number;
  timestamp: string;
  teamName: string;
  captain: {
    activisionId: string;
    number: number;
  };
}
