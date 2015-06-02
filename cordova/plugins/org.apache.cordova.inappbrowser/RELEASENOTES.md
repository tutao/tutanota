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

### 0.2.2 (Sept 25, 2013)
* CB-4889 bumping&resetting version
* CB-4788: Modified the onJsPrompt to warn against Cordova calls
* [windows8] commandProxy was moved
* CB-4788: Modified the onJsPrompt to warn against Cordova calls
* [windows8] commandProxy was moved
* CB-4889 renaming core references
* CB-4889 renaming org.apache.cordova.core.inappbrowser to org.apache.cordova.inappbrowser
* CB-4864, CB-4865: Minor improvements to InAppBrowser
* Rename CHANGELOG.md -> RELEASENOTES.md
* [CB-4792] Added keepCallback to the show function.
* [CB-4752] Incremented plugin version on dev branch.

### 0.2.3 (Oct 9, 2013)
* [CB-4915] Incremented plugin version on dev branch.
* [CB-4926] Fixes inappbrowser plugin loading for windows8

### 0.2.4 (Oct 28, 2013)
* CB-5128: added repo + issue tag to plugin.xml for inappbrowser plugin
* CB-4995 Fix crash when WebView is quickly opened then closed.
* CB-4930 - iOS - InAppBrowser should take into account the status bar
* [CB-5010] Incremented plugin version on dev branch.
* [CB-5010] Updated version and RELEASENOTES.md for release 0.2.3
* CB-4858 - Run IAB methods on the UI thread.
* CB-4858 Convert relative URLs to absolute URLs in JS
* CB-3747 Fix back button having different dismiss logic from the close button.
* CB-5021 Expose closeDialog() as a public function and make it safe to call multiple times.
* CB-5021 Make it safe to call close() multiple times

### 0.2.5 (Dec 4, 2013)
* Remove merge conflict tag
* [CB-4724] fixed UriFormatException
* add ubuntu platform
* CB-3420 WP feature hidden=yes implemented
* Added amazon-fireos platform. Change to use amazon-fireos as the platform if user agent string contains 'cordova-amazon-fireos'

### 0.3.0 (Jan 02, 2014)
* CB-5592 Android: Add MIME type to Intent when opening file:/// URLs
* CB-5594 iOS: Add disallowoverscroll option.
* CB-5658 Add doc/index.md for InAppBrowser plugin
* CB-5595 Add toolbarposition=top option.
* Apply CB-5193 to InAppBrowser (Fix DB quota exception)
* CB-5593 iOS: Make InAppBrowser localizable
* CB-5591 Change window.escape to encodeURIComponent

### 0.3.1 (Feb 05, 2014)
* CB-5756: Android: Use WebView.evaluateJavascript for script injection on Android 4.4+
* Didn't test on ICS or lower, getDrawable isn't supported until Jellybean
* add ubuntu platform
* Adding drawables to the inAppBrowser.  This doesn't look quite right, but it's a HUGE improvement over the previous settings
* CB-5756: Android: Use WebView.evaluateJavascript for script injection on Android 4.4+
* Remove alive from InAppBrowser.js since it didn't catch the case where the browser is closed by the user.
* CB-5733 Fix IAB.close() not working if called before show() animation is done

### 0.3.2 (Feb 26, 2014)
* Validate that callbackId is correctly formed
* CB-6035 Move js-module so it is not loaded on unsupported platforms
* Removed some iOS6 Deprecations

### 0.3.3 (Mar 5, 2014)
* CB-5534 Fix video/audio does not stop playing when browser is closed
* CB-6172 Fix broken install on case-sensitive file-systems


### 0.4.0 (Apr 17, 2014)
* CB-6360: [ios] Fix for crash on iOS < 6.0 (closes #37)
* CB-3324: [WP8] Add support for back-button inappbrowser [WP8] if there is no history -> InAppBrowser is closed
* [WP] await async calls, resolve warnings
* [WP] Make InAppBrowser work with embedded files, using system behavior
* CB-6402: [WP8] pass empty string instead of null for [optional] windowFeatures string
* CB-6422: [windows8] use cordova/exec/proxy
* CB-6389 CB-3617: Add clearcache and clearsessioncache options to iOS (like Android)
* Doc update: event name and example param (closes #31)
* CB-6253: [WP] Add Network Capability to WMAppManifest.xml
* CB-6212: [iOS] fix warnings compiled under arm64 64-bit
* CB-6218: Update docs for BB10
* CB-6460: Update license headers

### 0.5.0 (Jun 05, 2014)
* CB-6127 Spanish and rench Translations added. Github close #23
* Clean up whitespace (mainly due to no newline at eof warning)
* Adding permission info
* CB-6806 Add license
* CB-6491 add CONTRIBUTING.md
* Add necessary capability so the plugin works on its own
* CB-6474 InAppBrowser. Add data urls support to WP8
* CB-6482 InAppBrowser calls incorrect callback on WP8
* Fixed use of iOS 6 deprecated methods
* CB-6360 - improvement: feature detection instead of iOS version detection
* CB-5649 - InAppBrowser overrides App's orientation
* refactoring fixed
* CB-6396 [Firefox OS] Adding basic support

### 0.5.1 (Aug 06, 2014)
* ubuntu: support qt 5.2
* **FFOS** update InAppBrowserProxy.js
* **FFOS** app needs to be privileged
* CB-6127 Updated translations for docs
* CB-6769 ios: Fix statusbar color reset wasn't working on iOS7+

### 0.5.2 (Sep 17, 2014)
* CB-7471 cordova-plugin-inappbrowser documentation translation: cordova-plugin-inappbrowser
* CB-7490 Fixes InAppBrowser manual tests crash on windows platform
* CB-7249 cordova-plugin-inappbrowser documentation translation: cordova-plugin-inappbrowser
* CB-7424 Wrong docs: anchor tags are not supported by the InAppBrowser
* CB-7133 clarify that anchor1 doesn't exist
* CB-7133 more fixup of tests on Android
* CB-7133 fix up the tests for Android
* Add just a bit more logging
* CB-7133 port inappbrowser to plugin-test-framework
* phonegap events supported for \_blank target
* inappbrowser \_blank target position is fixed
* amazon-fireos related changes.

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

### 0.5.4 (Dec 02, 2014)
* CB-7784 Exit event is not fired after `InAppBrowser` closing
* CB-7697 Add `locationBar` support to `InAppBrowser` **Windows** platform version
* CB-7690 `InAppBrowser` `loadstart/loadstop` events issues
* CB-7695 Fix `InAppBrowser` `injectScriptFile` for **Windows 8.1** / **Windows Phone 8.1**
* CB-7692 `InAppBrowser` local url opening bug in 8.1
* CB-7688 `Alert` is not supported in `InAppBrowser` on **Windows** platform
* CB-7977 Mention `deviceready` in plugin docs
* CB-7876 change test target to avoid undesired redirects
* CB-7712 remove references to `closebuttoncaption`
* CB-7850 clarify role of whitelist
* CB-7720 check if event is null since OK string from success callback was removed
* CB-7471 cordova-plugin-inappbrowser documentation translation: cordova-plugin-inappbrowser

### 0.6.0 (Feb 04, 2015)
* CB-8270 ios: Remove usage of `[arr JSONString]`, since it's been renamed to `cdv_JSONString`
* ubuntu: implement inject* functions
* ubuntu: port to oxide
* CB-7897 ios, android: Update to work with whilelist plugins in Cordova 4.x
