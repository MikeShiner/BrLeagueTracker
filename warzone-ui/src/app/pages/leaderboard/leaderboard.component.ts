import { Component, OnInit } from "@angular/core";
import { TrackerService } from "src/app/services/tracker.service";

@Component({
  selector: "app-leaderboard",
  templateUrl: "./leaderboard.component.html",
  styleUrls: ["./leaderboard.component.scss"],
})
export class LeaderboardComponent implements OnInit {
  constructor(public trackerService: TrackerService) {}

  ngOnInit(): void {}
}
