//https://img.youtube.com/vi/KjYBh7rq0-Y/0.jpg
const utils = require('../utils.js');
const Builtin = require('./builtin');
const fetch = require('node-fetch');

module.exports = class YoutubeThumbnail extends Builtin {
  constructor(navigationContext, data) {
    super(navigationContext);
    this.data = data;
  }

  urlIdParser(url) {
    const rx =
      /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;

    let r = url.match(rx);
    return r ? r[1] : null;
  }

  async getInfos(id) {
    const res = await fetch(
      `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${id}`,
    );
    const data = await res.json();
    return data;
  }

  async do() {
    if (this.data.msg) {
      const res = this.urlIdParser(this.data.msg);
      if (res) {
        const infos = await this.getInfos(res);
        this.wq.push({
          f: async () => {
            await utils.focusInput(this.page);
            await utils.typeText(this.page, infos.title);
            await utils.downloadPictureFromUrl(infos.thumbnail_url, 'jpg');
            const fileInput = await this.page.$('input.mkhogb32');
            await fileInput.uploadFile('./tmp/pictureFromUrl.jpg');
            await this.page.keyboard.press('Enter');
            // await fs.unlinkSync(name);
          },
          type: 'Send Youtube',
        });
      }
    }
  }
};
