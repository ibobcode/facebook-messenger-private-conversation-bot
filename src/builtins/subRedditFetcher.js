//https://img.youtube.com/vi/KjYBh7rq0-Y/0.jpg
const utils = require('../utils.js');
const Builtin = require('./builtin');
const request = require('request-promise');
const chalk = require('chalk');

module.exports = class SubRedditFetcher extends Builtin {
  constructor(navigationContext, data) {
    super(navigationContext);
    this.data = data;
  }

  subRedditParser(url) {
    const rx = /^r\/([^\s\/]+)/;

    let r = url.match(rx);
    return r ? r[1] : null;
  }

  async fetchReddit(r, sort = 'hot') {
    try {
      let data = await request({
        uri: `https://www.reddit.com/r/${r}/${sort}.json`,
      });
      data = JSON.parse(data)
        .data.children.map((post) => ({
          title: post.data.title,
          url: post.data.url,
          stickied: post.data.stickied,
          selftext: post.data.selftext,
          over_18: post.data.over_18,
        }))
        .filter((post) => !post.stickied);
      return data[0];
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async do() {
    if (this.data.msg) {
      const sub = this.subRedditParser(this.data.msg);
      if (sub) {
        const post = await this.fetchReddit(sub);
        if (post) {
          console.info(chalk.green.inverse('💬 Builtin Reddit'));
          this.wq.push({
            f: async () => {
              await utils.focusInput(this.page);
              await utils.typeText(this.page, post.title);
              if (post.selftext != '') {
                await utils.typeText(this.page, '\n');
                await utils.typeText(this.page, post.selftext);
              }
              if (post.url.endsWith('.jpg') && !post.over_18) {
                await utils.downloadPictureFromUrl(post.url, 'jpg');
                const fileInput = await this.page.$(
                  process.env.MESSENGER_CLASS_FILE,
                );
                await fileInput.uploadFile('./tmp/pictureFromUrl.jpg');
              } else {
                await utils.typeText(this.page, '\n');
                await utils.typeText(this.page, post.url);
              }
              await this.page.keyboard.press('Enter');
              // await fs.unlinkSync(name);
            },
            type: 'Send Reddit',
          });
        }
      }
    }
  }
};
