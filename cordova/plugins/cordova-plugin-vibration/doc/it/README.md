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

Questo plugin si allinea con il W3C vibrazione specifica http://www.w3.org/TR/vibration/

Questo plugin consente di vibrare il dispositivo.

Questo plugin definisce gli oggetti globali, tra cui `navigator.vibrate`.

Anche se in ambito globale, non sono disponibili fino a dopo l'evento `deviceready`.

    document.addEventListener("deviceready", onDeviceReady, false);
    function onDeviceReady() {
        console.log(navigator.vibrate);
    }
    

## Installazione

    cordova plugin add cordova-plugin-vibration
    

## Piattaforme supportate

navigator.vibrate,  
navigator.notification.vibrate - Amazon Fire OS - Android - BlackBerry 10 - Firefox OS - iOS - Windows Phone 7 and 8 - Windows (Windows Phone 8.1 devices only)

navigator.notification.vibrateWithPattern  
navigator.notification.cancelVibration - Android - Windows Phone 8 - Windows (Windows Phone 8.1 devices only)

## vibrare (consigliato)

Questa funzione ha tre differenti funzionalità basate su parametri passati ad esso.

### Standard vibrare

Vibra il dispositivo per un determinato periodo di tempo.

    navigator.vibrate(time)
    

o

    navigator.vibrate([time])
    

-**time**: millisecondi a vibrare il dispositivo. *(Numero)*

#### Esempio

    // Vibrate for 3 seconds
    navigator.vibrate(3000);
    
    // Vibrate for 3 seconds
    navigator.vibrate([3000]);
    

#### iOS stranezze

  * **time**: ignora il tempo specificato e vibra per un tempo pre-impostato.
    
    navigator.vibrate(3000); // 3000 is ignored

#### Windows e stranezze di Blackberry

  * **time**: tempo Max 5000ms (5s) edè min tempo di 1ms
    
    navigator.vibrate(8000); // will be truncated to 5000

### Vibrare con un pattern (Android e solo per Windows)

Vibra il dispositivo con un determinato modello

    navigator.vibrate(pattern);   
    

  * **modello**: sequenza di durate (in millisecondi) per il quale attivare o disattivare il vibratore. *(Matrice di numeri)*

#### Esempio

    // Vibrate for 1 second
    // Wait for 1 second
    // Vibrate for 3 seconds
    // Wait for 1 second
    // Vibrate for 5 seconds
    navigator.vibrate([1000, 1000, 3000, 1000, 5000]);
    

#### Windows Phone 8 stranezze

  * vibrate(pattern) cade indietro a vibrano con durata predefinita

#### Stranezze di Windows

  * vibrate(pattern) cade indietro a vibrano con durata predefinita

### Annullare le vibrazioni (non supportata in iOS)

Annulla immediatamente qualsiasi vibrazione attualmente in esecuzione.

    navigator.vibrate(0)
    

o

    navigator.vibrate([])
    

o

    navigator.vibrate([0])
    

Passa un parametro 0, matrice vuota o una matrice con un elemento di valore 0 annullerà eventuali vibrazioni.

## *notification.vibrate (deprecated)

Vibra il dispositivo per un determinato periodo di tempo.

    navigator.notification.vibrate(time)
    

  * **time**: millisecondi a vibrare il dispositivo. *(Numero)*

### Esempio

    // Vibrate for 2.5 seconds
    navigator.notification.vibrate(2500);
    

### iOS stranezze

  * **time**: ignora il tempo specificato e vibra per un tempo pre-impostato.
    
        navigator.notification.vibrate();
        navigator.notification.vibrate(2500);   // 2500 is ignored
        

## *Notification.vibrateWithPattern (obsoleto)

Vibra il dispositivo con un determinato modello.

    navigator.notification.vibrateWithPattern(pattern, repeat)
    

  * **modello**: sequenza di durate (in millisecondi) per il quale attivare o disattivare il vibratore. *(Matrice di numeri)*
  * **repeat**: opzionale indice nell'array modello presso cui iniziare ripetendo (ripeterà finché non annullato), o -1 per nessuna ripetizione (impostazione predefinita). *(Numero)*

### Esempio

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
    

## *Notification.cancelVibration (obsoleto)

Annulla immediatamente qualsiasi vibrazione attualmente in esecuzione.

    navigator.notification.cancelVibration()
    

* Nota - a causa di allineamento con le specifiche w3c, saranno essere ritirati i metodi speciali