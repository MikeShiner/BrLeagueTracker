import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HttpClientModule } from "@angular/common/http";
import { RouterModule } from "@angular/router";
import { ToastrModule } from "ngx-toastr";

import { AppComponent } from "./app.component";
import { AdminLayoutComponent } from "./layouts/admin-layout/admin-layout.component";

import { NgbModule } from "@ng-bootstrap/ng-bootstrap";

import { AppRoutingModule } from "./app-routing.module";
import { ComponentsModule } from "./components/components.module";
import { LeaderboardComponent } from "./pages/leaderboard/leaderboard.component";
import { ScoreboardComponent } from "./pages/scoreboard/scoreboard.component";
import { TrackerService } from "./services/tracker.service";

import { MatTabsModule } from "@angular/material/tabs";
import { RulesComponent } from "./pages/rules/rules.component";
import { RegisterComponent } from "./pages/register/register.component";
import { OrdinalDatePipe } from "./pipes/ordinal-date.pipe";
import {
  NgxGoogleAnalyticsModule,
  NgxGoogleAnalyticsRouterModule,
} from "ngx-google-analytics";
import { environment } from "src/environments/environment";
@NgModule({
  imports: [
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    ComponentsModule,
    NgbModule,
    RouterModule,
    AppRoutingModule,
    ToastrModule.forRoot(),
    MatTabsModule,
    ReactiveFormsModule,
    NgxGoogleAnalyticsModule.forRoot(
      environment.production ? "G-3FV4WBE7FW" : ""
    ),
    NgxGoogleAnalyticsRouterModule,
  ],
  declarations: [
    AppComponent,
    AdminLayoutComponent,
    LeaderboardComponent,
    ScoreboardComponent,
    RulesComponent,
    RegisterComponent,
    OrdinalDatePipe,
  ],
  providers: [TrackerService],
  bootstrap: [AppComponent],
})
export class AppModule {}
