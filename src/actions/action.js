const utils = require('../utils.js');
const chalk = require('chalk');

module.exports = class Action {
  constructor(
    { dbManager, megaManager, page, cron, wq },
    cmd = {},
    allowedRoles = [],
  ) {
    // console.log(chalk.green.inverse('🤖 CONV BOT CREATED'));
    this.dbManager = dbManager;
    this.megaManager = megaManager;
    this.page = page;
    this.cron = cron;
    this.wq = wq;
    this.allowedRoles = allowedRoles;
    this.cmd = cmd;
  }

  async checkPermissions() {
    return !this.cmd || !this.cmd.sender
      ? false
      : this.allowedRoles.includes(this.cmd.sender.userRole);
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

  tagPeople() {}

  async sendFile(name) {
    this.wq.push({
      f: async () => {
        const fileInput = await this.page.$('input.mkhogb32');
        await fileInput.uploadFile(`./tmp/${name}`);
      },
      type: 'Send File',
    });
  }

  addToCron() {}

  // utils.conditionalExecCheck(data, instruction)
};
