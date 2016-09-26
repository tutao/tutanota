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
                                              
### 1.4.0 (Nov 18, 2015)
* [CB-10035](https://issues.apache.org/jira/browse/CB-10035) Updated `RELEASENOTES` to be newest to oldest
* [CB-9879](https://issues.apache.org/jira/browse/CB-9879) `getCookie`s can cause unhandled `NullPointerException`
* [CB-6928](https://issues.apache.org/jira/browse/CB-6928) Wrong behaviour transferring cacheable content
* [CB-51](https://issues.apache.org/jira/browse/CB-51) FileTransfer - Support `PUT` Method
* [CB-9906](https://issues.apache.org/jira/browse/CB-9906) cleanup duplicate code, removed 2nd `isWP8` declaration.
* [CB-9950](https://issues.apache.org/jira/browse/CB-9950) Unpend Filetransfer spec.27 on **wp8** as custom headers are now supported
* [CB-9843](https://issues.apache.org/jira/browse/CB-9843) Added **wp8** quirk to test spec 12
* Fixing contribute link.
* [CB-8431](https://issues.apache.org/jira/browse/CB-8431) File Transfer tests crash on **Android Lolipop**
* [CB-9790](https://issues.apache.org/jira/browse/CB-9790) Align `FileUploadOptions` `fileName` and `mimeType` default parameter values to the docs on **iOS**
* [CB-9385](https://issues.apache.org/jira/browse/CB-9385) Return `FILE_NOT_FOUND_ERR` when receiving `404` code on **iOS**
* [CB-9791](https://issues.apache.org/jira/browse/CB-9791) Decreased download and upload tests timeout

### 1.3.0 (Sep 18, 2015)
* Found issue where : is accepted as a valid header, this is obviously wrong
* [CB-9562](https://issues.apache.org/jira/browse/CB-9562) Fixed incorrect headers handling on Android
* Fixing headers so they don't accept non-ASCII
* updated tests to use cordova apache vm
* [CB-9493](https://issues.apache.org/jira/browse/CB-9493) Fix file paths in file-transfer manual tests
* [CB-8816](https://issues.apache.org/jira/browse/CB-8816) Add cdvfile:// support on windows
* [CB-9376](https://issues.apache.org/jira/browse/CB-9376) Fix FileTransfer plugin manual tests issue - 'undefined' in paths
     
### 1.2.1 (Jul 7, 2015)
* [CB-9275](https://issues.apache.org/jira/browse/CB-9275) [WP8] Fix build failure on WP8 by using reflection to detect presence of JSON.NET based serialization        
* Updated code per code review.                                                         
* Updated documentation for browser                                                     
* Added option to allow for passing cookies automatically in the browser 

### 1.2.0 (Jun 17, 2015)
* [CB-9128](https://issues.apache.org/jira/browse/CB-9128) cordova-plugin-file-transfer documentation translation: cordova-plugin-file-transfer
* [CB-6503](https://issues.apache.org/jira/browse/CB-6503): Null pointer check for headers in upload (This closes #27)
* [CB-6503](https://issues.apache.org/jira/browse/CB-6503): Allow payload content-types other than multipart/form-data to be used for upload
* Fix NoSuchMethodException looking up cookies.
* fix npm md issue
* [CB-8951](https://issues.apache.org/jira/browse/CB-8951) (wp8) Handle exceptions in download() and upload() again
* [wp8] Relaxed engine version requirement, using reflection to see if methods are available
* Check for the existence of Json.net assembly to determin how we deserialize our headers.
* relax engine requirement to allow -dev versions
* Remove verbose console log messages
* fix bad commit (mine) for cordova-wp8@4.0.0 engine req
* bump required cordova-wp8 version to 4.0.0
* This closes #80, This closes #12
* fix failing test resulting from overlapping async calls
* [CB-8721](https://issues.apache.org/jira/browse/CB-8721) Fixes incorrect headers and upload params parsing on wp8
* Replace all slashes in windows path

### 1.1.0 (May 06, 2015)
* [CB-8951](https://issues.apache.org/jira/browse/CB-8951) Fixed crash related to headers parsing on **wp8**
* [CB-8933](https://issues.apache.org/jira/browse/CB-8933) Increased download and upload test timeout
* [CB-6313](https://issues.apache.org/jira/browse/CB-6313) **wp8**: Extra boundary in upload
* [CB-8761](https://issues.apache.org/jira/browse/CB-8761) **wp8**: Copy cookies from WebBrowser

### 1.0.0 (Apr 15, 2015)
* [CB-8746](https://issues.apache.org/jira/browse/CB-8746) bumped version of file dependency
* [CB-8746](https://issues.apache.org/jira/browse/CB-8746) gave plugin major version bump
* [CB-8641](https://issues.apache.org/jira/browse/CB-8641) Fixed tests to pass on windows and wp8
* [CB-8583](https://issues.apache.org/jira/browse/CB-8583) Forces download to overwrite existing target file
* [CB-8589](https://issues.apache.org/jira/browse/CB-8589) Fixes upload failure when server's response doesn't contain any data
* [CB-8747](https://issues.apache.org/jira/browse/CB-8747) updated dependency, added peer dependency
* [CB-8683](https://issues.apache.org/jira/browse/CB-8683) changed plugin-id to pacakge-name
* [CB-8653](https://issues.apache.org/jira/browse/CB-8653) properly updated translated docs to use new id
* [CB-8653](https://issues.apache.org/jira/browse/CB-8653) updated translated docs to use new id
* Use TRAVIS_BUILD_DIR, install paramedic by npm
* [CB-8653](https://issues.apache.org/jira/browse/CB-8653) Updated Readme
* [CB-8654](https://issues.apache.org/jira/browse/CB-8654) Note WP8 download requests caching in docs
* [CB-8590](https://issues.apache.org/jira/browse/CB-8590) (Windows) Fixed download.onprogress.lengthComputable
* [CB-8566](https://issues.apache.org/jira/browse/CB-8566) Integrate TravisCI
* [CB-8438](https://issues.apache.org/jira/browse/CB-8438) cordova-plugin-file-transfer documentation translation: cordova-plugin-file-transfer
* [CB-8538](https://issues.apache.org/jira/browse/CB-8538) Added package.json file
* [CB-8495](https://issues.apache.org/jira/browse/CB-8495) Fixed wp8 and wp81 test failures
* [CB-7957](https://issues.apache.org/jira/browse/CB-7957) Adds support for `browser` platform
* [CB-8429](https://issues.apache.org/jira/browse/CB-8429) Updated version and RELEASENOTES.md for release 0.5.0 (take 2)
* Fixes typo, introduced in https://github.com/apache/cordova-plugin-file-transfer/commit/bc43b46
* [CB-8407](https://issues.apache.org/jira/browse/CB-8407) Use File proxy to construct valid FileEntry for download success callback
* [CB-8407](https://issues.apache.org/jira/browse/CB-8407) Removes excess path to native path conversion in download method
* [CB-8429](https://issues.apache.org/jira/browse/CB-8429) Updated version and RELEASENOTES.md for release 0.5.0
* [CB-7957](https://issues.apache.org/jira/browse/CB-7957) Adds support for `browser` platform
* [CB-8095](https://issues.apache.org/jira/browse/CB-8095) Fixes JSHint and formatting issues
* [CB-8095](https://issues.apache.org/jira/browse/CB-8095) Updates tests and documentation
* [CB-8095](https://issues.apache.org/jira/browse/CB-8095) Rewrite upload method to support progress events properly
* android: Fix error reporting for unknown uri type on sourceUri instead of targetUri

### 0.5.0 (Feb 04, 2015)
* [CB-8407](https://issues.apache.org/jira/browse/CB-8407) windows: Fix download of `ms-appdata:///` URIs
* [CB-8095](https://issues.apache.org/jira/browse/CB-8095) windows: Rewrite upload method to support progress events properly
* [CB-5059](https://issues.apache.org/jira/browse/CB-5059) android: Add a CookieManager abstraction for pluggable webviews
* ios: Fix compile warning about implicity int conversion
* [CB-8351](https://issues.apache.org/jira/browse/CB-8351) ios: Use argumentForIndex rather than NSArray extension
* [CB-8351](https://issues.apache.org/jira/browse/CB-8351) ios: Use a local copy of DLog macro rather than CordovaLib version
* [CB-8296](https://issues.apache.org/jira/browse/CB-8296) ios: Fix crash when upload fails and file is not yet created (close #57)
* Document "body" property on FileTransferError
* [CB-7912](https://issues.apache.org/jira/browse/CB-7912) ios, android: Update to work with whitelist plugins in Cordova 4.x
* Error callback should always be called with the FileTransferError object, and not just the code
* windows: alias appData to Windows.Storage.ApplicationData.current
* [CB-8093](https://issues.apache.org/jira/browse/CB-8093) Fixes incorrect FileTransferError returned in case of download failure

### 0.4.8 (Dec 02, 2014)
* [CB-8021](https://issues.apache.org/jira/browse/CB-8021) - adds documentation for `httpMethod` to `doc/index.md`. However, translations still need to be addressed.
* [CB-7223](https://issues.apache.org/jira/browse/CB-7223) spec.27 marked pending for **wp8**
* [CB-6900](https://issues.apache.org/jira/browse/CB-6900) fixed `spec.7` for **wp8**
* [CB-7944](https://issues.apache.org/jira/browse/CB-7944) Pended unsupported auto tests for *Windows*
* [CB-7977](https://issues.apache.org/jira/browse/CB-7977) Mention `deviceready` in plugin docs
* [CB-7700](https://issues.apache.org/jira/browse/CB-7700) cordova-plugin-file-transfer documentation translation: cordova-plugin-file-transfer

### 0.4.7 (Oct 03, 2014)
* Construct proper FileEntry with nativeURL property set
* [CB-7532](https://issues.apache.org/jira/browse/CB-7532) Handle non-existent download dirs properly
* [CB-7529](https://issues.apache.org/jira/browse/CB-7529) Adds support for 'ms-appdata' URIs for windows

### 0.4.6 (Sep 17, 2014)
* [CB-7471](https://issues.apache.org/jira/browse/CB-7471) cordova-plugin-file-transfer documentation translation
* [CB-7249](https://issues.apache.org/jira/browse/CB-7249) cordova-plugin-file-transfer documentation translation
* [CB-7423](https://issues.apache.org/jira/browse/CB-7423) fix spec28,29 lastProgressEvent not visible to afterEach function
* Amazon related changes.
* Remove dupe file windows+windows8 both use the same one
* [CB-7316](https://issues.apache.org/jira/browse/CB-7316) Updates docs with actual information.
* [CB-7316](https://issues.apache.org/jira/browse/CB-7316) Adds support for Windows platform, moves \*Proxy files to proper directory.
* [CB-7316](https://issues.apache.org/jira/browse/CB-7316) Improves current specs compatibility:
* added documentation for new test
* [CB-6466](https://issues.apache.org/jira/browse/CB-6466) Fix failing test due to recent url change
* [CB-6466](https://issues.apache.org/jira/browse/CB-6466) created mobile-spec test
* Renamed test dir, added nested plugin.xml and test
* Fixed failing spec.19 on wp8
* added documentation to manual tests
* [CB-6961](https://issues.apache.org/jira/browse/CB-6961) port file-transfer tests to framework

### 0.4.5 (Aug 06, 2014)
* Upload parameters out of order
* **FirefoxOS** initial implementation
* [CB-6781](https://issues.apache.org/jira/browse/CB-6781): Expose FileTransferError.exception to application
* [CB-6928](https://issues.apache.org/jira/browse/CB-6928): Add new error code to documentation
* [CB-6928](https://issues.apache.org/jira/browse/CB-6928): Handle 304 status code
* [CB-6928](https://issues.apache.org/jira/browse/CB-6928): Open output stream only if it's necessary.
* [BlackBerry10] Minor doc correction
* [CB-6127](https://issues.apache.org/jira/browse/CB-6127) Updated translations for docs
* [Windows8] upload uses the provided fileName or the actual fileName
* [CB-2420](https://issues.apache.org/jira/browse/CB-2420) [Windows8] honor fileKey and param options. This closes #15
* [CB-6781](https://issues.apache.org/jira/browse/CB-6781): Update new docs to match AlexNennker's changes in PR30
* [CB-6781](https://issues.apache.org/jira/browse/CB-6781): Continue previous commit with one new instance (This closes #30)
* [CB-6781](https://issues.apache.org/jira/browse/CB-6781): add the exception text to the error object
* [CB-6890](https://issues.apache.org/jira/browse/CB-6890): Fix pluginManager access for 4.0.x branch

### 0.4.4 (Jun 05, 2014)
* [CB-6127](https://issues.apache.org/jira/browse/CB-6127) Spanish and French Translations added. Github close #21
* ubuntu: support 'cdvfile' URI
* [CB-6802](https://issues.apache.org/jira/browse/CB-6802) Add license
* Upload progress now works also for second file
* [CB-6706](https://issues.apache.org/jira/browse/CB-6706): Relax dependency on file plugin
* [CB-3440](https://issues.apache.org/jira/browse/CB-3440) [BlackBerry10] Update implementation to use modules from file plugin
* [CB-6378](https://issues.apache.org/jira/browse/CB-6378) Use connection.disconnect() instead of stream.close() for thread-safety
* [CB-6491](https://issues.apache.org/jira/browse/CB-6491) add CONTRIBUTING.md
* [CB-6466](https://issues.apache.org/jira/browse/CB-6466) Auto-create directories in download
* [CB-6494](https://issues.apache.org/jira/browse/CB-6494) android: Fix upload of KitKat content URIs
* Upleveled from android port with following commits: 3c1ff16 Andrew Grieve - [CB-5762](https://issues.apache.org/jira/browse/CB-5762) android: Fix lengthComputable set wrong for gzip downloads 8374b3d Colin Mahoney - [CB-5631](https://issues.apache.org/jira/browse/CB-5631) Removed SimpleTrackingInputStream.read(byte[] buffer) 6f91ac3 Bas Bosman - [CB-4907](https://issues.apache.org/jira/browse/CB-4907) Close stream when we're finished with it 651460f Christoph Neumann - [CB-6000](https://issues.apache.org/jira/browse/CB-6000) Nginx rejects Content-Type without a space before "boundary". 35f80e4 Ian Clelland - [CB-6050](https://issues.apache.org/jira/browse/CB-6050): Use instance method on actual file plugin object to get FileEntry to return on download
* [CB-5980](https://issues.apache.org/jira/browse/CB-5980) Updated version and RELEASENOTES.md for release 0.4.1

### 0.4.3 (Apr 17, 2014)
* [CB-6422](https://issues.apache.org/jira/browse/CB-6422) [windows8] use cordova/exec/proxy
* iOS: Fix error where files were not removed on abort
* [CB-5175](https://issues.apache.org/jira/browse/CB-5175): [ios] CDVFileTransfer asynchronous download (Fixes #24)
* [ios] Cast id references to NSURL to avoid compiler warnings (Fixes: apache/cordova-plugin-file-transfer#18)
* [CB-6212](https://issues.apache.org/jira/browse/CB-6212): [iOS] fix warnings compiled under arm64 64-bit
* [CB-5762](https://issues.apache.org/jira/browse/CB-5762): [FireOS] android: Fix lengthComputable set wrong for gzip downloads
* [CB-5631](https://issues.apache.org/jira/browse/CB-5631): [FireOS] Removed SimpleTrackingInputStream.read(byte[] buffer)
* [CB-4907](https://issues.apache.org/jira/browse/CB-4907): [FireOS] Close stream when we're finished with it
* [CB-6000](https://issues.apache.org/jira/browse/CB-6000): [FireOS] Nginx rejects Content-Type without a space before "boundary".
* [CB-6050](https://issues.apache.org/jira/browse/CB-6050): [FireOS] Use instance method on actual file plugin object to get FileEntry to return on download
* [CB-6460](https://issues.apache.org/jira/browse/CB-6460): Update license headers

### 0.4.2 (Feb 28, 2014)
* [CB-6106](https://issues.apache.org/jira/browse/CB-6106) Ensure that nativeURL is used by file transfer download
* iOS: Fix default value for trustAllHosts on iOS (YES->NO)
* [CB-6059](https://issues.apache.org/jira/browse/CB-6059) iOS: Stop FileTransfer.download doing IO on the UI thread.
* [CB-5588](https://issues.apache.org/jira/browse/CB-5588) iOS: Add response headers to upload result
* [CB-2190](https://issues.apache.org/jira/browse/CB-2190) iOS: Make backgroundTaskId apply to downloads as well. Move backgroundTaskId to the delegate.
* [CB-6050](https://issues.apache.org/jira/browse/CB-6050) Android: Use instance method on actual file plugin object to get FileEntry to return on download
* [CB-6000](https://issues.apache.org/jira/browse/CB-6000) Android: Nginx rejects Content-Type without a space before "boundary".
* [CB-4907](https://issues.apache.org/jira/browse/CB-4907) Android: Close stream when we're finished with it
* [CB-6022](https://issues.apache.org/jira/browse/CB-6022) Add backwards-compatibility notes to doc

### 0.4.1 (Feb 05, 2014)
* [CB-5365](https://issues.apache.org/jira/browse/CB-5365) Remove unused exception var to prevent warnings?
* [CB-2421](https://issues.apache.org/jira/browse/CB-2421) explicitly write the bytesSent,responseCode,result to the FileUploadResult pending release of cordova-plugin-file dependency, added some sanity checks for callbacks
* iOS: Update for new file plugin api
* [CB-5631](https://issues.apache.org/jira/browse/CB-5631) Removed SimpleTrackingInputStream.read(byte[] buffer)
* [CB-5762](https://issues.apache.org/jira/browse/CB-5762) android: Fix lengthComputable set wrong for gzip downloads
* [CB-4899](https://issues.apache.org/jira/browse/CB-4899) [BlackBerry10] Improve binary file transfer download
* Delete stale test/ directory
* [CB-5722](https://issues.apache.org/jira/browse/CB-5722) [BlackBerry10] Update upload function to use native file object
* [CB-5658](https://issues.apache.org/jira/browse/CB-5658) Delete stale snapshot of plugin docs
* Remove @1 designation from file plugin dependency until pushed to npm
* [CB-5466](https://issues.apache.org/jira/browse/CB-5466): Update to work with filesystem URLs

### 0.4.0 (Dec 4, 2013)
* [CB-5466](https://issues.apache.org/jira/browse/CB-5466): Partial revert; we're not ready yet for FS urls
* add ubuntu platform
* [CB-5466](https://issues.apache.org/jira/browse/CB-5466): Minor version bump
* [CB-5466](https://issues.apache.org/jira/browse/CB-5466): Update FileTransfer plugin to accept filesystem urls
* Added amazon-fireos platform. Change to use amazon-fireos as the platform if the user agen string contains 'cordova-amazon-fireos'

### 0.3.4 (Oct 28, 2013)
* [CB-5128](https://issues.apache.org/jira/browse/CB-5128): added repo + issue tag to plugin.xml for file transfer plugin
* [CB-5010](https://issues.apache.org/jira/browse/CB-5010) Incremented plugin version on dev branch.

### 0.3.3 (Oct 9, 2013)
* removed un-needed undef check
* Fix missing headers in Windows 8 upload proxy
* Fix missing headers in Windows 8 Proxy
* Fix Windows 8 HTMLAnchorElement return host:80 which force Basic Auth Header to replace options Auth Header
* [CB-4915](https://issues.apache.org/jira/browse/CB-4915) Incremented plugin version on dev branch.

### 0.3.2 (Sept 25, 2013)
* [CB-4889](https://issues.apache.org/jira/browse/CB-4889) bumping&resetting version
* [windows8] commandProxy was moved
* [CB-4889](https://issues.apache.org/jira/browse/CB-4889) updating core references
* [CB-4889](https://issues.apache.org/jira/browse/CB-4889) renaming org.apache.cordova.core.file-transfer to org.apache.cordova.file-transfer and updating dependency
* Rename CHANGELOG.md -> RELEASENOTES.md
