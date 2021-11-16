const Action = require('./action');

module.exports = class AddUser extends Action {
  constructor(navigationContext, cmd) {
    super(navigationContext, cmd, ['admin']);
  }

  async do() {
    if (this.cmd.tokens.length != 5) {
      this.sendMessage(
        "Mauvais nombre d'arguments : !addUser <userId|tag> <messageId> <name> <surname>",
      );
      return;
    }
    await this.dbManager.createUser(
      // userId
      this.cmd.tokens[1].string,
      // messageId
      this.cmd.tokens[2].string,
      // name
      this.cmd.tokens[3].string,
      // surname
      this.cmd.tokens[4].string,
    );
    this.sendMessage('✅ Nouvel utilisateur enregistré');
  }
};
