import { Component, OnInit } from "@angular/core";
import { TrackerService } from "src/app/services/tracker.service";

@Component({
  selector: "app-leaderboard",
  templateUrl: "./leaderboard.component.html",
  styleUrls: ["./leaderboard.component.scss"],
})
export class LeaderboardComponent implements OnInit {
  tableType = "damage";
  data;
  constructor(public trackerService: TrackerService) {}

  fakeArray(length: number) {
    return new Array(length);
  }

  ngOnInit(): void {
    this.trackerService.killboard$.subscribe((board) => {
      board.sort((a, b) => a[this.tableType] - b[this.tableType] * -1);
      this.data = board;
    });
  }
}
