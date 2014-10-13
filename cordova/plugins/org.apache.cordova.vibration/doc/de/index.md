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

Dieses Plugin richtet mit dem W3C Vibration Spezifikation http://www.w3.org/TR/vibration/

Dieses Plugin bietet eine Möglichkeit, das Gerät zu vibrieren.

## Installation

    cordova plugin add org.apache.cordova.vibration
    

## Unterstützte Plattformen

Navigator.Vibrate  
Navigator.Notification.Vibrate - Amazon Fire OS - Android - BlackBerry 10 - Firefox OS - iOS - Windows Phone 7 und 8

navigator.notification.vibrateWithPattern,  
navigator.notification.cancelVibration - Android

## vibrieren (empfohlen)

Diese Funktion hat drei verschiedene Funktionalitäten, die auf der Grundlage von an sie übergebenen Parameter.

### Standard vibrieren

Vibriert das Gerät für einen bestimmten Zeitraum.

    navigator.vibrate(time)
    

oder

    navigator.vibrate([time])
    

-**Zeit**: Millisekunden das Gerät vibriert. *(Anzahl)*

#### Beispiel

    // Vibrate for 3 seconds
    navigator.vibrate(3000);
    
    // Vibrate for 3 seconds
    navigator.vibrate([3000]);
    

#### iOS Macken

*   **Zeit**: ignoriert die angegebene Zeit und für eine voreingestellte Zeit vibriert.
    
    Navigator.Vibrate(3000); 3000 wird ignoriert

#### Windows und Blackberry-Kniffe

*   **Zeit**: Max. Zeit 5000ms (5 s) und min Zeit ist 1ms
    
    Navigator.Vibrate(8000); wird auf 5000 abgeschnitten

### Vibrieren Sie mit einem Muster (Android und Windows nur)

Vibriert das Gerät mit einem vorgegebenen Muster

    navigator.vibrate(pattern);   
    

*   **Muster**: Folge von Dauer (in Millisekunden) für den ein-oder Ausschalten der Vibrator. *(Array von Zahlen)*

#### Beispiel

    // Vibrate for 1 second
    // Wait for 1 second
    // Vibrate for 3 seconds
    // Wait for 1 second
    // Vibrate for 5 seconds
    navigator.vibrate([1000, 1000, 3000, 1000, 5000]);
    

### "Abbrechen" Vibration (nicht in iOS unterstützt)

Sofort bricht alle derzeit ausgeführten Schwingungen.

    navigator.vibrate(0)
    

oder

    navigator.vibrate([])
    

oder

    navigator.vibrate([0])
    

Übergabe eines Parameters 0, wird ein leeres Array, oder ein Array mit einem Element der Wert 0 auftretender Schwingungen abbrechen.

## *Notification.Vibrate (veraltet)

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
        

## *Notification.vibrateWithPattern (veraltet)

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
    

## *Notification.cancelVibration (veraltet)

Sofort bricht alle derzeit ausgeführten Schwingungen.

    navigator.notification.cancelVibration()
    

* Note - durch Angleichung an die w3c-Spezifikation, die markierten Methoden abgeschafft werden wird