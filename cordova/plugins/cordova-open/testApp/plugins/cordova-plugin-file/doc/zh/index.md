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

# cordova-plugin-file

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

這個外掛程式定義全球 `cordova.file` 物件。

雖然在全球範圍內，它不可用直到 `deviceready` 事件之後。

    document.addEventListener("deviceready", onDeviceReady, false);
    function onDeviceReady() {
        console.log(cordova.file);
    }
    

## 安裝

    cordova plugin add cordova-plugin-file
    

## 支援的平臺

*   亞馬遜火 OS
*   Android 系統
*   黑莓 10
*   火狐瀏覽器的作業系統
*   iOS
*   Windows Phone 7 和 8 *
*   Windows 8 *
*   瀏覽器

* *這些平臺不支援 `FileReader.readAsArrayBuffer` 或 `FileWriter.write(blob)`.*

## 存儲檔的位置

截至 v1.2.0，提供重要的檔案系統目錄的 Url。 每個 URL 位於表單 *file:///path/to/spot/*，和可以轉換為使用 `window.resolveLocalFileSystemURL()` 的 `DirectoryEntry`.

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

雖然技術上實現的細節，它可以是很有必要瞭解如何 `cordova.file.*` 屬性對應到實體路徑在實際設備上。

### iOS 檔案系統佈局

| 設備路徑                            | `cordova.file.*`            | `iosExtraFileSystems` | r/w 嗎？ | 持續性嗎？  |   OS 清除    | 同步  | 私人 |
|:------------------------------- |:--------------------------- |:--------------------- |:------:|:------:|:----------:|:---:|:--:|
| `/ 無功/移動/應用程式/< UUID > /` | applicationStorageDirectory | -                     |   r    |  不適用   |    不適用     | 不適用 | 是啊 |
|    `appname.app/`               | applicationDirectory        | 束                     |   r    |  不適用   |    不適用     | 不適用 | 是啊 |
|       `www/`                    | -                           | -                     |   r    |  不適用   |    不適用     | 不適用 | 是啊 |
|    `Documents/`                 | documentsDirectory          | 檔                     |  r/w   |   是啊   |     無      | 是啊  | 是啊 |
|       `NoCloud/`                | -                           | 檔 nosync              |  r/w   |   是啊   |     無      |  無  | 是啊 |
|    `Library`                    | -                           | 圖書館                   |  r/w   |   是啊   |     無      | 是嗎？ | 是啊 |
|       `NoCloud/`                | dataDirectory               | 圖書館 nosync            |  r/w   |   是啊   |     無      |  無  | 是啊 |
|       `Cloud/`                  | syncedDataDirectory         | -                     |  r/w   |   是啊   |     無      | 是啊  | 是啊 |
|       `Caches/`                 | cacheDirectory              | 快取記憶體                 |  r/w   |  是啊 *  | 是的 * * *| |  無  | 是啊 |
|    `tmp/`                       | tempDirectory               | -                     |  r/w   | 沒有 * * | 是的 * * *| |  無  | 是啊 |

* 檔堅持跨應用程式重新開機和升級，但是每當作業系統的欲望，可以清除此目錄。您的應用程式應該能夠重新創建任何內容可能會被刪除。

* * 檔可能會持續整個應用程式重新開機，但不要依賴此行為。 不保證檔在更新之間持續存在。 您的應用程式時適用，是應該刪除此目錄的檔，因為作業系統並不能保證何時 （或即使） 中刪除這些檔。

* * *| 作業系統可能會清除此目錄的內容，每當它感覺它是必要的但不要依賴于此。 你應該清除此目錄為適合您的應用程式。

### Android 的檔案系統佈局

| 設備路徑                              | `cordova.file.*`                    | `AndroidExtraFileSystems` | r/w 嗎？ | 持續性嗎？ | OS 清除  | 私人 |
|:--------------------------------- |:----------------------------------- |:------------------------- |:------:|:-----:|:------:|:--:|
| `file:///android_asset/`          | applicationDirectory                |                           |   r    |  不適用  |  不適用   | 是啊 |
| `/ 資料資料/< 應用程式 id > /`      | applicationStorageDirectory         | -                         |  r/w   |  不適用  |  不適用   | 是啊 |
|    `cache`                        | cacheDirectory                      | 快取記憶體                     |  r/w   |  是啊   |  是啊 *  | 是啊 |
|    `files`                        | dataDirectory                       | 檔                         |  r/w   |  是啊   |   無    | 是啊 |
|       `Documents`                 |                                     | 檔                         |  r/w   |  是啊   |   無    | 是啊 |
| `< sd 卡 > /`                | externalRootDirectory               | sd 卡                      |  r/w   |  是啊   |   無    | 無  |
|    `Android/data/<app-id>/` | externalApplicationStorageDirectory | -                         |  r/w   |  是啊   |   無    | 無  |
|       `cache`                     | externalCacheDirectry               | 外部快取記憶體                   |  r/w   |  是啊   | 沒有 * * | 無  |
|       `files`                     | externalDataDirectory               | 外部檔                       |  r/w   |  是啊   |   無    | 無  |

* 的作業系統可能會定期清除此目錄中，但不是依賴于這種行為。 清除此為適合您的應用程式的目錄的內容。 使用者應手動清除緩存，將刪除此目錄的內容。

* * 作業系統不會自動清除此目錄你是負責管理自己的內容。 使用者應手動清除緩存，目錄中的內容將被刪除。

**注**： 如果外部存儲無法裝入，`cordova.file.external*` 屬性為 `空`.

### 黑莓 10 檔案系統佈局

| 設備路徑                                                 | `cordova.file.*`            | r/w 嗎？ | 持續性嗎？ | OS 清除 | 私人 |
|:---------------------------------------------------- |:--------------------------- |:------:|:-----:|:-----:|:--:|
| `file:///accounts/1000/appdata/ < 應用程式 id > /` | applicationStorageDirectory |   r    |  不適用  |  不適用  | 是啊 |
|    `app/native`                                      | applicationDirectory        |   r    |  不適用  |  不適用  | 是啊 |
|    `data/webviews/webfs/temporary/local__0`          | cacheDirectory              |  r/w   |   無   |  是啊   | 是啊 |
|    `data/webviews/webfs/persistent/local__0`         | dataDirectory               |  r/w   |  是啊   |   無   | 是啊 |
| `file:///accounts/1000/removable/sdcard`             | externalRemovableDirectory  |  r/w   |  是啊   |   無   | 無  |
| `file:///accounts/1000/shared`                       | sharedDirectory             |  r/w   |  是啊   |   無   | 無  |

*注意*： 當應用程式部署工作週邊時，所有路徑都是相對於 /accounts/1000-enterprise。

## Android 的怪癖

### Android 的持久性存儲位置

有很多有效的位置來存儲持久性檔在 Android 設備上。 請參閱 [此頁面][7] 的各種可能性進行廣泛討論。

 [7]: http://developer.android.com/guide/topics/data/data-storage.html

以前版本的外掛程式會選擇在啟動時，基於該設備是否聲稱 SD 卡 （或等效存儲分區） 展開，臨時和永久檔的位置。 如果被掛載 SD 卡，或一個大的內部存儲分區可用 （如 nexus 系列設備上） 然後持久性檔將存儲在該空間的根目錄中。 這意味著所有的科爾多瓦應用程式可以看到所有可用的檔在卡片上。

如果 SD 卡不是可用的那麼以前的版本中將存儲資料下的 `/data/data/<packageId>`，其中隔離應用程式從彼此，但仍可能導致使用者之間共用的資料。

現在可以選擇是否將檔存儲在內部檔的存儲位置，或使用以前的邏輯，與您的應用程式的 `config.xml` 檔中的偏好。 要執行此操作，請將以下兩行之一添加到 `config.xml`：

    <preference name="AndroidPersistentFileLocation" value="Internal" />
    
    <preference name="AndroidPersistentFileLocation" value="Compatibility" />
    

如果這條線，沒有檔外掛程式將使用 `Compatibility` 作為預設值。如果首選項標記存在，並不是這些值之一，應用程式將無法啟動。

如果您的應用程式以前已被運到使用者，使用較舊的 （預 1.0） 版本的這個外掛程式，並具有持久性的檔，系統中存儲的檔，然後您應該設置 `Compatibility` 偏好。 切換到"Internal"的位置，將意味著現有使用者升級他們的應用程式可能無法訪問他們以前存儲的檔，具體取決於他們的設備。

如果您的應用程式是新的或以前從未有持久性的檔案系統中存儲檔，那麼通常建議使用 `Internal` 設置。

## iOS 的怪癖

*   `cordova.file.applicationStorageDirectory`是唯讀的 ；試圖存儲內的根目錄中的檔將會失敗。 使用的另一個 `cordova.file.*` 為 iOS 定義的屬性 （只有 `applicationDirectory` 和 `applicationStorageDirectory` 都是唯讀）。
*   `FileReader.readAsText(blob, encoding)` 
    *   `encoding`參數不受支援，而 utf-8 編碼總是效果。

### iOS 的持久性存儲位置

有兩個有效的位置來存儲持久性在 iOS 設備上的檔： 檔目錄和圖書館目錄。 以前版本的外掛程式永遠只能將持久性檔存儲在文檔目錄中。 這已經使所有應用程式檔可見在 iTunes，往往是無意為之，尤其是對於處理大量小檔的應用程式中，而不是生產供出口，該目錄的既定的目標是證件齊全的副作用。

現在可以選擇是否將檔存儲在檔或庫目錄，與您的應用程式的 `config.xml` 檔中的偏好。 要執行此操作，請將以下兩行之一添加到 `config.xml`：

    <preference name="iosPersistentFileLocation" value="Library" />
    
    <preference name="iosPersistentFileLocation" value="Compatibility" />
    

如果這條線，沒有檔外掛程式將使用 `Compatibility` 作為預設值。如果首選項標記存在，並不是這些值之一，應用程式將無法啟動。

如果您的應用程式以前已被運到使用者，使用較舊的 （預 1.0） 版本的這個外掛程式，並具有持久性的檔，系統中存儲的檔，然後您應該設置 `Compatibility` 偏好。 切換到 `Library` 的位置，將意味著現有使用者升級他們的應用程式將無法訪問他們以前存儲的檔。

如果您的應用程式是新的或以前從未有持久性的檔案系統中存儲檔，那麼通常建議使用 `Internal` 設置。

## 火狐瀏覽器作業系統的怪癖

檔案系統 API 本身不支援火狐瀏覽器的作業系統，作為墊片在 indexedDB 上實現的。

*   不會失敗時刪除非空的目錄
*   不支援中繼資料的目錄
*   方法 `copyTo` 和 `moveTo` 不支援目錄

支援以下資料路徑： * `applicationDirectory`-使用 `xhr` 獲取與應用程式打包的本地檔。 `dataDirectory`-用於持久性的特定于應用程式的資料檔案。 `cacheDirectory`-生存應重新開機應用程式的快取檔案 （應用程式不應依賴作業系統來刪除檔在這裡）。

## 瀏覽器的怪癖

### 常見的怪癖和備註

*   每個瀏覽器使用其自己的沙箱檔案系統。IE 和火狐瀏覽器使用 IndexedDB 作為一個基地。所有瀏覽器都使用正斜杠作為路徑中的目錄分隔符號。
*   目錄條目不得不先後創建。 例如，調用 `fs.root.getDirectory (' dir1/dir2 '，{create:true}，successCallback，errorCallback）`，如果不存在 dir1 將失敗。
*   外掛程式將請求使用者許可權，以便在應用程式初次開機使用持久性存儲。 
*   外掛程式支援 `cdvfile://localhost` （本地資源） 只。通過 `cdvfile` 不支援外部資源即.
*   該外掛程式不遵循 ["檔案系統 API 8.3 命名限制"][8].
*   Blob 和檔 ' `close` 功能不受支援。
*   `FileSaver` 和 `BlobBuilder` 不支援這個外掛程式，沒有存根 (stub)。
*   該外掛程式不支援 `requestAllFileSystems`。這個功能也是缺少規範中。
*   在目錄中的條目將不會被刪除，如果您使用 `create: true` 標誌為現有目錄。
*   不支援通過建構函式創建的檔。你應該使用 entry.file 方法。
*   每個瀏覽器使用它自己的形式為 blob 的 URL 引用。
*   支援 `readAsDataURL` 功能，但在 Chrome 中的媒體類型取決於輸入副檔名，在 IE 中的媒體類型都始終空著 （這是 `純文字` 按照說明書一樣），在 Firefox 中的媒體類型始終是 `應用程式/八位位元組流`。 例如，如果內容是 `abcdefg` 然後火狐瀏覽器返回 `資料： 應用程式 / 八位位元組流 ； base64，YWJjZGVmZw = =`，即返回 `資料： ； base64，YWJjZGVmZw = =`，鉻返回 `資料： < 媒體類型根據擴展條目名稱 > ； base64，YWJjZGVmZw = =`.
*   在表單 `file:///persistent/path/to/entry` 火狐瀏覽器 IE），`toInternalURL` 返回的路徑。 鉻在表單 `cdvfile://localhost/persistent/file` 返回的路徑.

 [8]: http://www.w3.org/TR/2011/WD-file-system-api-20110419/#naming-restrictions

### 鉻的怪癖

*   設備準備好事件之後，chrome 檔案系統並不能立即準備。作為一種變通方法，您可以訂閱到 `filePluginIsReady` 事件。示例： 

    javascript
    window.addEventListener('filePluginIsReady', function(){ console.log('File plugin is ready');}, false);
    

你可以使用 `window.isFilePluginReadyRaised` 函數來檢查是否已經引發了事件。 -window.requestFileSystem 臨時和永久性檔案系統配額並不局限于鉻。 為增加中鉻的持久性存儲，您需要調用 `window.initPersistentFileSystem` 方法。 預設情況下，持久性存儲配額為 5 MB。 鉻需要 `— — 允許--訪問-從-檔` 通過 `file:///` 協定運行參數對 API 的支援。 -如果您使用標誌，將不更改 `檔` 物件 `{create:true}` 現有 `條目` 的時候。 -事件 `可取消` 屬性設置為 true 在 Chrome 中。 這是違反了 [規範][4]。 -中鉻的 `toURL` 函數返回 `檔案系統：`-首碼路徑具體取決於應用程式主機。 例如，`filesystem:file:///persistent/somefile.txt`，`filesystem:HTTP://localhost:8080/persistent/somefile.txt`。 -`toURL` 函數結果不包含尾部反斜線在目錄條目的情況下。 鉻雖然正確解析目錄帶斜杠落後的 url。 -`resolveLocalFileSystemURL` 方法需要入站的 `url` 必須具有 `檔案系統` 首碼。 例如，`resolveLocalFileSystemURL` 的 `url` 參數應在表單 `filesystem:file:///persistent/somefile.txt` 而不是表單 `file:///persistent/somefile.txt` 在安卓系統。 -不推薦使用 `toNativeURL` 函數不受支援，並且沒有存根 (stub)。 -`setMetadata` 功能是沒有說出的規格，並且不支援。 -INVALID_MODIFICATION_ERR (代碼: 9） 而不是引發 SYNTAX_ERR(code: 8) 上請求一個不存在的檔案系統。 -INVALID_MODIFICATION_ERR (代碼: 9） 而不是引發 PATH_EXISTS_ERR(code: 12) 上嘗試專門創建一個檔或目錄，它已經存在。 -INVALID_MODIFICATION_ERR (代碼: 9） 而不是引發 NO_MODIFICATION_ALLOWED_ERR(code: 6) 在試圖調用 removeRecursively 的根檔案系統上。 -INVALID_MODIFICATION_ERR (代碼: 9） 而不是引發 NOT_FOUND_ERR(code: 1) 試到 moveTo 目錄不存在。

### 基於 IndexedDB 的 impl 怪癖 （Firefox 和 IE）

*   `.` 和 `.` 不受支援。
*   IE 不支援 `file:///`-模式 ；只有託管的模式是支援 （HTTP://localhost:xxxx）。
*   火狐瀏覽器的檔案系統大小不是有限，但每個 50 MB 擴展會要求使用者的許可權。 IE10 允許達 10 mb 的 AppCache 和 IndexedDB 檔案系統的實現中使用而不會提示，一旦你達到這一水準你會詢問您是否允許它增加到每個網站的 250 mb 的最大合併。 所以 `requestFileSystem` 函數的 `大小` 參數並不影響檔案系統相容 Firefox 和 IE。
*   `readAsBinaryString` 函數在規範中沒有注明不支援在 IE 中和沒有存根 (stub)。
*   `file.type` 始終為 null。
*   您不應創建條目使用已刪除的目錄實例回檔結果。否則，你會得到一個 '掛條目'。
*   您可以讀取一個檔，其中只是寫之前你需要獲得的此檔的新實例。
*   `setMetadata` 函數，在規範中沒有注明支援 `modificationTime` 欄位的更改。 
*   `copyTo` 和 `moveTo` 函數不支援目錄。
*   不支援目錄的中繼資料。
*   兩個 Entry.remove 和 directoryEntry.removeRecursively 不失敗時刪除非空的目錄-相反與內容一起清理目錄被刪除。
*   不支援 `abort` 和 `truncate` 函數。
*   進度事件不會觸發。例如，將不執行此處理程式：

    javascript
    writer.onprogress = function() { /*commands*/ };
    

## 升級筆記

在這個外掛程式 v1.0.0，`FileEntry` 和 `DirectoryEntry` 的結構已經改變，以更加一致的已發表說明書。

以前 (pre-1.0.0） 版本的外掛程式中 `輸入` 物件的 `完整路徑` 屬性存放裝置固定檔案位置。這些路徑通常會看起來像

    /var/mobile/Applications/<application UUID>/Documents/path/to/file  (iOS)
    /storage/emulated/0/path/to/file                                    (Android)
    

這些路徑還返回的 `Entry` 物件的 `toURL()` 方法。

與 v1.0.0，`完整路徑` 屬性是到檔中，*相對於 HTML 檔案系統的根目錄* 的路徑。 因此，上述路徑會現在都由一個 `FileEntry` 物件的 `完整路徑`，

    /path/to/file
    

如果您的應用程式與設備-絕對路徑，並且您以前檢索到這些路徑通過 `條目` 物件的 `完整路徑` 屬性，然後您應該更新您的代碼以改用 `entry.toURL()`。

為向後相容性，`resolveLocalFileSystemURL()` 方法將接受一個設備-絕對路徑，並將返回相應的 `條目` 物件，只要在 `臨時` 或 `永久性` 的檔案系統內的檔是否存在。

這尤其是一直與檔案傳輸外掛程式，以前使用設備絕對路徑的問題 (和仍然可以接受他們)。 已更新它能夠正常運行與檔案系統的 Url，所以用 `entry.toURL()` 替換 `entry.fullPath` 應解決任何問題，得到該外掛程式來處理設備上的檔。

在 v1.1.0 `toURL()` 的傳回值被更改 （見 [CB-6394] （HTTPs://issues.apache.org/jira/browse/CB-6394）） 為返回絕對 file:// URL。 只要有可能。 確保 'cdvfile：' — — 你現在可以用 `toInternalURL()` 的 URL。 現在，此方法將返回檔案系統表單的 Url

    cdvfile://localhost/persistent/path/to/file
    

它可以用於唯一地標識該檔。

## 錯誤代碼及其含義的清單中

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

## 配置外掛程式 （可選）

可用的檔案系統的一整套可以配置每個平臺。IOS 和安卓系統認識到 <preference> 在 `config.xml` 名稱要安裝的檔案系統中的標記。預設情況下，啟用所有檔案系統的根。

    <preference name="iosExtraFilesystems" value="library,library-nosync,documents,documents-nosync,cache,bundle,root" />
    <preference name="AndroidExtraFilesystems" value="files,files-external,documents,sdcard,cache,cache-external,root" />
    

### Android 系統

*   `files`： 該應用程式的內部檔存儲目錄
*   `files-external`： 應用程式的外部檔存儲目錄
*   `sdcard`： 全球外部檔存儲目錄 （如果安裝了一個，這是 SD 卡的根目錄）。 你必須具有 `android.permission.WRITE_EXTERNAL_STORAGE` 許可權，用這個。
*   `cache`： 應用程式的內部緩存目錄
*   `cache-external`： 應用程式的外部快取記憶體目錄
*   `root`： 整個設備的檔案系統

安卓系統還支援特殊的檔命名為"檔"，表示"/ 檔 /""檔"的檔案系統中的子目錄。

### iOS

*   `library`： 應用程式的庫目錄
*   `documents`： 應用程式的檔目錄
*   `cache`： 應用程式的緩存目錄
*   `bundle`： 應用程式的包 ；應用程式本身 （唯讀） 的磁片上的位置
*   `root`： 整個設備的檔案系統

預設情況下，圖書館和檔目錄可以同步到 iCloud。 您也可以要求兩個額外的檔案系統、 `library-nosync` 和 `documents-nosync`，代表一個特殊的非同步目錄內 `/Library` 或 `/Documents` 的檔案系統。
