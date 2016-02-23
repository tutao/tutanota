/*
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

 var _supported = null; // set to null so we can check first time

 function isSupported() {
	// if not checked before, run check
    if (_supported == null) {
        var viewMan = Windows.UI.ViewManagement; 
        _supported = (viewMan.StatusBar && viewMan.StatusBar.getForCurrentView);
    }
    return _supported;
 }

function getViewStatusBar() {
    if (!isSupported()) {
        throw new Error("Status bar is not supported");
    }
    return Windows.UI.ViewManagement.StatusBar.getForCurrentView();
}

function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

module.exports = {
    _ready: function(win, fail) {
        win(statusBar.occludedRect.height !== 0);
    },

    overlaysWebView: function () {
        // not supported
    },

    styleDefault: function () {
        // dark text ( to be used on a light background )
        if (isSupported()) {
            getViewStatusBar().foregroundColor = { a: 0, r: 0, g: 0, b: 0 };
        }
    },

    styleLightContent: function () {
        // light text ( to be used on a dark background )
        if (isSupported()) {
            getViewStatusBar().foregroundColor = { a: 0, r: 255, g: 255, b: 255 };
        }
    },

    styleBlackTranslucent: function () {
        // #88000000 ? Apple says to use lightContent instead
        return module.exports.styleLightContent();
    },

    styleBlackOpaque: function () {
        // #FF000000 ? Apple says to use lightContent instead
        return module.exports.styleLightContent();
    },

    backgroundColorByHexString: function (win, fail, args) {
        var rgb = hexToRgb(args[0]);
        if(isSupported()) {
            var statusBar = getViewStatusBar();
            statusBar.backgroundColor = { a: 0, r: rgb.r, g: rgb.g, b: rgb.b };
            statusBar.backgroundOpacity = 1;
        }
    },

    show: function (win, fail) {
		// added support check so no error thrown, when calling this method
        if (isSupported()) {
            getViewStatusBar().showAsync().done(win, fail);
        }
    },

    hide: function (win, fail) {
		// added support check so no error thrown, when calling this method
        if (isSupported()) {
            getViewStatusBar().hideAsync().done(win, fail);
        }
    }
};
require("cordova/exec/proxy").add("StatusBar", module.exports);