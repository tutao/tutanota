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

# プラグイン開発者のためのノート

これらのノートは、主に人造人間と iOS 開発者向けファイルのプラグインを使用して、ファイル システムでプラグインのインターフェイスを記述するもの。

## コルドバのファイル システムの Url の操作

バージョン 1.0.0 以降このプラグインが使用した Url とは `cdvfile` raw デバイス ファイル システム パスを JavaScript に公開するのではなく、ブリッジ上のすべての通信方式します。

JavaScript 側認証と DirectoryEntry オブジェクトの HTML ファイル システムのルートからの相対である fullPath 属性があることを意味します。 呼び出す必要がありますプラグインの JavaScript API は、認証または DirectoryEntry オブジェクトを受け入れる場合 `.toURL()` 、橋を渡ってネイティブ コードに渡す前に、そのオブジェクト。

### Cdvfile を変換する：//fileystem のパスに Url

ファイルシステムへの書き込みする必要があるプラグインは実際のファイルシステムの場所に受信ファイル用の URL を変換したい可能性があります。ネイティブのプラットフォームによって、これを行うための複数の方法があります。

覚えておくことが重要ですすべてではない `cdvfile://` の Url はデバイス上の実際のファイルをマッピング可能な。 いくつかの Url は、ファイルでは表されないまたはリモートのリソースを参照することができますもをデバイス上の資産を参照できます。 プラグインはこれらの可能性のために彼らの Url パスに変換するしようとしているときに戻って、有意義な結果を得るかどうか常にテスト必要があります。

#### アンドロイド

Android 上で変換する最も簡単な方法は `cdvfile://` を使用してファイルシステムのパスに URL が `org.apache.cordova.CordovaResourceApi` 。 `CordovaResourceApi`扱うことができるいくつかの方法があります `cdvfile://` Url:

    // webView is a member of the Plugin class
    CordovaResourceApi resourceApi = webView.getResourceApi();
    
    // Obtain a file:/// URL representing this file on the device,
    // or the same URL unchanged if it cannot be mapped to a file
    Uri fileURL = resourceApi.remapUri(Uri.parse(cdvfileURL));
    

また、ファイル プラグインを直接使用することが可能です。

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
    

パスから変換する、 `cdvfile://` の URL:

    import org.apache.cordova.file.LocalFilesystemURL;
    
    // Get a LocalFilesystemURL object for a device path,
    // or null if it cannot be represented as a cdvfile URL.
    LocalFilesystemURL url = filePlugin.filesystemURLforLocalPath(path);
    // Get the string representation of the URL object
    String cdvfileURL = url.toString();
    

あなたのプラグインは、ファイルを作成し、認証オブジェクトを返す場合ファイルのプラグインを使用：

    // Return a JSON structure suitable for returning to JavaScript,
    // or null if this file is not representable as a cdvfile URL.
    JSONObject entry = filePlugin.getEntryForFile(file);
    

#### iOS

IOS にコルドバと同じ使用しない `CordovaResourceApi` アンドロイドとして概念。IOS、上ファイル プラグインを使用して Url をファイルシステムのパスに変換する必要があります。

    // Get a CDVFilesystem URL object from a URL string
    CDVFilesystemURL* url = [CDVFilesystemURL fileSystemURLWithString:cdvfileURL];
    // Get a path for the URL object, or nil if it cannot be mapped to a file
    NSString* path = [filePlugin filesystemPathForURL:url];
    
    
    // Get a CDVFilesystem URL object for a device path, or
    // nil if it cannot be represented as a cdvfile URL.
    CDVFilesystemURL* url = [filePlugin fileSystemURLforLocalPath:path];
    // Get the string representation of the URL object
    NSString* cdvfileURL = [url absoluteString];
    

あなたのプラグインは、ファイルを作成し、認証オブジェクトを返す場合ファイルのプラグインを使用：

    // Get a CDVFilesystem URL object for a device path, or
    // nil if it cannot be represented as a cdvfile URL.
    CDVFilesystemURL* url = [filePlugin fileSystemURLforLocalPath:path];
    // Get a structure to return to JavaScript
    NSDictionary* entry = [filePlugin makeEntryForLocalURL:url]
    

#### Java スクリプトの設定

Java スクリプトの設定を取得するには `cdvfile://` 認証または DirectoryEntry オブジェクトから URL を単に呼び出す `.toURL()` に：

    var cdvfileURL = entry.toURL();
    

プラグインハンドラーの応答で返された FileEntry 構造体の実際のエントリ オブジェクトを変換するハンドラーのコードする必要がありますファイル プラグインをインポートし、新しいオブジェクトを作成します。

    // create appropriate Entry object
    var entry;
    if (entryStruct.isDirectory) {
        entry = new DirectoryEntry(entryStruct.name, entryStruct.fullPath, new FileSystem(entryStruct.filesystemName));
    } else {
        entry = new FileEntry(entryStruct.name, entryStruct.fullPath, new FileSystem(entryStruct.filesystemName));
    }