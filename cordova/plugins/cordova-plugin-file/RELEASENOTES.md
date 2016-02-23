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

### 4.1.1 (Feb 09, 2016)
* Edit package.json license to match SPDX id
* [CB-10419](https://issues.apache.org/jira/browse/CB-10419) cordova-plugin-file 4.0.0 error with browserify workflow

### 4.1.0 (Jan 15, 2016)
* added `.ratignore` file
* CB-10319 **android** Adding reflective helper methods for permission requests
* CB-10023 Fix `proxy not found error` on Chrome.
* CB-8863 **ios** Fix block usage of self

### 4.0.0 (Nov 18, 2015)
* [CB-10035](https://issues.apache.org/jira/browse/CB-10035) Updated `RELEASENOTES` to be newest to oldest
* [CB-8497](https://issues.apache.org/jira/browse/CB-8497) Fix handling of file paths with `#` character
* Do not inject default `AndroidPersistentFileLocation` into `config.xml`
* [CB-9891](https://issues.apache.org/jira/browse/CB-9891): Fix permission errors due to `URI encoding` inconsistency on **Android**
* Fixed `NullPointer Exception` in **Android 5** and above due to invalid column name on cursor
* Fix default persistent file location
* fix `applicationDirectory` to use `ms-appx:///`
* Add **Windows** paths to `cordova.file` object
* [CB-9851](https://issues.apache.org/jira/browse/CB-9851) Document `cdvfile` protocol quirk - using `cdvfile://` in the `DOM` is not supported on **Windows**
* [CB-9752](https://issues.apache.org/jira/browse/CB-9752) `getDirectory` fails on valid directory with assets filesystem
* [CB-7253](https://issues.apache.org/jira/browse/CB-7253) `requestFileSystem` fails when no external storage is present
* Adding permissions for **Marshmallow**. Now supports **Anrdoid 6.0**
* Fixing contribute link.
* always use setters to fix memory issues without `ARC` for **iOS**
* [CB-9331](https://issues.apache.org/jira/browse/CB-9331) `getFreeDiskSpace` **iOS**.
* override `resolveLocalFileSystemURL` by `webkitResolveLocalFileSystemURL` for **browser** platform add `.project` into git ignore list
* Fail with `FileError.ENCODING_ERR` on encoding exception.
* [CB-9544](https://issues.apache.org/jira/browse/CB-9544) Add file plugin for **OSX**
* [CB-9539](https://issues.apache.org/jira/browse/CB-9539) Fixed test failure on **Android** emulator
* Added docs on `CSP` rules needed for using `cdvfile` in DOM src. This closes #120
* Added `cdvfile` protocol purpose description and examples

### 3.0.0 (Aug 18, 2015)
* Make Android default persistent file location internal
* Fixed issue with file paths not existing when using browserify
* [CB-9251](https://issues.apache.org/jira/browse/CB-9251): Changed from Intents to Preferences object as per the issue
* [CB-9215](https://issues.apache.org/jira/browse/CB-9215) Add cordova-plugin-file manual test for windows platform

### 2.1.0 (Jun 17, 2015)
* added missing license header
* [CB-9128](https://issues.apache.org/jira/browse/CB-9128) cordova-plugin-file documentation translation: cordova-plugin-file
* fix npm md
* [CB-8844](https://issues.apache.org/jira/browse/CB-8844) Increased timeout for asset tests
* Updated resolveFileSystem.js so it can be parsed by uglifyJS
* [CB-8860](https://issues.apache.org/jira/browse/CB-8860) cordova-plugin-file documentation translation: cordova-plugin-file
* [CB-8792](https://issues.apache.org/jira/browse/CB-8792) Fixes reading of json files using readAsText

### 2.0.0 (Apr 15, 2015)
* [CB-8849](https://issues.apache.org/jira/browse/CB-8849) Fixed ReadAsArrayBuffer to return ArrayBuffer and not Array on WP8
* [CB-8819](https://issues.apache.org/jira/browse/CB-8819) Fixed FileReader's readAsBinaryString on wp8
* [CB-8746](https://issues.apache.org/jira/browse/CB-8746) gave plugin major version bump
* [CB-8683](https://issues.apache.org/jira/browse/CB-8683) android: Fix broken unit tests from plugin rename
* [CB-8683](https://issues.apache.org/jira/browse/CB-8683) changed plugin-id to pacakge-name
* [CB-8653](https://issues.apache.org/jira/browse/CB-8653) properly updated translated docs to use new id
* [CB-8653](https://issues.apache.org/jira/browse/CB-8653) updated translated docs to use new id
* Use TRAVIS_BUILD_DIR, install paramedic by npm
* docs: added Windows to supported platforms
* [CB-8699](https://issues.apache.org/jira/browse/CB-8699) [CB-6428](https://issues.apache.org/jira/browse/CB-6428) Fix uncompressed assets being copied as zero length files
* [CB-6428](https://issues.apache.org/jira/browse/CB-6428) android: Fix assets FileEntry having size of -1
* android: Move URLforFullPath into base class (and rename to localUrlforFullPath)
* [CB-6428](https://issues.apache.org/jira/browse/CB-6428) Mention build-extras.gradle in README
* [CB-7109](https://issues.apache.org/jira/browse/CB-7109) android: Parse arguments off of the main thread (close #97)
* [CB-8695](https://issues.apache.org/jira/browse/CB-8695) ios: Fix `blob.slice()` for `asset-library` URLs (close #105)
* Tweak build-extras.gradle to just read/write to main `assets/` instead of `build/`
* [CB-8689](https://issues.apache.org/jira/browse/CB-8689) Fix NPE in makeEntryForNativeUri (was affecting file-transfer)
* [CB-8675](https://issues.apache.org/jira/browse/CB-8675) Revert "CB-8351 ios: Use base64EncodedStringWithOptions instead of CordovaLib's class extension"
* [CB-8653](https://issues.apache.org/jira/browse/CB-8653) Updated Readme
* [CB-8659](https://issues.apache.org/jira/browse/CB-8659): ios: 4.0.x Compatibility: Remove use of initWebView method
* Add a cache to speed up AssetFilesystem directory listings
* [CB-8663](https://issues.apache.org/jira/browse/CB-8663) android: Don't notify MediaScanner of private files
* Don't log stacktrace for normal exceptions (e.g. file not found)
* android: Don't use LimitedInputStream when reading entire file (optimization)
* [CB-6428](https://issues.apache.org/jira/browse/CB-6428) android: Add support for directory copies from assets -> filesystem
* android: Add `listChildren()`: Java-consumable version of `readEntriesAtLocalURL()`
* [CB-6428](https://issues.apache.org/jira/browse/CB-6428) android: Add support for file:///android_asset URLs
* [CB-8642](https://issues.apache.org/jira/browse/CB-8642) android: Fix content URIs not working with resolve / copy
* Tweak tests to fail if deleteEntry fails (rather than time out)
* android: Ensure LocalFilesystemURL can only be created with "cdvfile" URLs
* android: Move CordovaResourceApi into Filesystem base class
* android: Use `CordovaResourceApi.mapUriToFile()` rather than own custom logic in ContentFilesystem
* android: Use Uri.parse rather than manual parsing in resolveLocalFileSystemURI
* Tweak test case that failed twice on error rather than just once
* android: Delete invalid JavaDoc (lint errors)
* android: Use CordovaResourceApi rather than FileHelper
* [CB-8032](https://issues.apache.org/jira/browse/CB-8032) - File Plugin - Add nativeURL external method support for CDVFileSystem->makeEntryForPath:isDirectory: (closes #96)
* [CB-8567](https://issues.apache.org/jira/browse/CB-8567) Integrate TravisCI
* [CB-8438](https://issues.apache.org/jira/browse/CB-8438) cordova-plugin-file documentation translation: cordova-plugin-file
* [CB-8538](https://issues.apache.org/jira/browse/CB-8538) Added package.json file
* [CB-7956](https://issues.apache.org/jira/browse/CB-7956) Add cordova-plugin-file support for browser platform
* [CB-8423](https://issues.apache.org/jira/browse/CB-8423) Corrected usage of done() in async tests
* [CB-8459](https://issues.apache.org/jira/browse/CB-8459) Fixes spec 111 failure due to incorrect relative paths handling
* Code cleanup, whitespace
* Added nativeURL property to FileEntry, implemented readAsArrayBuffer and readAsBinaryString

### 1.3.3 (Feb 04, 2015)
* [CB-7927](https://issues.apache.org/jira/browse/CB-7927) Encoding data to bytes instead of chars when writing a file.
* ios: Fix compile warning about implicit int conversion
* [CB-8351](https://issues.apache.org/jira/browse/CB-8351) ios: Use base64EncodedStringWithOptions instead of CordovaLib's class extension
* [CB-8351](https://issues.apache.org/jira/browse/CB-8351) ios: Use argumentForIndex rather than NSArray extension
* [CB-8351](https://issues.apache.org/jira/browse/CB-8351) ios: Use a local copy of valueForKeyIsNumber rather than CordovaLib's version
* windows: Handle url's containing absolute windows path starting with drive letter and colon (encoded as %3A) through root FS
* windows: Rework to use normal url form
* android: refactor: Make Filesystem base class store its own name, rootUri, and rootEntry
* android: Simplify code a bit by making makeEntryForPath not throw JSONException
* [CB-6431](https://issues.apache.org/jira/browse/CB-6431) android: Fix plugin breaking content: URLs
* [CB-7375](https://issues.apache.org/jira/browse/CB-7375) Never create new FileSystem instances (except on windows since they don't implement requestAllFileSystems())

### 1.3.2 (Dec 02, 2014)
* Gets rid of thread block error in File plugin
* [CB-7917](https://issues.apache.org/jira/browse/CB-7917) Made tests file.spec.114 - 116 pass for **Windows** platform
* [CB-7977](https://issues.apache.org/jira/browse/CB-7977) Mention `deviceready` in plugin docs
* [CB-7602](https://issues.apache.org/jira/browse/CB-7602): Fix `isCopyOnItself` logic
* [CB-7700](https://issues.apache.org/jira/browse/CB-7700) cordova-plugin-file documentation translation: cordova-plugin-file
* Use one proxy for both **Windows** and **Windows8** platforms
* [CB-6994](https://issues.apache.org/jira/browse/CB-6994) Fixes result, returned by proxy's write method
* [fxos] update `__format__` to match `pathsPrefix`
* [CB-6994](https://issues.apache.org/jira/browse/CB-6994) Improves merged code to be able to write a File
* Optimize `FileProxy` for **Windows** platforms
* Synchronize changes with **Windows** platform
* Fix function write for big files on **Windows 8**
* Write file in background
* [CB-7487](https://issues.apache.org/jira/browse/CB-7487) **Android** Broadcast file write This allows MTP USB shares to show the file immediately without reboot/manual refresh using 3rd party app.
* [CB-7700](https://issues.apache.org/jira/browse/CB-7700) cordova-plugin-file documentation translation: cordova-plugin-file
* [CB-7571](https://issues.apache.org/jira/browse/CB-7571) Bump version of nested plugin to match parent plugin

### 1.3.1 (Sep 17, 2014)
* [CB-7471](https://issues.apache.org/jira/browse/CB-7471) cordova-plugin-file documentation translation
* [CB-7272](https://issues.apache.org/jira/browse/CB-7272) Replace confusing "r/o" abbreviation with just "r"
* [CB-7423](https://issues.apache.org/jira/browse/CB-7423) encode path before attempting to resolve
* [CB-7375](https://issues.apache.org/jira/browse/CB-7375) Fix the filesystem name in resolveLocalFileSystemUri
* [CB-7445](https://issues.apache.org/jira/browse/CB-7445) [BlackBerry10] resolveLocalFileSystemURI - change DEFAULT_SIZE to MAX_SIZE
* [CB-7458](https://issues.apache.org/jira/browse/CB-7458) [BlackBerry10] resolveLocalFileSystemURL - add filesystem property
* [CB-7445](https://issues.apache.org/jira/browse/CB-7445) [BlackBerry10] Add default file system size to prevent quota exceeded error on initial install
* [CB-7431](https://issues.apache.org/jira/browse/CB-7431) Avoid calling done() twice in file.spec.109 test
* [CB-7413](https://issues.apache.org/jira/browse/CB-7413) Adds support of 'ms-appdata://' URIs
* [CB-7422](https://issues.apache.org/jira/browse/CB-7422) [File Tests] Use proper fileSystem to create fullPath
* [CB-7375](https://issues.apache.org/jira/browse/CB-7375) [Entry] get proper filesystem in Entry
* Amazon related changes.
* [CB-7375](https://issues.apache.org/jira/browse/CB-7375) Remove leading slash statement from condition
* Refactored much of the logic in FileMetadata constructor.  Directory.size will return 0
* [CB-7419](https://issues.apache.org/jira/browse/CB-7419) [WP8] Added support to get metada from dir
* [CB-7418](https://issues.apache.org/jira/browse/CB-7418) [DirectoryEntry] Added fullPath variable as part of condition
* [CB-7417](https://issues.apache.org/jira/browse/CB-7417) [File tests] added proper matcher to compare fullPath property
* [CB-7375](https://issues.apache.org/jira/browse/CB-7375) Partial revert to resolve WP8 failures
* Overwrite existing file on getFile when create is true
* [CB-7375](https://issues.apache.org/jira/browse/CB-7375) [CB-6148](https://issues.apache.org/jira/browse/CB-6148): Ensure that return values from copy and move operations reference the correct filesystem
* [CB-6724](https://issues.apache.org/jira/browse/CB-6724) changed style detail on documentation
* Added new js files to amazon-fireos platform.
* Adds Windows platform
* Fixes multiple mobilespec tests errors
* Removed test/tests.js module from main plugin.xml
* [CB-7094](https://issues.apache.org/jira/browse/CB-7094) renamed folder to tests + added nested plugin.xml
* added documentation for manual tests
* [CB-6923](https://issues.apache.org/jira/browse/CB-6923) Adding support to handle relative paths
* Style improvements on Manual tests
* [CB-7094](https://issues.apache.org/jira/browse/CB-7094) Ported File manual tests

### 1.3.0 (Aug 06, 2014)
* **FFOS** Remove unsupported paths from requestAllPaths
* **FFOS** Support for resolve URI, request all paths and local app directory.
* [CB-4263](https://issues.apache.org/jira/browse/CB-4263) set ready state to done before onload
* [CB-7167](https://issues.apache.org/jira/browse/CB-7167) [BlackBerry10] copyTo - return wrapped entry rather than native
* [CB-7167](https://issues.apache.org/jira/browse/CB-7167) [BlackBerry10] Add directory support to getFileMetadata
* [CB-7167](https://issues.apache.org/jira/browse/CB-7167) [BlackBerry10] Fix tests detection of blob support (window.Blob is BlobConstructor object)
* [CB-7161](https://issues.apache.org/jira/browse/CB-7161) [BlackBerry10] Add file system directory paths
* [CB-7093](https://issues.apache.org/jira/browse/CB-7093) Create separate plugin.xml for new-style tests
* [CB-7057](https://issues.apache.org/jira/browse/CB-7057) Docs update: elaborate on what directories are for
* [CB-7093](https://issues.apache.org/jira/browse/CB-7093): Undo the effects of an old bad S&R command
* [CB-7093](https://issues.apache.org/jira/browse/CB-7093): Remove a bunch of unneeded log messages
* [CB-7093](https://issues.apache.org/jira/browse/CB-7093): Add JS module to plugin.xml file for auto-tests
* [CB-7093](https://issues.apache.org/jira/browse/CB-7093) Ported automated file tests
* **WINDOWS** remove extra function closure, not    needed
* **WINDOWS** remove check for undefined fail(), it is defined by the proxy and always exists
* **WINDOWS** re-apply readAsBinaryString and readAsArrayBuffer
* **WINDOWS** Moved similar calls to be the same calls, aliased long namespaced functions
* [CB-6127](https://issues.apache.org/jira/browse/CB-6127) Updated translations for docs.
* [CB-6571](https://issues.apache.org/jira/browse/CB-6571) Fix getParentForLocalURL to work correctly with directories with trailing '/' (This closes #58)
* UTTypeCopyPreferredTagWithClass returns nil mimetype for css when there is no network
* updated spec links in docs ( en only )
* [CB-6571](https://issues.apache.org/jira/browse/CB-6571) add trailing space it is missing in DirectoryEnty constructor.
* [CB-6980](https://issues.apache.org/jira/browse/CB-6980) Fixing filesystem:null property in Entry
* Add win8 support for readAsBinaryString and readAsArrayBuffer
* [FFOS] Update FileProxy.js
* [CB-6940](https://issues.apache.org/jira/browse/CB-6940): Fixing up commit from dzeims
* [CB-6940](https://issues.apache.org/jira/browse/CB-6940): Android: cleanup try/catch exception handling
* [CB-6940](https://issues.apache.org/jira/browse/CB-6940): `context.getExternal*` methods return null if sdcard isn't in mounted state, causing exceptions that prevent startup from reaching readystate
* Fix mis-handling of filesystem reference in Entry.moveTo ('this' used in closure).
* [CB-6902](https://issues.apache.org/jira/browse/CB-6902): Use File.lastModified rather than .lastModifiedDate
* [CB-6922](https://issues.apache.org/jira/browse/CB-6922): Remove unused getMetadata native code
* [CB-6922](https://issues.apache.org/jira/browse/CB-6922): Use getFileMetadata consistently to get metadata
* changed fullPath to self.rootDocsPath
* [CB-6890](https://issues.apache.org/jira/browse/CB-6890): Fix pluginManager access for 4.0.x branch

### 1.2.1
* [CB-6922](https://issues.apache.org/jira/browse/CB-6922) Fix inconsistent handling of lastModifiedDate and modificationTime
* [CB-285](https://issues.apache.org/jira/browse/CB-285): Document filesystem root properties

### 1.2.0 (Jun 05, 2014)
* [CB-6127](https://issues.apache.org/jira/browse/CB-6127) Spanish and French Translations added. Github close #31
* updated this reference to window
* Add missing semicolon (copy & paste error)
* Fix compiler warning about symbol in interface not matching implementation
* Fix sorting order in supported platforms
* ubuntu: increase quota value
* ubuntu: Change FS URL scheme to 'cdvfile'
* ubuntu: Return size with Entry.getMetadata() method
* [CB-6803](https://issues.apache.org/jira/browse/CB-6803) Add license
* Initial implementation for Firefox OS
* Small wording tweaks
* Fixed toURL() toInternalURL() information in the doku
* ios: Don't fail a write of zero-length payload.
* [CB-285](https://issues.apache.org/jira/browse/CB-285) Docs for cordova.file.\*Directory properties
* [CB-285](https://issues.apache.org/jira/browse/CB-285) Add cordova.file.\*Directory properties for iOS & Android
* [CB-3440](https://issues.apache.org/jira/browse/CB-3440) [BlackBerry10] Proxy based implementation
* Fix typo in docs "app-bundle" -> "bundle"
* [CB-6583](https://issues.apache.org/jira/browse/CB-6583) ios: Fix failing to create entry when space in parent path
* [CB-6571](https://issues.apache.org/jira/browse/CB-6571) android: Make DirectoryEntry.toURL() have a trailing /
* [CB-6491](https://issues.apache.org/jira/browse/CB-6491) add CONTRIBUTING.md
* [CB-6525](https://issues.apache.org/jira/browse/CB-6525) android, ios: Allow file: URLs in all APIs. Fixes FileTransfer.download not being called.
* fix the Windows 8  implementation of the getFile method
* Update File.js for typo: lastModifiedData --> lastModifiedDate (closes #38)
* Add error codes.
* [CB-5980](https://issues.apache.org/jira/browse/CB-5980) Updated version and RELEASENOTES.md for release 1.0.0
* Add NOTICE file
* [CB-6114](https://issues.apache.org/jira/browse/CB-6114) Updated version and RELEASENOTES.md for release 1.0.1
* [CB-5980](https://issues.apache.org/jira/browse/CB-5980) Updated version and RELEASENOTES.md for release 1.0.0

### 1.1.0 (Apr 17, 2014)
* [CB-4965](https://issues.apache.org/jira/browse/CB-4965): Remove tests from file plugin
* Android: Allow file:/ URLs
* [CB-6422](https://issues.apache.org/jira/browse/CB-6422): [windows8] use cordova/exec/proxy
* [CB-6249](https://issues.apache.org/jira/browse/CB-6249): [android] Opportunistically resolve content urls to file
* [CB-6394](https://issues.apache.org/jira/browse/CB-6394): [ios, android] Add extra filesystem roots
* [CB-6394](https://issues.apache.org/jira/browse/CB-6394): [ios, android] Fix file resolution for the device root case
* [CB-6394](https://issues.apache.org/jira/browse/CB-6394): [ios] Return ENCODING_ERR when fs name is not valid
* [CB-6393](https://issues.apache.org/jira/browse/CB-6393): Change behaviour of toURL and toNativeURL
* ios: Style: plugin initialization
* ios: Fix handling of file URLs with encoded spaces
* Always use Android's recommended temp file location for temporary file system
* [CB-6352](https://issues.apache.org/jira/browse/CB-6352): Allow FileSystem objects to be serialized to JSON
* [CB-5959](https://issues.apache.org/jira/browse/CB-5959): size is explicitly 0 if not set, file.spec.46&47 are testing the type of size
* [CB-6242](https://issues.apache.org/jira/browse/CB-6242): [BlackBerry10] Add deprecated version of resolveLocalFileSystemURI
* [CB-6242](https://issues.apache.org/jira/browse/CB-6242): [BlackBerry10] add file:/// prefix for toURI / toURL
* [CB-6242](https://issues.apache.org/jira/browse/CB-6242): [BlackBerry10] Polyfill window.requestAnimationFrame for OS < 10.2
* [CB-6242](https://issues.apache.org/jira/browse/CB-6242): [BlackBerry10] Override window.resolveLocalFileSystemURL
* [CB-6212](https://issues.apache.org/jira/browse/CB-6212): [iOS] fix warnings compiled under arm64 64-bit
* ios: Don't cache responses from CDVFile's URLProtocol
* [CB-6199](https://issues.apache.org/jira/browse/CB-6199): [iOS] Fix toNativeURL() not escaping characters properly
* [CB-6148](https://issues.apache.org/jira/browse/CB-6148): Fix cross-filesystem copy and move
* fixed setMetadata() to use the formatted fullPath
* corrected typo which leads to a "comma expression"
* [CB-4952](https://issues.apache.org/jira/browse/CB-4952): ios: Resolve symlinks in file:// URLs
* Add docs about the extraFileSystems preference
* [CB-6460](https://issues.apache.org/jira/browse/CB-6460): Update license headers

### 1.0.1 (Feb 28, 2014)
* [CB-6116](https://issues.apache.org/jira/browse/CB-6116) Fix error where resolveLocalFileSystemURL would fail
* [CB-6106](https://issues.apache.org/jira/browse/CB-6106) Add support for nativeURL attribute on Entry objects
* [CB-6110](https://issues.apache.org/jira/browse/CB-6110) iOS: Fix typo in filesystemPathForURL: method
* Android: Use most specific FS match when resolving file: URIs
* iOS: Update fileSystemURLforLocalPath: to return the most match url.
* Allow third-party plugin registration, and the total count of fs type is not limited to just 4.
* [CB-6097](https://issues.apache.org/jira/browse/CB-6097) Added missing files for amazon-fireos platform. Added onLoad flag to true.
* [CB-6087](https://issues.apache.org/jira/browse/CB-6087) Android, iOS: Load file plugin on startup
* [CB-6013](https://issues.apache.org/jira/browse/CB-6013) BlackBerry10: wrap webkit prefixed called in requestAnimationFrame
* Update plugin writers' documentation
* [CB-6080](https://issues.apache.org/jira/browse/CB-6080) Fix file copy when src and dst are on different local file systems
* [CB-6057](https://issues.apache.org/jira/browse/CB-6057) Add methods for plugins to convert between URLs and paths
* [CB-6050](https://issues.apache.org/jira/browse/CB-6050) Public method for returning a FileEntry from a device file path
* [CB-2432](https://issues.apache.org/jira/browse/CB-2432) [CB-3185](https://issues.apache.org/jira/browse/CB-3185), [CB-5975](https://issues.apache.org/jira/browse/CB-5975): Fix Android handling of content:// URLs
* [CB-6022](https://issues.apache.org/jira/browse/CB-6022) Add upgrade notes to doc
* [CB-5233](https://issues.apache.org/jira/browse/CB-5233) Make asset-library urls work properly on iOS
* [CB-6012](https://issues.apache.org/jira/browse/CB-6012) Preserve query strings on cdvfile:// URLs where necessary
* [CB-6010](https://issues.apache.org/jira/browse/CB-6010) Test properly for presence of URLforFilesystemPath method
* [CB-5959](https://issues.apache.org/jira/browse/CB-5959) Entry.getMetadata should return size attribute

### 1.0.0 (Feb 05, 2014)
* [CB-5974](https://issues.apache.org/jira/browse/CB-5974): Use safe 'Compatibilty' mode by default
* [CB-5915](https://issues.apache.org/jira/browse/CB-5915): [CB-5916](https://issues.apache.org/jira/browse/CB-5916): Reorganize preference code to make defaults possible
* [CB-5974](https://issues.apache.org/jira/browse/CB-5974): Android: Don't allow File operations to continue when not configured
* [CB-5960](https://issues.apache.org/jira/browse/CB-5960): ios: android: Properly handle parent references in getFile/getDirectory
* [ubuntu] adopt to recent changes
* Add default FS root to new FS objects
* [CB-5899](https://issues.apache.org/jira/browse/CB-5899): Make DirectoryReader.readEntries return properly formatted Entry objects
* Add constuctor params to FileUploadResult related to [CB-2421](https://issues.apache.org/jira/browse/CB-2421)
* Fill out filesystem attribute of entities returned from resolveLocalFileSystemURL
* [CB-5916](https://issues.apache.org/jira/browse/CB-5916): Create documents directories if they don't exist
* [CB-5915](https://issues.apache.org/jira/browse/CB-5915): Create documents directories if they don't exist
* [CB-5916](https://issues.apache.org/jira/browse/CB-5916): Android: Fix unfortunate NPE in config check
* [CB-5916](https://issues.apache.org/jira/browse/CB-5916): Android: Add "/files/" to persistent files path
* [CB-5915](https://issues.apache.org/jira/browse/CB-5915): ios: Update config preference (and docs) to match issue
* [CB-5916](https://issues.apache.org/jira/browse/CB-5916): Android: Add config preference for Android persistent storage location
* iOS: Add config preference for iOS persistent storage location
* iOS: Android: Allow third-party plugin registration
* Android: Expose filePlugin getter so that other plugins can register filesystems
* Fix typos in deprecation message
* Add backwards-compatibility shim for file-transfer
* Android: Allow third-party plugin registration
* [CB-5810](https://issues.apache.org/jira/browse/CB-5810) [BlackBerry10] resolve local:/// paths (application assets)
* [CB-5774](https://issues.apache.org/jira/browse/CB-5774): create DirectoryEntry instead of FileEntry
* Initial fix for [CB-5747](https://issues.apache.org/jira/browse/CB-5747)
* Change default FS URL scheme to "cdvfile"
* Android: Properly format content urls
* Android, iOS: Replace "filesystem" protocol string with constant
* Android: Allow absolute paths on Entry.getFile / Entry.getDirectory
* Android: Make clear that getFile takes a path, not just a filename
* [CB-5008](https://issues.apache.org/jira/browse/CB-5008): Rename resolveLocalFileSystemURI to resolveLocalFileSystemURL; deprecate original
* Remove old file reference from plugin.xml
* Android: Refactor File API
* [CB-4899](https://issues.apache.org/jira/browse/CB-4899) [BlackBerry10] Fix resolve directories
* [CB-5602](https://issues.apache.org/jira/browse/CB-5602) Windows8. Fix File Api mobile spec tests
* Android: Better support for content urls and cross-filesystem copy/move ops
* [CB-5699](https://issues.apache.org/jira/browse/CB-5699) [BlackBerry10] Update resolveLocalFileSystemURI implementation
* [CB-5658](https://issues.apache.org/jira/browse/CB-5658) Update license comment formatting of doc/index.md
* [CB-5658](https://issues.apache.org/jira/browse/CB-5658) Add doc.index.md for File plugin.
* [CB-5658](https://issues.apache.org/jira/browse/CB-5658) Delete stale snapshot of plugin docs
* [CB-5403](https://issues.apache.org/jira/browse/CB-5403): Backwards-compatibility with file:// urls where possible
* [CB-5407](https://issues.apache.org/jira/browse/CB-5407): Fixes for ContentFilesystem
* Android: Add method for testing backwards-compatibility of filetransfer plugin
* iOS: Add method for testing backwards-compatiblity of filetransfer plugin
* Android: Updates to allow FileTransfer to continue to work
* Android: Clean up unclosed file objects
* [CB-5407](https://issues.apache.org/jira/browse/CB-5407): Cleanup
* [CB-5407](https://issues.apache.org/jira/browse/CB-5407): Add new Android source files to plugin.xml
* [CB-5407](https://issues.apache.org/jira/browse/CB-5407): Move read, write and truncate methods into modules
* [CB-5407](https://issues.apache.org/jira/browse/CB-5407): Move copy/move methods into FS modules
* [CB-5407](https://issues.apache.org/jira/browse/CB-5407): Move getParent into FS modules
* [CB-5407](https://issues.apache.org/jira/browse/CB-5407): Move getmetadata methods into FS modules
* [CB-5407](https://issues.apache.org/jira/browse/CB-5407): Move readdir methods into FS modules
* [CB-5407](https://issues.apache.org/jira/browse/CB-5407): Move remove methods into FS modules
* [CB-5407](https://issues.apache.org/jira/browse/CB-5407): Move getFile into FS modules
* [CB-5407](https://issues.apache.org/jira/browse/CB-5407): Start refactoring android code: Modular filesystems, rfs, rlfsurl
* [CB-5407](https://issues.apache.org/jira/browse/CB-5407): Update android JS to use FS urls
* [CB-5405](https://issues.apache.org/jira/browse/CB-5405): Use URL formatting for Entry.toURL
* [CB-5532](https://issues.apache.org/jira/browse/CB-5532) Fix
* Log file path for File exceptions.
* Partial fix for iOS File compatibility with previous fileTransfer plugin
* [CB-5532](https://issues.apache.org/jira/browse/CB-5532) WP8. Add binary data support to FileWriter
* [CB-5531](https://issues.apache.org/jira/browse/CB-5531) WP8. File Api readAsText incorrectly handles position args
* Added ubuntu platform support
* Added amazon-fireos platform support
* [CB-5118](https://issues.apache.org/jira/browse/CB-5118) [BlackBerry10] Add check for undefined error handler
* [CB-5406](https://issues.apache.org/jira/browse/CB-5406): Extend public API for dependent plugins
* [CB-5403](https://issues.apache.org/jira/browse/CB-5403): Bump File plugin major version
* [CB-5406](https://issues.apache.org/jira/browse/CB-5406): Split iOS file plugin into modules
* [CB-5406](https://issues.apache.org/jira/browse/CB-5406): Factor out filesystem providers in iOS
* [CB-5408](https://issues.apache.org/jira/browse/CB-5408): Add handler for filesystem:// urls
* [CB-5406](https://issues.apache.org/jira/browse/CB-5406): Update iOS native code to use filesystem URLs internally
* [CB-5405](https://issues.apache.org/jira/browse/CB-5405): Update JS code to use URLs exclusively
* [CB-4816](https://issues.apache.org/jira/browse/CB-4816) Fix file creation outside sandbox for BB10

### 0.2.5 (Oct 28, 2013)
* [CB-5129](https://issues.apache.org/jira/browse/CB-5129): Add a consistent filesystem attribute to FileEntry and DirectoryEntry objects
* [CB-5128](https://issues.apache.org/jira/browse/CB-5128): added repo + issue tag to plugin.xml for file plugin
* [CB-5015](https://issues.apache.org/jira/browse/CB-5015) [BlackBerry10] Add missing dependency for File.slice
* [CB-5010](https://issues.apache.org/jira/browse/CB-5010) Incremented plugin version on dev branch.

### 0.2.4 (Oct 9, 2013)
* [CB-5020](https://issues.apache.org/jira/browse/CB-5020) - File plugin should execute on a separate thread
* [CB-4915](https://issues.apache.org/jira/browse/CB-4915) Incremented plugin version on dev branch.
* [CB-4504](https://issues.apache.org/jira/browse/CB-4504): Updating FileUtils.java to compensate for Java porting failures in the Android SDK. This fails because Java knows nothing about android_asset not being an actual filesystem

### 0.2.3 (Sept 25, 2013)
* [CB-4889](https://issues.apache.org/jira/browse/CB-4889) bumping&resetting version
* [CB-4903](https://issues.apache.org/jira/browse/CB-4903) File Plugin not loading Windows8
* [CB-4903](https://issues.apache.org/jira/browse/CB-4903) File Plugin not loading Windows8
* [CB-4889](https://issues.apache.org/jira/browse/CB-4889) renaming references
* [CB-4889](https://issues.apache.org/jira/browse/CB-4889) renaming org.apache.cordova.core.file to org.apache.cordova.file
* Rename CHANGELOG.md -> RELEASENOTES.md
* [CB-4771](https://issues.apache.org/jira/browse/CB-4771) Expose TEMPORARY and PERSISTENT constants on window.
* Fix compiler/lint warnings
* [CB-4764](https://issues.apache.org/jira/browse/CB-4764) Move DirectoryManager.java into file plugin
* [CB-4763](https://issues.apache.org/jira/browse/CB-4763) Copy FileHelper.java into the plugin.
* [CB-2901](https://issues.apache.org/jira/browse/CB-2901) [BlackBerry10] Automatically unsandbox filesystem if path is not in app sandbox
* [CB-4752](https://issues.apache.org/jira/browse/CB-4752) Incremented plugin version on dev branch.

### 0.2.1 (Sept 5, 2013)
* [CB-4656](https://issues.apache.org/jira/browse/CB-4656) Don't add newlines in data urls within readAsDataUrl.
* [CB-4514](https://issues.apache.org/jira/browse/CB-4514) Making DirectoryCopy Recursive
* [iOS] Simplify the code in resolveLocalFileSystemURI
