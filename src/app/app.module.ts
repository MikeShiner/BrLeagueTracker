import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ScoreboardComponent } from './scoreboard/scoreboard.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatTabsModule } from '@angular/material/tabs';
import { LeaderboardComponent } from './leaderboard/leaderboard.component';
import { CountdownModule } from 'ngx-countdown';
@NgModule({
  declarations: [AppComponent, ScoreboardComponent, LeaderboardComponent],
  imports: [BrowserModule, AppRoutingModule, HttpClientModule, BrowserAnimationsModule, MatTabsModule, CountdownModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
