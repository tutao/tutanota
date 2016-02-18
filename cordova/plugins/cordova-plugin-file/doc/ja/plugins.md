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

# プラグイン開発者のためのメモ

これらのノートは主に Android と iOS 開発者インタ フェース ファイルのプラグインを使用してファイル システムでプラグインを書きたい人向け。

## コルドバのファイル システムの Url での作業

バージョン 1.0.0 では、以来、このプラグインを含む Url を使用する `cdvfile` JavaScript に raw デバイス ファイル システムのパスを公開するのではなく、橋の上のすべての通信方式します。

JavaScript 側では、これはファイルと DirectoryEntry オブジェクトに HTML ファイル システムのルートを基準として、fullPath 属性があることを意味します。 あなたのプラグインの JavaScript API がファイルまたは DirectoryEntry オブジェクトを受け入れる場合を呼び出す必要があります `.toURL()` 橋を渡ってそれをネイティブ コードに渡す前にそのオブジェクトの。

### Cdvfile に変換する://fileystem のパスに Url

ファイルシステムへの書き込みする必要があるプラグインは、実際のファイルシステムの場所に受信したファイル システム URL に変換する必要があります。ネイティブ プラットフォームによって、これを行うための複数の方法があります。

それを覚えていることが重要ですすべて `cdvfile://` の Url がデバイス上の実際のファイルをマッピング可能な。 いくつかの Url は、ファイルでは表されないまたはリモート リソースを参照することができますもデバイス上の資産を参照できます。 これらの可能性のためのプラグインは、戻るときにパスに Url を変換しようとして、彼らは意味のある結果を得るかどうか常にテスト必要があります。

#### アンドロイド

アンドロイド, に変換する最も簡単な方法で、 `cdvfile://` を使用するファイルシステムのパスに URL は `org.apache.cordova.CordovaResourceApi` 。 `CordovaResourceApi`扱うことができるいくつかの方法は、 `cdvfile://` の Url:

    webView プラグイン クラス CordovaResourceApi resourceApi のメンバーである = webView.getResourceApi()。
    
    デバイスでこのファイルを表す file:///URL を取得//ファイル Uri fileURL にマップできない場合、同じ URL は変更されません = resourceApi.remapUri(Uri.parse(cdvfileURL));
    

また、ファイルのプラグインを直接使用することが可能です。

    インポート org.apache.cordova.file.FileUtils;
    インポート org.apache.cordova.file.FileSystem;
    インポート java.net.MalformedURLException;
    
    プラグイン マネージャーからファイルのプラグインを入手してコマンド filePlugin = (FileUtils)webView.pluginManager.getPlugin("File");
    
    それを試みるためにパスを取得 URL を指定すると、{文字列パス = filePlugin.filesystemPathForURL(cdvfileURL);} キャッチ (MalformedURLException e) {/ファイルシステムの url が認識されませんでした/}
    

パスから変換する、 `cdvfile://` URL:

    インポート org.apache.cordova.file.LocalFilesystemURL;
    
    デバイス ・ パスの LocalFilesystemURL オブジェクトを取得//cdvfile URL として表現できない場合は null。
    LocalFilesystemURL url = filePlugin.filesystemURLforLocalPath(path);
    URL オブジェクトの文字列 cdvfileURL の文字列表現を取得する = url.toString();
    

あなたのプラグインは、ファイルを作成しをファイル オブジェクトを返す場合、ファイルのプラグインを使用します。

    JavaScript を返すときに適した JSON 構造を返す//このファイルは cdvfile URL として表現できない場合は null。
    JSONObject エントリ = filePlugin.getEntryForFile(file);
    

#### iOS

IOS のコルドバは同じを使用しない `CordovaResourceApi` アンドロイドとしての概念。IOS では、Url とファイルシステムのパスの間を変換するファイル プラグインを使用する必要があります。

    URL の文字列 CDVFilesystemURL * url から CDVFilesystem URL オブジェクトを取得 [CDVFilesystemURL fileSystemURLWithString:cdvfileURL];
    ファイル NSString * パスにマップできない場合は nil または URL オブジェクトのパスを取得 [filePlugin filesystemPathForURL:url];
    
    
    デバイス ・ パスの CDVFilesystem の URL オブジェクトを取得または//cdvfile URL として表現できない場合は nil です。
    CDVFilesystemURL の url = [filePlugin fileSystemURLforLocalPath:path];
    URL オブジェクト NSString * cdvfileURL の文字列表現を取得する = [url absoluteString];
    

あなたのプラグインは、ファイルを作成しをファイル オブジェクトを返す場合、ファイルのプラグインを使用します。

    デバイス ・ パスの CDVFilesystem の URL オブジェクトを取得または//cdvfile URL として表現できない場合は nil です。
    CDVFilesystemURL の url = [filePlugin fileSystemURLforLocalPath:path];
    JavaScript NSDictionary * エントリに戻る構造を得る = [filePlugin makeEntryForLocalURL:url]
    

#### Java スクリプトの設定

Java スクリプトの設定を取得するに、 `cdvfile://` ファイルまたは DirectoryEntry オブジェクトからの URL を呼び出して、 `.toURL()` それを。

    var cdvfileURL = entry.toURL();
    

プラグイン応答ハンドラーに返された FileEntry 構造体の実際のエントリ オブジェクトを変換する、ハンドラーのコード ファイルのプラグインをインポート、新しいオブジェクトを作成します。

    適切なエントリ オブジェクト var エントリを作成します。
    場合 (entryStruct.isDirectory) {エントリ = 新しい DirectoryEntry (entryStruct.name、entryStruct.fullPath、新しい FileSystem(entryStruct.filesystemName));} 他 {エントリ = 新しいファイル (entryStruct.name、entryStruct.fullPath、新しい FileSystem(entryStruct.filesystemName));}