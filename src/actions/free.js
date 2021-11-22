const Action = require('./action');

module.exports = class Free extends Action {
  constructor(navigationContext, cmd) {
    super(navigationContext, cmd, ['admin', 'moderator']);
  }

  async do() {
    if (this.cmd.tokens.length != 2) {
      this.sendMessage("Mauvais nombre d'arguments : !free <userId|tag>");
      return;
    }
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
        // 0, so that we cancel any ongoing timeout
        0,
      );
      this.sendMessage(
        `🚓 ${target.name} ${target.surname} n'est plus timeout.`,
      );
    } else {
      this.sendMessage("La cible n'existe pas 🤷🏻‍♂️");
    }
  }
};
