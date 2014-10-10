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
    channel = require('cordova/channel');

var browserWrap;

var IAB = {

    close: function (win, lose) {
        if (browserWrap) {
            browserWrap.parentNode.removeChild(browserWrap);
            browserWrap = null;
        }
    },
    show: function (win, lose) {
        /* empty block, ran out of bacon?
        if (browserWrap) {

        }*/
    },
    open: function (win, lose, args) {
        var strUrl = args[0],
            target = args[1],
            features = args[2],
            url,
            elem;

        if (target === "_system") {
            url = new Windows.Foundation.Uri(strUrl);
            Windows.System.Launcher.launchUriAsync(url);
        } else if (target === "_blank") {
            if (!browserWrap) {
                browserWrap = document.createElement("div");
                browserWrap.style.position = "absolute";
                browserWrap.style.width = (window.innerWidth - 80) + "px";
                browserWrap.style.height = (window.innerHeight - 80) + "px";
                browserWrap.style.borderWidth = "40px";
                browserWrap.style.borderStyle = "solid";
                browserWrap.style.borderColor = "rgba(0,0,0,0.25)";

                browserWrap.onclick = function () {
                    setTimeout(function () {
                        IAB.close();
                    }, 0);
                };

                document.body.appendChild(browserWrap);
            }

            elem = document.createElement("iframe");
            elem.style.width = (window.innerWidth - 80) + "px";
            elem.style.height = (window.innerHeight - 80) + "px";
            elem.style.borderWidth = "0px";
            elem.name = "targetFrame";
            elem.src = strUrl;

            window.addEventListener("resize", function () {
                if (browserWrap && elem) {
                    elem.style.width = (window.innerWidth - 80) + "px";
                    elem.style.height = (window.innerHeight - 80) + "px";
                }
            });

            browserWrap.appendChild(elem);
        } else {
            window.location = strUrl;
        }

        //var object = new WinJS.UI.HtmlControl(elem, { uri: strUrl });

    },

    injectScriptCode: function (code, bCB) {

        // "(function(d) { var c = d.createElement('script'); c.src = %@; d.body.appendChild(c); })(document)"
    },

    injectScriptFile: function (file, bCB) {

    }
};

module.exports = IAB;


require("cordova/exec/proxy").add("InAppBrowser", module.exports);
