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

/*global exports, cordova, FileTransfer, FileTransferError,
         FileUploadOptions, LocalFileSystem, requestFileSystem, TEMPORARY */

/*global describe, it, expect, beforeEach, afterEach, spyOn,
         jasmine, pending*/

exports.defineAutoTests = function () {

    // constants
    var GRACE_TIME_DELTA = 600; // in milliseconds
    var DEFAULT_FILESYSTEM_SIZE = 1024*50; //filesystem size in bytes
    var UNKNOWN_HOST = "http://foobar.apache.org";
    var HEADERS_ECHO = "http://whatheaders.com"; // NOTE: this site is very useful!
    var DOWNLOAD_TIMEOUT = 30 * 1000; // download tests sometimes need a higher timeout to complete successfully
    var UPLOAD_TIMEOUT = 30 * 1000; // upload tests sometimes need a higher timeout to complete successfully
    var ABORT_DELAY = 100; // for abort() tests

    // config for upload test server
    // NOTE:
    //      more info at https://github.com/apache/cordova-labs/tree/cordova-filetransfer
    var SERVER                  = "http://cordova-vm.apache.org:5000";
    var SERVER_WITH_CREDENTIALS = "http://cordova_user:cordova_password@cordova-vm.apache.org:5000";

    // flags
    var isWindows = cordova.platformId === 'windows8' || cordova.platformId === 'windows';
    var isWP8 = cordova.platformId === 'windowsphone';
    var isBrowser = cordova.platformId === 'browser';
    var isIE = isBrowser && navigator.userAgent.indexOf('Trident') >= 0;

    describe('FileTransferError', function () {

        it('should exist', function () {
            expect(FileTransferError).toBeDefined();
        });

        it('should be constructable', function () {
            var transferError = new FileTransferError();
            expect(transferError).toBeDefined();
        });

        it('filetransfer.spec.3 should expose proper constants', function () {

            expect(FileTransferError.FILE_NOT_FOUND_ERR).toBeDefined();
            expect(FileTransferError.INVALID_URL_ERR).toBeDefined();
            expect(FileTransferError.CONNECTION_ERR).toBeDefined();
            expect(FileTransferError.ABORT_ERR).toBeDefined();
            expect(FileTransferError.NOT_MODIFIED_ERR).toBeDefined();

            expect(FileTransferError.FILE_NOT_FOUND_ERR).toBe(1);
            expect(FileTransferError.INVALID_URL_ERR).toBe(2);
            expect(FileTransferError.CONNECTION_ERR).toBe(3);
            expect(FileTransferError.ABORT_ERR).toBe(4);
            expect(FileTransferError.NOT_MODIFIED_ERR).toBe(5);
        });
    });

    describe('FileUploadOptions', function () {

        it('should exist', function () {
            expect(FileUploadOptions).toBeDefined();
        });

        it('should be constructable', function () {
            var transferOptions = new FileUploadOptions();
            expect(transferOptions).toBeDefined();
        });
    });

    describe('FileTransfer', function () {

        var persistentRoot, tempRoot;

        // named callbacks
        var unexpectedCallbacks = {
            httpFail:          function () {},
            httpWin:           function () {},
            fileSystemFail:    function () {},
            fileSystemWin:     function () {},
            fileOperationFail: function () {},
            fileOperationWin:  function () {},
        };

        var expectedCallbacks = {
            unsupportedOperation: function (response) {
                console.log('spec called unsupported functionality; response:', response);
            },
        };

        // helpers
        var deleteFile = function (fileSystem, name, done) {
            fileSystem.getFile(name, null,
                function (fileEntry) {
                    fileEntry.remove(
                        function () {
                            done();
                        },
                        function () {
                            throw new Error('failed to delete: \'' + name + '\'');
                        }
                    );
                },
                function () {
                    done();
                }
            );
        };

        var writeFile = function (fileSystem, name, content, success) {
            fileSystem.getFile(name, { create: true },
                function (fileEntry) {
                    fileEntry.createWriter(function (writer) {

                        writer.onwrite = function () {
                            success(fileEntry);
                        };

                        writer.onabort = function (evt) {
                            throw new Error('aborted creating test file \'' + name + '\': ' + evt);
                        };

                        writer.error = function (evt) {
                            throw new Error('aborted creating test file \'' + name + '\': ' + evt);
                        };

                        if (cordova.platformId === 'browser') {
                            // var builder = new BlobBuilder();
                            // builder.append(content + '\n');
                            var blob = new Blob([content + '\n'], { type: 'text/plain' });
                            writer.write(blob);
                        } else {
                            writer.write(content + "\n");
                        }

                    }, unexpectedCallbacks.fileOperationFail);
                },
                function () {
                    throw new Error('could not create test file \'' + name + '\'');
                }
            );
        };

        // according to documentation, wp8 does not support onProgress:
        // https://github.com/apache/cordova-plugin-file-transfer/blob/master/doc/index.md#supported-platforms
        var wp8OnProgressHandler = function () {};

        var defaultOnProgressHandler = function (event) {
            if (event.lengthComputable) {
                expect(event.loaded).toBeGreaterThan(1);
                expect(event.total).toBeGreaterThan(0);
                expect(event.total).not.toBeLessThan(event.loaded);
                expect(event.lengthComputable).toBe(true, 'lengthComputable');
            } else {
                // In IE, when lengthComputable === false, event.total somehow is equal to 2^64
                if (isIE) {
                    expect(event.total).toBe(Math.pow(2, 64));
                } else {
                    // iOS returns -1, and other platforms return 0
                    expect(event.total).toBeLessThan(1);
                }
            }
        };

        var getMalformedUrl = function () {
            if (cordova.platformId === 'android' || cordova.platformId === 'amazon-fireos') {
                // bad protocol causes a MalformedUrlException on Android
                return "httpssss://example.com";
            } else {
                // iOS doesn't care about protocol, space in hostname causes error
                return "httpssss://exa mple.com";
            }
        };

        // NOTE:
        //      there are several beforeEach calls, one per async call; since calling done()
        //      signifies a completed async call, each async call needs its own done(), and
        //      therefore its own beforeEach
        beforeEach(function (done) {
            window.requestFileSystem(LocalFileSystem.PERSISTENT, DEFAULT_FILESYSTEM_SIZE,
                function (fileSystem) {
                    persistentRoot = fileSystem.root;
                    done();
                },
                function () {
                    throw new Error('Failed to initialize persistent file system.');
                }
            );
        });

        beforeEach(function (done) {
            window.requestFileSystem(LocalFileSystem.TEMPORARY, DEFAULT_FILESYSTEM_SIZE,
                function (fileSystem) {
                    tempRoot = fileSystem.root;
                    done();
                },
                function () {
                    throw new Error('Failed to initialize temporary file system.');
                }
            );
        });

        // spy on all named callbacks
        beforeEach(function() {

            // ignore the actual implementations of the unexpected callbacks
            for (var callback in unexpectedCallbacks) {
                if (unexpectedCallbacks.hasOwnProperty(callback)) {
                    spyOn(unexpectedCallbacks, callback);
                }
            }

            // but run the implementations of the expected callbacks
            for (callback in expectedCallbacks) { //jshint ignore: line
                if (expectedCallbacks.hasOwnProperty(callback)) {
                    spyOn(expectedCallbacks, callback).and.callThrough();
                }
            }
        });

        // at the end, check that none of the unexpected callbacks got called,
        // and act on the expected callbacks
        afterEach(function() {
            for (var callback in unexpectedCallbacks) {
                if (unexpectedCallbacks.hasOwnProperty(callback)) {
                    expect(unexpectedCallbacks[callback]).not.toHaveBeenCalled();
                }
            }

            if (expectedCallbacks.unsupportedOperation.calls.any()) {
                pending();
            }
        });

        it('should initialise correctly', function() {
            expect(persistentRoot).toBeDefined();
            expect(tempRoot).toBeDefined();
        });

        it('should exist', function () {
            expect(FileTransfer).toBeDefined();
        });

        it('filetransfer.spec.1 should be constructable', function () {
            var transfer = new FileTransfer();
            expect(transfer).toBeDefined();
        });

        it('filetransfer.spec.2 should expose proper functions', function () {

            var transfer = new FileTransfer();

            expect(transfer.upload).toBeDefined();
            expect(transfer.download).toBeDefined();

            expect(transfer.upload).toEqual(jasmine.any(Function));
            expect(transfer.download).toEqual(jasmine.any(Function));
        });

        describe('methods', function() {

            var transfer;

            var root;
            var fileName;
            var localFilePath;

            beforeEach(function() {

                transfer = new FileTransfer();

                // assign onprogress handler
                transfer.onprogress = isWP8 ? wp8OnProgressHandler : defaultOnProgressHandler;

                // spy on the onprogress handler, but still call through to it
                spyOn(transfer, 'onprogress').and.callThrough();

                root          = persistentRoot;
                fileName      = 'testFile.txt';
                localFilePath = root.toURL() + fileName;
            });

            // NOTE:
            //      if download tests are failing, check the
            //      URL white list for the following URLs:
            //         - 'httpssss://example.com'
            //         - 'apache.org', with subdomains="true"
            //         - 'cordova-filetransfer.jitsu.com'
            describe('download', function () {

                // helpers
                var verifyDownload = function (fileEntry) {
                    expect(fileEntry.name).toBe(fileName);
                };

                // delete the downloaded file
                afterEach(function (done) {
                    deleteFile(root, fileName, done);
                });

                it('ensures that test file does not exist', function (done) {
                    deleteFile(root, fileName, done);
                });

                it('filetransfer.spec.4 should download a file', function (done) {

                    var fileURL = SERVER + '/robots.txt';

                    var fileWin = function (blob) {

                        if (transfer.onprogress.calls.any()) {
                            var lastProgressEvent = transfer.onprogress.calls.mostRecent().args[0];
                            expect(lastProgressEvent.loaded).not.toBeGreaterThan(blob.size);
                        } else {
                            console.log('no progress events were emitted');
                        }

                        done();
                    };

                    var downloadWin = function (entry) {

                        verifyDownload(entry);

                        // verify the FileEntry representing this file
                        entry.file(fileWin, unexpectedCallbacks.fileSystemFail);
                    };

                    transfer.download(fileURL, localFilePath, downloadWin, unexpectedCallbacks.httpFail);
                }, DOWNLOAD_TIMEOUT);

                it('filetransfer.spec.5 should download a file using http basic auth', function (done) {

                    var fileURL = SERVER_WITH_CREDENTIALS + '/download_basic_auth';

                    var downloadWin = function (entry) {
                        verifyDownload(entry);
                        done();
                    };

                    transfer.download(fileURL, localFilePath, downloadWin, unexpectedCallbacks.httpFail);
                }, DOWNLOAD_TIMEOUT);

                it('filetransfer.spec.6 should get 401 status on http basic auth failure', function (done) {

                    // NOTE:
                    //      using server without credentials
                    var fileURL = SERVER + '/download_basic_auth';

                    var downloadFail = function (error) {
                        expect(error.http_status).toBe(401);
                        expect(error.http_status).not.toBe(404, "Ensure " + fileURL + " is in the white list");
                        done();
                    };

                    transfer.download(fileURL, localFilePath, unexpectedCallbacks.httpWin, downloadFail, null,
                        {
                            headers: {
                                'If-Modified-Since': 'Thu, 19 Mar 2015 00:00:00 GMT'
                            }
                        });
                }, DOWNLOAD_TIMEOUT);

                it("filetransfer.spec.7 should download a file using file:// (when hosted from file://)", function (done) {

                    // for Windows platform it's ms-appdata:/// by default, not file://
                    if (isWindows) {
                        pending();
                        return;
                    }

                    var fileURL = window.location.protocol + '//' + window.location.pathname.replace(/ /g, '%20');

                    if (!/^file:/.exec(fileURL) && cordova.platformId !== 'blackberry10') {
                        if (cordova.platformId === 'windowsphone')
                            expect(fileURL).toMatch(/^x-wmapp0:/);
                        done();
                        return;
                    }

                    var downloadWin = function (entry) {
                        verifyDownload(entry);
                        done();
                    };

                    transfer.download(fileURL, localFilePath, downloadWin, unexpectedCallbacks.httpFail);
                }, DOWNLOAD_TIMEOUT);

                it("filetransfer.spec.8 should download a file using https://", function (done) {

                    var fileURL = "https://www.apache.org/licenses/";

                    var fileWin = function (file) {

                        var reader = new FileReader();

                        reader.onerror = unexpectedCallbacks.fileOperationFail;
                        reader.onload  = function () {
                            expect(reader.result).toMatch(/The Apache Software Foundation/);
                            done();
                        };

                        reader.readAsText(file);
                    };

                    var downloadWin = function (entry) {
                        verifyDownload(entry);
                        entry.file(fileWin, unexpectedCallbacks.fileSystemFail);
                    };

                    transfer.download(fileURL, localFilePath, downloadWin, unexpectedCallbacks.httpFail);
                }, DOWNLOAD_TIMEOUT);

                it("filetransfer.spec.11 should call the error callback on abort()", function (done) {

                    var fileURL = 'http://cordova.apache.org/downloads/BlueZedEx.mp3';

                    transfer.download(fileURL, localFilePath, unexpectedCallbacks.httpWin, done);
                    setTimeout(function() {
                        transfer.abort();
                    }, ABORT_DELAY);
                }, DOWNLOAD_TIMEOUT);

                it("filetransfer.spec.9 should not leave partial file due to abort", function (done) {

                    var fileURL = 'http://cordova.apache.org/downloads/logos_2.zip';

                    var downloadFail = function (error) {

                        expect(error.code).toBe(FileTransferError.ABORT_ERR);
                        expect(transfer.onprogress).toHaveBeenCalled();

                        // check that there is no file
                        root.getFile(localFilePath, null, unexpectedCallbacks.fileSystemWin, done);
                    };

                    // abort at the first onprogress event
                    transfer.onprogress = function (event) {
                        if (event.loaded > 0) {
                            transfer.abort();
                        }
                    };

                    spyOn(transfer, 'onprogress').and.callThrough();

                    transfer.download(fileURL, localFilePath, unexpectedCallbacks.httpWin, downloadFail);
                }, DOWNLOAD_TIMEOUT);

                it("filetransfer.spec.10 should be stopped by abort() right away", function (done) {

                    var fileURL = 'http://cordova.apache.org/downloads/BlueZedEx.mp3';

                    expect(transfer.abort).not.toThrow(); // should be a no-op.

                    var startTime = +new Date();

                    var downloadFail = function (error) {

                        expect(error.code).toBe(FileTransferError.ABORT_ERR);
                        expect(new Date() - startTime).toBeLessThan(GRACE_TIME_DELTA);

                        // delay calling done() to wait for the bogus abort()
                        setTimeout(done, GRACE_TIME_DELTA * 2);
                    };

                    transfer.download(fileURL, localFilePath, unexpectedCallbacks.httpWin, downloadFail);
                    setTimeout(function() {
                        transfer.abort();
                    }, ABORT_DELAY);

                    // call abort() again, after a time greater than the grace period
                    setTimeout(function () {
                        expect(transfer.abort).not.toThrow();
                    }, GRACE_TIME_DELTA);
                }, DOWNLOAD_TIMEOUT);

                it("filetransfer.spec.12 should get http status on failure", function (done) {

                    var fileURL = SERVER + "/404";

                    var downloadFail = function (error) {

                        expect(error.http_status).not.toBe(401, "Ensure " + fileURL + " is in the white list");
                        expect(error.http_status).toBe(404);

                        // wp8 does not make difference between 404 and unknown host
                        if (isWP8) {
                            expect(error.code).toBe(FileTransferError.CONNECTION_ERR);
                        } else {
                            expect(error.code).toBe(FileTransferError.FILE_NOT_FOUND_ERR);
                        }

                        done();
                    };

                    transfer.download(fileURL, localFilePath, unexpectedCallbacks.httpWin, downloadFail);
                }, DOWNLOAD_TIMEOUT);

                it("filetransfer.spec.13 should get http body on failure", function (done) {

                    var fileURL = SERVER + "/404";

                    var downloadFail = function (error) {

                        expect(error.http_status).not.toBe(401, "Ensure " + fileURL + " is in the white list");
                        expect(error.http_status).toBe(404);

                        expect(error.body).toBeDefined();
                        expect(error.body).toMatch('You requested a 404');

                        done();
                    };

                    transfer.download(fileURL, localFilePath, unexpectedCallbacks.httpWin, downloadFail);
                }, DOWNLOAD_TIMEOUT);

                it("filetransfer.spec.14 should handle malformed urls", function (done) {

                    var fileURL = getMalformedUrl();

                    var downloadFail = function (error) {

                        // Note: Android needs the bad protocol to be added to the access list
                        // <access origin=".*"/> won't match because ^https?:// is prepended to the regex
                        // The bad protocol must begin with http to avoid automatic prefix
                        expect(error.http_status).not.toBe(401, "Ensure " + fileURL + " is in the white list");
                        expect(error.code).toBe(FileTransferError.INVALID_URL_ERR);

                        done();
                    };

                    transfer.download(fileURL, localFilePath, unexpectedCallbacks.httpWin, downloadFail);
                });

                it("filetransfer.spec.15 should handle unknown host", function (done) {
                    var fileURL = UNKNOWN_HOST;

                    var downloadFail = function (error) {
                        expect(error.code).toBe(FileTransferError.CONNECTION_ERR);
                        done();
                    };

                    // turn off the onprogress handler
                    transfer.onprogress = function () {};

                    transfer.download(fileURL, localFilePath, unexpectedCallbacks.httpWin, downloadFail);
                }, DOWNLOAD_TIMEOUT);

                it("filetransfer.spec.16 should handle bad file path", function (done) {
                    var fileURL = SERVER;
                    transfer.download(fileURL, "c:\\54321", unexpectedCallbacks.httpWin, done);
                });

                it("filetransfer.spec.17 progress should work with gzip encoding", function (done) {

                    // lengthComputable false on bb10 when downloading gzip
                    if (cordova.platformId === 'blackberry10') {
                        pending();
                        return;
                    }

                    var fileURL = "http://www.apache.org/";

                    var downloadWin = function (entry) {
                        verifyDownload(entry);
                        done();
                    };

                    transfer.download(fileURL, localFilePath, downloadWin, unexpectedCallbacks.httpFail);
                }, DOWNLOAD_TIMEOUT);

                it("filetransfer.spec.30 downloaded file entries should have a toNativeURL method", function (done) {

                    if (cordova.platformId === 'browser') {
                        pending();
                        return;
                    }

                    var fileURL = SERVER + "/robots.txt";

                    var downloadWin = function (entry) {

                        expect(entry.toNativeURL).toBeDefined();
                        expect(entry.toNativeURL).toEqual(jasmine.any(Function));

                        var nativeURL = entry.toNativeURL();

                        expect(nativeURL).toBeTruthy();
                        expect(nativeURL).toEqual(jasmine.any(String));

                        if (isWindows) {
                            expect(nativeURL.substring(0, 14)).toBe('ms-appdata:///');
                        } else if (isWP8) {
                            expect(nativeURL.substring(0, 1)).toBe('/');
                        } else {
                            expect(nativeURL.substring(0, 7)).toBe('file://');
                        }

                        done();
                    };

                    transfer.download(fileURL, localFilePath, downloadWin, unexpectedCallbacks.httpFail);
                }, DOWNLOAD_TIMEOUT);

                it("filetransfer.spec.28 (compatibility) should be able to download a file using local paths", function (done) {

                    var fileURL = SERVER + "/robots.txt";

                    var unsupported = function (response) {
                        expectedCallbacks.unsupportedOperation(response);
                        done();
                    };

                    var downloadWin = function (entry) {
                        verifyDownload(entry);
                        done();
                    };

                    var internalFilePath;
                    if (root.toInternalURL) {
                        internalFilePath = root.toInternalURL() + fileName;
                    } else {
                        internalFilePath = localFilePath;
                    }

                    // This is an undocumented interface to File which exists only for testing
                    // backwards compatibilty. By obtaining the raw filesystem path of the download
                    // location, we can pass that to transfer.download() to make sure that previously-stored
                    // paths are still valid.
                    cordova.exec(function (localPath) {
                        transfer.download(fileURL, localPath, downloadWin, unexpectedCallbacks.httpFail);
                    }, unsupported, 'File', '_getLocalFilesystemPath', [internalFilePath]);
                });

                it('filetransfer.spec.31 should properly handle 304', function (done) {

                    if(isWP8) {
                        pending();
                        return;
                    }

                    var imageURL = "http://apache.org/images/feather-small.gif";
                    var lastModified = new Date();

                    var downloadFail = function (error) {
                        expect(error.http_status).toBe(304);
                        expect(error.code).toBe(FileTransferError.NOT_MODIFIED_ERR);
                        done();
                    };

                    transfer.download(imageURL, localFilePath, unexpectedCallbacks.httpWin, downloadFail, null,
                        {
                            headers: {
                                'If-Modified-Since': lastModified.toUTCString()
                            }
                        });
                }, DOWNLOAD_TIMEOUT);
            });

            describe('upload', function() {

                var uploadParams;
                var uploadOptions;

                var fileName;
                var fileContents;
                var localFilePath;

                // helpers
                var verifyUpload = function (uploadResult) {

                    expect(uploadResult.bytesSent).toBeGreaterThan(0);
                    expect(uploadResult.responseCode).toBe(200);

                    var obj = null;
                    try {
                        obj = JSON.parse(uploadResult.response);
                        expect(obj.fields).toBeDefined();
                        expect(obj.fields.value1).toBe("test");
                        expect(obj.fields.value2).toBe("param");
                    } catch (e) {
                        expect(obj).not.toBeNull('returned data from server should be valid json');
                    }

                    expect(transfer.onprogress).toHaveBeenCalled();
                };

                beforeEach(function(done) {

                    fileName      = 'fileToUpload.txt';
                    fileContents  = 'upload test file';

                    uploadParams        = {};
                    uploadParams.value1 = "test";
                    uploadParams.value2 = "param";

                    uploadOptions          = new FileUploadOptions();
                    uploadOptions.fileKey  = "file";
                    uploadOptions.fileName = fileName;
                    uploadOptions.mimeType = "text/plain";
                    uploadOptions.params   = uploadParams;

                    var fileWin = function (entry) {
                        localFilePath = entry.toURL();
                        done();
                    };

                    // create a file to upload
                    writeFile(root, fileName, fileContents, fileWin);
                });

                // delete the uploaded file
                afterEach(function (done) {
                    deleteFile(root, fileName, done);
                });

                it("filetransfer.spec.18 should be able to upload a file", function (done) {

                    var fileURL = SERVER + '/upload';

                    var uploadWin = function (uploadResult) {

                        verifyUpload(uploadResult);

                        if (cordova.platformId === 'ios') {
                            expect(uploadResult.headers).toBeDefined('Expected headers to be defined.');
                            expect(uploadResult.headers['Content-Type']).toBeDefined('Expected content-type header to be defined.');
                        }

                        done();
                    };

                    // NOTE: removing uploadOptions cause Android to timeout
                    transfer.upload(localFilePath, fileURL, uploadWin, unexpectedCallbacks.httpFail, uploadOptions);
                }, UPLOAD_TIMEOUT);

                it("filetransfer.spec.19 should be able to upload a file with http basic auth", function (done) {

                    var fileURL = SERVER_WITH_CREDENTIALS + "/upload_basic_auth";

                    var uploadWin = function (uploadResult) {
                        verifyUpload(uploadResult);
                        done();
                    };

                    // NOTE: removing uploadOptions cause Android to timeout
                    transfer.upload(localFilePath, fileURL, uploadWin, unexpectedCallbacks.httpFail, uploadOptions);
                }, UPLOAD_TIMEOUT);

                it("filetransfer.spec.21 should be stopped by abort() right away", function (done) {

                    var fileURL = SERVER + '/upload';
                    var startTime;

                    var uploadFail = function (e) {
                        expect(e.code).toBe(FileTransferError.ABORT_ERR);
                        expect(new Date() - startTime).toBeLessThan(GRACE_TIME_DELTA);

                        // delay calling done() to wait for the bogus abort()
                        setTimeout(done, GRACE_TIME_DELTA * 2);
                    };

                    var fileWin = function () {

                        startTime = +new Date();

                        expect(transfer.abort).not.toThrow();

                        // NOTE: removing uploadOptions cause Android to timeout
                        transfer.upload(localFilePath, fileURL, unexpectedCallbacks.httpWin, uploadFail, uploadOptions);
                        setTimeout(function() {
                            transfer.abort();
                        }, ABORT_DELAY);

                        setTimeout(function () {
                            expect(transfer.abort).not.toThrow();
                        }, GRACE_TIME_DELTA);
                    };

                    writeFile(root, fileName, new Array(100000).join('aborttest!'), fileWin);
                }, UPLOAD_TIMEOUT);

                it("filetransfer.spec.22 should get http status and body on failure", function (done) {

                    var fileURL = SERVER + '/403';

                    var uploadFail = function (error) {
                        expect(error.http_status).toBe(403);
                        expect(error.http_status).not.toBe(401, "Ensure " + fileURL + " is in the white list");
                        done();
                    };

                    transfer.upload(localFilePath, fileURL, unexpectedCallbacks.httpWin, uploadFail, uploadOptions);
                }, UPLOAD_TIMEOUT);

                it("filetransfer.spec.24 should handle malformed urls", function (done) {

                    var fileURL = getMalformedUrl();

                    var uploadFail = function (error) {
                        expect(error.code).toBe(FileTransferError.INVALID_URL_ERR);
                        expect(error.http_status).not.toBe(401, "Ensure " + fileURL + " is in the white list");
                        done();
                    };

                    transfer.upload(localFilePath, fileURL, unexpectedCallbacks.httpWin, uploadFail, {});
                });

                it("filetransfer.spec.25 should handle unknown host", function (done) {

                    var fileURL = UNKNOWN_HOST;

                    var uploadFail = function (error) {
                        expect(error.code).toBe(FileTransferError.CONNECTION_ERR);
                        expect(error.http_status).not.toBe(401, "Ensure " + fileURL + " is in the white list");
                        done();
                    };

                    transfer.upload(localFilePath, fileURL, unexpectedCallbacks.httpWin, uploadFail, {});
                }, UPLOAD_TIMEOUT);

                it("filetransfer.spec.25 should handle missing file", function (done) {

                    var fileURL = SERVER + "/upload";

                    var uploadFail = function (error) {
                        expect(error.code).toBe(FileTransferError.FILE_NOT_FOUND_ERR);
                        expect(error.http_status).not.toBe(401, "Ensure " + fileURL + " is in the white list");
                        done();
                    };

                    transfer.upload('does_not_exist.txt', fileURL, unexpectedCallbacks.httpWin, uploadFail);
                }, UPLOAD_TIMEOUT);

                it("filetransfer.spec.26 should handle bad file path", function (done) {

                    var fileURL = SERVER + "/upload";

                    var uploadFail = function (error) {
                        expect(error.http_status).not.toBe(401, "Ensure " + fileURL + " is in the white list");
                        done();
                    };

                    transfer.upload("c:\\54321", fileURL, unexpectedCallbacks.httpWin, uploadFail);
                });

                it("filetransfer.spec.27 should be able to set custom headers", function (done) {

                    var fileURL = HEADERS_ECHO;

                    var uploadWin = function (uploadResult) {

                        expect(uploadResult.bytesSent).toBeGreaterThan(0);
                        expect(uploadResult.responseCode).toBe(200);
                        expect(uploadResult.response).toBeDefined();

                        var responseHtml = decodeURIComponent(uploadResult.response);

                        expect(responseHtml).toMatch(/CustomHeader1[\s\S]*CustomValue1/i);
                        expect(responseHtml).toMatch(/CustomHeader2[\s\S]*CustomValue2[\s\S]*CustomValue3/i, "Should allow array values");

                        done();
                    };

                    uploadOptions.headers = {
                        "CustomHeader1": "CustomValue1",
                        "CustomHeader2": ["CustomValue2", "CustomValue3"],
                    };

                    // NOTE: removing uploadOptions cause Android to timeout
                    transfer.upload(localFilePath, fileURL, uploadWin, unexpectedCallbacks.httpFail, uploadOptions);
                }, UPLOAD_TIMEOUT);

                it("filetransfer.spec.29 (compatibility) should be able to upload a file using local paths", function (done) {

                    var fileURL = SERVER + "/upload";

                    var unsupported = function (response) {
                        expectedCallbacks.unsupportedOperation(response);
                        done();
                    };

                    var uploadWin = function (uploadResult) {
                        verifyUpload(uploadResult);
                        done();
                    };

                    var internalFilePath;
                    if (root.toInternalURL) {
                        internalFilePath = root.toInternalURL() + fileName;
                    } else {
                        internalFilePath = localFilePath;
                    }

                    // This is an undocumented interface to File which exists only for testing
                    // backwards compatibilty. By obtaining the raw filesystem path of the download
                    // location, we can pass that to transfer.download() to make sure that previously-stored
                    // paths are still valid.
                    cordova.exec(function (localPath) {
                        transfer.upload(localPath, fileURL, uploadWin, unexpectedCallbacks.httpFail, uploadOptions);
                    }, unsupported, 'File', '_getLocalFilesystemPath', [internalFilePath]);
                }, UPLOAD_TIMEOUT);

                it("filetransfer.spec.31 should be able to upload a file using PUT method", function (done) {

                    var fileURL = SERVER + '/upload';

                    var uploadWin = function (uploadResult) {

                        verifyUpload(uploadResult);

                        if (cordova.platformId === 'ios') {
                            expect(uploadResult.headers).toBeDefined('Expected headers to be defined.');
                            expect(uploadResult.headers['Content-Type']).toBeDefined('Expected content-type header to be defined.');
                        }

                        done();
                    };

                    var uploadOptionsPut        = new FileUploadOptions();
                    uploadOptionsPut.fileKey    = "file";
                    uploadOptionsPut.fileName   = fileName;
                    uploadOptionsPut.mimeType   = "text/plain";
                    uploadOptionsPut.params     = uploadParams;
                    uploadOptionsPut.httpMethod = "PUT";

                    // NOTE: removing uploadOptions cause Android to timeout
                    transfer.upload(localFilePath, fileURL, uploadWin, unexpectedCallbacks.httpFail, uploadOptionsPut);
                }, UPLOAD_TIMEOUT);
            });
        });
    });
};

/******************************************************************************/
/******************************************************************************/
/******************************************************************************/

exports.defineManualTests = function (contentEl, createActionButton) {
    var imageURL = "http://apache.org/images/feather-small.gif";
    var videoURL = "http://techslides.com/demos/sample-videos/small.mp4";

    function clearResults() {
        var results = document.getElementById("info");
        results.innerHTML = '';
    }

    function downloadImg(source, urlFn, element, directory) {
        var filename = source.substring(source.lastIndexOf("/") + 1);
        filename = (directory || '') + filename;
        function download(fileSystem) {
            var ft = new FileTransfer();
            console.log("Starting download");
            ft.download(source, fileSystem.root.toURL() + filename, function (entry) {
                console.log("Download complete");
                element.src = urlFn(entry);
                console.log("Src URL is " + element.src);
                console.log("Inserting element");
                document.getElementById("info").appendChild(element);
            }, function (e) { console.log("ERROR: ft.download " + e.code); });
        }
        console.log("Requesting filesystem");
        clearResults();
        window.requestFileSystem(LocalFileSystem.TEMPORARY, 0, function (fileSystem) {
            console.log("Checking for existing file");
            if (typeof directory !== 'undefined') {
                console.log("Checking for existing directory.");
                fileSystem.root.getDirectory(directory, {}, function (dirEntry) {
                    dirEntry.removeRecursively(function () {
                        download(fileSystem);
                    }, function () { console.log("ERROR: dirEntry.removeRecursively"); });
                }, function () {
                    download(fileSystem);
                });
            } else {
                fileSystem.root.getFile(filename, { create: false }, function (entry) {
                    console.log("Removing existing file");
                    entry.remove(function () {
                        download(fileSystem);
                    }, function () { console.log("ERROR: entry.remove"); });
                }, function () {
                    download(fileSystem);
                });
            }
        }, function () { console.log("ERROR: requestFileSystem"); });
    }

    /******************************************************************************/

    var file_transfer_tests = '<h2>Image File Transfer Tests</h2>' +
        '<h3>The following tests should display an image of the Apache feather in the status box</h3>' +
        '<div id="cdv_image"></div>' +
        '<div id="native_image"></div>' +
        '<div id="non-existent_dir"></div>' +
        '<h2>Video File Transfer Tests</h2>' +
        '<h3>The following tests should display a video in the status box. The video should play when play is pressed</h3>' +
        '<div id="cdv_video"></div>' +
        '<div id="native_video"></div>';

    contentEl.innerHTML = '<div id="info"></div>' +
        file_transfer_tests;

    createActionButton('Download and display img (cdvfile)', function () {
        downloadImg(imageURL, function (entry) { return entry.toInternalURL(); }, new Image());
    }, 'cdv_image');

    createActionButton('Download and display img (native)', function () {
        downloadImg(imageURL, function (entry) { return entry.toURL(); }, new Image());
    }, 'native_image');

    createActionButton('Download to a non-existent dir (should work)', function () {
        downloadImg(imageURL, function (entry) { return entry.toURL(); }, new Image(), '/nonExistentDirTest/');
    }, 'non-existent_dir');

    createActionButton('Download and play video (cdvfile)', function () {
        var videoElement = document.createElement('video');
        videoElement.controls = "controls";
        downloadImg(videoURL, function (entry) { return entry.toInternalURL(); }, videoElement);
    }, 'cdv_video');

    createActionButton('Download and play video (native)', function () {
        var videoElement = document.createElement('video');
        videoElement.controls = "controls";
        downloadImg(videoURL, function (entry) { return entry.toURL(); }, videoElement);
    }, 'native_video');
};
