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
// Default parameter values including image size can be changed in `config.xml`
var splashImageWidth = 170;
var splashImageHeight = 200;
var position = { x: 0, y: 0, width: splashImageWidth, height: splashImageHeight }; 
var splash = null; //
var localSplash; // the image to display
var localSplashImage;
var bgColor = "#464646";
var imageSrc = 'img/logo.png';
var splashScreenDelay = 3000; // in milliseconds
var showSplashScreen = true; // show splashcreen by default
var configHelper = cordova.require('cordova/confighelper');

function updateImageLocation() {
    position.width = Math.min(splashImageWidth, window.innerWidth);
    position.height = position.width * (splashImageHeight / splashImageWidth);

    localSplash.style.width = window.innerWidth + "px";
    localSplash.style.height = window.innerHeight + "px";
    localSplash.style.top = "0px";
    localSplash.style.left = "0px";

    localSplashImage.style.top = "50%";
    localSplashImage.style.left = "50%";
    localSplashImage.style.height = position.height + "px";
    localSplashImage.style.width = position.width + "px";
    localSplashImage.style.marginTop = (-position.height / 2) + "px";
    localSplashImage.style.marginLeft = (-position.width / 2) + "px";
}

function onResize() {
    updateImageLocation();
}

var SplashScreen = {
    setBGColor: function (cssBGColor) {
        bgColor = cssBGColor;
        if (localSplash) {
            localSplash.style.backgroundColor = bgColor;
        }
    },
    show: function () {
        if(!localSplash) {
            window.addEventListener("resize", onResize, false);
            localSplash = document.createElement("div");
            localSplash.style.backgroundColor = bgColor;
            localSplash.style.position = "absolute";

            localSplashImage = document.createElement("img");
            localSplashImage.src = imageSrc;
            localSplashImage.style.position = "absolute";

            updateImageLocation();

            localSplash.appendChild(localSplashImage);
            document.body.appendChild(localSplash);
        }
    },
    hide: function () {
        if(localSplash) {
            window.removeEventListener("resize", onResize, false);
            document.body.removeChild(localSplash);
            localSplash = null;
        }
    }
};

/**
 * Reads preferences via ConfigHelper and substitutes default parameters.
 */
function readPreferencesFromCfg(cfg) {
    try {
        var value = cfg.getPreferenceValue('ShowSplashScreen');
        if(typeof value != 'undefined') {
            showSplashScreen = value === 'true';
        }

        splashScreenDelay = cfg.getPreferenceValue('SplashScreenDelay') || splashScreenDelay;
        imageSrc = cfg.getPreferenceValue('SplashScreen') || imageSrc;
        bgColor = cfg.getPreferenceValue('SplashScreenBackgroundColor') || bgColor;
        splashImageWidth = cfg.getPreferenceValue('SplashScreenWidth') || splashImageWidth;
        splashImageHeight = cfg.getPreferenceValue('SplashScreenHeight') || splashImageHeight;
    } catch(e) {
        var msg = '[Browser][SplashScreen] Error occured on loading preferences from config.xml: ' + JSON.stringify(e);
        console.error(msg);
        error(msg);
    }
}

/**
 * Shows and hides splashscreen if it is enabled, with a delay according the current preferences.
 */
function showAndHide() {
    if(showSplashScreen) {
        SplashScreen.show();

        window.setTimeout(function() {
            SplashScreen.hide();
        }, splashScreenDelay);
    }
}

/**
 * Tries to read config.xml and override default properties and then shows and hides splashcreen if it is enabled.
 */
(function initAndShow() {
    configHelper.readConfig(function(config) {
        readPreferencesFromCfg(config);
        showAndHide();
    }, function(err) {
        console.error(err);
    });
})();

module.exports = SplashScreen;

require("cordova/exec/proxy").add("SplashScreen", SplashScreen);

