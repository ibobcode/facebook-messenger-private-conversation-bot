const Action = require('./action');

module.exports = class Timeout extends Action {
  constructor(navigationContext, cmd) {
    super(navigationContext, cmd, ['admin']);
  }

  async do() {
    if (this.cmd.tokens.length != 2) {
      this.sendMessage("Mauvais nombre d'arguments : !toggleBan <userId|tag>");
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
        // field to update : isBanned
        'isBanned',
        // bool
        target.isBanned ? false : true,
      );
      this.sendMessage(
        `${target.name} ${target.surname} ${
          target.isBanned ? "n'est plus banni." : 'est maintenant banni. 🖕🏻'
        }.`,
      );
    } else {
      this.sendMessage("La cible n'existe pas 🤷🏻‍♂️");
    }
  }
};
