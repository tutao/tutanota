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

Notes for plugin developers
===========================

These notes are primarily intended for Android and iOS developers who want to write plugins which interface with the file system using the File plugin.

Working with Cordova file system URLs
-------------------------------------

Since version 1.0.0, this plugin has used URLs with a `cdvfile` scheme for all communication over the bridge, rather than exposing raw device file system paths to JavaScript. 

On the JavaScript side, this means that FileEntry and DirectoryEntry objects have a fullPath attribute which is relative to the root of the HTML file system. If your plugin's JavaScript API accepts a FileEntry or DirectoryEntry object, you should call `.toURL()` on that object before passing it across the bridge to native code.

### Converting cdvfile:// URLs to fileystem paths

Plugins which need to write to the filesystem may want to convert a received file system URL to an actual filesystem location. There are multiple ways of doing this, depending on the native platform.

It is important to remember that not all `cdvfile://` URLs are mappable to real files on the device. Some URLs can refer to assets on device which are not represented by files, or can even refer to remote resources. Because of these possibilities, plugins should always test whether they get a meaningful result back when trying to convert URLs to paths.

#### Android

On Android, the simplest method to convert a `cdvfile://` URL to a filesystem path is to use `org.apache.cordova.CordovaResourceApi`. `CordovaResourceApi` has several methods which can handle `cdvfile://` URLs:

    // webView is a member of the Plugin class
    CordovaResourceApi resourceApi = webView.getResourceApi();

    // Obtain a file:/// URL representing this file on the device,
    // or the same URL unchanged if it cannot be mapped to a file
    Uri fileURL = resourceApi.remapUri(Uri.parse(cdvfileURL));

It is also possible to use the File plugin directly:

    import org.apache.cordova.file.FileUtils;
    import org.apache.cordova.file.FileSystem;
    import java.net.MalformedURLException;

    // Get the File plugin from the plugin manager
    FileUtils filePlugin = (FileUtils)webView.pluginManager.getPlugin("File");

    // Given a URL, get a path for it
    try {
        String path = filePlugin.filesystemPathForURL(cdvfileURL);
    } catch (MalformedURLException e) {
        // The filesystem url wasn't recognized
    }

To convert from a path to a `cdvfile://` URL:

    import org.apache.cordova.file.LocalFilesystemURL;

    // Get a LocalFilesystemURL object for a device path,
    // or null if it cannot be represented as a cdvfile URL.
    LocalFilesystemURL url = filePlugin.filesystemURLforLocalPath(path);
    // Get the string representation of the URL object
    String cdvfileURL = url.toString();

If your plugin creates a file, and you want to return a FileEntry object for it, use the File plugin:

    // Return a JSON structure suitable for returning to JavaScript,
    // or null if this file is not representable as a cdvfile URL.
    JSONObject entry = filePlugin.getEntryForFile(file);

#### iOS

Cordova on iOS does not use the same `CordovaResourceApi` concept as Android. On iOS, you should use the File plugin to convert between URLs and filesystem paths.

    // Get a CDVFilesystem URL object from a URL string
    CDVFilesystemURL* url = [CDVFilesystemURL fileSystemURLWithString:cdvfileURL];
    // Get a path for the URL object, or nil if it cannot be mapped to a file
    NSString* path = [filePlugin filesystemPathForURL:url];
    

    // Get a CDVFilesystem URL object for a device path, or
    // nil if it cannot be represented as a cdvfile URL.
    CDVFilesystemURL* url = [filePlugin fileSystemURLforLocalPath:path];
    // Get the string representation of the URL object
    NSString* cdvfileURL = [url absoluteString];

If your plugin creates a file, and you want to return a FileEntry object for it, use the File plugin:

    // Get a CDVFilesystem URL object for a device path, or
    // nil if it cannot be represented as a cdvfile URL.
    CDVFilesystemURL* url = [filePlugin fileSystemURLforLocalPath:path];
    // Get a structure to return to JavaScript
    NSDictionary* entry = [filePlugin makeEntryForLocalURL:url]

#### JavaScript

In JavaScript, to get a `cdvfile://` URL from a FileEntry or DirectoryEntry object, simply call `.toURL()` on it:

    var cdvfileURL = entry.toURL();

In plugin response handlers, to convert from a returned FileEntry structure to an actual Entry object, your handler code should import the File plugin and create a new object:

    // create appropriate Entry object
    var entry;
    if (entryStruct.isDirectory) {
        entry = new DirectoryEntry(entryStruct.name, entryStruct.fullPath, new FileSystem(entryStruct.filesystemName));
    } else {
        entry = new FileEntry(entryStruct.name, entryStruct.fullPath, new FileSystem(entryStruct.filesystemName));
    }

