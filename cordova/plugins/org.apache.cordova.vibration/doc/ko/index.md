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

이 플러그인에는 장치를 진동 하는 방법을 제공 합니다.

## 설치

    cordova plugin add org.apache.cordova.vibration
    

## 지원 되는 플랫폼

navigator.notification.vibrate-아마존 화재 OS-안 드 로이드-블랙베리 10-파이어 폭스 OS-iOS-Windows Phone 7과 8

navigator.notification.vibrateWithPattern,  
navigator.notification.cancelVibration-안 드 로이드

## notification.vibrate

주어진 시간 동안 장치를 진동.

    navigator.notification.vibrate(time)
    

*   **시간**: 진동 장치 (밀리초)입니다. *(수)*

### 예를 들어

    // Vibrate for 2.5 seconds
    navigator.notification.vibrate(2500);
    

### iOS 단점

*   **시간**: 지정 된 시간을 무시 하 고 미리 설정 된 시간 동안 진동.
    
        navigator.notification.vibrate();
        navigator.notification.vibrate(2500);   // 2500 is ignored
        

## notification.vibrateWithPattern

지정 된 패턴으로 장치 진동.

    navigator.notification.vibrateWithPattern(pattern, repeat)
    

*   **패턴**:의 기간 (밀리초)에서 진동을 켜거나 끌 수 있는 순서. *(숫자의 배열)*
*   **반복**: 반복 (취소 될 때까지 반복 됩니다), 시작 하는 또는-1 (기본값) 없는 반복에 대 한 패턴 배열에 선택적 인덱스. *(수)*

### 예를 들어

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

즉시 모든 현재 실행 중인 진동을 취소합니다.

    navigator.notification.cancelVibration()