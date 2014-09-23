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

Ce plugin permet de faire vibrer l'appareil.

## Installation

    cordova plugin add org.apache.cordova.vibration
    

## Plates-formes prises en charge

Navigator.notification.VIBRATE - Amazon Fire OS - Android - BlackBerry 10 - Firefox OS - iOS - Windows Phone 7 et 8

navigator.notification.vibrateWithPattern,  
navigator.notification.cancelVibration - Android

## notification.vibrate

Vibre l'appareil pendant un certain temps.

    navigator.notification.vibrate(time)
    

*   **temps**: millisecondes à vibrer l'appareil. *(Nombre)*

### Exemple

    // Vibrate for 2.5 seconds
    navigator.notification.vibrate(2500);
    

### iOS Quirks

*   **temps**: ne tient pas compte de la durée spécifiée et vibre pendant un temps prédéterminé.
    
        navigator.notification.vibrate();
        navigator.notification.vibrate(2500);   // 2500 is ignored
        

## notification.vibrateWithPattern

Vibre l'appareil avec un modèle donné.

    navigator.notification.vibrateWithPattern(pattern, repeat)
    

*   **modèle**: séquence de la durée (en millisecondes) pour lequel activer ou désactiver le vibreur. *(Tableau de nombres)*
*   **répéter**: optionnel index dans le tableau de configuration à laquelle commencer à répéter (répétera jusqu'à annulation), ou -1 pour aucune répétition (par défaut). *(Nombre)*

### Exemple

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

Immédiatement annule des vibrations en cours d'exécution.

    navigator.notification.cancelVibration()