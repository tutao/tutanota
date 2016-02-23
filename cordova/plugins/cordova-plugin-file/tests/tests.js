/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
 */

/*global cordova, exports*/
/*jshint jasmine: true*/
/*global FileError, LocalFileSystem, Metadata, Flags*/

exports.defineAutoTests = function () {
    var isBrowser = (cordova.platformId === "browser");
    // Use feature detection to determine current browser instead of checking user-agent
    var isChrome = isBrowser && window.webkitRequestFileSystem && window.webkitResolveLocalFileSystemURL;
    var isIE = isBrowser && (window.msIndexedDB);
    var isIndexedDBShim = isBrowser && !isChrome;   // Firefox and IE for example

    var isWindows = (cordova.platformId === "windows" || cordova.platformId === "windows8");

    var MEDIUM_TIMEOUT = 15000;

    describe('File API', function () {
        // Adding a Jasmine helper matcher, to report errors when comparing to FileError better.
        var fileErrorMap = {
            1 : 'NOT_FOUND_ERR',
            2 : 'SECURITY_ERR',
            3 : 'ABORT_ERR',
            4 : 'NOT_READABLE_ERR',
            5 : 'ENCODING_ERR',
            6 : 'NO_MODIFICATION_ALLOWED_ERR',
            7 : 'INVALID_STATE_ERR',
            8 : 'SYNTAX_ERR',
            9 : 'INVALID_MODIFICATION_ERR',
            10 : 'QUOTA_EXCEEDED_ERR',
            11 : 'TYPE_MISMATCH_ERR',
            12 : 'PATH_EXISTS_ERR'
        },
        root,
        temp_root,
        persistent_root;
        beforeEach(function (done) {
            // Custom Matchers
            jasmine.Expectation.addMatchers({
                toBeFileError : function () {
                    return {
                        compare : function (error, code) {
                            var pass = error.code === code;
                            return {
                                pass : pass,
                                message : 'Expected FileError with code ' + fileErrorMap[error.code] + ' (' + error.code + ') to be ' + fileErrorMap[code] + '(' + code + ')'
                            };
                        }
                    };
                },
                toCanonicallyMatch : function () {
                    return {
                        compare : function (currentPath, path) {
                            var a = path.split("/").join("").split("\\").join(""),
                            b = currentPath.split("/").join("").split("\\").join(""),
                            pass = a === b;
                            return {
                                pass : pass,
                                message : 'Expected paths to match : ' + path + ' should be ' + currentPath
                            };
                        }
                    };
                },
                toFailWithMessage : function () {
                    return {
                        compare : function (error, message) {
                            var pass = false;
                            return {
                                pass : pass,
                                message : message
                            };
                        }
                    };
                },
                toBeDataUrl: function () {
                    return {
                        compare : function (url) {
                            var pass = false;
                            // "data:application/octet-stream;base64,"
                            var header = url.substr(0, url.indexOf(','));
                            var headerParts = header.split(/[:;]/);
                            if (headerParts.length === 3 &&
                                headerParts[0] === 'data' &&
                                headerParts[2] === 'base64') {
                                pass = true;
                            }
                            var message = 'Expected ' + url + ' to be a valid data url. ' + header + ' is not valid header for data uris';
                            return {
                                pass : pass,
                                message : message
                            };
                        }
                    };
                }
            });
            //Define global variables
            var onError = function (e) {
                console.log('[ERROR] Problem setting up root filesystem for test running! Error to follow.');
                console.log(JSON.stringify(e));
            };
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSystem) {
                root = fileSystem.root;
                // set in file.tests.js
                persistent_root = root;
                window.requestFileSystem(LocalFileSystem.TEMPORARY, 0, function (fileSystem) {
                    temp_root = fileSystem.root;
                    // set in file.tests.js
                    done();
                }, onError);
            }, onError);
        });
        // HELPER FUNCTIONS
        // deletes specified file or directory
        var deleteEntry = function (name, success, error) {
            // deletes entry, if it exists
            // entry.remove success callback is required: http://www.w3.org/TR/2011/WD-file-system-api-20110419/#the-entry-interface
            success = success || function() {};
            error = error || failed.bind(null, success, 'deleteEntry failed.');

            window.resolveLocalFileSystemURL(root.toURL() + '/' + name, function (entry) {
                if (entry.isDirectory === true) {
                    entry.removeRecursively(success, error);
                } else {
                    entry.remove(success, error);
                }
            }, success);
        };
        // deletes file, if it exists, then invokes callback
        var deleteFile = function (fileName, callback) {
            // entry.remove success callback is required: http://www.w3.org/TR/2011/WD-file-system-api-20110419/#the-entry-interface
            callback = callback || function() {};

            root.getFile(fileName, null, // remove file system entry
                function (entry) {
                entry.remove(callback, function () {
                    console.log('[ERROR] deleteFile cleanup method invoked fail callback.');
                });
            }, // doesn't exist
                callback);
        };
        // deletes and re-creates the specified file
        var createFile = function (fileName, success, error) {
            deleteEntry(fileName, function () {
                root.getFile(fileName, {
                    create : true
                }, success, error);
            }, error);
        };
        // deletes and re-creates the specified directory
        var createDirectory = function (dirName, success, error) {
            deleteEntry(dirName, function () {
                root.getDirectory(dirName, {
                    create : true
                }, success, error);
            }, error);
        };
        var failed = function (done, msg, error) {
            var info = typeof msg == 'undefined' ? 'Unexpected error callback' : msg;
            var codeMsg = (error && error.code) ? (': ' + fileErrorMap[error.code]) : '';
            expect(true).toFailWithMessage(info + '\n' + JSON.stringify(error) + codeMsg);
            done();
        };
        var succeed = function (done, msg) {
            var info = typeof msg == 'undefined' ? 'Unexpected success callback' : msg;
            expect(true).toFailWithMessage(info);
            done();
        };
        var joinURL = function (base, extension) {
            if (base.charAt(base.length - 1) !== '/' && extension.charAt(0) !== '/') {
                return base + '/' + extension;
            }
            if (base.charAt(base.length - 1) === '/' && extension.charAt(0) === '/') {
                return base + extension.substring(1);
            }
            return base + extension;
        };
        describe('FileError object', function () {
            it("file.spec.1 should define FileError constants", function () {
                expect(FileError.NOT_FOUND_ERR).toBe(1);
                expect(FileError.SECURITY_ERR).toBe(2);
                expect(FileError.ABORT_ERR).toBe(3);
                expect(FileError.NOT_READABLE_ERR).toBe(4);
                expect(FileError.ENCODING_ERR).toBe(5);
                expect(FileError.NO_MODIFICATION_ALLOWED_ERR).toBe(6);
                expect(FileError.INVALID_STATE_ERR).toBe(7);
                expect(FileError.SYNTAX_ERR).toBe(8);
                expect(FileError.INVALID_MODIFICATION_ERR).toBe(9);
                expect(FileError.QUOTA_EXCEEDED_ERR).toBe(10);
                expect(FileError.TYPE_MISMATCH_ERR).toBe(11);
                expect(FileError.PATH_EXISTS_ERR).toBe(12);
            });
        });
        describe('LocalFileSystem', function () {
            it("file.spec.2 should define LocalFileSystem constants", function () {
                expect(LocalFileSystem.TEMPORARY).toBe(0);
                expect(LocalFileSystem.PERSISTENT).toBe(1);
            });
            describe('window.requestFileSystem', function () {
                it("file.spec.3 should be defined", function () {
                    expect(window.requestFileSystem).toBeDefined();
                });
                it("file.spec.4 should be able to retrieve a PERSISTENT file system", function (done) {
                    var win = function (fileSystem) {
                        expect(fileSystem).toBeDefined();
                        expect(fileSystem.name).toBeDefined();
                        isChrome ? expect(fileSystem.name).toContain("Persistent")
                            : expect(fileSystem.name).toBe("persistent");
                        expect(fileSystem.root).toBeDefined();
                        expect(fileSystem.root.filesystem).toBeDefined();
                        // Shouldn't use cdvfile by default.
                        expect(fileSystem.root.toURL()).not.toMatch(/^cdvfile:/);
                        // All DirectoryEntry URLs should always have a trailing slash.
                        expect(fileSystem.root.toURL()).toMatch(/\/$/);
                        done();
                    };

                    // Request a little bit of space on the filesystem, unless we're running in a browser where that could cause a prompt.
                    var spaceRequired = isBrowser ? 0 : 1024;

                    // retrieve PERSISTENT file system
                    window.requestFileSystem(LocalFileSystem.PERSISTENT, spaceRequired, win, failed.bind(null, done, 'window.requestFileSystem - Error retrieving PERSISTENT file system'));
                });
                it("file.spec.5 should be able to retrieve a TEMPORARY file system", function (done) {
                    var win = function (fileSystem) {
                        expect(fileSystem).toBeDefined();
                        isChrome ? expect(fileSystem.name).toContain("Temporary")
                            : expect(fileSystem.name).toBe("temporary");
                        expect(fileSystem.root).toBeDefined();
                        expect(fileSystem.root.filesystem).toBeDefined();
                        expect(fileSystem.root.filesystem).toBe(fileSystem);
                        done();
                    };
                    //retrieve TEMPORARY file system
                    window.requestFileSystem(LocalFileSystem.TEMPORARY, 0, win, failed.bind(null, done, 'window.requestFileSystem - Error retrieving TEMPORARY file system'));
                });
                it("file.spec.6 should error if you request a file system that is too large", function (done) {
                    if (isBrowser) {
                        /*window.requestFileSystem TEMPORARY and PERSISTENT filesystem quota is not limited in Chrome.
                        Firefox filesystem size is not limited but every 50MB request user permission.
                        IE10 allows up to 10mb of combined AppCache and IndexedDB used in implementation
                        of filesystem without prompting, once you hit that level you will be asked if you
                        want to allow it to be increased up to a max of 250mb per site.
                        So `size` parameter for `requestFileSystem` function does not affect on filesystem in Firefox and IE.*/
                        pending();
                    }

                    var fail = function (error) {
                        expect(error).toBeDefined();
                        expect(error).toBeFileError(FileError.QUOTA_EXCEEDED_ERR);
                        done();
                    };
                    //win = createWin('window.requestFileSystem');
                    // Request the file system
                    window.requestFileSystem(LocalFileSystem.TEMPORARY, 1000000000000000, failed.bind(null, done, 'window.requestFileSystem - Error retrieving TEMPORARY file system'), fail);
                });
                it("file.spec.7 should error out if you request a file system that does not exist", function (done) {

                    var fail = function (error) {
                        expect(error).toBeDefined();
                        if (isChrome) {
                            /*INVALID_MODIFICATION_ERR (code: 9) is thrown instead of SYNTAX_ERR(code: 8)
                            on requesting of a non-existant filesystem.*/
                            expect(error).toBeFileError(FileError.INVALID_MODIFICATION_ERR);
                        } else {
                            expect(error).toBeFileError(FileError.SYNTAX_ERR);
                        }
                        done();
                    };
                    // Request the file system
                    window.requestFileSystem(-1, 0, succeed.bind(null, done, 'window.requestFileSystem'), fail);
                });
            });
            describe('window.resolveLocalFileSystemURL', function () {
                it("file.spec.8 should be defined", function () {
                    expect(window.resolveLocalFileSystemURL).toBeDefined();
                });
                it("file.spec.9 should resolve a valid file name", function (done) {
                    var fileName = 'file.spec.9';
                    var win = function (fileEntry) {
                        expect(fileEntry).toBeDefined();
                        expect(fileEntry.name).toCanonicallyMatch(fileName);
                        expect(fileEntry.toURL()).not.toMatch(/^cdvfile:/, 'should not use cdvfile URL');
                        expect(fileEntry.toURL()).not.toMatch(/\/$/, 'URL should not end with a slash');
                        // Clean-up
                        deleteEntry(fileName, done);
                    };
                    createFile(fileName, function (entry) {
                        window.resolveLocalFileSystemURL(entry.toURL(), win, failed.bind(null, done, 'window.resolveLocalFileSystemURL - Error resolving file URL: ' + entry.toURL()));
                    }, failed.bind(null, done, 'createFile - Error creating file: ' + fileName), failed.bind(null, done, 'createFile - Error creating file: ' + fileName));
                });
                it("file.spec.9.5 should resolve a directory", function (done) {
                    var fileName = 'file.spec.9.5';
                    var win = function (fileEntry) {
                        expect(fileEntry).toBeDefined();
                        expect(fileEntry.name).toCanonicallyMatch(fileName);
                        expect(fileEntry.toURL()).not.toMatch(/^cdvfile:/, 'should not use cdvfile URL');
                        expect(fileEntry.toURL()).toMatch(/\/$/, 'URL end with a slash');
                        // cleanup
                        deleteEntry(fileName, done);
                    };
                    function gotDirectory(entry) {
                        // lookup file system entry
                        window.resolveLocalFileSystemURL(entry.toURL(), win, failed.bind(null, done, 'window.resolveLocalFileSystemURL - Error resolving directory URL: ' + entry.toURL()));
                    }
                    createDirectory(fileName, gotDirectory, failed.bind(null, done, 'createDirectory - Error creating directory: ' + fileName), failed.bind(null, done, 'createDirectory - Error creating directory: ' + fileName));
                });
                it("file.spec.10 resolve valid file name with parameters", function (done) {
                    var fileName = "resolve.file.uri.params",
                    win = function (fileEntry) {
                        expect(fileEntry).toBeDefined();
                        if (fileEntry.toURL().toLowerCase().substring(0, 10) === "cdvfile://") {
                            expect(fileEntry.fullPath).toBe("/" + fileName + "?1234567890");
                        }
                        expect(fileEntry.name).toBe(fileName);
                        // cleanup
                        deleteEntry(fileName, done);
                    };
                    // create a new file entry
                    createFile(fileName, function (entry) {
                        window.resolveLocalFileSystemURL(entry.toURL() + "?1234567890", win, failed.bind(null, done, 'window.resolveLocalFileSystemURL - Error resolving file URI: ' + entry.toURL()));
                    }, failed.bind(null, done, 'createFile - Error creating file: ' + fileName));
                });
                it("file.spec.11 should error (NOT_FOUND_ERR) when resolving (non-existent) invalid file name", function (done) {
                    var fileName = cordova.platformId === 'windowsphone' ? root.toURL() + "/" + "this.is.not.a.valid.file.txt" : joinURL(root.toURL(), "this.is.not.a.valid.file.txt");
                    fail = function (error) {
                        expect(error).toBeDefined();
                        expect(error).toBeFileError(FileError.NOT_FOUND_ERR);
                        done();
                    };
                    // lookup file system entry
                    window.resolveLocalFileSystemURL(fileName, succeed.bind(null, done, 'window.resolveLocalFileSystemURL - Error unexpected callback resolving file URI: ' + fileName), fail);
                });
                it("file.spec.12 should error (ENCODING_ERR) when resolving invalid URI with leading /", function (done) {
                    var fileName = "/this.is.not.a.valid.url",
                    fail = function (error) {
                        expect(error).toBeDefined();
                        expect(error).toBeFileError(FileError.ENCODING_ERR);
                        done();
                    };
                    // lookup file system entry
                    window.resolveLocalFileSystemURL(fileName, succeed.bind(null, done, 'window.resolveLocalFileSystemURL - Error unexpected callback resolving file URI: ' + fileName), fail);
                });
            });
        });
        //LocalFileSystem
        describe('Metadata interface', function () {
            it("file.spec.13 should exist and have the right properties", function () {
                var metadata = new Metadata();
                expect(metadata).toBeDefined();
                expect(metadata.modificationTime).toBeDefined();
            });
        });
        describe('Flags interface', function () {
            it("file.spec.14 should exist and have the right properties", function () {
                var flags = new Flags(false, true);
                expect(flags).toBeDefined();
                expect(flags.create).toBeDefined();
                expect(flags.create).toBe(false);
                expect(flags.exclusive).toBeDefined();
                expect(flags.exclusive).toBe(true);
            });
        });
        describe('FileSystem interface', function () {
            it("file.spec.15 should have a root that is a DirectoryEntry", function (done) {
                var win = function (entry) {
                    expect(entry).toBeDefined();
                    expect(entry.isFile).toBe(false);
                    expect(entry.isDirectory).toBe(true);
                    expect(entry.name).toBeDefined();
                    expect(entry.fullPath).toBeDefined();
                    expect(entry.getMetadata).toBeDefined();
                    expect(entry.moveTo).toBeDefined();
                    expect(entry.copyTo).toBeDefined();
                    expect(entry.toURL).toBeDefined();
                    expect(entry.remove).toBeDefined();
                    expect(entry.getParent).toBeDefined();
                    expect(entry.createReader).toBeDefined();
                    expect(entry.getFile).toBeDefined();
                    expect(entry.getDirectory).toBeDefined();
                    expect(entry.removeRecursively).toBeDefined();
                    done();
                };
                window.resolveLocalFileSystemURL(root.toURL(), win, failed.bind(null, done, 'window.resolveLocalFileSystemURL - Error resolving file URI: ' + root.toURL()));
            });
        });
        describe('DirectoryEntry', function () {
            it("file.spec.16 getFile: get Entry for file that does not exist", function (done) {
                var fileName = "de.no.file",
                filePath = joinURL(root.fullPath, fileName),
                fail = function (error) {
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.NOT_FOUND_ERR);
                    done();
                };
                // create:false, exclusive:false, file does not exist
                root.getFile(fileName, {
                    create : false
                }, succeed.bind(null, done, 'root.getFile - Error unexpected callback, file should not exists: ' + fileName), fail);
            });
            it("file.spec.17 getFile: create new file", function (done) {
                var fileName = "de.create.file",
                filePath = joinURL(root.fullPath, fileName),
                win = function (entry) {
                    expect(entry).toBeDefined();
                    expect(entry.isFile).toBe(true);
                    expect(entry.isDirectory).toBe(false);
                    expect(entry.name).toCanonicallyMatch(fileName);
                    expect(entry.fullPath).toCanonicallyMatch(filePath);
                    // cleanup
                    deleteEntry(entry.name, done);
                };
                // create:true, exclusive:false, file does not exist
                root.getFile(fileName, {
                    create : true
                }, win, succeed.bind(null, done, 'root.getFile - Error unexpected callback, file should not exists: ' + fileName));
            });
            it("file.spec.18 getFile: create new file (exclusive)", function (done) {
                var fileName = "de.create.exclusive.file",
                filePath = joinURL(root.fullPath, fileName),
                win = function (entry) {
                    expect(entry).toBeDefined();
                    expect(entry.isFile).toBe(true);
                    expect(entry.isDirectory).toBe(false);
                    expect(entry.name).toBe(fileName);
                    expect(entry.fullPath).toCanonicallyMatch(filePath);
                    // cleanup
                    deleteEntry(entry.name, done);
                };
                // create:true, exclusive:true, file does not exist
                root.getFile(fileName, {
                    create : true,
                    exclusive : true
                }, win, failed.bind(null, done, 'root.getFile - Error creating file: ' + fileName));
            });
            it("file.spec.19 getFile: create file that already exists", function (done) {
                var fileName = "de.create.existing.file",
                filePath = joinURL(root.fullPath, fileName),
                getFile = function (file) {
                    // create:true, exclusive:false, file exists
                    root.getFile(fileName, {
                        create : true
                    }, win, failed.bind(null, done, 'root.getFile - Error creating file: ' + fileName));
                },
                win = function (entry) {
                    expect(entry).toBeDefined();
                    expect(entry.isFile).toBe(true);
                    expect(entry.isDirectory).toBe(false);
                    expect(entry.name).toCanonicallyMatch(fileName);
                    expect(entry.fullPath).toCanonicallyMatch(filePath);
                    // cleanup
                    deleteEntry(entry.name, done);
                };
                // create file to kick off it
                root.getFile(fileName, {
                    create : true
                }, getFile, failed.bind(null, done, 'root.getFile - Error on initial creating file: ' + fileName));
            });
            it("file.spec.20 getFile: create file that already exists (exclusive)", function (done) {

                var fileName = "de.create.exclusive.existing.file",
                filePath = joinURL(root.fullPath, fileName),
                existingFile,
                getFile = function (file) {
                    existingFile = file;
                    // create:true, exclusive:true, file exists
                    root.getFile(fileName, {
                        create : true,
                        exclusive : true
                    }, succeed.bind(null, done, 'root.getFile - getFile function - Error unexpected callback, file should exists: ' + fileName), fail);
                },
                fail = function (error) {
                    expect(error).toBeDefined();
                    if (isChrome) {
                        /*INVALID_MODIFICATION_ERR (code: 9) is thrown instead of PATH_EXISTS_ERR(code: 12)
                        on trying to exclusively create a file, which already exists in Chrome.*/
                        expect(error).toBeFileError(FileError.INVALID_MODIFICATION_ERR);
                    } else {
                        expect(error).toBeFileError(FileError.PATH_EXISTS_ERR);
                    }
                    // cleanup
                    deleteEntry(existingFile.name, done);
                };
                // create file to kick off it
                root.getFile(fileName, {
                    create : true
                }, getFile, failed.bind(null, done, 'root.getFile - Error creating file: ' + fileName));
            });
            it("file.spec.21 DirectoryEntry.getFile: get Entry for existing file", function (done) {
                var fileName = "de.get.file",
                filePath = joinURL(root.fullPath, fileName),
                win = function (entry) {
                    expect(entry).toBeDefined();
                    expect(entry.isFile).toBe(true);
                    expect(entry.isDirectory).toBe(false);
                    expect(entry.name).toCanonicallyMatch(fileName);
                    expect(entry.fullPath).toCanonicallyMatch(filePath);
                    expect(entry.filesystem).toBeDefined();
                    expect(entry.filesystem).toBe(root.filesystem);
                    //clean up
                    deleteEntry(entry.name, done);
                },
                getFile = function (file) {
                    // create:false, exclusive:false, file exists
                    root.getFile(fileName, {
                        create : false
                    }, win, failed.bind(null, done, 'root.getFile - Error getting file entry: ' + fileName));
                };
                // create file to kick off it
                root.getFile(fileName, {
                    create : true
                }, getFile, failed.bind(null, done, 'root.getFile - Error creating file: ' + fileName));
            });
            it("file.spec.22 DirectoryEntry.getFile: get FileEntry for invalid path", function (done) {
                if (isBrowser) {
                    /*The plugin does not follow to ["8.3 Naming restrictions"]
                    (http://www.w3.org/TR/2011/WD-file-system-api-20110419/#naming-restrictions).*/
                    pending();
                }

                var fileName = "de:invalid:path",
                fail = function (error) {
                    console.error(error);
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.ENCODING_ERR);
                    done();
                };
                // create:false, exclusive:false, invalid path
                root.getFile(fileName, {
                    create : false
                }, succeed.bind(null, done, 'root.getFile - Error unexpected callback, file should not exists: ' + fileName), fail);
            });
            it("file.spec.23 DirectoryEntry.getDirectory: get Entry for directory that does not exist", function (done) {
                var dirName = "de.no.dir",
                dirPath = joinURL(root.fullPath, dirName),
                fail = function (error) {
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.NOT_FOUND_ERR);
                    done();
                };
                // create:false, exclusive:false, directory does not exist
                root.getDirectory(dirName, {
                    create : false
                }, succeed.bind(null, done, 'root.getDirectory - Error unexpected callback, directory should not exists: ' + dirName), fail);
            });
            it("file.spec.24 DirectoryEntry.getDirectory: create new dir with space then resolveLocalFileSystemURL", function (done) {
                var dirName = "de create dir",
                dirPath = joinURL(root.fullPath, encodeURIComponent(dirName)),
                getDir = function (dirEntry) {
                    expect(dirEntry.filesystem).toBeDefined();
                    expect(dirEntry.filesystem).toBe(root.filesystem);
                    var dirURI = dirEntry.toURL();
                    // now encode URI and try to resolve
                    window.resolveLocalFileSystemURL(dirURI, win, failed.bind(null, done, 'window.resolveLocalFileSystemURL - getDir function - Error resolving directory: ' + dirURI));
                },
                win = function (directory) {
                    expect(directory).toBeDefined();
                    expect(directory.isFile).toBe(false);
                    expect(directory.isDirectory).toBe(true);
                    expect(directory.name).toCanonicallyMatch(dirName);
                    expect(directory.fullPath).toCanonicallyMatch(joinURL(root.fullPath, dirName));
                    // cleanup
                    deleteEntry(directory.name, done);
                };
                // create:true, exclusive:false, directory does not exist
                root.getDirectory(dirName, {
                    create : true
                }, getDir, failed.bind(null, done, 'root.getDirectory - Error creating directory : ' + dirName));
            });
            // This test is excluded, and should probably be removed. Filesystem
            // should always be properly encoded URLs, and *not* raw paths, and it
            // doesn't make sense to double-encode the URLs and expect that to be
            // handled by the implementation.
            // If a particular platform uses paths internally rather than URLs, // then that platform should careful to pass them correctly to its
            // backend.
            xit("file.spec.25 DirectoryEntry.getDirectory: create new dir with space resolveLocalFileSystemURL with encoded URI", function (done) {
                var dirName = "de create dir2",
                dirPath = joinURL(root.fullPath, dirName),
                getDir = function (dirEntry) {
                    var dirURI = dirEntry.toURL();
                    // now encode URI and try to resolve
                    window.resolveLocalFileSystemURL(encodeURI(dirURI), win, failed.bind(null, done, 'window.resolveLocalFileSystemURL - getDir function - Error resolving directory: ' + dirURI));
                },
                win = function (directory) {
                    expect(directory).toBeDefined();
                    expect(directory.isFile).toBe(false);
                    expect(directory.isDirectory).toBe(true);
                    expect(directory.name).toCanonicallyMatch(dirName);
                    expect(directory.fullPath).toCanonicallyMatch(dirPath);
                    // cleanup
                    deleteEntry(directory.name, done);
                };
                // create:true, exclusive:false, directory does not exist
                root.getDirectory(dirName, {
                    create : true
                }, getDir, failed.bind(null, done, 'root.getDirectory - Error creating directory : ' + dirName));
            });
            it("file.spec.26 DirectoryEntry.getDirectory: create new directory", function (done) {
                var dirName = "de.create.dir",
                dirPath = joinURL(root.fullPath, dirName),
                win = function (directory) {
                    expect(directory).toBeDefined();
                    expect(directory.isFile).toBe(false);
                    expect(directory.isDirectory).toBe(true);
                    expect(directory.name).toCanonicallyMatch(dirName);
                    expect(directory.fullPath).toCanonicallyMatch(dirPath);
                    expect(directory.filesystem).toBeDefined();
                    expect(directory.filesystem).toBe(root.filesystem);
                    // cleanup
                    deleteEntry(directory.name, done);
                };
                // create:true, exclusive:false, directory does not exist
                root.getDirectory(dirName, {
                    create : true
                }, win, failed.bind(null, done, 'root.getDirectory - Error creating directory : ' + dirName));
            });
            it("file.spec.27 DirectoryEntry.getDirectory: create new directory (exclusive)", function (done) {
                var dirName = "de.create.exclusive.dir",
                dirPath = joinURL(root.fullPath, dirName),
                win = function (directory) {
                    expect(directory).toBeDefined();
                    expect(directory.isFile).toBe(false);
                    expect(directory.isDirectory).toBe(true);
                    expect(directory.name).toCanonicallyMatch(dirName);
                    expect(directory.fullPath).toCanonicallyMatch(dirPath);
                    expect(directory.filesystem).toBeDefined();
                    expect(directory.filesystem).toBe(root.filesystem);
                    // cleanup
                    deleteEntry(directory.name, done);
                };
                // create:true, exclusive:true, directory does not exist
                root.getDirectory(dirName, {
                    create : true,
                    exclusive : true
                }, win, failed.bind(null, done, 'root.getDirectory - Error creating directory : ' + dirName));
            });
            it("file.spec.28 DirectoryEntry.getDirectory: create directory that already exists", function (done) {
                var dirName = "de.create.existing.dir",
                dirPath = joinURL(root.fullPath, dirName),
                win = function (directory) {
                    expect(directory).toBeDefined();
                    expect(directory.isFile).toBe(false);
                    expect(directory.isDirectory).toBe(true);
                    expect(directory.name).toCanonicallyMatch(dirName);
                    expect(directory.fullPath).toCanonicallyMatch(dirPath);
                    // cleanup
                    deleteEntry(directory.name, done);
                };
                // create directory to kick off it
                root.getDirectory(dirName, {
                    create : true
                }, function () {
                    root.getDirectory(dirName, {
                        create : true
                    }, win, failed.bind(null, done, 'root.getDirectory - Error creating existent second directory : ' + dirName));
                }, failed.bind(null, done, 'root.getDirectory - Error creating directory : ' + dirName));
            });
            it("file.spec.29 DirectoryEntry.getDirectory: create directory that already exists (exclusive)", function (done) {

                var dirName = "de.create.exclusive.existing.dir",
                dirPath = joinURL(root.fullPath, dirName),
                existingDir,
                fail = function (error) {
                    expect(error).toBeDefined();
                    if (isChrome) {
                        /*INVALID_MODIFICATION_ERR (code: 9) is thrown instead of PATH_EXISTS_ERR(code: 12)
                        on trying to exclusively create a file or directory, which already exists (Chrome).*/
                        expect(error).toBeFileError(FileError.INVALID_MODIFICATION_ERR);
                    } else {
                        expect(error).toBeFileError(FileError.PATH_EXISTS_ERR);
                    }
                    // cleanup
                    deleteEntry(existingDir.name, done);
                };
                // create directory to kick off it
                root.getDirectory(dirName, {
                    create : true
                }, function (directory) {
                    existingDir = directory;
                    // create:true, exclusive:true, directory exists
                    root.getDirectory(dirName, {
                        create : true,
                        exclusive : true
                    }, failed.bind(null, done, 'root.getDirectory - Unexpected success callback, second directory should not be created : ' + dirName), fail);
                }, failed.bind(null, done, 'root.getDirectory - Error creating directory : ' + dirName));
            });
            it("file.spec.30 DirectoryEntry.getDirectory: get Entry for existing directory", function (done) {
                var dirName = "de.get.dir",
                dirPath = joinURL(root.fullPath, dirName),
                win = function (directory) {
                    expect(directory).toBeDefined();
                    expect(directory.isFile).toBe(false);
                    expect(directory.isDirectory).toBe(true);
                    expect(directory.name).toCanonicallyMatch(dirName);
                    expect(directory.fullPath).toCanonicallyMatch(dirPath);
                    // cleanup
                    deleteEntry(directory.name, done);
                };
                // create directory to kick it off
                root.getDirectory(dirName, {
                    create : true
                }, function () {
                    root.getDirectory(dirName, {
                        create : false
                    }, win, failed.bind(null, done, 'root.getDirectory - Error getting directory entry : ' + dirName));
                }, failed.bind(null, done, 'root.getDirectory - Error creating directory : ' + dirName));
            });
            it("file.spec.31 DirectoryEntry.getDirectory: get DirectoryEntry for invalid path", function (done) {
                if (isBrowser) {
                    /*The plugin does not follow to ["8.3 Naming restrictions"]
                    (http://www.w3.org/TR/2011/WD-file-system-api-20110419/#naming-restrictions).*/
                    pending();
                }

                var dirName = "de:invalid:path",
                fail = function (error) {
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.ENCODING_ERR);
                    done();
                };
                // create:false, exclusive:false, invalid path
                root.getDirectory(dirName, {
                    create : false
                }, succeed.bind(null, done, 'root.getDirectory - Unexpected success callback, directory should not exists: ' + dirName), fail);
            });
            it("file.spec.32 DirectoryEntry.getDirectory: get DirectoryEntry for existing file", function (done) {
                var fileName = "de.existing.file",
                existingFile,
                filePath = joinURL(root.fullPath, fileName),
                fail = function (error) {
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.TYPE_MISMATCH_ERR);
                    // cleanup
                    deleteEntry(existingFile.name, done);
                };
                // create file to kick off it
                root.getFile(fileName, {
                    create : true
                }, function (file) {
                    existingFile = file;
                    root.getDirectory(fileName, {
                        create : false
                    }, succeed.bind(null, done, 'root.getDirectory - Unexpected success callback, directory should not exists: ' + fileName), fail);
                }, failed.bind(null, done, 'root.getFile - Error creating file : ' + fileName));
            });
            it("file.spec.33 DirectoryEntry.getFile: get FileEntry for existing directory", function (done) {
                var dirName = "de.existing.dir",
                existingDir,
                dirPath = joinURL(root.fullPath, dirName),
                fail = function (error) {
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.TYPE_MISMATCH_ERR);
                    // cleanup
                    deleteEntry(existingDir.name, done);
                };
                // create directory to kick off it
                root.getDirectory(dirName, {
                    create : true
                }, function (directory) {
                    existingDir = directory;
                    root.getFile(dirName, {
                        create : false
                    }, succeed.bind(null, done, 'root.getFile - Unexpected success callback, file should not exists: ' + dirName), fail);
                }, failed.bind(null, done, 'root.getDirectory - Error creating directory : ' + dirName));
            });
            it("file.spec.34 DirectoryEntry.removeRecursively on directory", function (done) {
                var dirName = "de.removeRecursively",
                subDirName = "dir",
                dirPath = joinURL(root.fullPath, dirName),
                subDirPath = joinURL(dirPath, subDirName),
                dirExists = function (error) {
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.NOT_FOUND_ERR);
                    done();
                };
                // create a new directory entry to kick off it
                root.getDirectory(dirName, {
                    create : true
                }, function (entry) {
                    entry.getDirectory(subDirName, {
                        create : true
                    }, function (dir) {
                        entry.removeRecursively(function () {
                            root.getDirectory(dirName, {
                                create : false
                            }, succeed.bind(null, done, 'root.getDirectory - Unexpected success callback, directory should not exists: ' + dirName), dirExists);
                        }, failed.bind(null, done, 'entry.removeRecursively - Error removing directory recursively : ' + dirName));
                    }, failed.bind(null, done, 'root.getDirectory - Error creating directory : ' + subDirName));
                }, failed.bind(null, done, 'root.getDirectory - Error creating directory : ' + dirName));
            });
            it("file.spec.35 createReader: create reader on existing directory", function () {
                // create reader for root directory
                var reader = root.createReader();
                expect(reader).toBeDefined();
                expect(typeof reader.readEntries).toBe('function');
            });
            it("file.spec.36 removeRecursively on root file system", function (done) {

                var remove = function (error) {
                    expect(error).toBeDefined();
                    if (isChrome) {
                        /*INVALID_MODIFICATION_ERR (code: 9) is thrown instead of
                        NO_MODIFICATION_ALLOWED_ERR(code: 6) on trying to call removeRecursively
                        on the root file system (Chrome).*/
                        expect(error).toBeFileError(FileError.INVALID_MODIFICATION_ERR);
                    } else {
                        expect(error).toBeFileError(FileError.NO_MODIFICATION_ALLOWED_ERR);
                    }
                    done();
                };
                // remove root file system
                root.removeRecursively(succeed.bind(null, done, 'root.removeRecursively - Unexpected success callback, root cannot be removed'), remove);
            });
        });
        describe('DirectoryReader interface', function () {
            describe("readEntries", function () {
                it("file.spec.37 should read contents of existing directory", function (done) {
                    var reader,
                    win = function (entries) {
                        expect(entries).toBeDefined();
                        expect(entries instanceof Array).toBe(true);
                        done();
                    };
                    // create reader for root directory
                    reader = root.createReader();
                    // read entries
                    reader.readEntries(win, failed.bind(null, done, 'reader.readEntries - Error reading entries'));
                });
                it("file.spec.37.1 should read contents of existing directory", function (done) {
                    var dirName = 'readEntries.dir',
                    fileName = 'readeEntries.file';
                    root.getDirectory(dirName, {
                        create : true
                    }, function (directory) {
                        directory.getFile(fileName, {
                            create : true
                        }, function (fileEntry) {
                            var reader = directory.createReader();
                            reader.readEntries(function (entries) {
                                expect(entries).toBeDefined();
                                expect(entries instanceof Array).toBe(true);
                                expect(entries.length).toBe(1);
                                expect(entries[0].fullPath).toCanonicallyMatch(fileEntry.fullPath);
                                expect(entries[0].filesystem).not.toBe(null);
                                if (isChrome) {
                                    // Slicing '[object {type}]' -> '{type}'
                                    expect(entries[0].filesystem.toString().slice(8, -1)).toEqual("DOMFileSystem");
                                }
                                else {
                                    expect(entries[0].filesystem instanceof FileSystem).toBe(true);
                                }

                                // cleanup
                                deleteEntry(directory.name, done);
                            }, failed.bind(null, done, 'reader.readEntries - Error reading entries from directory: ' + dirName));
                        }, failed.bind(null, done, 'directory.getFile - Error creating file : ' + fileName));
                    }, failed.bind(null, done, 'root.getDirectory - Error creating directory : ' + dirName));
                });
                it("file.spec.109 should return an empty entry list on the second call", function (done) {
                    var reader,
                    fileName = 'test109.txt';
                    // Add a file to ensure the root directory is non-empty and then read the contents of the directory.
                    root.getFile(fileName, {
                        create : true
                    }, function (entry) {
                        reader = root.createReader();
                        //First read
                        reader.readEntries(function (entries) {
                            expect(entries).toBeDefined();
                            expect(entries instanceof Array).toBe(true);
                            expect(entries.length).not.toBe(0);
                            //Second read
                            reader.readEntries(function (entries_) {
                                expect(entries_).toBeDefined();
                                expect(entries_ instanceof Array).toBe(true);
                                expect(entries_.length).toBe(0);
                                //Clean up
                                deleteEntry(entry.name, done);
                            }, failed.bind(null, done, 'reader.readEntries - Error during SECOND reading of entries from [root] directory'));
                        }, failed.bind(null, done, 'reader.readEntries - Error during FIRST reading of entries from [root] directory'));
                    }, failed.bind(null, done, 'root.getFile - Error creating file : ' + fileName));
                });
            });
            it("file.spec.38 should read contents of directory that has been removed", function (done) {
                var dirName = "de.createReader.notfound",
                dirPath = joinURL(root.fullPath, dirName);
                // create a new directory entry to kick off it
                root.getDirectory(dirName, {
                    create : true
                }, function (directory) {
                    directory.removeRecursively(function () {
                        var reader = directory.createReader();
                        reader.readEntries(succeed.bind(null, done, 'reader.readEntries - Unexpected success callback, it should not read entries from deleted dir: ' + dirName), function (error) {
                            expect(error).toBeDefined();
                            expect(error).toBeFileError(FileError.NOT_FOUND_ERR);
                            root.getDirectory(dirName, {
                                create : false
                            }, succeed.bind(null, done, 'root.getDirectory - Unexpected success callback, it should not get deleted directory: ' + dirName), function (err) {
                                expect(err).toBeDefined();
                                expect(err).toBeFileError(FileError.NOT_FOUND_ERR);
                                done();
                            });
                        });
                    }, failed.bind(null, done, 'directory.removeRecursively - Error removing directory recursively : ' + dirName));
                }, failed.bind(null, done, 'root.getDirectory - Error creating directory : ' + dirName));
            });
        });
        //DirectoryReader interface
        describe('File', function () {
            it("file.spec.39 constructor should be defined", function () {
                expect(File).toBeDefined();
                expect(typeof File).toBe('function');
            });
            it("file.spec.40 should be define File attributes", function () {
                var file = new File();
                expect(file.name).toBeDefined();
                expect(file.type).toBeDefined();
                expect(file.lastModifiedDate).toBeDefined();
                expect(file.size).toBeDefined();
            });
        });
        //File
        describe('FileEntry', function () {

            it("file.spec.41 should be define FileEntry methods", function (done) {
                var fileName = "fe.methods",
                testFileEntry = function (fileEntry) {
                    expect(fileEntry).toBeDefined();
                    expect(typeof fileEntry.createWriter).toBe('function');
                    expect(typeof fileEntry.file).toBe('function');
                    // cleanup
                    deleteEntry(fileEntry.name, done);
                };
                // create a new file entry to kick off it
                root.getFile(fileName, {
                    create : true
                }, testFileEntry, failed.bind(null, done, 'root.getFile - Error creating file : ' + fileName));
            });
            it("file.spec.42 createWriter should return a FileWriter object", function (done) {
                var fileName = "fe.createWriter",
                testFile,
                testWriter = function (writer) {
                    expect(writer).toBeDefined();
                    if (isChrome) {
                        // Slicing '[object {type}]' -> '{type}'
                        expect(writer.toString().slice(8, -1)).toEqual("FileWriter");
                    }
                    else {
                        expect(writer instanceof FileWriter).toBe(true);
                    }

                    // cleanup
                    deleteEntry(testFile.name, done);
                };
                // create a new file entry to kick off it
                root.getFile(fileName, {
                    create : true
                }, function (fileEntry) {
                    testFile = fileEntry;
                    fileEntry.createWriter(testWriter, failed.bind(null, done, 'fileEntry.createWriter - Error creating Writer from entry'));
                }, failed.bind(null, done, 'root.getFile - Error creating file : ' + fileName));
            });
            it("file.spec.43 file should return a File object", function (done) {
                var fileName = "fe.file",
                newFile,
                testFile = function (file) {
                    expect(file).toBeDefined();
                    if (isChrome) {
                        // Slicing '[object {type}]' -> '{type}'
                        expect(file.toString().slice(8, -1)).toEqual("File");
                    }
                    else {
                        expect(file instanceof File).toBe(true);
                    }

                    // cleanup
                    deleteEntry(newFile.name, done);
                };
                // create a new file entry to kick off it
                root.getFile(fileName, {
                    create : true
                }, function (fileEntry) {
                    newFile = fileEntry;
                    fileEntry.file(testFile, failed.bind(null, done, 'fileEntry.file - Error reading file using fileEntry: ' + fileEntry.name));
                }, failed.bind(null, done, 'root.getFile - Error creating file : ' + fileName));
            });
            it("file.spec.44 file: on File that has been removed", function (done) {
                var fileName = "fe.no.file";
                // create a new file entry to kick off it
                root.getFile(fileName, {
                    create : true
                }, function (fileEntry) {
                    fileEntry.remove(function () {
                        fileEntry.file(succeed.bind(null, done, 'fileEntry.file - Unexpected success callback, file it should not be created from removed entry'), function (error) {
                            expect(error).toBeDefined();
                            expect(error).toBeFileError(FileError.NOT_FOUND_ERR);
                            done();
                        });
                    }, failed.bind(null, done, 'fileEntry.remove - Error removing entry : ' + fileName));
                }, failed.bind(null, done, 'root.getFile - Error creating file : ' + fileName));
            });
        });
        //FileEntry
        describe('Entry', function () {
            it("file.spec.45 Entry object", function (done) {
                var fileName = "entry",
                fullPath = joinURL(root.fullPath, fileName),
                winEntry = function (entry) {
                    expect(entry).toBeDefined();
                    expect(entry.isFile).toBe(true);
                    expect(entry.isDirectory).toBe(false);
                    expect(entry.name).toCanonicallyMatch(fileName);
                    expect(entry.fullPath).toCanonicallyMatch(fullPath);
                    expect(typeof entry.getMetadata).toBe('function');
                    expect(typeof entry.setMetadata).toBe('function');
                    expect(typeof entry.moveTo).toBe('function');
                    expect(typeof entry.copyTo).toBe('function');
                    expect(typeof entry.toURL).toBe('function');
                    expect(typeof entry.remove).toBe('function');
                    expect(typeof entry.getParent).toBe('function');
                    expect(typeof entry.createWriter).toBe('function');
                    expect(typeof entry.file).toBe('function');
                    // Clean up
                    deleteEntry(fileName, done);
                };
                // create a new file entry
                createFile(fileName, winEntry, failed.bind(null, done, 'createFile - Error creating file : ' + fileName));
            });
            it("file.spec.46 Entry.getMetadata on file", function (done) {
                var fileName = "entry.metadata.file";
                // create a new file entry
                createFile(fileName, function (entry) {
                    entry.getMetadata(function (metadata) {
                        expect(metadata).toBeDefined();
                        expect(metadata.modificationTime instanceof Date).toBe(true);
                        expect(typeof metadata.size).toBe("number");
                        // cleanup
                        deleteEntry(fileName, done);
                    }, failed.bind(null, done, 'entry.getMetadata - Error getting metadata from entry : ' + fileName));
                }, failed.bind(null, done, 'createFile - Error creating file : ' + fileName));
            });
            it("file.spec.47 Entry.getMetadata on directory", function (done) {
                if (isIndexedDBShim) {
                    /* Does not support metadata for directories (Firefox, IE) */
                    pending();
                }

                var dirName = "entry.metadata.dir";
                // create a new directory entry
                createDirectory(dirName, function (entry) {
                    entry.getMetadata(function (metadata) {
                        expect(metadata).toBeDefined();
                        expect(metadata.modificationTime instanceof Date).toBe(true);
                        expect(typeof metadata.size).toBe("number");
                        expect(metadata.size).toBe(0);
                        // cleanup
                        deleteEntry(dirName, done);
                    }, failed.bind(null, done, 'entry.getMetadata - Error getting metadata from entry : ' + dirName));
                }, failed.bind(null, done, 'createDirectory - Error creating directory : ' + dirName));
            });
            it("file.spec.48 Entry.getParent on file in root file system", function (done) {
                var fileName = "entry.parent.file",
                rootPath = root.fullPath;
                // create a new file entry
                createFile(fileName, function (entry) {
                    entry.getParent(function (parent) {
                        expect(parent).toBeDefined();
                        expect(parent.fullPath).toCanonicallyMatch(rootPath);
                        // cleanup
                        deleteEntry(fileName, done);
                    }, failed.bind(null, done, 'entry.getParent - Error getting parent directory of file : ' + fileName));
                }, failed.bind(null, done, 'createFile - Error creating file : ' + fileName));
            });
            it("file.spec.49 Entry.getParent on directory in root file system", function (done) {
                var dirName = "entry.parent.dir",
                rootPath = root.fullPath;
                // create a new directory entry
                createDirectory(dirName, function (entry) {
                    entry.getParent(function (parent) {
                        expect(parent).toBeDefined();
                        expect(parent.fullPath).toCanonicallyMatch(rootPath);
                        // cleanup
                        deleteEntry(dirName, done);
                    }, failed.bind(null, done, 'entry.getParent - Error getting parent directory of directory : ' + dirName));
                }, failed.bind(null, done, 'createDirectory - Error creating directory : ' + dirName));
            });
            it("file.spec.50 Entry.getParent on root file system", function (done) {
                var rootPath = root.fullPath,
                winParent = function (parent) {
                    expect(parent).toBeDefined();
                    expect(parent.fullPath).toCanonicallyMatch(rootPath);
                    done();
                };
                // create a new directory entry
                root.getParent(winParent, failed.bind(null, done, 'root.getParent - Error getting parent directory of root'));
            });
            it("file.spec.51 Entry.toURL on file", function (done) {
                var fileName = "entry.uri.file",
                rootPath = root.fullPath,
                winURI = function (entry) {
                    var uri = entry.toURL();
                    expect(uri).toBeDefined();
                    expect(uri.indexOf(rootPath)).not.toBe(-1);
                    // cleanup
                    deleteEntry(fileName, done);
                };
                // create a new file entry
                createFile(fileName, winURI, failed.bind(null, done, 'createFile - Error creating file : ' + fileName));
            });
            it("file.spec.52 Entry.toURL on directory", function (done) {
                var dirName_1 = "num 1",
                dirName_2 = "num 2",
                rootPath = root.fullPath;
                createDirectory(dirName_1, function (entry) {
                    entry.getDirectory(dirName_2, {
                        create : true
                    }, function (entryFile) {
                        var uri = entryFile.toURL();
                        expect(uri).toBeDefined();
                        expect(uri).toContain('/num%201/num%202/');
                        expect(uri.indexOf(rootPath)).not.toBe(-1);
                        // cleanup
                        deleteEntry(dirName_1, done);
                    }, failed.bind(null, done, 'entry.getDirectory - Error creating directory : ' + dirName_2));
                }, failed.bind(null, done, 'createDirectory - Error creating directory : ' + dirName_1));
            });
            it("file.spec.53 Entry.remove on file", function (done) {
                var fileName = "entr .rm.file";
                // create a new file entry
                createFile(fileName, function (entry) {
                    expect(entry).toBeDefined();
                    entry.remove(function () {
                        root.getFile(fileName, null, succeed.bind(null, done, 'root.getFile - Unexpected success callback, it should not get deleted file : ' + fileName), function (error) {
                            expect(error).toBeDefined();
                            expect(error).toBeFileError(FileError.NOT_FOUND_ERR);
                            // cleanup
                            deleteEntry(fileName, done);
                        });
                    }, failed.bind(null, done, 'entry.remove - Error removing entry : ' + fileName));
                }, failed.bind(null, done, 'createFile - Error creating file : ' + fileName));
            });
            it("file.spec.53.1 Entry.remove on filename with #s", function (done) {
                var fileName = "entry.#rm#.file";
                // create a new file entry
                createFile(fileName, function (entry) {
                    expect(entry).toBeDefined();
                    entry.remove(function () {
                        root.getFile(fileName, null, succeed.bind(null, done, 'root.getFile - Unexpected success callback, it should not get deleted file : ' + fileName), function (error) {
                            expect(error).toBeDefined();
                            expect(error).toBeFileError(FileError.NOT_FOUND_ERR);
                            // cleanup
                            deleteEntry(fileName, done);
                        });
                    }, failed.bind(null, done, 'entry.remove - Error removing entry : ' + fileName));
                }, failed.bind(null, done, 'createFile - Error creating file : ' + fileName));
            });
            it("file.spec.54 remove on empty directory", function (done) {
                var dirName = "entry.rm.dir";
                // create a new directory entry
                createDirectory(dirName, function (entry) {
                    expect(entry).toBeDefined();
                    entry.remove(function () {
                        root.getDirectory(dirName, null, succeed.bind(null, done, 'root.getDirectory - Unexpected success callback, it should not get deleted directory : ' + dirName), function (error) {
                            expect(error).toBeDefined();
                            expect(error).toBeFileError(FileError.NOT_FOUND_ERR);
                            // cleanup
                            deleteEntry(dirName, done);
                        });
                    }, failed.bind(null, done, 'entry.remove - Error removing entry : ' + dirName));
                }, failed.bind(null, done, 'createDirectory - Error creating directory : ' + dirName));
            });
            it("file.spec.55 remove on non-empty directory", function (done) {
                if (isIndexedDBShim) {
                    /* Both Entry.remove and directoryEntry.removeRecursively don't fail when removing
                    non-empty directories - directories being removed are cleaned
                    along with contents instead (Firefox, IE)*/
                    pending();
                }

                var dirName = "ent y.rm.dir.not.empty",
                fileName = "re ove.txt",
                fullPath = joinURL(root.fullPath, dirName);
                // create a new directory entry
                createDirectory(dirName, function (entry) {
                    entry.getFile(fileName, {
                        create : true
                    }, function (fileEntry) {
                        entry.remove(succeed.bind(null, done, 'entry.remove - Unexpected success callback, it should not remove a directory that contains files : ' + dirName), function (error) {
                            expect(error).toBeDefined();
                            expect(error).toBeFileError(FileError.INVALID_MODIFICATION_ERR);
                            root.getDirectory(dirName, null, function (entry) {
                                expect(entry).toBeDefined();
                                expect(entry.fullPath).toCanonicallyMatch(fullPath);
                                // cleanup
                                deleteEntry(dirName, done);
                            }, failed.bind(null, done, 'root.getDirectory - Error getting directory : ' + dirName));
                        });
                    }, failed.bind(null, done, 'entry.getFile - Error creating file : ' + fileName + ' inside of ' + dirName));
                }, failed.bind(null, done, 'createDirectory - Error creating directory : ' + dirName));
            });
            it("file.spec.56 remove on root file system", function (done) {

                // remove entry that doesn't exist
                root.remove(succeed.bind(null, done, 'entry.remove - Unexpected success callback, it should not remove entry that it does not exists'), function (error) {
                    expect(error).toBeDefined();
                    if (isChrome) {
                        /*INVALID_MODIFICATION_ERR (code: 9) is thrown instead of
                        NO_MODIFICATION_ALLOWED_ERR(code: 6) on trying to call removeRecursively
                        on the root file system.*/
                        expect(error).toBeFileError(FileError.INVALID_MODIFICATION_ERR);
                    } else {
                        expect(error).toBeFileError(FileError.NO_MODIFICATION_ALLOWED_ERR);
                    }
                    done();
                });
            });
            it("file.spec.57 copyTo: file", function (done) {
                var file1 = "entry copy.file1",
                file2 = "entry copy.file2",
                fullPath = joinURL(root.fullPath, file2);
                // create a new file entry to kick off it
                deleteEntry(file2, function () {
                    createFile(file1, function (fileEntry) {
                        // copy file1 to file2
                        fileEntry.copyTo(root, file2, function (entry) {
                            expect(entry).toBeDefined();
                            expect(entry.isFile).toBe(true);
                            expect(entry.isDirectory).toBe(false);
                            expect(entry.fullPath).toCanonicallyMatch(fullPath);
                            expect(entry.name).toCanonicallyMatch(file2);
                            root.getFile(file2, {
                                create : false
                            }, function (entry2) {
                                expect(entry2).toBeDefined();
                                expect(entry2.isFile).toBe(true);
                                expect(entry2.isDirectory).toBe(false);
                                expect(entry2.fullPath).toCanonicallyMatch(fullPath);
                                expect(entry2.name).toCanonicallyMatch(file2);
                                // cleanup
                                deleteEntry(file1, function () {
                                    deleteEntry(file2, done);
                                });
                            }, failed.bind(null, done, 'root.getFile - Error getting copied file : ' + file2));
                        }, failed.bind(null, done, 'fileEntry.copyTo - Error copying file : ' + file2));
                    }, failed.bind(null, done, 'createFile - Error creating file : ' + file1));
                }, failed.bind(null, done, 'deleteEntry - Error removing file : ' + file2));
            });
            it("file.spec.58 copyTo: file onto itself", function (done) {
                var file1 = "entry.copy.fos.file1";
                // create a new file entry to kick off it
                createFile(file1, function (entry) {
                    // copy file1 onto itself
                    entry.copyTo(root, null, succeed.bind(null, done, 'entry.copyTo - Unexpected success callback, it should not copy a null file'), function (error) {
                        expect(error).toBeDefined();
                        expect(error).toBeFileError(FileError.INVALID_MODIFICATION_ERR);
                        // cleanup
                        deleteEntry(file1, done);
                    });
                }, failed.bind(null, done, 'createFile - Error creating file : ' + file1));
            });
            it("file.spec.59 copyTo: directory", function (done) {
                if (isIndexedDBShim) {
                    /* `copyTo` and `moveTo` functions do not support directories (Firefox, IE) */
                    pending();
                }

                var file1 = "file1",
                srcDir = "entry.copy.srcDir",
                dstDir = "entry.copy.dstDir",
                dstPath = joinURL(root.fullPath, dstDir),
                filePath = joinURL(dstPath, file1);
                // create a new directory entry to kick off it
                deleteEntry(dstDir, function () {
                    createDirectory(srcDir, function (directory) {
                        // create a file within new directory
                        directory.getFile(file1, {
                            create : true
                        }, function () {
                            directory.copyTo(root, dstDir, function (directory) {
                                expect(directory).toBeDefined();
                                expect(directory.isFile).toBe(false);
                                expect(directory.isDirectory).toBe(true);
                                expect(directory.fullPath).toCanonicallyMatch(dstPath);
                                expect(directory.name).toCanonicallyMatch(dstDir);
                                root.getDirectory(dstDir, {
                                    create : false
                                }, function (dirEntry) {
                                    expect(dirEntry).toBeDefined();
                                    expect(dirEntry.isFile).toBe(false);
                                    expect(dirEntry.isDirectory).toBe(true);
                                    expect(dirEntry.fullPath).toCanonicallyMatch(dstPath);
                                    expect(dirEntry.name).toCanonicallyMatch(dstDir);
                                    dirEntry.getFile(file1, {
                                        create : false
                                    }, function (fileEntry) {
                                        expect(fileEntry).toBeDefined();
                                        expect(fileEntry.isFile).toBe(true);
                                        expect(fileEntry.isDirectory).toBe(false);
                                        expect(fileEntry.fullPath).toCanonicallyMatch(filePath);
                                        expect(fileEntry.name).toCanonicallyMatch(file1);
                                        // cleanup
                                        deleteEntry(srcDir, function () {
                                            deleteEntry(dstDir, done);
                                        });
                                    }, failed.bind(null, done, 'dirEntry.getFile - Error getting file : ' + file1));
                                }, failed.bind(null, done, 'root.getDirectory - Error getting copied directory : ' + dstDir));
                            }, failed.bind(null, done, 'directory.copyTo - Error copying directory : ' + srcDir + ' to :' + dstDir));
                        }, failed.bind(null, done, 'directory.getFile - Error creating file : ' + file1));
                    }, failed.bind(null, done, 'createDirectory - Error creating directory : ' + srcDir));
                }, failed.bind(null, done, 'deleteEntry - Error removing directory : ' + dstDir));
            });
            it("file.spec.60 copyTo: directory to backup at same root directory", function (done) {
                if (isIndexedDBShim) {
                    /* `copyTo` and `moveTo` functions do not support directories (Firefox, IE) */
                    pending();
                }

                var file1 = "file1",
                srcDir = "entry.copy srcDirSame",
                dstDir = "entry.copy srcDirSame-backup",
                dstPath = joinURL(root.fullPath, dstDir),
                filePath = joinURL(dstPath, file1);
                // create a new directory entry to kick off it
                deleteEntry(dstDir, function () {
                    createDirectory(srcDir, function (directory) {
                        directory.getFile(file1, {
                            create : true
                        }, function () {
                            directory.copyTo(root, dstDir, function (directory) {
                                expect(directory).toBeDefined();
                                expect(directory.isFile).toBe(false);
                                expect(directory.isDirectory).toBe(true);
                                expect(directory.fullPath).toCanonicallyMatch(dstPath);
                                expect(directory.name).toCanonicallyMatch(dstDir);
                                root.getDirectory(dstDir, {
                                    create : false
                                }, function (dirEntry) {
                                    expect(dirEntry).toBeDefined();
                                    expect(dirEntry.isFile).toBe(false);
                                    expect(dirEntry.isDirectory).toBe(true);
                                    expect(dirEntry.fullPath).toCanonicallyMatch(dstPath);
                                    expect(dirEntry.name).toCanonicallyMatch(dstDir);
                                    dirEntry.getFile(file1, {
                                        create : false
                                    }, function (fileEntry) {
                                        expect(fileEntry).toBeDefined();
                                        expect(fileEntry.isFile).toBe(true);
                                        expect(fileEntry.isDirectory).toBe(false);
                                        expect(fileEntry.fullPath).toCanonicallyMatch(filePath);
                                        expect(fileEntry.name).toCanonicallyMatch(file1);
                                        // cleanup
                                        deleteEntry(srcDir, function () {
                                            deleteEntry(dstDir, done);
                                        });
                                    }, failed.bind(null, done, 'dirEntry.getFile - Error getting file : ' + file1));
                                }, failed.bind(null, done, 'root.getDirectory - Error getting copied directory : ' + dstDir));
                            }, failed.bind(null, done, 'directory.copyTo - Error copying directory : ' + srcDir + ' to :' + dstDir));
                        }, failed.bind(null, done, 'directory.getFile - Error creating file : ' + file1));
                    }, failed.bind(null, done, 'createDirectory - Error creating directory : ' + srcDir));
                }, failed.bind(null, done, 'deleteEntry - Error removing directory : ' + dstDir));
            });
            it("file.spec.61 copyTo: directory onto itself", function (done) {
                if (isIndexedDBShim) {
                    /* `copyTo` and `moveTo` functions do not support directories (Firefox, IE) */
                    pending();
                }

                var file1 = "file1",
                srcDir = "entry.copy.dos.srcDir",
                srcPath = joinURL(root.fullPath, srcDir),
                filePath = joinURL(srcPath, file1);
                // create a new directory entry to kick off it
                createDirectory(srcDir, function (directory) {
                    // create a file within new directory
                    directory.getFile(file1, {
                        create : true
                    }, function (fileEntry) {
                        // copy srcDir onto itself
                        directory.copyTo(root, null, succeed.bind(null, done, 'directory.copyTo - Unexpected success callback, it should not copy file: ' + srcDir + ' to a null destination'), function (error) {
                            expect(error).toBeDefined();
                            expect(error).toBeFileError(FileError.INVALID_MODIFICATION_ERR);
                            root.getDirectory(srcDir, {
                                create : false
                            }, function (dirEntry) {
                                expect(dirEntry).toBeDefined();
                                expect(dirEntry.fullPath).toCanonicallyMatch(srcPath);
                                dirEntry.getFile(file1, {
                                    create : false
                                }, function (fileEntry) {
                                    expect(fileEntry).toBeDefined();
                                    expect(fileEntry.fullPath).toCanonicallyMatch(filePath);
                                    // cleanup
                                    deleteEntry(srcDir, done);
                                }, failed.bind(null, done, 'dirEntry.getFile - Error getting file : ' + file1));
                            }, failed.bind(null, done, 'root.getDirectory - Error getting directory : ' + srcDir));
                        });
                    }, failed.bind(null, done, 'directory.getFile - Error creating file : ' + file1));
                }, failed.bind(null, done, 'createDirectory - Error creating directory : ' + srcDir));
            });
            it("file.spec.62 copyTo: directory into itself", function (done) {
                if (isIndexedDBShim) {
                    /* `copyTo` and `moveTo` functions do not support directories (Firefox, IE) */
                    pending();
                }

                var srcDir = "entry.copy.dis.srcDir",
                dstDir = "entry.copy.dis.dstDir",
                srcPath = joinURL(root.fullPath, srcDir);
                // create a new directory entry to kick off it
                createDirectory(srcDir, function (directory) {
                    // copy source directory into itself
                    directory.copyTo(directory, dstDir, succeed.bind(null, done, 'directory.copyTo - Unexpected success callback, it should not copy a directory ' + srcDir + ' into itself'), function (error) {
                        expect(error).toBeDefined();
                        expect(error).toBeFileError(FileError.INVALID_MODIFICATION_ERR);
                        root.getDirectory(srcDir, {
                            create : false
                        }, function (dirEntry) {
                            // returning confirms existence so just check fullPath entry
                            expect(dirEntry).toBeDefined();
                            expect(dirEntry.fullPath).toCanonicallyMatch(srcPath);
                            // cleanup
                            deleteEntry(srcDir, done);
                        }, failed.bind(null, done, 'root.getDirectory - Error getting directory : ' + srcDir));
                    });
                }, failed.bind(null, done, 'createDirectory - Error creating directory : ' + srcDir));
            });
            it("file.spec.63 copyTo: directory that does not exist", function (done) {
                var file1 = "entry.copy.dnf.file1",
                dirName = 'dir-foo';
                createFile(file1, function (fileEntry) {
                    createDirectory(dirName, function (dirEntry) {
                        dirEntry.remove(function () {
                            fileEntry.copyTo(dirEntry, null, succeed.bind(null, done, 'fileEntry.copyTo - Unexpected success callback, it should not copy a file ' + file1 + ' into a removed directory'), function (error) {
                                expect(error).toBeDefined();
                                expect(error).toBeFileError(FileError.NOT_FOUND_ERR);
                                done();
                            });
                        }, failed.bind(null, done, 'dirEntry.remove - Error removing directory : ' + dirName));
                    }, failed.bind(null, done, 'createDirectory - Error creating directory : ' + dirName));
                }, failed.bind(null, done, 'createFile - Error creating file : ' + file1));
            });
            it("file.spec.64 copyTo: invalid target name", function (done) {
                if (isBrowser) {
                    /*The plugin does not follow ["8.3 Naming restrictions"]
                    (http://www.w3.org/TR/2011/WD-file-system-api-20110419/#naming-restrictions*/
                    pending();
                }

                var file1 = "entry.copy.itn.file1",
                file2 = "bad:file:name";
                // create a new file entry
                createFile(file1, function (entry) {
                    // copy file1 to file2
                    entry.copyTo(root, file2, succeed.bind(null, done, 'entry.copyTo - Unexpected success callback, it should not copy a file ' + file1 + ' to an invalid file name: ' + file2), function (error) {
                        expect(error).toBeDefined();
                        expect(error).toBeFileError(FileError.ENCODING_ERR);
                        // cleanup
                        deleteEntry(file1, done);
                    });
                }, failed.bind(null, done, 'createFile - Error creating file : ' + file1));
            });
            it("file.spec.65 moveTo: file to same parent", function (done) {
                var file1 = "entry.move.fsp.file1",
                file2 = "entry.move.fsp.file2",
                dstPath = joinURL(root.fullPath, file2);
                // create a new file entry to kick off it
                createFile(file1, function (entry) {
                    // move file1 to file2
                    entry.moveTo(root, file2, function (entry) {
                        expect(entry).toBeDefined();
                        expect(entry.isFile).toBe(true);
                        expect(entry.isDirectory).toBe(false);
                        expect(entry.fullPath).toCanonicallyMatch(dstPath);
                        expect(entry.name).toCanonicallyMatch(file2);
                        root.getFile(file2, {
                            create : false
                        }, function (fileEntry) {
                            expect(fileEntry).toBeDefined();
                            expect(fileEntry.fullPath).toCanonicallyMatch(dstPath);
                            root.getFile(file1, {
                                create : false
                            }, succeed.bind(null, done, 'root.getFile - Unexpected success callback, it should not get invalid or moved file: ' + file1), function (error) {
                                //expect(navigator.fileMgr.testFileExists(srcPath) === false, "original file should not exist.");
                                expect(error).toBeDefined();
                                expect(error).toBeFileError(FileError.NOT_FOUND_ERR);
                                // cleanup
                                deleteEntry(file1, function () {
                                    deleteEntry(file2, done);
                                });
                            });
                        }, failed.bind(null, done, 'root.getFile - Error getting file : ' + file2));
                    }, failed.bind(null, done, 'entry.moveTo - Error moving file : ' + file1 + ' to root as: ' + file2));
                }, failed.bind(null, done, 'createFile - Error creating file : ' + file1));
            });
            it("file.spec.66 moveTo: file to new parent", function (done) {
                var file1 = "entry.move.fnp.file1",
                dir = "entry.move.fnp.dir",
                dstPath = joinURL(joinURL(root.fullPath, dir), file1);
                // ensure destination directory is cleaned up first
                deleteEntry(dir, function () {
                    // create a new file entry to kick off it
                    createFile(file1, function (entry) {
                        // create a parent directory to move file to
                        root.getDirectory(dir, {
                            create : true
                        }, function (directory) {
                            // move file1 to new directory
                            // move the file
                            entry.moveTo(directory, null, function (entry) {
                                expect(entry).toBeDefined();
                                expect(entry.isFile).toBe(true);
                                expect(entry.isDirectory).toBe(false);
                                expect(entry.fullPath).toCanonicallyMatch(dstPath);
                                expect(entry.name).toCanonicallyMatch(file1);
                                // test the moved file exists
                                directory.getFile(file1, {
                                    create : false
                                }, function (fileEntry) {
                                    expect(fileEntry).toBeDefined();
                                    expect(fileEntry.fullPath).toCanonicallyMatch(dstPath);
                                    root.getFile(file1, {
                                        create : false
                                    }, succeed.bind(null, done, 'root.getFile - Unexpected success callback, it should not get invalid or moved file: ' + file1), function (error) {
                                        expect(error).toBeDefined();
                                        expect(error).toBeFileError(FileError.NOT_FOUND_ERR);
                                        // cleanup
                                        deleteEntry(file1, function () {
                                            deleteEntry(dir, done);
                                        });
                                    });
                                }, failed.bind(null, done, 'directory.getFile - Error getting file : ' + file1 + ' from: ' + dir));
                            }, failed.bind(null, done, 'entry.moveTo - Error moving file : ' + file1 + ' to: ' + dir + ' with the same name'));
                        }, failed.bind(null, done, 'root.getDirectory - Error creating directory : ' + dir));
                    }, failed.bind(null, done, 'createFile - Error creating file : ' + file1));
                }, failed.bind(null, done, 'deleteEntry - Error removing directory : ' + dir));
            });
            it("file.spec.67 moveTo: directory to same parent", function (done) {
                if (isIndexedDBShim) {
                    /* `copyTo` and `moveTo` functions do not support directories (Firefox, IE) */
                    pending();
                }

                var file1 = "file1",
                srcDir = "entry.move.dsp.srcDir",
                dstDir = "entry.move.dsp.dstDir",
                srcPath = joinURL(root.fullPath, srcDir),
                dstPath = joinURL(root.fullPath, dstDir),
                filePath = joinURL(dstPath, file1);
                // ensure destination directory is cleaned up before it
                deleteEntry(dstDir, function () {
                    // create a new directory entry to kick off it
                    createDirectory(srcDir, function (directory) {
                        // create a file within directory
                        directory.getFile(file1, {
                            create : true
                        }, function () {
                            // move srcDir to dstDir
                            directory.moveTo(root, dstDir, function (directory) {
                                expect(directory).toBeDefined();
                                expect(directory.isFile).toBe(false);
                                expect(directory.isDirectory).toBe(true);
                                expect(directory.fullPath).toCanonicallyMatch(dstPath);
                                expect(directory.name).toCanonicallyMatch(dstDir);
                                // test that moved file exists in destination dir
                                directory.getFile(file1, {
                                    create : false
                                }, function (fileEntry) {
                                    expect(fileEntry).toBeDefined();
                                    expect(fileEntry.fullPath).toCanonicallyMatch(filePath);
                                    // check that the moved file no longer exists in original dir
                                    root.getFile(file1, {
                                        create : false
                                    }, succeed.bind(null, done, 'directory.getFile - Unexpected success callback, it should not get invalid or moved file: ' + file1), function (error) {
                                        expect(error).toBeDefined();
                                        expect(error).toBeFileError(FileError.NOT_FOUND_ERR);
                                        // cleanup
                                        deleteEntry(srcDir, function() {
                                            deleteEntry(dstDir, done);
                                        });
                                    });
                                }, failed.bind(null, done, 'directory.getFile - Error getting file : ' + file1 + ' from: ' + srcDir));
                            }, failed.bind(null, done, 'entry.moveTo - Error moving directory : ' + srcDir + ' to root as: ' + dstDir));
                        }, failed.bind(null, done, 'directory.getFile - Error creating file : ' + file1));
                    }, failed.bind(null, done, 'createDirectory - Error creating directory : ' + srcDir));
                }, failed.bind(null, done, 'deleteEntry - Error removing directory : ' + dstDir));
            });
            it("file.spec.68 moveTo: directory to same parent with same name", function (done) {
                if (isIndexedDBShim) {
                    /* `copyTo` and `moveTo` functions do not support directories (Firefox, IE) */
                    pending();
                }

                var file1 = "file1",
                srcDir = "entry.move.dsp.srcDir",
                dstDir = "entry.move.dsp.srcDir-backup",
                srcPath = joinURL(root.fullPath, srcDir),
                dstPath = joinURL(root.fullPath, dstDir),
                filePath = joinURL(dstPath, file1);
                // ensure destination directory is cleaned up before it
                deleteEntry(dstDir, function () {
                    // create a new directory entry to kick off it
                    createDirectory(srcDir, function (directory) {
                        // create a file within directory
                        directory.getFile(file1, {
                            create : true
                        }, function () {
                            // move srcDir to dstDir
                            directory.moveTo(root, dstDir, function (directory) {
                                expect(directory).toBeDefined();
                                expect(directory.isFile).toBe(false);
                                expect(directory.isDirectory).toBe(true);
                                expect(directory.fullPath).toCanonicallyMatch(dstPath);
                                expect(directory.name).toCanonicallyMatch(dstDir);
                                // check that moved file exists in destination dir
                                directory.getFile(file1, {
                                    create : false
                                }, function (fileEntry) {
                                    expect(fileEntry).toBeDefined();
                                    expect(fileEntry.fullPath).toCanonicallyMatch(filePath);
                                    // check that the moved file no longer exists in original dir
                                    root.getFile(file1, {
                                        create : false
                                    }, succeed.bind(null, done, 'directory.getFile - Unexpected success callback, it should not get invalid or moved file: ' + file1), function (error) {
                                        expect(error).toBeDefined();
                                        expect(error).toBeFileError(FileError.NOT_FOUND_ERR);
                                        // cleanup
                                        deleteEntry(srcDir, function() {
                                            deleteEntry(dstDir, done);
                                        });
                                    });
                                }, failed.bind(null, done, 'directory.getFile - Error getting file : ' + file1 + ' from: ' + srcDir));
                            }, failed.bind(null, done, 'entry.moveTo - Error moving directory : ' + srcDir + ' to root as: ' + dstDir));
                        }, failed.bind(null, done, 'directory.getFile - Error creating file : ' + file1));
                    }, failed.bind(null, done, 'createDirectory - Error creating directory : ' + srcDir));
                }, failed.bind(null, done, 'deleteEntry - Error removing directory : ' + dstDir));
            });
            it("file.spec.69 moveTo: directory to new parent", function (done) {
                if (isIndexedDBShim) {
                    /* `copyTo` and `moveTo` functions do not support directories (Firefox, IE) */
                    pending();
                }

                var file1 = "file1",
                srcDir = "entry.move.dnp.srcDir",
                dstDir = "entry.move.dnp.dstDir",
                srcPath = joinURL(root.fullPath, srcDir),
                dstPath = joinURL(root.fullPath, dstDir),
                filePath = joinURL(dstPath, file1);
                // ensure destination directory is cleaned up before it
                deleteEntry(dstDir, function () {
                    // create a new directory entry to kick off it
                    createDirectory(srcDir, function (directory) {
                        // create a file within directory
                        directory.getFile(file1, {
                            create : true
                        }, function () {
                            // move srcDir to dstDir
                            directory.moveTo(root, dstDir, function (dirEntry) {
                                expect(dirEntry).toBeDefined();
                                expect(dirEntry.isFile).toBe(false);
                                expect(dirEntry.isDirectory).toBe(true);
                                expect(dirEntry.fullPath).toCanonicallyMatch(dstPath);
                                expect(dirEntry.name).toCanonicallyMatch(dstDir);
                                // test that moved file exists in destination dir
                                dirEntry.getFile(file1, {
                                    create : false
                                }, function (fileEntry) {
                                    expect(fileEntry).toBeDefined();
                                    expect(fileEntry.fullPath).toCanonicallyMatch(filePath);
                                    // test that the moved file no longer exists in original dir
                                    root.getFile(file1, {
                                        create : false
                                    }, succeed.bind(null, done, 'root.getFile - Unexpected success callback, it should not get invalid or moved file: ' + file1), function (error) {
                                        expect(error).toBeDefined();
                                        expect(error).toBeFileError(FileError.NOT_FOUND_ERR);
                                        // cleanup
                                        deleteEntry(srcDir, function() {
                                            deleteEntry(dstDir, done);
                                        });
                                    });
                                }, failed.bind(null, done, 'directory.getFile - Error getting file : ' + file1 + ' from: ' + dstDir));
                            }, failed.bind(null, done, 'directory.moveTo - Error moving directory : ' + srcDir + ' to root as: ' + dstDir));
                        }, failed.bind(null, done, 'directory.getFile - Error creating file : ' + file1));
                    }, failed.bind(null, done, 'createDirectory - Error creating directory : ' + srcDir));
                }, failed.bind(null, done, 'deleteEntry - Error removing directory : ' + dstDir));
            });
            it("file.spec.70 moveTo: directory onto itself", function (done) {
                if (isIndexedDBShim) {
                    /* `copyTo` and `moveTo` functions do not support directories (Firefox, IE) */
                    pending();
                }

                var file1 = "file1",
                srcDir = "entry.move.dos.srcDir",
                srcPath = joinURL(root.fullPath, srcDir),
                filePath = joinURL(srcPath, file1);
                // create a new directory entry to kick off it
                createDirectory(srcDir, function (directory) {
                    // create a file within new directory
                    directory.getFile(file1, {
                        create : true
                    }, function () {
                        // move srcDir onto itself
                        directory.moveTo(root, null, succeed.bind(null, done, 'directory.moveTo - Unexpected success callback, it should not move directory to invalid path'), function (error) {
                            expect(error).toBeDefined();
                            expect(error).toBeFileError(FileError.INVALID_MODIFICATION_ERR);
                            // test that original dir still exists
                            root.getDirectory(srcDir, {
                                create : false
                            }, function (dirEntry) {
                                // returning confirms existence so just check fullPath entry
                                expect(dirEntry).toBeDefined();
                                expect(dirEntry.fullPath).toCanonicallyMatch(srcPath);
                                dirEntry.getFile(file1, {
                                    create : false
                                }, function (fileEntry) {
                                    expect(fileEntry).toBeDefined();
                                    expect(fileEntry.fullPath).toCanonicallyMatch(filePath);
                                    // cleanup
                                    deleteEntry(srcDir, done);
                                }, failed.bind(null, done, 'dirEntry.getFile - Error getting file : ' + file1 + ' from: ' + srcDir));
                            }, failed.bind(null, done, 'root.getDirectory - Error getting directory : ' + srcDir));
                        });
                    }, failed.bind(null, done, 'directory.getFile - Error creating file : ' + file1));
                }, failed.bind(null, done, 'createDirectory - Error creating directory : ' + srcDir));
            });
            it("file.spec.71 moveTo: directory into itself", function (done) {
                if (isIndexedDBShim) {
                    /* `copyTo` and `moveTo` functions do not support directories (Firefox, IE) */
                    pending();
                }

                var srcDir = "entry.move.dis.srcDir",
                dstDir = "entry.move.dis.dstDir",
                srcPath = joinURL(root.fullPath, srcDir);
                // create a new directory entry to kick off it
                createDirectory(srcDir, function (directory) {
                    // move source directory into itself
                    directory.moveTo(directory, dstDir, succeed.bind(null, done, 'directory.moveTo - Unexpected success callback, it should not move a directory into itself: ' + srcDir), function (error) {
                        expect(error).toBeDefined();
                        expect(error).toBeFileError(FileError.INVALID_MODIFICATION_ERR);
                        // make sure original directory still exists
                        root.getDirectory(srcDir, {
                            create : false
                        }, function (entry) {
                            expect(entry).toBeDefined();
                            expect(entry.fullPath).toCanonicallyMatch(srcPath);
                            // cleanup
                            deleteEntry(srcDir, done);
                        }, failed.bind(null, done, 'root.getDirectory - Error getting directory, making sure that original directory still exists: ' + srcDir));
                    });
                }, failed.bind(null, done, 'createDirectory - Error creating directory : ' + srcDir));
            });
            it("file.spec.130 moveTo: directory into similar directory", function (done) {
                if (isIndexedDBShim) {
                    /* `copyTo` and `moveTo` functions do not support directories (Firefox, IE) */
                    pending();
                }

                var srcDir = "entry.move.dis.srcDir",
                dstDir = "entry.move.dis.srcDir-backup",
                srcPath = joinURL(root.fullPath, srcDir);
                // create a new directory entry to kick off it
                createDirectory(srcDir, function (srcDirEntry) {
                deleteEntry(dstDir, function () {
                createDirectory(dstDir, function (dstDirEntry) {
                    // move source directory into itself
                    srcDirEntry.moveTo(dstDirEntry, 'file', function (newDirEntry) {
                        expect(newDirEntry).toBeDefined();
                        deleteEntry(dstDir, done);
                    }, failed.bind(null, done, 'directory.moveTo - Error moving a directory into a similarly-named directory: ' + srcDir));
                }, failed.bind(null, done, 'createDirectory - Error creating directory : ' + dstDir));
                }, failed.bind(null, done, 'deleteEntry - Error deleting directory : ' + dstDir));
                }, failed.bind(null, done, 'createDirectory - Error creating directory : ' + srcDir));
            });
            it("file.spec.72 moveTo: file onto itself", function (done) {
                var file1 = "entry.move.fos.file1",
                filePath = joinURL(root.fullPath, file1);
                // create a new file entry to kick off it
                createFile(file1, function (entry) {
                    // move file1 onto itself
                    entry.moveTo(root, null, succeed.bind(null, done, 'entry.moveTo - Unexpected success callback, it should not move a file: ' + file1 + ' into the same parent'), function (error) {
                        expect(error).toBeDefined();
                        expect(error).toBeFileError(FileError.INVALID_MODIFICATION_ERR);
                        //test that original file still exists
                        root.getFile(file1, {
                            create : false
                        }, function (fileEntry) {
                            expect(fileEntry).toBeDefined();
                            expect(fileEntry.fullPath).toCanonicallyMatch(filePath);
                            // cleanup
                            deleteEntry(file1, done);
                        }, failed.bind(null, done, 'root.getFile - Error getting file, making sure that original file still exists: ' + file1));
                    });
                }, failed.bind(null, done, 'createFile - Error creating file : ' + file1));
            });
            it("file.spec.73 moveTo: file onto existing directory", function (done) {
                var file1 = "entry.move.fod.file1",
                dstDir = "entry.move.fod.dstDir",
                subDir = "subDir",
                dirPath = joinURL(joinURL(root.fullPath, dstDir), subDir),
                filePath = joinURL(root.fullPath, file1);
                // ensure destination directory is cleaned up before it
                deleteEntry(dstDir, function () {
                    // create a new file entry to kick off it
                    createFile(file1, function (entry) {
                        // create top level directory
                        root.getDirectory(dstDir, {
                            create : true
                        }, function (directory) {
                            // create sub-directory
                            directory.getDirectory(subDir, {
                                create : true
                            }, function (subDirectory) {
                                // move file1 onto sub-directory
                                entry.moveTo(directory, subDir, succeed.bind(null, done, 'entry.moveTo - Unexpected success callback, it should not move a file: ' + file1 + ' into directory: ' + dstDir + '\n' + subDir + ' directory already exists'), function (error) {
                                    expect(error).toBeDefined();
                                    expect(error).toBeFileError(FileError.INVALID_MODIFICATION_ERR);
                                    // check that original dir still exists
                                    directory.getDirectory(subDir, {
                                        create : false
                                    }, function (dirEntry) {
                                        expect(dirEntry).toBeDefined();
                                        expect(dirEntry.fullPath).toCanonicallyMatch(dirPath);
                                        // check that original file still exists
                                        root.getFile(file1, {
                                            create : false
                                        }, function (fileEntry) {
                                            expect(fileEntry).toBeDefined();
                                            expect(fileEntry.fullPath).toCanonicallyMatch(filePath);
                                            // cleanup
                                            deleteEntry(file1, function () {
                                                deleteEntry(dstDir, done);
                                            });
                                        }, failed.bind(null, done, 'root.getFile - Error getting file, making sure that original file still exists: ' + file1));
                                    }, failed.bind(null, done, 'directory.getDirectory - Error getting directory, making sure that original directory still exists: ' + subDir));
                                });
                            }, failed.bind(null, done, 'directory.getDirectory - Error creating directory : ' + subDir));
                        }, failed.bind(null, done, 'root.getDirectory - Error creating directory : ' + dstDir));
                    }, failed.bind(null, done, 'createFile - Error creating file : ' + file1));
                }, failed.bind(null, done, 'deleteEntry - Error removing directory : ' + dstDir));
            });
            it("file.spec.74 moveTo: directory onto existing file", function (done) {
                if (isIndexedDBShim) {
                    /* `copyTo` and `moveTo` functions do not support directories (Firefox, IE) */
                    pending();
                }

                var file1 = "entry.move.dof.file1",
                srcDir = "entry.move.dof.srcDir",
                dirPath = joinURL(root.fullPath, srcDir),
                filePath = joinURL(root.fullPath, file1);
                // create a new directory entry to kick off it
                createDirectory(srcDir, function (entry) {
                    // create file
                    root.getFile(file1, {
                        create : true
                    }, function (fileEntry) {
                        // move directory onto file
                        entry.moveTo(root, file1, succeed.bind(null, done, 'entry.moveTo - Unexpected success callback, it should not move : \n' + srcDir + ' into root directory renamed as ' + file1 + '\n' + file1 + ' file already exists'), function (error) {
                            expect(error).toBeDefined();
                            expect(error).toBeFileError(FileError.INVALID_MODIFICATION_ERR);
                            // test that original directory exists
                            root.getDirectory(srcDir, {
                                create : false
                            }, function (dirEntry) {
                                // returning confirms existence so just check fullPath entry
                                expect(dirEntry).toBeDefined();
                                expect(dirEntry.fullPath).toCanonicallyMatch(dirPath);
                                // test that original file exists
                                root.getFile(file1, {
                                    create : false
                                }, function (fileEntry) {
                                    expect(fileEntry).toBeDefined();
                                    expect(fileEntry.fullPath).toCanonicallyMatch(filePath);
                                    // cleanup
                                    deleteEntry(file1, function () {
                                        deleteEntry(srcDir, done);
                                    });
                                }, failed.bind(null, done, 'root.getFile - Error getting file, making sure that original file still exists: ' + file1));
                            }, failed.bind(null, done, 'directory.getDirectory - Error getting directory, making sure that original directory still exists: ' + srcDir));
                        });
                    }, failed.bind(null, done, 'root.getFile - Error creating file : ' + file1));
                }, failed.bind(null, done, 'createDirectory - Error creating directory : ' + srcDir));
            });
            it("file.spec.75 copyTo: directory onto existing file", function (done) {
                if (isIndexedDBShim) {
                    /* `copyTo` and `moveTo` functions do not support directories (Firefox, IE) */
                    pending();
                }

                var file1 = "entry.copy.dof.file1",
                srcDir = "entry.copy.dof.srcDir",
                dirPath = joinURL(root.fullPath, srcDir),
                filePath = joinURL(root.fullPath, file1);
                // create a new directory entry to kick off it
                createDirectory(srcDir, function (entry) {
                    // create file
                    root.getFile(file1, {
                        create : true
                    }, function () {
                        // copy directory onto file
                        entry.copyTo(root, file1, succeed.bind(null, done, 'entry.copyTo - Unexpected success callback, it should not copy : \n' + srcDir + ' into root directory renamed as ' + file1 + '\n' + file1 + ' file already exists'), function (error) {
                            expect(error).toBeDefined();
                            expect(error).toBeFileError(FileError.INVALID_MODIFICATION_ERR);
                            //check that original dir still exists
                            root.getDirectory(srcDir, {
                                create : false
                            }, function (dirEntry) {
                                // returning confirms existence so just check fullPath entry
                                expect(dirEntry).toBeDefined();
                                expect(dirEntry.fullPath).toCanonicallyMatch(dirPath);
                                // test that original file still exists
                                root.getFile(file1, {
                                    create : false
                                }, function (fileEntry) {
                                    expect(fileEntry).toBeDefined();
                                    expect(fileEntry.fullPath).toCanonicallyMatch(filePath);
                                    // cleanup
                                    deleteEntry(file1, function () {
                                        deleteEntry(srcDir, done);
                                    });
                                }, failed.bind(null, done, 'root.getFile - Error getting file, making sure that original file still exists: ' + file1));
                            }, failed.bind(null, done, 'root.getDirectory - Error getting directory, making sure that original directory still exists: ' + srcDir));
                        });
                    }, failed.bind(null, done, 'root.getFile - Error creating file : ' + file1));
                }, failed.bind(null, done, 'createDirectory - Error creating directory : ' + srcDir));
            });
            it("file.spec.76 moveTo: directory onto directory that is not empty", function (done) {
                if (isIndexedDBShim) {
                    /* `copyTo` and `moveTo` functions do not support directories (Firefox, IE) */
                    pending();
                }

                var srcDir = "entry.move.dod.srcDir",
                dstDir = "entry.move.dod.dstDir",
                subDir = "subDir",
                srcPath = joinURL(root.fullPath, srcDir),
                dstPath = joinURL(joinURL(root.fullPath, dstDir), subDir);
                // ensure destination directory is cleaned up before it
                deleteEntry(dstDir, function () {
                    // create a new file entry to kick off it
                    createDirectory(srcDir, function (entry) {
                        // create top level directory
                        root.getDirectory(dstDir, {
                            create : true
                        }, function (directory) {
                            // create sub-directory
                            directory.getDirectory(subDir, {
                                create : true
                            }, function () {
                                // move srcDir onto dstDir (not empty)
                                entry.moveTo(root, dstDir, succeed.bind(null, done, 'entry.moveTo - Unexpected success callback, it should not copy : \n' + srcDir + ' into root directory renamed as ' + dstDir + '\n' + dstDir + ' directory already exists'), function (error) {
                                    expect(error).toBeDefined();
                                    expect(error).toBeFileError(FileError.INVALID_MODIFICATION_ERR);
                                    // making sure destination directory still exists
                                    directory.getDirectory(subDir, {
                                        create : false
                                    }, function (dirEntry) {
                                        // returning confirms existence so just check fullPath entry
                                        expect(dirEntry).toBeDefined();
                                        expect(dirEntry.fullPath).toCanonicallyMatch(dstPath);
                                        // making sure source directory exists
                                        root.getDirectory(srcDir, {
                                            create : false
                                        }, function (srcEntry) {
                                            expect(srcEntry).toBeDefined();
                                            expect(srcEntry.fullPath).toCanonicallyMatch(srcPath);
                                            // cleanup
                                            deleteEntry(srcDir, function () {
                                                deleteEntry(dstDir, done);
                                            });
                                        }, failed.bind(null, done, 'root.getDirectory - Error getting directory, making sure that original directory still exists: ' + srcDir));
                                    }, failed.bind(null, done, 'directory.getDirectory - Error getting directory, making sure that original directory still exists: ' + subDir));
                                });
                            }, failed.bind(null, done, 'directory.getDirectory - Error creating directory : ' + subDir));
                        }, failed.bind(null, done, 'directory.getDirectory - Error creating directory : ' + subDir));
                    }, failed.bind(null, done, 'createDirectory - Error creating directory : ' + srcDir));
                }, failed.bind(null, done, 'deleteEntry - Error removing directory : ' + dstDir));
            });
            it("file.spec.77 moveTo: file replace existing file", function (done) {
                var file1 = "entry.move.frf.file1",
                file2 = "entry.move.frf.file2",
                file1Path = joinURL(root.fullPath, file1),
                file2Path = joinURL(root.fullPath, file2);
                // create a new directory entry to kick off it
                createFile(file1, function (entry) {
                    // create file
                    root.getFile(file2, {
                        create : true
                    }, function () {
                        // replace file2 with file1
                        entry.moveTo(root, file2, function (entry2) {
                            expect(entry2).toBeDefined();
                            expect(entry2.isFile).toBe(true);
                            expect(entry2.isDirectory).toBe(false);
                            expect(entry2.fullPath).toCanonicallyMatch(file2Path);
                            expect(entry2.name).toCanonicallyMatch(file2);
                            // old file should not exists
                            root.getFile(file1, {
                                create : false
                            }, succeed.bind(null, done, 'root.getFile - Unexpected success callback, file: ' + file1 + ' should not exists'), function (error) {
                                expect(error).toBeDefined();
                                expect(error).toBeFileError(FileError.NOT_FOUND_ERR);
                                // test that new file exists
                                root.getFile(file2, {
                                    create : false
                                }, function (fileEntry) {
                                    expect(fileEntry).toBeDefined();
                                    expect(fileEntry.fullPath).toCanonicallyMatch(file2Path);
                                    // cleanup
                                    deleteEntry(file1, function () {
                                        deleteEntry(file2, done);
                                    });
                                }, failed.bind(null, done, 'root.getFile - Error getting moved file: ' + file2));
                            });
                        }, failed.bind(null, done, 'entry.moveTo - Error moving file : ' + file1 + ' to root as: ' + file2));
                    }, failed.bind(null, done, 'root.getFile - Error creating file: ' + file2));
                }, failed.bind(null, done, 'createFile - Error creating file: ' + file1));
            });
            it("file.spec.78 moveTo: directory replace empty directory", function (done) {
                if (isIndexedDBShim) {
                    /* `copyTo` and `moveTo` functions do not support directories (Firefox, IE) */
                    pending();
                }

                var file1 = "file1",
                srcDir = "entry.move.drd.srcDir",
                dstDir = "entry.move.drd.dstDir",
                srcPath = joinURL(root.fullPath, srcDir),
                dstPath = joinURL(root.fullPath, dstDir),
                filePath = dstPath + '/' + file1;
                // ensure destination directory is cleaned up before it
                deleteEntry(dstDir, function () {
                    // create a new directory entry to kick off it
                    createDirectory(srcDir, function (directory) {
                        // create a file within source directory
                        directory.getFile(file1, {
                            create : true
                        }, function () {
                            // create destination directory
                            root.getDirectory(dstDir, {
                                create : true
                            }, function () {
                                // move srcDir to dstDir
                                directory.moveTo(root, dstDir, function (dirEntry) {
                                    expect(dirEntry).toBeDefined();
                                    expect(dirEntry.isFile).toBe(false);
                                    expect(dirEntry.isDirectory).toBe(true);
                                    expect(dirEntry.fullPath).toCanonicallyMatch(dstPath);
                                    expect(dirEntry.name).toCanonicallyMatch(dstDir);
                                    // check that old directory contents have been moved
                                    dirEntry.getFile(file1, {
                                        create : false
                                    }, function (fileEntry) {
                                        expect(fileEntry).toBeDefined();
                                        expect(fileEntry.fullPath).toCanonicallyMatch(filePath);
                                        // check that old directory no longer exists
                                        root.getDirectory(srcDir, {
                                            create : false
                                        }, succeed.bind(null, done, 'root.getDirectory - Unexpected success callback, directory: ' + srcDir + ' should not exists'), function (error) {
                                            expect(error).toBeDefined();
                                            expect(error).toBeFileError(FileError.NOT_FOUND_ERR);
                                            // cleanup
                                            deleteEntry(srcDir, function () {
                                                deleteEntry(dstDir, done);
                                            });
                                        });
                                    }, failed.bind(null, done, 'dirEntry.getFile - Error getting moved file: ' + file1));
                                }, failed.bind(null, done, 'entry.moveTo - Error moving directory : ' + srcDir + ' to root as: ' + dstDir));
                            }, failed.bind(null, done, 'root.getDirectory - Error creating directory: ' + dstDir));
                        }, failed.bind(null, done, 'root.getFile - Error creating file: ' + file1));
                    }, failed.bind(null, done, 'createDirectory - Error creating directory: ' + srcDir));
                }, failed.bind(null, done, 'deleteEntry - Error removing directory : ' + dstDir));
            });
            it("file.spec.79 moveTo: directory that does not exist", function (done) {

                var file1 = "entry.move.dnf.file1",
                dstDir = "entry.move.dnf.dstDir",
                dstPath = joinURL(root.fullPath, dstDir);
                // create a new file entry to kick off it
                createFile(file1, function (entry) {
                    // move file to directory that does not exist
                    directory = new DirectoryEntry();
                    directory.filesystem = root.filesystem;
                    directory.fullPath = dstPath;
                    entry.moveTo(directory, null, succeed.bind(null, done, 'entry.moveTo - Unexpected success callback, parent directory: ' + dstPath + ' should not exists'), function (error) {
                        expect(error).toBeDefined();
                        if (isChrome) {
                            /*INVALID_MODIFICATION_ERR (code: 9) is thrown instead of NOT_FOUND_ERR(code: 1)
                            on trying to moveTo directory that does not exist.*/
                            expect(error).toBeFileError(FileError.INVALID_MODIFICATION_ERR);
                        } else {
                            expect(error).toBeFileError(FileError.NOT_FOUND_ERR);
                        }
                        // cleanup
                        deleteEntry(file1, done);
                    });
                }, failed.bind(null, done, 'createFile - Error creating file: ' + file1));
            });
            it("file.spec.80 moveTo: invalid target name", function (done) {
                if (isBrowser) {
                    /*The plugin does not follow ["8.3 Naming restrictions"]
                    (http://www.w3.org/TR/2011/WD-file-system-api-20110419/#naming-restrictions*/
                    pending();
                }

                var file1 = "entry.move.itn.file1",
                file2 = "bad:file:name";
                // create a new file entry to kick off it
                createFile(file1, function (entry) {
                    // move file1 to file2
                    entry.moveTo(root, file2, succeed.bind(null, done, 'entry.moveTo - Unexpected success callback, : ' + file1 + ' to root as: ' + file2), function (error) {
                        expect(error).toBeDefined();
                        expect(error).toBeFileError(FileError.ENCODING_ERR);
                        // cleanup
                        deleteEntry(file1, done);
                    });
                }, failed.bind(null, done, 'createFile - Error creating file: ' + file1));
            });
        });
        //Entry
        describe('FileReader', function () {
            it("file.spec.81 should have correct methods", function () {
                var reader = new FileReader();
                expect(reader).toBeDefined();
                expect(typeof reader.readAsBinaryString).toBe('function');
                expect(typeof reader.readAsDataURL).toBe('function');
                expect(typeof reader.readAsText).toBe('function');
                expect(typeof reader.readAsArrayBuffer).toBe('function');
                expect(typeof reader.abort).toBe('function');
                expect(reader.result).toBe(null);
            });
        });
        //FileReader
        describe('Read method', function () {
            it("file.spec.82 should error out on non-existent file", function (done) {
                var fileName = cordova.platformId === 'windowsphone' ? root.toURL() + "/" + "somefile.txt" : "somefile.txt",
                verifier = function (evt) {
                    expect(evt).toBeDefined();
                    expect(evt.target.error).toBeFileError(FileError.NOT_FOUND_ERR);
                    done();
                };
                root.getFile(fileName, {
                    create : true
                }, function (entry) {
                    entry.file(function (file) {
                        deleteEntry(fileName, function () {
                            //Create FileReader
                            var reader = new FileReader();
                            reader.onerror = verifier;
                            reader.onload = succeed.bind(null, done, 'reader.onload - Unexpected success callback, file: ' + fileName + ' it should not exists');
                            reader.readAsText(file);
                        }, failed.bind(null, done, 'deleteEntry - Error removing file: ' + fileName));
                    }, failed.bind(null, done, 'entry.file - Error reading file: ' + fileName));
                }, failed.bind(null, done, 'root.getFile - Error creating file: ' + fileName));
            });
            it("file.spec.83 should be able to read native blob objects", function (done) {
                // Skip test if blobs are not supported (e.g.: Android 2.3).
                if (typeof window.Blob == 'undefined' || typeof window.Uint8Array == 'undefined') {
                    expect(true).toFailWithMessage('Platform does not supported this feature');
                    done();
                }
                var contents = 'asdf';
                var uint8Array = new Uint8Array(contents.length);
                for (var i = 0; i < contents.length; ++i) {
                    uint8Array[i] = contents.charCodeAt(i);
                }
                var Builder = window.BlobBuilder || window.WebKitBlobBuilder;
                var blob;
                if (Builder) {
                    var builder = new Builder();
                    builder.append(uint8Array.buffer);
                    builder.append(contents);
                    blob = builder.getBlob("text/plain");
                } else {
                    try {
                        // iOS 6 does not support Views, so pass in the buffer.
                        blob = new Blob([uint8Array.buffer, contents]);
                    } catch (e) {
                        // Skip the test if we can't create a blob (e.g.: iOS 5).
                        if (e instanceof TypeError) {
                            expect(true).toFailWithMessage('Platform does not supported this feature');
                            done();
                        }
                        throw e;
                    }
                }
                var verifier = function (evt) {
                    expect(evt).toBeDefined();
                    expect(evt.target.result).toBe('asdfasdf');
                    done();
                };
                var reader = new FileReader();
                reader.onloadend = verifier;
                reader.readAsText(blob);
            });
            function writeDummyFile(writeBinary, callback, done, fileContents) {
                var fileName = "dummy.txt",
                fileEntry = null,
                // use default string if file data is not provided
                fileData = fileContents !== undefined ? fileContents :
                    '\u20AC\xEB - There is an exception to every rule. Except this one.',
                fileDataAsBinaryString = fileContents !== undefined ? fileContents :
                    '\xe2\x82\xac\xc3\xab - There is an exception to every rule. Except this one.',
                createWriter = function (fe) {
                    fileEntry = fe;
                    fileEntry.createWriter(writeFile, failed.bind(null, done, 'fileEntry.createWriter - Error reading file: ' + fileName));
                }, // writes file and reads it back in
                writeFile = function (writer) {
                    writer.onwriteend = function () {
                        fileEntry.file(function (f) {
                            callback(fileEntry, f, fileData, fileDataAsBinaryString);
                        }, failed.bind(null, done, 'writer.onwriteend - Error writing data on file: ' + fileName));
                    };
                    writer.write(fileData);
                };
                fileData += writeBinary ? 'bin:\x01\x00' : '';
                fileDataAsBinaryString += writeBinary ? 'bin:\x01\x00' : '';
                // create a file, write to it, and read it in again
                createFile(fileName, createWriter, failed.bind(null, done, 'createFile - Error creating file: ' + fileName));
            }
            function runReaderTest(funcName, writeBinary, done, verifierFunc, sliceStart, sliceEnd, fileContents) {
                writeDummyFile(writeBinary, function (fileEntry, file, fileData, fileDataAsBinaryString) {
                    var verifier = function (evt) {
                        expect(evt).toBeDefined();
                        verifierFunc(evt, fileData, fileDataAsBinaryString);
                    };
                    var reader = new FileReader();
                    reader.onload = verifier;
                    reader.onerror = failed.bind(null, done, 'reader.onerror - Error reading file: ' + file + ' using function: ' + funcName);
                    if (sliceEnd !== undefined) {
                        // 'type' is specified so that is will be preserved in the resulting file:
                        // http://www.w3.org/TR/FileAPI/#slice-method-algo -> "6.4.1. The slice method" -> 4. A), 6. c)
                        file = file.slice(sliceStart, sliceEnd, file.type);
                    } else if (sliceStart !== undefined) {
                        file = file.slice(sliceStart, file.size, file.type);
                    }
                    reader[funcName](file);
                }, done, fileContents);
            }
            function arrayBufferEqualsString(ab, str) {
                var buf = new Uint8Array(ab);
                var match = buf.length == str.length;
                for (var i = 0; match && i < buf.length; i++) {
                    match = buf[i] == str.charCodeAt(i);
                }
                return match;
            }
            it("file.spec.84 should read file properly, readAsText", function (done) {
                runReaderTest('readAsText', false, done, function (evt, fileData, fileDataAsBinaryString) {
                    expect(evt.target.result).toBe(fileData);
                    done();
                });
            });
            it("file.spec.84.1 should read JSON file properly, readAsText", function (done) {
                var testObject = {key1: "value1", key2: 2};
                runReaderTest('readAsText', false, done, function (evt, fileData, fileDataAsBinaryString) {
                    expect(evt.target.result).toEqual(JSON.stringify(testObject));
                    done();
                }, undefined, undefined, JSON.stringify(testObject));
            });
            it("file.spec.85 should read file properly, Data URI", function (done) {
                runReaderTest('readAsDataURL', true, done, function (evt, fileData, fileDataAsBinaryString) {
                    /* `readAsDataURL` function is supported, but the mediatype in Chrome depends on entry name extension,
                        mediatype in IE is always empty (which is the same as `text-plain` according the specification),
                        the mediatype in Firefox is always `application/octet-stream`.
                        For example, if the content is `abcdefg` then Firefox returns `data:application/octet-stream;base64,YWJjZGVmZw==`,
                        IE returns `data:;base64,YWJjZGVmZw==`, Chrome returns `data:<mediatype depending on extension of entry name>;base64,YWJjZGVmZw==`. */
                    expect(evt.target.result).toBeDataUrl();

                    //The atob function it is completely ignored during mobilespec execution, besides the returned object: evt
                    //it is encoded and the atob function is aimed to decode a string. Even with btoa (encode) the function it gets stucked
                    //because of the Unicode characters that contains the fileData object.
                    //Issue reported at JIRA with all the details: CB-7095

                    //expect(evt.target.result.slice(23)).toBe(atob(fileData));

                    done();
                });
            });
            it("file.spec.86 should read file properly, readAsBinaryString", function (done) {
                if (isIE) {
                    /*`readAsBinaryString` function is not supported by IE and has not the stub.*/
                    pending();
                }

                runReaderTest('readAsBinaryString', true, done, function (evt, fileData, fileDataAsBinaryString) {
                    expect(evt.target.result).toBe(fileDataAsBinaryString);
                    done();
                });
            });
            it("file.spec.87 should read file properly, readAsArrayBuffer", function (done) {
                // Skip test if ArrayBuffers are not supported (e.g.: Android 2.3).
                if (typeof window.ArrayBuffer == 'undefined') {
                    expect(true).toFailWithMessage('Platform does not supported this feature');
                    done();
                }
                runReaderTest('readAsArrayBuffer', true, done, function (evt, fileData, fileDataAsBinaryString) {
                    expect(arrayBufferEqualsString(evt.target.result, fileDataAsBinaryString)).toBe(true);
                    done();
                });
            });
            it("file.spec.88 should read sliced file: readAsText", function (done) {
                runReaderTest('readAsText', false, done, function (evt, fileData, fileDataAsBinaryString) {
                    expect(evt.target.result).toBe(fileDataAsBinaryString.slice(10, 40));
                    done();
                }, 10, 40);
            });
            it("file.spec.89 should read sliced file: slice past eof", function (done) {
                runReaderTest('readAsText', false, done, function (evt, fileData, fileDataAsBinaryString) {
                    expect(evt.target.result).toBe(fileData.slice(-5, 9999));
                    done();
                }, -5, 9999);
            });
            it("file.spec.90 should read sliced file: slice to eof", function (done) {
                runReaderTest('readAsText', false, done, function (evt, fileData, fileDataAsBinaryString) {
                    expect(evt.target.result).toBe(fileData.slice(-5));
                    done();
                }, -5);
            });
            it("file.spec.91 should read empty slice", function (done) {
                runReaderTest('readAsText', false, done, function (evt, fileData, fileDataAsBinaryString) {
                    expect(evt.target.result).toBe('');
                    done();
                }, 0, 0);
            });
            it("file.spec.92 should read sliced file properly, readAsDataURL", function (done) {
                runReaderTest('readAsDataURL', true, done, function (evt, fileData, fileDataAsBinaryString) {
                    /* `readAsDataURL` function is supported, but the mediatype in Chrome depends on entry name extension,
                        mediatype in IE is always empty (which is the same as `text-plain` according the specification),
                        the mediatype in Firefox is always `application/octet-stream`.
                        For example, if the content is `abcdefg` then Firefox returns `data:application/octet-stream;base64,YWJjZGVmZw==`,
                        IE returns `data:;base64,YWJjZGVmZw==`, Chrome returns `data:<mediatype depending on extension of entry name>;base64,YWJjZGVmZw==`. */
                    expect(evt.target.result).toBeDataUrl();

                    //The atob function it is completely ignored during mobilespec execution, besides the returned object: evt
                    //it is encoded and the atob function is aimed to decode a string. Even with btoa (encode) the function it gets stucked
                    //because of the Unicode characters that contains the fileData object.
                    //Issue reported at JIRA with all the details: CB-7095

                    //expect(evt.target.result.slice(23)).toBe(atob(fileDataAsBinaryString.slice(10, -3)));

                    done();
                }, 10, -3);
            });
            it("file.spec.93 should read sliced file properly, readAsBinaryString", function (done) {
                if (isIE) {
                    /*`readAsBinaryString` function is not supported by IE and has not the stub.*/
                    pending();
                }

                runReaderTest('readAsBinaryString', true, done, function (evt, fileData, fileDataAsBinaryString) {
                    expect(evt.target.result).toBe(fileDataAsBinaryString.slice(-10, -5));
                    done();
                }, -10, -5);
            });
            it("file.spec.94 should read sliced file properly, readAsArrayBuffer", function (done) {
                // Skip test if ArrayBuffers are not supported (e.g.: Android 2.3).
                if (typeof window.ArrayBuffer == 'undefined') {
                    expect(true).toFailWithMessage('Platform does not supported this feature');
                    done();
                }
                runReaderTest('readAsArrayBuffer', true, done, function (evt, fileData, fileDataAsBinaryString) {
                    expect(arrayBufferEqualsString(evt.target.result, fileDataAsBinaryString.slice(0, -1))).toBe(true);
                    done();
                }, 0, -1);
            });
        });
        //Read method
        describe('FileWriter', function () {
            it("file.spec.95 should have correct methods", function (done) {
                // retrieve a FileWriter object
                var fileName = "writer.methods";
                // FileWriter
                root.getFile(fileName, {
                    create : true
                }, function (fileEntry) {
                    fileEntry.createWriter(function (writer) {
                        expect(writer).toBeDefined();
                        expect(typeof writer.write).toBe('function');
                        expect(typeof writer.seek).toBe('function');
                        expect(typeof writer.truncate).toBe('function');
                        expect(typeof writer.abort).toBe('function');
                        // cleanup
                        deleteFile(fileName, done);
                    }, failed.bind(null, done, 'fileEntry.createWriter - Error creating writer using fileEntry: ' + fileEntry.name));
                }, failed.bind(null, done, 'root.getFile - Error creating file: ' + fileName));
            });
            it("file.spec.96 should be able to write and append to file, createWriter", function (done) {
                var fileName = "writer.append.createWriter", // file content
                content = "There is an exception to every rule.", // for checkin file length
                exception = " Except this one.",
                length = content.length;
                // create file, then write and append to it
                createFile(fileName, function (fileEntry) {
                    // writes initial file content
                    fileEntry.createWriter(function (writer) {
                        //Verifiers declaration
                        var verifier = function (evt) {
                            expect(writer.length).toBe(length);
                            expect(writer.position).toBe(length);
                            // Append some more data
                            writer.onwriteend = secondVerifier;
                            length += exception.length;
                            writer.seek(writer.length);
                            writer.write(exception);
                        },
                        secondVerifier = function (evt) {
                            expect(writer.length).toBe(length);
                            expect(writer.position).toBe(length);
                            var reader = new FileReader();
                            reader.onloadend = thirdVerifier;
                            reader.onerror = failed.bind(null, done, 'reader.onerror - Error reading file: ' + fileName);
                            fileEntry.file(function(f){reader.readAsText(f);});
                        },
                        thirdVerifier = function (evt) {
                            expect(evt.target.result).toBe(content+exception);
                            // cleanup
                            deleteFile(fileName, done);
                        };
                        //Write process
                        writer.onwriteend = verifier;
                        writer.write(content);
                    }, failed.bind(null, done, 'fileEntry.createWriter - Error creating writer using fileEntry: ' + fileEntry.name));
                }, failed.bind(null, done, 'createFile - Error creating file: ' + fileName));
            });
            it("file.spec.97 should be able to write and append to file, File object", function (done) {
                var fileName = "writer.append.File", // file content
                content = "There is an exception to every rule.", // for checkin file length
                exception = " Except this one.",
                length = content.length;
                root.getFile(fileName, {
                    create : true
                }, function (fileEntry) {
                    fileEntry.createWriter(function (writer) {
                        //Verifiers declaration
                        var verifier = function () {
                            expect(writer.length).toBe(length);
                            expect(writer.position).toBe(length);
                            // Append some more data
                            writer.onwriteend = secondVerifier;
                            length += exception.length;
                            writer.seek(writer.length);
                            writer.write(exception);
                        },
                        secondVerifier = function () {
                            expect(writer.length).toBe(length);
                            expect(writer.position).toBe(length);
                            var reader = new FileReader();
                            reader.onloadend = thirdVerifier;
                            reader.onerror = failed.bind(null, done, 'reader.onerror - Error reading file: ' + fileName);
                            fileEntry.file(function(f){reader.readAsText(f);});
                        },
                        thirdVerifier = function (evt) {
                            expect(evt.target.result).toBe(content+exception);
                            // cleanup
                            deleteFile(fileName, done);
                        };
                        //Write process
                        writer.onwriteend = verifier;
                        writer.write(content);
                    }, failed.bind(null, done, 'fileEntry.createWriter - Error creating writer using fileEntry: ' + fileEntry.name));
                }, failed.bind(null, done, 'root.getFile - Error creating file: ' + fileName));
            });
            it("file.spec.98 should be able to seek to the middle of the file and write more data than file.length", function (done) {
                var fileName = "writer.seek.write", // file content
                content = "This is our sentence.", // for checking file length
                exception = "newer sentence.",
                length = content.length;
                // create file, then write and append to it
                createFile(fileName, function (fileEntry) {
                    fileEntry.createWriter(function (writer) {
                        //Verifiers declaration
                        var verifier = function (evt) {
                            expect(writer.length).toBe(length);
                            expect(writer.position).toBe(length);
                            // Append some more data
                            writer.onwriteend = secondVerifier;
                            length = 12 + exception.length;
                            writer.seek(12);
                            writer.write(exception);
                        },
                        secondVerifier = function (evt) {
                            expect(writer.length).toBe(length);
                            expect(writer.position).toBe(length);
                            var reader = new FileReader();
                            reader.onloadend = thirdVerifier;
                            reader.onerror = failed.bind(null, done, 'reader.onerror - Error reading file: ' + fileName);
                            fileEntry.file(function(f){reader.readAsText(f);});
                        },
                        thirdVerifier = function (evt) {
                            expect(evt.target.result).toBe(content.substr(0,12)+exception);
                            // cleanup
                            deleteFile(fileName, done);
                        };
                        //Write process
                        writer.onwriteend = verifier;
                        writer.write(content);
                    }, failed.bind(null, done, 'fileEntry.createWriter - Error creating writer using fileEntry: ' + fileEntry.name));
                }, failed.bind(null, done, 'createFile - Error creating file: ' + fileName));
            });
            it("file.spec.99 should be able to seek to the middle of the file and write less data than file.length", function (done) {
                if (isChrome) {
                    /* Chrome (re)writes as follows: "This is our sentence." -> "This is new.sentence.",
                       i.e. the length is not being changed from content.length and writer length will be equal 21 */
                    pending();
                }

                var fileName = "writer.seek.write2", // file content
                content = "This is our sentence.", // for checking file length
                exception = "new.",
                length = content.length;
                // create file, then write and append to it
                createFile(fileName, function (fileEntry) {
                    fileEntry.createWriter(function (writer) {
                        // Verifiers declaration
                        var verifier = function (evt) {
                            expect(writer.length).toBe(length);
                            expect(writer.position).toBe(length);
                            // Append some more data
                            writer.onwriteend = secondVerifier;
                            length = 8 + exception.length;
                            writer.seek(8);
                            writer.write(exception);
                        },
                        secondVerifier = function (evt) {
                            expect(writer.length).toBe(length);
                            expect(writer.position).toBe(length);
                            var reader = new FileReader();
                            reader.onloadend = thirdVerifier;
                            reader.onerror = failed.bind(null, done, 'reader.onerror - Error reading file: ' + fileName);
                            fileEntry.file(function(f){reader.readAsText(f);});
                        },
                        thirdVerifier = function (evt) {
                            expect(evt.target.result).toBe(content.substr(0,8)+exception);
                            // cleanup
                            deleteFile(fileName, done);
                        };
                        //Write process
                        writer.onwriteend = verifier;
                        writer.write(content);
                    }, failed.bind(null, done, 'fileEntry.createWriter - Error creating writer using fileEntry: ' + fileEntry.name));
                }, failed.bind(null, done, 'createFile - Error creating file: ' + fileName));
            });
            it("file.spec.100 should be able to write XML data", function (done) {
                var fileName = "writer.xml", // file content
                content = '<?xml version="1.0" encoding="UTF-8"?>\n<test prop="ack">\nData\n</test>\n', // for testing file length
                length = content.length;
                // creates file, then write XML data
                createFile(fileName, function (fileEntry) {
                    fileEntry.createWriter(function (writer) {
                        //Verifier content
                        var verifier = function (evt) {
                            expect(writer.length).toBe(length);
                            expect(writer.position).toBe(length);
                            // cleanup
                            deleteFile(fileName, done);
                        };
                        //Write process
                        writer.onwriteend = verifier;
                        writer.write(content);
                    }, failed.bind(null, done, 'fileEntry.createWriter - Error creating writer using fileEntry: ' + fileEntry.name));
                }, failed.bind(null, done, 'createFile - Error creating file: ' + fileName));
            });
            it("file.spec.101 should be able to write JSON data", function (done) {
                var fileName = "writer.json", // file content
                content = '{ "name": "Guy Incognito", "email": "here@there.com" }', // for testing file length
                length = content.length;
                // creates file, then write JSON content
                createFile(fileName, function (fileEntry) {
                    fileEntry.createWriter(function (writer) {
                        //Verifier declaration
                        var verifier = function (evt) {
                            expect(writer.length).toBe(length);
                            expect(writer.position).toBe(length);
                            // cleanup
                            deleteFile(fileName, done);
                        };
                        //Write process
                        writer.onwriteend = verifier;
                        writer.write(content);
                    }, failed.bind(null, done, 'fileEntry.createWriter - Error creating writer using fileEntry: ' + fileEntry.name));
                }, failed.bind(null, done, 'createFile - Error creating file: ' + fileName));
            });
            it("file.spec.102 should be able to seek", function (done) {
                var fileName = "writer.seek", // file content
                content = "There is an exception to every rule. Except this one.", // for testing file length
                length = content.length;
                // creates file, then write JSON content
                createFile(fileName, function (fileEntry) {
                    // writes file content and tests writer.seek
                    fileEntry.createWriter(function (writer) {
                        //Verifier declaration
                        var verifier = function () {
                            expect(writer.position).toBe(length);
                            writer.seek(-5);
                            expect(writer.position).toBe(length - 5);
                            writer.seek(length + 100);
                            expect(writer.position).toBe(length);
                            writer.seek(10);
                            expect(writer.position).toBe(10);
                            // cleanup
                            deleteFile(fileName, done);
                        };
                        //Write process
                        writer.onwriteend = verifier;
                        writer.seek(-100);
                        expect(writer.position).toBe(0);
                        writer.write(content);
                    }, failed.bind(null, done, 'fileEntry.createWriter - Error creating writer using fileEntry: ' + fileEntry.name));
                }, failed.bind(null, done, 'createFile - Error creating file: ' + fileName));
            });
            it("file.spec.103 should be able to truncate", function (done) {
                if (isIndexedDBShim) {
                    /* `abort` and `truncate` functions are not supported (Firefox, IE) */
                    pending();
                }

                var fileName = "writer.truncate",
                content = "There is an exception to every rule. Except this one.";
                // creates file, writes to it, then truncates it
                createFile(fileName, function (fileEntry) {
                    fileEntry.createWriter(function (writer) {
                        // Verifier declaration
                        var verifier = function () {
                            expect(writer.length).toBe(36);
                            expect(writer.position).toBe(36);
                            // cleanup
                            deleteFile(fileName, done);
                        };
                        //Write process
                        writer.onwriteend = function () {
                            //Truncate process after write
                            writer.onwriteend = verifier;
                            writer.truncate(36);
                        };
                        writer.write(content);
                    }, failed.bind(null, done, 'fileEntry.createWriter - Error creating writer using fileEntry: ' + fileEntry.name));
                }, failed.bind(null, done, 'createFile - Error creating file: ' + fileName));
            });
            it("file.spec.104 should be able to write binary data from an ArrayBuffer", function (done) {
                // Skip test if ArrayBuffers are not supported (e.g.: Android 2.3).
                if (typeof window.ArrayBuffer == 'undefined') {
                    expect(true).toFailWithMessage('Platform does not supported this feature');
                    done();
                    return;
                }
                var fileName = "bufferwriter.bin", // file content
                data = new ArrayBuffer(32),
                dataView = new Int8Array(data), // for verifying file length
                length = 32;
                for (i = 0; i < dataView.length; i++) {
                    dataView[i] = i;
                }
                // creates file, then write content
                createFile(fileName, function (fileEntry) {
                    // writes file content
                    fileEntry.createWriter(function (writer) {
                        //Verifier declaration
                        var verifier = function () {
                            expect(writer.length).toBe(length);
                            expect(writer.position).toBe(length);
                            // cleanup
                            deleteFile(fileName, done);
                        };
                        //Write process
                        writer.onwriteend = verifier;
                        writer.write(data);
                    }, failed.bind(null, done, 'fileEntry.createWriter - Error creating writer using fileEntry: ' + fileEntry.name));
                }, failed.bind(null, done, 'createFile - Error creating file: ' + fileName));
            });
            it("file.spec.105 should be able to write binary data from a Blob", function (done) {
                // Skip test if Blobs are not supported (e.g.: Android 2.3).
                if ((typeof window.Blob == 'undefined' && typeof window.WebKitBlobBuilder == 'undefined') || typeof window.ArrayBuffer == 'undefined') {
                    expect(true).toFailWithMessage('Platform does not supported this feature');
                    done();
                    return;
                }
                var fileName = "blobwriter.bin", // file content
                data = new ArrayBuffer(32),
                dataView = new Int8Array(data),
                blob, // for verifying file length
                length = 32;
                for (i = 0; i < dataView.length; i++) {
                    dataView[i] = i;
                }
                try {
                    // Mobile Safari: Use Blob constructor
                    blob = new Blob([data], {
                            "type" : "application/octet-stream"
                        });
                } catch (e) {
                    if (window.WebKitBlobBuilder) {
                        // Android Browser: Use deprecated BlobBuilder
                        var builder = new WebKitBlobBuilder();
                        builder.append(data);
                        blob = builder.getBlob('application/octet-stream');
                    } else {
                        // We have no way defined to create a Blob, so fail
                        fail();
                    }
                }
                if (typeof blob !== 'undefined') {
                    // creates file, then write content
                    createFile(fileName, function (fileEntry) {
                        fileEntry.createWriter(function (writer) {
                            //Verifier declaration
                            var verifier = function () {
                                expect(writer.length).toBe(length);
                                expect(writer.position).toBe(length);
                                // cleanup
                                deleteFile(fileName, done);
                            };
                            //Write process
                            writer.onwriteend = verifier;
                            writer.write(blob);
                        }, failed.bind(null, done, 'fileEntry.createWriter - Error creating writer using fileEntry: ' + fileEntry.name));
                    }, failed.bind(null, done, 'createFile - Error creating file: ' + fileName));
                }
            });
            it("file.spec.106 should be able to write a File to a FileWriter", function (done) {
                var dummyFileName = 'dummy.txt',
                outputFileName = 'verify.txt',
                dummyFileText = 'This text should be written to two files',
                verifier = function (outputFileWriter) {
                    expect(outputFileWriter.length).toBe(dummyFileText.length);
                    expect(outputFileWriter.position).toBe(dummyFileText.length);
                    deleteFile(outputFileName, done);
                },
                writeFile = function (fileName, fileData, win) {
                    var theWriter,
                    filePath = joinURL(root.fullPath, fileName), // writes file content to new file
                    write_file = function (fileEntry) {
                        writerEntry = fileEntry;
                        fileEntry.createWriter(function (writer) {
                            theWriter = writer;
                            writer.onwriteend = function (ev) {
                                if (typeof fileData.length !== "undefined") {
                                    expect(theWriter.length).toBe(fileData.length);
                                    expect(theWriter.position).toBe(fileData.length);
                                }
                                win(theWriter);
                            };
                            writer.onerror = failed.bind(null, done, 'writer.onerror - Error writing content on file: ' + fileName);
                            writer.write(fileData);
                        }, failed.bind(null, done, 'fileEntry.createWriter - Error creating writer using fileEntry: ' + fileEntry.name));
                    };
                    createFile(fileName, write_file, failed.bind(null, done, 'createFile - Error creating file: ' + fileName));
                },
                openFile = function (fileName, callback) {
                    root.getFile(fileName, {
                        create : false
                    }, function (fileEntry) {
                        fileEntry.file(callback, failed.bind(null, done, 'fileEntry.file - Error reading file using fileEntry: ' + fileEntry.name));
                    }, failed.bind(null, done, 'root.getFile - Error getting file: ' + fileName));
                };
                writeFile(dummyFileName, dummyFileText, function (dummyFileWriter) {
                    openFile(dummyFileName, function (file) {
                        writeFile(outputFileName, file, verifier);
                    });
                });
            });
            it("file.spec.107 should be able to write a sliced File to a FileWriter", function (done) {
                var dummyFileName = 'dummy2.txt',
                outputFileName = 'verify2.txt',
                dummyFileText = 'This text should be written to two files',
                verifier = function (outputFileWriter) {
                    expect(outputFileWriter.length).toBe(10);
                    expect(outputFileWriter.position).toBe(10);
                    deleteFile(outputFileName, done);
                },
                writeFile = function (fileName, fileData, win) {
                    var theWriter,
                    filePath = joinURL(root.fullPath, fileName), // writes file content to new file
                    write_file = function (fileEntry) {
                        writerEntry = fileEntry;
                        fileEntry.createWriter(function (writer) {
                            theWriter = writer;
                            writer.onwriteend = function (ev) {
                                if (typeof fileData.length !== "undefined") {
                                    expect(theWriter.length).toBe(fileData.length);
                                    expect(theWriter.position).toBe(fileData.length);
                                }
                                win(theWriter);
                            };
                            writer.onerror = failed.bind(null, done, 'writer.onerror - Error writing content on file: ' + fileName);
                            writer.write(fileData);
                        }, failed.bind(null, done, 'fileEntry.createWriter - Error creating writer using fileEntry: ' + fileEntry.name));
                    };
                    createFile(fileName, write_file, failed.bind(null, done, 'createFile - Error creating file: ' + fileName));
                },
                openFile = function (fileName, callback) {
                    root.getFile(fileName, {
                        create : false
                    }, function (fileEntry) {
                        fileEntry.file(callback, failed.bind(null, done, 'fileEntry.file - Error reading file using fileEntry: ' + fileEntry.name));
                    }, failed.bind(null, done, 'root.getFile - Error getting file: ' + fileName));
                };
                writeFile(dummyFileName, dummyFileText, function (dummyFileWriter) {
                    openFile(dummyFileName, function (file) {
                        writeFile(outputFileName, file.slice(10, 20), verifier);
                    });
                });
            });
            it("file.spec.108 should be able to write binary data from a File", function (done) {
                // Skip test if Blobs are not supported (e.g.: Android 2.3).
                if (typeof window.Blob == 'undefined' && typeof window.WebKitBlobBuilder == 'undefined') {
                    expect(true).toFailWithMessage('Platform does not supported this feature');
                    done();
                }
                var dummyFileName = "blobwriter.bin",
                outputFileName = 'verify.bin', // file content
                data = new ArrayBuffer(32),
                dataView = new Int8Array(data),
                blob, // for verifying file length
                length = 32,
                verifier = function (outputFileWriter) {
                    expect(outputFileWriter.length).toBe(length);
                    expect(outputFileWriter.position).toBe(length);
                    // cleanup
                    deleteFile(outputFileName);
                    done();
                },
                writeFile = function (fileName, fileData, win) {
                    var theWriter,
                    filePath = joinURL(root.fullPath, fileName), // writes file content to new file
                    write_file = function (fileEntry) {
                        writerEntry = fileEntry;
                        fileEntry.createWriter(function (writer) {
                            theWriter = writer;
                            writer.onwriteend = function (ev) {
                                if (typeof fileData.length !== "undefined") {
                                    expect(theWriter.length).toBe(fileData.length);
                                    expect(theWriter.position).toBe(fileData.length);
                                }
                                win(theWriter);
                            };
                            writer.onerror = failed.bind(null, done, 'writer.onerror - Error writing content on file: ' + fileName);
                            writer.write(fileData);
                        }, failed.bind(null, done, 'fileEntry.createWriter - Error creating writer using fileEntry: ' + fileEntry.name));
                    };
                    createFile(fileName, write_file, failed.bind(null, done, 'createFile - Error creating file: ' + fileName));
                },
                openFile = function (fileName, callback) {
                    root.getFile(fileName, {
                        create : false
                    }, function (fileEntry) {
                        fileEntry.file(callback, failed.bind(null, done, 'fileEntry.file - Error reading file using fileEntry: ' + fileEntry.name));
                    }, failed.bind(null, done, 'root.getFile - Error getting file: ' + fileName));
                };
                for (i = 0; i < dataView.length; i++) {
                    dataView[i] = i;
                }
                try {
                    // Mobile Safari: Use Blob constructor
                    blob = new Blob([data], {
                            "type" : "application/octet-stream"
                        });
                } catch (e) {
                    if (window.WebKitBlobBuilder) {
                        // Android Browser: Use deprecated BlobBuilder
                        var builder = new WebKitBlobBuilder();
                        builder.append(data);
                        blob = builder.getBlob('application/octet-stream');
                    } else {
                        // We have no way defined to create a Blob, so fail
                        fail();
                    }
                }
                if (typeof blob !== 'undefined') {
                    // creates file, then write content
                    writeFile(dummyFileName, blob, function (dummyFileWriter) {
                        openFile(dummyFileName, function (file) {
                            writeFile(outputFileName, file, verifier);
                        });
                    });
                }
            });
        });
        //FileWritter
        describe('Backwards compatibility', function () {
            /* These specs exist to test that the File plugin can still recognize file:///
             * URLs, and can resolve them to FileEntry and DirectoryEntry objects.
             * They rely on an undocumented interface to File which provides absolute file
             * paths, which are not used internally anymore.
             * If that interface is not present, then these tests will silently succeed.
             */
            it("file.spec.109 should be able to resolve a file:/// URL", function (done) {
                var localFilename = 'file.txt';
                var originalEntry;
                root.getFile(localFilename, {
                    create : true
                }, function (entry) {
                    originalEntry = entry;
                    /* This is an undocumented interface to File which exists only for testing
                     * backwards compatibilty. By obtaining the raw filesystem path of the download
                     * location, we can pass that to ft.download() to make sure that previously-stored
                     * paths are still valid.
                     */
                    cordova.exec(function (localPath) {
                        window.resolveLocalFileSystemURL("file://" + encodeURI(localPath), function (fileEntry) {
                            expect(fileEntry.toURL()).toEqual(originalEntry.toURL());
                            // cleanup
                            deleteFile(localFilename);
                            done();
                        }, failed.bind(null, done, 'window.resolveLocalFileSystemURL - Error resolving URI: file://' + encodeURI(localPath)));
                    }, done, 'File', '_getLocalFilesystemPath', [entry.toURL()]);
                }, failed.bind(null, done, 'root.getFile - Error creating file: ' + localFilename));
            });
        });
        //Backwards Compatibility
        describe('Parent References', function () {
            /* These specs verify that paths with parent references i("..") in them
             * work correctly, and do not cause the application to crash.
             */
            it("file.spec.110 should not throw exception resolving parent refefences", function (done) {
                /* This is a direct copy of file.spec.9, with the filename changed, * as reported in CB-5721.
                 */
                var fileName = "resolve.file.uri";
                var dirName = "resolve.dir.uri";
                // create a new file entry
                createDirectory(dirName, function () {
                    createFile(dirName+"/../" + fileName, function (entry) {
                        // lookup file system entry
                        window.resolveLocalFileSystemURL(entry.toURL(), function (fileEntry) {
                            expect(fileEntry).toBeDefined();
                            expect(fileEntry.name).toCanonicallyMatch(fileName);
                            // cleanup
                            deleteEntry(fileName, done);
                        }, failed.bind(null, done, 'window.resolveLocalFileSystemURL - Error resolving URI: ' + entry.toURL()));
                    }, failed.bind(null, done, 'createFile - Error creating file: ../' + fileName));
                }, failed.bind(null, done, 'createDirectory - Error creating directory: ' + dirName));
            });
            it("file.spec.111 should not traverse above above the root directory", function (done) {
                var fileName = "traverse.file.uri";
                // create a new file entry
                createFile(fileName, function (entry) {
                    // lookup file system entry
                    root.getFile('../' + fileName, {
                        create : false
                    }, function (fileEntry) {
                        // Note: we expect this to still resolve, as the correct behaviour is to ignore the ../, not to fail out.
                        expect(fileEntry).toBeDefined();
                        expect(fileEntry.name).toBe(fileName);
                        expect(fileEntry.fullPath).toCanonicallyMatch(root.fullPath +'/' + fileName);
                        // cleanup
                        deleteEntry(fileName, done);
                    }, failed.bind(null, done, 'root.getFile - Error getting file: ../' + fileName));
                }, failed.bind(null, done, 'createFile - Error creating file: ../' + fileName));
            });
            it("file.spec.112 should traverse above above the current directory", function (done) {
                var fileName = "traverse2.file.uri",
                dirName = "traverse2.subdir";
                // create a new directory and a file entry
                createFile(fileName, function () {
                    createDirectory(dirName, function (entry) {
                        // lookup file system entry
                        entry.getFile('../' + fileName, {
                            create : false
                        }, function (fileEntry) {
                            expect(fileEntry).toBeDefined();
                            expect(fileEntry.name).toBe(fileName);
                            expect(fileEntry.fullPath).toCanonicallyMatch('/' + fileName);
                            // cleanup
                            deleteEntry(fileName, function () {
                                deleteEntry(dirName, done);
                            });
                        }, failed.bind(null, done, 'entry.getFile - Error getting file: ' + fileName + ' recently created above: ' + dirName));
                    }, failed.bind(null, done, 'createDirectory - Error creating directory: ' + dirName));
                }, failed.bind(null, done, 'createFile - Error creating file: ' + fileName));
            });
            it("file.spec.113 getFile: get Entry should error for missing file above root directory", function (done) {
                var fileName = "../missing.file";
                // create:false, exclusive:false, file does not exist
                root.getFile(fileName, {
                    create : false
                }, succeed.bind(null, done, 'root.getFile - Unexpected success callback, it should not locate nonexistent file: ' + fileName), function (error) {
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.NOT_FOUND_ERR);
                    done();
                });
            });
        });
        //Parent References
        describe('toNativeURL interface', function () {
            /* These specs verify that FileEntries have a toNativeURL method
             * which appears to be sane.
             */
            var pathExpect = cordova.platformId === 'windowsphone' ? "//nativ" : "file://";
            if (isChrome) {
                pathExpect = 'filesystem:file://';
            }
            it("file.spec.114 fileEntry should have a toNativeURL method", function (done) {
                var fileName = "native.file.uri";
                if (isWindows) {
                    var rootPath = root.fullPath;
                    pathExpect = rootPath.substr(0, rootPath.indexOf(":"));
                }
                // create a new file entry
                createFile(fileName, function (entry) {
                    expect(entry.toNativeURL).toBeDefined();
                    expect(entry.name).toCanonicallyMatch(fileName);
                    expect(typeof entry.toNativeURL).toBe('function');
                    var nativeURL = entry.toNativeURL();
                    var indexOfRoot = isWindows ? nativeURL.indexOf(":") :
                                      isChrome ? 'filesystem:file://'.length : // Chrome uses own prefix for all filesystem urls
                                      7; //default value - length of 'file://' string
                    expect(typeof nativeURL).toBe("string");
                    expect(nativeURL.substring(0, pathExpect.length)).toEqual(pathExpect);
                    expect(nativeURL.substring(nativeURL.length - fileName.length)).toEqual(fileName);
                    // cleanup
                    deleteEntry(fileName, done);
                }, failed.bind(null, done, 'createFile - Error creating file: ' + fileName));
            });
            it("file.spec.115 DirectoryReader should return entries with toNativeURL method", function (done) {
                var dirName = 'nativeEntries.dir',
                fileName = 'nativeEntries.file',
                checkEntries = function (entries) {
                    expect(entries).toBeDefined();
                    expect(entries instanceof Array).toBe(true);
                    expect(entries.length).toBe(1);
                    expect(entries[0].toNativeURL).toBeDefined();
                    expect(typeof entries[0].toNativeURL).toBe('function');
                    var nativeURL = entries[0].toNativeURL();
                    var indexOfRoot = isWindows ? nativeURL.indexOf(":") :
                                      isChrome ? 'filesystem:file://'.length : // Chrome uses own prefix for all filesystem urls
                                      7; //default value - length of 'file://' string
                    expect(typeof nativeURL).toBe("string");
                    expect(nativeURL.substring(0, pathExpect.length)).toEqual(pathExpect);
                    expect(nativeURL.substring(nativeURL.length - fileName.length)).toEqual(fileName);
                    // cleanup
                    directory.removeRecursively(null, null);
                    done();
                };
                // create a new file entry
                root.getDirectory(dirName, {
                    create : true
                }, function (directory) {
                    directory.getFile(fileName, {
                        create : true
                    }, function (fileEntry) {
                        var reader = directory.createReader();
                        reader.readEntries(checkEntries, failed.bind(null, done, 'reader.readEntries - Error reading entries from directory: ' + dirName));
                    }, failed.bind(null, done, 'directory.getFile - Error creating file: ' + fileName));
                }, failed.bind(null, done, 'root.getDirectory - Error creating directory: ' + dirName));
            });
            it("file.spec.116 resolveLocalFileSystemURL should return entries with toNativeURL method", function (done) {
                var fileName = "native.resolve.uri";
                // create a new file entry
                createFile(fileName, function (entry) {
                    resolveLocalFileSystemURL(entry.toURL(), function (entry) {
                        expect(entry.toNativeURL).toBeDefined();
                        expect(entry.name).toCanonicallyMatch(fileName);
                        expect(typeof entry.toNativeURL).toBe('function');
                        var nativeURL = entry.toNativeURL();
                        var indexOfRoot = isWindows ? nativeURL.indexOf(":") :
                                      isChrome ? 'filesystem:file://'.length : // Chrome uses own prefix for all filesystem urls
                                      7; //default value - length of 'file://' string
                        expect(typeof nativeURL).toBe("string");
                        expect(nativeURL.substring(0, pathExpect.length)).toEqual(pathExpect);
                        expect(nativeURL.substring(nativeURL.length - fileName.length)).toEqual(fileName);
                        // cleanup
                        deleteEntry(fileName, done);
                    }, failed.bind(null, done, 'resolveLocalFileSystemURL - Error resolving file URL: ' + entry.toURL()));
                }, failed.bind(null, done, 'createFile - Error creating file: ' + fileName));
            });
        });
        //toNativeURL interface
        describe('resolveLocalFileSystemURL on file://', function () {
            /* These specs verify that window.resolveLocalFileSystemURL works correctly on file:// URLs
             */
            it("file.spec.117 should not resolve native URLs outside of FS roots", function (done) {
                // lookup file system entry
                window.resolveLocalFileSystemURL("file:///this.is.an.invalid.url", succeed.bind(null, done, 'window.resolveLocalFileSystemURL - Unexpected success callback, it should not resolve invalid URL: file:///this.is.an.invalid.url'), function (error) {
                    expect(error).toBeDefined();
                    done();
                });
            });
            it("file.spec.118 should not resolve native URLs outside of FS roots", function (done) {
                // lookup file system entry
                window.resolveLocalFileSystemURL("file://localhost/this.is.an.invalid.url", succeed.bind(null, done, 'window.resolveLocalFileSystemURL - Unexpected success callback, it should not resolve invalid URL: file://localhost/this.is.an.invalid.url'), function (error) {
                    expect(error).toBeDefined();
                    done();
                });
            });
            it("file.spec.119 should not resolve invalid native URLs", function (done) {
                // lookup file system entry
                window.resolveLocalFileSystemURL("file://localhost", succeed.bind(null, done, 'window.resolveLocalFileSystemURL - Unexpected success callback, it should not resolve invalid URL: file://localhost'), function (error) {
                    expect(error).toBeDefined();
                    done();
                });
            });
            it("file.spec.120 should not resolve invalid native URLs with query strings", function (done) {
                // lookup file system entry
                window.resolveLocalFileSystemURL("file://localhost?test/test", succeed.bind(null, done, 'window.resolveLocalFileSystemURL - Unexpected success callback, it should not resolve invalid URL: file://localhost?test/test'), function (error) {
                    expect(error).toBeDefined();
                    done();
                });
            });
            it("file.spec.121 should resolve native URLs returned by API", function (done) {
                var fileName = "native.resolve.uri1";
                // create a new file entry
                createFile(fileName, function (entry) {
                    resolveLocalFileSystemURL(entry.toNativeURL(), function (fileEntry) {
                        expect(fileEntry.fullPath).toCanonicallyMatch(root.fullPath + "/" + fileName);
                        // cleanup
                        deleteEntry(fileName, done);
                    }, failed.bind(null, done, 'resolveLocalFileSystemURL - Error resolving file URL: ' + entry.toNativeURL()));
                }, failed.bind(null, done, 'createFile - Error creating file: ' + fileName));
            });
            it("file.spec.122 should resolve native URLs returned by API with localhost", function (done) {
                var fileName = "native.resolve.uri2";
                // create a new file entry
                createFile(fileName, function (entry) {
                    var url = entry.toNativeURL();
                    url = url.replace("///", "//localhost/");
                    resolveLocalFileSystemURL(url, function (fileEntry) {
                        expect(fileEntry.fullPath).toCanonicallyMatch(root.fullPath + "/" + fileName);
                        // cleanup
                        deleteEntry(fileName, done);
                    }, failed.bind(null, done, 'resolveLocalFileSystemURL - Error resolving file URL: ' + url));
                }, failed.bind(null, done, 'createFile - Error creating file: ' + fileName));
            });
            it("file.spec.123 should resolve native URLs returned by API with query string", function (done) {
                var fileName = "native.resolve.uri3";
                // create a new file entry
                createFile(fileName, function (entry) {
                    var url = entry.toNativeURL();
                    url = url + "?test/test";
                    resolveLocalFileSystemURL(url, function (fileEntry) {
                        expect(fileEntry.fullPath).toCanonicallyMatch(root.fullPath + "/" + fileName);
                        // cleanup
                        deleteEntry(fileName, done);
                    }, failed.bind(null, done, 'resolveLocalFileSystemURL - Error resolving file URL: ' + url));
                }, failed.bind(null, done, 'createFile - Error creating file: ' + fileName));
            });
            it("file.spec.124 should resolve native URLs returned by API with localhost and query string", function (done) {
                var fileName = "native.resolve.uri4";
                // create a new file entry
                createFile(fileName, function (entry) {
                    var url = entry.toNativeURL();
                    url = url.replace("///", "//localhost/") + "?test/test";
                    resolveLocalFileSystemURL(url, function (fileEntry) {
                        expect(fileEntry.fullPath).toCanonicallyMatch(root.fullPath + "/" + fileName);
                        // cleanup
                        deleteEntry(fileName, done);
                    }, failed.bind(null, done, 'resolveLocalFileSystemURL - Error resolving file URL: ' + url));
                }, failed.bind(null, done, 'createFile - Error creating file: ' + fileName));
            });
        });
        //resolveLocalFileSystemURL on file://
        describe('cross-file-system copy and move', function () {
            /* These specs verify that Entry.copyTo and Entry.moveTo work correctly
             * when crossing filesystem boundaries.
             */
            it("file.spec.125 copyTo: temporary -> persistent", function (done) {
                var file1 = "entry.copy.file1a",
                file2 = "entry.copy.file2a",
                sourceEntry,
                fullPath = joinURL(root.fullPath, file2),
                validateFile = function (entry) {
                    // a bit redundant since copy returned this entry already
                    expect(entry).toBeDefined();
                    expect(entry.isFile).toBe(true);
                    expect(entry.isDirectory).toBe(false);
                    expect(entry.name).toCanonicallyMatch(file2);
                    expect(entry.fullPath).toCanonicallyMatch(fullPath);
                    expect(entry.filesystem).toBeDefined();
                    isChrome ? expect(entry.filesystem.name).toContain("Persistent")
                        : expect(entry.filesystem.name).toEqual("persistent");
                    // cleanup
                    deleteEntry(entry.name);
                    deleteEntry(sourceEntry.name, done);
                },
                createSourceAndTransfer = function () {
                    temp_root.getFile(file1, {
                        create : true
                    }, function (entry) {
                        expect(entry.filesystem).toBeDefined();
                        isChrome ? expect(entry.filesystem.name).toContain("Temporary")
                            : expect(entry.filesystem.name).toEqual("temporary");
                        sourceEntry = entry;
                        // Save for later cleanup
                        entry.copyTo(persistent_root, file2, validateFile, failed.bind(null, done, 'entry.copyTo - Error copying file: ' + file1 + ' to PERSISTENT root as: ' + file2));
                    }, failed.bind(null, done, 'temp_root.getFile - Error creating file: ' + file1 + 'at TEMPORAL root'));
                };
                // Delete any existing file to start things off
                persistent_root.getFile(file2, {}, function (entry) {
                    entry.remove(createSourceAndTransfer, failed.bind(null, done, 'entry.remove - Error removing file: ' + file2));
                }, createSourceAndTransfer);
            });
            it("file.spec.126 copyTo: persistent -> temporary", function (done) {
                var file1 = "entry.copy.file1b",
                file2 = "entry.copy.file2b",
                sourceEntry,
                fullPath = joinURL(temp_root.fullPath, file2),
                validateFile = function (entry) {
                    expect(entry).toBeDefined();
                    expect(entry.isFile).toBe(true);
                    expect(entry.isDirectory).toBe(false);
                    expect(entry.name).toCanonicallyMatch(file2);
                    expect(entry.fullPath).toCanonicallyMatch(fullPath);
                    isChrome ? expect(entry.filesystem.name).toContain("Temporary")
                        : expect(entry.filesystem.name).toEqual("temporary");
                    // cleanup
                    deleteEntry(entry.name);
                    deleteEntry(sourceEntry.name, done);
                },
                createSourceAndTransfer = function () {
                    persistent_root.getFile(file1, {
                        create : true
                    }, function (entry) {
                        expect(entry).toBeDefined();
                        expect(entry.filesystem).toBeDefined();
                        isChrome ? expect(entry.filesystem.name).toContain("Persistent")
                            : expect(entry.filesystem.name).toEqual("persistent");
                        sourceEntry = entry;
                        // Save for later cleanup
                        entry.copyTo(temp_root, file2, validateFile, failed.bind(null, done, 'entry.copyTo - Error copying file: ' + file1 + ' to TEMPORAL root as: ' + file2));
                    }, failed.bind(null, done, 'persistent_root.getFile - Error creating file: ' + file1 + 'at PERSISTENT root'));
                };
                // Delete any existing file to start things off
                temp_root.getFile(file2, {}, function (entry) {
                    entry.remove(createSourceAndTransfer, failed.bind(null, done, 'entry.remove - Error removing file: ' + file2));
                }, createSourceAndTransfer);
            });
            it("file.spec.127 moveTo: temporary -> persistent", function (done) {
                var file1 = "entry.copy.file1a",
                file2 = "entry.copy.file2a",
                sourceEntry,
                fullPath = joinURL(root.fullPath, file2),
                validateFile = function (entry) {
                    // a bit redundant since copy returned this entry already
                    expect(entry).toBeDefined();
                    expect(entry.isFile).toBe(true);
                    expect(entry.isDirectory).toBe(false);
                    expect(entry.name).toCanonicallyMatch(file2);
                    expect(entry.fullPath).toCanonicallyMatch(fullPath);
                    expect(entry.filesystem).toBeDefined();
                    isChrome ? expect(entry.filesystem.name).toContain("Persistent")
                        : expect(entry.filesystem.name).toEqual("persistent");
                    // cleanup
                    deleteEntry(entry.name);
                    deleteEntry(sourceEntry.name, done);
                },
                createSourceAndTransfer = function () {
                    temp_root.getFile(file1, {
                        create : true
                    }, function (entry) {
                        expect(entry.filesystem).toBeDefined();
                        isChrome ? expect(entry.filesystem.name).toContain("Temporary")
                            : expect(entry.filesystem.name).toEqual("temporary");
                        sourceEntry = entry;
                        // Save for later cleanup
                        entry.moveTo(persistent_root, file2, validateFile, failed.bind(null, done, 'entry.moveTo - Error moving file: ' + file1 + ' to PERSISTENT root as: ' + file2));
                    }, failed.bind(null, done, 'temp_root.getFile - Error creating file: ' + file1 + 'at TEMPORAL root'));
                };
                // Delete any existing file to start things off
                persistent_root.getFile(file2, {}, function (entry) {
                    entry.remove(createSourceAndTransfer, failed.bind(null, done, 'entry.remove - Error removing file: ' + file2));
                }, createSourceAndTransfer);
            });
            it("file.spec.128 moveTo: persistent -> temporary", function (done) {
                var file1 = "entry.copy.file1b",
                file2 = "entry.copy.file2b",
                sourceEntry,
                fullPath = joinURL(temp_root.fullPath, file2),
                validateFile = function (entry) {
                    expect(entry).toBeDefined();
                    expect(entry.isFile).toBe(true);
                    expect(entry.isDirectory).toBe(false);
                    expect(entry.name).toCanonicallyMatch(file2);
                    expect(entry.fullPath).toCanonicallyMatch(fullPath);
                    isChrome ? expect(entry.filesystem.name).toContain("Temporary")
                        : expect(entry.filesystem.name).toEqual("temporary");
                    // cleanup
                    deleteEntry(entry.name);
                    deleteEntry(sourceEntry.name, done);
                },
                createSourceAndTransfer = function () {
                    persistent_root.getFile(file1, {
                        create : true
                    }, function (entry) {
                        expect(entry).toBeDefined();
                        expect(entry.filesystem).toBeDefined();
                        isChrome ? expect(entry.filesystem.name).toContain("Persistent")
                            : expect(entry.filesystem.name).toEqual("persistent");
                        sourceEntry = entry;
                        // Save for later cleanup
                        entry.moveTo(temp_root, file2, validateFile, failed.bind(null, done, 'entry.moveTo - Error moving file: ' + file1 + ' to TEMPORAL root as: ' + file2));
                    }, failed.bind(null, done, 'persistent_root.getFile - Error creating file: ' + file1 + 'at PERSISTENT root'));
                };
                // Delete any existing file to start things off
                temp_root.getFile(file2, {}, function (entry) {
                    entry.remove(createSourceAndTransfer, failed.bind(null, done, 'entry.remove - Error removing file: ' + file2));
                }, createSourceAndTransfer);
            });
            it("file.spec.129 cordova.file.*Directory are set", function () {
                var expectedPaths = ['applicationDirectory', 'applicationStorageDirectory', 'dataDirectory', 'cacheDirectory'];
                if (cordova.platformId == 'android' || cordova.platformId == 'amazon-fireos') {
                    expectedPaths.push('externalApplicationStorageDirectory', 'externalRootDirectory', 'externalCacheDirectory', 'externalDataDirectory');
                } else if (cordova.platformId == 'blackberry10') {
                    expectedPaths.push('externalRootDirectory', 'sharedDirectory');
                } else if (cordova.platformId == 'ios') {
                    expectedPaths.push('syncedDataDirectory', 'documentsDirectory', 'tempDirectory');
                } else if (cordova.platformId == 'osx') {
                    expectedPaths.push('documentsDirectory', 'tempDirectory', 'rootDirectory');
                } else {
                    console.log('Skipping test due on unsupported platform.');
                    return;
                }
                for (var i = 0; i < expectedPaths.length; ++i) {
                    expect(typeof cordova.file[expectedPaths[i]]).toBe('string');
                    expect(cordova.file[expectedPaths[i]]).toMatch(/\/$/, 'Path should end with a slash');
                }
            });
        });
        //cross-file-system copy and move
        describe('IndexedDB-based impl', function () {
            it("file.spec.131 Nested file or nested directory should be removed when removing a parent directory", function (done) {
                var parentDirName = 'deletedDir131',
                    nestedDirName = 'nestedDir131',
                    nestedFileName = 'nestedFile131.txt';

                createDirectory(parentDirName, function (parent) {
                    parent.getDirectory(nestedDirName, { create: true}, function () {
                        parent.getFile(nestedFileName, { create: true}, function () {
                            parent.removeRecursively(function() {
                                root.getDirectory(parentDirName,{ create: false}, failed.bind(this, done, 'root.getDirectory - unexpected success callback : ' + parentDirName), function(){
                                    parent.getFile(nestedFileName,{ create: false}, failed.bind(this, done, 'getFile - unexpected success callback : ' + nestedFileName), function(){
                                            parent.getDirectory(nestedDirName, { create: false}, failed.bind(this, done, 'getDirectory - unexpected success callback : ' + nestedDirName), done);
                                        });
                                    });
                                }, failed.bind(this, done, 'removeRecursively - Error removing directory : ' + parentDirName));
                        }, failed.bind(this, done, 'getFile - Error creating file : ' + nestedFileName));
                    },failed.bind(this, done, 'getDirectory - Error creating directory : ' + nestedDirName));
                }, failed.bind(this, done, 'root.getDirectory - Error creating directory : ' + parentDirName));
            });
            it("file.spec.132 Entry should be created succesfully when using relative paths if its parent directory exists", function (done) {
                /* Directory entries have to be created successively.
                   For example, the call `fs.root.getDirectory('dir1/dir2', {create:true}, successCallback, errorCallback)`
                   will fail if dir1 did not exist. */
                var parentName = 'parentName132';
                var nestedName = 'nestedName132';
                var path = parentName + '/' + nestedName;

                var win = function(directory){
                    expect(directory).toBeDefined();
                    expect(directory.isFile).toBe(false);
                    expect(directory.isDirectory).toBe(true);
                    expect(directory.name).toCanonicallyMatch(nestedName);
                    expect(directory.fullPath).toCanonicallyMatch('/' + path + '/');
                    deleteEntry(directory.name);
                    deleteEntry(parentName, done);
                };

                createDirectory(parentName, function() {
                    root.getDirectory(parentName + '/' + nestedName, {create:true}, win,
                        failed.bind(this, done, 'root.getDirectory - Error getting directory : ' + path));
                }, failed.bind(this, done, 'root.getDirectory - Error getting directory : ' + parentName));
            });
            it("file.spec.133 A file being removed should not affect another file with name being a prefix of the removed file name.", function (done) {

                // Names include special symbols so that we check the IndexedDB range used
                var deletedFileName = 'deletedFile.0',
                secondFileName = 'deletedFile.0.1';

                var win = function(fileEntry){
                    expect(fileEntry).toBeDefined();
                    expect(fileEntry.isFile).toBe(true);
                    expect(fileEntry.isDirectory).toBe(false);
                    expect(fileEntry.name).toCanonicallyMatch(secondFileName);
                    deleteEntry(fileEntry.name, done);
                };

                createFile(deletedFileName, function (deletedFile) {
                    createFile(secondFileName, function () {
                        deletedFile.remove(function() {
                            root.getFile(deletedFileName, {create: false}, failed.bind(this, done, 'getFile - unexpected success callback getting deleted file : ' + deletedFileName), function(){
                                root.getFile(secondFileName, {create: false}, win, failed.bind(this, done, 'getFile - Error getting file after deleting deletedFile : ' + secondFileName));
                            });
                        }, failed.bind(this, done, 'remove - Error removing file : ' + deletedFileName));
                    }, failed.bind(this, done, 'getFile - Error creating file : ' + secondFileName));
                }, failed.bind(this, done, 'getFile - Error creating file : ' + deletedFileName));
            });
            it("file.spec.134 A directory being removed should not affect another directory with name being a prefix of the removed directory name.", function (done) {

                // Names include special symbols so that we check the IndexedDB range used
                var deletedDirName = 'deletedDir.0',
                secondDirName = 'deletedDir.0.1';

                var win = function(directory){
                    expect(directory).toBeDefined();
                    expect(directory.isFile).toBe(false);
                    expect(directory.isDirectory).toBe(true);
                    expect(directory.name).toCanonicallyMatch(secondDirName);
                    deleteEntry(directory.name, done);
                };

                createDirectory(deletedDirName, function (deletedDir) {
                    createDirectory(secondDirName, function () {
                        deletedDir.remove(function() {
                            root.getDirectory(deletedDirName, {create: false}, failed.bind(this, done, 'getDirectory - unexpected success callback getting deleted directory : ' + deletedDirName), function() {
                                root.getDirectory(secondDirName, {create: false}, win, failed.bind(this, done, 'getDirectory - Error getting directory after deleting deletedDirectory : ' + secondDirName));
                            });
                        }, failed.bind(this, done, 'remove - Error removing directory : ' + deletedDirName));
                    }, failed.bind(this, done, 'root.getDirectory - Error creating directory : ' + secondDirName));
                }, failed.bind(this, done, 'root.getDirectory - Error creating directory : ' + deletedDirName));
            });
            it("file.spec.135 Deletion of a child directory should not affect the parent directory.", function (done) {

                var parentName = 'parentName135';
                var childName = 'childName135';

                var win = function(directory){
                    expect(directory).toBeDefined();
                    expect(directory.isFile).toBe(false);
                    expect(directory.isDirectory).toBe(true);
                    expect(directory.name).toCanonicallyMatch(parentName);
                    deleteEntry(directory.name, done);
                };

                createDirectory(parentName, function(parent){
                    parent.getDirectory(childName, {create: true}, function(child){
                        child.removeRecursively(function(){
                            root.getDirectory(parentName, {create: false}, win, failed.bind(this, done, 'root.getDirectory - Error getting parent directory : ' + parentName));
                        },
                        failed.bind(this, done, 'getDirectory - Error removing directory : ' + childName));
                    }, failed.bind(this, done, 'getDirectory - Error creating directory : ' + childName));
                }, failed.bind(this, done, 'root.getDirectory - Error creating directory : ' + parentName));
            });
            it("file.spec.136 Paths should support Unicode symbols.", function (done) {

                var dirName = '文件插件';

                var win = function(directory){
                    expect(directory).toBeDefined();
                    expect(directory.isFile).toBe(false);
                    expect(directory.isDirectory).toBe(true);
                    expect(directory.name).toCanonicallyMatch(dirName);
                    deleteEntry(directory.name, done);
                };

                createDirectory(dirName, function(){
                    root.getDirectory(dirName, {create: false}, win,
                        failed.bind(this, done, 'root.getDirectory - Error getting directory : ' + dirName));
                }, failed.bind(this, done, 'root.getDirectory - Error creating directory : ' + dirName));
            });
        });
        // Content and Asset URLs
        if (cordova.platformId == 'android') {
            describe('content: URLs', function() {
                function testContentCopy(src, done) {
                    var file2 = "entry.copy.file2b",
                    fullPath = joinURL(temp_root.fullPath, file2),
                    validateFile = function (entry) {
                        expect(entry.isFile).toBe(true);
                        expect(entry.isDirectory).toBe(false);
                        expect(entry.name).toCanonicallyMatch(file2);
                        expect(entry.fullPath).toCanonicallyMatch(fullPath);
                        expect(entry.filesystem.name).toEqual("temporary");
                        // cleanup
                        deleteEntry(entry.name, done);
                    },
                    transfer = function () {
                        resolveLocalFileSystemURL(src, function(entry) {
                            expect(entry).toBeDefined();
                            expect(entry.filesystem.name).toEqual("content");
                            entry.copyTo(temp_root, file2, validateFile, failed.bind(null, done, 'entry.copyTo - Error copying file: ' + entry.toURL() + ' to TEMPORAL root as: ' + file2));
                        }, failed.bind(null, done, 'resolveLocalFileSystemURL failed for content provider'));
                    };
                    // Delete any existing file to start things off
                    temp_root.getFile(file2, {}, function (entry) {
                        entry.remove(transfer, failed.bind(null, done, 'entry.remove - Error removing file: ' + file2));
                    }, transfer);
                }
                it("file.spec.138 copyTo: content", function(done) {
                    testContentCopy('content://org.apache.cordova.file.testprovider/www/index.html', done);
                });
                it("file.spec.139 copyTo: content /w space and query", function(done) {
                    testContentCopy('content://org.apache.cordova.file.testprovider/?name=foo%20bar&realPath=%2Fwww%2Findex.html', done);
                });
                it("file.spec.140 delete: content should fail", function(done) {
                    resolveLocalFileSystemURL('content://org.apache.cordova.file.testprovider/www/index.html', function(entry) {
                        entry.remove(failed.bind(null, done, 'expected delete to fail'), done);
                    }, failed.bind(null, done, 'resolveLocalFileSystemURL failed for content provider'));
                });
            });

            // these tests ensure that you can read and copy from android_asset folder
            // for details see https://issues.apache.org/jira/browse/CB-6428
            // and https://mail-archives.apache.org/mod_mbox/cordova-dev/201508.mbox/%3C782154441.8406572.1440182722528.JavaMail.yahoo%40mail.yahoo.com%3E
            describe('asset: URLs', function() {
                it("file.spec.141 filePaths.applicationStorage", function() {
                    expect(cordova.file.applicationDirectory).toEqual('file:///android_asset/');
                }, MEDIUM_TIMEOUT);
                it("file.spec.142 assets should be enumerable", function(done) {
                    resolveLocalFileSystemURL('file:///android_asset/www/fixtures/asset-test', function(entry) {
                        var reader = entry.createReader();
                        reader.readEntries(function (entries) {
                            expect(entries.length).not.toBe(0);
                            done();
                        }, failed.bind(null, done, 'reader.readEntries - Error during reading of entries from assets directory'));
                    }, failed.bind(null, done, 'resolveLocalFileSystemURL failed for assets'));
                }, MEDIUM_TIMEOUT);
                it("file.spec.145 asset subdirectories should be obtainable", function(done) {
                    resolveLocalFileSystemURL('file:///android_asset/www/fixtures', function(entry) {
                        entry.getDirectory('asset-test', { create: false }, function (subDir) {
                            expect(subDir).toBeDefined();
                            expect(subDir.isFile).toBe(false);
                            expect(subDir.isDirectory).toBe(true);
                            expect(subDir.name).toCanonicallyMatch('asset-test');
                            done();
                        }, failed.bind(null, done, 'entry.getDirectory - Error getting asset subdirectory'));
                    }, failed.bind(null, done, 'resolveLocalFileSystemURL failed for assets'));
                }, MEDIUM_TIMEOUT);
                it("file.spec.146 asset files should be readable", function(done) {
                    resolveLocalFileSystemURL('file:///android_asset/www/fixtures/asset-test/asset-test.txt', function(entry) {
                        expect(entry.isFile).toBe(true);
                        entry.file(function (file) {
                            expect(file).toBeDefined();
                            var reader = new FileReader();
                            reader.onerror = failed.bind(null, done, 'reader.readAsText - Error reading asset text file');
                            reader.onloadend = function () {
                                expect(this.result).toBeDefined();
                                expect(this.result.length).not.toBe(0);
                                done();
                            };
                            reader.readAsText(file);
                        }, failed.bind(null, done, 'entry.file - Error reading asset file'));
                    }, failed.bind(null, done, 'resolveLocalFileSystemURL failed for assets'));
                }, MEDIUM_TIMEOUT);
                it("file.spec.143 copyTo: asset -> temporary", function(done) {
                    var file2 = "entry.copy.file2b",
                    fullPath = joinURL(temp_root.fullPath, file2),
                    validateFile = function (entry) {
                        expect(entry.isFile).toBe(true);
                        expect(entry.isDirectory).toBe(false);
                        expect(entry.name).toCanonicallyMatch(file2);
                        expect(entry.fullPath).toCanonicallyMatch(fullPath);
                        expect(entry.filesystem.name).toEqual("temporary");
                        // cleanup
                        deleteEntry(entry.name, done);
                    },
                    transfer = function () {
                        resolveLocalFileSystemURL('file:///android_asset/www/index.html', function(entry) {
                            expect(entry.filesystem.name).toEqual('assets');
                            entry.copyTo(temp_root, file2, validateFile, failed.bind(null, done, 'entry.copyTo - Error copying file: ' + entry.toURL() + ' to TEMPORAL root as: ' + file2));
                        }, failed.bind(null, done, 'resolveLocalFileSystemURL failed for assets'));
                    };
                    // Delete any existing file to start things off
                    temp_root.getFile(file2, {}, function (entry) {
                        entry.remove(transfer, failed.bind(null, done, 'entry.remove - Error removing file: ' + file2));
                    }, transfer);
                }, MEDIUM_TIMEOUT);
            });
            it("file.spec.144 copyTo: asset directory", function (done) {
                var srcUrl = 'file:///android_asset/www/fixtures/asset-test';
                var dstDir = "entry.copy.dstDir";
                var dstPath = joinURL(root.fullPath, dstDir);
                // create a new directory entry to kick off it
                deleteEntry(dstDir, function () {
                    resolveLocalFileSystemURL(srcUrl, function(directory) {
                        directory.copyTo(root, dstDir, function (directory) {
                            expect(directory).toBeDefined();
                            expect(directory.isFile).toBe(false);
                            expect(directory.isDirectory).toBe(true);
                            expect(directory.fullPath).toCanonicallyMatch(dstPath);
                            expect(directory.name).toCanonicallyMatch(dstDir);
                            root.getDirectory(dstDir, {
                                create : false
                            }, function (dirEntry) {
                                expect(dirEntry).toBeDefined();
                                expect(dirEntry.isFile).toBe(false);
                                expect(dirEntry.isDirectory).toBe(true);
                                expect(dirEntry.fullPath).toCanonicallyMatch(dstPath);
                                expect(dirEntry.name).toCanonicallyMatch(dstDir);
                                dirEntry.getFile('asset-test.txt', {
                                    create : false
                                }, function (fileEntry) {
                                    expect(fileEntry).toBeDefined();
                                    expect(fileEntry.isFile).toBe(true);
                                    // cleanup
                                    deleteEntry(dstDir, done);
                                }, failed.bind(null, done, 'dirEntry.getFile - Error getting subfile'));
                            }, failed.bind(null, done, 'root.getDirectory - Error getting copied directory'));
                        }, failed.bind(null, done, 'directory.copyTo - Error copying directory'));
                    }, failed.bind(null, done, 'resolving src dir'));
                }, failed.bind(null, done, 'deleteEntry - Error removing directory : ' + dstDir));
            }, MEDIUM_TIMEOUT);
        }
    });

};
//******************************************************************************************
//***************************************Manual Tests***************************************
//******************************************************************************************

exports.defineManualTests = function (contentEl, createActionButton) {

    function resolveFs(fsname) {
        var fsURL = "cdvfile://localhost/" + fsname + "/";
        logMessage("Resolving URL: " + fsURL);
        resolveLocalFileSystemURL(fsURL, function (entry) {
            logMessage("Success", 'green');
            logMessage(entry.toURL(), 'blue');
            logMessage(entry.toInternalURL(), 'blue');
            logMessage("Resolving URL: " + entry.toURL());
            resolveLocalFileSystemURL(entry.toURL(), function (entry2) {
                logMessage("Success", 'green');
                logMessage(entry2.toURL(), 'blue');
                logMessage(entry2.toInternalURL(), 'blue');
            }, logError("resolveLocalFileSystemURL"));
        }, logError("resolveLocalFileSystemURL"));
    }

    function testPrivateURL() {
        requestFileSystem(TEMPORARY, 0, function (fileSystem) {
            logMessage("Temporary root is at " + fileSystem.root.toNativeURL());
            fileSystem.root.getFile("testfile", {
                create : true
            }, function (entry) {
                logMessage("Temporary file is at " + entry.toNativeURL());
                if (entry.toNativeURL().substring(0, 12) == "file:///var/") {
                    logMessage("File starts with /var/, trying /private/var");
                    var newURL = "file://localhost/private/var/" + entry.toNativeURL().substring(12) + "?and=another_thing";
                    //var newURL = entry.toNativeURL();
                    logMessage(newURL, 'blue');
                    resolveLocalFileSystemURL(newURL, function (newEntry) {
                        logMessage("Successfully resolved.", 'green');
                        logMessage(newEntry.toURL(), 'blue');
                        logMessage(newEntry.toNativeURL(), 'blue');
                    }, logError("resolveLocalFileSystemURL"));
                }
            }, logError("getFile"));
        }, logError("requestFileSystem"));
    }

    function clearLog() {
        var log = document.getElementById("info");
        log.innerHTML = "";
    }

    function logMessage(message, color) {
        var log = document.getElementById("info");
        var logLine = document.createElement('div');
        if (color) {
            logLine.style.color = color;
        }
        logLine.innerHTML = message;
        log.appendChild(logLine);
    }

    function logError(serviceName) {
        return function (err) {
            logMessage("ERROR: " + serviceName + " " + JSON.stringify(err), "red");
        };
    }

    var fsRoots = {
        "ios" : "library,library-nosync,documents,documents-nosync,cache,bundle,root,private",
        "osx" : "library,library-nosync,documents,documents-nosync,cache,bundle,root,private",
        "android" : "files,files-external,documents,sdcard,cache,cache-external,root",
        "amazon-fireos" : "files,files-external,documents,sdcard,cache,cache-external,root",
        "windows": "temporary,persistent"
    };

    //Add title and align to content
    var div = document.createElement('h2');
    div.appendChild(document.createTextNode('File Systems'));
    div.setAttribute("align", "center");
    contentEl.appendChild(div);

    div = document.createElement('h3');
    div.appendChild(document.createTextNode('Results are displayed in yellow status box below with expected results noted under that'));
    div.setAttribute("align", "center");
    contentEl.appendChild(div);

    div = document.createElement('div');
    div.setAttribute("id", "button");
    div.setAttribute("align", "center");
    contentEl.appendChild(div);
    if (fsRoots.hasOwnProperty(cordova.platformId)) {
        (fsRoots[cordova.platformId].split(',')).forEach(function (fs) {
            if (cordova.platformId === 'ios' && fs === 'private') {
                createActionButton("Test private URL (iOS)", function () {
                    clearLog();
                    testPrivateURL();
                }, 'button');
            } else {
                createActionButton(fs, function () {
                    clearLog();
                    resolveFs(fs);
                }, 'button');
            }
        });
    }


    div = document.createElement('div');
    div.setAttribute("id", "info");
    div.setAttribute("align", "center");
    contentEl.appendChild(div);

    div = document.createElement('h3');
    div.appendChild(document.createTextNode('For each test above, file or directory should be successfully found. ' +
        'Status box should say Resolving URL was Success. The first URL resolved is the internal URL. ' +
        'The second URL resolved is the absolute URL. Blue URLs must match.'));
    contentEl.appendChild(div);

    div = document.createElement('h3');
    div.appendChild(document.createTextNode('For Test private URL (iOS), the private URL (first blue URL in status box) ' +
        'should be successfully resolved. Status box should say Successfully resolved. Both blue URLs below ' +
        'that should match.'));
    contentEl.appendChild(div);
};
