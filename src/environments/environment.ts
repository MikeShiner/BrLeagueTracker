// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  apiKey: '4eddc983-a606-4b87-bebd-53bc71fba426',
  proxyUrl: 'http://localhost:8080',
  startTime: '2020-10-14T16:30:00Z',
  captains: [
    { platform: 'atvi', id: 'Warscyther', teamName: 'Brothers In Arms' },
    { platform: 'psn', id: 'TAdams944', teamName: 'Slavtastic' },
  ],
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.