import express, { Request, Response } from 'express';
import { app } from './app';
import { CaptainCollection } from './types/captain.collection';
const router: express.Router = express.Router();

// New Config
router.post('/config', function (req: Request, res: Response) {
  let newConfig = req.body;
  app.config.updateConfig(
    newConfig.captains,
    newConfig.playlistThisWeek,
    newConfig.weekNumber,
    newConfig.numberOfGames,
    newConfig.startTime,
    newConfig.blacklistMatches
  );
  app.loadNewConfig();
  res.sendStatus(200);
});

// New Config
router.post('/runner', function (req: Request, res: Response) {
  if (req.query.loop === 'true') {
    console.log('Request to start Loop...');
    app.startLoop();
  }
  if (req.query.loop === 'false') {
    console.log('Request to stop Loop...');
    app.stopLoop();
  }
  res.sendStatus(200);
});

// Get all registered Captains
router.get('/captains', async (req: Request, res: Response) => {
  const allCaptains = await app.database.getRegisteredCaptains(app.config.startTime.toISOString());
  res.send(allCaptains);
});

// Captain Registration
router.post('/captains/register', async (req: Request, res: Response) => {
  console.log('New captain registration');
  if (!app.config) {
    console.log('No config found!');
    res.send(500);
    return;
  }

  let request: CaptainCollection = req.body;
  request.startTime = app.config.startTime.toISOString();
  try {
    await app.runner.checkCaptainExists(request.captainId, request.platform);
  } catch (err) {
    res
      .status(400)
      .send({ message: 'Cannot find user. Please ensure platform is correct and profile is set to public.' });
    return;
  }
  try {
    await app.database.InsertNewRegisteredCaptain(request);
    app.config.addCaptain(request.captainId, request.teamName, request.platform);
    app.loadNewConfig();

    res.status(200).send({ message: 'OK' });
  } catch (err) {
    let message = err;
    if (!!err.message) {
      message = 'Error submitting Captain. Please ask support.';
      console.error('Captain Registration Error: ', err.message);
      console.error(request);
    }
    res.status(400).send({ message, ex: err });
  }
});

router.get('/awards', (req: Request, res: Response) => {
  res.send(app.runner.playerAwards);
});

export = router;
