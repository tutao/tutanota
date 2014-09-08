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

Dieses Plugin definiert eine globale `device` -Objekt, das des Geräts Hard- und Software beschreibt. Das Objekt im globalen Gültigkeitsbereich ist es zwar nicht verfügbar bis nach dem `deviceready` Ereignis.

    document.addEventListener("deviceready", onDeviceReady, false);
    function onDeviceReady() {
        console.log(device.cordova);
    }
    

## Installation

    cordova plugin add org.apache.cordova.device
    

## Eigenschaften

*   device.cordova
*   device.model
*   device.name
*   device.platform
*   device.uuid
*   device.version

## device.cordova

Rufen Sie die Version von Cordova, die auf dem Gerät ausgeführt.

### Unterstützte Plattformen

*   Amazon Fire OS
*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Tizen
*   Windows Phone 7 und 8
*   Windows 8

## device.model

Die `device.model` gibt den Namen der Modell- oder des Geräts zurück. Der Wert wird vom Gerätehersteller festgelegt und kann zwischen den Versionen des gleichen Produkts unterschiedlich sein.

### Unterstützte Plattformen

*   Android
*   BlackBerry 10
*   iOS
*   Tizen
*   Windows Phone 7 und 8
*   Windows 8

### Kleines Beispiel

    / / Android: Nexus One gibt "Passion" (Nexus One Codename) / / Motorola Droid returns "Wühlmäuse" / / BlackBerry: Torch 9800 gibt "9800" / / iOS: für das iPad Mini gibt iPad2, 5; iPhone 5 ist iPhone 5,1. Finden Sie unter http://theiphonewiki.com/wiki/index.php?title=Models / / Var-Modell = device.model;
    

### Android Macken

*   Ruft den [Produktname][1] anstelle des [Modellnamens][2], das ist oft der Codename für die Produktion. Beispielsweise das Nexus One gibt `Passion` , und Motorola Droid gibt`voles`.

 [1]: http://developer.android.com/reference/android/os/Build.html#PRODUCT
 [2]: http://developer.android.com/reference/android/os/Build.html#MODEL

### Tizen Macken

*   Gibt z. B. das Gerätemodell von dem Kreditor zugeordnet,`TIZEN`

### Windows Phone 7 und 8 Macken

*   Gibt das vom Hersteller angegebenen Gerätemodell zurück. Beispielsweise gibt der Samsung-Fokus`SGH-i917`.

## device.name

**Warnung**: `device.name` ist ab Version 2.3.0 veraltet. Verwendung `device.model` statt.

## device.platform

Name des Betriebssystems des Geräts zu erhalten.

    var string = device.platform;
    

### Unterstützte Plattformen

*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Tizen
*   Windows Phone 7 und 8
*   Windows 8

### Kleines Beispiel

    // Depending on the device, a few examples are:
    //   - "Android"
    //   - "BlackBerry 10"
    //   - "iOS"
    //   - "WinCE"
    //   - "Tizen"
    var devicePlatform = device.platform;
    

### Windows Phone 7 Macken

Windows Phone 7 Geräte melden die Plattform als`WinCE`.

### Windows Phone 8 Macken

Windows Phone 8 Geräte melden die Plattform als`Win32NT`.

## device.uuid

Des Geräts Universally Unique Identifier ([UUID][3] zu erhalten).

 [3]: http://en.wikipedia.org/wiki/Universally_Unique_Identifier

    var string = device.uuid;
    

### Beschreibung

Die Details wie eine UUID generiert wird werden vom Gerätehersteller und beziehen sich auf die Plattform oder das Modell des Geräts.

### Unterstützte Plattformen

*   Android
*   BlackBerry 10
*   iOS
*   Tizen
*   Windows Phone 7 und 8
*   Windows 8

### Kleines Beispiel

    / / Android: wird eine zufällige 64-Bit-Ganzzahl (als Zeichenfolge, wieder!) / / die ganze Zahl wird beim ersten Start des Geräts erzeugt / / / / BlackBerry: gibt die PIN-Nummer des Gerätes / / Dies ist eine neunstellige eindeutige Ganzzahl (als String, obwohl!) / / / / iPhone: (paraphrasiert aus der Dokumentation zur UIDevice-Klasse) / / liefert eine Reihe von Hash-Werte, die aus mehreren Hardware erstellt identifiziert.
    / / Es ist gewährleistet, dass für jedes Gerät eindeutig sein und kann nicht gebunden werden / / an den Benutzer weitergeleitet.
    / / Windows Phone 7: gibt einen Hash des Gerät + aktueller Benutzer, / / wenn der Benutzer nicht definiert ist, eine Guid generiert und wird weiter bestehen, bis die app deinstalliert wird / / Tizen: gibt das Gerät IMEI (International Mobile Equipment Identity oder IMEI ist eine Zahl / / einzigartig für jedes GSM- und UMTS-Handy.
    var deviceID = device.uuid;
    

### iOS Quirk

Die `uuid` auf iOS ist nicht eindeutig auf ein Gerät, aber für jede Anwendung, für jede Installation variiert. Es ändert sich, wenn Sie löschen und neu die app installieren, und möglicherweise auch beim iOS zu aktualisieren, oder auch ein Upgrade möglich die app pro Version (scheinbaren in iOS 5.1). Die `uuid` ist kein zuverlässiger Wert.

### Windows Phone 7 und 8 Macken

Die `uuid` für Windows Phone 7 die Berechtigung erfordert `ID_CAP_IDENTITY_DEVICE` . Microsoft wird diese Eigenschaft wahrscheinlich bald abzuschaffen. Wenn die Funktion nicht verfügbar ist, generiert die Anwendung eine persistente Guid, die für die Dauer der Installation der Anwendung auf dem Gerät verwaltet wird.

## device.version

Version des Betriebssystems zu erhalten.

    var string = device.version;
    

### Unterstützte Plattformen

*   Android 2.1 +
*   BlackBerry 10
*   iOS
*   Tizen
*   Windows Phone 7 und 8
*   Windows 8

### Kleines Beispiel

    / / Android: Froyo OS würde "2.2" zurück / / Eclair OS zurückkehren würde, "2.1", "2.0.1" oder "2.0" / / Version kann auch zurückgeben update Level "2.1-update1" / / / / BlackBerry: Torch 9800 mit OS 6.0 würde zurückgeben "6.0.0.600" / / / / iPhone: iOS 3.2 gibt "3.2" / / / / Windows Phone 7: liefert aktuelle OS-Versionsnummer, ex. on Mango returns 7.10.7720
    // Tizen: returns "TIZEN_20120425_2"
    var deviceVersion = device.version;