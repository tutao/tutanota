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
    copyTo: require('org.apache.cordova.file.copyToProxy'),
    getDirectory: require('org.apache.cordova.file.getDirectoryProxy'),
    getFile: require('org.apache.cordova.file.getFileProxy'),
    getFileMetadata: require('org.apache.cordova.file.getFileMetadataProxy'),
    getMetadata: require('org.apache.cordova.file.getMetadataProxy'),
    getParent: require('org.apache.cordova.file.getParentProxy'),
    moveTo: require('org.apache.cordova.file.moveToProxy'),
    readAsArrayBuffer: require('org.apache.cordova.file.readAsArrayBufferProxy'),
    readAsBinaryString: require('org.apache.cordova.file.readAsBinaryStringProxy'),
    readAsDataURL: require('org.apache.cordova.file.readAsDataURLProxy'),
    readAsText: require('org.apache.cordova.file.readAsTextProxy'),
    readEntries: require('org.apache.cordova.file.readEntriesProxy'),
    remove: require('org.apache.cordova.file.removeProxy'),
    removeRecursively: require('org.apache.cordova.file.removeRecursivelyProxy'),
    resolveLocalFileSystemURI: require('org.apache.cordova.file.resolveLocalFileSystemURIProxy'),
    requestAllFileSystems: require('org.apache.cordova.file.requestAllFileSystemsProxy'),
    requestFileSystem: require('org.apache.cordova.file.requestFileSystemProxy'),
    setMetadata: require('org.apache.cordova.file.setMetadataProxy'),
    truncate: require('org.apache.cordova.file.truncateProxy'),
    write: require('org.apache.cordova.file.writeProxy')
};

require('cordova/exec/proxy').add('File', module.exports);
