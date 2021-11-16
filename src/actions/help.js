const fs = require('fs');
const Action = require('./action');

module.exports = class Help extends Action {
  constructor(navigationContext, cmd) {
    super(navigationContext, cmd, ['admin', 'moderator', 'user']);
  }

  async do() {
    const files = [];
    fs.readdirSync('./src/actions').forEach((file) => {
      if (!['index.js', 'action.js'].includes(file)) {
        files.push(`!${file.replace(/.js/, '')}`);
      }
    });
    if (this.cmd.sender.userRole == 'admin') {
      this.sendMessage(`👨🏻‍🏫 Commandes disponibles : ${files.join(', ')}.`);
    } else if (this.cmd.sender.userRole == 'moderator') {
      this.sendMessage(
        `👨🏻‍🏫 Commandes disponibles : ${files
          .filter((file) => !['!setRole', '!addUser'].includes(file))
          .join(', ')}.`,
      );
    } else if (this.cmd.sender.userRole == 'user') {
      this.sendMessage(
        `👨🏻‍🏫 Commandes disponibles : ${files
          .filter(
            (file) =>
              ![
                '!toggleBan',
                '!timeout',
                '!free',
                '!setRole',
                '!addUser',
              ].includes(file),
          )
          .join(', ')}.`,
      );
    }
  }
};
