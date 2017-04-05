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
const path = require('path');
const CronJob = require('cron').CronJob;
const cronTimeout = require('cron').timeout;
const root = '..';

const logger = require(path.join(root, '../utils/logger'));
const Command = require(path.join(root, 'command'));
const responseHandler = require(path.join(root, '../bot/response-handler'));
const storage = require(path.join(root, '../storage/storage'));

const externals = {};
const internals = {};

externals.Schedule = class extends Command {
  constructor (options) {
    super(options);
    return this;
  }

  preprocess (parsedMessage) {
    return Promise.resolve({
      then: (onFulfill, onReject) => {
        try {

          let job = new CronJob({
            cronTime: internals.getCronExpresion(parsedMessage),
            onTick: () => {
              const scheduleCommand = internals.getCommandArguments(parsedMessage);
              const scheduleTask = _.toUpper(_.get(scheduleCommand, 'message.command'));
              const command = this.context[scheduleTask];
              command.quietRespond(scheduleCommand);
            },
            start: false,
            timeZone: 'America/Los_Angeles'
          });

          job.start();
          logger.debug('schduled job for ', internals.getCronExpresion(parsedMessage));

          this.setTimer(parsedMessage, job);
        } catch (err) {
          onReject(err);
        }

        onFulfill(parsedMessage);
      }
    });
  }

  process (parsedMessage) {
    return Promise.resolve({
      then: (onFulfill, onReject) => {
        const scheduleCommand = internals.getCommandArguments(parsedMessage);
        this.callback = (data) => {
          onFulfill(this.message.bind(this, scheduleCommand)(data));
        };

        try {
          this.getCommand(_.get(scheduleCommand, 'message.command')).data.apply(this, [{
            command: scheduleCommand.message.command, params: scheduleCommand.message.params
          },
            this.buildOptions(scheduleCommand, this.getSlackData(), this.purpose),
            this.callback]);
        } catch (err) {
          logger.error('Command: error calling handler,' +
            'make sure to pass a proper function', err, err.stack);
          return onReject(err);
        }
      }
    });
  }

  notify (parsedMessage) {
    const timeleft = cronTimeout(internals.getCronExpresion(parsedMessage));
    let nextEvent;

    if (timeleft && timeleft > 0) {
      nextEvent = new Date(Date.now() + timeleft);
    }

    return Promise.resolve({
      then: (onFulfill) => {
        this.messageHandler({
          channels: parsedMessage.channel,
          message: responseHandler.generateBotResponseTemplate({
            parsedMessage: parsedMessage,
            /* jshint ignore:start */
            schedule_success: true,
            next_event: nextEvent || false
            /* jshint ignore:end */
          })
        });
        onFulfill();
      }
    });
  }

  validate (parsedMessage) {
    const scheduleCommand = internals.getCommandArguments(parsedMessage);
    const scheduleTask = _.toUpper(_.get(scheduleCommand, 'message.command'));
    const command = this.context[scheduleTask];

    if (!command) {
      return Promise.reject({ invalidCommand: true, parsedMessage: parsedMessage });
    }

    return Promise.resolve(this.isCommandValid(scheduleCommand, command))
      .then(() => {
        return this.isCronValid(internals.getCronExpresion(parsedMessage), parsedMessage);
      });
  }

  isCommandValid (scheduleCommand, command) {
    return Promise.resolve(command.validate(scheduleCommand));
  }

  isCronValid (cron, parsedMessage) {
    return Promise.resolve({
      then: (onFulfill, onReject) => {
        try {
          if (_.isEmpty(cron) || cron.length > 9 && cron.indexOf('* * * * *') > -1) {
            onReject({ invalidCron: true, parsedMessage: parsedMessage });
          }

          let testCron = new CronJob(cron, () => { });
          testCron.stop();
          onFulfill();
        } catch (err) {
          logger.error('Invalid cron ', err);
          onReject({ invalidCron: true, parsedMessage: parsedMessage });
        }
      }
    });
  }

  setTimer (parsedMessage, job) {
    const scheduleCommand = internals.getCommandArguments(parsedMessage);
    const scheduleTask = _.toUpper(_.get(scheduleCommand, 'message.command'));

    if (this.getTimer(parsedMessage)) {
      this.getTimer(parsedMessage).stop();
    }

    _.set(this.eventStore,
        scheduleCommand.channel + '_schedule_' + scheduleTask + '.timer', job);
  }

  getTimer (parsedMessage) {
    const scheduleCommand = internals.getCommandArguments(parsedMessage);
    const scheduleTask = _.toUpper(_.get(scheduleCommand, 'message.command'));

    return _.get(this.eventStore,
      scheduleCommand.channel + '_schedule_' + scheduleTask + '.timer');
  }

  setEvent (parsedMessage) {
    return Promise.resolve({
      then: (onFulfill, onReject) => {
        storage.updateEvents(this.getSlackData().self.name, 'schedule', {
          parsedMessage: parsedMessage,
          channels: [parsedMessage.channel]
        }).then(() => {
          onFulfill(parsedMessage);
        }).catch((err) => {
          onReject(err);
        });
      }
    });
  }
};

internals.getCronExpresion = function (parsedMessage) {
  let cronRegex = /\((.*?)\)/;
  let cronExpresion = cronRegex.exec(_.join(parsedMessage.message.params, ' '));
  return _.trim(_.nth(cronExpresion, 1));
};

internals.getCommandArguments = function (parsedMessage) {
  let result = [];
  _.forEach(_.slice(_.get(parsedMessage, 'message.params'), 1,
      _.get(parsedMessage, 'message.params', []).length), function (value) {
    if (_.isString(value) && value.indexOf('(') > -1) {
      return false;
    }
    result.push(value);
  });

  return {
    type: 'message',
    channel: parsedMessage.channel,
    user: parsedMessage.user,
    message: {
      command: _.nth(parsedMessage.message.params),
      params: result
    }
  };
};

module.exports = externals.Schedule;
