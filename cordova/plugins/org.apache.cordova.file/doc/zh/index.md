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

這個外掛程式實現檔 API 允許對檔駐留在該設備上的讀/寫訪問。

這個外掛程式基於幾個規格，包括： HTML5 檔 API [HTTP://www.w3.org/TR/FileAPI/][1]

 [1]: http://www.w3.org/TR/FileAPI/

（現已解散） 目錄和系統擴展最新： [HTTP://www.w3.org/TR/2012/WD-file-system-api-20120417/][2]雖然大部分的外掛程式代碼寫時較早的規格是當前： [HTTP://www.w3.org/TR/2011/WD-file-system-api-20110419/][3]

 [2]: http://www.w3.org/TR/2012/WD-file-system-api-20120417/
 [3]: http://www.w3.org/TR/2011/WD-file-system-api-20110419/

它還實現 FileWriter 規格： [HTTP://dev.w3.org/2009/dap/file-system/file-writer.html][4]

 [4]: http://dev.w3.org/2009/dap/file-system/file-writer.html

用法，請參閱對 HTML5 的岩石優秀[檔案系統文章。][5]

 [5]: http://www.html5rocks.com/en/tutorials/file/filesystem/

其他存儲選項的概述，請參閱科爾多瓦的[存儲指南][6].

 [6]: http://cordova.apache.org/docs/en/edge/cordova_storage_storage.md.html

## 安裝

    cordova plugin add org.apache.cordova.file
    

## 支援的平臺

*   亞馬遜火 OS
*   Android 系統
*   黑莓 10
*   火狐瀏覽器的作業系統
*   iOS
*   Windows Phone 7 和 8 *
*   Windows 8 *

**這些平臺不支援 `FileReader.readAsArrayBuffer` ，也不 `FileWriter.write(blob)` .*

## 存儲檔的位置

自 v1.2.0，提供重要的檔案系統目錄的 Url。 每個 URL 是在表單*file:///path/to/spot/*，和可以轉換為 `DirectoryEntry` 使用`window.resolveLocalFileSystemURL()`.

*   `cordova.file.applicationDirectory`-唯讀目錄在哪裡安裝的應用程式。（*iOS*、*安卓*、*黑莓 10*)

*   `cordova.file.applicationStorageDirectory`-根目錄下的應用程式的沙箱 ；在 iOS 上此位置是唯讀 （但特定的子目錄 [像 `/Documents` ] 都是讀寫）。 中包含的所有資料都是私有的應用程式。 （ *iOS*、*安卓*、*黑莓 10*)

*   `cordova.file.dataDirectory`資料持久性和私有資料存儲在內部記憶體使用的應用程式的沙箱內 （在安卓系統，如果你需要使用外部儲存體，使用 `.externalDataDirectory` ）。 在 iOS，此目錄不與 iCloud 同步 （使用 `.syncedDataDirectory` ）。 （*iOS*、*安卓*、*黑莓 10*)

*   `cordova.file.cacheDirectory`-緩存的資料檔案或您的應用程式重新可以輕鬆地創建的任何檔的目錄。 作業系統可能會刪除這些檔，該設備在存儲上運行低時，然而，應用程式不應依賴的作業系統，請刪除檔在這裡。 （*iOS*、*安卓*、*黑莓 10*)

*   `cordova.file.externalApplicationStorageDirectory`-應用程式外部存儲上的空間。（*安卓*)

*   `cordova.file.externalDataDirectory`-放在外部存儲特定于應用程式的資料檔案的位置。（*安卓*)

*   `cordova.file.externalCacheDirectory`-在外部存儲應用程式緩存。（*安卓*)

*   `cordova.file.externalRootDirectory`-外部存儲 （SD 卡） 的根。（*安卓*、*黑莓 10*)

*   `cordova.file.tempDirectory`-OS 可以清除時的空目錄會。 不依賴于 OS，以清除此目錄 ；您的應用程式，應總是移除作為適用的檔。 （*iOS*)

*   `cordova.file.syncedDataDirectory`-保存應同步 （例如到 iCloud） 的特定于應用程式的檔。（*iOS*)

*   `cordova.file.documentsDirectory`-檔私有的應用程式，但這是對其他應用程式 （例如 Office 檔） 有意義。（*iOS*)

*   `cordova.file.sharedDirectory`-對所有應用程式 （*黑莓 10*全域可用的檔)

## 檔案系統佈局

雖然技術上的實現細節，它可以是非常有用，要知道如何 `cordova.file.*` 屬性對應到真正的設備上的實體路徑。

### iOS 檔案系統佈局

| 設備路徑                            | `cordova.file.*`            | `iosExtraFileSystems` | r/w 嗎？ | 持續性嗎？  |   OS 清除    | 同步  | 私人 |
|:------------------------------- |:--------------------------- |:--------------------- |:------:|:------:|:----------:|:---:|:--:|
| `/ 無功/移動/應用程式/< UUID > /` | applicationStorageDirectory | -                     |  r/o   |  不適用   |    不適用     | 不適用 | 是啊 |
|    `appname.app/`               | applicationDirectory        | 束                     |  r/o   |  不適用   |    不適用     | 不適用 | 是啊 |
|       `www/`                    | -                           | -                     |  r/o   |  不適用   |    不適用     | 不適用 | 是啊 |
|    `Documents/`                 | documentsDirectory          | 檔                     |  r/w   |   是啊   |     無      | 是啊  | 是啊 |
|       `NoCloud/`                | -                           | 檔 nosync              |  r/w   |   是啊   |     無      |  無  | 是啊 |
|    `Library`                    | -                           | 圖書館                   |  r/w   |   是啊   |     無      | 是嗎？ | 是啊 |
|       `NoCloud/`                | dataDirectory               | 圖書館 nosync            |  r/w   |   是啊   |     無      |  無  | 是啊 |
|       `Cloud/`                  | syncedDataDirectory         | -                     |  r/w   |   是啊   |     無      | 是啊  | 是啊 |
|       `Caches/`                 | cacheDirectory              | 快取記憶體                 |  r/w   |  是啊 *  | 是的 \* * *| |  無  | 是啊 |
|    `tmp/`                       | tempDirectory               | -                     |  r/w   | 沒有 * * | 是的 \* * *| |  無  | 是啊 |

* 檔堅持跨應用程式重新開機和升級，但是每當 OS 的欲望，可以清除此目錄。您的應用程式應該能夠重新創建任何內容可能會被刪除。

* * 檔可能會持續整個應用程式重新開機，但不是依賴于這種行為。 不保證檔在更新之間持續存在。 您的應用程式應該從這個目錄刪除檔，在適當的時候，作為作業系統並不能保證時 （或即使） 中刪除這些檔。

\* * *| OS 可能會清除此目錄的內容，每當它感覺它是必要的但不是依賴于此。 你應該清除此目錄為適合您的應用程式。

### Android 的檔案系統佈局

| 設備路徑                              | `cordova.file.*`                    | `AndroidExtraFileSystems` | r/w 嗎？ | 持續性嗎？ | OS 清除  | 私人 |
|:--------------------------------- |:----------------------------------- |:------------------------- |:------:|:-----:|:------:|:--:|
| `file:///android_asset/`          | applicationDirectory                |                           |  r/o   |  不適用  |  不適用   | 是啊 |
| `/ 資料資料/< 應用程式 id > /`      | applicationStorageDirectory         | -                         |  r/w   |  不適用  |  不適用   | 是啊 |
|    `cache`                        | cacheDirectory                      | 快取記憶體                     |  r/w   |  是啊   |  是啊 *  | 是啊 |
|    `files`                        | dataDirectory                       | 檔                         |  r/w   |  是啊   |   無    | 是啊 |
|       `Documents`                 |                                     | 檔                         |  r/w   |  是啊   |   無    | 是啊 |
| `< sd 卡 > /`                | externalRootDirectory               | sd 卡                      |  r/w   |  是啊   |   無    | 無  |
|    `Android/data/<app-id>/` | externalApplicationStorageDirectory | -                         |  r/w   |  是啊   |   無    | 無  |
|       `cache`                     | externalCacheDirectry               | 外部快取記憶體                   |  r/w   |  是啊   | 沒有 * * | 無  |
|       `files`                     | externalDataDirectory               | 外部檔                       |  r/w   |  是啊   |   無    | 無  |

* 的作業系統可能會定期清除此目錄中，但不是依賴于這種行為。 清除此為適合您的應用程式目錄中的內容。 使用者應手動清除緩存中，這個目錄中的內容將被刪除。

* * OS 不會清除此目錄自動 ；你是負責管理你自己的內容。 使用者應手動清除緩存中，目錄中的內容將被刪除。

**注意**： 如果不能裝載外部存儲， `cordova.file.external*` 屬性是`null`.

### 黑莓 10 檔案系統佈局

| 設備路徑                                                 | `cordova.file.*`            | r/w 嗎？ | 持續性嗎？ | OS 清除 | 私人 |
|:---------------------------------------------------- |:--------------------------- |:------:|:-----:|:-----:|:--:|
| `file:///accounts/1000/appdata/ < 應用程式 id > /` | applicationStorageDirectory |  r/o   |  不適用  |  不適用  | 是啊 |
|    `app/native`                                      | applicationDirectory        |  r/o   |  不適用  |  不適用  | 是啊 |
|    `data/webviews/webfs/temporary/local__0`          | cacheDirectory              |  r/w   |   無   |  是啊   | 是啊 |
|    `data/webviews/webfs/persistent/local__0`         | dataDirectory               |  r/w   |  是啊   |   無   | 是啊 |
| `file:///accounts/1000/removable/sdcard`             | externalRemovableDirectory  |  r/w   |  是啊   |   無   | 無  |
| `file:///accounts/1000/shared`                       | sharedDirectory             |  r/w   |  是啊   |   無   | 無  |

*注意*： 當應用程式部署工作週邊時，所有路徑都是相對於 /accounts/1000-enterprise。

## Android 的怪癖

### Android 的持久性存儲位置

有很多有效的位置來存儲持久性檔在 Android 設備上。 請參閱[此頁][7]為廣泛地討論的各種可能性。

 [7]: http://developer.android.com/guide/topics/data/data-storage.html

以前版本的外掛程式會選擇在啟動時，基於該設備是否聲稱 SD 卡 （或等效存儲分區） 展開，臨時和永久檔的位置。 如果被掛載 SD 卡，或者如果一個大的內部存儲分區是可用 （如 Nexus 設備上） 然後持久性檔將存儲在該空間的根目錄中。 這就意味著所有的科爾多瓦應用程式可以看到所有可用的檔在卡上。

如果 SD 卡不是可用的那麼以前的版本中將存儲資料下的 `/data/data/<packageId>` ，其中隔離應用程式從彼此，但仍可能導致使用者之間共用的資料。

現在可以選擇是否將檔存儲在內部檔存儲位置，或使用以前的邏輯，在您的應用程式的偏好與 `config.xml` 檔。 要做到這一點，添加到這兩條線之一 `config.xml` ：

    <preference name="AndroidPersistentFileLocation" value="Internal" />
    
    <preference name="AndroidPersistentFileLocation" value="Compatibility" />
    

如果這條線，沒有檔外掛程式將使用 `Compatibility` 作為預設值。如果偏好的標記是存在的並不是這些值之一，應用程式將無法啟動。

如果您的應用程式先前已經運送到使用者，使用較舊的 （預 1.0） 的這個外掛程式，版本和已存儲的檔中的持久性的檔案系統，然後您應該將首選項設置為 `Compatibility` 。 切換到"內部"的位置就意味著現有使用者升級他們的應用程式可能無法訪問他們以前存儲的檔，他們的設備。

如果您的應用程式是新的或有以前從未存儲檔在持久性的檔案系統，然後 `Internal` 一般建議設置。

## iOS 的怪癖

*   `cordova.file.applicationStorageDirectory`是唯讀的 ；試圖存儲內的根目錄中的檔將會失敗。 使用的另一個 `cordova.file.*` 為 iOS 定義的屬性 （只有 `applicationDirectory` 和 `applicationStorageDirectory` 都是唯讀）。
*   `FileReader.readAsText(blob, encoding)` 
    *   `encoding`參數不受支援，而 utf-8 編碼總是效果。

### iOS 的持久性存儲位置

有兩個有效的位置來存儲持久性的 iOS 設備上的檔： 檔目錄和庫目錄。 以前版本的外掛程式永遠只能存儲持久性檔在檔目錄中。 這有副作用 — — 使所有的應用程式的檔可見在 iTunes 中，往往是意料之外，尤其是對於處理大量小檔的應用程式，而不是生產用於出口，是意欲的目的的目錄的完整文檔。

現在可以選擇是否將檔存儲在檔或庫目錄，在您的應用程式的偏好與 `config.xml` 檔。 要做到這一點，添加到這兩條線之一 `config.xml` ：

    <preference name="iosPersistentFileLocation" value="Library" />
    
    <preference name="iosPersistentFileLocation" value="Compatibility" />
    

如果這條線，沒有檔外掛程式將使用 `Compatibility` 作為預設值。如果偏好的標記是存在的並不是這些值之一，應用程式將無法啟動。

如果您的應用程式先前已經運送到使用者，使用較舊的 （預 1.0） 的這個外掛程式，版本和已存儲的檔中的持久性的檔案系統，然後您應該將首選項設置為 `Compatibility` 。 切換到的位置 `Library` 意味著現有使用者升級他們的應用程式將無法訪問他們以前存儲的檔。

如果您的應用程式是新的或有以前從未存儲檔在持久性的檔案系統，然後 `Library` 一般建議設置。

## 火狐瀏覽器作業系統的怪癖

檔案系統 API 本身不支援通過 Firefox OS，作為墊片在 indexedDB 上實現的。

*   不會失敗時刪除非空的目錄
*   不支援中繼資料的目錄
*   方法 `copyTo` 和 `moveTo` 不支援目錄

支援以下資料路徑： * `applicationDirectory` -使用 `xhr` 來獲得與該應用程式打包的本地檔。 * `dataDirectory` -為持久性的特定于應用程式的資料檔案。 * `cacheDirectory` -緩存的檔應該生存重新開機應用程式 （應用程式不應依賴的作業系統，請刪除檔在這裡）。

## 升級筆記

在這個外掛程式，v1.0.0 `FileEntry` 和 `DirectoryEntry` 結構已經改變，更符合已發佈的規範。

以前 (pre-1.0.0） 版本的外掛程式存放裝置固定檔案位置在 `fullPath` 屬性的 `Entry` 物件。這些路徑通常會看起來像

    /var/mobile/Applications/<application UUID>/Documents/path/to/file  (iOS)
    /storage/emulated/0/path/to/file                                    (Android)
    

這些路徑還返回的 `toURL()` 方法的 `Entry` 物件。

與 v1.0.0， `fullPath` 的屬性是檔，*相對於 HTML 檔案系統的根目錄*的路徑。 所以，上面的路徑會現在都由代表 `FileEntry` 物件與 `fullPath` 的

    /path/to/file
    

如果您的應用程式與設備-絕對路徑，和你以前檢索到這些路徑通過 `fullPath` 屬性的 `Entry` 物件，然後您應該更新代碼以使用 `entry.toURL()` 相反。

為向後相容性， `resolveLocalFileSystemURL()` 方法將接受設備-絕對路徑，並將返回 `Entry` 對應于它，只要該檔存在內任一物件 `TEMPORARY` 或 `PERSISTENT` 的檔案系統。

這特別是一直與檔案傳輸外掛程式，以前使用過的設備-絕對路徑的問題 (和仍然可以接受他們)。 它已更新正常工作與檔案系統的 Url，所以更換 `entry.fullPath` 與 `entry.toURL()` 應解決獲取該外掛程式來處理檔在設備上的任何問題。

V1.1.0 的傳回值中的 `toURL()` 被更改 （見 [CB-6394] （HTTPs://issues.apache.org/jira/browse/CB-6394）） 為返回一個絕對 file:// URL。 只要有可能。 以確保 ' cdvfile:'-您可以使用的 URL `toInternalURL()` 現在。 現在，此方法將返回檔案系統的表單的 Url

    cdvfile://localhost/persistent/path/to/file
    

它可以用於唯一地標識該檔。

## 錯誤代碼和含義的清單

當拋出一個錯誤時，將使用以下代碼之一。

| 代碼 | 恒                             |
| --:|:----------------------------- |
|  1 | `NOT_FOUND_ERR`               |
|  2 | `SECURITY_ERR`                |
|  3 | `ABORT_ERR`                   |
|  4 | `NOT_READABLE_ERR`            |
|  5 | `ENCODING_ERR`                |
|  6 | `NO_MODIFICATION_ALLOWED_ERR` |
|  7 | `INVALID_STATE_ERR`           |
|  8 | `SYNTAX_ERR`                  |
|  9 | `INVALID_MODIFICATION_ERR`    |
| 10 | `QUOTA_EXCEEDED_ERR`          |
| 11 | `TYPE_MISMATCH_ERR`           |
| 12 | `PATH_EXISTS_ERR`             |

## 配置的外掛程式 （可選）

可用的檔案系統的一整套可以配置每個平臺。IOS 和安卓系統識別 <preference> 在標記 `config.xml` 哪一個名字要安裝的檔案系統。預設情況下，啟用所有檔案系統的根。

    <preference name="iosExtraFilesystems" value="library,library-nosync,documents,documents-nosync,cache,bundle,root" />
    <preference name="AndroidExtraFilesystems" value="files,files-external,documents,sdcard,cache,cache-external,root" />
    

### 安卓系統

*   `files`： 應用程式的內部檔存儲目錄
*   `files-external`： 應用程式的外部檔存儲目錄
*   `sdcard`： （這是根的 SD 卡，如果其中一個安裝） 全球外部檔存儲目錄。 您必須具有 `android.permission.WRITE_EXTERNAL_STORAGE` 使用此許可權。
*   `cache`： 應用程式的內部緩存目錄
*   `cache-external`： 應用程式的外部快取記憶體目錄
*   `root`： 整個設備的檔案系統

安卓系統還支援一個特別的檔案系統命名為"檔"，它代表"檔"的檔案系統中的子目錄"/ 檔 /"。

### iOS

*   `library`： 應用程式的庫目錄
*   `documents`： 應用程式的檔目錄
*   `cache`： 應用程式的緩存目錄
*   `bundle`： 應用程式的包 ；應用程式本身 （唯讀） 的磁片上的位置
*   `root`： 整個設備的檔案系統

預設情況下，圖書館和檔目錄可以同步到 iCloud。 您也可以要求兩個額外的檔案系統， `library-nosync` 和 `documents-nosync` ，它代表一個特殊的非同步目錄內 `/Library` 或 `/Documents` 檔案系統。