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

# org.apache.cordova.vibration

這個外掛程式提供了一種方法，振動設備。

## 安裝

    cordova plugin add org.apache.cordova.vibration
    

## 支援的平臺

navigator.notification.vibrate-亞馬遜火 OS-Android-黑莓 10-火狐瀏覽器作業系統 — — iOS-Windows Phone 7 和 8

navigator.notification.vibrateWithPattern，  
navigator.notification.cancelVibration-安卓系統

## notification.vibrate

為給定時間振動設備。

    navigator.notification.vibrate(time)
    

*   **時間**： 毫秒以振動裝置。*（人數）*

### 示例

    // Vibrate for 2.5 seconds
    navigator.notification.vibrate(2500);
    

### iOS 的怪癖

*   **時間**： 忽略指定的時間和震動的一個預先設定的時間。
    
        navigator.notification.vibrate();
        navigator.notification.vibrate(2500);   // 2500 is ignored
        

## notification.vibrateWithPattern

振動具有給定模式的設備。

    navigator.notification.vibrateWithPattern(pattern, repeat)
    

*   **模式**： 序列的持續時間 （以毫秒為單位） 為其打開或關閉振動器。*（數位陣列）*
*   **重複**： 在其開始重複 （會重複，直到被取消），或-1 為不重複 （預設值） 模式陣列中的可選索引。*（人數）*

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
    

## notification.cancelVibration

立即取消任何當前正在運行的振動。

    navigator.notification.cancelVibration()