const chalk = require('chalk');
const utils = require('./utils.js');
const builtins = require('./builtins');
const Builtin = require('./builtins/builtin');

module.exports = class BuiltinManager {
  constructor(navigationContext) {
    // console.info(chalk.green.inverse('🤖 CONV BOT CREATED'));
    this.navigationContext = navigationContext;
  }

  async handleData(data) {
    data.sender = this.navigationContext.dbManager.users.filter(
      (u) => u.messageId == data.senderId,
    )[0];
    data.sender = data.sender ? data.sender : null;
    const keys = Object.keys(builtins);
    for (const key of keys) {
      const todo = new builtins[key](this.navigationContext, data);
      todo.do(data);
    }
  }
};
