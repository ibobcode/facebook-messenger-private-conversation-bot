const puppeteer = require('puppeteer');
const chalk = require('chalk');
const fs = require('fs');
const utils = require('./utils');
const ActionManager = require('./actionManager');
const BuiltinManager = require('./builtinManager');
const DbManager = require('./dbManager');
const CronTab = require('./cronTab');
const WaitQueue = require('wait-queue');

module.exports = class NavigationManager {
  constructor(crashed = false) {
    console.info(chalk.green.inverse('🤖 CONV BOT CREATED'));
    this.running = true;
    this.crashed = crashed;
    this.actions = [];
    this.browser = null;
    this.page = null;
    this.savedMessage = null;
    this.server = null;
    this.actionManager = null;
    this.cdp = null;
    this.actionManager = null;
    this.builtinManager = null;
    this.dbManager = null;
    this.cronTab = null;
    this.wq = new WaitQueue();
  }

  async initDependencies() {
    this.actionManager = new ActionManager(this);
    this.builtinManager = new BuiltinManager(this);
    this.dbManager = new DbManager();
    await this.dbManager.init();
    this.waitingQueue();
    // TODO Finish crontab ilmplementation
    // this.cronTab = new CronTab(this);
    // this.cronTab.init();
  }

  async close() {
    let pages = await this.browser.pages();
    for (const page of pages) {
      await page.close();
    }
    await this.browser.close();
    this.actionManager = null;
    this.builtinManager = null;
    this.dbManager.docClient = null;
    this.dbManager = null;
    this.wq = null;
  }

  async waitingQueue() {
    // Here we make sure any instruction sent to the page gets treated in order and not overlaping
    while (true) {
      await this.wq.shift().then(async (data) => {
        console.info(
          chalk.blue.bold(' 🔻 Consume an element of the queue : ', data.type),
        );
        await data.f();
      });
    }
  }

  // Open a browser, login, navigate to the conversation
  async initConversationPage() {
    try {
      console.info(chalk.cyan.bold(' · Opening browser'));
      this.browser = await puppeteer.launch({
        headless: process.env.HEADLESS === 'true',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      this.page = await this.browser.newPage();
      if (fs.existsSync('./cookies.json')) {
        console.info(chalk.cyan.bold(' · Old session detected !'));
        const cookiesString = await fs.readFileSync('./cookies.json');
        const cookies = JSON.parse(cookiesString);
        await this.page.setCookie(...cookies);
      }
      console.info(
        chalk.cyan.bold(' · Navigating to : '),
        `https://www.messenger.com/t/${process.env.CONVERSATION_URL_ID}`,
      );
      await this.page.goto(
        `https://www.messenger.com/t/${process.env.CONVERSATION_URL_ID}`,
      );
      if (this.page.url().includes('login')) {
        console.info(chalk.cyan.bold(' · Loging in'));
        await this.page.evaluate((text) => {
          document.getElementById('email').value = text;
        }, process.env.EMAIL);
        await this.page.evaluate((text) => {
          document.getElementById('pass').value = text;
        }, process.env.PASSWORD);
        await this.page.evaluate(() =>
          document.getElementById('loginbutton').click(),
        );
        console.info(chalk.cyan.bold(' · Logged in'));
        console.info(chalk.cyan.bold(' · Waiting for conversation to load...'));
        await this.page.waitForNavigation();
        const cookies = await this.page.cookies();
        await fs.writeFileSync(
          './cookies.json',
          JSON.stringify(cookies, null, 2),
        );
      } else {
        console.info(chalk.cyan.bold(' · Already logged in'));
        await this.page.waitForNavigation();
      }
      console.info(chalk.cyan.bold(' · Conversation loaded !'));
    } catch (error) {
      console.error(
        chalk.red.inverse(
          'The page could not be loaded, retrying in 5 seconds.',
        ),
      );
      await utils.delay(5000);
      let pages = await this.browser.pages();
      for (const page of pages) {
        await page.close();
      }
      await this.browser.close();
      this.initConversationPage();
    }
  }

  async lastMessage() {
    const msg = await this.page
      .evaluate((query) => {
        const msgs = document.getElementsByClassName(query);
        return msgs[msgs.length - 1].textContent;
      }, process.env.MESSENGER_CLASS_MESSAGE)
      .catch(() => {
        this.running = true;
      });
    if (msg === this.savedMessage) {
      return null;
    }
    this.savedMessage = msg;
    return msg;
  }

  async messageRecieved(data) {
    const wsData = await utils.websocketDataParser(data);
    if (wsData.conversationWsId == process.env.CONVERSATION_WS_ID) {
      await this.builtinManager.handleData(wsData);
      if (wsData.type === 'msg') {
        await this.actionManager.handleMessage(wsData);
      }
    }
    // TODO Maybe handle other things like videos or gif and pictures
  }

  async websocketConnection() {
    // We are now pluging into the websocket exchange between the client and messenger to intercept all messages
    this.cdp = await this.page.target().createCDPSession();
    await this.cdp.send('Network.enable');
    await this.cdp.send('Page.enable');
    // Fired when WebSocket message is received.
    this.cdp.on(
      'Network.webSocketFrameReceived',
      this.messageRecieved.bind(this),
    );
    console.info(chalk.cyan.bold(' · Connected to websocket.'));
    // this.cdp.on('Network.webSocketFrameSent', this.messageSent);
  }

  // async instructionsReader(data) {
  //   switch (data.type) {
  //     case 'action':
  //       if (data.instructions.forbidden.includes(data.user.rights)) {
  //         await utils.focusInput(this.page);
  //         await utils.typeText(this.page, "T'as pas les droits grosse merde.");
  //         await this.page.keyboard.press('Enter');
  //       } else {
  //         const that = this;
  //         for (const instruction of data.instructions.list) {
  //           if (utils.conditionalExecCheck(data, instruction))
  //             setTimeout(
  //               async () => {
  //                 switch (instruction.type) {
  //                   case 'sendMessage':
  //                     await utils.focusInput(that.page);
  //                     // await utils.applyTags(this.page, action.tags);
  //                     await utils.typeText(
  //                       that.page,
  //                       instruction.payload.message,
  //                     );
  //                     await that.page.keyboard.press('Enter');
  //                     break;
  //                   case 'db':
  //                     await that.dbManager[instruction.payload.route](
  //                       instruction.payload.arguments[0],
  //                       instruction.payload.arguments[1],
  //                       instruction.payload.arguments[2],
  //                     );
  //                     break;
  //                   case 'sendPicture':
  //                     await utils.uploadPicture(
  //                       that.page,
  //                       instruction.payload.uri,
  //                       instruction.payload.filename,
  //                     );
  //                     await that.page.keyboard.press('Enter');
  //                     break;
  //                   default:
  //                     break;
  //                 }
  //               },
  //               instruction.timeout ? instruction.timeout : 0,
  //             );
  //         }
  //       }
  //       break;
  //     case 'unknownAction':
  //       await utils.focusInput(this.page);
  //       await utils.typeText(this.page, "C'est pas une commande gros.");
  //       await this.page.keyboard.press('Enter');
  //       break;
  //     default:
  //       break;
  //   }
  // }

  async restrinctionLayerValidation(allowed, current) {
    if (allowed.includes(current)) return true;
    else {
      await utils.focusInput(this.page);
      await utils.typeText(this.page, 'Not allowed.');
      await this.page.keyboard.press('Enter');
      return false;
    }
  }
};
