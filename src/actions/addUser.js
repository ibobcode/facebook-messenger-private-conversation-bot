const Action = require('./action');

module.exports = class AddUser extends Action {
  constructor(navigationContext, cmd) {
    super(navigationContext, cmd, ['admin']);
  }

  async do() {
    if (this.cmd.tokens.length != 4) {
      this.sendMessage(
        "Mauvais nombre d'arguments : !addUser <userId|tag> <name> <surname>",
      );
      return;
    }
    await this.dbManager.createUser(
      // neoUserId
      this.cmd.tokens[1].string,
      // name
      this.cmd.tokens[2].string,
      // surname
      this.cmd.tokens[3].string,
    );
    this.sendMessage('✅ Nouvel utilisateur enregistré');
  }
};
