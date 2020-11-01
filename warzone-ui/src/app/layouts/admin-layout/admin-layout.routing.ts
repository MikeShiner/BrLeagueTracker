import { Routes } from "@angular/router";

import { LeaderboardComponent } from "src/app/pages/leaderboard/leaderboard.component";
import { RulesComponent } from "src/app/pages/rules/rules.component";
import { ScoreboardComponent } from "src/app/pages/scoreboard/scoreboard.component";

export const AdminLayoutRoutes: Routes = [
  { path: "scoreboards", component: ScoreboardComponent },
  { path: "leaderboards", component: LeaderboardComponent },
  { path: "rules", component: RulesComponent },
];
