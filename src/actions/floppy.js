const Action = require('./action');
const utils = require('../utils.js');

// TODO
module.exports = class DailySnap extends Action {
  constructor(navigationContext, cmd) {
    super(navigationContext, cmd, ['admin', 'moderator'], {
      groupDailyThreshold: 1,
      individualDailyThreshold: 1,
    });
  }

  async do() {
    if (this.cmd.tokens[1] && this.cmd.tokens[1].string == 'real') {
      await utils.megaNameDL('floppy.gif');
      await this.sendFile('floppy.gif');
    } else {
      await utils.megaNameDL('floppy.jpeg');
      await this.sendFile('floppy.jpeg');
    }
  }
};
