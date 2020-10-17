import Axios from 'axios';
import { config } from './config';
import { Captain, GameScoreboard, Match, TeamScoreboard } from './types';

export const getMatches = async (captain: Captain) => {
  let res = await Axios.get(
    `https://api.tracker.gg/api/v1/warzone/matches/${captain.platform}/${encodeURIComponent(captain.id)}`
  );

  let matches: Match[] = res.data.data.matches;
  // Filter matches which start before tournament start time
  if (config.startTime) {
    matches = matches.filter((match: Match) => new Date(match.metadata.timestamp) >= config.startTime);
    matches = matches.slice(-config.numberOfGames);
  } else {
    // If no tournament time set, select 5 latest games
    matches = matches.slice(0, config.numberOfGames);
  }
  return matches;
};

export const getTeamboard = async (captain: Captain, matches: Match[]): Promise<TeamScoreboard> => {
  const urls = matches.map((match) =>
    Axios.get(`https://api.tracker.gg/api/v1/warzone/matches/${match.attributes.id}`)
  );
  let res: any[] = await Promise.all(urls);
  let detailedMatches: Match[] = res.map((res) => res.data.data);

  // let teamName = matches[0].segments[0].attributes.team;
  detailedMatches.forEach((match) => {
    // Search toplevel match object for this specific match to find the teamname for the captain
    let teamName = matches.find((toplevelMatch) => toplevelMatch.attributes.id === match.attributes.id).segments[0]
      .attributes.team;
    match.segments = match.segments.filter((segment) => segment.attributes.team === teamName);
  });
  let scoreboards: GameScoreboard[] = detailedMatches.map((match) => {
    // Calculate total kills for each match
    let totalKills = 0;
    match.segments.forEach((seg) => (totalKills += seg.stats['kills'].value));
    // Map each detailedMatch into a GameScoreboard or Match Metadata and PlayerScores
    return {
      metadata: {
        timestamp: match.metadata.timestamp,
        placement: match.segments[0].metadata.placement.value,
        placementDisplay: match.segments[0].metadata.placement.displayValue,
        duration: match.metadata.duration,
        totalKills,
        killPoints: applyKillCountBonus(totalKills),
        placementPoints: applyPlacementBonus(match.segments[0].metadata.placement.value),
      },
      players: match.segments.map((seg) => {
        return {
          name: seg.attributes.platformUserIdentifier,
          clanTag: seg.metadata.clanTag,
          kills: seg.stats['kills'].value,
          deaths: seg.stats['deaths'].value,
          kd: seg.stats['kdRatio'].value,
          damage: seg.stats['damageDone'].value,
          revives: seg.stats['objectiveReviver']?.value ?? 0,
        };
      }),
    };
  });
  return {
    captain,
    scoreboards,
  };
};

const applyKillCountBonus = (kills: number) => {
  if (kills <= 5) return kills;
  if (kills <= 10) return (kills - 5) * 2 + 5;
  if (kills <= 15) return (kills - 10) * 3 + 15;
  if (kills > 15) return (kills - 15) * 4 + 30;
};

const applyPlacementBonus = (placement: number) => {
  if (placement > 30) return 0;
  let placementScale = Array.from({ length: 30 }, (_, i) => i + 1).reverse();
  let baseScore = placementScale[placement - 1];
  if (placement == 1) baseScore += 15;
  if (placement == 2) baseScore += 12;
  if (placement == 3) baseScore += 9;
  if (placement == 4) baseScore += 6;
  if (placement == 5) baseScore += 3;
  return baseScore;
};
