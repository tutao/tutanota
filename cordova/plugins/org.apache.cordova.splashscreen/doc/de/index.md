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

# org.apache.cordova.splashscreen

Dieses Plugin zeigt und verbirgt einen Splash-Screen beim Start der Anwendung.

## Installation

    cordova plugin add org.apache.cordova.splashscreen
    

## Unterstützte Plattformen

*   Amazon Fire OS
*   Android
*   BlackBerry 10
*   iOS
*   Windows Phone 7 und 8
*   Windows 8

## Methoden

*   SplashScreen.Show
*   SplashScreen.Hide

### Android Eigenarten

Sie müssen in der config.xml folgende Einstellungen vornehmen:

`<preference name="SplashScreen" value="foo" />` `<preference name="SplashScreenDelay" value="10000" />`

"foo" stellt hierbei den Namen der SplashScreen-Datei dar. Vorzugsweise ist dies ein "9-Patch-File". Stellen Sie sicher, dass Sie die erforderlichen Dateien für den SplashScreen auch Ihrem Res/XML-Verzeichnis hinzufügen und dorthin kopieren. Der zweite Parameter stellt dar, wie lange der SplashScreen in Millisekunden angezeigt wird. Standardmäßig beträgt dieser Wert 3000ms. Weitere Informationen finden Sie unter [Symbole und Splash-Screens][1] .

 [1]: http://cordova.apache.org/docs/en/edge/config_ref_images.md.html

## SplashScreen.Hide

Schließen Sie den Splash-Screen.

    navigator.splashscreen.hide();
    

### BlackBerry 10, WP8, iOS Eigenarten

Der in der `config.xml` enthaltene Befehl `AutoHideSplashScreen` muss auf `false` gesetzt sein. Um das Verstecken des SplashScreens um zwei Sekunden zu verzögern, können Sie einen Countdown in den `deviceready` -Eventhändler wie folgt integrieren:

        setTimeout(function() {
            navigator.splashscreen.hide();
        }, 2000);
    

## SplashScreen.Show

Zeigt den SplashScreen.

    navigator.splashscreen.show();
    

Ihre Anwendung kann die Funktion `navigator.splashscreen.show()` nicht aufrufen, bis die App vollständig gestartet, und das `deviceready` -Event ausgelöst wurde. Aber da der SplashScreen eigentlich beabsichtigt, bereits vor dem vollständigen Laden der App sichtbar zu sein, würde dies die eigentliche Funktion des SplashScreens sinnlos machen. Vorausgesetzt von einigen Konfigurationen in der `config.xml` wird der Splashscreen also dennoch unmittelbar nach dem Laden der App gestartet `show` noch bevor das `deviceready` -Event ausgelöst wurde. Weitere Informationen zu dieser Konfiguration finden Sie unter [Symbole und Splash-Screens][1] . Aus diesem Grund ist es unpassend, dass Sie die Funktion `navigator.splashscreen.show()` aufrufen müssen, denn der Splashscreen erscheint unverzüglich nach dem Starten der App.