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

var cordova = require('cordova');
var Entry = require('./Entry'),
    File = require('./File'),
    FileEntry = require('./FileEntry'),
    FileError = require('./FileError'),
    DirectoryEntry = require('./DirectoryEntry'),
    Flags = require('./Flags'),
    FileSystem = require('./FileSystem'),
    LocalFileSystem = require('./LocalFileSystem');

// Some private helper functions, hidden by the module
function cordovaPathToNative(path) {
    // turn / into \\
    var cleanPath = path.replace(/\//g, '\\');
    // turn  \\ into \
    cleanPath = cleanPath.replace(/\\\\/g, '\\');
    return cleanPath;
};

function nativePathToCordova(path) {
    var cleanPath = path.replace(/\\/g, '/');s
    return cleanPath;
};

var getFolderFromPathAsync = Windows.Storage.StorageFolder.getFolderFromPathAsync;
var getFileFromPathAsync = Windows.Storage.StorageFile.getFileFromPathAsync;


module.exports = {

    getFileMetadata: function (win, fail, args) {

        var fullPath = cordovaPathToNative(args[0]);

        getFileFromPathAsync(fullPath).done(
            function (storageFile) {
                storageFile.getBasicPropertiesAsync().then(
                    function (basicProperties) {
                        win(new File(storageFile.name, storageFile.path, storageFile.fileType, basicProperties.dateModified, basicProperties.size));
                    }, function () {
                        fail(FileError.NOT_READABLE_ERR);
                    }
                );
            }, function () {
                fail(FileError.NOT_FOUND_ERR);
            }
        );
    },

    getMetadata: function (success, fail, args) {

        var fullPath = cordovaPathToNative(args[0]);

        var dealFile = function (sFile) {
            getFileFromPathAsync(fullPath).then(
                function (storageFile) {
                    return storageFile.getBasicPropertiesAsync();
                },
                function () {
                    fail(FileError.NOT_READABLE_ERR);
                }
            // get the basic properties of the file.
            ).then(
                function (basicProperties) {
                    success(basicProperties.dateModified);
                },
                function () {
                    fail(FileError.NOT_READABLE_ERR);
                }
            );
        };

        var dealFolder = function (sFolder) {
            getFolderFromPathAsync(fullPath).then(
                function (storageFolder) {
                    return storageFolder.getBasicPropertiesAsync();
                },
                function () {
                    fail(FileError.NOT_READABLE_ERR);
                }
            // get the basic properties of the folder.
            ).then(
                function (basicProperties) {
                    success(basicProperties.dateModified);
                },
                function () {
                    fail(FileError.NOT_FOUND_ERR);
                }
            );
        };

        getFileFromPathAsync(fullPath).then(
            // the path is file.
            function (sFile) {
                dealFile(sFile);
            },
            // the path is folder
            function () {
                getFolderFromPathAsync(fullPath).then(
                    function (sFolder) {
                        dealFolder(sFolder);
                    }, function () {
                        fail(FileError.NOT_FOUND_ERR);
                    }
                );
            }
        );
    },

    getParent: function (win, fail, args) { // ["fullPath"]

        var fullPath = cordovaPathToNative(args[0]);

        var storageFolderPer = Windows.Storage.ApplicationData.current.localFolder;
        var storageFolderTem = Windows.Storage.ApplicationData.current.temporaryFolder;

        if (fullPath == storageFolderPer.path) {
            win(new DirectoryEntry(storageFolderPer.name, storageFolderPer.path));
            return;
        } else if (fullPath == storageFolderTem.path) {
            win(new DirectoryEntry(storageFolderTem.name, storageFolderTem.path));
            return;
        }
        var splitArr = fullPath.split(new RegExp(/\/|\\/g));

        var popItem = splitArr.pop();

        var result = new DirectoryEntry(popItem, fullPath.substr(0, fullPath.length - popItem.length - 1));
        getFolderFromPathAsync(result.fullPath).done(
            function () { win(result); },
            function () { fail(FileError.INVALID_STATE_ERR); }
        );
    },

    readAsText: function (win, fail, args) {

        var fileName = cordovaPathToNative(args[0]),
            enc = args[1],
            startPos = args[2],
            endPos = args[3];
        
        var encoding = Windows.Storage.Streams.UnicodeEncoding.utf8;
        if (enc == 'Utf16LE' || enc == 'utf16LE') {
            encoding = Windows.Storage.Streams.UnicodeEncoding.utf16LE;
        } else if (enc == 'Utf16BE' || enc == 'utf16BE') {
            encoding = Windows.Storage.Streams.UnicodeEncoding.utf16BE;
        }

        getFileFromPathAsync(fileName).then(function(file) {
                return file.openReadAsync();
            }).then(function (stream) {
                startPos = (startPos < 0) ? Math.max(stream.size + startPos, 0) : Math.min(stream.size, startPos);
                endPos = (endPos < 0) ? Math.max(endPos + stream.size, 0) : Math.min(stream.size, endPos);
                stream.seek(startPos);
                
                var readSize = endPos - startPos,
                    buffer = new Windows.Storage.Streams.Buffer(readSize);

                return stream.readAsync(buffer, readSize, Windows.Storage.Streams.InputStreamOptions.none);
            }).done(function(buffer) {
                win(Windows.Security.Cryptography.CryptographicBuffer.convertBinaryToString(encoding, buffer));
            },function() {
                fail(FileError.NOT_FOUND_ERR);
            });
    },

    readAsBinaryString:function(win,fail,args) {
        var fileName = cordovaPathToNative(args[0]);

        getFileFromPathAsync(fileName).then(
            function (storageFile) {
                Windows.Storage.FileIO.readBufferAsync(storageFile).done(
                    function (buffer) {
                        var dataReader = Windows.Storage.Streams.DataReader.fromBuffer(buffer);
                        var fileContent = dataReader.readString(buffer.length);
                        dataReader.close();
                        win(fileContent);
                    }
                );
            }, function () {
                fail(FileError.NOT_FOUND_ERR);
            }
        );
    },

    readAsArrayBuffer:function(win,fail,args) {
        var fileName =cordovaPathToNative(args[0]);

        getFileFromPathAsync(fileName).then(
            function (storageFile) {
                var blob = MSApp.createFileFromStorageFile(storageFile);
                var url = URL.createObjectURL(blob, { oneTimeOnly: true });
                var xhr = new XMLHttpRequest();
                xhr.open("GET", url, true);
                xhr.responseType = 'arraybuffer';
                xhr.onload = function() {
                    win(xhr.response);
                };
                xhr.send();
            }, function () {
                fail(FileError.NOT_FOUND_ERR);
            }
        );
    },

    readAsDataURL: function (win, fail, args) {

        var fileName = cordovaPathToNative(args[0]);

        getFileFromPathAsync(fileName).then(
            function (storageFile) {
                Windows.Storage.FileIO.readBufferAsync(storageFile).done(
                    function (buffer) {
                        var strBase64 = Windows.Security.Cryptography.CryptographicBuffer.encodeToBase64String(buffer);
                        //the method encodeToBase64String will add "77u/" as a prefix, so we should remove it
                        if(String(strBase64).substr(0,4) == "77u/") {
                            strBase64 = strBase64.substr(4);
                        }
                        var mediaType = storageFile.contentType;
                        var result = "data:" + mediaType + ";base64," + strBase64;
                        win(result);
                    }
                );
            }, function () {
                fail(FileError.NOT_FOUND_ERR);
            }
        );
    },

    getDirectory: function (win, fail, args) {

        var fullPath = cordovaPathToNative(args[0]);
        var path = cordovaPathToNative(args[1]);
        var options = args[2];

        var flag = "";
        if (options !== null) {
            flag = new Flags(options.create, options.exclusive);
        } else {
            flag = new Flags(false, false);
        }

        getFolderFromPathAsync(fullPath).then(
            function (storageFolder) {
                if (flag.create === true && flag.exclusive === true) {
                    storageFolder.createFolderAsync(path, Windows.Storage.CreationCollisionOption.failIfExists).done(
                        function (storageFolder) {
                            win(new DirectoryEntry(storageFolder.name, storageFolder.path));
                        }, function () {
                            fail(FileError.PATH_EXISTS_ERR);
                        }
                    );
                } else if (flag.create === true && flag.exclusive === false) {
                    storageFolder.createFolderAsync(path, Windows.Storage.CreationCollisionOption.openIfExists).done(
                        function (storageFolder) {
                            win(new DirectoryEntry(storageFolder.name, storageFolder.path + "/"));
                        }, function () {
                            fail(FileError.INVALID_MODIFICATION_ERR);
                        }
                    );
                } else if (flag.create === false) {
                    if (/\?|\\|\*|\||\"|<|>|\:|\//g.test(path)) {
                        fail(FileError.ENCODING_ERR);
                        return;
                    }

                    storageFolder.getFolderAsync(path).done(
                        function (storageFolder) {
                            win(new DirectoryEntry(storageFolder.name, storageFolder.path));
                        }, function () {
                            // check if path actually points to a file
                            storageFolder.getFileAsync(path).done(
                                function () {
                                    fail(FileError.TYPE_MISMATCH_ERR);
                                }, function() {
                                    fail(FileError.NOT_FOUND_ERR);
                                });
                        }
                    );
                }
            }, function () {
                fail(FileError.NOT_FOUND_ERR);
            }
        );
    },

    remove: function (win, fail, args) {

        var fullPath = cordovaPathToNative(args[0]);

        getFileFromPathAsync(fullPath).then(
            function (sFile) {
                getFileFromPathAsync(fullPath).done(function (storageFile) {
                    storageFile.deleteAsync().done(win, function () {
                        fail(FileError.INVALID_MODIFICATION_ERR);

                    });
                });
            },
            function () {
                getFolderFromPathAsync(fullPath).then(
                    function (sFolder) {
                        var removeEntry = function () {
                            var storageFolderTop = null;

                            getFolderFromPathAsync(fullPath).then(
                                function (storageFolder) {
                                    // FileSystem root can't be removed!
                                    var storageFolderPer = Windows.Storage.ApplicationData.current.localFolder;
                                    var storageFolderTem = Windows.Storage.ApplicationData.current.temporaryFolder;
                                    if (fullPath == storageFolderPer.path || fullPath == storageFolderTem.path) {
                                        fail(FileError.NO_MODIFICATION_ALLOWED_ERR);
                                        return;
                                    }
                                    storageFolderTop = storageFolder;
                                    return storageFolder.createFileQuery().getFilesAsync();
                                }, function () {
                                    fail(FileError.INVALID_MODIFICATION_ERR);

                                }
                            // check sub-files.
                            ).then(function (fileList) {
                                if (fileList) {
                                    if (fileList.length === 0) {
                                        return storageFolderTop.createFolderQuery().getFoldersAsync();
                                    } else {
                                        fail(FileError.INVALID_MODIFICATION_ERR);
                                    }
                                }
                            // check sub-folders.
                            }).then(function (folderList) {
                                if (folderList) {
                                    if (folderList.length === 0) {
                                        storageFolderTop.deleteAsync().done(win, function () {
                                            fail(FileError.INVALID_MODIFICATION_ERR);

                                        });
                                    } else {
                                        fail(FileError.INVALID_MODIFICATION_ERR);
                                    }
                                }

                            });
                        };
                        removeEntry();
                    }, function () {
                        fail(FileError.NOT_FOUND_ERR);
                    }
                );
            }
        );
    },

    removeRecursively: function (successCallback, fail, args) {

        var fullPath = cordovaPathToNative(args[0]);

        getFolderFromPathAsync(fullPath).done(function (storageFolder) {

            storageFolder.deleteAsync().done(function (res) {
                successCallback(res);
            }, function (err) {
                fail(err);
            });

            return;


            var storageFolderPer = Windows.Storage.ApplicationData.current.localFolder;
            var storageFolderTem = Windows.Storage.ApplicationData.current.temporaryFolder;

        if (storageFolder.path == storageFolderPer.path || storageFolder.path == storageFolderTem.path) {
            fail(FileError.NO_MODIFICATION_ALLOWED_ERR);
            return;
        }

        var removeFolders = function (path) {
            return new WinJS.Promise(function (complete) {
                var filePromiseArr = [];
                var storageFolderTop = null;
                getFolderFromPathAsync(path).then(
                    function (storageFolder) {
                        var q = storageFolder.createFileQuery();

                        var fileListPromise = q.getFilesAsync();

                        storageFolderTop = storageFolder;
                        return fileListPromise;
                    }
                // remove all the files directly under the folder.
                ).then(function (fileList) {
                    if (fileList !== null) {
                        for (var i = 0; i < fileList.length; i++) {
                            var filePromise = fileList[i].deleteAsync();
                            filePromiseArr.push(filePromise);
                        }
                    }
                    WinJS.Promise.join(filePromiseArr).then(function () {
                        var folderListPromise = storageFolderTop.createFolderQuery().getFoldersAsync();
                        return folderListPromise;
                    // remove empty folders.
                    }).then(function (folderList) {
                        var folderPromiseArr = [];
                        if (folderList.length !== 0) {
                            for (var j = 0; j < folderList.length; j++) {

                                folderPromiseArr.push(removeFolders(folderList[j].path));
                            }
                            WinJS.Promise.join(folderPromiseArr).then(function () {
                                storageFolderTop.deleteAsync().then(complete);
                            });
                        } else {
                            storageFolderTop.deleteAsync().then(complete);
                        }
                    }, function () { });
                }, function () { });
            });
        };
        removeFolders(storageFolder.path).then(function () {
            getFolderFromPathAsync(storageFolder.path).then(
                function () {},
                function () {
                    if (typeof successCallback !== 'undefined' && successCallback !== null) { successCallback(); }
                });
            });
        }, function (err) {

        });
    },

    getFile: function (win, fail, args) {

        //not sure why, but it won't work with normal slashes...
        var fullPath = cordovaPathToNative(args[0]);
        var path = cordovaPathToNative(args[1]);
        var options = args[2];

        var completePath = fullPath + '\\' + path;
        //handles trailing slash and leading slash, or just one or the other
        completePath = completePath.replace(/\\\\\\/g, '/').replace(/\\\\/g, '\\');

        var fileName = completePath.substring(completePath.lastIndexOf('\\'));
        
        //final adjustment
        fullPath = completePath.substring(0, completePath.lastIndexOf('\\'));
        path = fileName.replace(/\\/g, '');

        var flag = "";
        if (options !== null) {
            flag = new Flags(options.create, options.exclusive);
        } else {
            flag = new Flags(false, false);
        }

        getFolderFromPathAsync(fullPath).then(
            function (storageFolder) {
                if (flag.create === true && flag.exclusive === true) {
                    storageFolder.createFileAsync(path, Windows.Storage.CreationCollisionOption.failIfExists).done(
                        function (storageFile) {
                            win(new FileEntry(storageFile.name, storageFile.path));
                        }, function () {
                            fail(FileError.PATH_EXISTS_ERR);
                        }
                    );
                } else if (flag.create === true && flag.exclusive === false) {
                    storageFolder.createFileAsync(path, Windows.Storage.CreationCollisionOption.openIfExists).done(
                        function (storageFile) {
                            win(new FileEntry(storageFile.name, storageFile.path));
                        }, function () {
                            fail(FileError.INVALID_MODIFICATION_ERR);
                        }
                    );
                } else if (flag.create === false) {
                    if (/\?|\\|\*|\||\"|<|>|\:|\//g.test(path)) {
                        fail(FileError.ENCODING_ERR);
                        return;
                    }
                    storageFolder.getFileAsync(path).done(
                        function (storageFile) {
                            win(new FileEntry(storageFile.name, storageFile.path));
                        }, function () {
                            // check if path actually points to a folder
                            storageFolder.getFolderAsync(path).done(
                                function () {
                                    fail(FileError.TYPE_MISMATCH_ERR);
                                }, function () {
                                    fail(FileError.NOT_FOUND_ERR);
                                });
                        }
                    );
                }
            }, function () {
                fail(FileError.NOT_FOUND_ERR);
            }
        );
    },

    readEntries: function (win, fail, args) { // ["fullPath"]

        var path = cordovaPathToNative(args[0]);

        var result = [];

        getFolderFromPathAsync(path).then(function (storageFolder) {
            var promiseArr = [];
            var index = 0;
            promiseArr[index++] = storageFolder.createFileQuery().getFilesAsync().then(function (fileList) {
                if (fileList !== null) {
                    for (var i = 0; i < fileList.length; i++) {
                        result.push(new FileEntry(fileList[i].name, fileList[i].path));
                    }
                }
            });
            promiseArr[index++] = storageFolder.createFolderQuery().getFoldersAsync().then(function (folderList) {
                if (folderList !== null) {
                    for (var j = 0; j < folderList.length; j++) {
                        result.push(new DirectoryEntry(folderList[j].name, folderList[j].path));
                    }
                }
            });
            WinJS.Promise.join(promiseArr).then(function () {
                win(result);
            });

        }, function () { fail(FileError.NOT_FOUND_ERR); });
    },

    write: function (win, fail, args) {

        var fileName = cordovaPathToNative(args[0]),
            data = args[1],
            position = args[2],
            isBinary = args[3];

        if (data instanceof ArrayBuffer) {
            data = Array.apply(null, new Uint8Array(data));
        }
        
        var writePromise = isBinary ? Windows.Storage.FileIO.writeBytesAsync : Windows.Storage.FileIO.writeTextAsync;

        
        fileName = fileName.split("/").join("\\");


        // split path to folder and file name
        var path = fileName.substring(0, fileName.lastIndexOf('\\')),
            file = fileName.split('\\').pop();
        

        getFolderFromPathAsync(path).done(
            function(storageFolder) {
                storageFolder.createFileAsync(file, Windows.Storage.CreationCollisionOption.openIfExists).done(
                    function(storageFile) {
                        writePromise(storageFile, data).
                            done(function () {
                                win(data.length);
                            }, function () {
                                fail(FileError.INVALID_MODIFICATION_ERR);
                            });
                    }, function() {
                        fail(FileError.INVALID_MODIFICATION_ERR);
                    }
                );
                
            }, function() {
                fail(FileError.NOT_FOUND_ERR);
            });
    },

    truncate: function (win, fail, args) { // ["fileName","size"]

        var fileName = cordovaPathToNative(args[0]);
        var size = args[1];

        getFileFromPathAsync(fileName).done(function(storageFile){
            //the current length of the file.
            var leng = 0;

            storageFile.getBasicPropertiesAsync().then(function (basicProperties) {
                leng = basicProperties.size;
                if (Number(size) >= leng) {
                    win(this.length);
                    return;
                }
                if (Number(size) >= 0) {
                    Windows.Storage.FileIO.readTextAsync(storageFile, Windows.Storage.Streams.UnicodeEncoding.utf8).then(function (fileContent) {
                        fileContent = fileContent.substr(0, size);
                        var fullPath = storageFile.path;
                        var name = storageFile.name;
                        var entry = new Entry(true, false, name, fullPath);
                        var parentPath = "";
                        var successCallBack = function (entry) {
                            parentPath = entry.fullPath;
                            storageFile.deleteAsync().then(function () {
                                return getFolderFromPathAsync(parentPath);
                            }).then(function (storageFolder) {
                                storageFolder.createFileAsync(name).then(function (newStorageFile) {
                                    Windows.Storage.FileIO.writeTextAsync(newStorageFile, fileContent).done(function () {
                                        win(String(fileContent).length);
                                    }, function () {
                                        fail(FileError.NO_MODIFICATION_ALLOWED_ERR);
                                    });
                                });
                            });
                        };
                        entry.getParent(successCallBack, null);
                    }, function () { fail(FileError.NOT_FOUND_ERR); });
                }
            });
        }, function () { fail(FileError.NOT_FOUND_ERR); });
    },

    copyTo: function (success, fail, args) { // ["fullPath","parent", "newName"]

        var srcPath = cordovaPathToNative(args[0]);
        var parentFullPath = cordovaPathToNative(args[1]);
        var name = args[2];

        //name can't be invalid
        if (/\?|\\|\*|\||\"|<|>|\:|\//g.test(name)) {
            fail(FileError.ENCODING_ERR);
            return;
        }
        // copy
        var copyFiles = "";
        getFileFromPathAsync(srcPath).then(
            function (sFile) {
                copyFiles = function (srcPath, parentPath) {
                    var storageFileTop = null;
                    getFileFromPathAsync(srcPath).then(function (storageFile) {
                        storageFileTop = storageFile;
                        return getFolderFromPathAsync(parentPath);
                    }, function () {

                        fail(FileError.NOT_FOUND_ERR);
                    }).then(function (storageFolder) {
                        storageFileTop.copyAsync(storageFolder, name, Windows.Storage.NameCollisionOption.failIfExists).then(function (storageFile) {

                            success(new FileEntry(storageFile.name, storageFile.path));
                        }, function () {

                            fail(FileError.INVALID_MODIFICATION_ERR);
                        });
                    }, function () {

                        fail(FileError.NOT_FOUND_ERR);
                    });
                };
                var copyFinish = function (srcPath, parentPath) {
                    copyFiles(srcPath, parentPath);
                };
                copyFinish(srcPath, parentFullPath);
            },
            function () {
                getFolderFromPathAsync(srcPath).then(
                    function (sFolder) {
                        copyFiles = function (srcPath, parentPath) {
                            var coreCopy = function (storageFolderTop, complete) {
                                storageFolderTop.createFolderQuery().getFoldersAsync().then(function (folderList) {
                                    var folderPromiseArr = [];
                                    if (folderList.length === 0) { complete(); }
                                    else {
                                        getFolderFromPathAsync(parentPath).then(function (storageFolderTarget) {
                                            var tempPromiseArr = [];
                                            var index = 0;
                                            for (var j = 0; j < folderList.length; j++) {
                                                tempPromiseArr[index++] = storageFolderTarget.createFolderAsync(folderList[j].name).then(function (targetFolder) {
                                                    folderPromiseArr.push(copyFiles(folderList[j].path, targetFolder.path));
                                                });
                                            }
                                            WinJS.Promise.join(tempPromiseArr).then(function () {
                                                WinJS.Promise.join(folderPromiseArr).then(complete);
                                            });
                                        });
                                    }
                                });
                            };

                            return new WinJS.Promise(function (complete) {
                                var storageFolderTop = null;
                                var filePromiseArr = [];
                                var fileListTop = null;
                                getFolderFromPathAsync(srcPath).then(function (storageFolder) {
                                    storageFolderTop = storageFolder;
                                    return storageFolder.createFileQuery().getFilesAsync();
                                }).then(function (fileList) {
                                    fileListTop = fileList;
                                    if (fileList) {
                                        return getFolderFromPathAsync(parentPath);
                                    }
                                }).then(function (targetStorageFolder) {
                                    for (var i = 0; i < fileListTop.length; i++) {
                                        filePromiseArr.push(fileListTop[i].copyAsync(targetStorageFolder));
                                    }
                                    WinJS.Promise.join(filePromiseArr).done(function () {
                                        coreCopy(storageFolderTop, complete);
                                    }, function() {
                                        fail(FileError.INVALID_MODIFICATION_ERR);
                                    });
                                });
                            });
                        };
                        var copyFinish = function (srcPath, parentPath) {
                            getFolderFromPathAsync(parentPath).then(function (storageFolder) {
                                storageFolder.createFolderAsync(name, Windows.Storage.CreationCollisionOption.openIfExists).then(function (newStorageFolder) {
                                    //can't copy onto itself
                                    if (srcPath == newStorageFolder.path) {
                                        fail(FileError.INVALID_MODIFICATION_ERR);
                                        return;
                                    }
                                    //can't copy into itself
                                    if (srcPath == parentPath) {
                                        fail(FileError.INVALID_MODIFICATION_ERR);
                                        return;
                                    }
                                    copyFiles(srcPath, newStorageFolder.path).then(function () {
                                        getFolderFromPathAsync(newStorageFolder.path).done(
                                            function (storageFolder) {
                                                success(new DirectoryEntry(storageFolder.name, storageFolder.path));
                                            },
                                            function () { fail(FileError.NOT_FOUND_ERR); }
                                        );
                                    });
                                }, function () { fail(FileError.INVALID_MODIFICATION_ERR); });
                            }, function () { fail(FileError.INVALID_MODIFICATION_ERR); });
                        };
                        copyFinish(srcPath, parentFullPath);
                    }, function () {
                        fail(FileError.NOT_FOUND_ERR);
                    }
                );
            }
        );
    },

    moveTo: function (success, fail, args) {

        var srcPath = cordovaPathToNative(args[0]);
        var parentFullPath = cordovaPathToNative(args[1]);
        var name = args[2];


        //name can't be invalid
        if (/\?|\\|\*|\||\"|<|>|\:|\//g.test(name)) {
            fail(FileError.ENCODING_ERR);
            return;
        }

        var moveFiles = "";
        getFileFromPathAsync(srcPath).then(
            function (sFile) {
                moveFiles = function (srcPath, parentPath) {
                    var storageFileTop = null;
                    getFileFromPathAsync(srcPath).then(function (storageFile) {
                        storageFileTop = storageFile;
                        return getFolderFromPathAsync(parentPath);
                    }, function () {
                        fail(FileError.NOT_FOUND_ERR);
                    }).then(function (storageFolder) {
                        storageFileTop.moveAsync(storageFolder, name, Windows.Storage.NameCollisionOption.replaceExisting).then(function () {
                            success(new FileEntry(name, storageFileTop.path));
                        }, function () {
                            fail(FileError.INVALID_MODIFICATION_ERR);
                        });
                    }, function () {
                        fail(FileError.NOT_FOUND_ERR);
                    });
                };
                var moveFinish = function (srcPath, parentPath) {
                    //can't copy onto itself
                    if (srcPath == parentPath + "\\" + name) {
                        fail(FileError.INVALID_MODIFICATION_ERR);
                        return;
                    }
                    moveFiles(srcPath, parentFullPath);
                };
                moveFinish(srcPath, parentFullPath);
            },
            function () {
                getFolderFromPathAsync(srcPath).then(
                    function (sFolder) {
                        moveFiles = function (srcPath, parentPath) {
                            var coreMove = function (storageFolderTop, complete) {
                                storageFolderTop.createFolderQuery().getFoldersAsync().then(function (folderList) {
                                    var folderPromiseArr = [];
                                    if (folderList.length === 0) {
                                        // If failed, we must cancel the deletion of folders & files.So here wo can't delete the folder.
                                        complete();
                                    }
                                    else {
                                        getFolderFromPathAsync(parentPath).then(function (storageFolderTarget) {
                                            var tempPromiseArr = [];
                                            var index = 0;
                                            for (var j = 0; j < folderList.length; j++) {
                                                tempPromiseArr[index++] = storageFolderTarget.createFolderAsync(folderList[j].name).then(function (targetFolder) {
                                                    folderPromiseArr.push(moveFiles(folderList[j].path, targetFolder.path));
                                                });
                                            }
                                            WinJS.Promise.join(tempPromiseArr).then(function () {
                                                WinJS.Promise.join(folderPromiseArr).then(complete);
                                            });
                                        });
                                    }
                                });
                            };
                            return new WinJS.Promise(function (complete) {
                                var storageFolderTop = null;
                                getFolderFromPathAsync(srcPath).then(function (storageFolder) {
                                    storageFolderTop = storageFolder;
                                    return storageFolder.createFileQuery().getFilesAsync();
                                }).then(function (fileList) {
                                    var filePromiseArr = [];
                                    getFolderFromPathAsync(parentPath).then(function (dstStorageFolder) {
                                        if (fileList) {
                                            for (var i = 0; i < fileList.length; i++) {
                                                filePromiseArr.push(fileList[i].moveAsync(dstStorageFolder));
                                            }
                                        }
                                        WinJS.Promise.join(filePromiseArr).then(function () {
                                            coreMove(storageFolderTop, complete);
                                        }, function () { });
                                    });
                                });
                            });
                        };
                        var moveFinish = function (srcPath, parentPath) {
                            var originFolderTop = null;
                            getFolderFromPathAsync(srcPath).then(function (originFolder) {
                                originFolderTop = originFolder;
                                return getFolderFromPathAsync(parentPath);
                            }, function () {
                                fail(FileError.INVALID_MODIFICATION_ERR);
                            }).then(function (storageFolder) {
                                return storageFolder.createFolderAsync(name, Windows.Storage.CreationCollisionOption.openIfExists);
                            }, function () {
                                fail(FileError.INVALID_MODIFICATION_ERR);
                            }).then(function (newStorageFolder) {
                                //can't move onto directory that is not empty
                                newStorageFolder.createFileQuery().getFilesAsync().then(function (fileList) {
                                    newStorageFolder.createFolderQuery().getFoldersAsync().then(function (folderList) {
                                        if (fileList.length !== 0 || folderList.length !== 0) {
                                            fail(FileError.INVALID_MODIFICATION_ERR);
                                            return;
                                        }
                                        //can't copy onto itself
                                        if (srcPath == newStorageFolder.path) {
                                            fail(FileError.INVALID_MODIFICATION_ERR);
                                            return;
                                        }
                                        //can't copy into itself
                                        if (srcPath == parentPath) {
                                            fail(FileError.INVALID_MODIFICATION_ERR);
                                            return;
                                        }
                                        moveFiles(srcPath, newStorageFolder.path).then(function () {
                                            var successCallback = function () {
                                                success(new DirectoryEntry(name, newStorageFolder.path));
                                            };
                                            var temp = new DirectoryEntry(originFolderTop.name, originFolderTop.path).removeRecursively(successCallback, fail);

                                        }, function () { console.log("error!"); });
                                    });
                                });
                            }, function () { fail(FileError.INVALID_MODIFICATION_ERR); });

                        };
                        moveFinish(srcPath, parentFullPath);
                    }, function () {
                        fail(FileError.NOT_FOUND_ERR);
                    }
                );
            }
        );
    },
    tempFileSystem:null,

    persistentFileSystem:null,

    requestFileSystem: function (win, fail, args) {

        var type = args[0];
        var size = args[1];

        var filePath = "";
        var result = null;
        var fsTypeName = "";

        switch (type) {
            case LocalFileSystem.TEMPORARY:
                filePath = Windows.Storage.ApplicationData.current.temporaryFolder.path;
                fsTypeName = "temporary";
                break;
            case LocalFileSystem.PERSISTENT:
                filePath = Windows.Storage.ApplicationData.current.localFolder.path;
                fsTypeName = "persistent";
                break;
        }

        var MAX_SIZE = 10000000000;
        if (size > MAX_SIZE) {
            fail(FileError.QUOTA_EXCEEDED_ERR);
            return;
        }

        var fileSystem = new FileSystem(fsTypeName, new DirectoryEntry(fsTypeName, filePath));
        result = fileSystem;
        win(result);
    },

    resolveLocalFileSystemURI: function (success, fail, args) {

        var uri = cordovaPathToNative(args[0]);

        var path = uri;

        // support for file name with parameters
        if (/\?/g.test(path)) {
            path = String(path).split("?")[0];
        }

        // support for encodeURI
        if (/\%5/g.test(path)) {
            path = decodeURI(path);
        }

        // support for special path start with file:///
        if (path.substr(0, 8) == "file:///") {
            path = Windows.Storage.ApplicationData.current.localFolder.path + "\\" + String(path).substr(8);
        } else {
            // method should not let read files outside of the [APP HASH]/Local or [APP HASH]/temp folders
            if (path.indexOf(Windows.Storage.ApplicationData.current.temporaryFolder.path) != 0 &&
                path.indexOf(Windows.Storage.ApplicationData.current.localFolder.path) != 0) {
                fail(FileError.ENCODING_ERR);
                return;
            }
        }

        getFileFromPathAsync(path).then(
            function (storageFile) {
                success(new FileEntry(storageFile.name, storageFile.path));
            }, function () {
                getFolderFromPathAsync(path).then(
                    function (storageFolder) {
                        success(new DirectoryEntry(storageFolder.name, storageFolder.path + "/", null, storageFolder.path + "/"));
                    }, function () {
                        fail(FileError.NOT_FOUND_ERR);
                    }
                );
            }
        );
    }
    

};

require("cordova/exec/proxy").add("File",module.exports);
