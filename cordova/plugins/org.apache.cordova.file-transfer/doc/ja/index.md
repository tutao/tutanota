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

このプラグインは、アップロードし、ファイルをダウンロードすることができます。

## インストール

    cordova plugin add org.apache.cordova.file-transfer
    

## サポートされているプラットフォーム

*   アマゾン火 OS
*   アンドロイド
*   ブラックベリー 10
*   Firefox の OS * *
*   iOS
*   Windows Phone 7 と 8 *
*   Windows 8 *

**サポートしていない `onprogress` も `abort()` *

* **サポートしていない `onprogress` *

# ファイル転送

`FileTransfer`オブジェクトはマルチパートのポスト、HTTP 要求を使用してファイルをアップロードして同様にファイルをダウンロードする方法を提供します。

## プロパティ

*   **onprogress**: と呼ばれる、 `ProgressEvent` データの新しいチャンクが転送されるたびに。*(機能)*

## メソッド

*   **アップロード**: サーバーにファイルを送信します。

*   **ダウンロード**: サーバーからファイルをダウンロードします。

*   **中止**: 進行中の転送を中止します。

## アップロード

**パラメーター**:

*   **fileURL**: デバイス上のファイルを表すファイルシステム URL。 下位互換性は、このことも、デバイス上のファイルの完全パスであります。 （参照してください [後方互換性メモ] の下)

*   **サーバー**: によって符号化されるように、ファイルを受信するサーバーの URL`encodeURI()`.

*   **successCallback**: 渡されたコールバックを `Metadata` オブジェクト。*(機能)*

*   **解り**: エラー取得が発生した場合に実行されるコールバック、 `Metadata` 。呼び出されると、 `FileTransferError` オブジェクト。*(機能)*

*   **オプション**: 省略可能なパラメーター *(オブジェクト)*。有効なキー:
    
    *   **fileKey**: フォーム要素の名前。既定値は `file` です。（，）
    *   **ファイル名**： ファイル名、サーバー上のファイルを保存するときに使用します。既定値は `image.jpg` です。（，）
    *   **mime タイプ**: アップロードするデータの mime タイプ。既定値は `image/jpeg` です。（，）
    *   **params**: HTTP リクエストに渡すために任意のキー/値ペアのセット。(オブジェクト)
    *   **chunkedMode**: チャンク ストリーミング モードでデータをアップロードするかどうか。既定値は `true` です。(ブール値)
    *   **ヘッダー**: ヘッダーの名前/ヘッダー値のマップ。1 つ以上の値を指定するには、配列を使用します。(オブジェクト)

*   **trustAllHosts**: 省略可能なパラメーターは、デフォルト `false` 。 場合設定 `true` 、セキュリティ証明書をすべて受け付けます。 これは Android の自己署名入りセキュリティ証明書を拒否するので便利です。 運用環境で使用しないでください。 Android と iOS でサポートされています。 *(ブール値)*

### 例

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
    

### サンプルのアップロード ヘッダーと進行状況のイベント （Android と iOS のみ）

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

A `FileUploadResult` オブジェクトの成功時のコールバックに渡される、 `FileTransfer` オブジェクトの `upload()` メソッド。

### プロパティ

*   **bytesSent**: アップロードの一部としてサーバーに送信されたバイト数。（ロング）

*   **記述**: サーバーによって返される HTTP 応答コード。（ロング）

*   **応答**: サーバーによって返される HTTP 応答。（，）

*   **ヘッダー**: HTTP 応答ヘッダー サーバーによって。(オブジェクト)
    
    *   現在 iOS のみでサポートされます。

### iOS の癖

*   サポートしていない `responseCode` または`bytesSent`.

## ダウンロード

**パラメーター**:

*   **ソース**: によって符号化されるように、ファイルをダウンロードするサーバーの URL`encodeURI()`.

*   **ターゲット**: デバイス上のファイルを表すファイルシステム url。 下位互換性は、このことも、デバイス上のファイルの完全パスであります。 （参照してください [後方互換性メモ] の下)

*   **successCallback**: 渡されたコールバックを `FileEntry` オブジェクト。*(機能)*

*   **解り**: コールバックを取得するときにエラーが発生した場合に実行される、 `Metadata` 。呼び出されると、 `FileTransferError` オブジェクト。*(機能)*

*   **trustAllHosts**: 省略可能なパラメーターは、デフォルト `false` 。 場合設定 `true` 、セキュリティ証明書をすべて受け付けます。 Android は、自己署名入りセキュリティ証明書を拒否しますので便利です。 運用環境で使用しないでください。 Android と iOS でサポートされています。 *(ブール値)*

*   **オプション**: 省略可能なパラメーターは、現在サポートするヘッダーのみ (認証 (基本認証) など)。

### 例

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

進行中の転送を中止します。Onerror コールバックが FileTransferError.ABORT_ERR のエラー コードを持っている FileTransferError オブジェクトに渡されます。

### 例

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

A `FileTransferError` オブジェクトは、エラーが発生エラー コールバックに渡されます。

### プロパティ

*   **コード**: 次のいずれかの定義済みのエラー コード。(数)

*   **ソース**: ソースの URL。(文字列)

*   **ターゲット**: 先の URL。(文字列)

*   **http_status**: HTTP ステータス コード。この属性は、HTTP 接続から応答コードを受信したときにのみ使用できます。(数)

*   **例外**: どちらか e.getMessage または e.toString (文字列)

### 定数

*   1 = `FileTransferError.FILE_NOT_FOUND_ERR`
*   2 = `FileTransferError.INVALID_URL_ERR`
*   3 = `FileTransferError.CONNECTION_ERR`
*   4 = `FileTransferError.ABORT_ERR`
*   5 = `FileTransferError.NOT_MODIFIED_ERR`

## 後方互換性をノートします。

このプラグインの以前のバージョンまたはダウンロードのターゲットとして、アップロードのソースとしてのみデバイス絶対ファイル パスを受け入れるでしょう。これらのパスの形式は、通常

    /var/mobile/Applications/<application UUID>/Documents/path/to/file  (iOS)
    /storage/emulated/0/path/to/file                                    (Android)
    

下位互換性、これらのパスを使用しても、アプリケーションは、永続的なストレージでこのようなパスを記録している場合、し彼らが引き続き使用されます。

これらのパスに公開されていなかった、 `fullPath` のプロパティ `FileEntry` および `DirectoryEntry` ファイル プラグインによって返されるオブジェクト。 新しいプラグインのバージョン、ファイル、ただし、もはや java スクリプトの設定をこれらのパスを公開します。

新しいにアップグレードする場合 (1.0.0 以降) ファイルのバージョンが以前を使用して `entry.fullPath` への引数として `download()` または `upload()` 、ファイルシステムの Url を代わりに使用するコードを変更する必要があります。

`FileEntry.toURL()``DirectoryEntry.toURL()`フォームのファイルシステムの URL を返す

    cdvfile://localhost/persistent/path/to/file
    

両方のファイルの絶対パスの代わりに使用できる `download()` および `upload()` メソッド。