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

這個外掛程式允許你上傳和下載檔案。

## 安裝

    cordova plugin add org.apache.cordova.file-transfer
    

## 支援的平臺

*   亞馬遜火 OS
*   Android 系統
*   黑莓 10
*   火狐瀏覽器作業系統 * *
*   iOS
*   Windows Phone 7 和 8 *
*   Windows 8 *

**不支援 `onprogress` ，也不 `abort()` *

* **不支援 `onprogress` *

# 檔案傳輸

`FileTransfer`物件提供一種方法使用 HTTP 多部分 POST 請求的檔上傳和下載檔案，以及。

## 屬性

*   **onprogress**： 使用調用 `ProgressEvent` 每當一塊新的資料傳輸。*（函數）*

## 方法

*   **上傳**： 將檔發送到伺服器。

*   **下載**： 從伺服器上下載檔案。

*   **中止**: 中止正在進行轉讓。

## 上傳

**參數**：

*   **fileURL**： 表示檔在設備上的檔案系統 URL。 為向後相容性，這也可以將設備上的檔的完整路徑。 （請參見 [向後相容性注意到] 下面)

*   **伺服器**： 伺服器以接收該檔，由編碼的 URL`encodeURI()`.

*   **successCallback**： 傳遞一個回檔 `Metadata` 物件。*（函數）*

*   **errorCallback**： 回檔的執行如果出現檢索錯誤 `Metadata` 。調用與 `FileTransferError` 物件。*（函數）*

*   **選項**： 可選參數*（物件）*。有效的金鑰：
    
    *   **fileKey**： 表單元素的名稱。預設值為 `file` 。() DOMString
    *   **檔案名**： 要保存在伺服器上的檔時使用的檔案名稱。預設值為 `image.jpg` 。() DOMString
    *   **mimeType**： 要上傳的資料的 mime 類型。預設值為 `image/jpeg` 。() DOMString
    *   **params**： 一組可選的鍵/值對在 HTTP 要求中傳遞。（物件）
    *   **chunkedMode**： 是否要分塊流式處理模式中的資料上載。預設值為 `true` 。(布林值)
    *   **標題**： 地圖的標頭名稱/標頭值。使用陣列來指定多個值。（物件）

*   **trustAllHosts**: 可選參數，預設值為 `false` 。 如果設置為 `true` ，它接受的所有安全證書。 這是有用的因為 android 系統拒絕自簽名的安全證書。 不建議供生產使用。 支援 Android 和 iOS。 *(布林值)*

### 示例

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
    

### 與上傳的標頭和進度事件 （Android 和 iOS 只） 的示例

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

A `FileUploadResult` 物件傳遞給成功回檔的 `FileTransfer` 物件的 `upload()` 方法。

### 屬性

*   **位元組發送**： 作為上載的一部分發送到伺服器的位元組數。(長)

*   **responseCode**： 由伺服器返回的 HTTP 回應代碼。(長)

*   **回應**： 由伺服器返回的 HTTP 回應。() DOMString

*   **標題**： 由伺服器的 HTTP 回應標頭。（物件）
    
    *   目前支援的 iOS 只。

### iOS 的怪癖

*   不支援 `responseCode` 或`bytesSent`.

## 下載

**參數**：

*   **來源**： 要下載的檔，如由編碼的伺服器的 URL`encodeURI()`.

*   **目標**： 表示檔在設備上的檔案系統 url。 為向後相容性，這也可以將設備上的檔的完整路徑。 （請參見 [向後相容性注意到] 下面)

*   **successCallback**： 傳遞一個回檔 `FileEntry` 物件。*（函數）*

*   **errorCallback**： 如果錯誤發生在檢索時將執行的回檔 `Metadata` 。調用與 `FileTransferError` 物件。*（函數）*

*   **trustAllHosts**: 可選參數，預設值為 `false` 。 如果設置為 `true` ，它可以接受的所有安全證書。 這是有用的因為 Android 拒絕自行簽署式安全證書。 不建議供生產使用。 在 Android 和 iOS 上受支援。 *(布林值)*

*   **選項**： 可選參數，目前只支援標題 （如授權 （基本驗證） 等）。

### 示例

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
    

## 中止

中止正在進行轉讓。Onerror 回檔傳遞的錯誤代碼為 FileTransferError.ABORT_ERR 的 FileTransferError 物件。

### 示例

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

A `FileTransferError` 物件被傳遞給一個錯誤回呼函數時出現錯誤。

### 屬性

*   **代碼**： 下面列出的預定義的錯誤代碼之一。（人數）

*   **源**： 源的 URL。（字串）

*   **目標**： 到目標 URL。（字串）

*   **HTTP_status**： HTTP 狀態碼。從 HTTP 連接收到一個回應代碼時，此屬性才可用。（人數）

*   **例外**： 要麼 e.getMessage 或 e.toString （字串）

### 常量

*   1 = `FileTransferError.FILE_NOT_FOUND_ERR`
*   2 = `FileTransferError.INVALID_URL_ERR`
*   3 = `FileTransferError.CONNECTION_ERR`
*   4 = `FileTransferError.ABORT_ERR`
*   5 = `FileTransferError.NOT_MODIFIED_ERR`

## 向後相容性注意到

以前版本的這個外掛程式才會接受設備-絕對檔路徑的源上傳，或作為下載的目標。這些路徑通常會在表單

    /var/mobile/Applications/<application UUID>/Documents/path/to/file  (iOS)
    /storage/emulated/0/path/to/file                                    (Android)
    

為向後相容性，這些路徑仍被接受，和如果您的應用程式記錄了像這些在持久性存儲的路徑，然後他們可以繼續使用。

這些路徑被以前暴露在 `fullPath` 屬性的 `FileEntry` 和 `DirectoryEntry` 由檔外掛程式返回的物件。 新版本的檔的外掛程式，不過，不再公開這些 JavaScript 的路徑。

如果您升級到一個新 (1.0.0 或更高版本） 版本的檔，和你以前一直在使用 `entry.fullPath` 作為的參數 `download()` 或 `upload()` ，那麼你將需要更改代碼以使用檔案系統的 Url 來代替。

`FileEntry.toURL()`和 `DirectoryEntry.toURL()` 返回的表單檔案系統 URL

    cdvfile://localhost/persistent/path/to/file
    

其中可代替的絕對檔路徑在兩個 `download()` 和 `upload()` 的方法。