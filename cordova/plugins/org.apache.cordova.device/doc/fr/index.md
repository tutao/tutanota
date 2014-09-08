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

# org.apache.cordova.device

Ce plugin définit un global `device` objet qui décrit le matériel et les logiciels de l'appareil. Bien que l'objet est dans la portée globale, il n'est pas disponible jusqu'après la `deviceready` événement.

    document.addEventListener("deviceready", onDeviceReady, false);
    function onDeviceReady() {
        console.log(device.cordova);
    }
    

## Installation

    cordova plugin add org.apache.cordova.device
    

## Propriétés

*   device.cordova
*   device.model
*   device.name
*   device.platform
*   device.uuid
*   device.version

## device.cordova

Retourne la version de Cordova en cours d'exécution sur l'appareil.

### Plates-formes prises en charge

*   Amazon Fire OS
*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Paciarelli
*   Windows Phone 7 et 8
*   Windows 8

## device.model

L'objet `device.model` retourne le nom du modèle de l'appareil/produit. Cette valeur est définie par le fabricant du périphérique et peut varier entre les différentes versions d'un même produit.

### Plates-formes prises en charge

*   Android
*   BlackBerry 10
*   iOS
*   Paciarelli
*   Windows Phone 7 et 8
*   Windows 8

### Petit exemple

    // Android : pour un Nexus One, la valeur retournée est "Passion" (le nom de code du Nexus One)
    // pour un Motorola Droid, la valeur retournée est "voles"
    // BlackBerry : pour un Torch 9800, la valeur retournée est "9800"
    // iOS : pour un iPad Mini et un iPhone 5, les valeurs retournées sont "iPad2,5" et "iPhone 5,1" respectivement. Voir http://theiphonewiki.com/wiki/index.php?title=Models
    //
    var model = device.model;
    

### Quirks Android

*   Retourne le [nom du produit][1] au lieu du [nom du modèle][2], ce qui équivaut souvent au nom de code de production. Par exemple, `Passion` pour le Nexus One et `voles` pour le Motorola Droid.

 [1]: http://developer.android.com/reference/android/os/Build.html#PRODUCT
 [2]: http://developer.android.com/reference/android/os/Build.html#MODEL

### Bizarreries de paciarelli

*   Retourne le modèle du dispositif, assigné par le vendeur, par exemple `TIZEN`

### Windows Phone 7 et 8 Quirks

*   Retourne le modèle de l'appareil spécifié par le fabricant. Par exemple `SGH-i917` pour le Samsung Focus.

## device.name

**Avertissement**: `device.name` est obsolète depuis la version 2.3.0. Utilisation `device.model` à la place.

## device.platform

Retourne le nom du système d'exploitation de l'appareil.

    var string = device.platform;
    

### Plates-formes prises en charge

*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Paciarelli
*   Windows Phone 7 et 8
*   Windows 8

### Petit exemple

    // Depending on the device, a few examples are:
    //   - "Android"
    //   - "BlackBerry 10"
    //   - "iOS"
    //   - "WinCE"
    //   - "Tizen"
    var devicePlatform = device.platform;
    

### Windows Phone 7 Quirks

Le nom de plate-forme retourné pour les appareils sous Windows Phone 7 est `WinCE`.

### Notes au sujet de Windows Phone 8

Le nom de plate-forme retourné pour les appareils sous Windows Phone 8 est `Win32NT`.

## device.uuid

Retourne l'Identifiant Unique Universel de l'appareil ([UUID][3]).

 [3]: http://en.wikipedia.org/wiki/Universally_Unique_Identifier

    var string = device.uuid;
    

### Description

La façon dont est généré l'UUID est déterminée par le fabricant et est spécifique à la plate-forme ou le modèle de l'appareil.

### Plates-formes prises en charge

*   Android
*   BlackBerry 10
*   iOS
*   Paciarelli
*   Windows Phone 7 et 8
*   Windows 8

### Petit exemple

    // Android : retourne un nombre entier 64-bit aléatoire (sous la forme d'une chaîne de caractères, encore !)
    // Ce nombre entier est généré lors du premier démarrage de l'appareil
    //
    // BlackBerry : retourne le numéro PIN de l'appareil
    // Il s'agit d'un nombre entier unique à neuf chiffres (sous la forme d'une chaîne de caractères cependant !)
    //
    // iPhone : (copié depuis la documentation de la classe UIDevice)
    // Retourne une chaîne de caractères générée à partir de plusieurs caractéristiques matérielles.
    / / Il est garanti pour être unique pour chaque appareil et ne peut pas être lié / / pour le compte d'utilisateur.
    // Windows Phone 7 : retourne un hashage généré à partir de appareil+utilisateur actuel,
    // si aucun utilisateur n'est défini, un guid est généré persistera jusqu'à ce que l'application soit désinstallée
    // Tizen : retourne le numéro IMEI (International Mobile Equipment Identity) de l'appareil, ce numéro est
    // unique pour chaque téléphone GSM et UMTS.
    var deviceID = device.uuid;
    

### Spécificités iOS

Sur iOS, l'`uuid` n'est pas propre à un appareil mais varie pour chaque application et pour chaque installation d'une même application. Elle change si vous supprimez, puis réinstallez l'application, et éventuellement aussi quand vous mettre à jour d'iOS, ou même mettre à jour le soft par version (apparent dans iOS 5.1). Par conséquent, l'`uuid` n'est pas considéré comme fiable.

### Windows Phone 7 et 8 Quirks

Sous Windows Phone 7, l'autorisation `ID_CAP_IDENTITY_DEVICE` est requise afin d'accéder à l'`uuid`. Microsoft va probablement bientôt rendre cette propriété obsolète. Si la fonctionnalité n'est pas accessible, un guid persistant (maintenu pendant toute la durée de l'installation de l'application sur l'appareil) est généré.

## device.version

Retourne la version du système d'exploitation de l'appareil.

    var string = device.version;
    

### Plates-formes prises en charge

*   Android 2.1+
*   BlackBerry 10
*   iOS
*   Paciarelli
*   Windows Phone 7 et 8
*   Windows 8

### Petit exemple

    // Android : Froyo OS renvoie "2.2"
    // Eclair OS renvoie "2.1", "2.0.1", ou "2.0"
    // Peut également renvoyer par exemple "2.1-update1"
    //
    // BlackBerry : Torch 9800 sous OS 6.0 renvoie "6.0.0.600"
    //
    // iPhone : iOS 3.2 renvoie "3.2"
    //
    // Windows Phone 7 : renvoie la version actuelle de l'OS, par exemple on Mango returns 7.10.7720
    // Tizen: returns "TIZEN_20120425_2"
    var deviceVersion = device.version;