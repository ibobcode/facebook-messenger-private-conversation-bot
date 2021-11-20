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
    let fileName = null;
    if (this.cmd.tokens[1] && this.cmd.tokens[1].string == 'real') {
      fileName = await utils.dropboxDl({
        name: 'floppy.gif',
        path_lower: '/floppy.gif',
      });
    } else {
      fileName = await utils.dropboxDl({
        name: 'floppy.jpeg',
        path_lower: '/floppy.jpeg',
      });
    }
    await this.sendFile(fileName);
  }
};
