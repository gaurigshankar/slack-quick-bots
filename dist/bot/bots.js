/*
 * slack-bot
 * https://github.com/usubram/slack-bot
 *
 * Copyright (c) 2016 Umashankar Subramanian
 * Licensed under the MIT license.
 */

'use strict';

// Load modules

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _ = require('lodash');
var path = require('path');
var root = '..';

var Bot = require(path.join(root, 'bot/bot'));
var botLogger = require(path.join(root, 'utils/logger'));

var externals = {};
var internals = {
  config: {
    bots: []
  },
  alertParams: ['sample', 'setup']
};

externals.Bots = function () {
  function _class(bots) {
    _classCallCheck(this, _class);

    this.bots = [];
    internals.config.bots = bots;
    internals.init(this.bots);
    return this;
  }

  _createClass(_class, [{
    key: 'getBots',
    value: function getBots() {
      return this.bots;
    }
  }]);

  return _class;
}();

internals.init = function (bots) {
  _.forEach(internals.config.bots, function (bot) {
    var newbot = new Bot(internals.normalizeCommand(bot));
    if (newbot) {
      botLogger.logger.info('Bots: Bot instantiated correctly');
      bots.push(newbot);
    } else {
      botLogger.logger.warn('Bots: Error creating bot object,' + 'something bad with this bot config %j', bot);
    }
  });
  botLogger.logger.info('Bots: All bots read completed');
};

internals.normalizeCommand = function (bot) {
  var normalizedCommand = {};
  var stopTasks = [];
  var dataTasks = [];
  _.forEach(bot.botCommand, function (value, key) {
    var commandKey = _.toUpper(key).replace(/\s/g, '');
    if (value) {
      normalizedCommand[commandKey] = value;
      _.forEach(value, function (commandAttr, commandAttrkey) {
        var command = _.toUpper(commandAttr).replace(/\s/g, '');
        if (commandAttrkey === 'commandType') {
          value[commandAttrkey] = command;
          if (command === 'DATA') {
            dataTasks.push(commandKey);
          }
          if (_.includes(['ALERT', 'RECURSIVE'], command)) {
            if (command === 'ALERT') {
              value.allowedParam = internals.alertParams;
            }
            stopTasks.push(commandKey);
          }
        } else if (commandAttrkey === 'parentTask') {
          value[commandAttrkey] = command;
        }
      });
    }
  });

  if (dataTasks.length > 0 && bot.schedule) {
    normalizedCommand['SCHEDULE'] = {
      allowedParam: dataTasks,
      commandType: 'SCHEDULE'
    };
    stopTasks.push('SCHEDULE');
  }

  if (stopTasks.length > 0) {
    normalizedCommand['STOP'] = normalizedCommand['STOP'] ? normalizedCommand['STOP'] : {};
    normalizedCommand['STOP'].allowedParam = stopTasks;
    normalizedCommand['STOP'].commandType = 'KILL';
  }

  bot.botCommand = normalizedCommand;
  internals.mergeAllowedUsers(bot);
  return bot;
};

internals.mergeAllowedUsers = function (bot) {
  if (bot.allowedUsers) {
    _.forEach(bot.botCommand, function (command) {
      if (!command.allowedUsers) {
        command.allowedUsers = _.uniq(bot.allowedUsers);
      }
    });
  }
};

module.exports = externals.Bots;