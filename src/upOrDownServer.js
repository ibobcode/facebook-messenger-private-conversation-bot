const express = require('express');
const chalk = require('chalk');

module.exports = () => {
  const app = express();
  app.use(express.json());

  app.get('/', (x, res) => {
    res.send('NEO is alive!');
  });
  this.server = app
    .listen(process.env.PORT, () => {
      console.info(
        chalk.green.inverse(
          `❤️  UP OR DOWN PAGE IS NOW RUNNING ON PORT ${process.env.PORT} - `,
        ),
      );
    })
    .on('SERVER ERROR', console.error);
  app.get('/death', (req, res) => {
    res.send('Killing the bot');
    this.server.close();
  });
};
