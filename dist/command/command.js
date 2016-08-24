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

var botLogger = require(path.join(root, 'utils/logger'));

var externals = {};
var internals = {};

externals.Commands = function () {
  function _class(options) {
    _classCallCheck(this, _class);

    this.getBotConfig = options.getBotConfig;
    this.getSlackData = options.getSlackData;
    this.getHook = options.getHook;
    this.commandName = options.commandName;
    this.eventStore = options.eventStore;
    this.messageHandler = options.messageHandler;
    this.template = this.getTemplate();

    this.loadEvents();
    return this;
  }

  _createClass(_class, [{
    key: 'validate',
    value: function validate(slackResponse) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        if (!internals.isCommandAllowed(_this.getCommand(), slackResponse, _this.getSlackData().users)) {
          /* jshint ignore:start */
          return reject({
            restricted_user: true,
            users: _this.getCommand().allowedUsers,
            parsedMessage: slackResponse
          });
          /* jshint ignore:end */
        } else if (_this.setDefaultParams(_this.getCommand(), slackResponse, 0)) {
          return resolve();
        }

        var isLimitValid = internals.isLimitValid(_this.getCommand(), slackResponse);
        var isAllowedParamValid = internals.isAllowedParamValid(_this.getCommand(), slackResponse);

        if (isLimitValid || isAllowedParamValid) {
          return resolve();
        } else if (!isLimitValid || !isAllowedParamValid) {
          if (!isLimitValid && _this.getCommand().lowerLimit || _this.getCommand().upperLimit) {
            return reject({ limit: true, parsedMessage: slackResponse });
          }
          if (!isAllowedParamValid) {
            return reject({ param: true, parsedMessage: slackResponse });
          }
        } else if (!internals.isAlertValid(_this.getCommand(), slackResponse)) {
          reject({ alert: true, parsedMessage: slackResponse });
        } else {
          resolve();
        }
      });
    }
  }, {
    key: 'respond',
    value: function respond(parsedMessage) {
      var _this2 = this;

      return this.preprocess(parsedMessage).then(function () {
        return _this2.notify(parsedMessage);
      }).then(function () {
        return _this2.process(parsedMessage);
      }).catch(function (err) {
        botLogger.logger.info('Error processing command ', err);
      });
    }
  }, {
    key: 'notify',
    value: function notify(response) {
      return new Promise(function (resolve) {
        resolve(response);
      });
    }
  }, {
    key: 'loadEvents',
    value: function loadEvents() {
      var _this3 = this;

      var savedEvents = _.values(this.eventStore);
      if (savedEvents) {
        savedEvents.reduce(function (evPromise, savedEvent) {
          if (_.get(savedEvent, 'parsedMessage.message.command') === _this3.commandName) {
            _this3.reloadCommand(savedEvent.parsedMessage);
          }
        }, Promise.resolve());
      }
    }
  }, {
    key: 'reloadCommand',
    value: function reloadCommand(parsedMessage) {
      this.preprocess(parsedMessage).then(this.process(parsedMessage)).catch(function (err) {
        botLogger.logger.info('Error processing command ', err);
      });
    }
  }, {
    key: 'quietRespond',
    value: function quietRespond(parsedMessage) {
      this.process(parsedMessage).catch(function (err) {
        botLogger.logger.info('Error processing command ', err);
      });
    }
  }, {
    key: 'typingMessage',
    value: function typingMessage(parsedMessage) {
      this.messageHandler({
        channels: parsedMessage.channel,
        message: '',
        type: 'typing'
      });
    }
  }, {
    key: 'buildOptions',
    value: function buildOptions(slackResponse, slackData, purpose) {
      return {
        channel: slackResponse.channel,
        hookUrl: _.get(purpose, 'url', undefined),
        user: _.find(slackData.users, { 'id': slackResponse.user })
      };
    }
  }, {
    key: 'setDefaultParams',
    value: function setDefaultParams(command, slackResponse, level) {
      var param = internals.getParams(slackResponse, level);
      if (!param && param !== 0 && command.defaultParamValue) {
        slackResponse.message.params = slackResponse.message.params || [];
        slackResponse.message.params[level] = command.defaultParamValue;
        return true;
      }
      return false;
    }
  }, {
    key: 'getHookContext',
    value: function getHookContext(purpose, channel, command) {
      var hookContext = {};
      if (purpose && purpose.id) {
        hookContext[purpose.id] = {};
        hookContext[purpose.id].channel = channel;
        hookContext[purpose.id].command = command;
      }
      return hookContext;
    }
  }, {
    key: 'getParams',
    value: function getParams(slackResponse, level) {
      return internals.getParams(slackResponse, level);
    }
  }, {
    key: 'getCommand',
    value: function getCommand() {
      return this.getBotConfig().botCommand[this.commandName];
    }
  }, {
    key: 'getTemplate',
    value: function getTemplate() {
      var template = this.getBotConfig().botCommand[this.commandName].template;
      try {
        template = template ? template() : undefined;
      } catch (err) {
        botLogger.logger.error('Command: make sure to pass a compiled handlebar template', err);
      }
      return template;
    }
  }, {
    key: 'getTimer',
    value: function getTimer(parsedMessage) {
      return _.get(this.eventStore, parsedMessage.channel + '_' + this.commandName + '.timer');
    }
  }, {
    key: 'setTimer',
    value: function setTimer(parsedMessage, callback) {
      if (this.getTimer(parsedMessage)) {
        clearInterval(this.getTimer(parsedMessage));
      }
      _.set(this.eventStore, parsedMessage.channel + '_' + this.commandName + '.timer', callback);
    }
  }, {
    key: 'getStoreParsedMessage',
    value: function getStoreParsedMessage(parsedMessage) {
      return _.get(this.eventStore, parsedMessage.channel + '_' + this.commandName + '.parsedMessage');
    }
  }, {
    key: 'setEventStoreParsedMessage',
    value: function setEventStoreParsedMessage(parsedMessage) {
      return _.set(this.eventStore, parsedMessage.channel + '_' + this.commandName + '.parsedMessage', parsedMessage);
    }
  }]);

  return _class;
}();

internals.getParams = function (slackResponse, level) {
  if (_.get(slackResponse, 'message.params', []).length) {
    if (!_.isNaN(parseInt(slackResponse.message.params[level], 10))) {
      return parseInt(slackResponse.message.params[level], 10);
    }
    return _.get(slackResponse, 'message.params[' + level + ']');
  }
};

internals.isAllowedParamValid = function (command, slackResponse) {
  if (_.isEmpty(command.allowedParam)) {
    return false;
  }
  if (_.nth(command.allowedParam, 0) === '*' || _.includes(command.allowedParam, internals.getParams(slackResponse, 0))) {
    return true;
  }
  // assuming that limit is not defined.
  return false;
};

internals.isLimitValid = function (command, slackResponse) {
  if (!command.lowerLimit && !command.upperLimit) {
    return false;
  }

  var responseParam = internals.getParams(slackResponse, 0);
  if (responseParam >= 0) {
    var lowerLimit = parseInt(command.lowerLimit, 10) || 0;
    var upperLimit = parseInt(command.upperLimit, 10) || 0;
    if (_.isNaN(responseParam) || responseParam < lowerLimit || responseParam > upperLimit) {
      return false;
    }
    return true;
  }
  // assuming that limit is not defined.
  return false;
};

internals.isCommandAllowed = function (command, slackResponse, users) {
  if (command && command.allowedUsers) {
    var currentUser = _.find(users, { 'id': slackResponse.user });
    if (currentUser) {
      return _.includes(command.allowedUsers, currentUser.id) || _.includes(command.allowedUsers, currentUser.name);
    }
    return true;
  }
  return true;
};

module.exports = externals.Commands;