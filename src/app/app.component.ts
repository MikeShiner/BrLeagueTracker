import { Component, ViewChild } from '@angular/core';
import { CountdownComponent, CountdownConfig, CountdownEvent } from 'ngx-countdown';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Captain } from './models/captain';
import { TeamScoreboard } from './models/team-scoreboard';
import { TrackerService } from './tracker.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'BR League';

  @ViewChild('cd', { static: true }) private countdown: CountdownComponent;
  countConfig: CountdownConfig = {
    leftTime: 300,
    format: 'm:ss',
  };
  private isRefresh = false;

  startTime = new Date(environment.startTime);
  public captains: Captain[] = environment.captains;
  public teamScoreboards$: BehaviorSubject<TeamScoreboard[]> = new BehaviorSubject([]);

  constructor(private tracker: TrackerService) {
    this.generateScoreboard();
  }

  private generateScoreboard() {
    // Loop through each captain and retrieve scoreboard for last 5 games
    this.captains.forEach((captain) => {
      this.tracker.getMatches(captain).subscribe((data) => {
        if (this.isRefresh) {
          this.teamScoreboards$.next([]);
          this.isRefresh = false;
        }
        this.teamScoreboards$.next([...this.teamScoreboards$.getValue(), { captain: captain, data }]);
        console.log('teamScoreboards$', [...this.teamScoreboards$.getValue(), { captain: captain, data }]);
      });
    });
  }

  handleCountdownEvent(e: CountdownEvent) {
    console.log('countdown', e);
    if (e.action === 'done') {
      // this.countdown.stop();
      setTimeout(() => this.countdown.restart());
      this.isRefresh = true;
      this.generateScoreboard();
    }
  }
}
