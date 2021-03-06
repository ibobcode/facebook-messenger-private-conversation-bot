const request = require('request-promise');
const dropbox = require('dropbox');
const fs = require('fs');
const chalk = require('chalk');

// This fuction role is to :
//     - convert raw byte arrays from websockets to a clear JSON
//     - analyse the content of the data coming throught and filtering only incoming messages
//     - parse the message data to extract relevant informations
// Note : This function may be subject to changes with messenger evolutions and developpers discoveries while reverse-engeneering
async function websocketDataParser(data) {
  if (data.response.payloadData) {
    // The data comes Base64 encoded so we have to decode it
    const message = Buffer.from(data.response.payloadData, 'base64').toString(
      'ascii',
    );
    // This is a trick to isolate the JSON content from the data header
    const prefix = message.split('{"')[0];
    const core = message.split(prefix)[1];
    let body = null;
    const errorHandler = [message];
    // A lot of things can go wrong with a JSON parse so I want the app to be resilient to crashes, changes and edge cases
    try {
      errorHandler.push(core);
      body = core === '' ? null : JSON.parse(core);
    } catch (error) {
      console.error(chalk.red.inverse('🌶  Parsing error on websocket message'));
      // console.error(errorHandler);
      // console.error(error);
    }
    //clearing out the body from the f**** UTF-8 characters escaped
    if (body && body.payload) {
      body.payload = body.payload.replace(/\\/g, '');
    }
    const dataMessage = { prefix, body };
    // Trick to filter out anything that is not an incoming message
    try {
      if (dataMessage.body && dataMessage.body.request_id === null) {
        // Trick to split the content of the payload just befor it's relevant IDs
        const splitted = dataMessage.body.payload
          .split(',_=>LS.sp')
          .map((m) => {
            if (m.split('"')[1] == 'insertMessage') {
              const messageJson = JSON.parse(
                m
                  .replace(/\(/g, '[')
                  .replace(/\)/g, ']')
                  .replace(/undefined/g, 'null')
                  .replace(/,U/g, ',null')
                  .replace(/U,/g, 'null,'),
              );
              return messageJson;
            } else return null;
          })
          .filter((n) => n)[0];
        if (splitted) {
          return {
            type: 'msg',
            senderId: splitted[11][1],
            conversationWsId: splitted[4][1],
            tags: splitted[21] ? splitted[21].split(',') : [],
            msg: splitted[1],
          };
        } else
          return {
            type: 'unknown',
          };
      }
    } catch (error) {
      console.error(chalk.red.inverse('🌶  Parsing error at level 2'));
    }
  }
  return { type: 'unknown' };
}

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function focusInput(page) {
  await page.evaluate(() => document.getElementsByClassName('_1mf')[0].click());
}

async function applyTag(page, tag) {
  await page.keyboard.type(tag);
  await page
    .waitFor(
      () =>
        document
          .getElementsByClassName('_5rpu')[0]
          .getAttribute('aria-expanded') === 'true',
    )
    .then(() => page.keyboard.press('Enter'))
    .catch((err) => console.error('ERROR', err));
}

async function applyTags(page, tags) {
  if (tags && tags.length > 0) {
    // eslint-disable-next-line no-restricted-syntax
    for (const tag of tags) {
      await applyTag(page, tag);
    }
  }
}

async function typeText(page, text) {
  if (text) {
    await page.keyboard.type(` ${text}`);
  }
}

async function applyAttachement(page, link) {
  if (link) {
    await page.keyboard.type(` ${link}`);
    await page.waitFor('.fbNubFlyoutAttachments');
  }
}

function dropboxDl(selectedFile = null) {
  return new Promise(async (resolve, reject) => {
    try {
      const dbx = new dropbox.Dropbox({
        accessToken: process.env.DROPBOX_TOKEN,
      });
      let files = [selectedFile];
      let id = 0;
      if (!selectedFile) {
        files = await dbx
          .filesListFolder({ path: '' })
          .then((response) => {
            return response.result.entries;
          })
          .catch(function (error) {
            console.error(error);
          });
        id = Math.floor(Math.random() * files.length);
      }
      const rx = /^.*\.(jpg|png|jpeg|gif|mov|JPG|mp4|PNG|JPEG|GIF)$/i;
      const ext = files[id].name.match(rx)[1];
      const fileName = await dbx
        .filesDownload({ path: files[id].path_lower })
        .then(async (data) => {
          const buf = Buffer.from(data.result.fileBinary, 'base64');
          await fs.writeFileSync(`./tmp/dropBoxFile.${ext}`, buf);
          return `dropBoxFile.${ext}`;
        });
      return resolve(fileName);
    } catch (error) {
      console.error('Dropbox Failed');
    }
  });
}

async function uploadPicture(page, upload, name, cookie) {
  if (upload) {
    const fileData = await request({
      uri: upload,
      encoding: null,
      headers: {
        Authorization: `Bearer ${cookie}`,
      },
    });
    fs.writeFileSync(`./tmp/${name}`, fileData);
    const fileInput = await page.$('input.mkhogb32');
    await fileInput.uploadFile(`./tmp/${name}`);
    // await fs.unlinkSync(name);
  }
}

async function downloadPictureFromUrl(url, ext) {
  const fileData = await request({
    uri: url,
    encoding: null,
  });
  await fs.writeFileSync(`./tmp/pictureFromUrl.${ext}`, fileData);
}

async function uploadRandomPicture(page, upload) {
  if (upload && upload.length > 0) {
    const r = Math.floor(Math.random() * upload.length);
    await uploadPicture(page, upload[r]);
  }
}

async function fetchApi(page, fetch) {
  if (fetch) {
    let data = await request({
      uri: fetch.apiUrl,
    });
    data = JSON.parse(data);
    fetch.dataPath.forEach((path) => {
      data = data[path];
    });
    await uploadPicture(page, data);
  }
}

async function handleHelp(page, actions) {
  await focusInput(page);
  await typeText(page, 'AVAILABLE COMMANDS: ');
  for (let action of actions) {
    await typeText(page, `${action.trigger.content}, `);
  }
  await page.keyboard.press('Enter');
}

// async function restart(page, lastMessage) {
//   if (lastMessage === "@RESTART") {
//     await focusInput(page);
//     await typeText(page, "Restarting...");
//     await page.keyboard.press("Enter");
//     throw new Error("Hard reset");
//   }
// }

async function helloWorld(page) {
  await focusInput(page);
  await typeText(page, 'Hello World !');
  await page.keyboard.press('Enter');
}

async function cleanTmpFiles() {
  fs.readdir('./tmp', async (err, files) => {
    if (files) {
      for (const file of files) {
        await fs.unlinkSync(`./tmp/${file}`);
      }
    }
  });
}

function conditionalExecCheck(data, instruction) {
  if (!instruction.conditionalExecution) return true;
  switch (instruction.conditionalExecution.type) {
    case 'rights':
      if (instruction.conditionalExecution.payload.includes(data.user.rights))
        return true;
      break;
  }
  return false;
}

module.exports.websocketDataParser = websocketDataParser;
module.exports.focusInput = focusInput;
module.exports.delay = delay;
module.exports.applyTags = applyTags;
module.exports.typeText = typeText;
module.exports.applyAttachement = applyAttachement;
module.exports.uploadRandomPicture = uploadRandomPicture;
module.exports.dropboxDl = dropboxDl;
module.exports.uploadPicture = uploadPicture;
module.exports.fetchApi = fetchApi;
module.exports.handleHelp = handleHelp;
module.exports.helloWorld = helloWorld;
module.exports.cleanTmpFiles = cleanTmpFiles;
module.exports.conditionalExecCheck = conditionalExecCheck;
module.exports.downloadPictureFromUrl = downloadPictureFromUrl;
