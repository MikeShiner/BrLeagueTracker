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
  private apiEndpoint: string;
  private websocketEndpoint: string;

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
    this.discoverEndpoints();
    this.ws = new WebSocket(this.websocketEndpoint);
    this.ws.onmessage = ({ data }) => {
      let msg = JSON.parse(data);
      console.log(msg);
      if (msg.type === "config") {
        this._config = msg.config;
        this.config$.next(msg.config);
        this.awards = [];
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

  private discoverEndpoints() {
    const hostname = window && window.location && window.location.hostname;

    if (/^.*localhost.*/.test(hostname)) {
      this.apiEndpoint = "http://localhost:8080";
      this.websocketEndpoint = "ws://localhost:8080";
    } else if (/^.*brleagues.*/.test(hostname)) {
      this.apiEndpoint = "https://brleagues.com";
      this.websocketEndpoint = "wss://brleagues.com";
    } else {
      console.warn(`Cannot find environment for host name ${hostname}`);
    }
  }

  submitCaptainRegistration(
    captainId: string,
    teamName: string,
    platform: string
  ) {
    return this._http.post(`${this.apiEndpoint}/captains/register`, {
      timestamp: new Date().toISOString(),
      teamName,
      captainId,
      platform,
    });
  }

  getAllRegisteredCpatains() {
    return this._http.get<RegisteredCaptain[]>(`${this.apiEndpoint}/captains`);
  }

  getAwards() {
    this._http
      .get<PlayerAward[]>(`${this.apiEndpoint}/awards`)
      .subscribe((res) => (this.awards = res));
  }
}
