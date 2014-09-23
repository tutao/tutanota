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

このプラグインは、デバイスを振動させる方法を提供します。

## インストール

    cordova plugin add org.apache.cordova.vibration
    

## サポートされているプラットフォーム

navigator.notification.vibrate - アマゾン火 OS - アンドロイド - ブラックベリー 10 - Firefox OS - iOS - Windows Phone 7 と 8

navigator.notification.vibrateWithPattern、  
navigator.notification.cancelVibration - アンドロイド

## notification.vibrate

一定の時間のため、デバイスが振動します。

    navigator.notification.vibrate(time)
    

*   **時刻**: ミリ秒、デバイスを振動させる。*(数)*

### 例

    // Vibrate for 2.5 seconds
    navigator.notification.vibrate(2500);
    

### iOS の癖

*   **時間**: 指定された時間を無視し、時間の事前に設定された量のために振動します。
    
        navigator.notification.vibrate();
        navigator.notification.vibrate(2500);   // 2500 is ignored
        

## notification.vibrateWithPattern

特定のパターンを持つデバイスが振動します。

    navigator.notification.vibrateWithPattern(pattern, repeat)
    

*   **パターン**: シーケンスの継続時間 (ミリ秒単位) をオンまたはオフ、バイブします。*(数字の配列)*
*   **繰り返します**: 省略可能な配列のインデックスのパターン （でしょう） を繰り返す取り消されるまで、繰り返しを開始するまたは反復なし (既定値) の場合は-1。*(数)*

### 例

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

すぐに、現在実行中の振動をキャンセルします。

    navigator.notification.cancelVibration()