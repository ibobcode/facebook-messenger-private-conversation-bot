const chalk = require('chalk');
const actions = require('./actions');

//TODO IMPLEMENT CRON

module.exports = class CronTab {
  constructor(nm) {
    // console.info(chalk.green.inverse('🤖 CONV BOT CREATED'));
    this.nm = nm;
    this.tasks = [];
  }

  async init() {
    const that = this;
    setInterval(async () => {
      const instructions = await actions.ping();
      const action = {
        type: 'action',
        instructions,
        cmd: [],
        tags: [],
        message: '',
        user: that.nm.dbManager.users.filter(
          (u) => u.user == process.env.ADMIN_ID,
        )[0],
        users: that.nm.dbManager.users,
      };
      await that.nm.instructionsReader(action);
    }, 10000);
  }

  async clock() {}
};
