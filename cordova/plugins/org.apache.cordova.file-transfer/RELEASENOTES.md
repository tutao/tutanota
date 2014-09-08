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

### 0.3.2 (Sept 25, 2013)
* CB-4889 bumping&resetting version
* [windows8] commandProxy was moved
* CB-4889 updating core references
* CB-4889 renaming org.apache.cordova.core.file-transfer to org.apache.cordova.file-transfer and updating dependency
* Rename CHANGELOG.md -> RELEASENOTES.md

### 0.3.3 (Oct 9, 2013)
* removed un-needed undef check
* Fix missing headers in Windows 8 upload proxy
* Fix missing headers in Windows 8 Proxy
* Fix Windows 8 HTMLAnchorElement return host:80 which force Basic Auth Header to replace options Auth Header
* [CB-4915] Incremented plugin version on dev branch.

 ### 0.3.4 (Oct 28, 2013)
* CB-5128: added repo + issue tag to plugin.xml for file transfer plugin
* [CB-5010] Incremented plugin version on dev branch.

### 0.4.0 (Dec 4, 2013)
* CB-5466: Partial revert; we're not ready yet for FS urls
* add ubuntu platform
* CB-5466: Minor version bump
* CB-5466: Update FileTransfer plugin to accept filesystem urls
* Added amazon-fireos platform. Change to use amazon-fireos as the platform if the user agen string contains 'cordova-amazon-fireos'

### 0.4.1 (Feb 05, 2014)
* CB-5365 Remove unused exception var to prevent warnings?
* CB-2421 explicitly write the bytesSent,responseCode,result to the FileUploadResult pending release of cordova-plugin-file dependency, added some sanity checks for callbacks
* iOS: Update for new file plugin api
* CB-5631 Removed SimpleTrackingInputStream.read(byte[] buffer)
* CB-5762 android: Fix lengthComputable set wrong for gzip downloads
* CB-4899 [BlackBerry10] Improve binary file transfer download
* Delete stale test/ directory
* CB-5722 [BlackBerry10] Update upload function to use native file object
* CB-5658 Delete stale snapshot of plugin docs
* Remove @1 designation from file plugin dependency until pushed to npm
* CB-5466: Update to work with filesystem URLs

### 0.4.2 (Feb 28, 2014)
* CB-6106 Ensure that nativeURL is used by file transfer download
* iOS: Fix default value for trustAllHosts on iOS (YES->NO)
* CB-6059 iOS: Stop FileTransfer.download doing IO on the UI thread.
* CB-5588 iOS: Add response headers to upload result
* CB-2190 iOS: Make backgroundTaskId apply to downloads as well. Move backgroundTaskId to the delegate.
* CB-6050 Android: Use instance method on actual file plugin object to get FileEntry to return on download
* CB-6000 Android: Nginx rejects Content-Type without a space before "boundary".
* CB-4907 Android: Close stream when we're finished with it
* CB-6022 Add backwards-compatibility notes to doc

### 0.4.3 (Apr 17, 2014)
* CB-6422 [windows8] use cordova/exec/proxy
* iOS: Fix error where files were not removed on abort
* CB-5175: [ios] CDVFileTransfer asynchronous download (Fixes #24)
* [ios] Cast id references to NSURL to avoid compiler warnings (Fixes: apache/cordova-plugin-file-transfer#18)
* CB-6212: [iOS] fix warnings compiled under arm64 64-bit
* CB-5762: [FireOS] android: Fix lengthComputable set wrong for gzip downloads
* CB-5631: [FireOS] Removed SimpleTrackingInputStream.read(byte[] buffer)
* CB-4907: [FireOS] Close stream when we're finished with it
* CB-6000: [FireOS] Nginx rejects Content-Type without a space before "boundary".
* CB-6050: [FireOS] Use instance method on actual file plugin object to get FileEntry to return on download
* CB-6460: Update license headers

### 0.4.4 (Jun 05, 2014)
* CB-6127 Spanish and French Translations added. Github close #21
* ubuntu: support 'cdvfile' URI
* CB-6802 Add license
* Upload progress now works also for second file
* CB-6706: Relax dependency on file plugin
* CB-3440 [BlackBerry10] Update implementation to use modules from file plugin
* CB-6378 Use connection.disconnect() instead of stream.close() for thread-safety
* CB-6491 add CONTRIBUTING.md
* CB-6466 Auto-create directories in download
* CB-6494 android: Fix upload of KitKat content URIs
* Upleveled from android port with following commits: 3c1ff16 Andrew Grieve - CB-5762 android: Fix lengthComputable set wrong for gzip downloads 8374b3d Colin Mahoney - CB-5631 Removed SimpleTrackingInputStream.read(byte[] buffer) 6f91ac3 Bas Bosman - CB-4907 Close stream when we're finished with it 651460f Christoph Neumann - CB-6000 Nginx rejects Content-Type without a space before "boundary". 35f80e4 Ian Clelland - CB-6050: Use instance method on actual file plugin object to get FileEntry to return on download
* CB-5980 Updated version and RELEASENOTES.md for release 0.4.1

### 0.4.5

### 0.4.5 (Aug 06, 2014)
* Upload parameters out of order
* **FirefoxOS** initial implementation
* CB-6781: Expose FileTransferError.exception to application
* CB-6928: Add new error code to documentation
* CB-6928: Handle 304 status code
* CB-6928: Open output stream only if it's necessary.
* [BlackBerry10] Minor doc correction
* CB-6127 Updated translations for docs
* [Windows8] upload uses the provided fileName or the actual fileName
* CB-2420 [Windows8] honor fileKey and param options. This closes #15
* CB-6781: Update new docs to match AlexNennker's changes in PR30
* CB-6781: Continue previous commit with one new instance (This closes #30)
* CB-6781: add the exception text to the error object
* CB-6890: Fix pluginManager access for 4.0.x branch
