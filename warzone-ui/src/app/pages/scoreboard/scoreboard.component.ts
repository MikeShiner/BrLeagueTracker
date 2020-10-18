import { Component, OnInit } from "@angular/core";
import { TrackerService } from "src/app/services/tracker.service";

@Component({
  selector: "app-scoreboard",
  templateUrl: "./scoreboard.component.html",
  styleUrls: ["./scoreboard.component.scss"],
})
export class ScoreboardComponent implements OnInit {
  constructor(private tracker: TrackerService) {}

  ngOnInit(): void {}
}
