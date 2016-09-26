
var argscheck = require('cordova/argscheck'),
    utils = require('cordova/utils'),
    exec = require('cordova/exec');


var Keyboard = function() {
};

Keyboard.hideKeyboardAccessoryBar = function(hide) {
    // exec(null, null, "Keyboard", "hideKeyboardAccessoryBar", [hide]);
    console.warn('hideKeyboardAccessoryBar has been removed until a method is found that doesn\'t get rejected from the App Store.')
};

Keyboard.close = function() {
    exec(null, null, "Keyboard", "close", []);
};

Keyboard.show = function() {
    console.warn('Showing keyboard not supported in iOS due to platform limitations.')
    console.warn('Instead, use input.focus(), and ensure that you have the following setting in your config.xml: \n');
    console.warn('    <preference name="KeyboardDisplayRequiresUserAction" value="false"/>\n');
    // exec(null, null, "Keyboard", "show", []);
};

Keyboard.disableScroll = function(disable) {
    exec(null, null, "Keyboard", "disableScroll", [disable]);
};

/*
Keyboard.styleDark = function(dark) {
 exec(null, null, "Keyboard", "styleDark", [dark]);
};
*/

Keyboard.isVisible = false;

module.exports = Keyboard;



