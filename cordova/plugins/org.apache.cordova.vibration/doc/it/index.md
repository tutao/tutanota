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

Questo plugin si allinea con il W3C vibrazione specifica http://www.w3.org/TR/vibration/

Questo plugin consente di vibrare il dispositivo.

## Installazione

    cordova plugin add org.apache.cordova.vibration
    

## Piattaforme supportate

Navigator.vibrate  
Navigator.Notification.vibrate - Amazon fuoco OS - OS di Firefox - 10 BlackBerry - Android - iOS - Windows Phone 7 e 8

navigator.notification.vibrateWithPattern,  
navigator.notification.cancelVibration - Android

## vibrare (consigliato)

Questa funzione ha tre differenti funzionalità basate su parametri passati ad esso.

### Standard vibrare

Vibra il dispositivo per un determinato periodo di tempo.

    navigator.vibrate(time)
    

o

    navigator.vibrate([time])
    

-**tempo**: millisecondi a vibrare il dispositivo. *(Numero)*

#### Esempio

    // Vibrate for 3 seconds
    navigator.vibrate(3000);
    
    // Vibrate for 3 seconds
    navigator.vibrate([3000]);
    

#### iOS stranezze

*   **tempo**: ignora il tempo specificato e vibra per un tempo pre-impostato.
    
    Navigator.vibrate(3000); 3000 viene ignorato

#### Windows e stranezze di Blackberry

*   **tempo**: tempo Max 5000ms (5s) edè min tempo di 1ms
    
    Navigator.vibrate(8000); verrà troncato a 5000

### Vibrare con un pattern (Android e solo per Windows)

Vibra il dispositivo con un determinato modello

    navigator.vibrate(pattern);   
    

*   **modello**: sequenza di durate (in millisecondi) per il quale attivare o disattivare il vibratore. *(Matrice di numeri)*

#### Esempio

    // Vibrate for 1 second
    // Wait for 1 second
    // Vibrate for 3 seconds
    // Wait for 1 second
    // Vibrate for 5 seconds
    navigator.vibrate([1000, 1000, 3000, 1000, 5000]);
    

### Annullare le vibrazioni (non supportata in iOS)

Annulla immediatamente qualsiasi vibrazione attualmente in esecuzione.

    navigator.vibrate(0)
    

o

    navigator.vibrate([])
    

o

    navigator.vibrate([0])
    

Passa un parametro 0, matrice vuota o una matrice con un elemento di valore 0 annullerà eventuali vibrazioni.

## *Notification.vibrate (obsoleto)

Vibra il dispositivo per un determinato periodo di tempo.

    navigator.notification.vibrate(time)
    

*   **tempo**: millisecondi a vibrare il dispositivo. *(Numero)*

### Esempio

    // Vibrate for 2.5 seconds
    navigator.notification.vibrate(2500);
    

### iOS stranezze

*   **tempo**: ignora il tempo specificato e vibra per un tempo pre-impostato.
    
        navigator.notification.vibrate();
        navigator.notification.vibrate(2500);   // 2500 is ignored
        

## *Notification.vibrateWithPattern (obsoleto)

Vibra il dispositivo con un determinato modello.

    navigator.notification.vibrateWithPattern(pattern, repeat)
    

*   **modello**: sequenza di durate (in millisecondi) per il quale attivare o disattivare il vibratore. *(Matrice di numeri)*
*   **ripetere**: opzionale indice nell'array modello presso cui iniziare ripetendo (ripeterà finché non annullato), o -1 per nessuna ripetizione (impostazione predefinita). *(Numero)*

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