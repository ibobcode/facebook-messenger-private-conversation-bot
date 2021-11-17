const Action = require('./action');

module.exports = class SetRole extends Action {
  constructor(navigationContext, cmd) {
    super(navigationContext, cmd, ['admin']);
  }

  async do() {
    if (this.cmd.tokens.length != 3) {
      this.sendMessage(
        "Mauvais nombre d'arguments : !setRole <userId|tag> <role>",
      );
      return;
    }
    const senderId = this.cmd.tokens[1].isTag
      ? this.cmd.tags[this.cmd.tokens[1].tagIndex]
      : this.cmd.tokens[1].string;
    const target = this.dbManager.users.filter((u) => u.user == senderId)[0];
    if (target) {
      await this.dbManager.updateUser(
        // userId
        senderId,
        // field to update : userRole
        'userRole',
        // string defining the role : bot / user / moderator / admin
        this.cmd.tokens[2].string,
      );
      this.sendMessage(
        `👨🏻‍⚖️ ${target.name} ${target.surname} est maintenant ${this.cmd.tokens[2].string}.`,
      );
    } else {
      this.sendMessage("La cible n'existe pas 🤷🏻‍♂️");
    }
  }
};
