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

var argscheck = require('cordova/argscheck'),
    utils = require('cordova/utils'),
    exec = require('cordova/exec'),
    Entry = require('./Entry'),
    FileError = require('./FileError'),
    DirectoryReader = require('./DirectoryReader');

/**
 * An interface representing a directory on the file system.
 *
 * {boolean} isFile always false (readonly)
 * {boolean} isDirectory always true (readonly)
 * {DOMString} name of the directory, excluding the path leading to it (readonly)
 * {DOMString} fullPath the absolute full path to the directory (readonly)
 * {FileSystem} filesystem on which the directory resides (readonly)
 */
var DirectoryEntry = function(name, fullPath, fileSystem, nativeURL) {

    // add trailing slash if it is missing
    if (!/\/$/.test(fullPath)) {
        fullPath += "/";
    }
    // add trailing slash if it is missing
    if (!/\/$/.test(nativeURL)) {
        nativeURL += "/";
    }
    DirectoryEntry.__super__.constructor.call(this, false, true, name, fullPath, fileSystem, nativeURL);
};

utils.extend(DirectoryEntry, Entry);

/**
 * Creates a new DirectoryReader to read entries from this directory
 */
DirectoryEntry.prototype.createReader = function() {
    return new DirectoryReader(this.toInternalURL());
};

/**
 * Creates or looks up a directory
 *
 * @param {DOMString} path either a relative or absolute path from this directory in which to look up or create a directory
 * @param {Flags} options to create or exclusively create the directory
 * @param {Function} successCallback is called with the new entry
 * @param {Function} errorCallback is called with a FileError
 */
DirectoryEntry.prototype.getDirectory = function(path, options, successCallback, errorCallback) {
    argscheck.checkArgs('sOFF', 'DirectoryEntry.getDirectory', arguments);
    var fs = this.filesystem;
    var win = successCallback && function(result) {
        var entry = new DirectoryEntry(result.name, result.fullPath, fs, result.nativeURL);
        successCallback(entry);
    };
    var fail = errorCallback && function(code) {
        errorCallback(new FileError(code));
    };
    exec(win, fail, "File", "getDirectory", [this.toInternalURL(), path, options]);
};

/**
 * Deletes a directory and all of it's contents
 *
 * @param {Function} successCallback is called with no parameters
 * @param {Function} errorCallback is called with a FileError
 */
DirectoryEntry.prototype.removeRecursively = function(successCallback, errorCallback) {
    argscheck.checkArgs('FF', 'DirectoryEntry.removeRecursively', arguments);
    var fail = errorCallback && function(code) {
        errorCallback(new FileError(code));
    };
    exec(successCallback, fail, "File", "removeRecursively", [this.toInternalURL()]);
};

/**
 * Creates or looks up a file
 *
 * @param {DOMString} path either a relative or absolute path from this directory in which to look up or create a file
 * @param {Flags} options to create or exclusively create the file
 * @param {Function} successCallback is called with the new entry
 * @param {Function} errorCallback is called with a FileError
 */
DirectoryEntry.prototype.getFile = function(path, options, successCallback, errorCallback) {
    argscheck.checkArgs('sOFF', 'DirectoryEntry.getFile', arguments);
    var fs = this.filesystem;
    var win = successCallback && function(result) {
        var FileEntry = require('./FileEntry');
        var entry = new FileEntry(result.name, result.fullPath, fs, result.nativeURL);
        successCallback(entry);
    };
    var fail = errorCallback && function(code) {
        errorCallback(new FileError(code));
    };
    exec(win, fail, "File", "getFile", [this.toInternalURL(), path, options]);
};

module.exports = DirectoryEntry;
