const Action = require('./action');

module.exports = class Timeout extends Action {
  constructor(navigationContext, cmd) {
    super(navigationContext, cmd, ['admin', 'moderator']);
  }

  async do() {
    if (this.cmd.tokens.length != 3) {
      this.sendMessage(
        "Mauvais nombre d'arguments : !timeout <userId|tag> <minutes>",
      );
      return;
    }
    const timeout = parseFloat(this.cmd.tokens[2].string) * 1000 * 60;
    const end = Date.now() + timeout;
    const senderId = this.cmd.tokens[1].isTag
      ? this.cmd.tags[this.cmd.tokens[1].tagIndex]
      : this.cmd.tokens[1].string;
    const target = this.dbManager.users.filter(
      (u) => u.neoUserId == senderId,
    )[0];
    if (target) {
      await this.dbManager.updateUser(
        // neoUserId
        senderId,
        // field to update : timeout
        'timeout',
        // set timestamp of punishment ending
        end.toString(),
      );
      this.sendMessage(
        `🚓 ${target.name} ${target.surname} est sous silence pour ${this.cmd.tokens[2].string} minutes.`,
      );
      const that = this;
      setTimeout(async () => {
        await that.dbManager.updateUser(
          // neoUserId
          senderId,
          // field to update : timeout
          'timeout',
          // empty, so that we cancel any ongoing timeout
          '0',
        );
        that.sendMessage(
          `🚓 ${target.name} ${target.surname} n'est plus timeout.`,
        );
      }, timeout);
    } else {
      this.sendMessage("La cible n'existe pas 🤷🏻‍♂️");
    }
  }
};
