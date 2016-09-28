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

/*global require*/

//Only Chrome uses this file.
var isChrome = window.webkitRequestFileSystem && window.webkitResolveLocalFileSystemURL;
if (!isChrome) {
    return;
}

var channel = require('cordova/channel');
var FileError = require('./FileError');
var PERSISTENT_FS_QUOTA = 5 * 1024 * 1024;
var filePluginIsReadyEvent = new Event('filePluginIsReady');

var entryFunctionsCreated = false;
var quotaWasRequested = false;
var eventWasThrown = false;

if (!window.requestFileSystem) {
    window.requestFileSystem = function(type, size, win, fail) {
        if (fail) {
            fail("Not supported");
        }
    };
} else {
    window.requestFileSystem(window.TEMPORARY, 1, createFileEntryFunctions, function() {});
}

if (!window.resolveLocalFileSystemURL) {
    window.resolveLocalFileSystemURL = function(url, win, fail) {
        if(fail) {
            fail("Not supported");
        }
    };
}

// Resolves a filesystem entry by its path - which is passed either in standard (filesystem:file://) or
// Cordova-specific (cdvfile://) universal way.
// Aligns with specification: http://www.w3.org/TR/2011/WD-file-system-api-20110419/#widl-LocalFileSystem-resolveLocalFileSystemURL
var nativeResolveLocalFileSystemURL = window.resolveLocalFileSystemURL || window.webkitResolveLocalFileSystemURL;
window.resolveLocalFileSystemURL = function(url, win, fail) {
    /* If url starts with `cdvfile` then we need convert it to Chrome real url first:
      cdvfile://localhost/persistent/path/to/file -> filesystem:file://persistent/path/to/file */
    if (url.trim().substr(0,7) === "cdvfile") {
        /* Quirk:
        Plugin supports cdvfile://localhost (local resources) only.
        I.e. external resources are not supported via cdvfile. */
        if (url.indexOf("cdvfile://localhost") !== -1) {
            // Browser supports temporary and persistent only
            var indexPersistent = url.indexOf('persistent');
            var indexTemporary = url.indexOf('temporary');

            /* Chrome urls start with 'filesystem:' prefix. See quirk:
               toURL function in Chrome returns filesystem:-prefixed path depending on application host.
               For example, filesystem:file:///persistent/somefile.txt,
               filesystem:http://localhost:8080/persistent/somefile.txt. */
            var prefix = 'filesystem:file:///';
            if (location.protocol !== 'file:') {
                prefix = 'filesystem:' + location.origin + '/';
            }

            var result;
            if (indexPersistent !== -1) {
                // cdvfile://localhost/persistent/path/to/file -> filesystem:file://persistent/path/to/file
                // or filesystem:http://localhost:8080/persistent/path/to/file
                result =  prefix + 'persistent' + url.substr(indexPersistent + 10);
                nativeResolveLocalFileSystemURL(result, win, fail);
                return;
            }

            if (indexTemporary !== -1) {
                // cdvfile://localhost/temporary/path/to/file -> filesystem:file://temporary/path/to/file
                // or filesystem:http://localhost:8080/temporary/path/to/file
                result = prefix + 'temporary' + url.substr(indexTemporary + 9);
                nativeResolveLocalFileSystemURL(result, win, fail);
                return;
            }
        }

        // cdvfile other than local file resource is not supported
        fail && fail(new FileError(FileError.ENCODING_ERR));
    } else {
        nativeResolveLocalFileSystemURL(url, win, fail);
    }
};

function createFileEntryFunctions(fs) {
    fs.root.getFile('todelete_658674_833_4_cdv', {create: true}, function(fileEntry) {
        var fileEntryType = Object.getPrototypeOf(fileEntry);
        var entryType = Object.getPrototypeOf(fileEntryType);

        // Save the original method
        var origToURL = entryType.toURL;
        entryType.toURL = function () {
            var origURL = origToURL.call(this);
            if (this.isDirectory && origURL.substr(-1) !== '/') {
                return origURL + '/';
            }
            return origURL;
        };

        entryType.toNativeURL = function () {
            console.warn("DEPRECATED: Update your code to use 'toURL'");
            return this.toURL();
        };

        entryType.toInternalURL = function() {
            if (this.toURL().indexOf("persistent") > -1) {
                return "cdvfile://localhost/persistent" + this.fullPath;
            }

            if (this.toURL().indexOf("temporary") > -1) {
                return "cdvfile://localhost/temporary" + this.fullPath;
            }
        };

        entryType.setMetadata = function(win, fail /*, metadata*/) {
            fail && fail("Not supported");
        };

        fileEntry.createWriter(function(writer) {
            var originalWrite = writer.write;
            var writerProto = Object.getPrototypeOf(writer);
            writerProto.write = function(blob) {
                if(blob instanceof Blob) {
                    originalWrite.apply(this, [blob]);
                } else {
                    var realBlob = new Blob([blob]);
                    originalWrite.apply(this, [realBlob]);
               }
            };

            fileEntry.remove(function(){ entryFunctionsCreated = true; }, function(){ /* empty callback */ });
      });
    });
}

window.initPersistentFileSystem = function(size, win, fail) {
    if (navigator.webkitPersistentStorage) {
        navigator.webkitPersistentStorage.requestQuota(size, win, fail);
        return;
    }

    fail("This browser does not support this function");
};

window.isFilePluginReadyRaised = function () { return eventWasThrown; };

window.initPersistentFileSystem(PERSISTENT_FS_QUOTA, function() {
    console.log('Persistent fs quota granted');
    quotaWasRequested = true;
}, function(e){
    console.log('Error occured while trying to request Persistent fs quota: ' + JSON.stringify(e));
});

channel.onCordovaReady.subscribe(function () {
    function dispatchEventIfReady() {
        if (entryFunctionsCreated && quotaWasRequested) {
            window.dispatchEvent(filePluginIsReadyEvent);
            eventWasThrown = true;
        } else {
            setTimeout(dispatchEventIfReady, 100);
        }
    }

    dispatchEventIfReady();
}, false);
