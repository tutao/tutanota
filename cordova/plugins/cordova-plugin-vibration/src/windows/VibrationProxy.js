/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
 */

/* global Windows, WinJS, Vibration */

function checkReqs(actionName, fail) {
    if (!(Windows.Phone && Windows.Phone.Devices && Windows.Phone.Devices.Notification && Windows.Phone.Devices.Notification.VibrationDevice) && WinJS.Utilities.isPhone !== true) {       
        fail(actionName + ' is unsupported by this platform.');
        return false;
    }

    return true;
}

function tryDoAction(actionName, success, fail, args, action) {
    try {
        if (checkReqs(actionName, fail) !== true) {
            return;
        }

        action(args);
        success();
    } catch (e) {
        fail('Error occured while trying to ' + actionName + ': ' + e);
    }
}

/** 
 * @typedef patternParsingResult
 * @type {Object}
 * @property {Array} result.parsed - Array with parsed integers
 * @property {Boolean} result.passed - false in case of parsing error
 * @property {*} result.failedItem - The item, which could not be parsed
 */

/**
 * Tries to convert pattern values to int
 * @param  {Array} pattern Array of delays
 * @returns {patternParsingResult} result
 */
function tryParsePatternValues(pattern) {
    var passed = true, failedItem;

    pattern = pattern.map(function (item) {
        var num = parseInt(item, 10);
        if (isNaN(num)) {
            failedItem = item;
            passed = false;
        }

        return num;
    });

    return {
        parsed: pattern,
        passed: passed,
        failedItem: failedItem
    };
}

/** 
 * @typedef checkPatternReqsResult
 * @type {Object}
 * @property {Array} result.patternParsingResult - Array with parsed integers
 * @property {Boolean} result.passed - true if all params are OK
 */

/**
 * Checks params for vibrateWithPattern function
 * @return {checkPatternReqsResult}
 */
function checkPatternReqs(args, fail) {
    var patternParsingResult = tryParsePatternValues(args[0]);
    var repeat = args[1];
    var passed = true, errMsg = '';

    if (!patternParsingResult.passed) {
        errMsg += 'Could not parse ' + patternParsingResult.failedItem + ' in the vibration pattern';
        passed = false;
    }

    if (repeat !== -1 && (repeat < 0 || repeat > args[0].length - 1)) {
        errMsg += '\nrepeat parameter is out of range: ' + repeat;
        passed = false;
    }

    if (!passed) {
        console.error(errMsg);
        if (fail) {
            fail(errMsg);
        }
    }

    return {
        passed: passed,
        patternParsingResult: patternParsingResult
    };
}

/**
 * vibrateWithPattern with `repeat` support
 * @param  {Array} patternArr Full pattern array
 * @param  {Boolean} shouldRepeat Indication on whether the vibration should be cycled
 * @param  {Function} fail Fail callback
 * @param  {Array} patternCycle Cycled part of the pattern array
 * @return {Promise} Promise chaining single vibrate/pause actions
 */
function vibratePattern(patternArr, shouldRepeat, fail, patternCycle) {
    return patternArr.reduce(function (previousValue, currentValue, index) {
        if (index % 2 === 0) {
            return previousValue.then(function () {
                module.exports.vibrate(function () { }, function (err) {
                    console.error(err);
                    if (fail) {
                        fail(err);
                    }
                }, [currentValue]);

                if (index === patternArr.length - 1 && shouldRepeat) {
                    return WinJS.Promise.timeout(currentValue).then(function () {
                        return vibratePattern(patternCycle, true, fail, patternCycle);
                    });
                } else {
                    return WinJS.Promise.timeout(currentValue);
                }
            });
        } else {
            return previousValue.then(function () {
                if (index === patternArr.length - 1 && shouldRepeat) {
                    return WinJS.Promise.timeout(currentValue).then(function () {
                        return vibratePattern(patternCycle, true, fail, patternCycle);
                    });
                } else {
                    return WinJS.Promise.timeout(currentValue);
                }
            });
        }
    }, WinJS.Promise.as());
}

var DEFAULT_DURATION = 200;
var patternChainPromise;

var VibrationDevice = (Windows.Phone && Windows.Phone.Devices && Windows.Phone.Devices.Notification && Windows.Phone.Devices.Notification.VibrationDevice && Windows.Phone.Devices.Notification.VibrationDevice);
if (VibrationDevice) {
    // Windows Phone 10 code paths
    module.exports = {
        vibrate: function(success, fail, args) {
            try {
                var duration = parseInt(args[0]);
                if (isNaN(duration)) {
                    duration = DEFAULT_DURATION;
                }
                VibrationDevice.getDefault().vibrate(duration);
                success();
            }
            catch (e) {
                fail(e);
            }
        }, 
        vibrateWithPattern: function (success, fail, args) {
            // Cancel current vibrations first
            module.exports.cancelVibration(function () {
                var checkReqsResult = checkPatternReqs(args, fail);
                if (!checkReqsResult.passed) {
                    return;
                }

                var pattern = checkReqsResult.patternParsingResult.parsed;
                var repeatFromIndex = args[1];
                var shouldRepeat = (repeatFromIndex !== -1);
                var patternCycle;

                if (shouldRepeat) {
                    patternCycle = pattern.slice(repeatFromIndex);
                }

                patternChainPromise = vibratePattern(pattern, shouldRepeat, fail, patternCycle);
            }, fail);
        },
        cancelVibration: function(success, fail, args) {
            try {
                if (patternChainPromise) {
                    patternChainPromise.cancel();
                }
                VibrationDevice.getDefault().cancel();
                if (success) {
                    success();
                }
            }
            catch (e) {
                if (fail) {
                    fail(e);
                }
            }
        }
    };
} else if (typeof Vibration !== 'undefined' && Vibration.Vibration) { 
    // Windows Phone 8.1 code paths
    module.exports = {
        vibrate: function (success, fail, args) {
            tryDoAction("vibrate", success, fail, args, Vibration.Vibration.vibrate);
        },

        vibrateWithPattern: function (success, fail, args) {
            tryDoAction("vibrate", success, fail, [DEFAULT_DURATION], Vibration.Vibration.vibrate);
        },

        cancelVibration: function (success, fail, args) {
            tryDoAction("cancelVibration", success, fail, args, Vibration.Vibration.cancelVibration);
        }
    };
} else {
    // code paths where no vibration mechanism is present
    module.exports = {
        vibrate: function (success, fail) {
            if (fail) {
                fail('"vibrate" is unsupported by this device.');
            }
        },
        vibrateWithPattern: function (success, fail, args) {
            if (fail) {
                fail('"vibrateWithPattern" is unsupported by this device.');
            }
        },

        cancelVibration: function (success, fail, args) {
            if (success) {
                success();
            }
        }
    };
}

require("cordova/exec/proxy").add("Vibration", module.exports);
