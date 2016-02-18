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

# 外掛程式開發人員注意事項

這些筆記主要用於 Android 和 iOS 開發者想要編寫外掛程式的介面與使用檔外掛程式的檔案系統。

## 工作與科爾多瓦檔案系統 Url

自從版本 1.0.0，這個外掛程式一直使用 Url 與 `cdvfile` 大橋，計畫為所有通信，而不是揭露 JavaScript 的原始設備檔案系統路徑。

在 JavaScript 方面，這意味著 FileEntry 和 DirectoryEntry 的物件有一個完整路徑屬性是相對於 HTML 檔案系統的根目錄。 如果你的外掛程式的 JavaScript API 接受一個 FileEntry 或 DirectoryEntry 的物件，你應該打電話給 `.toURL()` 對該物件之前將它從橋上傳遞給本機代碼。

### 轉換 cdvfile: / / fileystem 路徑的 Url

需要寫入到檔案系統的外掛程式可能想要將接收的檔案系統 URL 轉換為實際的檔案系統位置。有做這，根據本機平臺的多種方式。

很重要的是要記住，並不是所有 `cdvfile://` Url 是可映射到設備上的實際檔。 某些 Url 可以指在設備上沒有代表的檔，或甚至可以引用遠端資源的資產。 由於這些可能性，外掛程式應始終測試是否回來時試圖將 Url 轉換成路徑得到有意義的結果。

#### 安卓系統

在 android 系統，最簡單的方法來轉換 `cdvfile://` 檔案系統路徑的 URL 是使用 `org.apache.cordova.CordovaResourceApi` 。 `CordovaResourceApi`有幾種方法，可處理 `cdvfile://` 網址:

    web 視圖是成員的外掛程式類 CordovaResourceApi resourceApi = webView.getResourceApi();
    
    獲取表示此檔在設備上，file:/// URL / / 或 URL 相同變的如果它不能映射到檔 Uri fileURL = resourceApi.remapUri(Uri.parse(cdvfileURL));
    

它也是可以直接使用檔外掛程式:

    導入 org.apache.cordova.file.FileUtils;
    導入 org.apache.cordova.file.FileSystem;
    導入 java.net.MalformedURLException;
    
    得到檔外掛程式外掛程式管理器從 FileUtils filePlugin = (FileUtils)webView.pluginManager.getPlugin("File");
    
    給定 URL，得到的路徑，因為它嘗試 {字串路徑 = filePlugin.filesystemPathForURL(cdvfileURL);} 趕上 (MalformedURLException e) {/ / 檔案系統 url 不承認}
    

要轉換到的路徑從 `cdvfile://` URL:

    導入 org.apache.cordova.file.LocalFilesystemURL;
    
    獲取設備的路徑，一個 LocalFilesystemURL 物件 / / 或如果它不能表示為 cdvfile 的 URL，則為 null。
    LocalFilesystemURL url = filePlugin.filesystemURLforLocalPath(path);
    得到的字串表示形式的 URL 物件字串 cdvfileURL = url.toString();
    

如果你的外掛程式創建一個檔，並且您想要為它返回一個 FileEntry 物件，使用該檔的外掛程式:

    返回一個 JSON 結構適合於回到 JavaScript，/ / 或如果此檔不是可表示為 cdvfile 的 URL，則為 null。
    JSONObject 條目 = filePlugin.getEntryForFile(file);
    

#### iOS

科爾多瓦在 iOS 上的不使用相同 `CordovaResourceApi` 作為 android 系統的概念。在 iOS，應使用檔外掛程式 Url 和檔案系統路徑之間進行轉換。

    獲取一個物件，CDVFilesystem URL 從 url 字串 CDVFilesystemURL * = [CDVFilesystemURL fileSystemURLWithString:cdvfileURL];
    獲取路徑 URL 物件，或為零，如果它不能映射到檔 NSString * 路徑 = [filePlugin filesystemPathForURL:url];
    
    
    CDVFilesystem URL 物件獲取設備的路徑，或 / / 為零，如果它不能表示為 cdvfile 的 URL。
    CDVFilesystemURL * url = [filePlugin fileSystemURLforLocalPath:path];
    得到的字串表示形式的 URL 物件 NSString * cdvfileURL = [url absoluteString];
    

如果你的外掛程式創建一個檔，並且您想要為它返回一個 FileEntry 物件，使用該檔的外掛程式:

    CDVFilesystem URL 物件獲取設備的路徑，或 / / 為零，如果它不能表示為 cdvfile 的 URL。
    CDVFilesystemURL * url = [filePlugin fileSystemURLforLocalPath:path];
    得到一個結構來返回進入 JavaScript NSDictionary * = [filePlugin makeEntryForLocalURL:url]
    

#### JavaScript

在 JavaScript 中，得到 `cdvfile://` URL 從 FileEntry 或 DirectoryEntry 的物件，只需調用 `.toURL()` 對它:

    var cdvfileURL = entry.toURL();
    

在外掛程式回應處理常式，將從返回的 FileEntry 結構轉換為實際的條目物件，處理常式代碼應該導入檔外掛程式和創建新的物件:

    創建適當的條目物件 var 條目;
    如果 (entryStruct.isDirectory) {條目 = 新目錄 (entryStruct.name，entryStruct.fullPath，新 FileSystem(entryStruct.filesystemName));} 其他 {條目 = 新的 FileEntry (entryStruct.name，entryStruct.fullPath，新 FileSystem(entryStruct.filesystemName));}