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

### 0.2.1 (Sept 5, 2013)
* [CB-4580] Fixed up duplicate definitions of module id
* [CB-4432] Copyright notice change

### 0.2.3 (Sept 25, 2013)
* CB-4889 bumping&resetting version
* [BlackBerry10] removed uneeded permission tags in plugin.xml
* [BlackBerry10] removed uneeded permission tags in plugin.xml
* CB-4889 renaming blackberry10 reference in plugin.xml
* CB-4888 renaming org.apache.cordova.core.contacts to org.apache.cordova.contacts
* added contacts api for firefoxos
* Rename CHANGELOG.md -> RELEASENOTES.md
* [CB-4824] Fix XCode 5 contacts plugin warnings
* [CB-4752] Incremented plugin version on dev branch.

### 0.2.4 (Oct 9, 2013)
* [CB-4950] Remove the dependence on concrete component android.webkit.WebView.
* [CB-4915] Incremented plugin version on dev branch.

 ### 0.2.5 (Oct 28, 2013)
* CB-5128: added repo + issue tags for contacts
* [CB-5010] Incremented plugin version on dev branch.

### 0.2.6 (Dec 4, 2013)
* Fix bad commit/merge
* CB-3035 Fix issue with windows new line char \n\r
* wrong example given
* docs added
* FxOS name fields are arrays hackedSearch refactored search based on find commented out
* search hacked via getAll
* search added - no idea if this is working
* createMozillaFromCordova and vice versa are used to translate contact objects from one API to another.
* add/remove working
* save is working
* attempt to save is failing trying to limit the translated contact fields to name and familyName, but still failing
* save is linked with the proxy contact.name doesn't exist www/Contact.js#Contact.prototype.save check on which side is the error
* CB-5214 Make mobile spec tests on WP8 to run w/o user interaction + Sync with cordova-mobile-spec
* CB-5525 WP8. Contacts Api fails in case of there is special character in contact field
* fixed ubuntu policy error
* [ubuntu] specify policy_group
* add ubuntu platform
* CB-3035 Fix issue with windows new line char \n\r
* 1. Added amazon-fireos platform. 2. Change to use amazon-fireos as the platform if user agent string contains 'cordova-amazon-fireos'.
* CB-5198 [BlackBerry10] Update dependencies to point to registry
* handle null filter when fields are specified. ( long standing pull-req from @kevfromireland )

### 0.2.7 (Jan 02, 2014)
* B-5658 Add doc/index.md for Contacts plugin

### 0.2.8 (Feb 05, 2014)
* [CB-3208] FFOS docs updated
* CB-4590 - chooseContact in CDVContacts crashes app

### 0.2.9 (Feb 26, 2014)
* CB-6086 Fix typo in ffos part of plugin.xml: Camera -> Contacts
* CB-5994 Switch Contact ID lookup to use Raw contact id.

### 0.2.10 (Apr 17, 2014)
* CB-6126: [BlackBerry10] Update docs quirks section for fields which are supported
* CB-6212: [iOS] fix warnings compiled under arm64 64-bit
* CB-6460: Update license headers
* Add NOTICE file

### 0.2.11 (Jul 2, 2014)
* CB-6127 Spanish and French Translations added. Github close #25
* Remove deprecated symbols for iOS < 6
* CB-6797 Add license
* [wp8] now pupulates contact photos
* Update license headers format
* Add pickContact functionality to cordova contacts plugin
* CB-5416 - Adding support for auto-managing permissions
* CB-6682 move windows8 command proxy into it's missing platform tag. This closes #30
* Add ContactError codes to index.md doc (closes #28)
* CB-6491 add CONTRIBUTING.md
* Docs typo: navigator.contacts.length -> contacts.length
* CB-5698 ios: Check to see if photoData exists before using
* CB-7003 android: Make pickContact pick correct contact on Android 4.3 and 4.4.3

### 0.2.12 (Aug 06, 2014)
* fixes .find method when 'options' param is not passed. Will return all contacts on missing 'options' param
* [FFOS] update ContactsProxy.js
* Removing a stray unicode character
* CB-6127 Updated translations for docs
* CB-5698 ios: Check to see if photoData exists before using
