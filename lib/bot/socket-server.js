/*
 * slack-bot
 * https://github.com/usubram/slack-bot
 *
 * Copyright (c) 2016 Umashankar Subramanian
 * Licensed under the MIT license.
 */

'use strict';

// Load modules
const _ = require('lodash');
const WebSocketServer = require('ws').Server;
const path = require('path');
const root = '..';

const botLogger = require(path.join(root, 'utils/logger'));

module.exports.connect = function (bot) {
  return Promise.resolve({
    then: (onFulfill) => {
      let wss = new WebSocketServer({ port: 4080 })
        .on('connection', function (ws) {
          console.log('connected...')
          ws.on('message', function (message) {
            console.log('came to message', message);
            let clientMessage;

            try {
              clientMessage = JSON.parse(message);
              /* jshint ignore:start */
              if (_.get(clientMessage, 'type') === 'message') {
                ws.send(JSON.stringify({
                  ok: true,
                  reply_to: _.get(clientMessage, 'id'),
                  ts: Date.now(),
                  text: _.get(clientMessage, 'text', message),
                  type: _.get(clientMessage, 'type', 'message'),
                  user: _.get(clientMessage, 'user', 'U1234567'),
                  channel: _.get(clientMessage, 'channel', 'C1234567')
                }));
              }
              /* jshint ignore:end */
            } catch (err) {
              botLogger.logger.info('Invalid socket data ', message);
            }
          });

          ws.on('close', function () {
            botLogger.logger.info('closed');
          });
          ws.close();
        }).on('listening', function () {
          let slackData = {
            url: 'ws://' + this.options.host + ':' + this.options.port,
            self: bot.config.mock.self,
            users: bot.config.mock.users
          };
          botLogger.logger.info('Socket server connected at ', slackData);
          bot.slackData = slackData;
          onFulfill(bot);
        }).on('error', function () {
          let slackData = {
            url: 'ws://' + this.options.host + ':' + this.options.port,
            self: bot.config.mock.self,
            users: bot.config.mock.users
          };
          botLogger.logger.info('Socket server connected at ', slackData);
          bot.slackData = slackData;
          onFulfill(bot);
        });

        wss.broadcast = function (data) {
          var broadcastData;
          try {
            broadcastData = JSON.parse(data);
          } catch (err) {
            botLogger.logger.info('Error in broadcasting data ', data);
          }
          if (_.get(broadcastData, 'type') !== 'ping') {
            wss.clients.forEach(function (client) {
              client.send(data);
            });
          }
        };
    }
  });
};
