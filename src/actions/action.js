const utils = require('../utils.js');
const chalk = require('chalk');

module.exports = class Action {
  constructor(
    { dbManager, megaManager, page, cron, wq },
    cmd = {},
    allowedRoles = [],
    floodControl = {},
  ) {
    // console.log(chalk.green.inverse('🤖 CONV BOT CREATED'));
    this.dbManager = dbManager;
    this.megaManager = megaManager;
    this.page = page;
    this.cron = cron;
    this.wq = wq;
    this.allowedRoles = allowedRoles;
    this.cmd = cmd;
    this.floodControl = floodControl;
  }

  async checkPermissions() {
    return !this.cmd || !this.cmd.sender
      ? false
      : this.allowedRoles.includes(this.cmd.sender.userRole);
  }

  async floodController() {
    const floodControl = {
      groupCooldown: 60,
      individualCooldown: 60,
      groupSpamThreshold: 15,
      individualSpamThreshold: 8,
      groupDailyThreshold: 1000,
      individualDailyThreshold: 1000,
      ...this.floodControl,
    };
    if (
      this.dbManager.messages.filter((m) => m.message == this.cmd.string)
        .length >= floodControl.groupDailyThreshold ||
      this.dbManager.messages.filter(
        (m) => m.message == this.cmd.string && m.userId == this.cmd.sender.user,
      ).length >= floodControl.individualDailyThreshold
    )
      return {
        blocked: true,
        message: "L'usage journalier de cette action a été atteint 🙅🏻‍♂️",
      };
    else if (
      this.dbManager.messages.filter(
        (m) =>
          m.message == this.cmd.string &&
          m.messageTimestamp > Date.now() - floodControl.groupCooldown * 1000,
      ).length >= floodControl.groupSpamThreshold ||
      this.dbManager.messages.filter(
        (m) =>
          m.message == this.cmd.string &&
          m.messageTimestamp >
            Date.now() - floodControl.individualCooldown * 1000,
      ).length >= floodControl.individualSpamThreshold
    )
      return {
        blocked: true,
        message: 'Cool down ❄️',
      };
    return { blocked: false };
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
        const fileInput = await this.page.$(process.env.MESSENGER_CLASS_FILE);
        await fileInput.uploadFile(`./tmp/${name}`);
        await this.page.keyboard.press('Enter');
      },
      type: 'Send File',
    });
  }

  addToCron() {}
};
