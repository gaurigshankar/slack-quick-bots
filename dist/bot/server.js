/*
 * slack-bot
 * https://github.com/usubram/slack-bot
 *
 * Copyright (c) 2016 Umashankar Subramanian
 * Licensed under the MIT license.
 */

'use strict';

// Load modules

var http = require('http');

var externals = {};
var internals = {
  defaultPort: 8080
};

externals.setupServer = function (config, handler, callback) {
  var server = http.createServer(handler);
  var port = config.port || internals.defaultPort;
  var hostname = config.hostname || '0.0.0.0';
  server.listen(port, hostname, function () {
    callback(null, server);
    /* jshint ignore:start */
    console.log('Server listening on ', port, config.hostname);
    /* jshint ignore:end */
  }).on('error', function (err) {
    if (err) {
      throw new Error(err);
    }
    callback(true);
  });
};

module.exports = externals;