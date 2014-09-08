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

# org.apache.cordova.device

這個外掛程式定義全球 `device` 物件，描述該設備的硬體和軟體。 雖然物件是在全球範圍內，但不是可用，直到後 `deviceready` 事件。

    document.addEventListener("deviceready", onDeviceReady, false);
    function onDeviceReady() {
        console.log(device.cordova);
    }
    

## 安裝

    cordova plugin add org.apache.cordova.device
    

## 屬性

*   device.cordova
*   device.model
*   device.name
*   device.platform
*   device.uuid
*   device.version

## device.cordova

獲取科爾多瓦在設備上運行的版本。

### 支援的平臺

*   亞馬遜火 OS
*   Android 系統
*   黑莓 10
*   火狐瀏覽器作業系統
*   iOS
*   Tizen
*   Windows Phone 7 和 8
*   Windows 8

## device.model

`device.model`返回設備的模型或產品的名稱。值由設備製造商設置和同一產品的不同版本可能不同。

### 支援的平臺

*   Android 系統
*   黑莓 10
*   iOS
*   Tizen
*   Windows Phone 7 和 8
*   Windows 8

### 快速的示例

    / / Android： Nexus 返回"激情"（Nexus One 代碼名稱） / / 摩托羅拉 Droid 返回"田鼠"/ / 黑莓手機： 火炬 9800 返回"9800"/ / iOS： 迷你 ipad，返回與 iPad2，5 ；iPhone 5 是 iPhone 5，1。 請參閱 HTTP://theiphonewiki.com/wiki/index.php?title=Models / / var 模型 = device.model ；
    

### Android 的怪癖

*   獲取[產品名稱][1]而不是[產品型號名稱][2]，這往往是生產代碼名稱。 例如，Nexus One 返回 `Passion` ，和摩托羅拉 Droid 返回`voles`.

 [1]: http://developer.android.com/reference/android/os/Build.html#PRODUCT
 [2]: http://developer.android.com/reference/android/os/Build.html#MODEL

### Tizen 怪癖

*   例如，返回與供應商指派的設備模型`TIZEN`

### Windows Phone 7 和 8 怪癖

*   返回由製造商指定的設備模型。例如，三星焦點返回`SGH-i917`.

## device.name

**警告**： `device.name` 從版 2.3.0 已被否決。使用 `device.model` 相反。

## device.platform

獲取該設備的作業系統名稱。

    var string = device.platform;
    

### 支援的平臺

*   Android 系統
*   黑莓 10
*   火狐瀏覽器作業系統
*   iOS
*   Tizen
*   Windows Phone 7 和 8
*   Windows 8

### 快速的示例

    // Depending on the device, a few examples are:
    //   - "Android"
    //   - "BlackBerry 10"
    //   - "iOS"
    //   - "WinCE"
    //   - "Tizen"
    var devicePlatform = device.platform;
    

### Windows Phone 7 的怪癖

Windows Phone 7 設備報告作為平臺`WinCE`.

### Windows Phone 8 怪癖

Windows Phone 8 設備報告作為平臺`Win32NT`.

## device.uuid

獲取設備的通用唯一識別碼 ([UUID][3]).

 [3]: http://en.wikipedia.org/wiki/Universally_Unique_Identifier

    var string = device.uuid;
    

### 說明

UUID 如何生成的詳細資訊由設備製造商和特定于設備的平臺或模型。

### 支援的平臺

*   Android 系統
*   黑莓 10
*   iOS
*   Tizen
*   Windows Phone 7 和 8
*   Windows 8

### 快速的示例

    / / Android： 一個隨機的 64 位整數 （作為字串返回，再次!) / / 上設備的第一次啟動生成的整數 / / / / 黑莓手機： 返回設備的 PIN 號碼 / / 這是九個數字的唯一整數 （作為字串，雖然!) / / / / iPhone： （從 UIDevice 類文檔解釋） / / 返回一個字串的雜湊值創建的多個硬體標識。
    / / 它保證是唯一的每個設備並不能綁 / / 到使用者帳戶。
    / / Windows Phone 7： 返回的雜湊代碼的設備 + 當前使用者，/ / 如果未定義使用者，則一個 guid 生成的並且將會保留直到卸載該應用程式 / / Tizen： 返回設備 IMEI （國際行動裝置身份或 IMEI 是一個數位 / / 獨有的每一個 UMTS 和 GSM 行動電話。
    var deviceID = device.uuid;
    

### iOS 怪癖

`uuid`在 iOS 上不是獨有的一種設備，但對於每個應用程式，為每個安裝各不相同。 如果您刪除並重新安裝應用程式，它會更改和可能還當你升級 iOS，或甚至升級每個版本 (明顯在 iOS 5.1 中) 的應用程式。 `uuid`不是一個可靠的值。

### Windows Phone 7 和 8 怪癖

`uuid`為 Windows Phone 7 需要許可權 `ID_CAP_IDENTITY_DEVICE` 。 Microsoft 可能會很快就棄用此屬性。 如果能力不是可用的應用程式將生成一個持久性的 guid 並保持應用程式的安裝在設備上的持續時間。

## device.version

獲取作業系統版本。

    var string = device.version;
    

### 支援的平臺

*   Android 2.1 +
*   黑莓 10
*   iOS
*   Tizen
*   Windows Phone 7 和 8
*   Windows 8

### 快速的示例

    / / Android： Froyo OS 將返回"2.2"/ / Eclair OS 將返回"2.1"、"2.0.1"2.0"/ / 版本，也可以返回更新級別"2.1 update1"/ / / / 黑莓手機： 火炬 9800 使用 OS 6.0 將返回"6.0.0.600"/ / / / iPhone： iOS 3.2 返回"3.2"/ / / / Windows Phone 7： 返回當前 OS 版本數，。 on Mango returns 7.10.7720
    // Tizen: returns "TIZEN_20120425_2"
    var deviceVersion = device.version;