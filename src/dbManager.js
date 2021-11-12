const chalk = require('chalk');
const AWS = require('aws-sdk');
AWS.config.update({ region: 'eu-west-3' });

const dd = new AWS.DynamoDB();

module.exports = class DbManager {
  constructor() {
    // console.log(chalk.green.inverse('🤖 CONV BOT CREATED'));
    this.users = [];
    this.messages = [];
    this.docClient = new AWS.DynamoDB.DocumentClient();
  }

  async init() {
    this.users = await this.docClient
      .scan({
        TableName: 'neousers',
      })
      .promise();
    this.users = this.users.Items;
  }

  async createUser(userId, messageId, name, surname) {
    await dd
      .putItem({
        Item: {
          user: {
            S: userId,
          },
          messageId: {
            S: messageId,
          },
          surname: {
            S: surname,
          },
          name: {
            S: name,
          },
          isBanned: {
            BOOL: false,
          },
          lastCmd: {
            S: '',
          },
          userRole: {
            S: 'user',
          },
          timeout: {
            S: '',
          },
        },
        TableName: 'neousers',
      })
      .promise();
    await this.init();
  }

  async updateUser(userId, field, value) {
    await this.docClient
      .update({
        TableName: 'neousers',
        Key: {
          user: userId,
        },
        UpdateExpression: `set ${field} = :x`,
        ExpressionAttributeValues: {
          ':x': value,
        },
      })
      .promise();
    await this.init();
  }

  async createMessage(cmdId, message, userId, messageId, timestamp) {
    await dd
      .putItem({
        Item: {
          cmdId: {
            S: cmdId,
          },
          message: {
            S: message,
          },
          userId: {
            S: userId,
          },
          messageId: {
            S: messageId,
          },
          messageTimestamp: {
            N: timestamp,
          },
        },
        TableName: 'neocommands',
      })
      .promise();
    await this.init();
  }

  async getUsersLastMessages(userId) {
    // TODO -> setup spam limitation
    const defaultCooldown = 60;
    const defaultSpamThreshold = 3;
    const spamTimeFrame = Date.now() - defaultCooldown * 1000;
    var params = {
      TableName: 'neocommands',
      FilterExpression:
        'userId = :targetUser and messageTimestamp > :spamTimeFrame',
      ExpressionAttributeValues: {
        ':targetUser': { S: `${userId}` },
        ':spamTimeFrame': { N: `${spamTimeFrame}` },
      },
    };

    await dd.scan(params, (err, data) => {
      if (err) {
        console.error('Unable to query. Error:', JSON.stringify(err, null, 2));
      } else {
        console.log(data.Items);
      }
    });
  }
};
