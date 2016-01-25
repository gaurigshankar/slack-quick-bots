'use strict';

const SlackBot = require('./lib/index');
const handlebars = require('handlebars');
const fs = require('fs');
const sampleTemplate = fs.readFileSync('./sample.hbs', 'utf8');

var config = {
  'bots': [{
    'botCommand': {
      'PING': {
        'commandType': 'DATA',
        'allowedParam': [1, 2],
        'defaultParamValue': 1,
        'template': function() {
          return handlebars.compile(sampleTemplate);
        },
        'data': function(command, param, callback) {
          callback({
            'param': param
          });
        }
      },
      'AUTO': {
        'commandType': 'RECURSIVE',
        'lowerLimit': 0,
        'upperLimit': 100,
        'defaultParamValue': 1,
        'template': function() {
          return handlebars.compile(sampleTemplate);
        },
        'data': function(command, param, callback) {
          callback({
            'param': param
          });
        }
      },
      'STOP': {
        'commandType': 'KILL',
        'parentTask': 'AUTO'
      }
    },
    'botToken': 'xoxb-16681282704-dYYl7qESWogOUbzdJdqwK5gS'
  }, {
    'botCommand': {
      'STATUS': {
        'commandType': 'DATA',
        'allowedParam': ['what', 'there'],
        'timeUnit': 'm',
        'defaultParamValue': 'what',
        'template': function() {
          return handlebars.compile(sampleTemplate);
        },
        'data': function(command, param, callback) {
          callback({
            'param': param
          });
        }
      },
      'UPDATE': {
        'commandType': 'RECURSIVE',
        'lowerLimit': 0,
        'upperLimit': 100,
        'defaultParamValue': 1,
        'template': function() {
          return handlebars.compile(sampleTemplate);
        },
        'data': function(command, param, callback) {
          callback({
            'param': param
          });
        }
      },
      'STOP': {
        'commandType': 'KILL',
        'parentTask': 'UPDATE'
      }
    },
    'botToken': 'xoxb-16680277201-33xVzeZqKopVPx03GQYNeBwT'
  }],
  logger: console  // you could pass a winston logger.
};

var slackBot = new SlackBot(config);
slackBot.start();