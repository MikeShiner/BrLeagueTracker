import { Component, Input, OnInit } from '@angular/core';
import { Captain } from '../models/captain';
import { Match, Scoreboard } from '../models/scoreboard';

@Component({
  selector: 'app-scoreboard',
  templateUrl: './scoreboard.component.html',
  styleUrls: ['./scoreboard.component.scss'],
})
export class ScoreboardComponent implements OnInit {
  @Input() captain: Captain;
  @Input() matches: Match[];

  constructor() {}

  ngOnInit(): void {}
}
