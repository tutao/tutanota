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

var exec = require('cordova/exec');

/**
 * Provides access to the vibration mechanism on the device.
 */

module.exports = {

    /**
     * Vibrates the device for a given amount of time.
     *
     * @param {Integer} mills       The number of milliseconds to vibrate.
     */
    vibrate: function(mills) {
        exec(null, null, "Vibration", "vibrate", [mills]);
    },

    /**
     * Vibrates the device with a given pattern.
     *
     * @param {Array of Integer} pattern    Pattern with which to vibrate the device.
     *                                      Pass in an array of integers that
     *                                      are the durations for which to
     *                                      turn on or off the vibrator in
     *                                      milliseconds. The first value
     *                                      indicates the number of milliseconds
     *                                      to wait before turning the vibrator
     *                                      on. The next value indicates the
     *                                      number of milliseconds for which
     *                                      to keep the vibrator on before
     *                                      turning it off. Subsequent values
     *                                      alternate between durations in
     *                                      milliseconds to turn the vibrator
     *                                      off or to turn the vibrator on.
     *
     * @param {Integer} repeat              Optional index into the pattern array at which
     *                                      to start repeating (will repeat until canceled),
     *                                      or -1 for no repetition (default).
     */
    vibrateWithPattern: function(pattern, repeat) {
        repeat = (typeof repeat !== "undefined") ? repeat : -1;
        exec(null, null, "Vibration", "vibrateWithPattern", [pattern, repeat]);
    },

    /**
     * Immediately cancels any currently running vibration.
     */
    cancelVibration: function() {
        exec(null, null, "Vibration", "cancelVibration", []);
    },
};
