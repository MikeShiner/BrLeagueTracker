import { BehaviorSubject } from 'rxjs';
import { Config } from './config';
import {
  Captain,
  KillboardEntry,
  LeaderboardEntry,
  Match,
  MatchScoreboard,
  PlayerAward,
  PlayerScore,
  TeamScoreboards,
} from './types';
import DeepClone from 'clone-deep';
export class Runner {
  teamScoreboardUpdates$: BehaviorSubject<TeamScoreboards[]> = new BehaviorSubject<TeamScoreboards[]>([]);
  leaderboardUpdates$: BehaviorSubject<LeaderboardEntry[]> = new BehaviorSubject<LeaderboardEntry[]>([]);
  killboardUpdates$: BehaviorSubject<KillboardEntry[]> = new BehaviorSubject<KillboardEntry[]>([]);
  playerAwards: PlayerAward[] = [];

  private API = require('call-of-duty-api')({
    platform: 'battle',
    ratelimit: { maxRequests: 1, perMilliseconds: 2000 },
  });

  constructor(private config: Config, private username: string, private password: string) {}

  setConfig(config: Config) {
    this.config = config;
  }

  async runnerLoop() {
    console.log('runnerLoop', this.config);
    console.log('Runner loop started at ', new Date());
    let teamScoreboardLocalCache: TeamScoreboards[] = [];
    for (let captain of this.config.captains) {
      const captainsMatches: Match[] = await this.filterLast20Matches(captain);
      const wholeTeamMatches: Match[][] = await this.loadFullDetailMatches(captain, captainsMatches);
      const teamScoreboard: TeamScoreboards = this.calculateTeamScoreboards(captain, wholeTeamMatches);

      teamScoreboardLocalCache.push(teamScoreboard);
      console.log('Captain ' + captain.id + ' completed.');
    }
    // Add collection to load cache for first WS pulls. Sort teams in alphabetical order.
    teamScoreboardLocalCache = teamScoreboardLocalCache.sort((a, b) =>
      a.captain.teamName.localeCompare(b.captain.teamName)
    );

    let { killboard, leaderboard } = this.calculateLeaderboards(teamScoreboardLocalCache);

    // Check to see if tournament has ended. Declare the winner if so.
    let totalGamesPlayed = 0;
    teamScoreboardLocalCache.forEach((board) => (totalGamesPlayed = totalGamesPlayed + board.scoreboards.length));
    if (
      teamScoreboardLocalCache.length > 0 &&
      this.config.numberOfGames * teamScoreboardLocalCache.length === totalGamesPlayed
    ) {
      leaderboard[0].winner = true;
      // calculate awards
      this.playerAwards = this.calculateAwards(killboard);
      console.log(`Tournament Ended at ${new Date().toISOString()}, winner is: ${leaderboard[0].team}`);
    }

    this.teamScoreboardUpdates$.next(teamScoreboardLocalCache);
    this.killboardUpdates$.next(killboard);
    this.leaderboardUpdates$.next(leaderboard);

    console.log('Runner cycle complete');
  }

  async login() {
    console.log('Logging in..');
    try {
      const loginOutput = await this.API.login(this.username, this.password);
      console.log(loginOutput);
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  /**
   * Produces 5 games from start time or latest 5 games. It will filter out blacklisted games.
   * @param captain Captain to get last 5 games for.
   */
  private async filterLast20Matches(captain: Captain) {
    let data = await this.API.MWcombatwz(captain.id, 'acti');

    // Filter out any blacklisted matches
    if (this.config.blacklistMatches && this.config.blacklistMatches.length > 0) {
      data.matches = data.matches.filter((m: Match) => this.config.blacklistMatches.indexOf(m.matchID) === -1);
    }

    if (this.config.startTime) {
      // Filter by startTime
      data.matches = data.matches.filter((m: Match) => new Date(m.utcStartSeconds * 1000) > this.config.startTime);
      // Select ealiest 5 games from startTime
      data.matches = data.matches.slice(Math.max(data.matches.length - this.config.numberOfGames, 0));
    } else {
      // Otherwise just select latest 5 games
      data.matches = data.matches.slice(0, this.config.numberOfGames);
    }
    return data.matches;
  }

  /**
   * Produces full match details for each player in each game. Double array here is Game by Player Match.
   * i.e.[[Player, Player, Player], [Game 2]]
   * @param captain Captain
   * @param matches 5 of the captain's matches to get full player details for
   */
  private async loadFullDetailMatches(captain: Captain, matches: Match[]) {
    let teamPlayerMatches: Match[][] = [];
    for (let match of matches) {
      let fullMatch: { allPlayers: Match[] } = await this.API.MWFullMatchInfowz(match.matchID, 'acti');
      let teamMatch: Match[] = fullMatch.allPlayers.filter((players) => players.player.team === match.player.team);
      teamPlayerMatches.push(teamMatch);
    }
    return teamPlayerMatches;
  }

  private calculateTeamScoreboards(captain: Captain, gameByPlayerMatches: Match[][]) {
    let teamScoreboard: TeamScoreboards = {
      captain,
      scoreboards: [],
    };

    gameByPlayerMatches.forEach((game: Match[]) => {
      let matchScoreboard: MatchScoreboard = this.extractMatchMetadata(game[0]);
      matchScoreboard.players = [];
      game.forEach((playerMatch) => {
        let playerScore: PlayerScore = {
          name: playerMatch.player.username,
          clanTag: playerMatch.player.clantag,
          kills: playerMatch.playerStats.kills,
          deaths: playerMatch.playerStats.deaths,
          kd: playerMatch.playerStats.kdRatio,
          damage: playerMatch.playerStats.damageDone,
          revives: playerMatch.playerStats.objectiveReviver ?? 0,
          longestKillStreak: playerMatch.playerStats.longestStreak ?? 0,
          gulagKills: playerMatch.playerStats.gulagKills,
          gulagDeaths: playerMatch.playerStats.gulagDeaths,
        };
        matchScoreboard.players.push(playerScore);
      });
      let totalKills = matchScoreboard.players.reduce((a, b) => a + b.kills, 0);
      matchScoreboard.matchMetadata.totalKills = totalKills;
      matchScoreboard.matchMetadata.killPoints = this.applyKillCountBonus(totalKills);
      matchScoreboard.matchMetadata.totalPoints =
        matchScoreboard.matchMetadata.killPoints + matchScoreboard.matchMetadata.placementPoints;
      teamScoreboard.scoreboards.push(matchScoreboard);
    });
    return teamScoreboard;
  }

  /**
   * Calculate both Team Leaderboard & Kill Scoreboard
   * @param allTeamScoreboards
   */
  private calculateLeaderboards(
    allTeamScoreboards: TeamScoreboards[]
  ): { killboard: KillboardEntry[]; leaderboard: LeaderboardEntry[] } {
    let killboard: KillboardEntry[] = [];
    let leaderboard: LeaderboardEntry[] = [];
    for (let team of allTeamScoreboards) {
      let totalTeamKills = 0;
      let totalTeamPoints = 0;

      for (let scoreboard of team.scoreboards) {
        // Sum total kills & points each games for a team
        totalTeamKills += scoreboard.matchMetadata.totalKills;
        totalTeamPoints += scoreboard.matchMetadata.totalPoints;

        scoreboard.players.forEach((player) => {
          let killboardPlayerIndex = killboard.findIndex((entry) => entry.name === player.name);
          // Update player's kill record
          if (killboardPlayerIndex < 0) {
            killboard.push({
              name: player.name,
              kills: player.kills,
              team: team.captain.teamName,
              damage: player.damage,
              revives: player.revives,
              deaths: player.deaths,
              gulagKills: player.gulagKills,
              gulagDeaths: player.gulagDeaths,
            });
          } else {
            killboard[killboardPlayerIndex].kills += player.kills;
            killboard[killboardPlayerIndex].damage += player.damage ?? 0;
            killboard[killboardPlayerIndex].revives += player.revives ?? 0;
            killboard[killboardPlayerIndex].deaths += player.deaths ?? 0;
            killboard[killboardPlayerIndex].gulagKills += player.gulagKills ?? 0;
            killboard[killboardPlayerIndex].gulagDeaths += player.gulagDeaths ?? 0;
          }
        });
      }
      leaderboard.push({
        team: team.captain.teamName,
        totalKills: totalTeamKills,
        points: totalTeamPoints,
        gamesPlayed: team.scoreboards.length,
      });
    }
    // Sorting & work out player's position
    leaderboard = leaderboard.sort((a, b) => (a.points - b.points) * -1);
    killboard = killboard.sort((a, b) => {
      // If kills are the same, sort on highest damage, otherwise sort on kills
      if (a.kills - b.kills === 0) return (a.damage - b.damage) * -1;
      return (a.kills - b.kills) * -1;
    });

    let pos = 1;
    let killsToBeat = 0;
    killboard.forEach((e) => {
      if (e.kills >= killsToBeat) {
        e.pos = pos;
      } else {
        pos++;
        e.pos = pos;
      }
      killsToBeat = e.kills;
    });
    return { killboard, leaderboard };
  }

  private calculateAwards(killboard: KillboardEntry[]): PlayerAward[] {
    let playerAwards: PlayerAward[] = [];

    // Medic - Most Revives
    let reviveboard = this.killboardSecondSortOnDamage(DeepClone(killboard), 'revives');
    playerAwards.push({
      awardName: 'Medic Of The Week',
      description: 'Most Revives',
      icon: 'medic',
      playerName: reviveboard[0].name,
      team: reviveboard[0].team,
      value: reviveboard[0].revives + ' Revives',
    });

    // Most Deaths
    let deathboard = this.killboardSecondSortOnDamage(DeepClone(killboard), 'deaths');
    playerAwards.push({
      awardName: 'Meat Shield',
      icon: 'death',
      description: 'Most Deaths',
      playerName: deathboard[0].name,
      team: deathboard[0].team,
      value: deathboard[0].deaths + ' Deaths',
    });

    let gulagRatioBoard = DeepClone(killboard).sort((a, b) => {
      let sortResult =
        this.calculateGulagWinRate(a.gulagKills, a.gulagDeaths) -
        this.calculateGulagWinRate(b.gulagKills, b.gulagDeaths);
      if (sortResult == 0) {
        return a.gulagKills - b.gulagKills * -1;
      }
      return sortResult * -1;
    });
    playerAwards.push({
      awardName: 'Survivor',
      description: 'Best Gulag Win Rate',
      playerName: gulagRatioBoard[0].name,
      icon: 'grave',
      team: gulagRatioBoard[0].team,
      value: `${this.calculateGulagWinRate(
        gulagRatioBoard[0].gulagKills,
        gulagRatioBoard[0].gulagDeaths
      )}% Gulags Won (${gulagRatioBoard[0].gulagKills} Wins)`,
    });
    return playerAwards;
  }

  /*******
   * Helper Functions
   *******/

  /**
   * Takes any player's match and produces the game's metadata. Metadata will be the same for all player matches in the same squad.
   * So any player's match will do.
   * @param match
   */

  private calculateGulagWinRate(kills: number, deaths: number) {
    if (kills === 0 || kills + deaths === 0) return 0;
    return (kills / (kills + deaths)) * 100;
  }

  public killboardSecondSortOnDamage(arr: KillboardEntry[], sortKey: string) {
    return arr.sort((a, b) => {
      if (a[sortKey] - b[sortKey] === 0) return (a.damage - b.damage) * -1;
      return (a[sortKey] - b[sortKey]) * -1;
    });
  }

  public generateDefaultUpdates() {
    let teamScoreboards: TeamScoreboards[] = [];
    let leaderboard: LeaderboardEntry[] = [];

    for (let captain of this.config.captains) {
      teamScoreboards.push({
        captain,
        scoreboards: [],
      });

      leaderboard.push({
        team: captain.teamName,
        totalKills: 0,
        gamesPlayed: 0,
        points: 0,
      });
    }

    this.teamScoreboardUpdates$.next(teamScoreboards);
    this.leaderboardUpdates$.next(leaderboard);
  }

  private extractMatchMetadata(match: Match): MatchScoreboard {
    return {
      matchMetadata: {
        matchId: match.matchID,
        timestamp: new Date(match.utcStartSeconds * 1000),
        placement: match.playerStats.teamPlacement,
        placementDisplay: this.getPlacementOrdinalNum(match.playerStats.teamPlacement),
        placementPoints: this.applyPlacementBonus(match.playerStats.teamPlacement),
        duration: {
          value: match.duration,
          displayValue: '',
        },
      },
    };
  }

  private applyKillCountBonus = (kills: number) => {
    if (kills <= 5) return kills;
    if (kills <= 10) return (kills - 5) * 2 + 5;
    if (kills <= 15) return (kills - 10) * 3 + 15;
    if (kills > 15) return (kills - 15) * 4 + 30;
  };

  private applyPlacementBonus = (placement: number) => {
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

  /**
   * Adds placement to ordinal (1st, 2nd, 3rd etc.)
   * @param n
   */
  private getPlacementOrdinalNum(n: number) {
    return n + (n > 0 ? ['th', 'st', 'nd', 'rd'][(n > 3 && n < 21) || n % 10 > 3 ? 0 : n % 10] : '');
  }

  async checkCaptainExists(captainId: string) {
    // Will throw exception if captain does not exist
    let data = await this.API.MWcombatwz(captainId, 'acti');
    if (Object.keys(data).length == 0) throw new Error('No Player Data');
    return data;
  }
}
