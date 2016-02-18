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

プラグインのマニュアル: <doc/index.md>

このプラグインは、アップロードし、ファイルをダウンロードすることができます。

このプラグインでは、グローバル `FileTransfer`、`FileUploadOptions` コンス トラクターを定義します。

グローバル スコープでは使用できませんまで `deviceready` イベントの後です。

    document.addEventListener("deviceready", onDeviceReady, false);
    function onDeviceReady() {
        console.log(FileTransfer);
    }
    

## インストール

    cordova plugin add cordova-plugin-file-transfer
    

## サポートされているプラットフォーム

  * アマゾン火 OS
  * アンドロイド
  * ブラックベリー 10
  * ブラウザー
  * Firefox の OS * *
  * iOS
  * Windows Phone 7 と 8 *
  * Windows 8
  * Windows

\ * * `Onprogress`も`abort()`をサポートしていません。*

\ * * * `Onprogress`をサポートしていません。*

# 出色

`出色`オブジェクトは、HTTP マルチパート POST または PUT 要求を使用してファイルをアップロードし、同様にファイルをダウンロードする方法を提供します。

## プロパティ

  * **onprogress**: と呼ばれる、 `ProgressEvent` データの新しいチャンクが転送されるたびに。*(機能)*

## メソッド

  * **アップロード**: サーバーにファイルを送信します。

  * **ダウンロード**: サーバーからファイルをダウンロードします。

  * **中止**: 進行中の転送を中止します。

## upload

**パラメーター**:

  * **fileURL**: デバイス上のファイルを表すファイルシステム URL。 下位互換性は、このことも、デバイス上のファイルの完全パスであります。 （参照してください [後方互換性メモ] の下)

  * **サーバー**: によって符号化されるように、ファイルを受信するサーバーの URL`encodeURI()`.

  * **successCallback**: `FileUploadResult` オブジェクトが渡されるコールバック。*(機能)*

  * **errorCallback**: エラー `FileUploadResult` を取得するが発生した場合に実行されるコールバック。`FileTransferError` オブジェクトを使って呼び出されます。*(機能)*

  * **オプション**: 省略可能なパラメーター *(オブジェクト)*。有効なキー:
    
      * **fileKey**: フォーム要素の名前。既定値は `file` です。（，）
      * **ファイル名**： ファイル名、サーバー上のファイルを保存するときに使用します。既定値は `image.jpg` です。（，）
      * **httpMethod**: - `を置く` または `POST` のいずれかを使用する HTTP メソッド。デフォルト `のポスト` です。（，）
      * **mimeType**: アップロードするデータの mime タイプ。`イメージ/jpeg` のデフォルトです。（，）
      * **params**: HTTP リクエストに渡すために任意のキー/値ペアのセット。(オブジェクト)
      * **chunkedMode**: チャンク ストリーミング モードでデータをアップロードするかどうか。デフォルトは `true` です。(ブール値)
      * **headers**: ヘッダー名/ヘッダー値のマップ。 配列を使用して、1 つ以上の値を指定します。 IOS、FireOS、アンドロイドではという名前のコンテンツ タイプ ヘッダーが存在する場合、マルチパート フォーム データは使用されません。 (Object)
      * **httpMethod**: 例えばを使用する HTTP メソッドを POST または PUT です。 デフォルト`のポスト`です。(DOMString)

  * **trustAllHosts**: 省略可能なパラメーターは、デフォルト `false` 。 場合設定 `true` 、セキュリティ証明書をすべて受け付けます。 これは Android の自己署名入りセキュリティ証明書を拒否するので便利です。 運用環境で使用しないでください。 Android と iOS でサポートされています。 *(ブール値)*

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

`FileUploadResult` オブジェクトは `FileTransfer` オブジェクト `upload()` メソッドの成功時のコールバックに渡されます。

### プロパティ

  * **bytesSent**: アップロードの一部としてサーバーに送信されたバイト数。（ロング）

  * **記述**: サーバーによって返される HTTP 応答コード。（ロング）

  * **応答**: サーバーによって返される HTTP 応答。（，）

  * **ヘッダー**: HTTP 応答ヘッダー サーバーによって。(オブジェクト)
    
      * 現在 iOS のみでサポートされます。

### iOS の癖

  * サポートしていない `responseCode` または`bytesSent`.

## download

**パラメーター**:

  * **ソース**: によって符号化されるように、ファイルをダウンロードするサーバーの URL`encodeURI()`.

  * **ターゲット**: デバイス上のファイルを表すファイルシステム url。 下位互換性は、このことも、デバイス上のファイルの完全パスであります。 （参照してください [後方互換性メモ] の下)

  * **successCallback**: 渡されたコールバックを `FileEntry` オブジェクト。*(機能)*

  * **errorCallback**: `FileEntry` を取得するときにエラーが発生した場合に実行されるコールバック。`FileTransferError` オブジェクトを使って呼び出されます。*(機能)*

  * **trustAllHosts**: 省略可能なパラメーターは、デフォルト `false` 。 場合設定 `true` 、セキュリティ証明書をすべて受け付けます。 Android は、自己署名入りセキュリティ証明書を拒否しますので便利です。 運用環境で使用しないでください。 Android と iOS でサポートされています。 *(ブール値)*

  * **オプション**: 省略可能なパラメーターは、現在サポートするヘッダーのみ (認証 (基本認証) など)。

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
    

### WP8 癖

  * ダウンロード要求するネイティブ実装によってキャッシュに格納されています。キャッシュされないように、渡す`以来変更された if`ヘッダー メソッドをダウンロードします。

## abort

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

`FileTransferError` オブジェクトは、エラーが発生したときにエラー コールバックに渡されます。

### プロパティ

  * **コード**: 次のいずれかの定義済みのエラー コード。(数)

  * **ソース**: ソースの URL。(文字列)

  * **ターゲット**: 先の URL。(文字列)

  * **http_status**: HTTP ステータス コード。この属性は、HTTP 接続から応答コードを受信したときにのみ使用できます。(数)

  * **body**応答本体。この属性は、HTTP 接続から応答を受信したときにのみ使用できます。(文字列)

  * **exception**: どちらか e.getMessage または e.toString (文字列)

### 定数

  * 1 = `FileTransferError.FILE_NOT_FOUND_ERR`
  * 2 = `FileTransferError.INVALID_URL_ERR`
  * 3 = `FileTransferError.CONNECTION_ERR`
  * 4 = `FileTransferError.ABORT_ERR`
  * 5 = `FileTransferError.NOT_MODIFIED_ERR`

## 後方互換性をノートします。

このプラグインの以前のバージョンまたはダウンロードのターゲットとして、アップロードのソースとしてのみデバイス絶対ファイル パスを受け入れるでしょう。これらのパスの形式は、通常

    /var/mobile/Applications/<application UUID>/Documents/path/to/file  (iOS)
    /storage/emulated/0/path/to/file                                    (Android)
    

下位互換性、これらのパスを使用しても、アプリケーションは、永続的なストレージでこのようなパスを記録している場合、し彼らが引き続き使用されます。

これらのパスの `FileEntry` やファイル プラグインによって返される `DirectoryEntry` オブジェクトの `fullPath` プロパティで公開されていなかった。 新しいプラグインのバージョン、ファイル、ただし、もはや java スクリプトの設定をこれらのパスを公開します。

新しいにアップグレードする場合 (1.0.0 以降) ファイルのバージョン以前を使用している `entry.fullPath` `download()` または `upload()` への引数として、ファイルシステムの Url を代わりに使用するコードを変更する必要があります。

`FileEntry.toURL()` と `DirectoryEntry.toURL()` ファイルシステムの URL を返すフォーム

    cdvfile://localhost/persistent/path/to/file
    

`download()`、`upload()` メソッドの絶対ファイル パスの代わりに使用できます。