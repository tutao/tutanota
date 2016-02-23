<!--
# license: Licensed to the Apache Software Foundation (ASF) under one
#         or more contributor license agreements.  See the NOTICE file
#         distributed with this work for additional information
#         regarding copyright ownership.  The ASF licenses this file
#         to you under the Apache License, Version 2.0 (the
#         "License"); you may not use this file except in compliance
#         with the License.  You may obtain a copy of the License at
#
#           http://www.apache.org/licenses/LICENSE-2.0
#
#         Unless required by applicable law or agreed to in writing,
#         software distributed under the License is distributed on an
#         "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
#         KIND, either express or implied.  See the License for the
#         specific language governing permissions and limitations
#         under the License.
-->

# cordova-plugin-vibration

[![Build Status](https://travis-ci.org/apache/cordova-plugin-vibration.svg)](https://travis-ci.org/apache/cordova-plugin-vibration)

이 플러그인에 W3C 진동 사양 http://www.w3.org/TR/vibration/ 정렬

이 플러그인에는 장치를 진동 하는 방법을 제공 합니다.

이 플러그인 `navigator.vibrate`를 포함 하는 전역 개체를 정의 합니다..

전역 범위에서 그들은 제공 되지 않습니다 때까지 `deviceready` 이벤트 후.

    document.addEventListener("deviceready", onDeviceReady, false);
    function onDeviceReady() {
        console.log(navigator.vibrate);
    }
    

## 설치

    cordova plugin add cordova-plugin-vibration
    

## 지원 되는 플랫폼

navigator.vibrate,  
navigator.notification.vibrate - Amazon Fire OS - Android - BlackBerry 10 - Firefox OS - iOS - Windows Phone 7 and 8 - Windows (Windows Phone 8.1 devices only)

navigator.notification.vibrateWithPattern  
navigator.notification.cancelVibration - Android - Windows Phone 8 - Windows (Windows Phone 8.1 devices only)

## 진동 (권장)

이 함수는 전달 된 매개 변수에 따라 세 가지 다른 기능.

### 기준 진동

주어진 시간 동안 장치를 진동.

    navigator.vibrate(time)
    

또는

    navigator.vibrate([time])
    

-**time**: 진동 장치 (밀리초)입니다. *(수)*

#### 예를 들어

    // Vibrate for 3 seconds
    navigator.vibrate(3000);
    
    // Vibrate for 3 seconds
    navigator.vibrate([3000]);
    

#### iOS 단점

  * **시간**: 지정 된 시간을 무시 하 고 미리 설정 된 시간 동안 진동.
    
    navigator.vibrate(3000); // 3000 is ignored

#### 윈도 즈와 블랙베리 단점

  * **시간**: 최대 시간은 2000ms (5s) 이며 최소 시간 1ms
    
    navigator.vibrate(8000); // will be truncated to 5000

### (안 드 로이드와 Windows에만 해당) 패턴으로 진동

지정 된 패턴으로 장치를 진동

    navigator.vibrate(pattern);   
    

  * **패턴**:의 기간 (밀리초)에서 진동을 켜거나 끌 수 있는 순서. *(숫자의 배열)*

#### 예를 들어

    // Vibrate for 1 second
    // Wait for 1 second
    // Vibrate for 3 seconds
    // Wait for 1 second
    // Vibrate for 5 seconds
    navigator.vibrate([1000, 1000, 3000, 1000, 5000]);
    

#### Windows Phone 8 단점

  * vibrate(pattern) 폭포 다시에 기본 기간 진동

#### 윈도우 특수

  * vibrate(pattern) 폭포 다시에 기본 기간 진동

### 진동 (iOS에서 지원 되지 않음) 취소

즉시 모든 현재 실행 중인 진동을 취소합니다.

    navigator.vibrate(0)
    

또는

    navigator.vibrate([])
    

또는

    navigator.vibrate([0])
    

0의 매개 변수 전달, 빈 배열, 또는 0 값의 한 요소 배열은 어떤 진동을 취소할 것 이다.

## *notification.vibrate (사용 되지 않음)

주어진 시간 동안 장치를 진동.

    navigator.notification.vibrate(time)
    

  * **time**: 진동 장치 (밀리초)입니다. *(수)*

### 예를 들어

    // Vibrate for 2.5 seconds
    navigator.notification.vibrate(2500);
    

### iOS 단점

  * **시간**: 지정 된 시간을 무시 하 고 미리 설정 된 시간 동안 진동.
    
        navigator.notification.vibrate();
        navigator.notification.vibrate(2500);   // 2500 is ignored
        

## *notification.vibrateWithPattern (사용 되지 않음)

지정 된 패턴으로 장치 진동.

    navigator.notification.vibrateWithPattern(pattern, repeat)
    

  * **패턴**:의 기간 (밀리초)에서 진동을 켜거나 끌 수 있는 순서. *(숫자의 배열)*
  * **repeat**: 반복 (취소 될 때까지 반복 됩니다), 시작 하는 또는-1 (기본값) 없는 반복에 대 한 패턴 배열에 선택적 인덱스. *(수)*

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
    

## *notification.cancelVibration (사용 되지 않음)

즉시 모든 현재 실행 중인 진동을 취소합니다.

    navigator.notification.cancelVibration()
    

* 참고-때문에 w3c 사양 가진 줄 맞춤, 별표 메서드 밖으로 단계별로 됩니다.