'use strict';
require('dotenv').config();
const utils = require('./src/utils');
const chalk = require('chalk');
const NavigationManager = require('./src/navigationManager');
const UpOrDownServer = require('./src/upOrDownServer');

let nm = null;

// Entrypoint to start the bot (or restart it if it has crashed)
async function start(hasCrashed = false) {
  nm = new NavigationManager(hasCrashed);
  if (process.env.ENV === 'production') {
    UpOrDownServer();
  }

  // Clearing the temp files from last run
  utils.cleanTmpFiles();
  await nm.initDependencies();
  await nm.initConversationPage();
  await nm.websocketConnection();
}

process.on('unhandledRejection', (reason, p) => {
  console.log(chalk.red.inverse('💀 CONV BOT CRASHED'));
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
  nm = null;
  // setTimeout(() => start(true), 5000);
});

start();
