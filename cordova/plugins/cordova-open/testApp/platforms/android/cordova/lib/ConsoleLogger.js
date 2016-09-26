/**
    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
*/

var loggerInstance;
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var CordovaError = require('cordova-common').CordovaError;

/**
 * @class ConsoleLogger
 * @extends EventEmitter
 *
 * Implementing basic logging for platform. Inherits regular NodeJS
 *   EventEmitter. All events, emitted on this class instance are immediately
 *   logged to console.
 *
 * Also attaches handler to process' uncaught exceptions, so these exceptions
 *   logged to console similar to regular error events.
 */
function ConsoleLogger() {
    EventEmitter.call(this);

    var isVerbose = process.argv.indexOf('-d') >= 0 || process.argv.indexOf('--verbose') >= 0;
    // For CordovaError print only the message without stack trace unless we
    // are in a verbose mode.
    process.on('uncaughtException', function(err){
        if ((err instanceof CordovaError) && isVerbose) {
            console.error(err.stack);
        } else {
            console.error(err.message);
        }
        process.exit(1);
    });

    this.on('results', console.log);
    this.on('verbose', function () {
        if (isVerbose)
            console.log.apply(console, arguments);
    });
    this.on('info', console.log);
    this.on('log', console.log);
    this.on('warn', console.warn);
}
util.inherits(ConsoleLogger, EventEmitter);

/**
 * Returns already instantiated/newly created instance of ConsoleLogger class.
 *   This method should be used instead of creating ConsoleLogger directly,
 *   otherwise we'll get multiple handlers attached to process'
 *   uncaughtException
 *
 * @return  {ConsoleLogger}  New or already created instance of ConsoleLogger
 */
ConsoleLogger.get = function () {
    loggerInstance = loggerInstance || new ConsoleLogger();
    return loggerInstance;
};

module.exports = ConsoleLogger;
