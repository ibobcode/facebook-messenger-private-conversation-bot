const Action = require('./action');

module.exports = class Ping extends Action {
  constructor(navigationContext, cmd) {
    super(navigationContext, cmd, ['admin', 'moderator', 'user']);
  }

  async do() {
    this.sendMessage('PONG 🏓');
  }
};
