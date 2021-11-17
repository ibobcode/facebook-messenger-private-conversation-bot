const puppeteer = require('puppeteer');
const chalk = require('chalk');
const utils = require('./utils.js');
const actions = require('./actions');
const Action = require('./actions/action');

module.exports = class ActionManager {
  constructor(navigationContext) {
    // console.info(chalk.green.inverse('🤖 CONV BOT CREATED'));
    this.navigationContext = navigationContext;
  }

  tokenize(msg) {
    let countTags = -1;
    if (msg.trim().charAt(0) === '!') {
      return msg
        .replace('!', '')
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .map((token, iter) => {
          const isTag = token.search('u0040') >= 0;
          countTags += isTag ? 1 : 0;
          return {
            isTag,
            tagIndex: countTags,
            string: token,
          };
        });
    } else return null;
  }

  async handleMessage(data) {
    const act = new Action(this.navigationContext);
    const instruction = {
      string: data.msg,
      tokens: null,
      tags: data.tags,
      sender: null,
      messageId: data.id,
    };
    instruction.tokens = this.tokenize(instruction.string);
    if (instruction.tokens === null) {
      return null;
    }
    if (!actions[instruction.tokens[0].string]) {
      act.sendMessage(
        "C'est pas une commande : tente un petit !help pour voir ce à quoi t'as droit 👀",
      );
      return null;
    }
    instruction.sender = this.navigationContext.dbManager.users.filter(
      (u) => u.messageId == data.id,
    )[0];
    if (!instruction.sender) {
      act.sendMessage(
        "Tu n'es pas un utilisateur identifié ! Désolé mais il faut que tu demandes à un Admin de t'ajouter 😬",
      );
      return null;
    }

    const cmdId = Date.now();
    this.navigationContext.dbManager.createMessage(
      `${cmdId}`,
      instruction.string,
      instruction.sender.user,
      `${instruction.messageId}`,
      `${cmdId}`,
    );

    console.info(chalk.green.inverse(`💬 Action ${instruction.string}`));
    // Here we create a new instance of the class matching the first token name, passing it it's context for super methods
    const todo = new actions[instruction.tokens[0].string](
      this.navigationContext,
      instruction,
    );
    const hasPermissions = await todo.checkPermissions();
    if (!hasPermissions) {
      act.sendMessage("Tu n'as pas les droits pour cette commande, déso 🤷🏻‍♂️");
      return null;
    }
    const fCtrl = await todo.floodController();
    if (fCtrl.blocked) {
      act.sendMessage(fCtrl.message);
      return null;
    }
    todo.do();
  }
};
