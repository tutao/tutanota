/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

/*
 * FileProxy
 *
 * Register all File exec calls to be handled by proxy
 */

module.exports = {
    copyTo: require('cordova-plugin-file.copyToProxy'),
    getDirectory: require('cordova-plugin-file.getDirectoryProxy'),
    getFile: require('cordova-plugin-file.getFileProxy'),
    getFileMetadata: require('cordova-plugin-file.getFileMetadataProxy'),
    getMetadata: require('cordova-plugin-file.getMetadataProxy'),
    getParent: require('cordova-plugin-file.getParentProxy'),
    moveTo: require('cordova-plugin-file.moveToProxy'),
    readAsArrayBuffer: require('cordova-plugin-file.readAsArrayBufferProxy'),
    readAsBinaryString: require('cordova-plugin-file.readAsBinaryStringProxy'),
    readAsDataURL: require('cordova-plugin-file.readAsDataURLProxy'),
    readAsText: require('cordova-plugin-file.readAsTextProxy'),
    readEntries: require('cordova-plugin-file.readEntriesProxy'),
    remove: require('cordova-plugin-file.removeProxy'),
    removeRecursively: require('cordova-plugin-file.removeRecursivelyProxy'),
    resolveLocalFileSystemURI: require('cordova-plugin-file.resolveLocalFileSystemURIProxy'),
    requestAllFileSystems: require('cordova-plugin-file.requestAllFileSystemsProxy'),
    requestFileSystem: require('cordova-plugin-file.requestFileSystemProxy'),
    setMetadata: require('cordova-plugin-file.setMetadataProxy'),
    truncate: require('cordova-plugin-file.truncateProxy'),
    write: require('cordova-plugin-file.writeProxy')
};

require('cordova/exec/proxy').add('File', module.exports);
