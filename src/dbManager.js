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
          TableName: 'neoUsers',
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
        cmdId: AWS.DynamoDB.Converter.output(i.cmdId),
        message: AWS.DynamoDB.Converter.output(i.message),
        neoUserId: AWS.DynamoDB.Converter.output(i.neoUserId),
        conversationWsId: AWS.DynamoDB.Converter.output(i.conversationWsId),
        messageTimestamp: AWS.DynamoDB.Converter.output(i.messageTimestamp),
      }));
      return this.messages;
    }
    return null;
  }

  async createUser(neoUserId, name, surname) {
    try {
      await dd
        .putItem({
          Item: {
            neoUserId: {
              S: neoUserId,
            },
            name: {
              S: name,
            },
            surname: {
              S: surname,
            },
            userRole: {
              S: 'user',
            },
            timeout: {
              N: '0',
            },
            isBanned: {
              BOOL: false,
            },
          },
          TableName: 'neoUsers',
        })
        .promise();
      this.users.push({
        neoUserId: neoUserId,
        name: name,
        surname: surname,
        userRole: 'user',
        timeout: '',
        isBanned: false,
      });
    } catch (error) {
      console.error(chalk.red.inverse('🌶  Unable to create new user'));
      console.error(error);
    }
  }

  async updateUser(neoUserId, field, value) {
    try {
      await this.docClient
        .update({
          TableName: 'neoUsers',
          Key: {
            neoUserId: neoUserId,
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

  async createMessage(
    cmdId,
    message,
    neoUserId,
    conversationWsId,
    messageTimestamp,
  ) {
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
            neoUserId: {
              S: neoUserId,
            },
            conversationWsId: {
              S: conversationWsId,
            },
            messageTimestamp: {
              N: messageTimestamp,
            },
          },
          TableName: 'neocommands',
        })
        .promise();
      this.messages.push({
        cmdId: cmdId,
        message: message,
        neoUserId: neoUserId,
        conversationWsId: conversationWsId,
        messageTimestamp: messageTimestamp,
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
