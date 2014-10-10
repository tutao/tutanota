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

# org.apache.cordova.file

このプラグインは、デバイス上のファイルへの読み取り/書き込みアクセスを許可するファイル API を実装します。

このプラグインを含む、いくつかの仕様に基づいています：、HTML5 File API の<http://www.w3.org/TR/FileAPI/>

（今は亡き) ディレクトリとシステムは、最新の拡張機能: <http://www.w3.org/TR/2012/WD-file-system-api-20120417/>プラグインのコードのほとんどはときに、以前の仕様に書かれていたが現在は： <http://www.w3.org/TR/2011/WD-file-system-api-20110419/>

FileWriter 仕様も実装しています: <http://dev.w3.org/2009/dap/file-system/file-writer.html>

使用法を参照してください HTML5 岩 ' 優秀な[ファイルシステム記事][1]。

 [1]: http://www.html5rocks.com/en/tutorials/file/filesystem/

他のストレージ オプションの概要については、コルドバの[ストレージ ・ ガイド][2]を参照してください。.

 [2]: http://cordova.apache.org/docs/en/edge/cordova_storage_storage.md.html

## インストール

    cordova plugin add org.apache.cordova.file
    

## サポートされているプラットフォーム

*   アマゾン火 OS
*   アンドロイド
*   ブラックベリー 10
*   Firefox の OS
*   iOS
*   Windows Phone 7 と 8 *
*   Windows 8 *

**これらのプラットフォームがサポートしていない `FileReader.readAsArrayBuffer` も `FileWriter.write(blob)` .*

## ファイルを保存する場所

V1.2.0、現在重要なファイル システム ディレクトリへの Url を提供しています。 各 URL はフォーム*file:///path/to/spot/*に変換することができます、 `DirectoryEntry` を使用して`window.resolveLocalFileSystemURL()`.

*   `cordova.file.applicationDirectory`-読み取り専用のディレクトリは、アプリケーションがインストールされています。（*iOS*、*アンドロイド*、*ブラックベリー 10*)

*   `cordova.file.applicationStorageDirectory`-アプリケーションのサンド ボックス; のルート ディレクトリiOS でこの場所が読み取り専用 （特定のサブディレクトリが [のような `/Documents` ] は、読み取り/書き込み)。 内に含まれるすべてのデータは、アプリケーションにプライベートです。 （ *iOS*、*アンドロイド*、*ブラックベリー 10*)

*   `cordova.file.dataDirectory`内部メモリを使用して、アプリケーションのサンド ボックス内で永続なプライベート データ ストレージ （外部メモリを使用する必要がある場合使用して Android 上で `.externalDataDirectory` )。 IOS は、このディレクトリは iCloud と同期されません (使用する `.syncedDataDirectory` )。 （*iOS*、*アンドロイド*、*ブラックベリー 10*)

*   `cordova.file.cacheDirectory`-キャッシュされたデータ ファイルやアプリに簡単に再作成できる任意のファイルのディレクトリ。 ストレージ デバイスが不足したときに、OS がこれらのファイルを削除可能性があります、それにもかかわらず、アプリはここにファイルを削除する OS に依存しないでください。 （*iOS*、*アンドロイド*、*ブラックベリー 10*)

*   `cordova.file.externalApplicationStorageDirectory`外部ストレージのアプリケーション領域。（*アンドロイド*)

*   `cordova.file.externalDataDirectory`-外部ストレージ上のアプリ固有のデータ ファイルを配置する場所。（*アンドロイド*)

*   `cordova.file.externalCacheDirectory`外部ストレージにアプリケーション キャッシュ。（*アンドロイド*)

*   `cordova.file.externalRootDirectory`-外部ストレージ (SD カード) ルート。（*アンドロイド*、*ブラックベリー 10*)

*   `cordova.file.tempDirectory`-OS をクリアすることができます temp ディレクトリが。 このディレクトリ; オフに OS に依存しません。アプリが常に該当するファイルを削除します。 (*iOS*)

*   `cordova.file.syncedDataDirectory`-（例えば iCloud) に同期する必要がありますアプリケーション固有のファイルを保持します。(*iOS*)

*   `cordova.file.documentsDirectory`-ファイル、アプリケーションにプライベートは他のアプリケーション (Office ファイルなど） を意味です。(*iOS*)

*   `cordova.file.sharedDirectory`すべてのアプリケーション (*ブラックベリー 10*にグローバルに使用できるファイル)

## ファイル ・ システム ・ レイアウト

非常に知っておくと便利することができますが技術的に実装の詳細、どのように、 `cordova.file.*` プロパティを実際のデバイス上の物理パスにマップ。

### iOS ファイル システムのレイアウト

| デバイス ・ パス                            | `cordova.file.*`            | `iosExtraFileSystems` | r/w ですか？ | 永続的なですか？ | OS を消去します  |   同期   | プライベート |
|:------------------------------------ |:--------------------------- |:--------------------- |:--------:|:--------:|:----------:|:------:|:------:|
| `/var/モバイル/アプリケーション/< UUID >/` | applicationStorageDirectory | -                     |    r     |   N/A    |    N/A     |  N/A   |   はい   |
|    `appname.app/`                    | ディレクトリ                      | バンドル                  |    r     |   N/A    |    N/A     |  N/A   |   はい   |
|       `www/`                         | -                           | -                     |    r     |   N/A    |    N/A     |  N/A   |   はい   |
|    `Documents/`                      | documentsDirectory          | ドキュメント                |   r/w    |    はい    |    いいえ     |   はい   |   はい   |
|       `NoCloud/`                     | -                           | ドキュメント nosync         |   r/w    |    はい    |    いいえ     |  いいえ   |   はい   |
|    `Library`                         | -                           | ライブラリ                 |   r/w    |    はい    |    いいえ     | はいですか？ |   はい   |
|       `NoCloud/`                     | dataDirectory               | ライブラリ nosync          |   r/w    |    はい    |    いいえ     |  いいえ   |   はい   |
|       `Cloud/`                       | syncedDataDirectory         | -                     |   r/w    |    はい    |    いいえ     |   はい   |   はい   |
|       `Caches/`                      | cacheDirectory              | キャッシュ                 |   r/w    |   はい *   | はい \* * *| |  いいえ   |   はい   |
|    `tmp/`                            | tempDirectory               | -                     |   r/w    | いいえ * *  | はい \* * *| |  いいえ   |   はい   |

* アプリを再起動し、アップグレードとの間でファイルを保持が、OS を希望するたびにこのディレクトリを削除することができます。アプリを削除可能性があります任意のコンテンツを再作成することができる必要があります。

* * ファイル アプリケーション再起動を渡って続くことがありますが、この動作に依存しないでください。 ファイルは、更新を維持するは保証されません。 アプリが該当する場合このディレクトリからファイルを削除する必要があります、これらのファイルが削除されるとき (または場合でも)、OS は保証しません。

\* * *| OS はそれ、必要だと感じているときにこのディレクトリの内容を消去可能性がありますが、これに依存しません。 この適切なディレクトリに、アプリケーションをオフにする必要があります。

### 人造人間ファイル ・ システム ・ レイアウト

| デバイス ・ パス                         | `cordova.file.*`                    | `AndroidExtraFileSystems` | r/w ですか？ | 永続的なですか？ | OS を消去します | プライベート |
|:--------------------------------- |:----------------------------------- |:------------------------- |:--------:|:--------:|:---------:|:------:|
| `file:///android_asset/`          | ディレクトリ                              |                           |    r     |   N/A    |    N/A    |   はい   |
| `/データ/データ/< app id >/`      | applicationStorageDirectory         | -                         |   r/w    |   N/A    |    N/A    |   はい   |
|    `cache`                        | cacheDirectory                      | キャッシュ                     |   r/w    |    はい    |   はい *    |   はい   |
|    `files`                        | dataDirectory                       | ファイル                      |   r/w    |    はい    |    いいえ    |   はい   |
|       `Documents`                 |                                     | ドキュメント                    |   r/w    |    はい    |    いいえ    |   はい   |
| `< sd カード >/`               | externalRootDirectory               | sd カード                    |   r/w    |    はい    |    いいえ    |  いいえ   |
|    `Android/data/<app-id>/` | externalApplicationStorageDirectory | -                         |   r/w    |    はい    |    いいえ    |  いいえ   |
|       `cache`                     | externalCacheDirectry               | 外部キャッシュ                   |   r/w    |    はい    |  いいえ * *  |  いいえ   |
|       `files`                     | externalDataDirectory               | 外部ファイル                    |   r/w    |    はい    |    いいえ    |  いいえ   |

* OS このディレクトリを定期的に消去可能性がありますが、この動作に依存しないでください。 アプリケーションの必要に応じてこのディレクトリの内容をオフにします。 ユーザーは手動でキャッシュを削除する必要があります、このディレクトリの内容が削除されます。

* * OS はこのディレクトリは自動的にクリアされません自分でコンテンツを管理するために責任があります。 ユーザは手動でキャッシュを消去する必要があります、ディレクトリの内容が削除されます。

**注**: 外部記憶装置をマウントできない場合、 `cordova.file.external*` プロパティは、`null`.

### ブラックベリー 10 ファイル ・ システム ・ レイアウト

| デバイス ・ パス                                         | `cordova.file.*`            | r/w ですか？ | 永続的なですか？ | OS を消去します | プライベート |
|:------------------------------------------------- |:--------------------------- |:--------:|:--------:|:---------:|:------:|
| `file:///accounts/1000/appdata/< app id >/` | applicationStorageDirectory |    r     |   N/A    |    N/A    |   はい   |
|    `app/native`                                   | ディレクトリ                      |    r     |   N/A    |    N/A    |   はい   |
|    `data/webviews/webfs/temporary/local__0`       | cacheDirectory              |   r/w    |   いいえ    |    はい     |   はい   |
|    `data/webviews/webfs/persistent/local__0`      | dataDirectory               |   r/w    |    はい    |    いいえ    |   はい   |
| `file:///accounts/1000/removable/sdcard`          | externalRemovableDirectory  |   r/w    |    はい    |    いいえ    |  いいえ   |
| `file:///accounts/1000/shared`                    | sharedDirectory             |   r/w    |    はい    |    いいえ    |  いいえ   |

*注*: すべてのパスは/accounts/1000-enterprise 基準に境界を動作するようにアプリケーションを展開するとき。

## Android の癖

### Android の永続的なストレージの場所

Android のデバイスに永続的なファイルを格納する複数の有効な場所があります。 さまざまな可能性について広範な議論のための[このページ][3]を参照してください。

 [3]: http://developer.android.com/guide/topics/data/data-storage.html

以前のバージョンのプラグインは、デバイスの SD カード （または同等のストレージ パーティション） マウントされていたと主張したかどうかに基づいて、起動時に一時と永続的なファイルの場所を選ぶでしょう。 SD カードがマウントされている場合、または大規模な内部ストレージ パーティションが利用可能な場合 (ようネクサス デバイス上） し、永続的なファイルは、その領域のルートに格納されます。 これはすべての Cordova アプリ見ることができる利用可能なファイルのすべてのカードに意味しました。

SD カードがない場合、以前のバージョンがデータを格納する `/data/data/<packageId>` が分離、お互いからアプリがまだ原因をユーザー間で共有されるデータ。

内部ファイルの保存場所やアプリケーションの優先順位以前のロジックを使用してファイルを保存するかどうかを選択することは今 `config.xml` ファイル。 これを行うに、追加する次の 2 行のいずれか `config.xml` :

    <preference name="AndroidPersistentFileLocation" value="Internal" />
    
    <preference name="AndroidPersistentFileLocation" value="Compatibility" />
    

この行がなければファイルのプラグインが使用する `Compatibility` 、デフォルトとして。優先タグが存在し、これらの値の 1 つではない場合、アプリケーションは起動しません。

アプリケーションは、ユーザーに以前出荷されている場合、古い (前 1.0） を使用してこのプラグインのバージョンは、永続的なファイルシステムに保存されているファイルしに優先順位を設定する必要があります `Compatibility` 。 自分のアプリケーションをアップグレードする既存のユーザーを彼らの装置によって、以前に保存されたファイルにアクセスすることができることがあることを意味する「内部」に場所をスイッチングします。

場合は、アプリケーションが新しい、または永続的なファイルシステムにファイルが格納され決して以前し、 `Internal` の設定は一般にお勧めします。

## iOS の癖

*   `cordova.file.applicationStorageDirectory`読み取り専用;ルート ディレクトリ内のファイルを保存しようは失敗します。 他の 1 つを使用して `cordova.file.*` iOS のため定義されているプロパティ (のみ `applicationDirectory` と `applicationStorageDirectory` は読み取り専用)。
*   `FileReader.readAsText(blob, encoding)` 
    *   `encoding`パラメーターはサポートされていませんし、utf-8 エンコーディングが常に有効です。

### iOS の永続的なストレージの場所

IOS デバイスに永続的なファイルを格納する 2 つの有効な場所がある: ドキュメントとライブラリのディレクトリ。 プラグインの以前のバージョンは、唯一のこれまでドキュメント ディレクトリに永続的なファイルを格納されます。 これは、ディレクトリの目的は、輸出のための完全なドキュメントを作成するのではなくなかったがしばしば意図されていたり、特に多数の小さいファイルを処理するアプリケーションの場合、iTunes に表示されているすべてのアプリケーションのファイルを作るの副作用があった。

ドキュメントまたはアプリケーションの優先順位のライブラリ ディレクトリにファイルを保存するかどうかを選択することは今 `config.xml` ファイル。 これを行うに、追加する次の 2 行のいずれか `config.xml` :

    <preference name="iosPersistentFileLocation" value="Library" />
    
    <preference name="iosPersistentFileLocation" value="Compatibility" />
    

この行がなければファイルのプラグインが使用する `Compatibility` 、デフォルトとして。優先タグが存在し、これらの値の 1 つではない場合、アプリケーションは起動しません。

アプリケーションは、ユーザーに以前出荷されている場合、古い (前 1.0） を使用してこのプラグインのバージョンは、永続的なファイルシステムに保存されているファイルしに優先順位を設定する必要があります `Compatibility` 。 スイッチングする場所 `Library` は自分のアプリケーションをアップグレードする既存のユーザーを以前に保存されたファイルにアクセスすることができるだろうことを意味します。

場合は、アプリケーションが新しい、または永続的なファイルシステムにファイルが格納され決して以前し、 `Library` の設定は一般にお勧めします。

## Firefox OS 癖

ファイル システム API Firefox OS でネイティブ サポートされていないと、indexedDB の上にシムとして実装されています。

*   空でないディレクトリを削除するときに失敗しません
*   ディレクトリのメタデータをサポートしていません
*   方法 `copyTo` と `moveTo` ディレクトリをサポートしていません

次のデータ パスがサポートされています： * `applicationDirectory` -を使用して `xhr` アプリケーションと共にパッケージ化されるローカル ファイルを取得します。 * `dataDirectory` - 永続的なアプリケーション固有のデータ ファイル。 * `cacheDirectory` -キャッシュされたアプリの再起動後も維持する必要がありますファイル (アプリはここにファイルを削除する OS に依存しないでください)。

## ノートをアップグレードします。

このプラグインのデベロッパーで、 `FileEntry` と `DirectoryEntry` 構造変更、公開された仕様に沿ったより多くであります。

プラグインの前 (pre 1.0.0) バージョン、デバイス-絶対-ファイルの場所に格納されている、 `fullPath` のプロパティ `Entry` オブジェクト。これらのパスはようになります通常

    /var/mobile/Applications/<application UUID>/Documents/path/to/file  (iOS)
    /storage/emulated/0/path/to/file                                    (Android)
    

これらのパスはまたによって返された、 `toURL()` 法、 `Entry` オブジェクト。

デベロッパーと、 `fullPath` 属性は、 *HTML のファイルシステムのルートに対する相対パス*のファイルへのパス。 したがって、上記のパスは両方によって表される今、 `FileEntry` オブジェクトが、 `fullPath` の

    /path/to/file
    

場合は、アプリケーションはデバイス絶対パスで動作し、以前からそれらのパスを取得、 `fullPath` のプロパティ `Entry` を使用してコードを更新する必要があり、オブジェクト `entry.toURL()` 代わりに。

後方互換性、 `resolveLocalFileSystemURL()` メソッドはデバイス絶対パスを受け入れるし、戻ります、 `Entry` オブジェクトのいずれかの内でそのファイルが存在する限り、それに対応する、 `TEMPORARY` または `PERSISTENT` ファイルシステム。

これは特に以前デバイス絶対パスを使用してファイル転送のプラグインで問題となっている （そしてまだそれらを受け入れることができます）。 ので交換、ファイルシステムの Url で正しく動作するように更新されている `entry.fullPath` と `entry.toURL()` デバイス上のファイルで動作するプラグインを得て問題を解決する必要があります。

V1.1.0 戻り値での `toURL()` が変更された (\[CB-6394\] (https://issues.apache.org/jira/browse/CB-6394) を参照) を絶対的な 'file://' で始まる URL を返します。 可能な限り。 確保するために、' cdvfile:'-使用することができます URL `toInternalURL()` 今。 このメソッドは、フォームのファイルシステムの Url を返します今

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

利用可能なファイルシステムのセットは構成されたプラットフォームをすることができます。IOS と Android の両方を認識します。 <preference> タグの `config.xml` をインストールするファイルシステムの名前します。既定では、すべてのファイル システムのルートが有効になります。

    <preference name="iosExtraFilesystems" value="library,library-nosync,documents,documents-nosync,cache,bundle,root" />
    <preference name="AndroidExtraFilesystems" value="files,files-external,documents,sdcard,cache,cache-external,root" />
    

### アンドロイド

*   `files`: アプリケーション内部のファイル ・ ストレージ ・ ディレクトリ
*   `files-external`: アプリケーションの外部のファイルのストレージ ディレクトリ
*   `sdcard`: グローバル外部ファイル ストレージ ディレクトリ (これは SD カードのルートがインストールされている場合)。 必要があります、 `android.permission.WRITE_EXTERNAL_STORAGE` これを使用するアクセス許可。
*   `cache`: アプリケーションの内部キャッシュ ディレクトリ
*   `cache-external`: アプリケーション ディレクトリ外部キャッシュ
*   `root`： デバイス全体のファイルシステム

アンドロイドを「ファイル」ファイルシステム内の"ドキュメント/"サブディレクトリを表す"ドキュメント"という名前の特殊なファイルシステムもサポートしています。

### iOS

*   `library`: アプリケーションのライブラリ ディレクトリ
*   `documents`: アプリケーションの Documents ディレクトリ
*   `cache`: アプリケーションのキャッシュ ディレクトリ
*   `bundle`: アプリケーションのバンドル。アプリ自体 (読み取りのみ) ディスク上の場所
*   `root`： デバイス全体のファイルシステム

既定では、ライブラリとドキュメント ディレクトリを iCloud に同期できます。 2 つの追加のファイルシステムを要求することもできます `library-nosync` と `documents-nosync` 、内の特別な非同期ディレクトリを表す、 `/Library` または `/Documents` ファイルシステム。