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
* [windows8] commandProxy was moved
* CB-4889 renaming reference in Notification.cs
* CB-4889 renaming org.apache.cordova.core.dialogs to org.apache.cordova.dialogs
* Rename CHANGELOG.md -> RELEASENOTES.md
* [CB-4592] [Blackberry10] Added beep support
* [CB-4752] Incremented plugin version on dev branch.

 ### 0.2.3 (Oct 28, 2013)
* CB-5128: added repo + issue tag to plugin.xml for dialogs plugin
* new plugin execute arguments supported
* new plugin style
* smaller fonts styling input
* img files copied inside plugin
* style added
* prompt added
* styling from James
* fixed "exec" calls addedd css, but not working yet
* first (blind) try
* [CB-4915] Incremented plugin version on dev branch.

 
### 0.2.4 (Dec 4, 2013)
* add ubuntu platform
* 1. Added amazon-fireos platform. 2. Change to use amazon-fireos as a platform if user agent string contains 'cordova-amazon-fireos'.
* added beep funtionality using ms-winsoundevent:Notfication.Default

### 0.2.5 (Jan 02, 2014)
* CB-4696 Fix compile error for Xcode 4.5.
* CB-5658 Add doc/index.md for Dialogs plugin
* CB-3762 Change prompt default to empty string
* Move images from css to img

### 0.2.6 (Feb 05, 2014)
* no need to recreate the manifest.webapp file after each `cordova prepare` for FFOS
* FFOS description added

### 0.2.7 (Apr 17, 2014)
* CB-6212: [iOS] fix warnings compiled under arm64 64-bit
* CB-6411: [BlackBerry10] Work around Audio playback issue
* CB-6411: [BlackBerry10] Updates to beep
* CB-6422: [windows8] use cordova/exec/proxy
* CB-6460: Update license headers
* Add NOTICE file

### 0.2.8 (Jun 05, 2014)
* CB-6801 Add license
* running original windows.open, inAppBrowser is overriding it no need to place CSS in every page anymore
* CB-5945 [Windows8] do not call success callbacks until dialog is dismissed
* CB-4616 Returned index 0 was not documented for notification.prompt
* update docs to state that prompt is supported on windowsphone
* CB-6528 allow scroll on alert message content
* [CB-6628][amazon-fireos]dialogs plugin's confirm and prompt methods dont work confirm() method was missing amazon-fireos platform check. added that. prompt() method had bug. It is executed in a worker thread that does not have a message queue(or Looper object) associated with it and hence "can't create a handler" exception is thrown. To fix this issue, we need to create the EditText widget from within the UI thread. This was fixed sometime ago when we added fireos platform but commit got lost somewhere. So fixing it again now.
* CB-6491 add CONTRIBUTING.md
* Added check for isFinishing() on the parent activity to prevent crashes when trying to display dialogs when activity is in this phase of it's lifecycle
* CB-4966 Dialogs are in window now No need to add anything to manifest or index.html
* Removing FirefoxOS Quirks * no need to add special permission (it's different API with the same name) * notification.css is added automatically

### 0.2.9 (Aug 06, 2014)
* ubuntu: pass proper arguments to prompt callback
* ubuntu: use TextField instead of TextInput
* ubuntu: proper message escaping before passing to qml
* **FFOS** update notification.js
* CB-6127 Updated translations for docs
* android: Explicitly apply default theme to dialogs
* Fix Beep exception on Android when no argument passed
