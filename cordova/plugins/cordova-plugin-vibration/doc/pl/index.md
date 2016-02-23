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

Ten plugin wyrównuje z http://www.w3.org/TR/vibration/ specyfikacji W3C wibracji

Ten plugin umożliwia wibracje urządzenia.

Ten plugin definiuje obiekty globalne, w tym `navigator.vibrate`.

Chociaż w globalnym zasięgu, są nie dostępne dopiero po `deviceready` imprezie.

    document.addEventListener("deviceready", onDeviceReady, false);
    function onDeviceReady() {
        console.log(navigator.vibrate);
    }
    

## Instalacja

    cordova plugin add cordova-plugin-vibration
    

## Obsługiwane platformy

navigator.vibrate,  
navigator.notification.vibrate - Amazon Fire OS - Android - BlackBerry 10 - Firefox OS - iOS - Windows Phone 7 and 8

navigator.notification.vibrateWithPattern,  
navigator.notification.cancelVibration - Android - Windows Phone 8

## wibracje (zalecane)

Funkcja ta ma trzy różne funkcje na podstawie parametrów przekazywanych do niej.

### Standardowe wibracje

Wibruje urządzenie na określoną ilość czasu.

    navigator.vibrate(time)
    

lub

    navigator.vibrate([time])
    

-**time**: milisekund wibracje urządzenia. *(Liczba)*

#### Przykład

    // Vibrate for 3 seconds
    navigator.vibrate(3000);
    
    // Vibrate for 3 seconds
    navigator.vibrate([3000]);
    

#### Dziwactwa iOS

*   **czas**: ignoruje określony czas i wibruje na wstępnie określoną ilość czasu.
    
    navigator.vibrate(3000); // 3000 is ignored

#### Windows i Blackberry dziwactwa

*   **czas**: Max czas jest 5000ms (5s) i min czas 1ms
    
    navigator.vibrate(8000); // will be truncated to 5000

### Wibracje z wzorem (Android i Windows tylko)

Wibruje urządzenie z danego wzoru

    navigator.vibrate(pattern);   
    

*   **wzór**: sekwencja czas trwania (w milisekundach), dla której chcesz włączyć lub wyłączyć wibrator. *(Tablica liczb)*

#### Przykład

    // Vibrate for 1 second
    // Wait for 1 second
    // Vibrate for 3 seconds
    // Wait for 1 second
    // Vibrate for 5 seconds
    navigator.vibrate([1000, 1000, 3000, 1000, 5000]);
    

#### Windows Phone 8 dziwactwa

*   vibrate(Pattern) spada z powrotem na wibracje z domyślny czas trwania

### Anuluj wibracji (nieobsługiwane w iOS)

Niezwłocznie anuluje aktualnie uruchomione wibracje.

    navigator.vibrate(0)
    

lub

    navigator.vibrate([])
    

lub

    navigator.vibrate([0])
    

Przekazując parametr 0, pustą tablicę lub tablicy z jednym z elementów wartości 0 spowoduje anulowanie wibracji.

## *Notification.vibrate (przestarzałe)

Wibruje urządzenie na określoną ilość czasu.

    navigator.notification.vibrate(time)
    

*   **time**: milisekund wibracje urządzenia. *(Liczba)*

### Przykład

    // Vibrate for 2.5 seconds
    navigator.notification.vibrate(2500);
    

### Dziwactwa iOS

*   **czas**: ignoruje określony czas i wibruje na wstępnie określoną ilość czasu.
    
        navigator.notification.vibrate();
        navigator.notification.vibrate(2500);   // 2500 is ignored
        

## *Notification.vibrateWithPattern (przestarzałe)

Wibruje urządzenie z danego wzoru.

    navigator.notification.vibrateWithPattern(pattern, repeat)
    

*   **pattern**: sekwencja czas trwania (w milisekundach), dla której chcesz włączyć lub wyłączyć wibrator. *(Tablica liczb)*
*   **repeat**: opcjonalny indeks do tablicy wzór który zacząć powtarzać (będzie powtarzać do momentu anulowane), lub -1 nie powtarzania (domyślnie). *(Liczba)*

### Przykład

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
    

## *Notification.cancelVibration (przestarzałe)

Niezwłocznie anuluje aktualnie uruchomione wibracje.

    navigator.notification.cancelVibration()
    

* Uwaga - ze względu na dostosowanie specyfikacji w3c, oznaczonych gwiazdką metody zostaną wycofane
