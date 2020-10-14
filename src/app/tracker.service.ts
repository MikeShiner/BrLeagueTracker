import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { filter, map, mergeMap, tap, toArray } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Captain } from './models/captain';
import { Match, Scoreboard } from './models/scoreboard';

@Injectable({
  providedIn: 'root',
})
export class TrackerService {
  constructor(private _http: HttpClient) {}

  getMatches(captain: Captain): Observable<Match[]> {
    return this._http
      .get(
        `${environment.proxyUrl}/https://api.tracker.gg/api/v1/warzone/matches/${captain.platform}/${captain.id}`,
        {
          headers: {
            'TRN-Api-Key': environment.apiKey,
            'X-Requested-With': 'WarzoneApp',
          },
        }
      )
      .pipe(
        map((res: any) => {
          console.log(res);
          // Array of Matches with segment that has Team name. Need to match Team name up with match ID for filtering
          return res.data.matches.map((match) => {
            return {
              matchId: match.attributes.id,
              team: match.segments[0].attributes.team,
            };
          });
        }),
        map((matches: { matchId: string; team: string }[]) => {
          console.log('Ordering', matches);
          // Select 5 matches.
          return matches.slice(0, 7);
        }),
        mergeMap((matches: { matchId: string; team: string }[]) =>
          // Take array of matches and resolve each one, filter the matches based on StartTime,
          // Filter out other teams from the matches
          // Calculate totalKills
          // Compile into an array & select the oldest 5 games from the list of 7
          from(matches).pipe(
            mergeMap((matches: { matchId: string; team: string }) =>
              this._http
                .get(
                  `${environment.proxyUrl}/https://api.tracker.gg/api/v1/warzone/matches/${matches.matchId}`
                )
                .pipe(
                  filter((singleMatch: any) => {
                    let date = new Date(environment.startTime);
                    console.log(date);
                    return (
                      singleMatch.data.metadata.timestamp * 1000 >=
                      date.getTime()
                    );
                  }),
                  map((singleMatch: any) => {
                    let matchData = {
                      matchMetadata: singleMatch.data.metadata,
                      players: singleMatch.data.segments.filter(
                        (seg) => seg.attributes.team === matches.team
                      ),
                    };
                    matchData.matchMetadata.totalKills = 0;
                    matchData.players.forEach((player) => {
                      matchData.matchMetadata.totalKills =
                        matchData.matchMetadata.totalKills +
                        player.stats.kills.value;
                    });
                    console.log('Match Data: ', matchData);

                    return matchData;
                    // Apply Team filtering
                    // return singleMatch.data.segments.filter(
                    //   (seg) => seg.attributes.team === matches.team
                    // );
                  })
                )
            ),
            toArray()
          )
        ),
        map((finalArray) => {
          // Select 5 oldest matches from the final list (from original 7 resolved matches)
          console.log(finalArray.slice(1).slice(-5));
          return finalArray.slice(1).slice(-5);
        })
      );
  }
}
