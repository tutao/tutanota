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

### 2.1.0 (Apr 15, 2016)
* CB-11043 **Android** app crashes while trying to save contact with phone numbers array with deleted values
* CB-10985 Android sets type to `-1` for ims Added a corresponding test
* CB-11048 Fix spec27's inadvertant breakage that happened during logging rollback
* CB-11041 `cordova-plugin-contacts` readme must be updated to include instructions on removing phone number from a contact
* CB-11033 Appium tests: Increased the timeout for updating the contact
* CB-10399 Added Appium tests
* Replace `PermissionHelper.java` with `cordova-plugin-compat`
* CB-8115 incorrect birthday saved to phonebook using Contacts Plugin
* Changes to stop using global object - remove all created contacts from the emulator
* CB-10881 Increase timeout for Spec22
* Fix for the specs 26&27 to use the newly created contacts for removal test
* CB-10881 Remove test dependency on global object
* CB-10632 Fixing jasmine test contact removal
* CB-10636 Add `JSHint` for plugins

### 2.0.1 (Jan 15, 2016)
* CB-10159 **Android** Adding restore callback to handle Activity destruction
* CB-10319 **Android** Adding reflective helper methods for permission requests
* CB-10117 Added new tests
* CB-10131 Fixed null contact creation.
* CB-10053 Documents `ContactFieldType` enumeration. 
* CB-10148 **Android** Added `READ_CONTACTS` permission request when picking a contact
* CB-10053 Accept assets `URIs` for contact photos
* CB-8115 Save contact birthday properly
* CB-6979 Don't create duplicates for extracted contacts photos
* CB-5308 Makes contacts save specs passing
* CB-5308 Return `rawId` instead of id when modifying existing contact
* CB-4921 Corrects examples by adding missing `multiple` option where multiple contacts are expected
* CB-10094 **Android** Fixed empty string comparison
* CB-3950 Adds support for custom labels
* CB-9770 Request user permissions before picking a contact
* CB-8156 Call error callback on `pickContact` cancellation
* CB-7906 Prevent app crash when `desiredFields` option has undefined items
* CB-7021 Adds manual test for `pickContact`

### 2.0.0 (Nov 18, 2015)
* [CB-10035](https://issues.apache.org/jira/browse/CB-10035) Updated `RELEASENOTES` to be newest to oldest
* [CB-9728](https://issues.apache.org/jira/browse/CB-9728) Solving memory leak issues due to opened cursor objects
* [CB-9940](https://issues.apache.org/jira/browse/CB-9940) Adding namespace declarations for `m3` and uap to `plugin.xml`. 
* [CB-9905](https://issues.apache.org/jira/browse/CB-9905) mark tests as pending if **iOS** permission is blocked.
* Refactored `ContactManager` after feedback
* Commit of Contacts Plugin with new `API` for new **MarshMallow** permissions for **Android 6.0**
* Fixing contribute link.
* [CB-9823](https://issues.apache.org/jira/browse/CB-9823) Making sure the `photoCursor` is always closed.
* Shortened multiple references to use `CommonDataKinds` directly
* removed mulitple calls `toLowerCase(Locale.getDefault())` for the same string, use type Phone `enum` directly.
* [CB-8537](https://issues.apache.org/jira/browse/CB-8537) Updated source to pass `Fortify` scan.
* Update `ContactProxy.js`
* Do not return absolute path for contact images.
* [CB-9579](https://issues.apache.org/jira/browse/CB-9579) Fixed failed tests when `DeleteMe` contact already exists
* [CB-9054](https://issues.apache.org/jira/browse/CB-9054): Can't fully reproduce, but we should probably wrap this in an exception anyway.

### 1.1.0 (Jun 17, 2015)
* [CB-9128](https://issues.apache.org/jira/browse/CB-9128) cordova-plugin-contacts documentation translation: cordova-plugin-contacts
* fix npm md issue
* Add more install text for legacy versions of cordova tools. This closes #60
* [CB-9056](https://issues.apache.org/jira/browse/CB-9056) Increased timeout of failing tests
* [CB-8987](https://issues.apache.org/jira/browse/CB-8987): Support for save and remove for Windows 10
* [CB-5278](https://issues.apache.org/jira/browse/CB-5278): We must close the cursor or we take down the whole app, and the debugger doesn't catch it.

### 1.0.0 (Apr 15, 2015)
* [CB-8746](https://issues.apache.org/jira/browse/CB-8746) gave plugin major version bump
* [CB-8683](https://issues.apache.org/jira/browse/CB-8683) updated wp specific references of old id to new id
* [CB-8683](https://issues.apache.org/jira/browse/CB-8683) changed plugin-id to pacakge-name
* [CB-8653](https://issues.apache.org/jira/browse/CB-8653) properly updated translated docs to use new id
* [CB-8653](https://issues.apache.org/jira/browse/CB-8653) updated translated docs to use new id
* Use TRAVIS_BUILD_DIR, install paramedic by npm
* [CB-8653](https://issues.apache.org/jira/browse/CB-8653) Updated Readme
* [CB-8659](https://issues.apache.org/jira/browse/CB-8659): ios: 4.0.x Compatibility: Remove use of initWebView method
* [CB-8659](https://issues.apache.org/jira/browse/CB-8659): ios: 4.0.x Compatibility: Remove use of deprecated headers
* [CB-8604](https://issues.apache.org/jira/browse/CB-8604) Pended unsupported test for wp8, updated documentation
* [CB-8561](https://issues.apache.org/jira/browse/CB-8561) Integrate TravisCI
* [CB-8438](https://issues.apache.org/jira/browse/CB-8438) cordova-plugin-contacts documentation translation: cordova-plugin-contacts
* [CB-8538](https://issues.apache.org/jira/browse/CB-8538) Added package.json file
* windows: pended .remove test as it is not supported on windows
* [CB-8395](https://issues.apache.org/jira/browse/CB-8395) marked unsupported tests pending on wp8

### 0.2.16 (Feb 04, 2015)
* [CB-8351](https://issues.apache.org/jira/browse/CB-8351) ios: Stop using (newly) deprecated CordovaLib functions
* [CB-8351](https://issues.apache.org/jira/browse/CB-8351) ios: Use argumentForIndex rather than NSArray extension
* android: Update ContactName support
* Updated the comments for ContactOrganization constructor.

### 0.2.15 (Dec 02, 2014)
* [CB-7131](https://issues.apache.org/jira/browse/CB-7131) Check for profile photo existance
* [CB-7896](https://issues.apache.org/jira/browse/CB-7896) Better way to detect **Windows** and **WindowsPhone8.1**
* [CB-7896](https://issues.apache.org/jira/browse/CB-7896) Pending tests for `Save` and `Find` methods for **Windows** cause they are not supported yet
* [CB-7977](https://issues.apache.org/jira/browse/CB-7977) Mention `deviceready` in plugin docs
* [CB-7772](https://issues.apache.org/jira/browse/CB-7772) - [Contacts] Cancelling `pickContact` should call the error callback, not the success callback
* [CB-7761](https://issues.apache.org/jira/browse/CB-7761) - Misleading text in documentation
* [CB-7762](https://issues.apache.org/jira/browse/CB-7762) - Parameter list is incorrect for `contacts.find`
* [CB-7700](https://issues.apache.org/jira/browse/CB-7700) cordova-plugin-contacts documentation translation: cordova-plugin-contacts

### 0.2.14 (Oct 03, 2014)
* [CB-7373](https://issues.apache.org/jira/browse/CB-7373) Removes unnecessary Error object creation
* [CB-7373](https://issues.apache.org/jira/browse/CB-7373) Adds additional output if method is not supported.
* [CB-7357](https://issues.apache.org/jira/browse/CB-7357) Adds missing 'capability' element to phone's appxmanifest.

### 0.2.13 (Sep 17, 2014)
* [CB-7546](https://issues.apache.org/jira/browse/CB-7546) [Contacts][iOS] pickContact shows exception in the console log
* [CB-6374](https://issues.apache.org/jira/browse/CB-6374) Fix iOS 6 deprecation warnings in Contacts
* [CB-7544](https://issues.apache.org/jira/browse/CB-7544) [Contacts][iOS 8] Contact picker is read-only in iOS 8
* [CB-7523](https://issues.apache.org/jira/browse/CB-7523) Fixing "ContactFieldType" error in the config.xml
* [CB-6724](https://issues.apache.org/jira/browse/CB-6724) Empty may be expected.
* [CB-7249](https://issues.apache.org/jira/browse/CB-7249) cordova-plugin-contacts documentation translation
* Add missing test, skip some specs on wp
* rm old test folder and merged with renamed tests folder
* [CB-7290](https://issues.apache.org/jira/browse/CB-7290) Adds support for universal Windows platform.
* Renamed test dir, added nested plugin.xml
* [CB-7148](https://issues.apache.org/jira/browse/CB-7148) Added manual tests
* Removed js-module for tests from plugin.xml
* Changing cdvtest format to use module exports
* register tests using new style
* convert test to new style
* added documentation for manual tests
* merged changes for test framework plugin

### 0.2.12 (Aug 06, 2014)
* fixes .find method when 'options' param is not passed. Will return all contacts on missing 'options' param
* [FFOS] update ContactsProxy.js
* Removing a stray unicode character
* [CB-6127](https://issues.apache.org/jira/browse/CB-6127) Updated translations for docs
* [CB-5698](https://issues.apache.org/jira/browse/CB-5698) ios: Check to see if photoData exists before using

### 0.2.11 (Jul 2, 2014)
* [CB-6127](https://issues.apache.org/jira/browse/CB-6127) Spanish and French Translations added. Github close #25
* Remove deprecated symbols for iOS < 6
* [CB-6797](https://issues.apache.org/jira/browse/CB-6797) Add license
* [wp8] now pupulates contact photos
* Update license headers format
* Add pickContact functionality to cordova contacts plugin
* [CB-5416](https://issues.apache.org/jira/browse/CB-5416) - Adding support for auto-managing permissions
* [CB-6682](https://issues.apache.org/jira/browse/CB-6682) move windows8 command proxy into it's missing platform tag. This closes #30
* Add ContactError codes to index.md doc (closes #28)
* [CB-6491](https://issues.apache.org/jira/browse/CB-6491) add CONTRIBUTING.md
* Docs typo: navigator.contacts.length -> contacts.length
* [CB-5698](https://issues.apache.org/jira/browse/CB-5698) ios: Check to see if photoData exists before using
* [CB-7003](https://issues.apache.org/jira/browse/CB-7003) android: Make pickContact pick correct contact on Android 4.3 and 4.4.3

### 0.2.10 (Apr 17, 2014)
* [CB-6126](https://issues.apache.org/jira/browse/CB-6126): [BlackBerry10] Update docs quirks section for fields which are supported
* [CB-6212](https://issues.apache.org/jira/browse/CB-6212): [iOS] fix warnings compiled under arm64 64-bit
* [CB-6460](https://issues.apache.org/jira/browse/CB-6460): Update license headers
* Add NOTICE file

### 0.2.9 (Feb 26, 2014)
* [CB-6086](https://issues.apache.org/jira/browse/CB-6086) Fix typo in ffos part of plugin.xml: Camera -> Contacts
* [CB-5994](https://issues.apache.org/jira/browse/CB-5994) Switch Contact ID lookup to use Raw contact id.

### 0.2.8 (Feb 05, 2014)
* [CB-3208](https://issues.apache.org/jira/browse/CB-3208) FFOS docs updated
* [CB-4590](https://issues.apache.org/jira/browse/CB-4590) - chooseContact in CDVContacts crashes app

### 0.2.7 (Jan 02, 2014)
* B-5658 Add doc/index.md for Contacts plugin

### 0.2.6 (Dec 4, 2013)
* Fix bad commit/merge
* [CB-3035](https://issues.apache.org/jira/browse/CB-3035) Fix issue with windows new line char \n\r
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
* [CB-5214](https://issues.apache.org/jira/browse/CB-5214) Make mobile spec tests on WP8 to run w/o user interaction + Sync with cordova-mobile-spec
* [CB-5525](https://issues.apache.org/jira/browse/CB-5525) WP8. Contacts Api fails in case of there is special character in contact field
* fixed ubuntu policy error
* [ubuntu] specify policy_group
* add ubuntu platform
* [CB-3035](https://issues.apache.org/jira/browse/CB-3035) Fix issue with windows new line char \n\r
* 1. Added amazon-fireos platform. 2. Change to use amazon-fireos as the platform if user agent string contains 'cordova-amazon-fireos'.
* [CB-5198](https://issues.apache.org/jira/browse/CB-5198) [BlackBerry10] Update dependencies to point to registry
* handle null filter when fields are specified. ( long standing pull-req from @kevfromireland )

### 0.2.5 (Oct 28, 2013)
* [CB-5128](https://issues.apache.org/jira/browse/CB-5128): added repo + issue tags for contacts
* [CB-5010](https://issues.apache.org/jira/browse/CB-5010) Incremented plugin version on dev branch.

### 0.2.4 (Oct 9, 2013)
* [CB-4950](https://issues.apache.org/jira/browse/CB-4950) Remove the dependence on concrete component android.webkit.WebView.
* [CB-4915](https://issues.apache.org/jira/browse/CB-4915) Incremented plugin version on dev branch.

### 0.2.3 (Sept 25, 2013)
* [CB-4889](https://issues.apache.org/jira/browse/CB-4889) bumping&resetting version
* [BlackBerry10] removed uneeded permission tags in plugin.xml
* [CB-4889](https://issues.apache.org/jira/browse/CB-4889) renaming blackberry10 reference in plugin.xml
* [CB-4888](https://issues.apache.org/jira/browse/CB-4888) renaming org.apache.cordova.core.contacts to org.apache.cordova.contacts
* added contacts api for firefoxos
* Rename CHANGELOG.md -> RELEASENOTES.md
* [CB-4824](https://issues.apache.org/jira/browse/CB-4824) Fix XCode 5 contacts plugin warnings
* [CB-4752](https://issues.apache.org/jira/browse/CB-4752) Incremented plugin version on dev branch.

### 0.2.1 (Sept 5, 2013)
* [CB-4580](https://issues.apache.org/jira/browse/CB-4580) Fixed up duplicate definitions of module id
* [CB-4432](https://issues.apache.org/jira/browse/CB-4432) Copyright notice change

