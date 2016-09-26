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

### 2.1.3 (Apr 15, 2016)
* CB-11018 Fix statusbar with `inappbrowser` causing incorrect orientation on **iOS8**
* CB-10884 `Inappbrowser` breaks UI while Screen orientation changes from landscape to portrait on **iOS**

### 2.1.2 (Mar 09, 2016)
* [CB-10752](https://issues.apache.org/jira/browse/CB-10752) for for status bar overlays the webview on **iOS** 6 in some cases
* [CB-10683](https://issues.apache.org/jira/browse/CB-10683) Fix wrong StatusBar.isVisible initial value on **Windows**
* [CB-10636](https://issues.apache.org/jira/browse/CB-10636) Add JSHint for plugins
* [CB-10047](https://issues.apache.org/jira/browse/CB-10047) fix **iOS** 8 deprecated warnings

### 2.1.1 (Feb 09, 2016)
* [CB-10102](https://issues.apache.org/jira/browse/CB-10102) The removeObserver code was wrong and it might crash on plugin deallocation

### 2.1.0 (Jan 15, 2016)
* CB-9513 Allow to show/hide status bar in fullscreen mode.
* CB-8720 Fix status bar position when app started upside down on **iOS 7**.
* CB-10118 Fixes plugin loading error for **Browser** platform

### 2.0.0 (Nov 18, 2015)
* [CB-10035](https://issues.apache.org/jira/browse/CB-10035) Updated `RELEASENOTES` to be newest to oldest
* Added `weakSelf` reference for block use
* Fixes [CB-4712](https://issues.apache.org/jira/browse/CB-4712), [CB-5439](https://issues.apache.org/jira/browse/CB-5439) statusbar issues
* Fixing contribute link.
* [CB-7965](https://issues.apache.org/jira/browse/CB-7965) Add cordova-plugin-statusbar support for **Browser** platform
* Don't use `IsAtLeastiOSVersion` macro to determine height
* Use correct statusbar height for landscape orientation in iOS >= 8
* remove travis-ci
* [CB-9202](https://issues.apache.org/jira/browse/CB-9202) updated repo url to github mirror in package.json
* Added verbose install text for users on < cordova 5.0
* update docs for `StatusBarBackgroundColor`

### 1.0.1 (Jun 17, 2015)
* add auto-tests for basic api
* [CB-9180](https://issues.apache.org/jira/browse/CB-9180) Add correct supported check for Windows 8.1 desktop
* [CB-9128](https://issues.apache.org/jira/browse/CB-9128) cordova-plugin-statusbar documentation translation: cordova-plugin-statusbar
* fix npm md issue

### 1.0.0 (Apr 15, 2015)
* [CB-8746](https://issues.apache.org/jira/browse/CB-8746) gave plugin major version bump
* [CB-8683](https://issues.apache.org/jira/browse/CB-8683) changed plugin-id to pacakge-name
* [CB-8653](https://issues.apache.org/jira/browse/CB-8653) properly updated translated docs to use new id
* [CB-8653](https://issues.apache.org/jira/browse/CB-8653) updated translated docs to use new id
* Use TRAVIS_BUILD_DIR, install paramedic by npm
* [CB-8653](https://issues.apache.org/jira/browse/CB-8653) Updated Readme
* - Use StatusBarBackgroundColor instead of AndroidStatusBarBackgroundColor, and added a quirk to the readme.
* - Add support for StatusBar.backgroundColorByHexString (and StatusBar.backgroundColorByName) on Android 5 and up
* Allow setting the statusbar backgroundcolor on Android
* [CB-8575](https://issues.apache.org/jira/browse/CB-8575) Integrate TravisCI
* [CB-8438](https://issues.apache.org/jira/browse/CB-8438) cordova-plugin-statusbar documentation translation: cordova-plugin-statusbar
* [CB-8538](https://issues.apache.org/jira/browse/CB-8538) Added package.json file

### 0.1.10 (Feb 04, 2015)
* [CB-8351](https://issues.apache.org/jira/browse/CB-8351) ios: Use argumentForIndex rather than NSArray extension

### 0.1.9 (Dec 02, 2014)
* Fix onload attribute within <feature> to be a <param>
* [CB-8010](https://issues.apache.org/jira/browse/CB-8010) - Statusbar colour does not change to orange
* added checks for running on windows when StatusBar is NOT available
* [CB-7986](https://issues.apache.org/jira/browse/CB-7986) Add cordova-plugin-statusbar support for **Windows Phone 8.1**
* [CB-7977](https://issues.apache.org/jira/browse/CB-7977) Mention `deviceready` in plugin docs
* [CB-7979](https://issues.apache.org/jira/browse/CB-7979) Each plugin doc should have a ## Installation section
* Inserting leading space after # for consistency
* [CB-7549](https://issues.apache.org/jira/browse/CB-7549) - (Re-fix) `StatusBar` **iOS 8** Landscape issue (closes #15)
* [CB-7700](https://issues.apache.org/jira/browse/CB-7700) cordova-plugin-statusbar documentation translation: cordova-plugin-statusbar
* [CB-7571](https://issues.apache.org/jira/browse/CB-7571) Bump version of nested plugin to match parent plugin

### 0.1.8 (Sep 17, 2014)
* [CB-7549](https://issues.apache.org/jira/browse/CB-7549) [StatusBar][iOS 8] Landscape issue
* [CB-7486](https://issues.apache.org/jira/browse/CB-7486) Remove StatusBarBackgroundColor intial preference (black background) so background will be initially transparent
* Renamed test dir, added nested plugin.xml
* added documentation for manual tests, moved background color test below overlay test
* [CB-7195](https://issues.apache.org/jira/browse/CB-7195) ported statusbar tests to framework

### 0.1.7 (Aug 06, 2014)
* Add LICENSE and NOTICE
* Update statusbar.js
* Update backgroundColorByHexString function
* ios: Use a persistent callbackId instead of calling sendJs
* [CB-6626](https://issues.apache.org/jira/browse/CB-6626) ios: Add a JS event for tapping on statusbar
* ios: Fix hide to adjust webview's frame only when status bar is not overlaying webview
* [CB-6127](https://issues.apache.org/jira/browse/CB-6127) Updated translations for docs
* android: Fix StatusBar.initialize() not running on UI thread

### 0.1.6 (Jun 05, 2014)
* [CB-6783](https://issues.apache.org/jira/browse/CB-6783) - added StatusBarStyle config preference,  updated docs (closes #9)
* [CB-6812](https://issues.apache.org/jira/browse/CB-6812) Add license
* [CB-6491](https://issues.apache.org/jira/browse/CB-6491) add CONTRIBUTING.md
* [CB-6264](https://issues.apache.org/jira/browse/CB-6264) minor formatting issue
* Update docs with recent WP changes, remove 'clear' from the loist of named colors in documentation
* [CB-6513](https://issues.apache.org/jira/browse/CB-6513) - Statusbar plugin for Android is not compiling

### 0.1.5 (Apr 17, 2014) (First release as a core Cordova Plugin)
* [CB-6316](https://issues.apache.org/jira/browse/CB-6316): Added README.md which point to the new location for docs
* [CB-6316](https://issues.apache.org/jira/browse/CB-6316): Added license header to the documentation. Added README.md which point to the new location for docs
* [CB-6316](https://issues.apache.org/jira/browse/CB-6316): Moved StatusBar plugin documentation to docs folder
* [CB-6314](https://issues.apache.org/jira/browse/CB-6314): [android] Add StatusBar.isVisible support to Android
* [CB-6460](https://issues.apache.org/jira/browse/CB-6460): Update license headers
