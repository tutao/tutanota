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

exports.defineManualTests = function (contentEl, createActionButton) {

    function doOpen(url, target, params, numExpectedRedirects) {
        numExpectedRedirects = numExpectedRedirects || 0;
        console.log("Opening " + url);
        var iab = window.open(url, target, params);
        if (!iab) {
            alert('window.open returned ' + iab);
            return;
        }
        var counts;
        var lastLoadStartURL;
        var wasReset = false;
        function reset() {
            counts = {
                'loaderror': 0,
                'loadstart': 0,
                'loadstop': 0,
                'exit': 0
            };
            lastLoadStartURL = '';
        }
        reset();

        function logEvent(e) {
            console.log('IAB event=' + JSON.stringify(e));
            counts[e.type]++;
            // Verify that event.url gets updated on redirects.
            if (e.type == 'loadstart') {
                if (e.url == lastLoadStartURL) {
                    alert('Unexpected: loadstart fired multiple times for the same URL.');
                }
                lastLoadStartURL = e.url;
            }
            // Verify the right number of loadstart events were fired.
            if (e.type == 'loadstop' || e.type == 'loaderror') {
                if (e.url != lastLoadStartURL) {
                    alert('Unexpected: ' + e.type + ' event.url != loadstart\'s event.url');
                }
                if (numExpectedRedirects === 0 && counts['loadstart'] !== 1) {
                    // Do allow a loaderror without a loadstart (e.g. in the case of an invalid URL).
                    if (!(e.type == 'loaderror' && counts['loadstart'] === 0)) {
                        alert('Unexpected: got multiple loadstart events. (' + counts['loadstart'] + ')');
                    }
                } else if (numExpectedRedirects > 0 && counts['loadstart'] < (numExpectedRedirects + 1)) {
                    alert('Unexpected: should have got at least ' + (numExpectedRedirects + 1) + ' loadstart events, but got ' + counts['loadstart']);
                }
                wasReset = true;
                numExpectedRedirects = 0;
                reset();
            }
            // Verify that loadend / loaderror was called.
            if (e.type == 'exit') {
                var numStopEvents = counts['loadstop'] + counts['loaderror'];
                if (numStopEvents === 0 && !wasReset) {
                    alert('Unexpected: browser closed without a loadstop or loaderror.')
                } else if (numStopEvents > 1) {
                    alert('Unexpected: got multiple loadstop/loaderror events.');
                }
            }
        }
        iab.addEventListener('loaderror', logEvent);
        iab.addEventListener('loadstart', logEvent);
        iab.addEventListener('loadstop', logEvent);
        iab.addEventListener('exit', logEvent);

        return iab;
    }

    function openWithStyle(url, cssUrl, useCallback) {
        var iab = doOpen(url, '_blank', 'location=yes');
        var callback = function (results) {
            if (results && results.length === 0) {
                alert('Results verified');
            } else {
                console.log(results);
                alert('Got: ' + typeof (results) + '\n' + JSON.stringify(results));
            }
        };
        if (cssUrl) {
            iab.addEventListener('loadstop', function (event) {
                iab.insertCSS({ file: cssUrl }, useCallback && callback);
            });
        } else {
            iab.addEventListener('loadstop', function (event) {
                iab.insertCSS({ code: '#style-update-literal { \ndisplay: block !important; \n}' },
                              useCallback && callback);
            });
        }
    }

    function openWithScript(url, jsUrl, useCallback) {
        var iab = doOpen(url, '_blank', 'location=yes');
        if (jsUrl) {
            iab.addEventListener('loadstop', function (event) {
                iab.executeScript({ file: jsUrl }, useCallback && function (results) {
                    if (results && results.length === 0) {
                        alert('Results verified');
                    } else {
                        console.log(results);
                        alert('Got: ' + typeof (results) + '\n' + JSON.stringify(results));
                    }
                });
            });
        } else {
            iab.addEventListener('loadstop', function (event) {
                var code = '(function(){\n' +
                  '    var header = document.getElementById("header");\n' +
                  '    header.innerHTML = "Script literal successfully injected";\n' +
                  '    return "abc";\n' +
                  '})()';
                iab.executeScript({ code: code }, useCallback && function (results) {
                    if (results && results.length === 1 && results[0] === 'abc') {
                        alert('Results verified');
                    } else {
                        console.log(results);
                        alert('Got: ' + typeof (results) + '\n' + JSON.stringify(results));
                    }
                });
            });
        }
    }
    var hiddenwnd = null;
    var loadlistener = function (event) { alert('background window loaded '); };
    function openHidden(url, startHidden) {
        var shopt = (startHidden) ? 'hidden=yes' : '';
        hiddenwnd = window.open(url, 'random_string', shopt);
        if (!hiddenwnd) {
            alert('window.open returned ' + hiddenwnd);
            return;
        }
        if (startHidden) hiddenwnd.addEventListener('loadstop', loadlistener);
    }
    function showHidden() {
        if (!!hiddenwnd) {
            hiddenwnd.show();
        }
    }
    function closeHidden() {
        if (!!hiddenwnd) {
            hiddenwnd.removeEventListener('loadstop', loadlistener);
            hiddenwnd.close();
            hiddenwnd = null;
        }
    }

    var info_div = '<h1>InAppBrowser</h1>' +
        '<div id="info">' +
        'Make sure http://www.google.com and https://www.google.com are white listed. </br>' +
        'Make sure http://www.apple.com is not in the white list.</br>' +
        'In iOS, starred <span style="vertical-align:super">*</span> tests will put the app in a state with no way to return. </br>' +
        '<h4>User-Agent: <span id="user-agent"> </span></hr>' +
        '</div>';

    var local_tests = '<h1>Local URL</h1>' +
        '<div id="openLocal"></div>' +
        'Expected result: opens successfully in CordovaWebView.' +
        '<p/> <div id="openLocalSelf"></div>' +
        'Expected result: opens successfully in CordovaWebView.' +
        '<p/> <div id="openLocalSystem"></div>' +
        'Expected result: fails to open' +
        '<p/> <div id="openLocalBlank"></div>' +
        'Expected result: opens successfully in InAppBrowser with locationBar at top.' +
        '<p/> <div id="openLocalRandomNoLocation"></div>' +
        'Expected result: opens successfully in InAppBrowser without locationBar.' +
        '<p/> <div id="openLocalRandomToolBarBottom"></div>' +
        'Expected result: opens successfully in InAppBrowser with locationBar. On iOS the toolbar is at the bottom.' +
        '<p/> <div id="openLocalRandomToolBarTop"></div>' +
        'Expected result: opens successfully in InAppBrowser with locationBar. On iOS the toolbar is at the top.' +
        '<p/><div id="openLocalRandomToolBarTopNoLocation"></div>' +
        'Expected result: open successfully in InAppBrowser with no locationBar. On iOS the toolbar is at the top.';

    var white_listed_tests = '<h1>White Listed URL</h1>' +
        '<div id="openWhiteListed"></div>' +
        'Expected result: open successfully in CordovaWebView to www.google.com' +
        '<p/> <div id="openWhiteListedSelf"></div>' +
        'Expected result: open successfully in CordovaWebView to www.google.com' +
        '<p/> <div id="openWhiteListedSystem"></div>' +
        'Expected result: open successfully in system browser to www.google.com' +
        '<p/> <div id="openWhiteListedBlank"></div>' +
        'Expected result: open successfully in InAppBrowser to www.google.com' +
        '<p/> <div id="openWhiteListedRandom"></div>' +
        'Expected result: open successfully in InAppBrowser to www.google.com' +
        '<p/> <div id="openWhiteListedRandomNoLocation"></div>' +
        'Expected result: open successfully in InAppBrowser to www.google.com with no location bar.';

    var non_white_listed_tests = '<h1>Non White Listed URL</h1>' +
        '<div id="openNonWhiteListed"></div>' +
        'Expected result: open successfully in InAppBrowser to apple.com (_self enforces whitelist).' +
        '<p/> <div id="openNonWhiteListedSelf"></div>' +
        'Expected result: open successfully in InAppBrowser to apple.com (_self enforces whitelist).' +
        '<p/> <div id="openNonWhiteListedSystem"></div>' +
        'Expected result: open successfully in system browser to apple.com.' +
        '<p/> <div id="openNonWhiteListedBlank"></div>' +
        'Expected result: open successfully in InAppBrowser to apple.com.' +
        '<p/> <div id="openNonWhiteListedRandom"></div>' +
        'Expected result: open successfully in InAppBrowser to apple.com.' +
        '<p/> <div id="openNonWhiteListedRandomNoLocation"></div>' +
        'Expected result: open successfully in InAppBrowser to apple.com without locationBar.';

    var page_with_redirects_tests = '<h1>Page with redirect</h1>' +
        '<div id="openRedirect301"></div>' +
        'Expected result: should 301 and open successfully in InAppBrowser to www.google.com.' +
        '<p/> <div id="openRedirect302"></div>' +
        'Expected result: should 302 and open successfully in InAppBrowser to www.zhihu.com/answer/16714076.';

    var pdf_url_tests = '<h1>PDF URL</h1>' +
        '<div id="openPDF"></div>' +
        'Expected result: InAppBrowser opens. PDF should render on iOS.' +
        '<p/> <div id="openPDFBlank"></div>' +
        'Expected result: InAppBrowser opens. PDF should render on iOS.';

    var invalid_url_tests = '<h1>Invalid URL</h1>' +
        '<div id="openInvalidScheme"></div>' +
        'Expected result: fail to load in InAppBrowser.' +
        '<p/> <div id="openInvalidHost"></div>' +
        'Expected result: fail to load in InAppBrowser.' +
        '<p/> <div id="openInvalidMissing"></div>' +
        'Expected result: fail to load in InAppBrowser (404).';

    var css_js_injection_tests = '<h1>CSS / JS Injection</h1>' +
        '<div id="openOriginalDocument"></div>' +
        'Expected result: open successfully in InAppBrowser without text "Style updated from..."' +
        '<p/> <div id="openCSSInjection"></div>' +
        'Expected result: open successfully in InAppBrowser with "Style updated from file".' +
        '<p/> <div id="openCSSInjectionCallback"></div>' +
        'Expected result: open successfully in InAppBrowser with "Style updated from file", and alert dialog with text "Results verified".' +
        '<p/> <div id="openCSSLiteralInjection"></div>' +
        'Expected result: open successfully in InAppBrowser with "Style updated from literal".' +
        '<p/> <div id="openCSSLiteralInjectionCallback"></div>' +
        'Expected result: open successfully in InAppBrowser with "Style updated from literal", and alert dialog with text "Results verified".' +
        '<p/> <div id="openScriptInjection"></div>' +
        'Expected result: open successfully in InAppBrowser with text "Script file successfully injected".' +
        '<p/> <div id="openScriptInjectionCallback"></div>' +
        'Expected result: open successfully in InAppBrowser with text "Script file successfully injected" and alert dialog with the text "Results verified".' +
        '<p/> <div id="openScriptLiteralInjection"></div>' +
        'Expected result: open successfully in InAppBrowser with the text "Script literal successfully injected" .' +
        '<p/> <div id="openScriptLiteralInjectionCallback"></div>' +
        'Expected result: open successfully in InAppBrowser with the text "Script literal successfully injected" and alert dialog with the text "Results verified".';

    var open_hidden_tests = '<h1>Open Hidden </h1>' +
        '<div id="openHidden"></div>' +
        'Expected result: no additional browser window. Alert appears with the text "background window loaded".' +
        '<p/> <div id="showHidden"></div>' +
        'Expected result: after first clicking on previous test "create hidden", open successfully in InAppBrowser to google.com.' +
        '<p/> <div id="closeHidden"></div>' +
        'Expected result: no output. But click on "show hidden" again and nothing should be shown.' +
        '<p/> <div id="openHiddenShow"></div>' +
        'Expected result: open successfully in InAppBrowser to www.google.com';

    var clearing_cache_tests = '<h1>Clearing Cache</h1>' +
        '<div id="openClearCache"></div>' +
        'Expected result: ?' +
        '<p/> <div id="openClearSessionCache"></div>' +
        'Expected result: ?';

    var video_tag_tests = '<h1>Video tag</h1>' +
        '<div id="openRemoteVideo"></div>' +
        'Expected result: open successfully in InAppBrowser with an embedded video that works after clicking the "play" button.';

    var local_with_anchor_tag_tests = '<h1>Local with anchor tag</h1>' +
        '<div id="openAnchor1"></div>' +
        'Expected result: open successfully in InAppBrowser to the local page, scrolled to the top as normal.' +
        '<p/> <div id="openAnchor2"></div>' +
        'Expected result: open successfully in InAppBrowser to the local page, scrolled to the beginning of the tall div with border.';

    // CB-7490 We need to wrap this code due to Windows security restrictions
    // see http://msdn.microsoft.com/en-us/library/windows/apps/hh465380.aspx#differences for details
    if (window.MSApp && window.MSApp.execUnsafeLocalFunction) {
        MSApp.execUnsafeLocalFunction(function() {
            contentEl.innerHTML = info_div + local_tests + white_listed_tests + non_white_listed_tests + page_with_redirects_tests + pdf_url_tests + invalid_url_tests +
                css_js_injection_tests + open_hidden_tests + clearing_cache_tests + video_tag_tests + local_with_anchor_tag_tests;
        });
    } else {
        contentEl.innerHTML = info_div + local_tests + white_listed_tests + non_white_listed_tests + page_with_redirects_tests + pdf_url_tests + invalid_url_tests +
            css_js_injection_tests + open_hidden_tests + clearing_cache_tests + video_tag_tests + local_with_anchor_tag_tests;
    }

    document.getElementById("user-agent").textContent = navigator.userAgent;

    // we are already in cdvtests directory
    var basePath = 'iab-resources/';
    var localhtml = basePath + 'local.html',
        localpdf = basePath + 'local.pdf',
        injecthtml = basePath + 'inject.html',
        injectjs = 'inject.js',
        injectcss = 'inject.css',
        videohtml = basePath + 'video.html';

    //Local
    createActionButton('target=Default', function () {
        doOpen(localhtml);
    }, 'openLocal');
    createActionButton('target=_self', function () {
        doOpen(localhtml, '_self');
    }, 'openLocalSelf');
    createActionButton('target=_system', function () {
        doOpen(localhtml, '_system');
    }, 'openLocalSystem');
    createActionButton('target=_blank', function () {
        doOpen(localhtml, '_blank');
    }, 'openLocalBlank');
    createActionButton('target=Random, location=no, disallowoverscroll=yes', function () {
        doOpen(localhtml, 'random_string', 'location=no, disallowoverscroll=yes');
    }, 'openLocalRandomNoLocation');
    createActionButton('target=Random, toolbarposition=bottom', function () {
        doOpen(localhtml, 'random_string', 'toolbarposition=bottom');
    }, 'openLocalRandomToolBarBottom');
    createActionButton('target=Random, toolbarposition=top', function () {
        doOpen(localhtml, 'random_string', 'toolbarposition=top');
    }, 'openLocalRandomToolBarTop');
    createActionButton('target=Random, toolbarposition=top, location=no', function () {
        doOpen(localhtml, 'random_string', 'toolbarposition=top,location=no');
    }, 'openLocalRandomToolBarTopNoLocation');

    //White Listed
    createActionButton('* target=Default', function () {
        doOpen('https://www.google.com');
    }, 'openWhiteListed');
    createActionButton('* target=_self', function () {
        doOpen('https://www.google.com', '_self');
    }, 'openWhiteListedSelf');
    createActionButton('target=_system', function () {
        doOpen('https://www.google.com', '_system');
    }, 'openWhiteListedSystem');
    createActionButton('target=_blank', function () {
        doOpen('https://www.google.com', '_blank');
    }, 'openWhiteListedBlank');
    createActionButton('target=Random', function () {
        doOpen('https://www.google.com', 'random_string');
    }, 'openWhiteListedRandom');
    createActionButton('* target=Random, no location bar', function () {
        doOpen('https://www.google.com', 'random_string', 'location=no');
    }, 'openWhiteListedRandomNoLocation');

    //Non White Listed
    createActionButton('target=Default', function () {
        doOpen('http://www.apple.com');
    }, 'openNonWhiteListed');
    createActionButton('target=_self', function () {
        doOpen('http://www.apple.com', '_self');
    }, 'openNonWhiteListedSelf');
    createActionButton('target=_system', function () {
        doOpen('http://www.apple.com', '_system');
    }, 'openNonWhiteListedSystem');
    createActionButton('target=_blank', function () {
        doOpen('http://www.apple.com', '_blank');
    }, 'openNonWhiteListedBlank');
    createActionButton('target=Random', function () {
        doOpen('http://www.apple.com', 'random_string');
    }, 'openNonWhiteListedRandom');
    createActionButton('* target=Random, no location bar', function () {
        doOpen('http://www.apple.com', 'random_string', 'location=no');
    }, 'openNonWhiteListedRandomNoLocation');

    //Page with redirect
    createActionButton('http://google.com', function () {
        doOpen('http://google.com', 'random_string', '', 1);
    }, 'openRedirect301');
    createActionButton('http://goo.gl/pUFqg', function () {
        doOpen('http://goo.gl/pUFqg', 'random_string', '', 2);
    }, 'openRedirect302');

    //PDF URL
    createActionButton('Remote URL', function () {
        doOpen('http://www.stluciadance.com/prospectus_file/sample.pdf');
    }, 'openPDF');
    createActionButton('Local URL', function () {
        doOpen(localpdf, '_blank');
    }, 'openPDFBlank');

    //Invalid URL
    createActionButton('Invalid Scheme', function () {
        doOpen('x-ttp://www.invalid.com/', '_blank');
    }, 'openInvalidScheme');
    createActionButton('Invalid Host', function () {
        doOpen('http://www.inv;alid.com/', '_blank');
    }, 'openInvalidHost');
    createActionButton('Missing Local File', function () {
        doOpen('nonexistent.html', '_blank');
    }, 'openInvalidMissing');

    //CSS / JS injection
    createActionButton('Original Document', function () {
        doOpen(injecthtml, '_blank');
    }, 'openOriginalDocument');
    createActionButton('CSS File Injection', function () {
        openWithStyle(injecthtml, injectcss);
    }, 'openCSSInjection');
    createActionButton('CSS File Injection (callback)', function () {
        openWithStyle(injecthtml, injectcss, true);
    }, 'openCSSInjectionCallback');
    createActionButton('CSS Literal Injection', function () {
        openWithStyle(injecthtml);
    }, 'openCSSLiteralInjection');
    createActionButton('CSS Literal Injection (callback)', function () {
        openWithStyle(injecthtml, null, true);
    }, 'openCSSLiteralInjectionCallback');
    createActionButton('Script File Injection', function () {
        openWithScript(injecthtml, injectjs);
    }, 'openScriptInjection');
    createActionButton('Script File Injection (callback)', function () {
        openWithScript(injecthtml, injectjs, true);
    }, 'openScriptInjectionCallback');
    createActionButton('Script Literal Injection', function () {
        openWithScript(injecthtml);
    }, 'openScriptLiteralInjection');
    createActionButton('Script Literal Injection (callback)', function () {
        openWithScript(injecthtml, null, true);
    }, 'openScriptLiteralInjectionCallback');

    //Open hidden
    createActionButton('Create Hidden', function () {
        openHidden('https://www.google.com', true);
    }, 'openHidden');
    createActionButton('Show Hidden', function () {
        showHidden();
    }, 'showHidden');
    createActionButton('Close Hidden', function () {
        closeHidden();
    }, 'closeHidden');
    createActionButton('google.com Not Hidden', function () {
        openHidden('https://www.google.com', false);
    }, 'openHiddenShow');

    //Clearing cache
    createActionButton('Clear Browser Cache', function () {
        doOpen('https://www.google.com', '_blank', 'clearcache=yes');
    }, 'openClearCache');
    createActionButton('Clear Session Cache', function () {
        doOpen('https://www.google.com', '_blank', 'clearsessioncache=yes');
    }, 'openClearSessionCache');

    //Video tag
    createActionButton('Remote Video', function () {
        doOpen(videohtml, '_blank');
    }, 'openRemoteVideo');

    //Local With Anchor Tag
    createActionButton('Anchor1', function () {
        doOpen(localhtml + '#bogusanchor', '_blank');
    }, 'openAnchor1');
    createActionButton('Anchor2', function () {
        doOpen(localhtml + '#anchor2', '_blank');
    }, 'openAnchor2');
};

