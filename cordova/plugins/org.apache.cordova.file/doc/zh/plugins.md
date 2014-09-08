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

# 外掛程式開發人員須知

這些筆記主要針對 Android 和 iOS 開發者想要使用的檔案系統使用的檔外掛程式編寫外掛程式哪個介面。

## 工作與科爾多瓦檔案系統 Url

1.0.0 版以來，這個外掛程式用了 Url 與 `cdvfile` 在橋樑，為所有的通信計畫，而不是暴露 JavaScript 原始設備的檔案系統路徑。

在 JavaScript 方面，這意味著 FileEntry 和 DirectoryEntry 的物件具有一個完整路徑屬性是相對於 HTML 檔案系統的根目錄。 如果你的外掛程式的 JavaScript API 接受 FileEntry 或 DirectoryEntry 的物件，則應調用 `.toURL()` 對該物件之前將它在橋上傳遞給本機代碼。

### 轉換 cdvfile: / / fileystem 的路徑的 Url

需要寫入到檔案系統的外掛程式可能會想要將收到的檔案系統的 URL 轉換為實際的檔案系統位置。有多種方法做這個，根據本機平臺。

它是重要的是要記住，不是所有 `cdvfile://` 的 Url 均可映射到設備上的實際檔。 某些 Url 可以引用在設備上不是由檔，或甚至可以引用遠端資源的資產。 由於這些可能性，外掛程式應始終測試是否回試圖將 Url 轉換成路徑時，他們得到有意義的結果。

#### Android 系統

在 android 系統，最簡單的方法來轉換 `cdvfile://` 檔案系統路徑的 URL 是使用 `org.apache.cordova.CordovaResourceApi` 。 `CordovaResourceApi`有幾種方法，可處理 `cdvfile://` 的 Url：

    // webView is a member of the Plugin class
    CordovaResourceApi resourceApi = webView.getResourceApi();
    
    // Obtain a file:/// URL representing this file on the device,
    // or the same URL unchanged if it cannot be mapped to a file
    Uri fileURL = resourceApi.remapUri(Uri.parse(cdvfileURL));
    

它也是可以直接使用檔外掛程式：

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
    

要轉換的路徑從 `cdvfile://` 的 URL：

    import org.apache.cordova.file.LocalFilesystemURL;
    
    // Get a LocalFilesystemURL object for a device path,
    // or null if it cannot be represented as a cdvfile URL.
    LocalFilesystemURL url = filePlugin.filesystemURLforLocalPath(path);
    // Get the string representation of the URL object
    String cdvfileURL = url.toString();
    

如果你的外掛程式創建一個檔，並且您想要為它返回一個 FileEntry 物件，使用該檔外掛程式：

    // Return a JSON structure suitable for returning to JavaScript,
    // or null if this file is not representable as a cdvfile URL.
    JSONObject entry = filePlugin.getEntryForFile(file);
    

#### iOS

科爾多瓦在 iOS 上的不使用相同 `CordovaResourceApi` 作為 android 系統的概念。在 iOS，應使用檔外掛程式的 Url 和檔案系統路徑之間進行轉換。

    // Get a CDVFilesystem URL object from a URL string
    CDVFilesystemURL* url = [CDVFilesystemURL fileSystemURLWithString:cdvfileURL];
    // Get a path for the URL object, or nil if it cannot be mapped to a file
    NSString* path = [filePlugin filesystemPathForURL:url];
    
    
    // Get a CDVFilesystem URL object for a device path, or
    // nil if it cannot be represented as a cdvfile URL.
    CDVFilesystemURL* url = [filePlugin fileSystemURLforLocalPath:path];
    // Get the string representation of the URL object
    NSString* cdvfileURL = [url absoluteString];
    

如果你的外掛程式創建一個檔，並且您想要為它返回一個 FileEntry 物件，使用該檔外掛程式：

    // Get a CDVFilesystem URL object for a device path, or
    // nil if it cannot be represented as a cdvfile URL.
    CDVFilesystemURL* url = [filePlugin fileSystemURLforLocalPath:path];
    // Get a structure to return to JavaScript
    NSDictionary* entry = [filePlugin makeEntryForLocalURL:url]
    

#### JavaScript

在 JavaScript 中，得到 `cdvfile://` URL 從 FileEntry 或 DirectoryEntry 的物件，只需調用 `.toURL()` 對它：

    var cdvfileURL = entry.toURL();
    

在外掛程式回應處理常式，將從返回的 FileEntry 結構轉換為實際的輸入物件，您的處理常式代碼應該導入的檔外掛程式並創建一個新的物件：

    // create appropriate Entry object
    var entry;
    if (entryStruct.isDirectory) {
        entry = new DirectoryEntry(entryStruct.name, entryStruct.fullPath, new FileSystem(entryStruct.filesystemName));
    } else {
        entry = new FileEntry(entryStruct.name, entryStruct.fullPath, new FileSystem(entryStruct.filesystemName));
    }