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

[![Build Status](https://travis-ci.org/apache/cordova-plugin-file-transfer.svg)](https://travis-ci.org/apache/cordova-plugin-file-transfer)

外掛程式檔: <doc/index.md>

這個外掛程式允許你上傳和下載檔案。

這個外掛程式定義全域 `FileTransfer`，`FileUploadOptions` 的建構函式。

雖然在全球範圍內，他們不可用直到 `deviceready` 事件之後。

    document.addEventListener("deviceready", onDeviceReady, false);
    function onDeviceReady() {
        console.log(FileTransfer);
    }
    

## 安裝

    cordova plugin add cordova-plugin-file-transfer
    

## 支援的平臺

  * 亞馬遜火 OS
  * Android 系統
  * 黑莓 10
  * 瀏覽器
  * 火狐瀏覽器的作業系統 * *
  * iOS
  * Windows Phone 7 和 8 *
  * Windows 8
  * Windows

\ **不支援`onprogress`也`abort()` *

\ * **不支援`onprogress` *

# 檔案傳輸

`FileTransfer`物件提供上傳檔使用 HTTP 多部分職位或付諸表決的請求，並將檔以及下載的方式。

## 屬性

  * **onprogress**： 使用調用 `ProgressEvent` 每當一塊新的資料傳輸。*（函數）*

## 方法

  * **upload**： 將檔發送到伺服器。

  * **download**： 從伺服器上下載檔案。

  * **abort**: 中止正在進行轉讓。

## upload

**參數**：

  * **fileURL**： 表示檔在設備上的檔案系統 URL。 為向後相容性，這也可以將設備上的檔的完整路徑。 （請參見 [向後相容性注意到] 下面)

  * **server**： 伺服器以接收該檔，由編碼的 URL`encodeURI()`.

  * **successCallback**： 一個通過一個 `FileUploadResult` 物件的回檔。*（函數）*

  * **errorCallback**： 如果發生錯誤，檢索 `FileUploadResult` 執行一個回檔。使用 `FileTransferError` 物件調用。*（函數）*

  * **options**： 可選參數*（物件）*。有效的金鑰：
    
      * **fileKey**： 表單元素的名稱。預設值為 `file` 。() DOMString
      * **fileName**： 要保存在伺服器上的檔時使用的檔案名稱。預設值為 `image.jpg` 。() DOMString
      * **httpMethod**： HTTP 方法使用-`PUT` 或 `POST`。預設值為 `POST`。() DOMString
      * **mimeType**： 要上載的資料的 mime 類型。預設設置為 `image/jpeg`。() DOMString
      * **params**： 一組要在 HTTP 要求中傳遞的可選的鍵值對。（物件）
      * **chunkedMode**： 是否要分塊的流式處理模式中的資料上載。預設值為 `true`。(布林值)
      * **headers**: 地圖的標頭名稱/標頭值。 使用陣列來指定多個值。 IOS、 FireOS，和安卓系統，如果已命名的內容類型標頭存在，多部分表單資料不被使用。 (Object)
      * **httpMethod**: HTTP 方法，例如使用張貼或放。 預設為`開機自檢`。() DOMString

  * **trustAllHosts**: 可選參數，預設值為 `false` 。 如果設置為 `true` ，它可以接受的所有安全證書。 這是有用的因為 android 系統拒絕自簽名的安全證書。 不建議供生產使用。 在 Android 和 iOS 上受支援。 *(布林值)*

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

`FileUploadResult` 物件將傳遞給該 `檔案傳輸` 物件的 `upload()` 方法的成功回檔。

### 屬性

  * **bytesSent**： 作為上載的一部分發送到伺服器的位元組數。(長)

  * **responseCode**： 由伺服器返回的 HTTP 回應代碼。(長)

  * **response**： 由伺服器返回的 HTTP 回應。() DOMString

  * **headers**： 由伺服器的 HTTP 回應標頭。（物件）
    
      * 目前支援的 iOS 只。

### iOS 的怪癖

  * 不支援 `responseCode` 或`bytesSent`.

## download

**參數**：

  * **source**： 要下載的檔，如由編碼的伺服器的 URL`encodeURI()`.

  * **target**： 表示檔在設備上的檔案系統 url。 為向後相容性，這也可以將設備上的檔的完整路徑。 （請參見 [向後相容性注意到] 下面)

  * **successCallback**： 傳遞一個回檔 `FileEntry` 物件。*（函數）*

  * **errorCallback**： 如果檢索 `FileEntry` 時發生錯誤，則執行一個回檔。使用 `FileTransferError` 物件調用。*（函數）*

  * **trustAllHosts**: 可選參數，預設值為 `false` 。 如果設置為 `true` ，它可以接受的所有安全證書。 這是有用的因為 Android 拒絕自行簽署式安全證書。 不建議供生產使用。 在 Android 和 iOS 上受支援。 *(布林值)*

  * **options**： 可選參數，目前只支援標題 （如授權 （基本驗證） 等）。

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
    

### WP8 的怪癖

  * 下載請求由本機實現被緩存。若要避免緩存，傳遞`如果修改自`郵件頭以下載方法。

## abort

中止正在進行轉讓。Onerror 回檔傳遞一個 FileTransferError 物件具有 FileTransferError.ABORT_ERR 錯誤代碼。

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

當發生錯誤時，`FileTransferError` 物件將傳遞給錯誤回檔。

### 屬性

  * **code**： 下面列出的預定義的錯誤代碼之一。（人數）

  * **source**： 源的 URL。（字串）

  * **target**： 到目標 URL。（字串）

  * **HTTP_status**： HTTP 狀態碼。從 HTTP 連接收到一個回應代碼時，此屬性才可用。（人數）

  * **body**回應正文。此屬性只能是可用的當該 HTTP 連接收到答覆。（字串）

  * **exception**： 要麼 e.getMessage 或 e.toString （字串）

### 常量

  * 1 = `FileTransferError.FILE_NOT_FOUND_ERR`
  * 2 = `FileTransferError.INVALID_URL_ERR`
  * 3 = `FileTransferError.CONNECTION_ERR`
  * 4 = `FileTransferError.ABORT_ERR`
  * 5 = `FileTransferError.NOT_MODIFIED_ERR`

## 向後相容性注意到

以前版本的這個外掛程式才會接受設備-絕對檔路徑作為源對於上載，或用於下載的目標。這些路徑通常會在表單

    /var/mobile/Applications/<application UUID>/Documents/path/to/file  (iOS)
    /storage/emulated/0/path/to/file                                    (Android)
    

為向後相容性，這些路徑仍會被接受，和如果您的應用程式已錄得像這些在持久性存儲的路徑，然後他們可以繼續使用。

這些路徑被以前暴露在 `FileEntry` 和由檔外掛程式返回的 `DirectoryEntry` 物件的 `fullPath` 屬性中。 新版本的檔的外掛程式，但是，不再公開這些 JavaScript 的路徑。

如果您要升級到新 (1.0.0 或更高版本） 版本的檔，和你以前一直在使用 `entry.fullPath` 作為參數到 `download()` 或 `upload()`，那麼你將需要更改代碼以使用檔案系統的 Url 來代替。

`FileEntry.toURL()` 和 `DirectoryEntry.toURL()` 返回的表單檔案 URL

    cdvfile://localhost/persistent/path/to/file
    

它可以用在 `download()` 和 `upload()` 兩種方法中的絕對檔路徑位置。