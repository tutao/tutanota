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

# org.apache.cordova.contacts

提供對設備的連絡人資料庫的訪問。

**警告**： 連絡人資料的收集和使用提出了重要的隱私問題。 您的應用程式的隱私權原則應該討論如何應用程式使用的連絡人資料和它是否被共用與任何其他方。 聯繫資訊被視為敏感，因為它揭示了人與人通信的人們。 因此，除了應用程式的隱私權原則，您應強烈考慮提供-時間通知之前應用程式訪問或使用的連絡人資料，如果設備作業系統不會這樣做已經。 該通知應提供相同的資訊上文指出的並獲取該使用者的許可權 （例如，通過為**確定**並**不感謝**提出的選擇）。 請注意一些應用程式市場可能需要應用程式來提供只是在時間的通知，並獲得相應許可權的使用者在訪問連絡人資料之前。 周圍的連絡人資料可説明避免使用者混淆使用感知的和濫用的連絡人資料的清晰和易於理解的使用者體驗。 有關詳細資訊，請參閱隱私指南。

## 安裝

    cordova plugin add org.apache.cordova.contacts
    

### 火狐瀏覽器作業系統的怪癖

在[清單檔][1]中所述創建**www/manifest.webapp** 。 添加相關許可權。 也是需要 web 應用程式的類型更改為"特權"-[清單文檔][2]。 **警告**： 所有特權應用程式強制執行禁止內聯腳本的[內容安全性原則][3]。 在另一種方式初始化應用程式。

 [1]: https://developer.mozilla.org/en-US/Apps/Developing/Manifest
 [2]: https://developer.mozilla.org/en-US/Apps/Developing/Manifest#type
 [3]: https://developer.mozilla.org/en-US/Apps/CSP

    "type": "privileged",
    "permissions": {
        "contacts": {
            "access": "readwrite",
            "description": "Describe why there is a need for such permission"
        }
    }
    

### Windows 的怪癖

從返回的任何連絡人 `find` 和 `pickContact` 方法是唯讀，因此您的應用程式不能修改它們。 `find`僅在 Windows Phone 8.1 設備上可用的方法。

### Windows 8 的怪癖

Windows 8 連絡人是唯讀的。 透過科爾多瓦 API 接觸的不是可查詢/搜索，你應通知使用者挑選連絡人作為對 contacts.pickContact 這將打開的 '人' 應用程式的調用，使用者必須選擇一個連絡人。 返回任何連絡人是唯讀，因此您的應用程式不能修改它們。

## navigator.contacts

### 方法

*   navigator.contacts.create
*   navigator.contacts.find
*   navigator.contacts.pickContact

### 物件

*   連絡人
*   連絡人姓名
*   ContactField
*   ContactAddress
*   ContactOrganization
*   ContactFindOptions
*   ContactError
*   ContactFieldType

## navigator.contacts.create

`navigator.contacts.create`方法是同步的並返回一個新的 `Contact` 物件。

這種方法不會保留在設備的連絡人資料庫中，您需要為其調用該連絡人物件 `Contact.save` 的方法。

### 支援的平臺

*   Android 系統
*   黑莓 10
*   火狐瀏覽器作業系統
*   iOS
*   Windows Phone 7 和 8

### 示例

    var myContact = navigator.contacts.create({"displayName": "Test User"});
    

## navigator.contacts.find

`navigator.contacts.find`方法以非同步方式，執行設備的連絡人資料庫查詢並返回一個陣列的 `Contact` 物件。 生成的物件被傳遞給 `contactSuccess` 的**contactSuccess**參數所指定的回呼函數。

**ContactFields**參數指定的欄位用作搜索的限定詞。 一個長度為零的**contactFields**參數是不正確結果在 `ContactError.INVALID_ARGUMENT_ERROR` 。 **ContactFields**值為 `"*"` 返回所有連絡人欄位。

**ContactFindOptions.filter**字串查詢連絡人資料庫時，可以用作搜索篩選器。 如果提供，不區分大小寫，部分值匹配被應用於在**contactFields**參數中指定的每個欄位。 如果有*任何*指定的欄位的匹配，則返回該連絡人。 使用**contactFindOptions.desiredFields**參數來控制哪些連絡人屬性必須回來。

### 參數

*   **contactSuccess**： 從資料庫返回成功回呼函數調用時使用的連絡人物件的陣列。[要求]

*   **contactError**： 錯誤回呼函數，當發生錯誤時調用。[可選]

*   **contactFields**： 連絡人欄位使用作為搜索的限定詞。*(DOMString[])*[要求]

*   **contactFindOptions**: 搜索選項來篩選 navigator.contacts。[可選]鍵包括：

*   **篩選器**： 用來查找 navigator.contacts 的搜索字串。*() DOMString*（預設值：`""`)

*   **多個**： 確定是否查找操作返回多個 navigator.contacts。*（布林）*（預設值：`false`)
    
    *   **desiredFields**: 聯繫要回返回的欄位。如果指定了，生成的 `Contact` 物件只能使用這些欄位的值。*(DOMString[])*[可選]

### 支援的平臺

*   Android 系統
*   黑莓 10
*   火狐瀏覽器作業系統
*   iOS
*   Windows Phone 7 和 8
*   Windows （僅適用于 Windows Phone 8.1 設備）

### 示例

    function onSuccess(contacts) {
        alert('Found ' + contacts.length + ' contacts.');
    };
    
    function onError(contactError) {
        alert('onError!');
    };
    
    // find all contacts with 'Bob' in any name field
    var options      = new ContactFindOptions();
    options.filter   = "Bob";
    options.multiple = true;
    options.desiredFields = [navigator.contacts.fieldType.id];
    var fields       = [navigator.contacts.fieldType.displayName, navigator.contacts.fieldType.name];
    navigator.contacts.find(fields, onSuccess, onError, options);
    

### Windows 的怪癖

*   `__contactFields__`不受支援，將被忽略。`find`方法將始終嘗試匹配名稱、 電子郵件地址或電話號碼的連絡人。

## navigator.contacts.pickContact

`navigator.contacts.pickContact`方法啟動連絡人選擇器來選擇一個連絡人。 所產生的物件傳遞給 `contactSuccess` 的**contactSuccess**參數所指定的回呼函數。

### 參數

*   **contactSuccess**： 成功使用單個連絡人物件調用的回呼函數。[要求]

*   **contactError**： 錯誤回呼函數，當發生錯誤時調用。[可選]

### 支援的平臺

*   安卓系統
*   iOS
*   Windows Phone 8
*   Windows 8
*   Windows

### 示例

    navigator.contacts.pickContact(function(contact){
            console.log('The following contact has been selected:' + JSON.stringify(contact));
        },function(err){
            console.log('Error: ' + err);
        });
    

## 連絡人

`Contact`物件表示使用者的連絡人。 連絡人可以創建、 存儲，或從設備的連絡人資料庫中刪除。 連絡人可以也被 (單獨或批量） 從資料庫中檢索通過調用 `navigator.contacts.find` 方法。

**注意**： 並不是所有上面列出的連絡人欄位平臺支援的每個設備。請檢查每個平臺*的怪癖*節瞭解詳細資訊。

### 屬性

*   **id**： 一個全域唯一識別碼。*() DOMString*

*   **顯示名稱**： 此連絡人，適合於向最終使用者顯示的名稱。*() DOMString*

*   **名稱**： 一個物件，包含所有元件的一個人的名字。*（連絡人姓名）*

*   **昵稱**： 休閒的位址連絡人名稱。*() DOMString*

*   **手機號碼**： 陣列的所有連絡人的電話號碼。*(ContactField[])*

*   **電子郵件**： 所有連絡人的電子郵件地址的陣列。*(ContactField[])*

*   **位址**： 該連絡人的所有位址的陣列。*(ContactAddress[])*

*   **ims**： 所有連絡人的 IM 位址的陣列。*(ContactField[])*

*   **組織**： 該連絡人的所有組織的陣列。*(ContactOrganization[])*

*   **生日**： 連絡人的生日。*（日期）*

*   **注意**： 注意有關的聯繫。*() DOMString*

*   **照片**： 陣列的連絡人的照片。*(ContactField[])*

*   **類別**： 陣列與連絡人關聯的所有使用者定義的類別。*(ContactField[])*

*   **url**： 陣列與連絡人關聯的 web 頁。*(ContactField[])*

### 方法

*   **克隆**： 返回一個新的 `Contact` 物件就是調用物件的深層副本 `id` 屬性設置為`null`.

*   **刪除**： 從設備的連絡人資料庫中刪除連絡人，否則執行錯誤回檔與 `ContactError` 物件。

*   **保存**： 將一個新的連絡人保存到設備的連絡人資料庫中，或更新現有的連絡人，如果已存在具有相同**id**的連絡人。

### 支援的平臺

*   亞馬遜火 OS
*   安卓系統
*   黑莓 10
*   火狐瀏覽器的作業系統
*   iOS
*   Windows Phone 7 和 8
*   Windows 8
*   Windows

### 保存示例

    function onSuccess(contact) {
        alert("Save Success");
    };
    
    function onError(contactError) {
        alert("Error = " + contactError.code);
    };
    
    // create a new contact object
    var contact = navigator.contacts.create();
    contact.displayName = "Plumber";
    contact.nickname = "Plumber";            // specify both to support all devices
    
    // populate some fields
    var name = new ContactName();
    name.givenName = "Jane";
    name.familyName = "Doe";
    contact.name = name;
    
    // save to device
    contact.save(onSuccess,onError);
    

### 克隆示例

        // clone the contact object
        var clone = contact.clone();
        clone.name.givenName = "John";
        console.log("Original contact name = " + contact.name.givenName);
        console.log("Cloned contact name = " + clone.name.givenName);
    

### 刪除示例

    function onSuccess() {
        alert("Removal Success");
    };
    
    function onError(contactError) {
        alert("Error = " + contactError.code);
    };
    
    // remove the contact from the device
    contact.remove(onSuccess,onError);
    

### Android 2.X 的怪癖

*   **類別**： 不支援 Android 2.X 在設備上，返回`null`.

### 黑莓 10 的怪癖

*   **id**： 由該設備分配時保存該連絡人。

### FirefoxOS 的怪癖

*   **類別**： 部分支援。返回欄位**設定**和**類型**`null`

*   **ims**： 不支援

*   **照片**： 不支援

### iOS 的怪癖

*   **顯示名稱**： 上返回的 iOS 不支援 `null` 除非有沒有 `ContactName` 指定，在這種情況下它將返回複合名稱，**昵稱**或 `""` ，分別。

*   **生日**： 必須輸入 JavaScript 作為 `Date` 物件，它將返回相同的方式。

*   **照片**： 返回到圖像中，存儲在應用程式的臨時目錄中檔的 URL。當應用程式退出時刪除臨時目錄的內容。

*   **類別**： 目前不支援此屬性，返回`null`.

### Windows Phone 7 和 8 的怪癖

*   **顯示名稱**： 當創建一個連絡人，提供的顯示名稱參數不同于顯示名稱的值檢索查找連絡人時。

*   **url**： 當創建一個連絡人，使用者可以輸入和保存多個 web 位址，但只有一個是可用的搜索連絡人時。

*   **聯繫電話嘛**：*究竟*選項不受支援。 在*查找*操作中不是支援的*類型*。 只有一個 `phoneNumber` 允許的每個*類型*.

*   **電子郵件**：*究竟*選項不受支援。家庭和個人使用引用同一電子郵件項。只有一項是允許的每個*類型*.

*   **位址**： 僅支援的工作和家庭/個人*類型*。家庭和個人*類型*引用相同的位址條目。只有一項是允許的每個*類型*.

*   **組織**： 唯一一個允許的和不支援的*那個 + 號*、*類型*和*部門*的屬性。

*   **注意**： 不支援，返回`null`.

*   **ims**： 不受支援，返回`null`.

*   **生日**: 不受支援，返回`null`.

*   **類別**： 不受支援，返回`null`.

### Windows 的怪癖

*   **照片**： 返回到圖像中，存儲在應用程式的臨時目錄中檔的 URL。

*   **生日**: 不受支援，返回`null`.

*   **類別**： 不受支援，返回`null`.

## ContactAddress

`ContactAddress`物件存儲的單一位址的連絡人的屬性。 A `Contact` 物件可能包括多個位址在 `ContactAddress[]` 陣列。

### 屬性

*   **那個 + 號**： 設置為 `true` 如果這個 `ContactAddress` 包含使用者的首選的價值。*（布林）*

*   **類型**： 一個字串，例如指示哪種類型的欄位，這是*回家*。*() DOMString*

*   **格式**： 顯示格式的完整位址。*() DOMString*

*   **streetAddress**： 完整的街道位址。*() DOMString*

*   **地點**： 城市或地點。*() DOMString*

*   **區域**： 國家或地區。*() DOMString*

*   **郵遞區號**： 郵遞區號。*() DOMString*

*   **國家**： 國家名稱。*() DOMString*

### 支援的平臺

*   亞馬遜火 OS
*   安卓系統
*   黑莓 10
*   火狐瀏覽器的作業系統
*   iOS
*   Windows Phone 7 和 8
*   Windows 8
*   Windows

### 示例

    // display the address information for all contacts
    
    function onSuccess(contacts) {
        for (var i = 0; i < contacts.length; i++) {
            for (var j = 0; j < contacts[i].addresses.length; j++) {
                alert("Pref: "         + contacts[i].addresses[j].pref          + "\n" +
                    "Type: "           + contacts[i].addresses[j].type          + "\n" +
                    "Formatted: "      + contacts[i].addresses[j].formatted     + "\n" +
                    "Street Address: " + contacts[i].addresses[j].streetAddress + "\n" +
                    "Locality: "       + contacts[i].addresses[j].locality      + "\n" +
                    "Region: "         + contacts[i].addresses[j].region        + "\n" +
                    "Postal Code: "    + contacts[i].addresses[j].postalCode    + "\n" +
                    "Country: "        + contacts[i].addresses[j].country);
            }
        }
    };
    
    function onError(contactError) {
        alert('onError!');
    };
    
    // find all contacts
    var options = new ContactFindOptions();
    options.filter = "";
    var filter = ["displayName", "addresses"];
    navigator.contacts.find(filter, onSuccess, onError, options);
    

### Android 2.X 的怪癖

*   **究竟**: 不受支援，返回 `false` Android 2.X 的設備上。

### 黑莓 10 的怪癖

*   **設定**： 在返回的黑莓設備上不支援`false`.

*   **類型**： 部分支援。只有一個*工作*和*家裡*類型位址可以存儲每個連絡人。

*   **格式化**： 部分支援。返回的串聯的所有黑莓手機位址欄位。

*   **streetAddress**： 支援。返回和串聯組成的黑莓**位址 1** **位址 2**位址欄位。

*   **所在地**： 支援。黑莓手機**城**位址欄位中存儲。

*   **區域**： 支援。黑莓**stateProvince**位址欄位中存儲。

*   **郵遞區號**： 支援。黑莓**zipPostal**位址欄位中存儲。

*   **國家**： 支援。

### FirefoxOS 的怪癖

*   **格式化**： 目前不支援

### iOS 的怪癖

*   **那個 + 號**： 不支援在 iOS 設備上，返回`false`.

*   **格式化**： 目前不支援。

### Windows 8 的怪癖

*   **那個 + 號**： 不支援

### Windows 的怪癖

*   **那個 + 號**： 不支援

## ContactError

`ContactError`物件返回到使用者通過 `contactError` 發生錯誤時的回呼函數。

### 屬性

*   **代碼**： 下面列出的預定義的錯誤代碼之一。

### 常量

*   `ContactError.UNKNOWN_ERROR` (code 0)
*   `ContactError.INVALID_ARGUMENT_ERROR` (code 1)
*   `ContactError.TIMEOUT_ERROR` (code 2)
*   `ContactError.PENDING_OPERATION_ERROR` (code 3)
*   `ContactError.IO_ERROR` (code 4)
*   `ContactError.NOT_SUPPORTED_ERROR` (code 5)
*   `ContactError.PERMISSION_DENIED_ERROR` (code 20)

## ContactField

`ContactField`物件是可重用的元件代表一般連絡人欄位。 每個 `ContactField` 物件包含 `value` ， `type` ，和 `pref` 屬性。 A `Contact` 物件存儲中的幾個屬性 `ContactField[]` 陣列，例如電話號碼和電子郵件地址。

在大多數情況下，有沒有預先確定的值 `ContactField` 物件的**type**屬性。 例如，電話號碼可以指定**類型**的*家庭*、*工作*、*手機*、 *iPhone*或由一個特定的設備平臺接觸資料庫系統支援的任何其他值的值。 然而，對於 `Contact` **的照片**欄位，**類型**欄位指示返回圖像的格式： **url**的**值**屬性包含的照片圖像或*base64*的 URL 時的**值**包含一個 base64 編碼圖像字串時。

### 屬性

*   **類型**： 一個字串，例如指示哪種類型的欄位，這是*回家*。*() DOMString*

*   **價值**： 欄位的值，如電話號碼或電子郵件地址。*() DOMString*

*   **那個 + 號**： 設置為 `true` 如果這個 `ContactField` 包含使用者的首選的價值。*（布林）*

### 支援的平臺

*   亞馬遜火 OS
*   安卓系統
*   黑莓 10
*   火狐瀏覽器的作業系統
*   iOS
*   Windows Phone 7 和 8
*   Windows 8
*   Windows

### 示例

        // create a new contact
        var contact = navigator.contacts.create();
    
        // store contact phone numbers in ContactField[]
        var phoneNumbers = [];
        phoneNumbers[0] = new ContactField('work', '212-555-1234', false);
        phoneNumbers[1] = new ContactField('mobile', '917-555-5432', true); // preferred number
        phoneNumbers[2] = new ContactField('home', '203-555-7890', false);
        contact.phoneNumbers = phoneNumbers;
    
        // save the contact
        contact.save();
    

### Android 的怪癖

*   **上一頁**: 不受支援，返回`false`.

### 黑莓 10 的怪癖

*   **類型**： 部分支援。使用的電話號碼。

*   **價值**： 支援。

*   **究竟**: 不受支援，返回`false`.

### iOS 的怪癖

*   **究竟**: 不受支援，返回`false`.

### Windows8 的怪癖

*   **究竟**: 不受支援，返回`false`.

### Windows 的怪癖

*   **究竟**: 不受支援，返回`false`.

## 連絡人姓名

關於包含不同種類的資訊 `Contact` 物件的名稱。

### 屬性

*   **格式化**： 該連絡人的完整名稱。*() DOMString*

*   **字體集**： 連絡人的姓氏。*() DOMString*

*   **givenName**： 連絡人的名字。*() DOMString*

*   **連絡人**： 連絡人的中間名。*() DOMString*

*   **honorificPrefix**： 連絡人的首碼 （例如*先生*或*博士*） *(DOMString)*

*   **honorificSuffix**： 連絡人的尾碼 （例如*某某某*）。*() DOMString*

### 支援的平臺

*   亞馬遜火 OS
*   Android 2.X
*   黑莓 10
*   火狐瀏覽器的作業系統
*   iOS
*   Windows Phone 7 和 8
*   Windows 8
*   Windows

### 示例

    function onSuccess(contacts) {
        for (var i = 0; i < contacts.length; i++) {
            alert("Formatted: "  + contacts[i].name.formatted       + "\n" +
                "Family Name: "  + contacts[i].name.familyName      + "\n" +
                "Given Name: "   + contacts[i].name.givenName       + "\n" +
                "Middle Name: "  + contacts[i].name.middleName      + "\n" +
                "Suffix: "       + contacts[i].name.honorificSuffix + "\n" +
                "Prefix: "       + contacts[i].name.honorificSuffix);
        }
    };
    
    function onError(contactError) {
        alert('onError!');
    };
    
    var options = new ContactFindOptions();
    options.filter = "";
    filter = ["displayName", "name"];
    navigator.contacts.find(filter, onSuccess, onError, options);
    

### Android 的怪癖

*   **格式化**： 部分受支援，並為唯讀。 返回的串聯的 `honorificPrefix` ， `givenName` ， `middleName` ， `familyName` ，和`honorificSuffix`.

### 黑莓 10 的怪癖

*   **格式化**： 部分支援。返回的串聯的黑莓手機**名字**和**姓氏**欄位。

*   **字體集**： 支援。黑莓**姓氏**欄位中存儲。

*   **givenName**： 支援。黑莓**名字**欄位中存儲。

*   **連絡人**: 不受支援，返回`null`.

*   **honorificPrefix**: 不受支援，返回`null`.

*   **honorificSuffix**: 不受支援，返回`null`.

### FirefoxOS 的怪癖

*   **格式化**： 部分受支援，並為唯讀。 返回的串聯的 `honorificPrefix` ， `givenName` ， `middleName` ， `familyName` ，和`honorificSuffix`.

### iOS 的怪癖

*   **格式化**： 部分支援。返回 iOS 複合名稱，但為唯讀。

### Windows 8 的怪癖

*   **格式**： 這是唯一名稱屬性，並且是相同的 `displayName` ，和`nickname`

*   **字體集**： 不支援

*   **givenName**： 不支援

*   **連絡人**： 不支援

*   **honorificPrefix**: 不支援

*   **honorificSuffix**: 不支援

### Windows 的怪癖

*   **格式**： 它是完全相同`displayName`

## ContactOrganization

`ContactOrganization`物件存儲連絡人的組織屬性。A `Contact` 物件存儲一個或多個 `ContactOrganization` 陣列中的物件。

### 屬性

*   **那個 + 號**： 設置為 `true` 如果這個 `ContactOrganization` 包含使用者的首選的價值。*（布林）*

*   **類型**： 一個字串，例如指示哪種類型的欄位，這是*回家*。_(DOMString)

*   **名稱**： 組織的名稱。*() DOMString*

*   **部門**： 合同工作為的部門。*() DOMString*

*   **標題**： 在組織連絡人的標題。*() DOMString*

### 支援的平臺

*   安卓系統
*   黑莓 10
*   火狐瀏覽器的作業系統
*   iOS
*   Windows Phone 7 和 8
*   Windows （Windows 8.1 和 Windows Phone 8.1 設備）

### 示例

    function onSuccess(contacts) {
        for (var i = 0; i < contacts.length; i++) {
            for (var j = 0; j < contacts[i].organizations.length; j++) {
                alert("Pref: "      + contacts[i].organizations[j].pref       + "\n" +
                    "Type: "        + contacts[i].organizations[j].type       + "\n" +
                    "Name: "        + contacts[i].organizations[j].name       + "\n" +
                    "Department: "  + contacts[i].organizations[j].department + "\n" +
                    "Title: "       + contacts[i].organizations[j].title);
            }
        }
    };
    
    function onError(contactError) {
        alert('onError!');
    };
    
    var options = new ContactFindOptions();
    options.filter = "";
    filter = ["displayName", "organizations"];
    navigator.contacts.find(filter, onSuccess, onError, options);
    

### Android 2.X 的怪癖

*   **那個 + 號**： 不支援的 Android 2.X 的設備，返回`false`.

### 黑莓 10 的怪癖

*   **那個 + 號**： 不支援的黑莓手機，返回`false`.

*   **類型**： 不支援的黑莓手機，返回`null`.

*   **名稱**： 部分支援。第一次組織名稱存儲在黑莓**公司**欄位中。

*   **部**: 不受支援，返回`null`.

*   **標題**： 部分支援。第一次組織標題存儲在欄位中黑莓**渺小**。

### 火狐瀏覽器作業系統的怪癖

*   **那個 + 號**： 不支援

*   **類型**： 不支援

*   **部門**： 不支援

*   欄位**名稱**和**標題**存儲在**組織結構圖**和**渺小**.

### iOS 的怪癖

*   **那個 + 號**： 不支援在 iOS 設備上，返回`false`.

*   **類型**： 不支援在 iOS 設備上，返回`null`.

*   **名稱**： 部分支援。第一次組織名稱存儲在 iOS **kABPersonOrganizationProperty**欄位中。

*   **部門**： 部分支援。第一部門名稱存儲在 iOS **kABPersonDepartmentProperty**欄位中。

*   **標題**： 部分支援。第一個標題存儲在 iOS **kABPersonJobTitleProperty**欄位中。

### Windows 的怪癖

*   **究竟**: 不受支援，返回`false`.

*   **類型**： 不受支援，返回`null`.