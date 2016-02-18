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

# cordova-plugin-file

[![Build Status](https://travis-ci.org/apache/cordova-plugin-file.svg)](https://travis-ci.org/apache/cordova-plugin-file)

このプラグインは、デバイス上のファイルへの読み取り/書き込みアクセスを許可するファイル API を実装します。

このプラグインを含む、いくつかの仕様に基づいています：、HTML5 File API の<http://www.w3.org/TR/FileAPI/>

（今は亡き) ディレクトリとシステムは、最新の拡張機能: <http://www.w3.org/TR/2012/WD-file-system-api-20120417/>プラグインのコードのほとんどはときに、以前の仕様に書かれていたが現在は： <http://www.w3.org/TR/2011/WD-file-system-api-20110419/>

FileWriter 仕様も実装しています: <http://dev.w3.org/2009/dap/file-system/file-writer.html>

使用法を参照してください HTML5 岩 ' 優秀な[ファイルシステム記事](http://www.html5rocks.com/en/tutorials/file/filesystem/)。

他のストレージ オプションの概要については、コルドバの[ストレージ ・ ガイド](http://cordova.apache.org/docs/en/edge/cordova_storage_storage.md.html)を参照してください。.

このプラグインでは、グローバル `cordova.file` オブジェクトを定義します。

グローバル スコープではあるがそれがないまで `deviceready` イベントの後です。

    document.addEventListener("deviceready", onDeviceReady, false);
    function onDeviceReady() {
        console.log(cordova.file);
    }
    

## インストール

    cordova plugin add cordova-plugin-file
    

## サポートされているプラットフォーム

  * アマゾン火 OS
  * アンドロイド
  * ブラックベリー 10
  * Firefox の OS
  * iOS
  * Windows Phone 7 と 8 *
  * Windows 8 *
  * Windows*
  * ブラウザー

\* *These platforms do not support `FileReader.readAsArrayBuffer` nor `FileWriter.write(blob)`.*

## ファイルを保存する場所

V1.2.0、現在重要なファイル システム ディレクトリへの Url を提供しています。 各 URL はフォーム *file:///path/to/spot/* で、`window.resolveLocalFileSystemURL()` を使用する `DirectoryEntry` に変換することができます。.

  * `cordova.file.applicationDirectory`-読み取り専用のディレクトリは、アプリケーションがインストールされています。（*iOS*、*アンドロイド*、*ブラックベリー 10*)

  * `cordova.file.applicationStorageDirectory`-アプリケーションのサンド ボックス; のルート ディレクトリiOS でこの場所が読み取り専用 （特定のサブディレクトリが [のような `/Documents` ] は、読み取り/書き込み)。 内に含まれるすべてのデータは、アプリケーションにプライベートです。 （ *iOS*、*アンドロイド*、*ブラックベリー 10*)

  * `cordova.file.dataDirectory`内部メモリを使用して、アプリケーションのサンド ボックス内で永続なプライベート データ ストレージ （外部メモリを使用する必要がある場合使用して Android 上で `.externalDataDirectory` )。 IOS は、このディレクトリは iCloud と同期されません (使用する `.syncedDataDirectory` )。 （*iOS*、*アンドロイド*、*ブラックベリー 10*)

  * `cordova.file.cacheDirectory`-キャッシュされたデータ ファイルやアプリに簡単に再作成できる任意のファイルのディレクトリ。 ストレージ デバイスが不足したときに、OS がこれらのファイルを削除可能性があります、それにもかかわらず、アプリはここにファイルを削除する OS に依存しないでください。 （*iOS*、*アンドロイド*、*ブラックベリー 10*)

  * `cordova.file.externalApplicationStorageDirectory`外部ストレージのアプリケーション領域。（*アンドロイド*)

  * `cordova.file.externalDataDirectory`-外部ストレージ上のアプリ固有のデータ ファイルを配置する場所。（*アンドロイド*)

  * `cordova.file.externalCacheDirectory`外部ストレージにアプリケーション キャッシュ。（*アンドロイド*)

  * `cordova.file.externalRootDirectory`-外部ストレージ (SD カード) ルート。（*アンドロイド*、*ブラックベリー 10*)

  * `cordova.file.tempDirectory`-OS をクリアすることができます temp ディレクトリが。 このディレクトリ; オフに OS に依存しません。アプリが常に該当するファイルを削除します。 (*iOS*)

  * `cordova.file.syncedDataDirectory`-（例えば iCloud) に同期する必要がありますアプリケーション固有のファイルを保持します。(*iOS*)

  * `cordova.file.documentsDirectory`-ファイル、アプリケーションにプライベートは他のアプリケーション (Office ファイルなど） を意味です。(*iOS*)

  * `cordova.file.sharedDirectory`すべてのアプリケーション (*ブラックベリー 10*にグローバルに使用できるファイル)

## ファイル ・ システム ・ レイアウト

技術的に実装の詳細、非常にどのように `cordova.file.*` プロパティは、実際のデバイス上の物理パスにマップを知っておくと便利することができます。

### iOS ファイル システムのレイアウト

| デバイス ・ パス                                      | `cordova.file.*`            | `iosExtraFileSystems` | r/w ですか？ | 永続的なですか？  |  OS を消去します   |   同期   | プライベート |
|:---------------------------------------------- |:--------------------------- |:--------------------- |:--------:|:---------:|:------------:|:------:|:------:|
| `/var/モバイル/アプリケーション/< UUID >/`           | applicationStorageDirectory | -                     |    r     |    N/A    |     N/A      |  N/A   |   はい   |
| &nbsp;&nbsp;&nbsp;`appname.app/`               | ディレクトリ                      | バンドル                  |    r     |    N/A    |     N/A      |  N/A   |   はい   |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`www/`     | -                           | -                     |    r     |    N/A    |     N/A      |  N/A   |   はい   |
| &nbsp;&nbsp;&nbsp;`Documents/`                 | documentsDirectory          | ドキュメント                |   r/w    |    はい     |     いいえ      |   はい   |   はい   |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`NoCloud/` | -                           | ドキュメント nosync         |   r/w    |    はい     |     いいえ      |  いいえ   |   はい   |
| &nbsp;&nbsp;&nbsp;`Library`                    | -                           | ライブラリ                 |   r/w    |    はい     |     いいえ      | はいですか？ |   はい   |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`NoCloud/` | dataDirectory               | ライブラリ nosync          |   r/w    |    はい     |     いいえ      |  いいえ   |   はい   |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`Cloud/`   | syncedDataDirectory         | -                     |   r/w    |    はい     |     いいえ      |   はい   |   はい   |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`Caches/`  | cacheDirectory              | キャッシュ                 |   r/w    |   はい *    | はい**\* |  いいえ   |   はい   |
| &nbsp;&nbsp;&nbsp;`tmp/`                       | tempDirectory               | -                     |   r/w    | いいえ** | はい**\* |  いいえ   |   はい   |

\ * アプリ再起動やアップグレード、永続化ファイルしますが、OS を希望するたびに、このディレクトリを削除することができます。アプリは削除可能性があります任意のコンテンツを再現することができるはず。

**ファイルはアプリ再起動の間続くことがありますが、この動作に依存しないでください。 ファイルは、更新を維持するは保証されません。 アプリが該当する場合このディレクトリからファイルを削除する必要があります、これらのファイルが削除されるとき (または場合でも)、OS は保証しません。

**\ * OS はそれ、必要だと感じているときにこのディレクトリの内容を消去可能性があります、これに依存しないようにします。 この適切なディレクトリに、アプリケーションをオフにする必要があります。

### 人造人間ファイル ・ システム ・ レイアウト

| デバイス ・ パス                                        | `cordova.file.*`                    | `AndroidExtraFileSystems` | r/w ですか？ | 永続的なですか？ | OS を消去します | プライベート |
|:------------------------------------------------ |:----------------------------------- |:------------------------- |:--------:|:--------:|:---------:|:------:|
| `file:///android_asset/`                         | ディレクトリ                              |                           |    r     |   N/A    |    N/A    |   はい   |
| `/データ/データ/< app id >/`                     | applicationStorageDirectory         | -                         |   r/w    |   N/A    |    N/A    |   はい   |
| &nbsp;&nbsp;&nbsp;`cache`                        | cacheDirectory                      | キャッシュ                     |   r/w    |    はい    |  はい\ *   |   はい   |
| &nbsp;&nbsp;&nbsp;`files`                        | dataDirectory                       | ファイル                      |   r/w    |    はい    |    いいえ    |   はい   |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`Documents`  |                                     | ドキュメント                    |   r/w    |    はい    |    いいえ    |   はい   |
| `< sd カード >/`                              | externalRootDirectory               | sd カード                    |   r/w    |    はい    |    いいえ    |  いいえ   |
| &nbsp;&nbsp;&nbsp;`Android/data/<app-id>/` | externalApplicationStorageDirectory | -                         |   r/w    |    はい    |    いいえ    |  いいえ   |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`cache`      | externalCacheDirectry               | 外部キャッシュ                   |   r/w    |    はい    | いいえ** |  いいえ   |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`files`      | externalDataDirectory               | 外部ファイル                    |   r/w    |    はい    |    いいえ    |  いいえ   |

\ * OS は定期的にこのディレクトリを消去可能性がありますが、この動作に依存しないでください。 アプリケーションの必要に応じてこのディレクトリの内容をオフにします。 ユーザーは手動でキャッシュを削除する必要があります、このディレクトリの内容が削除されます。

** OS はこのディレクトリを自動的にはクリアされません内容を自分で管理する責任があります。 ユーザは手動でキャッシュを消去する必要があります、ディレクトリの内容が削除されます。

**注**: 外部記憶装置をマウントできない場合は、`cordova.file.external*` プロパティを `null`.

### ブラックベリー 10 ファイル ・ システム ・ レイアウト

| デバイス ・ パス                                                   | `cordova.file.*`            | r/w ですか？ | 永続的なですか？ | OS を消去します | プライベート |
|:----------------------------------------------------------- |:--------------------------- |:--------:|:--------:|:---------:|:------:|
| `file:///accounts/1000/appdata/< app id >/`           | applicationStorageDirectory |    r     |   N/A    |    N/A    |   はい   |
| &nbsp;&nbsp;&nbsp;`app/native`                              | ディレクトリ                      |    r     |   N/A    |    N/A    |   はい   |
| &nbsp;&nbsp;&nbsp;`data/webviews/webfs/temporary/local__0`  | cacheDirectory              |   r/w    |   いいえ    |    はい     |   はい   |
| &nbsp;&nbsp;&nbsp;`data/webviews/webfs/persistent/local__0` | dataDirectory               |   r/w    |    はい    |    いいえ    |   はい   |
| `file:///accounts/1000/removable/sdcard`                    | externalRemovableDirectory  |   r/w    |    はい    |    いいえ    |  いいえ   |
| `file:///accounts/1000/shared`                              | sharedDirectory             |   r/w    |    はい    |    いいえ    |  いいえ   |

*注*: すべてのパスは/accounts/1000-enterprise 基準に境界を動作するようにアプリケーションを展開するとき。

## Android の癖

### Android の永続的なストレージの場所

Android のデバイスに永続的なファイルを格納する複数の有効な場所があります。 さまざまな可能性について広範な議論のための [このページ](http://developer.android.com/guide/topics/data/data-storage.html) を参照してください。

以前のバージョンのプラグインは、デバイスの SD カード （または同等のストレージ パーティション） マウントされていたと主張したかどうかに基づいて、起動時に一時と永続的なファイルの場所を選ぶでしょう。 SD カードがマウントされている場合、または大規模な内部ストレージ パーティションが利用可能な場合 (ようネクサス デバイス上） し、永続的なファイルは、その領域のルートに格納されます。 これはすべての Cordova アプリ見ることができる利用可能なファイルのすべてのカードに意味しました。

SD カードがない場合、以前のバージョンがデータを格納する `/data/data/<packageId>`、お互いからアプリを分離するが、まだ原因可能性がありますユーザー間で共有するデータ。

内部ファイルの保存場所やアプリケーションの `config.xml` ファイルに優先順位を持つ以前のロジックを使用してファイルを保存するかどうかを選択することが可能です今。 これを行うに、`config.xml` に次の 2 行のいずれかを追加します。

    <preference name="AndroidPersistentFileLocation" value="Internal" />
    
    <preference name="AndroidPersistentFileLocation" value="Compatibility" />
    

この行がなければファイル プラグインはデフォルトとして `Compatibility` を使用します。優先タグが存在し、これらの値の 1 つではない場合、アプリケーションは起動しません。

アプリケーションは、ユーザーに以前出荷されている場合、古い (前 1.0） を使用して、このプラグインのバージョンし、永続的なファイルシステムに保存されているファイルには `Compatibility` を設定する必要があります。 自分のアプリケーションをアップグレードする既存のユーザーを彼らの装置によって、以前に保存されたファイルにアクセスすることができることがあることを意味する「内部」に場所をスイッチングします。

アプリケーションは、新しい、または永続的なファイルシステムにファイルが格納され以前は決して場合、`内部` 設定一般的に推奨されます。

### /Android_asset の低速の再帰的な操作

アセット ディレクトリの一覧表示は、人造人間本当に遅いです。 それをスピードアップすることができます`src/android/build-extras.gradle`を android プロジェクトのルートに追加することによって、最大 (また cordova-android@4.0.0 が必要ですまたはそれ以上)。

## iOS の癖

  * `cordova.file.applicationStorageDirectory`読み取り専用;ルート ディレクトリ内のファイルを保存しようは失敗します。 他の 1 つを使用して `cordova.file.*` iOS のため定義されているプロパティ (のみ `applicationDirectory` と `applicationStorageDirectory` は読み取り専用)。
  * `FileReader.readAsText(blob, encoding)` 
      * `encoding`パラメーターはサポートされていませんし、utf-8 エンコーディングが常に有効です。

### iOS の永続的なストレージの場所

IOS デバイスに永続的なファイルを格納する 2 つの有効な場所がある: ドキュメントとライブラリのディレクトリ。 プラグインの以前のバージョンは、唯一のこれまでドキュメント ディレクトリに永続的なファイルを格納されます。 これは、ディレクトリの目的は、輸出のための完全なドキュメントを作成するのではなくなかったがしばしば意図されていたり、特に多数の小さいファイルを処理するアプリケーションの場合、iTunes に表示されているすべてのアプリケーションのファイルを作るの副作用があった。

ドキュメントまたはアプリケーションの `config.xml` ファイルに優先順位のライブラリ ディレクトリにファイルを保存するかどうかを選択することが可能です今。 これを行うに、`config.xml` に次の 2 行のいずれかを追加します。

    <preference name="iosPersistentFileLocation" value="Library" />
    
    <preference name="iosPersistentFileLocation" value="Compatibility" />
    

この行がなければファイル プラグインはデフォルトとして `Compatibility` を使用します。優先タグが存在し、これらの値の 1 つではない場合、アプリケーションは起動しません。

アプリケーションは、ユーザーに以前出荷されている場合、古い (前 1.0） を使用して、このプラグインのバージョンし、永続的なファイルシステムに保存されているファイルには `Compatibility` を設定する必要があります。 自分のアプリケーションをアップグレードする既存のユーザーを以前に保存されたファイルにアクセスすることができるだろうことを意味する `Library` に場所をスイッチングします。

アプリケーションは、新しい、または永続的なファイルシステムにファイルが格納され以前は決して場合、`Library` 設定一般的に推奨されます。

## Firefox OS 癖

ファイル システム API Firefox OS でネイティブ サポートされていないと、indexedDB の上にシムとして実装されています。

  * 空でないディレクトリを削除するときに失敗しません
  * ディレクトリのメタデータをサポートしていません
  * 方法 `copyTo` と `moveTo` ディレクトリをサポートしていません

次のデータ パスがサポートされています: * `applicationDirectory` - `xhr` を使用して、アプリケーションと共にパッケージ化されるローカル ファイルを取得します。 * `dataDirectory` - 永続的なアプリケーション固有のデータ ファイル。 * `cacheDirectory` - アプリケーションの再起動後も維持する必要がありますキャッシュ ファイル (アプリはここにファイルを削除する OS に依存しないでください)。

## ブラウザーの癖

### 共通の癖と発言

  * 各ブラウザーはサンド ボックス化されたファイルシステムを使用します。IE と Firefox IndexedDB をベースとして使用します。すべてのブラウザーは、パスにディレクトリの区切り記号としてスラッシュを使用します。
  * ディレクトリ エントリは連続して作成されなければなりません。 たとえば、コール `fs.root.getDirectory ('dir1 dir2'、{create:true}、successCallback、解り)` dir1 が存在しなかった場合は失敗します。
  * プラグインは、永続的なストレージ アプリケーションの最初の起動時に使用するユーザーのアクセス許可を要求します。 
  * プラグインは、`cdvfile://localhost` (ローカル リソース) をサポートしているだけです。すなわち外部リソースは、`cdvfile` を介してサポートされていません.
  * プラグインに [制限」のファイル システム API の 8.3 命名規則](http://www.w3.org/TR/2011/WD-file-system-api-20110419/#naming-restrictions) に従っていません。.
  * Blob およびファイル ' `close` 関数はサポートされていません。
  * `FileSaver` と `BlobBuilder` このプラグインでサポートされていないスタブを持っていません。
  * プラグインは、`requestAllFileSystems` をサポートしません。この関数は、仕様で行方不明にも。
  * ディレクトリ内のエントリを使用すると削除されません `create: true` 既存ディレクトリのフラグ。
  * コンス トラクターで作成されたファイルはサポートされていません。代わりに entry.file メソッドを使用する必要があります。
  * 各ブラウザーは blob URL 参照の独自のフォームを使用します。
  * `readAsDataURL` 関数はサポートされてがクロムメッキで mediatype エントリ名の拡張子によって異なります、IE でメディアの種類は、常に空 （`text-plain` に従って、仕様と同じである）、Firefox でメディアの種類は常に `アプリケーションまたはオクテット-ストリーム`。 たとえば、コンテンツが場合 `abcdefg` し Firefox を返します `データ: アプリケーション/オクテット ストリーム、base64、YWJjZGVmZw = =`、すなわちを返します `データ:; base64、YWJjZGVmZw = =`、クロムを返します `データ: < エントリ名の拡張子によって mediatype >; base64、YWJjZGVmZw = =`.
  * `toInternalURL` フォーム `file:///persistent/path/to/entry` （Firefox、IE） のパスを返します。 クロムの `cdvfile://localhost/persistent/file` フォームのパスを返します.

### クロムの癖

  * デバイスの準備ができているイベント後クローム ファイルシステムはすぐに準備ができています。回避策としては `filePluginIsReady` イベントにサブスクライブできます。例: 

```javascript
window.addEventListener('filePluginIsReady', function(){ console.log('File plugin is ready');}, false);
```

`window.isFilePluginReadyRaised` 関数を使用して、イベントが既に発生したかどうかを確認できます。 -Chrome に window.requestFileSystem 一時と永続的なファイル ・ システムのクォータの制限はありません。 -クロム内の永続ストレージを増加する `window.initPersistentFileSystem` メソッドを呼び出す必要があります。 永続的な記憶域のクォータは、既定では 5 MB です。 クロムが必要です `--許可-ファイル-アクセス--ファイルから` `file:///` プロトコル経由でサポート API に引数を実行します。 -`ファイル` オブジェクト フラグを使用する場合ない変更されます `{create:true}` 既存の `エントリ` を取得するとき。 -イベント `cancelable` プロパティを設定するクロムの場合は true。 これは [仕様](http://dev.w3.org/2009/dap/file-system/file-writer.html) に反して。 -クロムメッキで `網` 関数を返します `ファイルシステム：`-アプリケーションのホストによってパスのプレフィックスします。 たとえば、`filesystem:file:///persistent/somefile.txt`、`filesystem:http://localhost:8080/persistent/somefile.txt`。 -`toURL` の関数の結果にはディレクトリ エントリ場合末尾にスラッシュが含まれていません。 クロムは、スラッシュ後塵 url を持つディレクトリが正しく解決されるも。 -`resolveLocalFileSystemURL` メソッドは、受信 `url` が `ファイルシステム` のプレフィックスが必要です。 たとえば、`resolveLocalFileSystemURL` の `url` パラメーター フォーム `filesystem:file:///persistent/somefile.txt` で人造人間フォーム `file:///persistent/somefile.txt` とは対照的にする必要があります。 -廃止された `toNativeURL` 関数はサポートされていません、スタブはありません。 -`setMetadata` 関数は、仕様に記載されていないありサポートされていません。 -INVALID_MODIFICATION_ERR （コード: 9) の代わりにスローされた SYNTAX_ERR(code: 8) の非実在しないファイルシステムの依頼を。 -INVALID_MODIFICATION_ERR （コード: 9) の代わりにスローされた PATH_EXISTS_ERR(code: 12)、排他的なファイルまたはディレクトリを作成しようとするが既に存在します。 -INVALID_MODIFICATION_ERR （コード: 9) の代わりにスローされた NO_MODIFICATION_ALLOWED_ERR(code: 6) ルート ・ ファイル ・ システムで removeRecursively を呼び出すをしようとして。 -INVALID_MODIFICATION_ERR （コード: 9) の代わりにスローされた NOT_FOUND_ERR(code: 1) [moveto] ディレクトリが存在しないをしようとして。

### IndexedDB ベース インプレ癖 （Firefox と IE）

  * `.` `です。` はサポートされていません。
  * IE は `file:///` をサポートしていません-モード;ホスト モードのみがサポートされている (http://localhost:xxxx) です。
  * Firefox のファイルシステムのサイズは無制限ですが各 50 MB の拡張機能がユーザーのアクセス許可を要求します。 IE10 は最大 10 mb の複合 AppCache と IndexedDB を求めず、サイトごとに 250 mb の最大値まで増加を許可するかどうかをたずねられますそのレベルに当ればファイルシステムの実装で使用することができます。 `RequestFileSystem` 関数の `size` パラメーターは、Firefox と IE のファイルシステムには影響しません。
  * `readAsBinaryString` 関数の仕様に記載されていない、IE でサポートされていないと、スタブを持っていません。
  * `file.type` は、常に null です。
  * 削除された DirectoryEntry インスタンスのコールバックの結果を使用してエントリを作成しないでください。それ以外の場合は、'ハンギングのエントリ' が表示されます。
  * ちょうど書かれていた、ファイルを読むことができます前にこのファイルの新しいインスタンスを取得する必要があります。
  * `setMetadata` 関数は、仕様に記載されていない `modificationTime` フィールド変更のみをサポートします。 
  * `copyTo` と `moveTo` 関数ディレクトリをサポートしていません。
  * ディレクトリのメタデータはサポートされていません。
  * 両方の Entry.remove と directoryEntry.removeRecursively は空でないディレクトリを削除するときを失敗しない - 削除されるディレクトリ コンテンツと共にを掃除している代わりに。
  * `abort` し、`truncate` 機能はサポートされていません。
  * 進行状況イベントは起動しません。たとえば、このハンドラーがない実行されます。

```javascript
writer.onprogress = function() { /*commands*/ };
```

## ノートをアップグレードします。

このプラグインのデベロッパー、公開された仕様に合うように、`認証` と `DirectoryEntry` の構造が変更されました。

プラグインの前 (pre 1.0.0) バージョンはデバイス絶対ファイル場所 `エントリ` オブジェクトの `fullPath` プロパティに格納されます。これらのパスはようになります通常

    /var/mobile/Applications/<application UUID>/Documents/path/to/file  (iOS)
    /storage/emulated/0/path/to/file                                    (Android)
    

これらのパスはまた `Entry` オブジェクトの `toURL()` メソッドによって返されます。

デベロッパー、`fullPath` 属性は *HTML ファイルシステムのルートに対する相対パス* のファイルへのパス。 したがって、上記のパスは今両方の `fullPath` と `FileEntry` オブジェクトで表される

    /path/to/file
    

デバイス絶対パスとアプリケーション動作以前 `Entry` オブジェクトの `fullPath` プロパティを使用してこれらのパスを取得した場合は、代わりに `entry.toURL()` を使用するコードを更新する必要があります。

下位互換性、`resolveLocalFileSystemURL()` メソッドは、デバイス絶対パスを受け入れるし、は、`TEMPORARY` または `PERSISTENT` ファイル ・ システム内でそのファイルが存在する限り、それに対応する `Entry` オブジェクトを返します。

これは特に以前デバイス絶対パスを使用してファイル転送のプラグインで問題となっている （そしてまだそれらを受け入れることができます）。 それがデバイス上のファイルで動作するプラグインを得る問題を解決する必要があります `entry.toURL()` で `entry.fullPath` を置き換えるので、ファイルシステムの Url で正常に動作にアップデートされました。

V1.1.0 の `toURL()` の戻り値に変更されました (\[CB-6394\] (https://issues.apache.org/jira/browse/CB-6394) を参照) を絶対 'file://' で始まる URL を返します。 可能な限り。 確保するために、' cdvfile:'-`toInternalURL()` を今すぐ使用できます URL。 このメソッドは、フォームのファイルシステムの Url を返します今

    cdvfile://localhost/persistent/path/to/file
    

これはファイルを一意に識別するために使用できます。

## エラー コードと意味のリスト

エラーがスローされると、次のコードのいずれかが使用されます。

| コード | 定数                            |
| ---:|:----------------------------- |
|   1 | `NOT_FOUND_ERR`               |
|   2 | `SECURITY_ERR`                |
|   3 | `ABORT_ERR`                   |
|   4 | `NOT_READABLE_ERR`            |
|   5 | `ENCODING_ERR`                |
|   6 | `NO_MODIFICATION_ALLOWED_ERR` |
|   7 | `INVALID_STATE_ERR`           |
|   8 | `SYNTAX_ERR`                  |
|   9 | `INVALID_MODIFICATION_ERR`    |
|  10 | `QUOTA_EXCEEDED_ERR`          |
|  11 | `TYPE_MISMATCH_ERR`           |
|  12 | `PATH_EXISTS_ERR`             |

## (省略可能) プラグインを構成します。

利用可能なファイルシステムのセットは構成されたプラットフォームをすることができます。IOS と Android の両方を認識します。 <preference> タグ `config.xml` をインストールするファイルシステムの名前します。既定では、すべてのファイル システムのルートが有効になります。

    <preference name="iosExtraFilesystems" value="library,library-nosync,documents,documents-nosync,cache,bundle,root" />
    <preference name="AndroidExtraFilesystems" value="files,files-external,documents,sdcard,cache,cache-external,root" />
    

### アンドロイド

  * `files`： アプリケーションの内部ファイルのストレージ ディレクトリ
  * `files-external`: アプリケーションの外部のファイルのストレージ ディレクトリ
  * `sdcard`：、グローバル外部ストレージ ディレクトリをファイル (これは SD カードのルートがインストールされている場合)。 これを使用するには、`android.permission.WRITE_EXTERNAL_STORAGE` 権限が必要です。
  * `cache`： アプリケーションの内部キャッシュ ディレクトリ
  * `cache-external`： 外部キャッシュのアプリケーションのディレクトリ
  * `root`： デバイス全体のファイルシステム

アンドロイドを「ファイル」ファイルシステム内の"ドキュメント/"サブディレクトリを表す"ドキュメント"という名前の特殊なファイルシステムもサポートしています。

### iOS

  * `library`: ライブラリのアプリケーションのディレクトリ
  * `documents`: ドキュメントのアプリケーションのディレクトリ
  * `cache`: キャッシュのアプリケーションのディレクトリ
  * `bundle`: アプリケーションバンドル;アプリ自体 (読み取りのみ) ディスク上の場所
  * `root`： デバイス全体のファイルシステム

既定では、ライブラリとドキュメント ディレクトリを iCloud に同期できます。 2 つの追加のファイルシステム、`library-nosync` および `documents-nosync` を表す、特別な非同期ディレクトリ内を要求することもできます、`/Library` または `Documents/` ファイルシステム。