const Action = require('./action');

// TODO
module.exports = class DailySnap extends Action {
  constructor(navigationContext, cmd) {
    super(navigationContext, cmd, ['admin', 'moderator', 'user']);
  }

  async do() {
    this.sendMessage('FEATURE IN PROGRESS');
  }
};
