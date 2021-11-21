'use strict';
require('dotenv').config();
const utils = require('./src/utils');
const chalk = require('chalk');
const NavigationManager = require('./src/navigationManager');
const UpOrDownServer = require('./src/upOrDownServer');
const fs = require('fs');

let nm = null;

// Entrypoint to start the bot (or restart it if it has crashed)
async function start(hasCrashed = false) {
  if (hasCrashed) console.error(chalk.red.inverse('⏱ RETRY'));

  const dir = './tmp';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  nm = new NavigationManager(hasCrashed);
  if (process.env.ENV === 'production' && !hasCrashed) {
    UpOrDownServer();
  }

  // Clearing the temp files from last run
  utils.cleanTmpFiles();
  await nm.initDependencies();
  await nm.initConversationPage();
  await nm.websocketConnection();
}

process.on('unhandledRejection', async (reason, p) => {
  crashed = true;
  console.error(chalk.red.inverse('💀 CONV BOT CRASHED'));
  console.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
  nm.close();
  nm = null;
  setTimeout(() => start(true), 5000);
});

start();
