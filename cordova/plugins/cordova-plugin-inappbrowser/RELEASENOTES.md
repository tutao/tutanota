<!--
#
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
# 
# http://www.apache.org/licenses/LICENSE-2.0
# 
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
#  KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
#
-->
# Release Notes

### 1.2.1 (Feb 02, 2016)
* [CB-10407](https://issues.apache.org/jira/browse/CB-10407) InAppBrowser not firing loadstart event on android
* [CB-10428](https://issues.apache.org/jira/browse/CB-10428) Fix syntax error when browserifying inAppBrowser plugin
* handle app store urls in system browser
* [CB-6702](https://issues.apache.org/jira/browse/CB-6702) InAppBrowser hangs when opening more than one instance
* [CB-10456](https://issues.apache.org/jira/browse/CB-10456) InAppBrowser is not closed if I close it programmatically on Android
* [CB-10451](https://issues.apache.org/jira/browse/CB-10451) InAppBrowser: loadstart event is not triggered on Windows
* [CB-10452](https://issues.apache.org/jira/browse/CB-10452) InAppBrowser: 'exit' event is not triggered on Windows
* [CB-10454](https://issues.apache.org/jira/browse/CB-10454) InAppBrowser: 'loaderror' event does not have code and message on Windows
* [CB-10450](https://issues.apache.org/jira/browse/CB-10450) InAppBrowser: Unable to get property 'canGoBack' of undefined on Windows
* [CB-10441](https://issues.apache.org/jira/browse/CB-10441) Add auto tests for InAppBrowser plugin

### 1.2.0 (Jan 15, 2016)
* CB-8180: Changing methods of interception in `WebViewClient` class
* CB-10009 Improve `InAppBrowser` toolbar look and feel on **Windows**
* Open a new window on the **Browser** platform

### 1.1.1 (Dec 10, 2015)

* CB-9445 Improves executeScript callbacks on iOS
* CB-10035 Incremented plugin version.
* CB-10040 - re-fix: backwards compatible with cordova-ios < 4.0
* CB-8534: Allow plugins to respond to onReceivedHttpAuthRequest. This closes #82
* CB-3750: Fixes spinner on iOS. This closes #89
* CB-7696 Document target=_self behavior for Windows
* CB-10040 - Compile Error in InAppBrowser Plugin for iOS - No known instance method for selector 'URLIsWhitelisted:'

### 1.1.0 (Nov 18, 2015)
* [CB-10035](https://issues.apache.org/jira/browse/CB-10035) Updated `RELEASENOTES` to be newest to oldest
* Invoke webview if using local file
* Fixed `zIndex` issue on **Windows 8**, **8.188 where InAppBrowser opens behind default app.
* fix `async` self usage
* [CB-9150](https://issues.apache.org/jira/browse/CB-9150) Fix InAppBrowser `executeScript` crash on **Windows** if no data returned
* [CB-10008](https://issues.apache.org/jira/browse/CB-10008) Fix InAppBrowser popup layout on **Windows**
* Setting `setStatusBarStyle` to `-1` causes `CGContextSaveGState`.
* [CB-9167](https://issues.apache.org/jira/browse/CB-9167) Fix crash on **browser** window close 
* [CB-9799](https://issues.apache.org/jira/browse/CB-9799) Fixed `javaDoc` errors.
* Fixing contribute link.
* [CB-9760](https://issues.apache.org/jira/browse/CB-9760) InAppBrowser: fallback to default `window.open` behavior on **Ripple**
* [CB-9378](https://issues.apache.org/jira/browse/CB-9378) Fix InAppBrowser not taking whole screen on **Windows**
* [CB-9158](https://issues.apache.org/jira/browse/CB-9158) - InAppBrowser `zoomControls` are always set to true

### 1.0.1 (Jun 17, 2015)
* [CB-9128](https://issues.apache.org/jira/browse/CB-9128) cordova-plugin-inappbrowser documentation translation: cordova-plugin-inappbrowser
* fix npm md issue

### 1.0.0 (Apr 15, 2015)
* [CB-8746](https://issues.apache.org/jira/browse/CB-8746) gave plugin major version bump
* [CB-7689](https://issues.apache.org/jira/browse/CB-7689) Adds insertCSS support for windows platform
* [CB-4930](https://issues.apache.org/jira/browse/CB-4930) - (prefix) InAppBrowser should take into account the status bar
* [CB-8635](https://issues.apache.org/jira/browse/CB-8635) Improves UX on windows platform
* [CB-8661](https://issues.apache.org/jira/browse/CB-8661) Return executed script result on Windows
* [CB-8683](https://issues.apache.org/jira/browse/CB-8683) updated wp and browser specific references of old id to new id
* [CB-8683](https://issues.apache.org/jira/browse/CB-8683) changed plugin-id to pacakge-name
* [CB-8653](https://issues.apache.org/jira/browse/CB-8653) properly updated translated docs to use new id
* [CB-8653](https://issues.apache.org/jira/browse/CB-8653) updated translated docs to use new id
* Use TRAVIS_BUILD_DIR, install paramedic by npm
* [CB-8432](https://issues.apache.org/jira/browse/CB-8432) Correct styles for browser wrapper to display it correctly on some pages
* [CB-8659](https://issues.apache.org/jira/browse/CB-8659) - Update InAppBrowser to support both cordova-ios 4.0.x and 3.x (closes #93)
* [CB-7961](https://issues.apache.org/jira/browse/CB-7961) Add cordova-plugin-inappbrowser support for browser platform
* [CB-8653](https://issues.apache.org/jira/browse/CB-8653) Updated Readme
* Update docs for Android zoom=no option
* Added option to disable/enable zoom controls
* updated docs, set hardwareback default to true
* Add a hardwareback option to allow for the hardware back button to go back.
* [CB-8570](https://issues.apache.org/jira/browse/CB-8570) Integrate TravisCI
* [CB-8438](https://issues.apache.org/jira/browse/CB-8438) cordova-plugin-inappbrowser documentation translation: cordova-plugin-inappbrowser
* [CB-8538](https://issues.apache.org/jira/browse/CB-8538) Added package.json file
* Keep external android pages in a single tab. (close #61)
* [CB-8444](https://issues.apache.org/jira/browse/CB-8444) Add a clobber for `cordova.InAppBrowser.open` (close #80)
* [CB-8444](https://issues.apache.org/jira/browse/CB-8444) Don't clobber `window.open` - Add new symbol/clobber to access open function (`cordova.InAppBrowser.open`) - Change existing tests to use new symbol (i.e. don't rely on plugin clobber of `window.open`) - Add tests to use `window.open` via manual replace with new symbol - Update docs to deprecate plugin clobber of `window.open`

### 0.6.0 (Feb 04, 2015)
* [CB-8270](https://issues.apache.org/jira/browse/CB-8270) ios: Remove usage of `[arr JSONString]`, since it's been renamed to `cdv_JSONString`
* ubuntu: implement `inject*` functions
* ubuntu: port to oxide
* [CB-7897](https://issues.apache.org/jira/browse/CB-7897) ios, android: Update to work with whilelist plugins in Cordova 4.x

### 0.5.4 (Dec 02, 2014)
* [CB-7784](https://issues.apache.org/jira/browse/CB-7784) Exit event is not fired after `InAppBrowser` closing
* [CB-7697](https://issues.apache.org/jira/browse/CB-7697) Add `locationBar` support to `InAppBrowser` **Windows** platform version
* [CB-7690](https://issues.apache.org/jira/browse/CB-7690) `InAppBrowser` `loadstart/loadstop` events issues
* [CB-7695](https://issues.apache.org/jira/browse/CB-7695) Fix `InAppBrowser` `injectScriptFile` for **Windows 8.1** / **Windows Phone 8.1**
* [CB-7692](https://issues.apache.org/jira/browse/CB-7692) `InAppBrowser` local url opening bug in 8.1
* [CB-7688](https://issues.apache.org/jira/browse/CB-7688) `Alert` is not supported in `InAppBrowser` on **Windows** platform
* [CB-7977](https://issues.apache.org/jira/browse/CB-7977) Mention `deviceready` in plugin docs
* [CB-7876](https://issues.apache.org/jira/browse/CB-7876) change test target to avoid undesired redirects
* [CB-7712](https://issues.apache.org/jira/browse/CB-7712) remove references to `closebuttoncaption`
* [CB-7850](https://issues.apache.org/jira/browse/CB-7850) clarify role of whitelist
* [CB-7720](https://issues.apache.org/jira/browse/CB-7720) check if event is null since OK string from success callback was removed
* [CB-7471](https://issues.apache.org/jira/browse/CB-7471) cordova-plugin-inappbrowser documentation translation: cordova-plugin-inappbrowser

### 0.5.3 (Oct 03, 2014)
* Windows implementation fixes and improvements
* zIndex fixed
* renamed InAppBrowser back to inappbrowser for case sensitive operating systems
* Update french translation
* Update doc to add Windows 8
* Update windows proxy to be both compatible with windows 8 and 8.1
* Rename windows81 by windows8 in src directory
* Append Windows 8.1 platform configuration in plugin.xml
* Append Windows 8.1 proxy using x-ms-webview

### 0.5.2 (Sep 17, 2014)
* [CB-7471](https://issues.apache.org/jira/browse/CB-7471) cordova-plugin-inappbrowser documentation translation: cordova-plugin-inappbrowser
* [CB-7490](https://issues.apache.org/jira/browse/CB-7490) Fixes InAppBrowser manual tests crash on windows platform
* [CB-7249](https://issues.apache.org/jira/browse/CB-7249) cordova-plugin-inappbrowser documentation translation: cordova-plugin-inappbrowser
* [CB-7424](https://issues.apache.org/jira/browse/CB-7424) Wrong docs: anchor tags are not supported by the InAppBrowser
* [CB-7133](https://issues.apache.org/jira/browse/CB-7133) clarify that anchor1 doesn't exist
* [CB-7133](https://issues.apache.org/jira/browse/CB-7133) more fixup of tests on Android
* [CB-7133](https://issues.apache.org/jira/browse/CB-7133) fix up the tests for Android
* Add just a bit more logging
* [CB-7133](https://issues.apache.org/jira/browse/CB-7133) port inappbrowser to plugin-test-framework
* phonegap events supported for \_blank target
* inappbrowser \_blank target position is fixed
* amazon-fireos related changes.

### 0.5.1 (Aug 06, 2014)
* ubuntu: support qt 5.2
* **FFOS** update InAppBrowserProxy.js
* **FFOS** app needs to be privileged
* [CB-6127](https://issues.apache.org/jira/browse/CB-6127) Updated translations for docs
* [CB-6769](https://issues.apache.org/jira/browse/CB-6769) ios: Fix statusbar color reset wasn't working on iOS7+

### 0.5.0 (Jun 05, 2014)
* [CB-6127](https://issues.apache.org/jira/browse/CB-6127) Spanish and rench Translations added. Github close #23
* Clean up whitespace (mainly due to no newline at eof warning)
* Adding permission info
* [CB-6806](https://issues.apache.org/jira/browse/CB-6806) Add license
* [CB-6491](https://issues.apache.org/jira/browse/CB-6491) add CONTRIBUTING.md
* Add necessary capability so the plugin works on its own
* [CB-6474](https://issues.apache.org/jira/browse/CB-6474) InAppBrowser. Add data urls support to WP8
* [CB-6482](https://issues.apache.org/jira/browse/CB-6482) InAppBrowser calls incorrect callback on WP8
* Fixed use of iOS 6 deprecated methods
* [CB-6360](https://issues.apache.org/jira/browse/CB-6360) - improvement: feature detection instead of iOS version detection
* [CB-5649](https://issues.apache.org/jira/browse/CB-5649) - InAppBrowser overrides App's orientation
* refactoring fixed
* [CB-6396](https://issues.apache.org/jira/browse/CB-6396) [Firefox OS] Adding basic support

### 0.4.0 (Apr 17, 2014)
* [CB-6360](https://issues.apache.org/jira/browse/CB-6360): [ios] Fix for crash on iOS < 6.0 (closes #37)
* [CB-3324](https://issues.apache.org/jira/browse/CB-3324): [WP8] Add support for back-button inappbrowser [WP8] if there is no history -> InAppBrowser is closed
* [WP] await async calls, resolve warnings
* [WP] Make InAppBrowser work with embedded files, using system behavior
* [CB-6402](https://issues.apache.org/jira/browse/CB-6402): [WP8] pass empty string instead of null for [optional] windowFeatures string
* [CB-6422](https://issues.apache.org/jira/browse/CB-6422): [windows8] use cordova/exec/proxy
* [CB-6389](https://issues.apache.org/jira/browse/CB-6389) [CB-3617](https://issues.apache.org/jira/browse/CB-3617): Add clearcache and clearsessioncache options to iOS (like Android)
* Doc update: event name and example param (closes #31)
* [CB-6253](https://issues.apache.org/jira/browse/CB-6253): [WP] Add Network Capability to WMAppManifest.xml
* [CB-6212](https://issues.apache.org/jira/browse/CB-6212): [iOS] fix warnings compiled under arm64 64-bit
* [CB-6218](https://issues.apache.org/jira/browse/CB-6218): Update docs for BB10
* [CB-6460](https://issues.apache.org/jira/browse/CB-6460): Update license headers

### 0.3.3 (Mar 5, 2014)
* [CB-5534](https://issues.apache.org/jira/browse/CB-5534) Fix video/audio does not stop playing when browser is closed
* [CB-6172](https://issues.apache.org/jira/browse/CB-6172) Fix broken install on case-sensitive file-systems

### 0.3.2 (Feb 26, 2014)
* Validate that callbackId is correctly formed
* [CB-6035](https://issues.apache.org/jira/browse/CB-6035) Move js-module so it is not loaded on unsupported platforms
* Removed some iOS6 Deprecations

### 0.3.1 (Feb 05, 2014)
* [CB-5756](https://issues.apache.org/jira/browse/CB-5756): Android: Use WebView.evaluateJavascript for script injection on Android 4.4+
* Didn't test on ICS or lower, getDrawable isn't supported until Jellybean
* add ubuntu platform
* Adding drawables to the inAppBrowser.  This doesn't look quite right, but it's a HUGE improvement over the previous settings
* [CB-5756](https://issues.apache.org/jira/browse/CB-5756): Android: Use WebView.evaluateJavascript for script injection on Android 4.4+
* Remove alive from InAppBrowser.js since it didn't catch the case where the browser is closed by the user.
* [CB-5733](https://issues.apache.org/jira/browse/CB-5733) Fix IAB.close() not working if called before show() animation is done

### 0.2.5 (Dec 4, 2013)
* Remove merge conflict tag
* [CB-4724](https://issues.apache.org/jira/browse/CB-4724) fixed UriFormatException
* add ubuntu platform
* [CB-3420](https://issues.apache.org/jira/browse/CB-3420) WP feature hidden=yes implemented
* Added amazon-fireos platform. Change to use amazon-fireos as the platform if user agent string contains 'cordova-amazon-fireos'

### 0.2.4 (Oct 28, 2013)
* [CB-5128](https://issues.apache.org/jira/browse/CB-5128): added repo + issue tag to plugin.xml for inappbrowser plugin
* [CB-4995](https://issues.apache.org/jira/browse/CB-4995) Fix crash when WebView is quickly opened then closed.
* [CB-4930](https://issues.apache.org/jira/browse/CB-4930) - iOS - InAppBrowser should take into account the status bar
* [CB-5010](https://issues.apache.org/jira/browse/CB-5010) Incremented plugin version on dev branch.
* [CB-5010](https://issues.apache.org/jira/browse/CB-5010) Updated version and RELEASENOTES.md for release 0.2.3
* [CB-4858](https://issues.apache.org/jira/browse/CB-4858) - Run IAB methods on the UI thread.
* [CB-4858](https://issues.apache.org/jira/browse/CB-4858) Convert relative URLs to absolute URLs in JS
* [CB-3747](https://issues.apache.org/jira/browse/CB-3747) Fix back button having different dismiss logic from the close button.
* [CB-5021](https://issues.apache.org/jira/browse/CB-5021) Expose closeDialog() as a public function and make it safe to call multiple times.
* [CB-5021](https://issues.apache.org/jira/browse/CB-5021) Make it safe to call close() multiple times

### 0.2.3 (Oct 9, 2013)
* [CB-4915](https://issues.apache.org/jira/browse/CB-4915) Incremented plugin version on dev branch.
* [CB-4926](https://issues.apache.org/jira/browse/CB-4926) Fixes inappbrowser plugin loading for windows8

### 0.2.2 (Sept 25, 2013)
* [CB-4889](https://issues.apache.org/jira/browse/CB-4889) bumping&resetting version
* [CB-4788](https://issues.apache.org/jira/browse/CB-4788): Modified the onJsPrompt to warn against Cordova calls
* [windows8] commandProxy was moved
* [CB-4788](https://issues.apache.org/jira/browse/CB-4788): Modified the onJsPrompt to warn against Cordova calls
* [windows8] commandProxy was moved
* [CB-4889](https://issues.apache.org/jira/browse/CB-4889) renaming core references
* [CB-4889](https://issues.apache.org/jira/browse/CB-4889) renaming org.apache.cordova.core.inappbrowser to org.apache.cordova.inappbrowser
* [CB-4864](https://issues.apache.org/jira/browse/CB-4864), [CB-4865](https://issues.apache.org/jira/browse/CB-4865): Minor improvements to InAppBrowser
* Rename CHANGELOG.md -> RELEASENOTES.md
* [CB-4792](https://issues.apache.org/jira/browse/CB-4792) Added keepCallback to the show function.
* [CB-4752](https://issues.apache.org/jira/browse/CB-4752) Incremented plugin version on dev branch.
