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

### 0.1.5 (Apr 17, 2014) (First release as a core Cordova Plugin)
* CB-6316: Added README.md which point to the new location for docs
* CB-6316: Added license header to the documentation. Added README.md which point to the new location for docs
* CB-6316: Moved StatusBar plugin documentation to docs folder
* CB-6314: [android] Add StatusBar.isVisible support to Android
* CB-6460: Update license headers

### 0.1.6 (Jun 05, 2014)
* CB-6783 - added StatusBarStyle config preference,  updated docs (closes #9)
* CB-6812 Add license
* CB-6491 add CONTRIBUTING.md
* CB-6264 minor formatting issue
* Update docs with recent WP changes, remove 'clear' from the loist of named colors in documentation
* CB-6513 - Statusbar plugin for Android is not compiling

### 0.1.7 (Aug 06, 2014)
* Add LICENSE and NOTICE
* Update statusbar.js
* Update backgroundColorByHexString function
* ios: Use a persistent callbackId instead of calling sendJs
* CB-6626 ios: Add a JS event for tapping on statusbar
* ios: Fix hide to adjust webview's frame only when status bar is not overlaying webview
* CB-6127 Updated translations for docs
* android: Fix StatusBar.initialize() not running on UI thread

### 0.1.8 (Sep 17, 2014)
* CB-7549 [StatusBar][iOS 8] Landscape issue
* CB-7486 Remove StatusBarBackgroundColor intial preference (black background) so background will be initially transparent
* Renamed test dir, added nested plugin.xml
* added documentation for manual tests, moved background color test below overlay test
* CB-7195 ported statusbar tests to framework
