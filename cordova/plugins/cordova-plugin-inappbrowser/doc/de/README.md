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

# cordova-plugin-inappbrowser

[![Build Status](https://travis-ci.org/apache/cordova-plugin-inappbrowser.svg)](https://travis-ci.org/apache/cordova-plugin-inappbrowser)

Dieses Plugin bietet eine Web-Browser-Ansicht, die beim Aufruf von `cordova.InAppBrowser.open()`.

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    

Die `cordova.InAppBrowser.open()` Funktion ist definiert als Ersatz für die `window.open()` Funktion. InAppBrowser Fenster, können vorhandene `window.open()` Aufrufe durch window.open ersetzen:

    window.open = cordova.InAppBrowser.open;
    

Das InAppBrowser-Fenster verhält sich wie einen standard-Webbrowser und Cordova APIs kann nicht zugegriffen werden kann. Aus diesem Grund empfiehlt sich die InAppBrowser Wenn Sie von Drittanbietern (nicht vertrauenswürdige) Inhalte, statt zu laden, die in den wichtigsten Cordova Webview laden müssen. Die InAppBrowser unterliegt nicht der weißen Liste, noch ist Links in der Systembrowser öffnen.

Die InAppBrowser bietet standardmäßig eine eigene GUI-Steuerelemente für den Benutzer (zurück, vor, erledigt).

Für rückwärts Kompatibilität, dieses Plugin auch `window.open` Haken. Jedoch kann der Plugin installiert Haken der `window.open` haben unbeabsichtigte Nebenwirkungen (vor allem, wenn dieses Plugin nur als eine Abhängigkeit von einem anderen Plugin enthalten ist). Der Haken der `window.open` wird in einer zukünftigen Version entfernt. Bis der Haken aus dem Plugin entfernt wird, können die Vorgabe von apps manuell wiederherstellen:

    delete window.open // Reverts the call back to it's prototype's default
    

`window.open` im globalen Gültigkeitsbereich ist zwar InAppBrowser nicht verfügbar bis nach dem `deviceready`-Ereignis.

    document.addEventListener("deviceready", onDeviceReady, false);
    function onDeviceReady() {
        console.log("window.open works well");
    }
    

## Installation

    cordova plugin add cordova-plugin-inappbrowser
    

Wenn Sie alle Seite Lasten in Ihrer Anwendung durch die InAppBrowser gehen möchten, können Sie einfach `window.open` während der Initialisierung Haken. Zum Beispiel:

    document.addEventListener("deviceready", onDeviceReady, false);
    function onDeviceReady() {
        window.open = cordova.InAppBrowser.open;
    }
    

## cordova.InAppBrowser.open

Öffnet eine URL in eine neue `InAppBrowser`-Instanz, die aktuelle Browserinstanz oder der Systembrowser.

    var ref = cordova.InAppBrowser.open(url, target, options);
    

  * **Ref**: Bezugnahme auf das `InAppBrowser` Fenster. *(InAppBrowser)*

  * **URL**: die URL um den *(String)* zu laden. Rufen Sie `encodeURI()` auf, wenn die URL Unicode-Zeichen enthält.

  * **target**: das Ziel in welchem die URL geladen werden soll. Standardmäßig entspricht dieser Wert `_self` . *(String)*
    
      * `_self`: Öffnet sich in der Cordova WebView wenn der URL in der Whitelist ist, andernfalls es öffnet sich in der`InAppBrowser`.
      * `_blank`: Öffnet den`InAppBrowser`.
      * `_system`: Öffnet in den System-Web-Browser.

  * **options**: Optionen für die `InAppBrowser` . Optional, säumige an: `location=yes` . *(String)*
    
    Die `options` Zeichenfolge muss keine Leerstelle enthalten, und jede Funktion Name/Wert-Paare müssen durch ein Komma getrennt werden. Featurenamen Groß-/Kleinschreibung. Alle Plattformen unterstützen die anderen Werte:
    
      * **location**: Legen Sie auf `yes` oder `no` , machen die `InAppBrowser` der Adressleiste ein- oder ausschalten.
    
    Nur Android:
    
      * **hidden**: Legen Sie auf `yes` um den Browser zu erstellen und laden Sie die Seite, aber nicht zeigen. Das Loadstop-Ereignis wird ausgelöst, wenn der Ladevorgang abgeschlossen ist. Weglassen oder auf `no` (Standard), den Browser öffnen und laden normalerweise zu haben.
      * **clearcache**: Legen Sie auf `yes` , der Browser ist Cookiecache gelöscht, bevor das neue Fenster geöffnet wird
      * **clearsessioncache**: Legen Sie auf `yes` zu der Session Cookie Cache gelöscht, bevor das neue Fenster geöffnet wird
      * **zoom**: Legen Sie auf `yes` zu zeigen Android Browser-Zoom-Steuerelementen, die auf `no` festlegen, um sie zu verbergen. Standardwert ist `yes`.
      * **hardwareback**: auf `yes` festlegen, um die Zurück-Taste verwenden, um die `InAppBrowser`Geschichte rückwärts navigieren. Wenn es keine vorherige Seite, wird der `InAppBrowser` geschlossen. Der Standardwert ist `yes`, so dass Sie es auf `no` festlegen müssen, wenn Sie die Schaltfläche "zurück", die InAppBrowser einfach zu schließen möchten.
    
    iOS nur:
    
      * **closebuttoncaption**: Legen Sie auf eine Zeichenfolge als Beschriftung der **fertig** -Schaltfläche verwenden. Beachten Sie, dass Sie diesen Wert selbst zu lokalisieren müssen.
      * **disallowoverscroll**: Legen Sie auf `yes` oder `no` (Standard ist `no` ). Aktiviert/deaktiviert die UIWebViewBounce-Eigenschaft.
      * **hidden**: Legen Sie auf `yes` um den Browser zu erstellen und laden Sie die Seite, aber nicht zeigen. Das Loadstop-Ereignis wird ausgelöst, wenn der Ladevorgang abgeschlossen ist. Weglassen oder auf `no` (Standard), den Browser öffnen und laden normalerweise zu haben.
      * **clearcache**: Legen Sie auf `yes` , der Browser ist Cookiecache gelöscht, bevor das neue Fenster geöffnet wird
      * **clearsessioncache**: Legen Sie auf `yes` zu der Session Cookie Cache gelöscht, bevor das neue Fenster geöffnet wird
      * **toolbar**: Legen Sie auf `yes` oder `no` Aktivieren Sie die Symbolleiste ein- oder Ausschalten für InAppBrowser (Standard:`yes`)
      * **enableViewportScale**: Legen Sie auf `yes` oder `no` , Viewport Skalierung durch ein Meta-Tag (standardmäßig zu verhindern`no`).
      * **mediaPlaybackRequiresUserAction**: Legen Sie auf `yes` oder `no` , HTML5 audio oder video von automatisches Abspielen (standardmäßig zu verhindern`no`).
      * **allowInlineMediaPlayback**: Legen Sie auf `yes` oder `no` Inline-HTML5-Media-Wiedergabe, Darstellung im Browser-Fenster, sondern in eine gerätespezifische Wiedergabe-Schnittstelle ermöglichen. Des HTML `video` Element muss auch die `webkit-playsinline` Attribut (Standard:`no`)
      * **keyboardDisplayRequiresUserAction**: Legen Sie auf `yes` oder `no` um die Tastatur zu öffnen, wenn Formularelemente Fokus per JavaScript erhalten `focus()` Anruf (Standard:`yes`).
      * **suppressesIncrementalRendering**: Legen Sie auf `yes` oder `no` zu warten, bis alle neuen anzeigen-Inhalte empfangen wird, bevor Sie wiedergegeben wird (standardmäßig`no`).
      * **presentationstyle**: Legen Sie auf `pagesheet` , `formsheet` oder `fullscreen` [Präsentationsstil](http://developer.apple.com/library/ios/documentation/UIKit/Reference/UIViewController_Class/Reference/Reference.html#//apple_ref/occ/instp/UIViewController/modalPresentationStyle) (standardmäßig fest`fullscreen`).
      * **transitionstyle**: Legen Sie auf `fliphorizontal` , `crossdissolve` oder `coververtical` [Übergangsstil](http://developer.apple.com/library/ios/#documentation/UIKit/Reference/UIViewController_Class/Reference/Reference.html#//apple_ref/occ/instp/UIViewController/modalTransitionStyle) (standardmäßig fest`coververtical`).
      * **toolbarposition**: Legen Sie auf `top` oder `bottom` (Standard ist `bottom` ). Bewirkt, dass die Symbolleiste am oberen oder unteren Rand des Fensters sein.
    
    Nur Windows:
    
      * **hidden**: Legen Sie auf `yes` um den Browser zu erstellen und laden Sie die Seite, aber nicht zeigen. Das Loadstop-Ereignis wird ausgelöst, wenn der Ladevorgang abgeschlossen ist. Weglassen oder auf `no` (Standard), den Browser öffnen und laden normalerweise zu haben.
      * **fullscreen**: auf `yes` festlegen, um das WebBrowser-Steuerelement ohne Rahmen drumherum zu erstellen. Bitte beachten Sie, dass bei **location=no** wird auch angegeben, gibt es keine Kontrolle, die Benutzer zum IAB-Fenster schließen.

### Unterstützte Plattformen

  * Amazon Fire OS
  * Android
  * BlackBerry 10
  * Firefox OS
  * iOS
  * Windows 8 und 8.1
  * Windows Phone 7 und 8
  * Browser

### Beispiel

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    var ref2 = cordova.InAppBrowser.open(encodeURI('http://ja.m.wikipedia.org/wiki/ハングル'), '_blank', 'location=yes');
    

### Firefox OS Macken

Als Plugin jedes Design erzwingen nicht besteht die Notwendigkeit, einige CSS-Regeln hinzuzufügen, wenn bei `target='_blank'`. Die Regeln könnte wie diese aussehen.

```css
.inAppBrowserWrap {
  background-color: rgba(0,0,0,0.75);
  color: rgba(235,235,235,1.0);
}
.inAppBrowserWrap menu {
  overflow: auto;
  list-style-type: none;
  padding-left: 0;
}
.inAppBrowserWrap menu li {
  font-size: 25px;
  height: 25px;
  float: left;
  margin: 0 10px;
  padding: 3px 10px;
  text-decoration: none;
  color: #ccc;
  display: block;
  background: rgba(30,30,30,0.50);
}
.inAppBrowserWrap menu li.disabled {
    color: #777;
}
```

### Windows-Eigenheiten

Ähnlich wie Firefox OS IAB Fenster visuelle Verhalten kann überschrieben werden, über `InAppBrowserWrap`/`InAppBrowserWrapFullscreen` -CSS-Klassen

### Browser-Eigenheiten

  * Plugin wird per Iframe implementiert,

  * Navigationsverlauf (Schaltflächen`zurück` und `Vorwärts` in LocationBar) ist nicht implementiert.

## InAppBrowser

Bei einem Aufruf von `cordova.InAppBrowser.open` zurückgegebene Objekt..

### Methoden

  * addEventListener
  * removeEventListener
  * Schließen
  * Karte
  * executeScript
  * insertCSS

## addEventListener

> Fügt einen Listener für eine Veranstaltung aus der`InAppBrowser`.

    ref.addEventListener(eventname, callback);
    

  * **Ref**: Bezugnahme auf die `InAppBrowser` Fenster *(InAppBrowser)*

  * **EventName**: das Ereignis zu warten *(String)*
    
      * **Loadstart**: Ereignis wird ausgelöst, wenn die `InAppBrowser` beginnt, eine URL zu laden.
      * **Loadstop**: Ereignis wird ausgelöst, wenn der `InAppBrowser` beendet ist, eine URL laden.
      * **LoadError**: Ereignis wird ausgelöst, wenn der `InAppBrowser` ein Fehler auftritt, wenn Sie eine URL zu laden.
      * **Ausfahrt**: Ereignis wird ausgelöst, wenn das `InAppBrowser` -Fenster wird geschlossen.

  * **Rückruf**: die Funktion, die ausgeführt wird, wenn das Ereignis ausgelöst wird. Die Funktion übergeben wird ein `InAppBrowserEvent` -Objekt als Parameter.

### InAppBrowserEvent Eigenschaften

  * **Typ**: Eventname, entweder `loadstart` , `loadstop` , `loaderror` , oder `exit` . *(String)*

  * **URL**: die URL, die geladen wurde. *(String)*

  * **Code**: der Fehler-Code, nur im Fall von `loaderror` . *(Anzahl)*

  * **Nachricht**: die Fehlermeldung angezeigt, nur im Fall von `loaderror` . *(String)*

### Unterstützte Plattformen

  * Amazon Fire OS
  * Android
  * iOS
  * Windows 8 und 8.1
  * Windows Phone 7 und 8
  * Browser

### Browser-Eigenheiten

`loadstart` und `loaderror` Ereignisse werden nicht ausgelöst wird.

### Kurzes Beispiel

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    ref.addEventListener('loadstart', function(event) { alert(event.url); });
    

## removeEventListener

> Entfernt einen Listener für eine Veranstaltung aus der`InAppBrowser`.

    ref.removeEventListener(eventname, callback);
    

  * **Ref**: Bezugnahme auf die `InAppBrowser` Fenster. *(InAppBrowser)*

  * **EventName**: das Ereignis zu warten. *(String)*
    
      * **Loadstart**: Ereignis wird ausgelöst, wenn die `InAppBrowser` beginnt, eine URL zu laden.
      * **Loadstop**: Ereignis wird ausgelöst, wenn der `InAppBrowser` beendet ist, eine URL laden.
      * **LoadError**: Ereignis wird ausgelöst, wenn die `InAppBrowser` trifft einen Fehler beim Laden einer URLs.
      * **Ausfahrt**: Ereignis wird ausgelöst, wenn das `InAppBrowser` -Fenster wird geschlossen.

  * **Rückruf**: die Funktion ausgeführt, wenn das Ereignis ausgelöst wird. Die Funktion übergeben wird ein `InAppBrowserEvent` Objekt.

### Unterstützte Plattformen

  * Amazon Fire OS
  * Android
  * iOS
  * Windows 8 und 8.1
  * Windows Phone 7 und 8
  * Browser

### Kurzes Beispiel

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    var myCallback = function(event) { alert(event.url); }
    ref.addEventListener('loadstart', myCallback);
    ref.removeEventListener('loadstart', myCallback);
    

## Schließen

> Schließt die `InAppBrowser` Fenster.

    ref.close();
    

  * **Ref**: Bezugnahme auf die `InAppBrowser` Fenster *(InAppBrowser)*

### Unterstützte Plattformen

  * Amazon Fire OS
  * Android
  * Firefox OS
  * iOS
  * Windows 8 und 8.1
  * Windows Phone 7 und 8
  * Browser

### Kurzes Beispiel

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    ref.close();
    

## Karte

> Zeigt ein InAppBrowser-Fenster, das geöffnet wurde, versteckt. Aufrufen, dies hat keine Auswirkungen, wenn die InAppBrowser schon sichtbar war.

    ref.show();
    

  * **Ref**: Verweis auf die (InAppBrowser) Fenster`InAppBrowser`)

### Unterstützte Plattformen

  * Amazon Fire OS
  * Android
  * iOS
  * Windows 8 und 8.1
  * Browser

### Kurzes Beispiel

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'hidden=yes');
    // some time later...
    ref.show();
    

## executeScript

> Fügt JavaScript-Code in das `InAppBrowser` Fenster

    ref.executeScript(details, callback);
    

  * **Ref**: Bezugnahme auf die `InAppBrowser` Fenster. *(InAppBrowser)*

  * **InjectDetails**: Informationen über das Skript ausgeführt, angeben, entweder ein `file` oder `code` Schlüssel. *(Objekt)*
    
      * **Datei**: URL des Skripts zu injizieren.
      * **Code**: Text des Skripts zu injizieren.

  * **Rückruf**: die Funktion, die ausgeführt wird, nachdem der JavaScript-Code injiziert wird.
    
      * Wenn das eingefügte Skript vom Typ ist `code` , der Rückruf führt mit einen einzelnen Parameter, der der Rückgabewert des Skripts ist, umwickelt ein `Array` . Bei Multi-Line-Skripten ist der Rückgabewert von der letzten Anweisung oder den letzten Ausdruck ausgewertet.

### Unterstützte Plattformen

  * Amazon Fire OS
  * Android
  * iOS
  * Windows 8 und 8.1
  * Browser

### Kurzes Beispiel

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    ref.addEventListener('loadstop', function() {
        ref.executeScript({file: "myscript.js"});
    });
    

### Browser-Eigenheiten

  * **code** -Schlüssel wird unterstützt.

### Windows-Eigenheiten

Aufgrund der [MSDN-Dokumentation](https://msdn.microsoft.com/en-us/library/windows.ui.xaml.controls.webview.invokescriptasync.aspx) das aufgerufene Skript kehren nur Zeichenfolgenwerte, andernfalls des Parameters, an **Rückruf** übergeben werden `[null]`.

## insertCSS

> Injiziert CSS in der `InAppBrowser` Fenster.

    ref.insertCSS(details, callback);
    

  * **Ref**: Bezugnahme auf die `InAppBrowser` Fenster *(InAppBrowser)*

  * **InjectDetails**: Informationen über das Skript ausgeführt, angeben, entweder ein `file` oder `code` Schlüssel. *(Objekt)*
    
      * **Datei**: URL des Stylesheets zu injizieren.
      * **Code**: Text des Stylesheets zu injizieren.

  * **Rückruf**: die Funktion, die ausgeführt wird, nachdem die CSS injiziert wird.

### Unterstützte Plattformen

  * Amazon Fire OS
  * Android
  * iOS
  * Windows

### Kurzes Beispiel

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    ref.addEventListener('loadstop', function() {
        ref.insertCSS({file: "mystyles.css"});
    });