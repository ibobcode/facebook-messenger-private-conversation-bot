const chalk = require('chalk');
const AWS = require('aws-sdk');
AWS.config.update({ region: 'eu-west-3' });

const dd = new AWS.DynamoDB();

module.exports = class DbManager {
  constructor() {
    // console.info(chalk.green.inverse('🤖 CONV BOT CREATED'));
    this.users = [];
    this.messages = [];
    this.docClient = new AWS.DynamoDB.DocumentClient();
  }

  async init() {
    await this.getAllUsers();
    await this.getLastDayMessages();
  }

  async getAllUsers() {
    let data = null;
    try {
      data = await this.docClient
        .scan({
          TableName: 'neousers',
        })
        .promise();
    } catch (error) {
      console.error(chalk.red.inverse('🌶  Unable to get users'));
      console.error(error);
    }
    if (data) {
      this.users = data.Items;
      return this.users;
    }
    return null;
  }

  async getLastDayMessages() {
    // TODO -> setup spam limitation
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    // const todayMidnight = d.getTime() + 3600000; // To handle french time shift ?
    const todayMidnight = date.getTime();
    let data = null;
    try {
      data = await dd
        .scan({
          TableName: 'neocommands',
          FilterExpression: 'messageTimestamp > :timeFrame',
          ExpressionAttributeValues: {
            ':timeFrame': { N: `${todayMidnight}` },
          },
        })
        .promise();
    } catch (error) {
      console.error(
        chalk.red.inverse('🌶  Unable to get messages from last day'),
      );
      console.error(error);
    }
    if (data) {
      this.messages = data.Items.map((i) => ({
        message: AWS.DynamoDB.Converter.output(i.message),
        messageTimestamp: AWS.DynamoDB.Converter.output(i.messageTimestamp),
        messageId: AWS.DynamoDB.Converter.output(i.messageId),
        cmdId: AWS.DynamoDB.Converter.output(i.cmdId),
        userId: AWS.DynamoDB.Converter.output(i.userId),
      }));
      return this.messages;
    }
    return null;
  }

  async createUser(userId, messageId, name, surname) {
    try {
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
      this.users.push({
        timeout: '',
        lastCmd: '',
        userRole: 'user',
        surname: surname,
        messageId: messageId,
        user: userId,
        name: name,
        isBanned: false,
      });
    } catch (error) {
      console.error(chalk.red.inverse('🌶  Unable to create new user'));
      console.error(error);
    }
  }

  async updateUser(userId, field, value) {
    try {
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
      this.users = this.users.map((user) => {
        if (user.user) {
          return { ...user, [field]: value };
        }
        return user;
      });
    } catch (error) {
      console.error(chalk.red.inverse('🌶  Unable to update user'));
      console.error(error);
    }
  }

  async createMessage(cmdId, message, userId, messageId, timestamp) {
    try {
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
      this.messages.push({
        message: message,
        messageTimestamp: timestamp,
        messageId: messageId,
        cmdId: cmdId,
        userId: userId,
      });
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      const todayMidnight = date.getTime();
      this.messages = this.messages.filter(
        (m) => m.messageTimestamp > todayMidnight,
      );
    } catch (error) {
      console.error(chalk.red.inverse('🌶  Unable to create new message'));
      console.error(error);
    }
  }
};
