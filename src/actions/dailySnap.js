const Action = require('./action');
const utils = require('../utils.js');

// TODO
module.exports = class DailySnap extends Action {
  constructor(navigationContext, cmd) {
    super(navigationContext, cmd, ['admin', 'moderator', 'user'], {
      individualCooldown: 10,
      individualSpamThreshold: 1,
      individualDailyThreshold: 5,
    });
  }

  async do() {
    const megaFile = await utils.megaRandomDL();
    await this.sendFile(megaFile);
  }
};
