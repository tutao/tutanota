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

/* This is the actual implementation part that returns the result on Windows 8
*/

var position = { x: 0, y: 0, width: 0, height: 0 };  // defined by evt.detail.splashScreen.imageLocation
var splash = null; //
var localSplash; // the image to display
var localSplashImage;
var bgColor = "#464646";



function updateImageLocation() {
    localSplash.style.width = window.innerWidth + "px";
    localSplash.style.height = window.innerHeight + "px";
    localSplash.style.top = "0px";
    localSplash.style.left = "0px";

    localSplashImage.style.top = position.y + "px";
    localSplashImage.style.left = position.x + "px";
    localSplashImage.style.height = position.height + "px";
    localSplashImage.style.width = position.width + "px";
}

function onResize(evt) {
    if (splash) {
        position = splash.imageLocation;
        updateImageLocation();
    }
}

var SplashScreen = {
    setBGColor: function (cssBGColor) {
        bgColor = cssBGColor;
        if (localSplash) {
            localSplash.style.backgroundColor = bgColor;
        }
    },
    show: function () {
        window.addEventListener("resize", onResize, false);
        localSplash = document.createElement("div");
        localSplash.style.backgroundColor = bgColor;
        localSplash.style.position = "absolute";

        localSplashImage = document.createElement("img");
        localSplashImage.src = "ms-appx:///images/splashscreen.png";
        localSplashImage.style.position = "absolute";

        updateImageLocation();

        localSplash.appendChild(localSplashImage);
        document.body.appendChild(localSplash);
    },
    hide: function () {
        window.removeEventListener("resize", onResize, false);
        document.body.removeChild(localSplash);
        localSplash = null;
    }
};

module.exports = SplashScreen;

function activated(evt) {
    if (evt.detail.kind === Windows.ApplicationModel.Activation.ActivationKind.launch) {
        splash = evt.detail.splashScreen;
        position = evt.detail.splashScreen.imageLocation;
    }
}




channel.onCordovaReady.subscribe(function (evt) {
    document.addEventListener("DOMContentLoaded", function (evt) {
        WinJS.Application.addEventListener("activated", activated, false);
    }, false);
});

require("cordova/exec/proxy").add("SplashScreen", SplashScreen);

