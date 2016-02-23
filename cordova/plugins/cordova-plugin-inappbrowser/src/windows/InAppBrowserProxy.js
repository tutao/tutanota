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
/*global Windows:true, require, document, setTimeout, window, module */



var cordova = require('cordova'),
    urlutil = require('cordova/urlutil');

var browserWrap,
    popup,
    navigationButtonsDiv,
    navigationButtonsDivInner,
    backButton,
    forwardButton,
    closeButton,
    bodyOverflowStyle,
    navigationEventsCallback;

// x-ms-webview is available starting from Windows 8.1 (platformId is 'windows')
// http://msdn.microsoft.com/en-us/library/windows/apps/dn301831.aspx
var isWebViewAvailable = cordova.platformId === 'windows';

function attachNavigationEvents(element, callback) {
    if (isWebViewAvailable) {
        element.addEventListener("MSWebViewNavigationStarting", function (e) {
            callback({ type: "loadstart", url: e.uri}, {keepCallback: true} );
        });

        element.addEventListener("MSWebViewNavigationCompleted", function (e) {
            if (e.isSuccess) {
                callback({ type: "loadstop", url: e.uri }, { keepCallback: true });
            } else {
                callback({ type: "loaderror", url: e.uri, code: e.webErrorStatus, message: "Navigation failed with error code " + e.webErrorStatus}, { keepCallback: true });
            }
        });

        element.addEventListener("MSWebViewUnviewableContentIdentified", function (e) {
            // WebView found the content to be not HTML.
            // http://msdn.microsoft.com/en-us/library/windows/apps/dn609716.aspx
            callback({ type: "loaderror", url: e.uri, code: e.webErrorStatus, message: "Navigation failed with error code " + e.webErrorStatus}, { keepCallback: true });
        });

        element.addEventListener("MSWebViewContentLoading", function (e) {
            if (navigationButtonsDiv && popup) {
                if (popup.canGoBack) {
                    backButton.removeAttribute("disabled");
                } else {
                    backButton.setAttribute("disabled", "true");
                }

                if (popup.canGoForward) {
                    forwardButton.removeAttribute("disabled");
                } else {
                    forwardButton.setAttribute("disabled", "true");
                }
            }
        });
    } else {
        var onError = function () {
            callback({ type: "loaderror", url: this.contentWindow.location}, {keepCallback: true});
        };

        element.addEventListener("unload", function () {
            callback({ type: "loadstart", url: this.contentWindow.location}, {keepCallback: true});
        });

        element.addEventListener("load", function () {
            callback({ type: "loadstop", url: this.contentWindow.location}, {keepCallback: true});
        });

        element.addEventListener("error", onError);
        element.addEventListener("abort", onError);
    }
}

var IAB = {
    close: function (win, lose) {
        setImmediate(function () {
            if (browserWrap) {
                if (navigationEventsCallback) {
                    navigationEventsCallback({ type: "exit" });
                }

                browserWrap.parentNode.removeChild(browserWrap);
                // Reset body overflow style to initial value
                document.body.style.msOverflowStyle = bodyOverflowStyle;
                browserWrap = null;
                popup = null;
            }
        });
    },
    show: function (win, lose) {
        setImmediate(function () {
            if (browserWrap) {
                browserWrap.style.display = "block";
            }
        });
    },
    open: function (win, lose, args) {
        // make function async so that we can add navigation events handlers before view is loaded and navigation occured
        setImmediate(function () {
            var strUrl = args[0],
                target = args[1],
                features = args[2],
                url;

            navigationEventsCallback = win;

            if (target === "_system") {
                url = new Windows.Foundation.Uri(strUrl);
                Windows.System.Launcher.launchUriAsync(url);
            } else if (target === "_self" || !target) {
                window.location = strUrl;
            } else {
                // "_blank" or anything else
                if (!browserWrap) {
                    var browserWrapStyle = document.createElement('link');
                    browserWrapStyle.rel = "stylesheet";
                    browserWrapStyle.type = "text/css";
                    browserWrapStyle.href = urlutil.makeAbsolute("/www/css/inappbrowser.css");

                    document.head.appendChild(browserWrapStyle);

                    browserWrap = document.createElement("div");
                    browserWrap.className = "inAppBrowserWrap";

                    if (features.indexOf("fullscreen=yes") > -1) {
                        browserWrap.classList.add("inAppBrowserWrapFullscreen");
                    }

                    // Save body overflow style to be able to reset it back later
                    bodyOverflowStyle = document.body.style.msOverflowStyle;

                    browserWrap.onclick = function () {
                        setTimeout(function () {
                            IAB.close(navigationEventsCallback);
                        }, 0);
                    };

                    document.body.appendChild(browserWrap);
                    // Hide scrollbars for the whole body while inappbrowser's window is open
                    document.body.style.msOverflowStyle = "none";
                }

                if (features.indexOf("hidden=yes") !== -1) {
                    browserWrap.style.display = "none";
                }

                popup = document.createElement(isWebViewAvailable ? "x-ms-webview" : "iframe");
                if (popup instanceof HTMLIFrameElement) {
                    // For iframe we need to override bacground color of parent element here
                    // otherwise pages without background color set will have transparent background
                    popup.style.backgroundColor = "white";
                }
                popup.style.borderWidth = "0px";
                popup.style.width = "100%";

                browserWrap.appendChild(popup);

                if (features.indexOf("location=yes") !== -1 || features.indexOf("location") === -1) {
                    popup.style.height = "calc(100% - 70px)";

                    navigationButtonsDiv = document.createElement("div");
                    navigationButtonsDiv.className = "inappbrowser-app-bar";
                    navigationButtonsDiv.onclick = function (e) {
                        e.cancelBubble = true;
                    };

                    navigationButtonsDivInner = document.createElement("div");
                    navigationButtonsDivInner.className = "inappbrowser-app-bar-inner"
                    navigationButtonsDivInner.onclick = function (e) {
                        e.cancelBubble = true;
                    };

                    backButton = document.createElement("div");
                    backButton.innerText = "back";
                    backButton.className = "app-bar-action action-back";
                    backButton.addEventListener("click", function (e) {
                        if (popup.canGoBack)
                            popup.goBack();
                    });

                    forwardButton = document.createElement("div");
                    forwardButton.innerText = "forward";
                    forwardButton.className = "app-bar-action action-forward";
                    forwardButton.addEventListener("click", function (e) {
                        if (popup.canGoForward)
                            popup.goForward();
                    });

                    closeButton = document.createElement("div");
                    closeButton.innerText = "close";
                    closeButton.className = "app-bar-action action-close";
                    closeButton.addEventListener("click", function (e) {
                        setTimeout(function () {
                            IAB.close(navigationEventsCallback);
                        }, 0);
                    });

                    if (!isWebViewAvailable) {
                        // iframe navigation is not yet supported
                        backButton.setAttribute("disabled", "true");
                        forwardButton.setAttribute("disabled", "true");
                    }

                    navigationButtonsDivInner.appendChild(backButton);
                    navigationButtonsDivInner.appendChild(forwardButton);
                    navigationButtonsDivInner.appendChild(closeButton);
                    navigationButtonsDiv.appendChild(navigationButtonsDivInner);

                    browserWrap.appendChild(navigationButtonsDiv);
                } else {
                    popup.style.height = "100%";
                }

                // start listening for navigation events
                attachNavigationEvents(popup, navigationEventsCallback);

                if (isWebViewAvailable) {
                    strUrl = strUrl.replace("ms-appx://", "ms-appx-web://");
                }
                popup.src = strUrl;
            }
        });
    },

    injectScriptCode: function (win, fail, args) {
        setImmediate(function () {
            var code = args[0],
                hasCallback = args[1];

            if (isWebViewAvailable && browserWrap && popup) {
                var op = popup.invokeScriptAsync("eval", code);
                op.oncomplete = function (e) {
                    // return null if event target is unavailable by some reason
                    var result = (e && e.target) ? [e.target.result] : [null];
                    hasCallback && win(result);
                };
                op.onerror = function () { };
                op.start();
            }
        });
    },

    injectScriptFile: function (win, fail, args) {
        setImmediate(function () {
            var filePath = args[0],
                hasCallback = args[1];

            if (!!filePath) {
                filePath = urlutil.makeAbsolute(filePath);
            }

            if (isWebViewAvailable && browserWrap && popup) {
                var uri = new Windows.Foundation.Uri(filePath);
                Windows.Storage.StorageFile.getFileFromApplicationUriAsync(uri).done(function (file) {
                    Windows.Storage.FileIO.readTextAsync(file).done(function (code) {
                        var op = popup.invokeScriptAsync("eval", code);
                        op.oncomplete = function(e) {
                            var result = [e.target.result];
                            hasCallback && win(result);
                        };
                        op.onerror = function () { };
                        op.start();
                    });
                });
            }
        });
    },

    injectStyleCode: function (win, fail, args) {
        setImmediate(function () {
            var code = args[0],
                hasCallback = args[1];

            if (isWebViewAvailable && browserWrap && popup) {
                injectCSS(popup, code, hasCallback && win);
            }
        });
    },

    injectStyleFile: function (win, fail, args) {
        setImmediate(function () {
            var filePath = args[0],
                hasCallback = args[1];

            filePath = filePath && urlutil.makeAbsolute(filePath);

            if (isWebViewAvailable && browserWrap && popup) {
                var uri = new Windows.Foundation.Uri(filePath);
                Windows.Storage.StorageFile.getFileFromApplicationUriAsync(uri).then(function (file) {
                    return Windows.Storage.FileIO.readTextAsync(file);
                }).done(function (code) {
                    injectCSS(popup, code, hasCallback && win);
                }, function () {
                    // no-op, just catch an error
                });
            }
        });
    }
};

function injectCSS (webView, cssCode, callback) {
    // This will automatically escape all thing that we need (quotes, slashes, etc.)
    var escapedCode = JSON.stringify(cssCode);
    var evalWrapper = "(function(d){var c=d.createElement('style');c.innerHTML=%s;d.head.appendChild(c);})(document)"
        .replace('%s', escapedCode);

    var op = webView.invokeScriptAsync("eval", evalWrapper);
    op.oncomplete = function() {
        callback && callback([]);
    };
    op.onerror = function () { };
    op.start();
}

module.exports = IAB;

require("cordova/exec/proxy").add("InAppBrowser", module.exports);
