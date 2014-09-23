<!---
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
-->

# org.apache.cordova.vibration

This plugin provides a way to vibrate the device.

## Installation

    cordova plugin add org.apache.cordova.vibration

## Supported Platforms

navigator.notification.vibrate
- Amazon Fire OS
- Android
- BlackBerry 10
- Firefox OS
- iOS
- Windows Phone 7 and 8

navigator.notification.vibrateWithPattern,<br />navigator.notification.cancelVibration
- Android

## notification.vibrate

Vibrates the device for a given amount of time.

    navigator.notification.vibrate(time)

- __time__: Milliseconds to vibrate the device. _(Number)_

### Example

    // Vibrate for 2.5 seconds
    navigator.notification.vibrate(2500);

### iOS Quirks

- __time__: Ignores the specified time and vibrates for a pre-set amount of time.

        navigator.notification.vibrate();
        navigator.notification.vibrate(2500);   // 2500 is ignored

## notification.vibrateWithPattern

Vibrates the device with a given pattern.

    navigator.notification.vibrateWithPattern(pattern, repeat)

- __pattern__: Sequence of durations (in milliseconds) for which to turn on or off the vibrator. _(Array of Numbers)_
- __repeat__: Optional index into the pattern array at which to start repeating (will repeat until canceled), or -1 for no repetition (default). _(Number)_

### Example

    // Immediately start vibrating
    // vibrate for 100ms,
    // wait for 100ms,
    // vibrate for 200ms,
    // wait for 100ms,
    // vibrate for 400ms,
    // wait for 100ms,
    // vibrate for 800ms,
    // (do not repeat)
    navigator.notification.vibrateWithPattern([0, 100, 100, 200, 100, 400, 100, 800]);

## notification.cancelVibration

Immediately cancels any currently running vibration.

    navigator.notification.cancelVibration()
