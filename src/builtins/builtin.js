const utils = require('../utils.js');
const chalk = require('chalk');

module.exports = class Builtin {
  constructor(
    { dbManager, megaManager, page, cron, wq },
    data = {},
    allowedRoles = [],
  ) {
    // console.log(chalk.green.inverse('🤖 CONV BOT CREATED'));
    this.dbManager = dbManager;
    this.megaManager = megaManager;
    this.page = page;
    this.cron = cron;
    this.wq = wq;
    this.data = data;
    this.allowedRoles = allowedRoles;
  }

  async checkPermissions() {
    return !this.data || !this.data.sender
      ? false
      : this.allowedRoles.includes(this.data.sender.role);
  }

  async sendMessage(message) {
    this.wq.push({
      f: async () => {
        await utils.focusInput(this.page);
        // await utils.applyTags(this.page, action.tags);
        await utils.typeText(this.page, message);
        await this.page.keyboard.press('Enter');
      },
      type: 'Send Message',
    });
  }
};
