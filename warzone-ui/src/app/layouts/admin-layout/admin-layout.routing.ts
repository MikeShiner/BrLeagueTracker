import { Routes } from "@angular/router";

import { LeaderboardComponent } from "src/app/pages/leaderboard/leaderboard.component";
import { ScoreboardComponent } from "src/app/pages/scoreboard/scoreboard.component";
// import { RtlComponent } from "../../pages/rtl/rtl.component";

export const AdminLayoutRoutes: Routes = [
  { path: "scoreboards", component: ScoreboardComponent },
  { path: "leaderboard", component: LeaderboardComponent },
];
