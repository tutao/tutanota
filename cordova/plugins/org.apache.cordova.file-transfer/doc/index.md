<!---
    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
-->

# org.apache.cordova.file-transfer

This plugin allows you to upload and download files.

## Installation

    cordova plugin add org.apache.cordova.file-transfer

## Supported Platforms

- Amazon Fire OS
- Android
- BlackBerry 10
- Firefox OS**
- iOS
- Windows Phone 7 and 8*
- Windows 8*

\* _Do not support `onprogress` nor `abort()`_

\** _Do not support `onprogress`_

# FileTransfer

The `FileTransfer` object provides a way to upload files using an HTTP
multi-part POST request, and to download files as well.

## Properties

- __onprogress__: Called with a `ProgressEvent` whenever a new chunk of data is transferred. _(Function)_

## Methods

- __upload__: sends a file to a server.

- __download__: downloads a file from server.

- __abort__: Aborts an in-progress transfer.


## upload

__Parameters__:

- __fileURL__: Filesystem URL representing the file on the device. For backwards compatibility, this can also be the full path of the file on the device. (See [Backwards Compatibility Notes] below)

- __server__: URL of the server to receive the file, as encoded by `encodeURI()`.

- __successCallback__: A callback that is passed a `Metadata` object. _(Function)_

- __errorCallback__: A callback that executes if an error occurs retrieving the `Metadata`. Invoked with a `FileTransferError` object. _(Function)_

- __options__: Optional parameters _(Object)_. Valid keys:
  - __fileKey__: The name of the form element.  Defaults to `file`. (DOMString)
  - __fileName__: The file name to use when saving the file on the server.  Defaults to `image.jpg`. (DOMString)
  - __mimeType__: The mime type of the data to upload.  Defaults to `image/jpeg`. (DOMString)
  - __params__: A set of optional key/value pairs to pass in the HTTP request. (Object)
  - __chunkedMode__: Whether to upload the data in chunked streaming mode. Defaults to `true`. (Boolean)
  - __headers__: A map of header name/header values. Use an array to specify more than one value. (Object)
  
- __trustAllHosts__: Optional parameter, defaults to `false`. If set to `true`, it accepts all security certificates. This is useful since Android rejects self-signed security certificates. Not recommended for production use. Supported on Android and iOS. _(boolean)_

### Example

    // !! Assumes variable fileURL contains a valid URL to a text file on the device,
    //    for example, cdvfile://localhost/persistent/path/to/file.txt

    var win = function (r) {
        console.log("Code = " + r.responseCode);
        console.log("Response = " + r.response);
        console.log("Sent = " + r.bytesSent);
    }

    var fail = function (error) {
        alert("An error has occurred: Code = " + error.code);
        console.log("upload error source " + error.source);
        console.log("upload error target " + error.target);
    }

    var options = new FileUploadOptions();
    options.fileKey = "file";
    options.fileName = fileURL.substr(fileURL.lastIndexOf('/') + 1);
    options.mimeType = "text/plain";

    var params = {};
    params.value1 = "test";
    params.value2 = "param";

    options.params = params;

    var ft = new FileTransfer();
    ft.upload(fileURL, encodeURI("http://some.server.com/upload.php"), win, fail, options);

### Example with Upload Headers and Progress Events (Android and iOS only)

    function win(r) {
        console.log("Code = " + r.responseCode);
        console.log("Response = " + r.response);
        console.log("Sent = " + r.bytesSent);
    }

    function fail(error) {
        alert("An error has occurred: Code = " + error.code);
        console.log("upload error source " + error.source);
        console.log("upload error target " + error.target);
    }

    var uri = encodeURI("http://some.server.com/upload.php");

    var options = new FileUploadOptions();
    options.fileKey="file";
    options.fileName=fileURL.substr(fileURL.lastIndexOf('/')+1);
    options.mimeType="text/plain";

    var headers={'headerParam':'headerValue'};

    options.headers = headers;

    var ft = new FileTransfer();
    ft.onprogress = function(progressEvent) {
        if (progressEvent.lengthComputable) {
          loadingStatus.setPercentage(progressEvent.loaded / progressEvent.total);
        } else {
          loadingStatus.increment();
        }
    };
    ft.upload(fileURL, uri, win, fail, options);

## FileUploadResult

A `FileUploadResult` object is passed to the success callback of the
`FileTransfer` object's `upload()` method.

### Properties

- __bytesSent__: The number of bytes sent to the server as part of the upload. (long)

- __responseCode__: The HTTP response code returned by the server. (long)

- __response__: The HTTP response returned by the server. (DOMString)

- __headers__: The HTTP response headers by the server. (Object)
  - Currently supported on iOS only.

### iOS Quirks

- Does not support `responseCode` or `bytesSent`.


## download

__Parameters__:

- __source__: URL of the server to download the file, as encoded by `encodeURI()`.

- __target__: Filesystem url representing the file on the device. For backwards compatibility, this can also be the full path of the file on the device. (See [Backwards Compatibility Notes] below)

- __successCallback__: A callback that is passed  a `FileEntry` object. _(Function)_

- __errorCallback__: A callback that executes if an error occurs when retrieving the `Metadata`. Invoked with a `FileTransferError` object. _(Function)_

- __trustAllHosts__: Optional parameter, defaults to `false`. If set to `true`, it accepts all security certificates. This is useful because Android rejects self-signed security certificates. Not recommended for production use. Supported on Android and iOS. _(boolean)_

- __options__: Optional parameters, currently only supports headers (such as Authorization (Basic Authentication), etc).

### Example

    // !! Assumes variable fileURL contains a valid URL to a path on the device,
    //    for example, cdvfile://localhost/persistent/path/to/downloads/

    var fileTransfer = new FileTransfer();
    var uri = encodeURI("http://some.server.com/download.php");

    fileTransfer.download(
        uri,
        fileURL,
        function(entry) {
            console.log("download complete: " + entry.toURL());
        },
        function(error) {
            console.log("download error source " + error.source);
            console.log("download error target " + error.target);
            console.log("upload error code" + error.code);
        },
        false,
        {
            headers: {
                "Authorization": "Basic dGVzdHVzZXJuYW1lOnRlc3RwYXNzd29yZA=="
            }
        }
    );

## abort

Aborts an in-progress transfer. The onerror callback is passed a FileTransferError object which has an error code of FileTransferError.ABORT_ERR.

### Example

    // !! Assumes variable fileURL contains a valid URL to a text file on the device,
    //    for example, cdvfile://localhost/persistent/path/to/file.txt

    var win = function(r) {
        console.log("Should not be called.");
    }

    var fail = function(error) {
        // error.code == FileTransferError.ABORT_ERR
        alert("An error has occurred: Code = " + error.code);
        console.log("upload error source " + error.source);
        console.log("upload error target " + error.target);
    }

    var options = new FileUploadOptions();
    options.fileKey="file";
    options.fileName="myphoto.jpg";
    options.mimeType="image/jpeg";

    var ft = new FileTransfer();
    ft.upload(fileURL, encodeURI("http://some.server.com/upload.php"), win, fail, options);
    ft.abort();


## FileTransferError

A `FileTransferError` object is passed to an error callback when an error occurs.

### Properties

- __code__: One of the predefined error codes listed below. (Number)

- __source__: URL to the source. (String)

- __target__: URL to the target. (String)

- __http_status__: HTTP status code.  This attribute is only available when a response code is received from the HTTP connection. (Number)
- __exception__: Either e.getMessage or e.toString (String)

### Constants

- 1 = `FileTransferError.FILE_NOT_FOUND_ERR`
- 2 = `FileTransferError.INVALID_URL_ERR`
- 3 = `FileTransferError.CONNECTION_ERR`
- 4 = `FileTransferError.ABORT_ERR`
- 5 = `FileTransferError.NOT_MODIFIED_ERR`

## Backwards Compatibility Notes

Previous versions of this plugin would only accept device-absolute-file-paths as the source for uploads, or as the target for downloads. These paths would typically be of the form

    /var/mobile/Applications/<application UUID>/Documents/path/to/file  (iOS)
    /storage/emulated/0/path/to/file                                    (Android)

For backwards compatibility, these paths are still accepted, and if your application has recorded paths like these in persistent storage, then they can continue to be used.

These paths were previously exposed in the `fullPath` property of `FileEntry` and `DirectoryEntry` objects returned by the File plugin. New versions of the File plugin, however, no longer expose these paths to JavaScript.

If you are upgrading to a new (1.0.0 or newer) version of File, and you have previously been using `entry.fullPath` as arguments to `download()` or `upload()`, then you will need to change your code to use filesystem URLs instead.

`FileEntry.toURL()` and `DirectoryEntry.toURL()` return a filesystem URL of the form

    cdvfile://localhost/persistent/path/to/file

which can be used in place of the absolute file path in both `download()` and `upload()` methods.
