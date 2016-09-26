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

# cordova-plugin-contacts

這個外掛程式定義了一個全域 `navigator.contacts` 物件，提供對設備連絡人資料庫的訪問。

雖然該物件附加到全球範圍內 `導航器`，它不可用直到 `deviceready` 事件之後。

    document.addEventListener("deviceready", onDeviceReady, false);
    function onDeviceReady() {
        console.log(navigator.contacts);
    }
    

**警告**： 連絡人資料的收集和使用提出了重要的隱私問題。 您的應用程式的隱私權原則應該討論應用程式如何使用連絡人資料和它是否被共用與任何其他締約方。 聯繫資訊被認為是敏感，因為它揭示了的人與人溝通了。 因此，除了隱私權原則的應用程式，您應強烈考慮提供時間只是通知之前應用程式訪問或使用連絡人的資料，如果設備作業系統不已經這樣做了。 該通知應提供相同的資訊，如上所述，以及獲取該使用者的許可權 （例如，通過提出選擇 **確定** 並 **不感謝**）。 請注意一些應用程式市場可能需要應用程式提供只是時間的通知，並獲得使用者的許可才能訪問連絡人資料。 周圍的連絡人資料可以説明避免使用者混淆使用和連絡人資料感知的濫用的清楚和容易理解的使用者體驗。 有關詳細資訊，請參閱隱私指南。

## 安裝

    cordova plugin add cordova-plugin-contacts
    

### 火狐瀏覽器作業系統的怪癖

在 [清單檔][1] 中所述創建 **www/manifest.webapp**。 添加相關的許可權。 也是需要的 web 應用程式類型更改為"privileged"— — [顯化的文檔][2]。 **警告**： 所有的特權應用程式強制執行禁止內聯腳本的 [內容的安全性原則][3]。 在另一種方式初始化您的應用程式。

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

從 `find` 和 `pickContact` 方法返回任何連絡人是唯讀，因此您的應用程式不能修改它們。 僅在 Windows Phone 8.1 設備上可用的 `find` 方法。

### Windows 8 的怪癖

Windows 8 連絡人是唯讀的。 透過科爾多瓦 API 接觸的不是可查詢/搜索，您應通知使用者挑選連絡人作為調用 contacts.pickContact，將會打開 '人' 的應用程式，使用者必須選擇一個連絡人。 返回任何連絡人是唯讀，因此您的應用程式不能修改它們。

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

`navigator.contacts.create` 方法是同步的並返回一個新的 `Contact` 物件。

此方法將不會保留在設備連絡人資料庫中，需要調用 `Contact.save` 方法的聯繫物件。

### 支援的平臺

*   Android 系統
*   黑莓 10
*   火狐瀏覽器作業系統
*   iOS
*   Windows Phone 7 和 8

### 示例

    var myContact = navigator.contacts.create({"displayName": "Test User"});
    

## navigator.contacts.find

`navigator.contacts.find` 方法以非同步方式，執行設備連絡人資料庫查詢並返回 `Contact` 物件的陣列。 生成的物件被傳遞到由 **contactSuccess** 參數指定的 `contactSuccess` 回呼函數。

**contactFields** 參數指定的欄位用作搜索限定詞。 長度為零的 **contactFields** 參數是不正確並導致 `ContactError.INVALID_ARGUMENT_ERROR`。 **contactFields** 值為 `"*"` 搜索所有連絡人欄位。

在連絡人資料庫查詢時，**contactFindOptions.filter** 字串可以用作搜索篩選器。 如果提供，不區分大小寫，部分值匹配被適用于在 **contactFields** 參數中指定的每個欄位。 如果存在匹配的 *任何* 指定的欄位，則返回連絡人。 使用 **contactFindOptions.desiredFields** 參數來控制哪些連絡人屬性必須回來。

### 參數

*   **contactFields**： '連絡人' 欄位用作搜索限定詞。*(DOMString[])* [Required]

*   **contactSuccess**： 從資料庫返回的成功回呼函數調用時使用的連絡人物件的陣列。[Required]

*   **contactError**： 錯誤回呼函數，當發生錯誤時調用。[可選]

*   **contactFindOptions**： 搜索選項來篩選 navigator.contacts。[Optional]
    
    鍵包括：
    
    *   **filter**： 用來找到 navigator.contacts 的搜索字串。*() DOMString*（預設： `""`)
    
    *   **multiple**： 確定是否查找操作返回多個 navigator.contacts。*(布林值)*（預設值： `false`)
        
        *   **desiredFields**： '連絡人' 欄位，又折回來。如果指定，由此產生的 `Contact` 物件只有這些欄位的功能值。*(DOMString[])* [Optional]

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

`navigator.contacts.pickContact` 方法啟動連絡人選取器來選擇一個連絡人。 將生成的物件傳遞給 **contactSuccess** 參數所指定的 `contactSuccess` 回呼函數。

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

`Contact` 物件表示使用者的連絡人。 可以創建、 存儲，或從設備的連絡人資料庫中刪除連絡人。 連絡人可以也被 （單獨或批量） 從資料庫中檢索通過調用 `navigator.contacts.find` 方法。

**注**： 並不是所有上面列出的連絡人欄位支援的每個設備的平臺。請檢查每個平臺 *的怪癖* 節瞭解詳細資訊。

### 屬性

*   **id**： 一個全域唯一識別碼。*() DOMString*

*   **displayName**： 此連絡人，適合於向最終使用者顯示的名稱。*() DOMString*

*   **name**： 一個物件，包含所有元件的一個人的名字。*（連絡人姓名）*

*   **nickname**： 休閒的位址連絡人名稱。*() DOMString*

*   **phoneNumbers**： 陣列的所有連絡人的電話號碼。*(ContactField[])*

*   **emails**： 所有連絡人的電子郵件地址的陣列。*(ContactField[])*

*   **addresses**： 該連絡人的所有位址的陣列。*(ContactAddress[])*

*   **ims**： 所有連絡人的 IM 位址的陣列。*(ContactField[])*

*   **organizations**： 該連絡人的所有組織的陣列。*(ContactOrganization[])*

*   **birthday**： 連絡人的生日。*(Date)*

*   **note**： 注意有關的聯繫。*() DOMString*

*   **photos**： 陣列的連絡人的照片。*(ContactField[])*

*   **categories**： 陣列與連絡人關聯的所有使用者定義的類別。*(ContactField[])*

*   **url**： 陣列與連絡人關聯的 web 頁。*(ContactField[])*

### 方法

*   **clone**： 返回一個新的 `Contact` 物件就是調用物件的深層副本 `id` 屬性設置為`null`.

*   **remove**： 從設備的連絡人資料庫中刪除連絡人，否則執行錯誤回檔與 `ContactError` 物件。

*   **save**： 將一個新的連絡人保存到設備的連絡人資料庫中，或更新現有的連絡人，如果已存在具有相同 **id** 的連絡人。

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

*   **categories**： 不支援 Android 2.X 在設備上，返回`null`.

### 黑莓 10 的怪癖

*   **id**： 由該設備分配時保存該連絡人。

### FirefoxOS 的怪癖

*   **categories**： 部分支援。返回欄位**pref**和**type**`null`

*   **ims**： 不支援

*   **photos**： 不支援

### iOS 的怪癖

*   **displayName**： 上返回的 iOS 不支援 `null` 除非有沒有 `ContactName` 指定，在這種情況下它將返回複合名稱，**nickname**或 `""` ，分別。

*   **birthday**： 必須輸入 JavaScript 作為 `Date` 物件，它將返回相同的方式。

*   **photos**： 返回到圖像中，存儲在應用程式的臨時目錄中檔的 URL。當應用程式退出時刪除臨時目錄的內容。

*   **categories**： 目前不支援此屬性，返回`null`.

### Windows Phone 7 和 8 的怪癖

*   **displayName**： 當創建一個連絡人，提供的顯示名稱參數不同于顯示名稱的值檢索查找連絡人時。

*   **url**： 當創建一個連絡人，使用者可以輸入和保存多個 web 位址，但只有一個是可用的搜索連絡人時。

*   **phoneNumbers**：*pref*選項不受支援。 在*type*操作中不是支援的*find*。 只有一個 `phoneNumber` 允許的每個*type*.

*   **emails**：*pref*選項不受支援。家庭和個人使用引用同一電子郵件項。只有一項是允許的每個*type*.

*   **addresses**： 僅支援的工作和家庭/個人*type*。家庭和個人*type*引用相同的位址條目。只有一項是允許的每個*type*.

*   **organizations**： 唯一一個允許的和不支援的*pref*、*type*和*department*的屬性。

*   **note**： 不支援，返回`null`.

*   **ims**： 不受支援，返回`null`.

*   **birthdays**: 不受支援，返回`null`.

*   **categories**： 不受支援，返回`null`.

### Windows 的怪癖

*   **photos**： 返回到圖像中，存儲在應用程式的臨時目錄中檔的 URL。

*   **birthdays**: 不受支援，返回`null`.

*   **categories**： 不受支援，返回`null`.

## ContactAddress

`ContactAddress` 物件存儲單個位址的連絡人的屬性。 `Contact` 物件可能包括多個位址 `ContactAddress []` 陣列中。

### 屬性

*   **pref**： 設置為 `true` 如果這個 `ContactAddress` 包含使用者的首選的價值。*（Boolean）*

*   **type**： 一個字串，例如指示哪種類型的欄位，這是*home*。*() DOMString*

*   **formatted**： 顯示格式的完整位址。*() DOMString*

*   **streetAddress**： 完整的街道位址。*() DOMString*

*   **locality**： 城市或地點。*() DOMString*

*   **region**： 國家或地區。*() DOMString*

*   **postalCode**： 郵遞區號。*() DOMString*

*   **country**： 國家名稱。*() DOMString*

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

*   **pref**: 不受支援，返回 `false` Android 2.X 的設備上。

### 黑莓 10 的怪癖

*   **pref**： 在返回的黑莓設備上不支援`false`.

*   **type**： 部分支援。只有一個*Word*和*Home*類型位址可以存儲每個連絡人。

*   **formatted**： 部分支援。返回的串聯的所有黑莓手機位址欄位。

*   **streetAddress**： 支援。返回和串聯組成的黑莓**address1** **address2**位址欄位。

*   **locality**： 支援。黑莓手機**city**位址欄位中存儲。

*   **region**： 支援。黑莓**stateProvince**位址欄位中存儲。

*   **postalCode**： 支援。黑莓**zipPostal**位址欄位中存儲。

*   **country**： 支援。

### FirefoxOS 的怪癖

*   **formatted**： 目前不支援

### iOS 的怪癖

*   **pref**： 不支援在 iOS 設備上，返回`false`.

*   **formatted**： 目前不支援。

### Windows 8 的怪癖

*   **pref**： 不支援

### Windows 的怪癖

*   **pref**： 不支援

## ContactError

當發生錯誤時，通過 `contactError` 回呼函數為使用者情況下會返回的 `ContactError` 物件。

### 屬性

*   **code**： 下面列出的預定義的錯誤代碼之一。

### 常量

*   `ContactError.UNKNOWN_ERROR` (code 0)
*   `ContactError.INVALID_ARGUMENT_ERROR` (code 1)
*   `ContactError.TIMEOUT_ERROR` (code 2)
*   `ContactError.PENDING_OPERATION_ERROR` (code 3)
*   `ContactError.IO_ERROR` (code 4)
*   `ContactError.NOT_SUPPORTED_ERROR` (code 5)
*   `ContactError.PERMISSION_DENIED_ERROR` (code 20)

## ContactField

`ContactField` 物件是可重用的元件代表一般連絡人欄位。 每個 `ContactField` 物件包含一個 `value`、 `type` 和 `pref` 的屬性。 `Contacat` 物件將幾個屬性存儲在 `ContactField []` 陣列，例如電話號碼和電子郵件地址。

在大多數情況下，沒有預先確定的 `ContactField` 物件的 **type** 屬性值。 例如，一個電話號碼可以指定 **type** 值的 *home*、 *work*、 *mobile*、 *iPhone* 或由一個特定的設備平臺接觸資料庫系統支援的任何其他值。 然而，為 `photos` **照片** 欄位中，**type** 欄位指示返回圖像的格式： 當 **value** 屬性包含一個指向的照片圖像或 *base64* URL 時的 **value** 包含 string base64 編碼的圖像的 **url**。

### 屬性

*   **type**： 一個字串，例如指示哪種類型的欄位，這是*home*。*() DOMString*

*   **value**： 欄位的值，如電話號碼或電子郵件地址。*() DOMString*

*   **pref**： 設置為 `true` 如果這個 `ContactField` 包含使用者的首選的價值。*（布林）*

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

*   **pref**: 不受支援，返回`false`.

### 黑莓 10 的怪癖

*   **type**： 部分支援。使用的電話號碼。

*   **value**： 支援。

*   **pref**: 不受支援，返回`false`.

### iOS 的怪癖

*   **pref**: 不受支援，返回`false`.

### Windows8 的怪癖

*   **pref**: 不受支援，返回`false`.

### Windows 的怪癖

*   **pref**: 不受支援，返回`false`.

## ContactName

包含不同種類的 `Contact` 物件名稱有關的資訊。

### 屬性

*   **formatted**： 該連絡人的完整名稱。*() DOMString*

*   **familyName**： 連絡人的姓氏。*() DOMString*

*   **givenName**： 連絡人的名字。*() DOMString*

*   **middleName**： 連絡人的中間名。*() DOMString*

*   **honorificPrefix**： 連絡人的首碼 （例如*先生*或*博士*） *(DOMString)*

*   **honorificSuffix**： 連絡人的尾碼 （例如*某某某*）。*() DOMString*

### 支援的平臺

*   亞馬遜火 OS
*   Android 系統
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

*   **formatted**： 部分受支援，並為唯讀。 返回的串聯的 `honorificPrefix` ， `givenName` ， `middleName` ， `familyName` ，和`honorificSuffix`.

### 黑莓 10 的怪癖

*   **formatted**： 部分支援。返回的串聯的黑莓手機**firstName**和**lastName**欄位。

*   **familyName**： 支援。黑莓**lastName**欄位中存儲。

*   **givenName**： 支援。黑莓**firstName**欄位中存儲。

*   **middleName**: 不受支援，返回`null`.

*   **honorificPrefix**: 不受支援，返回`null`.

*   **honorificSuffix**: 不受支援，返回`null`.

### FirefoxOS 的怪癖

*   **formatted**： 部分受支援，並為唯讀。 返回的串聯的 `honorificPrefix` ， `givenName` ， `middleName` ， `familyName` ，和`honorificSuffix`.

### iOS 的怪癖

*   **formatted**： 部分支援。返回 iOS 複合名稱，但為唯讀。

### Windows 8 的怪癖

*   **formatted**： 這是唯一名稱屬性，並且是相同的 `displayName` ，和`nickname`

*   **familyName**： 不支援

*   **givenName**： 不支援

*   **middleName**： 不支援

*   **honorificPrefix**: 不支援

*   **honorificSuffix**: 不支援

### Windows 的怪癖

*   **formatted**： 它是完全相同`displayName`

## ContactOrganization

`ContactOrganization` 物件存儲連絡人的組織屬性。`Contact` 物件將一個或多個 `ContactOrganization` 物件存儲在一個陣列中。

### 屬性

*   **pref**： 設置為 `true` 如果這個 `ContactOrganization` 包含使用者的首選的價值。*（布林）*

*   **type**： 一個字串，例如指示哪種類型的欄位，這是*回家*。_(DOMString)

*   **name**： 組織的名稱。*() DOMString*

*   **department**： 合同工作為的部門。*() DOMString*

*   **title**： 在組織連絡人的標題。*() DOMString*

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

*   **pref**： 不支援的 Android 2.X 的設備，返回`false`.

### 黑莓 10 的怪癖

*   **pref**： 不支援的黑莓手機，返回`false`.

*   **type**： 不支援的黑莓手機，返回`null`.

*   **name**： 部分支援。第一次組織名稱存儲在黑莓**company**欄位中。

*   **department**: 不受支援，返回`null`.

*   **title**： 部分支援。第一次組織標題存儲在欄位中黑莓**jobTitle**。

### 火狐瀏覽器作業系統的怪癖

*   **pref**： 不支援

*   **type**： 不支援

*   **department**： 不支援

*   欄位**name**和**title**存儲在**org**和**jobTitle**.

### iOS 的怪癖

*   **pref**： 不支援在 iOS 設備上，返回`false`.

*   **type**： 不支援在 iOS 設備上，返回`null`.

*   **name**： 部分支援。第一次組織名稱存儲在 iOS **kABPersonOrganizationProperty**欄位中。

*   **department**： 部分支援。第一部門名稱存儲在 iOS **kABPersonDepartmentProperty**欄位中。

*   **title**： 部分支援。第一個標題存儲在 iOS **kABPersonJobTitleProperty**欄位中。

### Windows 的怪癖

*   **pref**: 不受支援，返回`false`.

*   **type**： 不受支援，返回`null`.
