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

Plugin daje widok przeglądarki sieci web, które są wyświetlane podczas wywoływania `cordova.InAppBrowser.open()`.

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    

`cordova.InAppBrowser.open()` funkcja jest definiowana jako zamiennik dla funkcji `window.open()`. Istniejące wywołania `window.open()` służy okno InAppBrowser, zastępując window.open:

    window.open = cordova.InAppBrowser.open;
    

Okna InAppBrowser zachowuje się jak standardowe przeglądarki i nie ma dostępu do API Cordova. Z tego powodu zaleca się InAppBrowser jeśli ty potrzebować wobec ciężar (niezaufanej) treści osób trzecich, a nie że wczytywanie głównym webview Cordova. InAppBrowser nie jest biała, ani nie jest otwieranie linków w przeglądarce systemu.

InAppBrowser zawiera domyślnie kontrole GUI dla użytkownika (tył, przód, zrobić).

Do tyłu zgodności, ten plugin również haki `window.open`. Jednak może mieć zainstalowane wtyczki haka `window.open` niezamierzone skutki uboczne (zwłaszcza, jeśli ten plugin jest włączone tylko jako część innej wtyczki). Hak `window.open` zostaną usunięte w przyszłej wersji głównych. Dopóki hak jest usuwany z wtyczki, aplikacje można ręcznie przywrócić domyślne zachowanie:

    delete window.open // Reverts the call back to it's prototype's default
    

Chociaż `window.open` w globalnym zasięgu, InAppBrowser nie jest dostępne dopiero po zdarzeniu `deviceready`.

    document.addEventListener("deviceready", onDeviceReady, false);
    function onDeviceReady() {
        console.log("window.open works well");
    }
    

## Instalacja

    cordova plugin add cordova-plugin-inappbrowser
    

Jeśli chcesz wszystko stronica ładunki w swojej aplikacji, aby przejść przez InAppBrowser, można po prostu podłączyć `window.open` podczas inicjowania. Na przykład:

    document.addEventListener("deviceready", onDeviceReady, false);
    function onDeviceReady() {
        window.open = cordova.InAppBrowser.open;
    }
    

## cordova.InAppBrowser.open

Otwiera URL w nowe wystąpienie `InAppBrowser`, bieżące wystąpienie przeglądarki lub przeglądarki systemu.

    var ref = cordova.InAppBrowser.open(url, target, options);
    

  * **ref**: odniesienie do `InAppBrowser` okna. *(InAppBrowser)*

  * **adres**: adres URL do ładowania *(ciąg)*. Wywołanie `encodeURI()` na to, czy adres URL zawiera znaki Unicode.

  * **miejsce docelowe**: miejsce docelowe, w którym wobec ciężar ten URL parametr opcjonalny, który domyślnie `_self` . *(String)*
    
      * `_self`: Otwiera w Cordova WebView, jeśli adres URL jest na białej liście, inaczej ono otwiera w`InAppBrowser`.
      * `_blank`: Otwiera w`InAppBrowser`.
      * `_system`: Otwiera w przeglądarce internetowej systemu.

  * **Opcje**: opcje dla `InAppBrowser` . Opcjonalnie, nie stawiła się: `location=yes` . *(String)*
    
    `options`Ciąg nie może zawierać żadnych spacji, i pary nazwa/wartość każdej funkcji muszą być oddzielone przecinkami. Nazwy funkcji jest rozróżniana. Wszystkich platform obsługuje wartości poniżej:
    
      * **Lokalizacja**: zestaw `yes` lub `no` Aby włączyć `InAppBrowser` na pasek lub wyłączyć.
    
    Android:
    
      * **ukryte**: zestaw `yes` do stworzenia przeglądarki i ładowania strony, ale nie pokazuje go. Loadstop zdarzenie fires po zakończeniu ładowania. Pominąć lub zestaw `no` (domyślnie) do przeglądarki otworzyć i załadować normalnie.
      * **ClearCache**: zestaw `yes` do przeglądarki w pamięci podręcznej plików cookie wyczyszczone zanim otworzy się nowe okno
      * **clearsessioncache**: zestaw `yes` mieć w pamięci podręcznej plików cookie sesji wyczyszczone zanim otworzy się nowe okno
      * **zoom**: `yes` aby pokazać formantami powiększania Android przeglądarka, ustawiona na `nie` aby je ukryć. Wartość domyślna to `tak`.
      * **hardwareback**: zestaw do `yes` , aby użyć przycisk Wstecz sprzętu do nawigacji wstecz historii `InAppBrowser`. Jeśli nie ma żadnej poprzedniej strony, `InAppBrowser` zostanie zamknięta. Wartością domyślną jest `yes`, więc należy ustawić ją na `no` jeśli chcesz przycisk Wstecz, aby po prostu zamknąć InAppBrowser.
    
    tylko iOS:
    
      * **closebuttoncaption**: aby użyć jak **zrobić** przycisk Podpis ustawiona na ciąg. Należy pamiętać, że trzeba zlokalizować tę wartość siebie.
      * **disallowoverscroll**: zestaw `yes` lub `no` (domyślnie `no` ). Włącza/wyłącza właściwość UIWebViewBounce.
      * **ukryte**: zestaw `yes` do stworzenia przeglądarki i ładowania strony, ale nie pokazuje go. Loadstop zdarzenie fires po zakończeniu ładowania. Pominąć lub zestaw `no` (domyślnie) do przeglądarki otworzyć i załadować normalnie.
      * **ClearCache**: zestaw `yes` do przeglądarki w pamięci podręcznej plików cookie wyczyszczone zanim otworzy się nowe okno
      * **clearsessioncache**: zestaw `yes` mieć w pamięci podręcznej plików cookie sesji wyczyszczone zanim otworzy się nowe okno
      * **pasek narzędzi**: zestaw `yes` lub `no` Aby włączyć pasek narzędzi lub wyłączyć dla InAppBrowser (domyślnie`yes`)
      * **enableViewportScale**: zestaw `yes` lub `no` Aby zapobiec rzutni skalowanie za pomocą tagu meta (domyślnie`no`).
      * **mediaPlaybackRequiresUserAction**: zestaw `yes` lub `no` Aby zapobiec HTML5 audio lub wideo z Autoodtwarzanie (domyślnie`no`).
      * **allowInlineMediaPlayback**: zestaw `yes` lub `no` Aby w linii HTML5 odtwarzanie, wyświetlanie w oknie przeglądarki, a nie interfejs odtwarzanie specyficzne dla urządzenia. HTML `video` również musi zawierać element `webkit-playsinline` atrybut (domyślnie`no`)
      * **keyboardDisplayRequiresUserAction**: zestaw `yes` lub `no` Aby otworzyć klawiaturę ekranową, gdy elementy formularza ostrości za pomocą JavaScript `focus()` połączenia (domyślnie`yes`).
      * **suppressesIncrementalRendering**: zestaw `yes` lub `no` czekać, aż wszystkie nowe widok zawartości jest otrzymane przed renderowany (domyślnie`no`).
      * **presentationstyle**: zestaw `pagesheet` , `formsheet` lub `fullscreen` Aby ustawić [styl prezentacji](http://developer.apple.com/library/ios/documentation/UIKit/Reference/UIViewController_Class/Reference/Reference.html#//apple_ref/occ/instp/UIViewController/modalPresentationStyle) (domyślnie`fullscreen`).
      * **transitionstyle**: zestaw `fliphorizontal` , `crossdissolve` lub `coververtical` Aby ustawić [styl przejścia](http://developer.apple.com/library/ios/#documentation/UIKit/Reference/UIViewController_Class/Reference/Reference.html#//apple_ref/occ/instp/UIViewController/modalTransitionStyle) (domyślnie`coververtical`).
      * **toolbarposition**: zestaw `top` lub `bottom` (domyślnie `bottom` ). Powoduje, że pasek ma być na górze lub na dole okna.
    
    Windows tylko:
    
      * **ukryte**: zestaw `yes` do stworzenia przeglądarki i ładowania strony, ale nie pokazuje go. Loadstop zdarzenie fires po zakończeniu ładowania. Pominąć lub zestaw `no` (domyślnie) do przeglądarki otworzyć i załadować normalnie.
      * **fullscreen**: zestaw do `yes` , aby utworzyć formant przeglądarki bez obramowania wokół niego. Należy pamiętać, że jeśli **location=no** również jest określony, nie będzie żadnej kontroli przedstawione do użytkownika, aby zamknąć okno IAB.

### Obsługiwane platformy

  * Amazon Fire OS
  * Android
  * BlackBerry 10
  * Firefox OS
  * iOS
  * Windows 8 i 8.1
  * Windows Phone 7 i 8
  * Przeglądarka

### Przykład

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    var ref2 = cordova.InAppBrowser.open(encodeURI('http://ja.m.wikipedia.org/wiki/ハングル'), '_blank', 'location=yes');
    

### Firefox OS dziwactwa

Jak plugin nie wymuszać każdy projekt to trzeba dodać pewne reguły CSS jeśli otwarty z `target = "_blank"`. Zasady może wyglądać jak te

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

### Windows dziwactwa

Podobne do Firefox OS IAB okno wizualne zachowanie może być zastąpiona przez `inAppBrowserWrap`/`inAppBrowserWrapFullscreen` klas CSS

### Quirks przeglądarki

  * Plugin jest realizowane za pośrednictwem iframe,

  * Historia nawigacji (przyciski`wstecz` i `do przodu` w LocationBar) nie jest zaimplementowana.

## InAppBrowser

Obiekt zwrócony z wywołania `cordova.InAppBrowser.open`.

### Metody

  * metody addEventListener
  * removeEventListener
  * Zamknij
  * Pokaż
  * executeScript
  * insertCSS

## metody addEventListener

> Dodaje detektor zdarzenia z`InAppBrowser`.

    ref.addEventListener(eventname, callback);
    

  * **ref**: odniesienie do `InAppBrowser` okna *(InAppBrowser)*

  * **EventName**: zdarzenie słuchać *(String)*
    
      * **loadstart**: zdarzenie gdy odpalam `InAppBrowser` zaczyna się ładować adresu URL.
      * **loadstop**: zdarzenie gdy odpalam `InAppBrowser` zakończeniu ładowania adresu URL.
      * **LoadError**: zdarzenie odpala gdy `InAppBrowser` napotka błąd podczas ładowania adresu URL.
      * **wyjście**: zdarzenie gdy odpalam `InAppBrowser` okno jest zamknięte.

  * **wywołania zwrotnego**: funkcja, która wykonuje, gdy zdarzenie. Funkcja jest przekazywany `InAppBrowserEvent` obiektu jako parametr.

### Właściwości InAppBrowserEvent

  * **Typ**: eventname, albo `loadstart` , `loadstop` , `loaderror` , lub `exit` . *(String)*

  * **adres**: adres URL, który został załadowany. *(String)*

  * **Kod**: kod błędu, tylko w przypadku `loaderror` . *(Liczba)*

  * **wiadomość**: komunikat o błędzie, tylko w przypadku `loaderror` . *(String)*

### Obsługiwane platformy

  * Amazon Fire OS
  * Android
  * iOS
  * Windows 8 i 8.1
  * Windows Phone 7 i 8
  * Przeglądarka

### Quirks przeglądarki

wydarzenia `loadstart` i `loaderror` nie są być opalane.

### Szybki przykład

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    ref.addEventListener('loadstart', function(event) { alert(event.url); });
    

## removeEventListener

> Usuwa detektor zdarzenia z`InAppBrowser`.

    ref.removeEventListener(eventname, callback);
    

  * **ref**: odniesienie do `InAppBrowser` okna. *(InAppBrowser)*

  * **EventName**: zdarzenie przestanie słuchać. *(String)*
    
      * **loadstart**: zdarzenie gdy odpalam `InAppBrowser` zaczyna się ładować adresu URL.
      * **loadstop**: zdarzenie gdy odpalam `InAppBrowser` zakończeniu ładowania adresu URL.
      * **LoadError**: zdarzenie odpala gdy `InAppBrowser` napotka błąd ładowania adresu URL.
      * **wyjście**: zdarzenie gdy odpalam `InAppBrowser` okno jest zamknięte.

  * **wywołania zwrotnego**: funkcja do wykonania, gdy zdarzenie. Funkcja jest przekazywany `InAppBrowserEvent` obiektu.

### Obsługiwane platformy

  * Amazon Fire OS
  * Android
  * iOS
  * Windows 8 i 8.1
  * Windows Phone 7 i 8
  * Przeglądarka

### Szybki przykład

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    var myCallback = function(event) { alert(event.url); }
    ref.addEventListener('loadstart', myCallback);
    ref.removeEventListener('loadstart', myCallback);
    

## Zamknij

> Zamyka `InAppBrowser` okna.

    ref.close();
    

  * **ref**: odniesienie do `InAppBrowser` okna *(InAppBrowser)*

### Obsługiwane platformy

  * Amazon Fire OS
  * Android
  * Firefox OS
  * iOS
  * Windows 8 i 8.1
  * Windows Phone 7 i 8
  * Przeglądarka

### Szybki przykład

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    ref.close();
    

## Pokaż

> Wyświetla InAppBrowser okno, który został otwarty ukryte. Zawód ten jest ignorowany, jeśli InAppBrowser już był widoczny.

    ref.show();
    

  * **ref**: odwołanie do InAppBrowser (okno`InAppBrowser`)

### Obsługiwane platformy

  * Amazon Fire OS
  * Android
  * iOS
  * Windows 8 i 8.1
  * Przeglądarka

### Szybki przykład

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'hidden=yes');
    // some time later...
    ref.show();
    

## executeScript

> Wstrzykuje kod JavaScript w `InAppBrowser` okna

    ref.executeScript(details, callback);
    

  * **ref**: odniesienie do `InAppBrowser` okna. *(InAppBrowser)*

  * **injectDetails**: Szczegóły dotyczące skryptu, określając albo `file` lub `code` klucz. *(Obiekt)*
    
      * **plik**: adres URL skryptu, aby wstrzyknąć.
      * **Kod**: tekst skryptu, aby wstrzyknąć.

  * **wywołania zwrotnego**: funkcja, która wykonuje po kod JavaScript jest wstrzykiwany.
    
      * Jeśli taki skrypt jest typu `code` , wykonuje wywołanie zwrotne z pojedynczym parametrem, który jest wartość zwracana przez skrypt, owinięte w `Array` . Dla wielu linii skrypty to wartość zwracana ostatniej instrukcja, lub ostatni wyrażenie oceniane.

### Obsługiwane platformy

  * Amazon Fire OS
  * Android
  * iOS
  * Windows 8 i 8.1
  * Przeglądarka

### Szybki przykład

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    ref.addEventListener('loadstop', function() {
        ref.executeScript({file: "myscript.js"});
    });
    

### Quirks przeglądarki

  * obsługiwany jest tylko **code** klucza.

### Windows dziwactwa

Ze względu na [MSDN dokumenty](https://msdn.microsoft.com/en-us/library/windows.ui.xaml.controls.webview.invokescriptasync.aspx) wywołany skrypt może zwracać tylko wartości ciągów, inaczej parametr, przekazywany do **wywołania zwrotnego** będzie `[null]`.

## insertCSS

> Wstrzykuje CSS w `InAppBrowser` okna.

    ref.insertCSS(details, callback);
    

  * **ref**: odniesienie do `InAppBrowser` okna *(InAppBrowser)*

  * **injectDetails**: Szczegóły dotyczące skryptu, określając albo `file` lub `code` klucz. *(Obiekt)*
    
      * **plik**: URL arkusza stylów do wsuwania.
      * **Kod**: tekst z arkusza stylów do wstrzykiwania.

  * **wywołania zwrotnego**: funkcja, która wykonuje po CSS jest wstrzykiwany.

### Obsługiwane platformy

  * Amazon Fire OS
  * Android
  * iOS
  * Windows

### Szybki przykład

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    ref.addEventListener('loadstop', function() {
        ref.insertCSS({file: "mystyles.css"});
    });