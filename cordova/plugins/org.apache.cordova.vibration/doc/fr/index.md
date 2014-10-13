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

Ce plugin s'aligne avec le W3C vibration spécification http://www.w3.org/TR/vibration/

Ce plugin permet de vibrer l'appareil.

## Installation

    cordova plugin add org.apache.cordova.vibration
    

## Plates-formes prises en charge

Navigator.VIBRATE  
Navigator.notification.VIBRATE - Amazon Fire OS - Android - BlackBerry 10 - Firefox OS - iOS - Windows Phone 7 et 8

navigator.notification.vibrateWithPattern,  
navigator.notification.cancelVibration - Android

## vibrer (recommandée)

Cette fonction a trois différentes fonctionnalités basées sur les paramètres passés à elle.

### Norme vibrer

Vibre l'appareil pendant un certain temps.

    navigator.vibrate(time)
    

ou

    navigator.vibrate([time])
    

-**temps**: millisecondes à vibrer l'appareil. *(Nombre)*

#### Exemple

    // Vibrate for 3 seconds
    navigator.vibrate(3000);
    
    // Vibrate for 3 seconds
    navigator.vibrate([3000]);
    

#### iOS Quirks

*   **temps**: ne tient pas compte de la durée spécifiée et vibre pendant un temps prédéterminé.
    
    Navigator.VIBRATE(3000) ; 3000 est ignoré

#### Windows et les bizarreries de Blackberry

*   **temps**: temps Max est 5000ms (5 s) et heure min est de 1 ms
    
    Navigator.VIBRATE(8000) ; sera tronquée à 5000

### Vibrer avec un motif (Android et Windows uniquement)

Vibre l'appareil avec un motif donné

    navigator.vibrate(pattern);   
    

*   **modèle**: séquence de la durée (en millisecondes) pour lequel activer ou désactiver le vibreur. *(Tableau de nombres)*

#### Exemple

    // Vibrate for 1 second
    // Wait for 1 second
    // Vibrate for 3 seconds
    // Wait for 1 second
    // Vibrate for 5 seconds
    navigator.vibrate([1000, 1000, 3000, 1000, 5000]);
    

### Annuler les vibrations (ne pas de prise en charge d'iOS)

Immédiatement annule des vibrations en cours d'exécution.

    navigator.vibrate(0)
    

ou

    navigator.vibrate([])
    

ou

    navigator.vibrate([0])
    

En passant un paramètre de 0, un tableau vide, ou un tableau contenant un seul élément de valeur 0 annulera toute vibration.

## *notification.VIBRATE (obsolète)

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
        

## *notification.vibrateWithPattern (obsolète)

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
    

## *notification.cancelVibration (obsolète)

Immédiatement annule des vibrations en cours d'exécution.

    navigator.notification.cancelVibration()
    

* Remarque : en raison de l'alignement avec les spécifications w3c, les méthodes étoilées seront progressivement