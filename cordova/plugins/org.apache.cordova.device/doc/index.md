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

# org.apache.cordova.device

This plugin defines a global `device` object, which describes the device's hardware and software.
Although the object is in the global scope, it is not available until after the `deviceready` event.

    document.addEventListener("deviceready", onDeviceReady, false);
    function onDeviceReady() {
        console.log(device.cordova);
    }

## Installation

    cordova plugin add org.apache.cordova.device

## Properties

- device.cordova
- device.model
- device.platform
- device.uuid
- device.version

## device.cordova

Get the version of Cordova running on the device.

### Supported Platforms

- Amazon Fire OS
- Android
- BlackBerry 10
- Browser
- Firefox OS
- iOS
- Tizen
- Windows Phone 7 and 8
- Windows 8

## device.model

The `device.model` returns the name of the device's model or
product. The value is set by the device manufacturer and may be
different across versions of the same product.

### Supported Platforms

- Android
- BlackBerry 10
- Browser
- iOS
- Tizen
- Windows Phone 7 and 8
- Windows 8

### Quick Example

    // Android:    Nexus One       returns "Passion" (Nexus One code name)
    //             Motorola Droid  returns "voles"
    // BlackBerry: Torch 9800      returns "9800"
    // Browser:    Google Chrome   returns "Chrome"
    //             Safari          returns "Safari"
    // iOS:     for the iPad Mini, returns iPad2,5; iPhone 5 is iPhone 5,1. See http://theiphonewiki.com/wiki/index.php?title=Models
    //
    var model = device.model;

### Android Quirks

- Gets the [product name](http://developer.android.com/reference/android/os/Build.html#PRODUCT) instead of the [model name](http://developer.android.com/reference/android/os/Build.html#MODEL), which is often the production code name. For example, the Nexus One returns `Passion`, and Motorola Droid returns `voles`.

### Tizen Quirks

- Returns the device model assigned by the vendor, for example, `TIZEN`

### Windows Phone 7 and 8 Quirks

- Returns the device model specified by the manufacturer. For example, the Samsung Focus returns `SGH-i917`.

## device.platform

Get the device's operating system name.

    var string = device.platform;

### Supported Platforms

- Android
- BlackBerry 10
- Browser4
- Firefox OS
- iOS
- Tizen
- Windows Phone 7 and 8
- Windows 8

### Quick Example

    // Depending on the device, a few examples are:
    //   - "Android"
    //   - "BlackBerry 10"
    //   - Browser:         returns "MacIntel" on Mac
    //                      returns "Win32" on Windows
    //   - "iOS"
    //   - "WinCE"
    //   - "Tizen"
    var devicePlatform = device.platform;

### Windows Phone 7 Quirks

Windows Phone 7 devices report the platform as `WinCE`.

### Windows Phone 8 Quirks

Windows Phone 8 devices report the platform as `Win32NT`.

## device.uuid

Get the device's Universally Unique Identifier ([UUID](http://en.wikipedia.org/wiki/Universally_Unique_Identifier)).

    var string = device.uuid;

### Description

The details of how a UUID is generated are determined by the device manufacturer and are specific to the device's platform or model.

### Supported Platforms

- Android
- BlackBerry 10
- iOS
- Tizen
- Windows Phone 7 and 8
- Windows 8

### Quick Example

    // Android: Returns a random 64-bit integer (as a string, again!)
    //          The integer is generated on the device's first boot
    //
    // BlackBerry: Returns the PIN number of the device
    //             This is a nine-digit unique integer (as a string, though!)
    //
    // iPhone: (Paraphrased from the UIDevice Class documentation)
    //         Returns a string of hash values created from multiple hardware identifies.
    //         It is guaranteed to be unique for every device and can't be tied
    //         to the user account.
    // Windows Phone 7 : Returns a hash of device+current user,
    // if the user is not defined, a guid is generated and will persist until the app is uninstalled
    // Tizen: returns the device IMEI (International Mobile Equipment Identity or IMEI is a number
    // unique to every GSM and UMTS mobile phone.
    var deviceID = device.uuid;

### iOS Quirk

The `uuid` on iOS is not unique to a device, but varies for each
application, for each installation.  It changes if you delete and
re-install the app, and possibly also when you upgrade iOS, or even
upgrade the app per version (apparent in iOS 5.1). The `uuid` is not
a reliable value.

### Windows Phone 7 and 8 Quirks

The `uuid` for Windows Phone 7 requires the permission
`ID_CAP_IDENTITY_DEVICE`.  Microsoft will likely deprecate this
property soon.  If the capability is not available, the application
generates a persistent guid that is maintained for the duration of the
application's installation on the device.

## device.version

Get the operating system version.

    var string = device.version;

### Supported Platforms

- Android 2.1+
- BlackBerry 10
- Browser
- iOS
- Tizen
- Windows Phone 7 and 8
- Windows 8

### Quick Example

    // Android:    Froyo OS would return "2.2"
    //             Eclair OS would return "2.1", "2.0.1", or "2.0"
    //             Version can also return update level "2.1-update1"
    //
    // BlackBerry: Torch 9800 using OS 6.0 would return "6.0.0.600"
    //
    // Browser:    Returns version number for the browser
    //
    // iPhone:     iOS 3.2 returns "3.2"
    //
    // Windows Phone 7: returns current OS version number, ex. on Mango returns 7.10.7720
    // Tizen: returns "TIZEN_20120425_2"
    var deviceVersion = device.version;

