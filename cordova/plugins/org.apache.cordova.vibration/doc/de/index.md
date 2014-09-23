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

Dieses Plugin bietet eine Möglichkeit, das Gerät zu vibrieren.

## Installation

    cordova plugin add org.apache.cordova.vibration
    

## Unterstützte Plattformen

Navigator.Notification.Vibrate - Amazon Fire OS - Android - BlackBerry 10 - Firefox OS - iOS - Windows Phone 7 und 8

navigator.notification.vibrateWithPattern,  
navigator.notification.cancelVibration - Android

## Notification.Vibrate

Vibriert das Gerät für einen bestimmten Zeitraum.

    navigator.notification.vibrate(time)
    

*   **Zeit**: Millisekunden das Gerät vibriert. *(Anzahl)*

### Beispiel

    // Vibrate for 2.5 seconds
    navigator.notification.vibrate(2500);
    

### iOS Macken

*   **Zeit**: ignoriert die angegebene Zeit und für eine voreingestellte Zeit vibriert.
    
        navigator.notification.vibrate();
        navigator.notification.vibrate(2500);   // 2500 is ignored
        

## notification.vibrateWithPattern

Vibriert das Gerät mit einem vorgegebenen Muster.

    navigator.notification.vibrateWithPattern(pattern, repeat)
    

*   **Muster**: Folge von Dauer (in Millisekunden) für den ein-oder Ausschalten der Vibrator. *(Array von Zahlen)*
*   **Wiederholen**: optionale Index in das Array Muster an der wiederholte (wird wiederholt, bis abgebrochen) zu starten, oder-1 für Wiederholung (Standard). *(Anzahl)*

### Beispiel

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

Sofort bricht alle derzeit ausgeführten Schwingungen.

    navigator.notification.cancelVibration()