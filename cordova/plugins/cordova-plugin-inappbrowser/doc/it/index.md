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

# cordova-plugin-inappbrowser

Questo plugin fornisce una vista di browser web che viene visualizzato quando si chiama `di cordova.InAppBrowser.open()`.

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    

Il `cordova.InAppBrowser.open()` funzione è definita per essere un rimpiazzo per la funzione `window.open`. Esistenti chiamate `Window` possono utilizzare la finestra di InAppBrowser, sostituendo window.open():

    window.open = cordova.InAppBrowser.open;
    

La finestra di InAppBrowser si comporta come un browser web standard e non può accedere a Cordova APIs. Per questo motivo, è consigliabile la InAppBrowser se è necessario caricare il contenuto (non attendibile) di terze parti, invece di caricamento che in webview Cordova principale. Il InAppBrowser non è soggetto alla whitelist, né sta aprendo il link nel browser di sistema.

La InAppBrowser fornisce di default propri controlli GUI per l'utente (indietro, avanti, fatto).

Per indietro la compatibilità, questo plugin ganci anche `window.open`. Tuttavia, il plugin installato gancio di `window.open` può avere effetti collaterali indesiderati (soprattutto se questo plugin è incluso solo come dipendenza di un altro plugin). Il gancio di `window. open` verrà rimosso in una futura release principale. Fino a quando il gancio è rimosso dal plugin, apps può ripristinare manualmente il comportamento predefinito:

    delete window.open // Reverts the call back to it's prototype's default
    

Sebbene `window.open` sia in ambito globale, InAppBrowser non è disponibile fino a dopo l'evento `deviceready`.

    document.addEventListener("deviceready", onDeviceReady, false);
    function onDeviceReady() {
        console.log("window.open works well");
    }
    

## Installazione

    cordova plugin add cordova-plugin-inappbrowser
    

Se si desidera che tutti i carichi di pagina nell'app di passare attraverso il InAppBrowser, si può semplicemente collegare `window.open` durante l'inizializzazione. Per esempio:

    document.addEventListener("deviceready", onDeviceReady, false);
    function onDeviceReady() {
        window.open = cordova.InAppBrowser.open;
    }
    

## cordova.InAppBrowser.open

Apre un URL in una nuova istanza di `InAppBrowser`, l'istanza corrente del browser o il browser di sistema.

    var ref = cordova.InAppBrowser.open(url, target, options);
    

*   **ref**: fare riferimento alla `InAppBrowser` finestra. *(InAppBrowser)*

*   **url**: l'URL da caricare *(String)*. Chiamare `encodeURI()` su questo, se l'URL contiene caratteri Unicode.

*   **target**: la destinazione in cui caricare l'URL, un parametro facoltativo che il valore predefinito è `_self` . *(String)*
    
    *   `_self`: Si apre in Cordova WebView se l'URL è nella lista bianca, altrimenti si apre nella`InAppBrowser`.
    *   `_blank`: Apre il`InAppBrowser`.
    *   `_system`: Si apre nel browser web del sistema.

*   **options**: opzioni per il `InAppBrowser` . Opzionale, inadempiente a: `location=yes` . *(String)*
    
    Il `options` stringa non deve contenere alcun spazio vuoto, e coppie nome/valore ogni funzionalità devono essere separate da una virgola. Caratteristica nomi sono tra maiuscole e minuscole. Tutte le piattaforme supportano il valore riportato di seguito:
    
    *   **posizione**: impostata su `yes` o `no` per trasformare il `InAppBrowser` di barra di posizione on o off.
    
    Solo su Android:
    
    *   **nascosti**: impostare su `yes` per creare il browser e caricare la pagina, ma non mostrarlo. L'evento loadstop viene generato quando il caricamento è completato. Omettere o impostata su `no` (impostazione predefinita) per avere il browser aperto e caricare normalmente.
    *   **ClearCache**: impostare su `yes` per avere il browser cache cookie ha lasciata prima dell'apertura della nuova finestra
    *   **clearsessioncache**: impostare su `yes` per avere la cache cookie di sessione cancellata prima dell'apertura della nuova finestra
    
    solo iOS:
    
    *   **closebuttoncaption**: impostare una stringa da utilizzare come didascalia del pulsante **fatto** . Si noti che è necessario localizzare questo valore a te stesso.
    *   **disallowoverscroll**: impostare su `yes` o `no` (default è `no` ). Attiva/disattiva la proprietà UIWebViewBounce.
    *   **nascosti**: impostare su `yes` per creare il browser e caricare la pagina, ma non mostrarlo. L'evento loadstop viene generato quando il caricamento è completato. Omettere o impostata su `no` (impostazione predefinita) per avere il browser aperto e caricare normalmente.
    *   **ClearCache**: impostare su `yes` per avere il browser cache cookie ha lasciata prima dell'apertura della nuova finestra
    *   **clearsessioncache**: impostare su `yes` per avere la cache cookie di sessione cancellata prima dell'apertura della nuova finestra
    *   **Toolbar**: impostare su `yes` o `no` per attivare la barra degli strumenti o disattivare per il InAppBrowser (default`yes`)
    *   **enableViewportScale**: impostare su `yes` o `no` per impedire la viewport ridimensionamento tramite un tag meta (default`no`).
    *   **mediaPlaybackRequiresUserAction**: impostare su `yes` o `no` per impedire HTML5 audio o video da AutoPlay (default`no`).
    *   **allowInlineMediaPlayback**: impostare su `yes` o `no` per consentire la riproduzione dei supporti HTML5 in linea, visualizzare all'interno della finestra del browser, piuttosto che un'interfaccia specifica del dispositivo di riproduzione. L'HTML `video` elemento deve includere anche il `webkit-playsinline` (default di attributo`no`)
    *   **keyboardDisplayRequiresUserAction**: impostare su `yes` o `no` per aprire la tastiera quando elementi form ricevano lo stato attivo tramite di JavaScript `focus()` chiamata (default`yes`).
    *   **suppressesIncrementalRendering**: impostare su `yes` o `no` aspettare fino a quando tutti i nuovi contenuti di vista viene ricevuto prima il rendering (default`no`).
    *   **presentationstyle**: impostare su `pagesheet` , `formsheet` o `fullscreen` per impostare lo [stile di presentazione][1] (default`fullscreen`).
    *   **transitionstyle**: impostare su `fliphorizontal` , `crossdissolve` o `coververtical` per impostare lo [stile di transizione][2] (default`coververtical`).
    *   **toolbarposition**: impostare su `top` o `bottom` (default è `bottom` ). Provoca la barra degli strumenti sia nella parte superiore o inferiore della finestra.
    
    Solo per Windows:
    
    *   **nascosti**: impostare su `yes` per creare il browser e caricare la pagina, ma non mostrarlo. L'evento loadstop viene generato quando il caricamento è completato. Omettere o impostata su `no` (impostazione predefinita) per avere il browser aperto e caricare normalmente.

 [1]: http://developer.apple.com/library/ios/documentation/UIKit/Reference/UIViewController_Class/Reference/Reference.html#//apple_ref/occ/instp/UIViewController/modalPresentationStyle
 [2]: http://developer.apple.com/library/ios/#documentation/UIKit/Reference/UIViewController_Class/Reference/Reference.html#//apple_ref/occ/instp/UIViewController/modalTransitionStyle

### Piattaforme supportate

*   Amazon fuoco OS
*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows 8 e 8.1
*   Windows Phone 7 e 8

### Esempio

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    var ref2 = cordova.InAppBrowser.open(encodeURI('http://ja.m.wikipedia.org/wiki/ハングル'), '_blank', 'location=yes');
    

### Firefox OS stranezze

Come plugin non imporre alcun disegno c'è bisogno di aggiungere alcune regole CSS se aperto con `target='_blank'`. Le regole potrebbero apparire come questi

     css
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
    

## InAppBrowser

L'oggetto restituito da una chiamata a `di cordova.InAppBrowser.open`.

### Metodi

*   addEventListener
*   removeEventListener
*   close
*   show
*   executeScript
*   insertCSS

## addEventListener

> Aggiunge un listener per un evento dal`InAppBrowser`.

    ref.addEventListener(eventname, callback);
    

*   **Rif**: fare riferimento alla `InAppBrowser` finestra *(InAppBrowser)*

*   **EventName**: l'evento per l'ascolto *(String)*
    
    *   **loadstart**: evento viene generato quando il `InAppBrowser` comincia a caricare un URL.
    *   **loadstop**: evento viene generato quando il `InAppBrowser` termina il caricamento di un URL.
    *   **LoadError**: evento viene generato quando il `InAppBrowser` rileva un errore durante il caricamento di un URL.
    *   **uscita**: evento viene generato quando il `InAppBrowser` finestra è chiusa.

*   **richiamata**: la funzione che viene eseguito quando viene generato l'evento. La funzione viene passata un `InAppBrowserEvent` oggetto come parametro.

### Proprietà InAppBrowserEvent

*   **tipo**: il eventname, o `loadstart` , `loadstop` , `loaderror` , o `exit` . *(String)*

*   **URL**: l'URL che è stato caricato. *(String)*

*   **codice**: il codice di errore, solo nel caso di `loaderror` . *(Numero)*

*   **messaggio**: il messaggio di errore, solo nel caso di `loaderror` . *(String)*

### Piattaforme supportate

*   Amazon fuoco OS
*   Android
*   iOS
*   Windows 8 e 8.1
*   Windows Phone 7 e 8

### Esempio rapido

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    ref.addEventListener('loadstart', function(event) { alert(event.url); });
    

## removeEventListener

> Rimuove un listener per un evento dal`InAppBrowser`.

    ref.removeEventListener(eventname, callback);
    

*   **Rif**: fare riferimento alla `InAppBrowser` finestra. *(InAppBrowser)*

*   **EventName**: interrompere l'attesa per l'evento. *(String)*
    
    *   **loadstart**: evento viene generato quando il `InAppBrowser` comincia a caricare un URL.
    *   **loadstop**: evento viene generato quando il `InAppBrowser` termina il caricamento di un URL.
    *   **LoadError**: evento viene generato quando il `InAppBrowser` rileva un errore di caricamento di un URL.
    *   **uscita**: evento viene generato quando il `InAppBrowser` finestra è chiusa.

*   **richiamata**: la funzione da eseguire quando viene generato l'evento. La funzione viene passata un `InAppBrowserEvent` oggetto.

### Piattaforme supportate

*   Amazon fuoco OS
*   Android
*   iOS
*   Windows 8 e 8.1
*   Windows Phone 7 e 8

### Esempio rapido

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    var myCallback = function(event) { alert(event.url); }
    ref.addEventListener('loadstart', myCallback);
    ref.removeEventListener('loadstart', myCallback);
    

## close

> Chiude la `InAppBrowser` finestra.

    ref.close();
    

*   **Rif**: fare riferimento alla `InAppBrowser` finestra *(InAppBrowser)*

### Piattaforme supportate

*   Amazon fuoco OS
*   Android
*   Firefox OS
*   iOS
*   Windows 8 e 8.1
*   Windows Phone 7 e 8

### Esempio rapido

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    ref.close();
    

## show

> Visualizza una finestra di InAppBrowser che è stato aperto nascosta. Questa chiamata non ha effetto se la InAppBrowser era già visibile.

    ref.show();
    

*   **Rif**: riferimento per il InAppBrowser finestra (`InAppBrowser`)

### Piattaforme supportate

*   Amazon fuoco OS
*   Android
*   iOS
*   Windows 8 e 8.1

### Esempio rapido

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'hidden=yes');
    // some time later...
    ref.show();
    

## executeScript

> Inserisce il codice JavaScript nella `InAppBrowser` finestra

    ref.executeScript(details, callback);
    

*   **Rif**: fare riferimento alla `InAppBrowser` finestra. *(InAppBrowser)*

*   **injectDetails**: dettagli dello script da eseguire, specificando un `file` o `code` chiave. *(Oggetto)*
    
    *   **file**: URL dello script da iniettare.
    *   **codice**: testo dello script da iniettare.

*   **richiamata**: la funzione che viene eseguito dopo che il codice JavaScript viene iniettato.
    
    *   Se lo script iniettato è di tipo `code` , il callback viene eseguita con un singolo parametro, che è il valore restituito del copione, avvolto in un `Array` . Per gli script multi-linea, questo è il valore restituito dell'ultima istruzione, o l'ultima espressione valutata.

### Piattaforme supportate

*   Amazon fuoco OS
*   Android
*   iOS
*   Windows 8 e 8.1

### Esempio rapido

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    ref.addEventListener('loadstop', function() {
        ref.executeScript({file: "myscript.js"});
    });
    

## insertCSS

> Inietta CSS nella `InAppBrowser` finestra.

    ref.insertCSS(details, callback);
    

*   **Rif**: fare riferimento alla `InAppBrowser` finestra *(InAppBrowser)*

*   **injectDetails**: dettagli dello script da eseguire, specificando un `file` o `code` chiave. *(Oggetto)*
    
    *   **file**: URL del foglio di stile per iniettare.
    *   **codice**: testo del foglio di stile per iniettare.

*   **richiamata**: la funzione che viene eseguito dopo che il CSS viene iniettato.

### Piattaforme supportate

*   Amazon fuoco OS
*   Android
*   iOS

### Esempio rapido

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    ref.addEventListener('loadstop', function() {
        ref.insertCSS({file: "mystyles.css"});
    });
