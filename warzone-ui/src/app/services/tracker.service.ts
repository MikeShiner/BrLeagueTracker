import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { environment } from "src/environments/environment";
import { Config } from "./models/config";
import {
  KillboardEntry,
  LeaderboardEntry,
  PlayerAward,
  RegisteredCaptain,
  TeamScoreboard,
} from "./models/server-models";

@Injectable({
  providedIn: "root",
})
export class TrackerService {
  private _leaderboard: LeaderboardEntry[] = [];
  leaderboard$: BehaviorSubject<LeaderboardEntry[]> = new BehaviorSubject([]);

  private _teamScoreboard: TeamScoreboard[];
  teamScoreboard$: BehaviorSubject<TeamScoreboard[]> = new BehaviorSubject([]);

  private _killboard: KillboardEntry[];
  killboard$: BehaviorSubject<KillboardEntry[]> = new BehaviorSubject([]);

  private _config: Config;
  config$: BehaviorSubject<Config> = new BehaviorSubject(null);
  get config() {
    return this.config$.value;
  }
  public awards: PlayerAward[];

  private ws: WebSocket;
  constructor(private _http: HttpClient) {
    this.ws = new WebSocket(`${environment.websocketEndpoint}`);
    this.ws.onmessage = ({ data }) => {
      let msg = JSON.parse(data);
      console.log(msg);
      if (msg.type === "config") {
        this._config = msg.config;
        this.config$.next(msg.config);
      } else if (msg.type === "leaderboard") {
        console.log(msg);
        this._leaderboard = msg.leaderboard;
        if (msg.leaderboard[0]?.winner) this.getAwards();
        this.leaderboard$.next(msg.leaderboard);
      } else if (msg.type === "teamScoreboards") {
        this._teamScoreboard = msg.teamScoreboard;
        this.teamScoreboard$.next(msg.teamScoreboard);
      } else if (msg.type === "killboard") {
        this._killboard = msg.killboard;
        this.killboard$.next(msg.killboard);
      }
    };
  }

  submitCaptainRegistration(
    captainId: string,
    teamName: string,
    mobile: string
  ) {
    return this._http.post(`${environment.api}/captains/register`, {
      timestamp: new Date().toISOString(),
      teamName,
      captainId,
      mobile,
    });
  }

  getAllRegisteredCpatains() {
    return this._http.get<RegisteredCaptain[]>(`${environment.api}/captains`);
  }

  getAwards() {
    this._http
      .get<PlayerAward[]>(`${environment.api}/awards`)
      .subscribe((res) => (this.awards = res));
  }
}
