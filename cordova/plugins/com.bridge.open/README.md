open
====

Open documents with compatible applications installed on the user's device.

## Install

```bash
$ cordova plugin add https://github.com/cordova-bridge/open
```

## Usage

The plugin exposes the following methods:

```javascript
cordova.plugins.bridge.open(file, success, error)
```

#### Parameters:

* __file:__ A string representing a local URI
* __success:__ Optional success callback
* __error:__ Optional error callback

## Example

#### Default usage

```javascript
cordova.plugins.bridge.open('file:/storage/sdcard/DCIM/Camera/1404177327783.jpg');
```

#### With optional callbacks

```javascript
var open = cordova.plugins.bridge.open;

function success() {
  console.log('Success');
}

function error(code) {
  if (code === 1) {
    console.log('No file handler found');
  } else {
    console.log('Undefined error');
  }
}

open('file:/storage/sdcard/DCIM/Camera/1404177327783.jpg', success, error);
```

## Links

- http://docs.phonegap.com/en/3.5.0/plugin_ref_plugman.md.html#Using%20Plugman%20to%20Manage%20Plugins
- http://docs.phonegap.com/en/3.5.0/guide_hybrid_plugins_index.md.html#Plugin%20Development%20Guide
- http://docs.phonegap.com/en/3.5.0/guide_platforms_android_plugin.md.html#Android%20Plugins
- http://docs.phonegap.com/en/3.5.0/guide_platforms_ios_plugin.md.html#iOS%20Plugins
- https://github.com/apache/cordova-ios/blob/master/CordovaLib/Classes/CDVPlugin.m
