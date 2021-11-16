const Action = require('./action');

module.exports = class Ping extends Action {
  constructor(navigationContext, cmd) {
    super(navigationContext, cmd, ['admin', 'moderator', 'user'], {
      individualCooldown: 10,
      individualSpamThreshold: 1,
      individualDailyThreshold: 5,
    });
  }

  async do() {
    this.sendMessage('PONG 🏓');
  }
};
