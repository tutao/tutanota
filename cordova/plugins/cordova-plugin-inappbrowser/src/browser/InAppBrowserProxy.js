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

var cordova = require('cordova'),
    channel = require('cordova/channel'),
    modulemapper = require('cordova/modulemapper'),
    urlutil = require('cordova/urlutil');

var browserWrap,
    popup,
    navigationButtonsDiv,
    navigationButtonsDivInner,
    backButton,
    forwardButton,
    closeButton;

function attachNavigationEvents(element, callback) {
    var onError = function () {
        callback({ type: "loaderror", url: this.contentWindow.location}, {keepCallback: true});
    };

    element.addEventListener("pageshow", function () {
        callback({ type: "loadstart", url: this.contentWindow.location}, {keepCallback: true});
    });

    element.addEventListener("load", function () {
        callback({ type: "loadstop", url: this.contentWindow.location}, {keepCallback: true});
    });

    element.addEventListener("error", onError);
    element.addEventListener("abort", onError);
}

var IAB = {
    close: function (win, lose) {
        if (browserWrap) {
            if (win) win({ type: "exit" });

            browserWrap.parentNode.removeChild(browserWrap);
            browserWrap = null;
            popup = null;
        }
    },

    show: function (win, lose) {
        if (browserWrap) {
            browserWrap.style.display = "block";
        }
    },

    open: function (win, lose, args) {
        var strUrl = args[0],
            target = args[1],
            features = args[2],
            url;

        if (target === "_self" || !target) {
            window.location = strUrl;
        } else if (target === "_system") {
            modulemapper.getOriginalSymbol(window, 'window.open').call(window, strUrl, "_blank");
        } else {
            // "_blank" or anything else
            if (!browserWrap) {
                browserWrap = document.createElement("div");
                browserWrap.style.position = "absolute";
                browserWrap.style.borderWidth = "40px";
                browserWrap.style.width = "calc(100% - 80px)";
                browserWrap.style.height = "calc(100% - 80px)";
                browserWrap.style.borderStyle = "solid";
                browserWrap.style.borderColor = "rgba(0,0,0,0.25)";

                browserWrap.onclick = function () {
                    setTimeout(function () {
                        IAB.close(win);
                    }, 0);
                };

                document.body.appendChild(browserWrap);
            }

            if (features.indexOf("hidden=yes") !== -1) {
                browserWrap.style.display = "none";
            }

            popup = document.createElement("iframe");
            popup.style.borderWidth = "0px";
            popup.style.width = "100%";

            browserWrap.appendChild(popup);

            if (features.indexOf("location=yes") !== -1 || features.indexOf("location") === -1) {
                popup.style.height = "calc(100% - 60px)";

                navigationButtonsDiv = document.createElement("div");
                navigationButtonsDiv.style.height = "60px";
                navigationButtonsDiv.style.backgroundColor = "#404040";
                navigationButtonsDiv.style.zIndex = "999";
                navigationButtonsDiv.onclick = function (e) {
                    e.cancelBubble = true;
                };

                navigationButtonsDivInner = document.createElement("div");
                navigationButtonsDivInner.style.paddingTop = "10px";
                navigationButtonsDivInner.style.height = "50px";
                navigationButtonsDivInner.style.width = "160px";
                navigationButtonsDivInner.style.margin = "0 auto";
                navigationButtonsDivInner.style.backgroundColor = "#404040";
                navigationButtonsDivInner.style.zIndex = "999";
                navigationButtonsDivInner.onclick = function (e) {
                    e.cancelBubble = true;
                };


                backButton = document.createElement("button");
                backButton.style.width = "40px";
                backButton.style.height = "40px";
                backButton.style.borderRadius = "40px";

                backButton.innerHTML = "←";
                backButton.addEventListener("click", function (e) {
                    if (popup.canGoBack)
                        popup.goBack();
                });

                forwardButton = document.createElement("button");
                forwardButton.style.marginLeft = "20px";
                forwardButton.style.width = "40px";
                forwardButton.style.height = "40px";
                forwardButton.style.borderRadius = "40px";

                forwardButton.innerHTML = "→";
                forwardButton.addEventListener("click", function (e) {
                    if (popup.canGoForward)
                        popup.goForward();
                });

                closeButton = document.createElement("button");
                closeButton.style.marginLeft = "20px";
                closeButton.style.width = "40px";
                closeButton.style.height = "40px";
                closeButton.style.borderRadius = "40px";

                closeButton.innerHTML = "✖";
                closeButton.addEventListener("click", function (e) {
                    setTimeout(function () {
                        IAB.close(win);
                    }, 0);
                });

                // iframe navigation is not yet supported
                backButton.disabled = true;
                forwardButton.disabled = true;

                navigationButtonsDivInner.appendChild(backButton);
                navigationButtonsDivInner.appendChild(forwardButton);
                navigationButtonsDivInner.appendChild(closeButton);
                navigationButtonsDiv.appendChild(navigationButtonsDivInner);

                browserWrap.appendChild(navigationButtonsDiv);
            } else {
                popup.style.height = "100%";
            }

            // start listening for navigation events
            attachNavigationEvents(popup, win);

            popup.src = strUrl;
        }
    },

    injectScriptCode: function (win, fail, args) {
        var code = args[0],
            hasCallback = args[1];

        if (browserWrap && popup) {
            try {
                popup.contentWindow.eval(code);
                hasCallback && win([]);
            } catch(e) {
                console.error('Error occured while trying to injectScriptCode: ' + JSON.stringify(e));
            }
        }
    },

    injectScriptFile: function (win, fail, args) {
        var msg = 'Browser cordova-plugin-inappbrowser injectScriptFile is not yet implemented';
        console.warn(msg);
        fail && fail(msg);
    }, 

    injectStyleCode: function (win, fail, args) {
        var msg = 'Browser cordova-plugin-inappbrowser injectStyleCode is not yet implemented';
        console.warn(msg);
        fail && fail(msg);
    },

    injectStyleFile: function (win, fail, args) {
        var msg = 'Browser cordova-plugin-inappbrowser injectStyleFile is not yet implemented';
        console.warn(msg);
        fail && fail(msg);
    }
};

module.exports = IAB;

require("cordova/exec/proxy").add("InAppBrowser", module.exports);
