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

/*jslint sloppy:true */
/*global Windows:true, require, module, window, document, WinJS */

var cordova = require('cordova'),
    channel = require('cordova/channel');

var isPhone = (cordova.platformId == "windows") && WinJS.Utilities.isPhone;
var isHosted = window.location.protocol.indexOf('http') === 0;
var localSplash = null;
var bgColor = "#464646"; // default backgrond color; TDOO - read it from .appxmanifest
var splashImageSrc = (isHosted ? "ms-appx-web" : "ms-appx") + ":///images/"
    + (isPhone ? "splashscreenphone.png" : "splashscreen.png");

var SplashScreen = {
    setBGColor: function (cssBGColor) {
        bgColor = cssBGColor;
        if (localSplash) {
            localSplash.style.backgroundColor = bgColor;
        }
    },
    show: function () {
        if (localSplash) {
            return; // already showed
        }

        localSplash = document.createElement("div");
        localSplash.style.backgroundColor = bgColor;
        localSplash.style.position = "fixed";
        localSplash.style.top = "0";
        localSplash.style.width = "100%";
        localSplash.style.height = "100%";

        localSplashImage = document.createElement("img");
        localSplashImage.src = splashImageSrc;
        localSplashImage.style.maxWidth = "100%";
        localSplashImage.style.maxHeight = "100%";
        // center horizontally
        localSplashImage.style.margin = "0 auto";
        localSplashImage.style.display = "block";
        // center vertically
        localSplashImage.style.position = "relative";
        localSplashImage.style.top = "50%";
        localSplashImage.style.transform = "translateY(-50%)";

        localSplash.appendChild(localSplashImage);
        document.body.appendChild(localSplash);
    },
    hide: function () {
        if (localSplash) {
            document.body.removeChild(localSplash);
            localSplash = null;
        }
    }
};

module.exports = SplashScreen;

require("cordova/exec/proxy").add("SplashScreen", SplashScreen);
