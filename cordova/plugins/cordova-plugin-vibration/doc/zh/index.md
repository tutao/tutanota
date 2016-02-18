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

# cordova-plugin-vibration

這個外掛程式將對齊與 W3C 振動規範 HTTP://www.w3.org/TR/vibration/

這個外掛程式提供了方法振動設備。

這個外掛程式定義全域物件包括 `navigator.vibrate`.

雖然在全球範圍內，他們不可用直到 `deviceready` 事件之後。

    document.addEventListener("deviceready", onDeviceReady, false);
    function onDeviceReady() {
        console.log(navigator.vibrate);
    }
    

## 安裝

    cordova plugin add cordova-plugin-vibration
    

## 支援的平臺

navigator.vibrate,  
navigator.notification.vibrate - Amazon Fire OS - Android - BlackBerry 10 - Firefox OS - iOS - Windows Phone 7 and 8

navigator.notification.vibrateWithPattern,  
navigator.notification.cancelVibration - Android - Windows Phone 8

## 震動 (推薦)

此函數具有三個不同的功能，基於傳遞給它的參數。

### 標準振動

為給定時間振動設備。

    navigator.vibrate(time)
    

或

    navigator.vibrate([time])
    

-**time**： 毫秒振動裝置。*（數）*

#### 示例

    // Vibrate for 3 seconds
    navigator.vibrate(3000);
    
    // Vibrate for 3 seconds
    navigator.vibrate([3000]);
    

#### iOS 的怪癖

*   **time**： 忽略指定的時間和震動的一個預先設定的時間。
    
    navigator.vibrate(3000); // 3000 is ignored

#### Windows 和黑莓的怪癖

*   **time**： 最長時間是 5000ms (5s) 和最小時間為 1ms
    
    navigator.vibrate(8000); // will be truncated to 5000

### 以一種模式 （安卓系統和僅限 Windows） 振動

振動具有給定模式的設備

    navigator.vibrate(pattern);   
    

*   **pattern**： 序列的持續時間 （以毫秒為單位） 為其打開或關閉振動器。*（數位陣列）*

#### 示例

    // Vibrate for 1 second
    // Wait for 1 second
    // Vibrate for 3 seconds
    // Wait for 1 second
    // Vibrate for 5 seconds
    navigator.vibrate([1000, 1000, 3000, 1000, 5000]);
    

#### Windows Phone 8 怪癖

*   vibrate(pattern) 瀑布回來上振動與預設持續時間

### 取消振動 （iOS 中不支援）

立即取消任何當前正在運行的振動。

    navigator.vibrate(0)
    

或

    navigator.vibrate([])
    

或

    navigator.vibrate([0])
    

在一個為 0 的參數中傳遞，空陣列或陣列的一個元素的值為 0 將取消任何振動。

## *notification.vibrate (已棄用)

為給定時間振動設備。

    navigator.notification.vibrate(time)
    

*   **time**： 毫秒振動裝置。*（數）*

### 示例

    // Vibrate for 2.5 seconds
    navigator.notification.vibrate(2500);
    

### iOS 的怪癖

*   **time**： 忽略指定的時間和震動的一個預先設定的時間。
    
        navigator.notification.vibrate();
        navigator.notification.vibrate(2500);   // 2500 is ignored
        

## *notification.vibrateWithPattern (已棄用)

振動具有給定模式的設備。

    navigator.notification.vibrateWithPattern(pattern, repeat)
    

*   **pattern**： 序列的持續時間 （以毫秒為單位） 為其打開或關閉振動器。*（數位陣列）*
*   **repeat**： 在從中開始重複 （會重複，直到取消)，或-1 （預設值） 沒有重複模式陣列中的可選索引。*（數）*

### 示例

    // Immediately start vibrating
    // vibrate for 100ms,
    // wait for 100ms,
    // vibrate for 200ms,
    // wait for 100ms,
    // vibrate for 400ms,
    // wait for 100ms,
    // vibrate for 800ms,
    // (do not repeat)
    navigator.notification.vibrateWithPattern([0, 100, 100, 200, 100, 400, 100, 800]);
    

## *notification.cancelVibration (已棄用)

立即取消任何當前正在運行的振動。

    navigator.notification.cancelVibration()
    

* 請注意--由於符合 w3c 規範，出演的方法將被淘汰
