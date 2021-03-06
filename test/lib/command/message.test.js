'use strict';

const chai = require('chai');
const expect = chai.expect;
const root = '../../../';

const _ = require('lodash');
const config = require(root + 'test/mock');
const sinonChai = require('sinon-chai');
const message = require(root + 'lib/command/message');

chai.use(sinonChai);

describe('/message', function () {
  let slackMessage = '';
  let messageParser;
  let messageOptions;

  beforeEach(function () {
    slackMessage = {
      type: 'message',
      channel: 'D0GL06JD7',
      user: 'U0GG92T45',
      text: 'ping 1',
      ts: '1453007224.000007',
      team: 'T0GGDKVDE',
    };
    messageOptions = {
      name: 'testbot1',
      id: 'U1234567',
      isDirectMessage: true,
    };
    messageParser = message.parse(
      _.map(_.keys(_.get(config, 'singleBot.bots.0.botCommand')),
        _.toUpper), messageOptions);
  });

  afterEach(function () {
    slackMessage = {};
  });

  describe('direct message', function () {
    it('Should correctly parse direct message', function () {
      const parsedMessage = messageParser(slackMessage);

      slackMessage.message = {
        command: 'PING',
        params: ['1'],
      };
      expect(parsedMessage).to.deep.equal(slackMessage);
    });

    it('Should correctly parse direct message with more params', function () {
      slackMessage.text = 'ping 1 2 3';
      const parsedMessage = messageParser(slackMessage);
      slackMessage.message = {
        command: 'PING',
        params: ['1', '2', '3'],
      };

      expect(parsedMessage).to.deep.equal(slackMessage);
    });

    it('Should correctly parse uuid in the params', function () {
      slackMessage.text = 'ping 39e5394a-36f8-49ca-9fed-b48019ee1845';
      const parsedMessage = messageParser(slackMessage);

      slackMessage.message = {
        command: 'PING',
        params: ['39e5394a-36f8-49ca-9fed-b48019ee1845'],
      };

      expect(parsedMessage).to.deep.equal(slackMessage);
    });

    it('Should correctly convert uppercase command to lowercase', function () {
      slackMessage.text = 'Ping 39e5394a-36f8-49ca-9fed-b48019ee1845';
      const parsedMessage = messageParser(slackMessage, true);

      slackMessage.message = {
        command: 'PING',
        params: ['39e5394a-36f8-49ca-9fed-b48019ee1845'],
      };

      expect(parsedMessage).to.deep.equal(slackMessage);
    });

    it('Should allow proper botname prefix in direct message', function () {
      slackMessage.text = '<@U1234567>: ping 123 456';
      const parsedMessage = messageParser(slackMessage, true);

      slackMessage.message = {
        command: 'PING',
        commandPrefix: 'U1234567',
        params: ['123', '456'],
      };

      expect(parsedMessage).to.deep.equal(slackMessage);
    });
  });

  describe('channel message', function () {
    it('Should correctly parse channel message', function () {
      slackMessage.text = '<@U1234567>: ping 1';

      const parsedMessage = messageParser(slackMessage, false);

      slackMessage.message = {
        commandPrefix: 'U1234567',
        command: 'PING',
        params: ['1'],
      };

      expect(parsedMessage).to.deep.equal(slackMessage);
    });

    it('Should correctly parse channel message for just @botname', function () {
      slackMessage.text = '@testbot1 ping 1';

      const parsedMessage = messageParser(slackMessage, false);

      slackMessage.message = {
        commandPrefix: 'TESTBOT1',
        command: 'PING',
        params: ['1'],
      };

      expect(parsedMessage).to.deep.equal(slackMessage);
    });

    it('Should correctly parse channel message with bot name and params',
      function () {
        slackMessage.text = 'testbot1 ping 1 2 3';

        const parsedMessage = messageParser(slackMessage, false);

        slackMessage.message = {
          commandPrefix: 'TESTBOT1',
          command: 'PING',
          params: ['1', '2', '3'],
        };

        expect(parsedMessage).to.deep.equal(slackMessage);
      });

    it('Should correctly parse channel message with bot mentions', function () {
      slackMessage.text = '<@U1234567>: ping 1 2 3';

      const parsedMessage = messageParser(slackMessage, false);

      slackMessage.message = {
        commandPrefix: 'U1234567',
        command: 'PING',
        params: ['1', '2', '3'],
      };

      expect(parsedMessage).to.deep.equal(slackMessage);
    });

    it('Should correctly parse channel message with bot id without colon',
      function () {
        slackMessage.text = '<@U1234567> ping 1 2 3';

        const parsedMessage = messageParser(slackMessage, false);

        slackMessage.message = {
          commandPrefix: 'U1234567',
          command: 'PING',
          params: ['1', '2', '3'],
        };

        expect(parsedMessage).to.deep.equal(slackMessage);
      });

    it('Should parse channel message with just numeric to empty object',
      function () {
        slackMessage.text = '1 2 3';

        const parsedMessage = messageParser(slackMessage, false);

        slackMessage.message = {};

        expect(parsedMessage).to.deep.equal(slackMessage);
      });

    it('Should correctly parse channel message with just spaces', function () {
      slackMessage.text = '    ';

      const parsedMessage = messageParser(slackMessage, false);

      slackMessage.message = {};

      expect(parsedMessage).to.deep.equal(slackMessage);
    });
  });
});
