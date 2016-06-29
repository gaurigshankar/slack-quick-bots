/*
 * slack-bot
 * https://github.com/usubram/slack-bot
 *
 * Copyright (c) 2016 Umashankar Subramanian
 * Licensed under the MIT license.
 */

'use strict';

const fs = require('fs');
const _ = require('lodash');
const path = require('path');

const botLogger = require('./../../lib/utils/logger');

const internals = {
  STORAGE_DIRECTORY: path.join(process.cwd(), 'data'),
  EVENT_FILE_PATH: ''
};

internals.EVENT_FILE_PATH = path.join(internals.STORAGE_DIRECTORY, 'events.json');

exports = module.exports.createEventDirectory = function () {
  fs.mkdir(internals.STORAGE_DIRECTORY, function (e) {
    if (!e || (e && e.code === 'EEXIST')) {
      botLogger.logger.debug('storage: directory already exist');
    } else {
      botLogger.logger.error('storage: unable create storage for ' +
        'persitance, check if you write permission');
    }
  });
};

exports = module.exports.updateEvents = function (botName, eventType, data) {
  Promise.resolve(internals.readFile('events'))
    .then((eventsData) => {
      if (data && data.parsedMessage && data.channels) {
        eventsData = eventsData ? eventsData : {};
        eventsData[botName] = eventsData[botName] ? eventsData[botName] : {};
        _.forEach(data.channels, function (channel) {
          eventsData[botName][channel + '_' + data.parsedMessage.message.command] = data;
        });
        return internals.writeFile('events', eventsData);
      }
    }).then((responseData) => {
      botLogger.logger.info('storage: events updates successfully');
      botLogger.logger.debug('storage: events updated successfully for ', responseData);
    }).catch((err) => {
      botLogger.logger.info('storage: events update failed');
      botLogger.logger.debug('storage: error updating events for ', err);
    });
};

exports = module.exports.removeEvents = function (botName, eventType, data) {
  Promise.resolve(internals.readFile('events'))
    .then((eventsData) => {
      if (data && data.parsedMessage && data.channels) {
        eventsData = eventsData ? eventsData : {};
        eventsData[botName] = eventsData[botName] ? eventsData[botName] : {};
        _.forEach(data.channels, function (channel) {
          delete eventsData[botName][channel + '_' + data.command];
        });
        return internals.writeFile('events', eventsData);
      }
    }).then((responseData) => {
      botLogger.logger.info('storage: events updates successfully');
      botLogger.logger.debug('storage: events updated successfully for ', responseData);
    }).catch((err) => {
      botLogger.logger.info('storage: events update failed');
      botLogger.logger.debug('storage: error updating events for ', err);
    });
};

exports = module.exports.getEvents = function (eventType) {
  return internals.readFile(eventType);
};

internals.readFile = function (fileType) {
  var path = '';
  var fileData = '';
  if (fileType === 'events') {
    path = internals.EVENT_FILE_PATH;
  }

  return new Promise((resolve, reject) => {
    fs.readFile(path, { encoding: 'utf8', flag: 'a+' }, function (err, data) {
      if (err) {
        return reject(err);
      }
      try {
        if (data) {
          fileData = JSON.parse(data);
        }
      } catch (readErr) {
        botLogger.logger.info('storage: read file failed');
        botLogger.logger.debug('storage: read file failed', readErr, path);
        return reject(readErr);
      }
      resolve(fileData);
    });
  });
};

internals.writeFile = function (fileType, data) {
  var path = '';
  var fileData = JSON.stringify(data, null, 2);
  if (fileType === 'events') {
    path = internals.EVENT_FILE_PATH;
  }

  return new Promise((resolve, reject) => {
    fs.writeFile(path, fileData, { encoding: 'utf8', flag: 'w+' }, function (err, data) {
      if (err) {
        botLogger.logger.info('storage: write file failed');
        botLogger.logger.debug('storage: write file failed', err, path);
        return reject(err);
      }
      resolve(data);
    });
  });
};
