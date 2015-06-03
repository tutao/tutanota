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

// https://developer.mozilla.org/en-US/docs/WebAPI/Browser

var cordova = require('cordova'),
    channel = require('cordova/channel'),
    modulemapper = require('cordova/modulemapper');

var origOpenFunc = modulemapper.getOriginalSymbol(window, 'window.open');
var browserWrap;

var IABExecs = {

    close: function (win, lose) {
        if (browserWrap) {
            browserWrap.parentNode.removeChild(browserWrap);
            browserWrap = null;
            if (typeof(win) == "function") win({type:'exit'});
        }
    },

    /*
     * Reveal browser if opened hidden
     */
    show: function (win, lose) {
        console.error('[FirefoxOS] show not implemented');
    },

    open: function (win, lose, args) {
        var strUrl = args[0],
            target = args[1],
            features_string = args[2] || "location=yes", //location=yes is default
            features = {},
            url,
            elem;

        var features_list = features_string.split(',');
        features_list.forEach(function(feature) {
            var tup = feature.split('=');
            if (tup[1] == 'yes') {
                tup[1] = true;
            } else if (tup[1] == 'no') {
                tup[1] = false;
            } else {
                var number = parseInt(tup[1]);    
                if (!isNaN(number)) {
                    tup[1] = number;
                }
            }
            features[tup[0]] = tup[1];
        });

        function updateIframeSizeNoLocation() {
            browserWrap.style.width = window.innerWidth + 'px';
            browserWrap.style.height = window.innerHeight + 'px';
            browserWrap.style.zIndex = '999999999';
            browserWrap.browser.style.height = (window.innerHeight - 60) + 'px';
            browserWrap.browser.style.width = browserWrap.style.width;
        }

        if (target === '_system') {
            origOpenFunc.apply(window, [strUrl, '_blank']);
        } else if (target === '_blank') {
            var browserElem = document.createElement('iframe');
            browserElem.setAttribute('mozbrowser', true);
            // make this loaded in its own child process
            browserElem.setAttribute('remote', true);
            browserElem.setAttribute('src', strUrl);
            if (browserWrap) {
                document.body.removeChild(browserWrap);
            }
            browserWrap = document.createElement('div');
            // assign browser element to browserWrap for future reference
            browserWrap.browser = browserElem;

            browserWrap.classList.add('inAppBrowserWrap');
            // position fixed so that it works even when page is scrolled
            browserWrap.style.position = 'fixed';
            browserElem.style.position = 'absolute';
            browserElem.style.border = 0;
            browserElem.style.top = '60px';
            browserElem.style.left = '0px';
            updateIframeSizeNoLocation();

            var menu = document.createElement('menu');
            menu.setAttribute('type', 'toolbar');
            var close = document.createElement('li');
            var back = document.createElement('li');
            var forward = document.createElement('li');

            close.appendChild(document.createTextNode('×'));
            back.appendChild(document.createTextNode('<'));
            forward.appendChild(document.createTextNode('>'));

            close.classList.add('inAppBrowserClose');
            back.classList.add('inAppBrowserBack');
            forward.classList.add('inAppBrowserForward');

            function checkForwardBackward() {
                var backReq = browserElem.getCanGoBack();
                backReq.onsuccess = function() {
                    if (this.result) {
                        back.classList.remove('disabled');
                    } else {
                        back.classList.add('disabled');
                    }
                }
                var forwardReq = browserElem.getCanGoForward();
                forwardReq.onsuccess = function() {
                    if (this.result) {
                        forward.classList.remove('disabled');
                    } else {
                        forward.classList.add('disabled');
                    }
                }
            };

            browserElem.addEventListener('mozbrowserloadend', checkForwardBackward);

            close.addEventListener('click', function () {
                setTimeout(function () {
                    IABExecs.close(win, lose);
                }, 0);
            }, false);

            back.addEventListener('click', function () {
                browserElem.goBack();
            }, false);

            forward.addEventListener('click', function () {
                browserElem.goForward();
            }, false);

            menu.appendChild(back);
            menu.appendChild(forward);
            menu.appendChild(close);

            browserWrap.appendChild(menu);
            browserWrap.appendChild(browserElem);
            document.body.appendChild(browserWrap);

            //we use mozbrowserlocationchange instead of mozbrowserloadstart to get the url
            browserElem.addEventListener('mozbrowserlocationchange', function(e){
                win({
                    type:'loadstart',
                    url : e.detail
                })
            }, false);
            browserElem.addEventListener('mozbrowserloadend', function(e){
                win({type:'loadstop'})
            }, false);
            browserElem.addEventListener('mozbrowsererror', function(e){
                win({type:'loaderror'})
            }, false);
            browserElem.addEventListener('mozbrowserclose', function(e){
                win({type:'exit'})
            }, false);
        } else {
            window.location = strUrl;
        }
    },
    injectScriptCode: function (code, bCB) {
        console.error('[FirefoxOS] injectScriptCode not implemented');
    },
    injectScriptFile: function (file, bCB) {
        console.error('[FirefoxOS] injectScriptFile not implemented');
    }
};

module.exports = IABExecs;

require('cordova/exec/proxy').add('InAppBrowser', module.exports);
