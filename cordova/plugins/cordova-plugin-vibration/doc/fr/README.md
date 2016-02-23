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

Ce plugin s'aligne avec le W3C vibration spécification http://www.w3.org/TR/vibration/

Ce plugin permet de vibrer l'appareil.

Ce plugin définit notamment des objets globaux`navigator.vibrate`.

Bien que dans la portée globale, ils ne sont pas disponibles jusqu'après la `deviceready` événement.

    document.addEventListener (« deviceready », onDeviceReady, false) ;
    function onDeviceReady() {console.log(navigator.vibrate);}
    

## Installation

    cordova plugin add cordova-plugin-vibration
    

## Plates-formes supportées

navigator.vibrate,  
navigator.notification.vibrate - Amazon Fire OS - Android - BlackBerry 10 - Firefox OS - iOS - Windows Phone 7 and 8 - Windows (Windows Phone 8.1 devices only)

navigator.notification.vibrateWithPattern  
navigator.notification.cancelVibration - Android - Windows Phone 8 - Windows (Windows Phone 8.1 devices only)

## vibrer (recommandée)

Cette fonction a trois différentes fonctionnalités basées sur les paramètres passés à elle.

### Norme vibrer

Vibre l'appareil pendant un certain temps.

    Navigator.VIBRATE(Time)
    

ou

    Navigator.VIBRATE([time])
    

-**temps**: millisecondes à vibrer l'appareil. *(Nombre)*

#### Exemple

    Vibrer pour 3 secondes navigator.vibrate(3000) ;
    
    Vibrer pour 3 secondes navigator.vibrate([3000]) ;
    

#### Notes au sujet d'iOS

  * **temps**: ne tient pas compte de la durée spécifiée et vibre pendant un temps prédéterminé.
    
    navigator.vibrate(3000); // 3000 is ignored

#### Windows et les bizarreries de Blackberry

  * **temps**: temps Max est 5000ms (5 s) et heure min est de 1 ms
    
    navigator.vibrate(8000); // will be truncated to 5000

### Vibrer avec un motif (Android et Windows uniquement)

Vibre l'appareil avec un motif donné

    Navigator.VIBRATE(Pattern) ;   
    

  * **modèle**: séquence de la durée (en millisecondes) pour lequel activer ou désactiver le vibreur. *(Tableau de nombres)*

#### Exemple

    Vibreur pendant 1 seconde / / attendre 1 seconde / / vibrer pendant 3 secondes / / attendre 1 seconde / / vibrer pour 5 secondes navigator.vibrate ([1000, 1000, 3000, 1000, 5000]) ;
    

#### Notes au sujet de Windows Phone 8

  * chutes de VIBRATE(Pattern) retour à vibrent avec durée par défaut

#### Bizarreries de Windows

  * chutes de VIBRATE(Pattern) retour à vibrent avec durée par défaut

### Annuler les vibrations (ne pas de prise en charge d'iOS)

Immédiatement annule des vibrations en cours d'exécution.

    Navigator.VIBRATE(0)
    

ou

    Navigator.VIBRATE([])
    

ou

    Navigator.VIBRATE([0])
    

En passant un paramètre de 0, un tableau vide, ou un tableau contenant un seul élément de valeur 0 annulera toute vibration.

## *notification.VIBRATE (obsolète)

Vibre l'appareil pendant un certain temps.

    Navigator.notification.VIBRATE(Time)
    

  * **temps**: millisecondes à vibrer l'appareil. *(Nombre)*

### Exemple

    Vibrer pour 2,5 secondes navigator.notification.vibrate(2500) ;
    

### Notes au sujet d'iOS

  * **temps**: ne tient pas compte de la durée spécifiée et vibre pendant un temps prédéterminé.
    
        Navigator.notification.VIBRATE() ;
        Navigator.notification.VIBRATE(2500) ;   2500 est ignoré
        

## *notification.vibrateWithPattern (obsolète)

Vibre l'appareil avec un modèle donné.

    navigator.notification.vibrateWithPattern (motif)
    

  * **modèle**: séquence de la durée (en millisecondes) pour lequel activer ou désactiver le vibreur. *(Tableau de nombres)*
  * **répéter**: optionnel index dans le tableau de configuration à laquelle commencer à répéter (répétera jusqu'à annulation), ou -1 pour aucune répétition (par défaut). *(Nombre)*

### Exemple

    Commencent immédiatement à vibrer / / vibrer de 100ms, / / attendre 100ms, / / vibrer pour 200ms, / / attendre 100ms, / / vibrer pour 400ms, / / attendre 100ms, / / vibrer pour 800ms, / / (ne pas répéter) navigator.notification.vibrateWithPattern ([0, 100, 100, 200, 100, 400, 100, 800]) ;
    

## *notification.cancelVibration (obsolète)

Immédiatement annule des vibrations en cours d'exécution.

    navigator.notification.cancelVibration()
    

* Remarque : en raison de l'alignement avec les spécifications w3c, les méthodes étoilées seront progressivement