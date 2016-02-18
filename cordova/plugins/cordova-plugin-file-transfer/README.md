<!--
# license: Licensed to the Apache Software Foundation (ASF) under one
#         or more contributor license agreements.  See the NOTICE file
#         distributed with this work for additional information
#         regarding copyright ownership.  The ASF licenses this file
#         to you under the Apache License, Version 2.0 (the
#         "License"); you may not use this file except in compliance
#         with the License.  You may obtain a copy of the License at
#
#           http://www.apache.org/licenses/LICENSE-2.0
#
#         Unless required by applicable law or agreed to in writing,
#         software distributed under the License is distributed on an
#         "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
#         KIND, either express or implied.  See the License for the
#         specific language governing permissions and limitations
#         under the License.
-->

# cordova-plugin-file-transfer

This plugin allows you to upload and download files.

This plugin defines global `FileTransfer`, `FileUploadOptions` Constructors.

Although in the global scope, they are not available until after the `deviceready` event.

    document.addEventListener("deviceready", onDeviceReady, false);
    function onDeviceReady() {
        console.log(FileTransfer);
    }

:warning: Report issues on the [Apache Cordova issue tracker](https://issues.apache.org/jira/issues/?jql=project%20%3D%20CB%20AND%20status%20in%20%28Open%2C%20%22In%20Progress%22%2C%20Reopened%29%20AND%20resolution%20%3D%20Unresolved%20AND%20component%20%3D%20%22Plugin%20File%20Transfer%22%20ORDER%20BY%20priority%20DESC%2C%20summary%20ASC%2C%20updatedDate%20DESC)

## Installation

    cordova plugin add cordova-plugin-file-transfer

## Supported Platforms

- Amazon Fire OS
- Android
- BlackBerry 10
- Browser
- Firefox OS**
- iOS
- Windows Phone 7 and 8*
- Windows 8
- Windows

\* _Do not support `onprogress` nor `abort()`_

\** _Do not support `onprogress`_

# FileTransfer

The `FileTransfer` object provides a way to upload files using an HTTP
multi-part POST or PUT request, and to download files as well.

## Properties

- __onprogress__: Called with a `ProgressEvent` whenever a new chunk of data is transferred. _(Function)_

## Methods

- __upload__: sends a file to a server.

- __download__: downloads a file from server.

- __abort__: Aborts an in-progress transfer.


## upload

__Parameters__:

- __fileURL__: Filesystem URL representing the file on the device or a [data: URI](https://en.wikipedia.org/wiki/Data_URI_scheme). For backwards compatibility, this can also be the full path of the file on the device. (See [Backwards Compatibility Notes](#backwards-compatibility-notes) below)

- __server__: URL of the server to receive the file, as encoded by `encodeURI()`.

- __successCallback__: A callback that is passed a `FileUploadResult` object. _(Function)_

- __errorCallback__: A callback that executes if an error occurs retrieving the `FileUploadResult`. Invoked with a `FileTransferError` object. _(Function)_

- __options__: Optional parameters _(Object)_. Valid keys:
  - __fileKey__: The name of the form element.  Defaults to `file`. (DOMString)
  - __fileName__: The file name to use when saving the file on the server.  Defaults to `image.jpg`. (DOMString)
  - __httpMethod__: The HTTP method to use - either `PUT` or `POST`. Defaults to `POST`. (DOMString)
  - __mimeType__: The mime type of the data to upload.  Defaults to `image/jpeg`. (DOMString)
  - __params__: A set of optional key/value pairs to pass in the HTTP request. (Object, key/value - DOMString)
  - __chunkedMode__: Whether to upload the data in chunked streaming mode. Defaults to `true`. (Boolean)
  - __headers__: A map of header name/header values. Use an array to specify more than one value.  On iOS, FireOS, and Android, if a header named Content-Type is present, multipart form data will NOT be used. (Object)

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

### Browser Quirks

- __withCredentials__: _boolean_ that tells the browser to set the withCredentials flag on the XMLHttpRequest

## download

__Parameters__:

- __source__: URL of the server to download the file, as encoded by `encodeURI()`.

- __target__: Filesystem url representing the file on the device. For backwards compatibility, this can also be the full path of the file on the device. (See [Backwards Compatibility Notes] below)

- __successCallback__: A callback that is passed  a `FileEntry` object. _(Function)_

- __errorCallback__: A callback that executes if an error occurs when retrieving the `FileEntry`. Invoked with a `FileTransferError` object. _(Function)_

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

### WP8 Quirks

- Download requests is being cached by native implementation. To avoid caching, pass `if-Modified-Since` header to download method.

### Browser Quirks

- __withCredentials__: _boolean_ that tells the browser to set the withCredentials flag on the XMLHttpRequest

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

- __body__ Response body. This attribute is only available when a response is received from the HTTP connection. (String)

- __exception__: Either e.getMessage or e.toString (String)

### Constants

- 1 = `FileTransferError.FILE_NOT_FOUND_ERR`
- 2 = `FileTransferError.INVALID_URL_ERR`
- 3 = `FileTransferError.CONNECTION_ERR`
- 4 = `FileTransferError.ABORT_ERR`
- 5 = `FileTransferError.NOT_MODIFIED_ERR`

## Windows Quirks

- The plugin implementation is based on [BackgroundDownloader](https://msdn.microsoft.com/en-us/library/windows/apps/windows.networking.backgroundtransfer.backgrounddownloader.aspx)/[BackgroundUploader](https://msdn.microsoft.com/en-us/library/windows/apps/windows.networking.backgroundtransfer.backgrounduploader.aspx), which entails the latency issues on Windows devices (creation/starting of an operation can take up to a few seconds). You can use XHR or [HttpClient](https://msdn.microsoft.com/en-us/library/windows/apps/windows.web.http.httpclient.aspx) as a quicker alternative for small downloads.

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
