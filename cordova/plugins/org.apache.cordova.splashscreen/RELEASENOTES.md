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
* CB-4889 renaming org.apache.cordova.core.splashscreen to org.apache.cordova.splashscreen
* Rename CHANGELOG.md -> RELEASENOTES.md
* [CB-4806] Update splashscreen image bounds for iOS 7
* [CB-4752] Incremented plugin version on dev branch.

### 0.2.3 (Oct 9, 2013)
* [CB-4806] Re-fix Update splashscreen image bounds for iOS 7
* [CB-4934] plugin-splashscreen should not show by default on Windows8
* [CB-4929] plugin-splashscreen not loading proxy windows8
* [CB-4915] Incremented plugin version on dev branch.

### 0.2.4 (Oct 28, 2013)
* CB-5128: add repo + issue tag to plugin.xml for splashscreen plugin
* [CB-5010] Incremented plugin version on dev branch.

### 0.2.5 (Dec 4, 2013)
* add ubuntu platform
* Added amazon-fireos platform. Change to use amazon-fireos as a platform if the user agent string contains 'cordova-amazon-fireos'
* CB-5124 - Remove splashscreen config.xml values from iOS Configuration Docs, move to plugin docs

### 0.2.6 (Jan 02, 2014)
* CB-5658 Add doc/index.md for Splashscreen plugin
* Handle error when splash image is missing.

### 0.2.7 (Feb 05, 2014)
* [CB-3562] Fix aspect ratio on landscape-only iPhone applications
* CB-4051 fix for splashscreen rotation problem

### 0.3.0 (Apr 17, 2014)
* Add Tizen support to plugin
* CB-6422: [windows8] use cordova/exec/proxy
* CB-4051: [ios] - Re-fix - Splashscreen rotation problem (closes #13)
* CB-6460: Update license headers
* CB-6465: Add license headers to Tizen code
* Add NOTICE file

### 0.3.1 (Jun 05, 2014)
* documentation translation: cordova-plugin-splashscreen
* Lisa testing pulling in plugins for plugin: cordova-plugin-splashscreen
* Lisa testing pulling in plugins for plugin: cordova-plugin-splashscreen
* Lisa testing pulling in plugins for plugin: cordova-plugin-splashscreen
* Lisa testing pulling in plugins for plugin: cordova-plugin-splashscreen
* CB-6810 Add license to CONTRIBUTING.md
* [wp8] updated quirk for  and combined iOS,WP8,BB10 quirks as they are all the same
* [wp] implemented OnInit so splash screen can be shown before cordova page is loaded
* [wp] plugin must be autoloaded for AutoHideSplashScreen preference to work
* CB-6483 Use splash screen image from manifest on Windows8
* CB-6491 add CONTRIBUTING.md
* Revert "Merge branch 'tizen' of http://github.com/siovene/cordova-plugin-splashscreen"

### 0.3.2 (Aug 06, 2014)
* CB-6127 Updated translations for docs
* CB-7041 ios: Fix image filename logic when setting the iPad splash screen
* fixes Splashscreen crash on WP8
* Remove outdated doc

### 0.3.3 (Sep 17, 2014)
* CB-7249 cordova-plugin-splashscreen documentation translation
* Renamed test dir, added nested plugin.xml
* added documentation for manual tests
* CB-7196 port splashscreen tests to framework

### 0.3.4 (Oct 03, 2014)
* Finalized iOS splash screen (image name) tests. 176 tests in all, 44 for each type of device (iPad, iPhone, iPhone5, iPhone6, iPhone 6 Plus).
* CB-7633 - (Re-fix based on updated unit tests) iPhone 6 Plus support
* Updated iOS tests for locked orientations
* Added more iOS splash screen tests.
* CB-7633 - Add support for iPhone 6/6+
* Added failing iPhone 6/6 Plus tests.
* Added 'npm test'
* CB-7663 - iOS unit tests for splash screen
* Properly formatted splashscreen preference docs.
