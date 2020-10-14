import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Subscribable, Subscription } from 'rxjs';
import { LeaderboardEntry } from '../models/leaderboard-entry';
import { TeamScoreboard } from '../models/team-scoreboard';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss'],
})
export class LeaderboardComponent implements OnInit, OnDestroy {
  @Input() teamScoreboard$: BehaviorSubject<TeamScoreboard[]>;
  leaderboard: LeaderboardEntry[] = [];
  private teamboardSub: Subscription;
  constructor() {}

  ngOnInit(): void {
    this.teamboardSub = this.teamScoreboard$.subscribe((teamBoards) => {
      let leadboard = [];
      teamBoards.map((team) => {
        let teamKillCount = 0;
        let teamKillsScore = 0;
        let placementPoints = 0;
        team.data.forEach((match) => {
          placementPoints += this.applyPlacementBonus(
            match.players[0].metadata.placement.value
          );
          let matchKills = 0;
          match.players.forEach((perf) => {
            teamKillCount += perf.stats.kills.value;
            matchKills += perf.stats.kills.value;
          });
          teamKillsScore += this.applyKillCountBonus(matchKills);
        });
        console.log('teamKillsScore', teamKillsScore);
        console.log('placementPoints', placementPoints);
        let points = teamKillsScore + placementPoints;
        leadboard.push({
          team: team.captain.teamName,
          killCount: teamKillCount,
          points,
        });
      });
      console.log('LEADBOARD', leadboard);
      // Sort by score!
      this.leaderboard = leadboard;
    });
  }

  ngOnDestroy() {
    if (this.teamboardSub) this.teamboardSub.unsubscribe();
  }

  private applyKillCountBonus(kills: number) {
    if (kills <= 5) return kills;
    if (kills <= 10) return (kills - 5) * 2 + 5;
    if (kills <= 15) return (kills - 10) * 3 + 15;
    if (kills > 15) return (kills - 15) * 4 + 30;
  }

  private applyPlacementBonus(placement: number) {
    if (placement > 30) return 0;
    let placementScale = Array.from({ length: 30 }, (_, i) => i + 1).reverse();
    let baseScore = placementScale[placement - 1];
    if (placement == 1) baseScore += 15;
    if (placement == 2) baseScore += 12;
    if (placement == 3) baseScore += 9;
    if (placement == 4) baseScore += 6;
    if (placement == 5) baseScore += 3;
    return baseScore;
  }
}
