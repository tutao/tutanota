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

### 0.3.0 (Sept 5, 2013)
* Initial FirefoxOS support
* [CB-4661] VIBRATE permission for Android

### 0.3.2 (Sept 25, 2013)
* CB-4889 bumping&resetting version
* CB-4889 renaming org.apache.cordova.core.vibration to org.apache.cordova.vibration
* Rename CHANGELOG.md -> RELEASENOTES.md
* updated to work with ffos commandProxy
* fixed plugin.xml for vibration
* [CB-4593] [Blackberry10] Added vibration support for bb10
* updated plugin to work with ffos
* [CB-4752] Incremented plugin version on dev branch.

### 0.3.3 (Oct 9, 2013)
* add missing android namespace
* [CB-4915] Incremented plugin version on dev branch.

### 0.3.4 (Oct 28, 2013)
* add repo + issue tag to plugin.xml for vibration plugin
* corrected plugin.xml to write properly to config.xml for ffos
* [CB-5010] Incremented plugin version on dev branch.

### 0.3.5 (Dec 4, 2013)
* add ubuntu platform
* Added amazon-fireos platform. Change to include amazon-fireos as a platform if the user agent string contains 'cordova-amazon-fireos'
* CB-4747 Fixed Blackberry background vibrate

### 0.3.6 (Jan 02, 2014)
* CB-5658 Add doc/index.md for Vibration plugin

### 0.3.7 (Feb 05, 2014)
* Add support for Tizen.
* CB-3206 - Supported platforms updated

### 0.3.8 (Apr 17, 2014)
* CB-6465: Add license headers to Tizen code
* CB-6460: Update license headers
* Add NOTICE file

### 0.3.9 (Jun 05, 2014)
* updated notice file
* Github close #11
* Extended vibrateWithPattern to allow for pattern repetition, implemented a complementary cancelVibration function and adapted documentation.
* Implemented vibrateWithPattern (for android) and adapted documentation.
* CB-6811 Add license to CONTRIBUTING.md
* CB-6491 add CONTRIBUTING.md

### 0.3.10 (Aug 06, 2014)
* ubuntu: Implemented vibrateWithPattern/cancelVibration
* **FFOS** update VibrationProxy.js
* CB-6127 Updated translations for docs

### 0.3.11 (Sep 17, 2014)
* CB-7249 cordova-plugin-vibration documentation translation
* CB-6724 documented Windows support for vibrate with pattern and cancel vibrate in manual test doc and moved tests to tests dir
* add longer pattern sequence for testing, change expected result for old vibrate with pattern test
* added more test cases, changed vibrate with pattern durations, changed where vibrateOn is set to true
* clear settimeout when user cancels vibration
* add setTimeout function to update vibrateOn var if user doesn't cancel vibrate, add note about iOS
* on/off button for cancel tests, add results box and msgs
* added tests for old vibrateWithPattern and cancelVibration calls
* added 'Android only' to buttons for specific tests, changed where console.log is executed for user to see earlier
* added tests to ensure compliance with w3c spec
* CB-6963 ported vibration automated & manual tests
* CB-6966 renamed folder to tests + added nested plugin.xml
* CB-6966 Ported Vibration automated & manual tests
* removed duplicate messaging
* CB-5459 slight change to the vibration documentation for pattern due to merge issue
* changes to how 0 is getting added to array in order to align with w3c spec
* changes to vibration.java to align with w3c, changes to vibration.js for backwards compatibility
* changes made to align with w3c spec
* Updated doc with Windows support for vibrate with pattern
* Added note to doc about w3c alignment and min time for Windows
* update doc with another way to cancel vibration
* update doc to show vibrate([num]) is a standard vibrate
* vibrate([num]) is treated as a vibrate not vibrate with pattern
* added new example to documentation
* updated doc for w3c alignment
* changes to how 0 is getting added to array in order to align with w3c spec
* changes to vibration.java to align with w3c, changes to vibration.js for backwards compatibility
* changes made to align with w3c spec
