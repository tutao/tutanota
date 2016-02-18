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

Ce module fournit une vue de navigateur web qui s'affiche lorsque vous appelez `cordova.InAppBrowser.open()`.

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    

Le `cordova.InAppBrowser.open()` fonction est définie pour être un remplacement rapide de la fonction `window.open()`. Les appels existants `window.open()` peuvent utiliser la fenêtre de InAppBrowser, en remplaçant window.open :

    window.open = cordova.InAppBrowser.open;
    

La fenêtre de InAppBrowser se comporte comme un navigateur web standard et ne peut pas accéder aux APIs Cordova. Pour cette raison, le InAppBrowser est recommandé si vous devez charger le contenu de tiers (non approuvé), au lieu de chargement que dans le principaux webview Cordova. Le InAppBrowser n'est pas soumis à la liste blanche, ni s'ouvre les liens dans le navigateur de système.

Le InAppBrowser fournit par défaut ses propres contrôles de GUI pour l'utilisateur (arrière, avant, fait).

Pour vers l'arrière la compatibilité, ce plugin crochets également `window.open`. Cependant, le plugin installé crochet de `window.open` peut avoir des effets secondaires involontaires (surtout si ce plugin est inclus uniquement comme une dépendance d'un autre plugin). Le crochet de `window.open` sera supprimé dans une future version majeure. Jusqu'à ce que le crochet est supprimé de la plugin, apps peuvent restaurer manuellement le comportement par défaut :

    delete window.open // Reverts the call back to it's prototype's default
    

Bien que `window.open` est dans la portée globale, InAppBrowser n'est pas disponible jusqu'à ce qu'après l'événement `deviceready`.

    document.addEventListener("deviceready", onDeviceReady, false);
    function onDeviceReady() {
        console.log("window.open works well");
    }
    

## Installation

    cordova plugin add cordova-plugin-inappbrowser
    

Si vous souhaitez que toutes les charges de la page dans votre application de passer par le InAppBrowser, vous pouvez simplement accrocher `window.open` pendant l'initialisation. Par exemple :

    document.addEventListener("deviceready", onDeviceReady, false);
    function onDeviceReady() {
        window.open = cordova.InAppBrowser.open;
    }
    

## cordova.InAppBrowser.open

Ouvre une URL dans une nouvelle instance de `InAppBrowser`, l'instance de navigateur actuelle ou dans l'Explorateur du système.

    var ref = cordova.InAppBrowser.open(url, target, options);
    

*   **ref** : référence à la fenêtre `InAppBrowser`. *(InAppBrowser)*

*   **url** : l'URL à charger *(String)*. À encoder au préalable via `encodeURI()` si celle-ci contient des caractères Unicode.

*   **target** : la cible du chargement de l'URL, ce paramètre est optionnel, sa valeur par défaut est `_self`. *(String)*
    
    *   `_self` : dirige le chargement vers la WebView Cordova si l'URL figure dans la liste blanche, sinon dans une fenêtre `InAppBrowser`.
    *   `_blank` : dirige le chargement vers une fenêtre `InAppBrowser`.
    *   `_system` : dirige le chargement vers le navigateur Web du système.

*   **options** : permet de personnaliser la fenêtre `InAppBrowser`. Paramètre facultatif dont la valeur par défaut est `location=yes`. *(String)*
    
    La chaîne `options` ne doit contenir aucun caractère vide, chaque paire nom/valeur représentant une fonctionnalité doit être séparée de la précédente par une virgule. Les noms de fonctionnalités sont sensibles à la casse. Toutes les plates-formes prennent en charge la valeur ci-dessous :
    
    *   **location** : régler à `yes` ou `no` afin d'afficher ou masquer la barre d'adresse de la fenêtre `InAppBrowser`.
    
    Android uniquement :
    
    *   **caché**: la valeur `yes` pour créer le navigateur et charger la page, mais ne pas le montrer. L'événement loadstop est déclenché lorsque le chargement est terminé. Omettre ou la valeur `no` (par défaut) pour que le navigateur ouvrir et charger normalement.
    *   **ClearCache**: la valeur `yes` pour que le navigateur du cache de cookie effacé, avant l'ouverture de la nouvelle fenêtre
    *   **clearsessioncache**: la valeur `yes` pour avoir le cache de cookie de session autorisé avant l'ouverture de la nouvelle fenêtre
    
    iOS uniquement :
    
    *   **closebuttoncaption**: affectez une chaîne à utiliser comme la **fait** légende du bouton. Notez que vous devrez localiser cette valeur vous-même.
    *   **disallowoverscroll**: la valeur `yes` ou `no` (valeur par défaut est `no` ). Active/désactive la propriété UIWebViewBounce.
    *   **caché**: la valeur `yes` pour créer le navigateur et charger la page, mais ne pas le montrer. L'événement loadstop est déclenché lorsque le chargement est terminé. Omettre ou la valeur `no` (par défaut) pour que le navigateur ouvrir et charger normalement.
    *   **ClearCache**: la valeur `yes` pour que le navigateur du cache de cookie effacé, avant l'ouverture de la nouvelle fenêtre
    *   **clearsessioncache**: la valeur `yes` pour avoir le cache de cookie de session autorisé avant l'ouverture de la nouvelle fenêtre
    *   **barre d'outils**: la valeur `yes` ou `no` pour activer la barre d'outils ou désactiver pour le InAppBrowser (par défaut,`yes`)
    *   **enableViewportScale**: la valeur `yes` ou `no` pour empêcher la fenêtre de mise à l'échelle par une balise meta (par défaut,`no`).
    *   **mediaPlaybackRequiresUserAction**: la valeur `yes` ou `no` pour empêcher le HTML5 audio ou vidéo de la lecture automatique (par défaut,`no`).
    *   **allowInlineMediaPlayback**: la valeur `yes` ou `no` pour permettre la lecture du média en ligne HTML5, affichage dans la fenêtre du navigateur plutôt que d'une interface de lecture spécifique au périphérique. L'HTML `video` élément doit également inclure la `webkit-playsinline` attribut (par défaut,`no`)
    *   **keyboardDisplayRequiresUserAction**: la valeur `yes` ou `no` pour ouvrir le clavier lorsque les éléments reçoivent le focus par l'intermédiaire de JavaScript `focus()` appel (par défaut,`yes`).
    *   **suppressesIncrementalRendering**: la valeur `yes` ou `no` d'attendre que toutes les nouveautés de vue sont reçue avant d'être restitué (par défaut,`no`).
    *   **presentationstyle**: la valeur `pagesheet` , `formsheet` ou `fullscreen` pour définir le [style de présentation][1] (par défaut,`fullscreen`).
    *   **transitionstyle**: la valeur `fliphorizontal` , `crossdissolve` ou `coververtical` pour définir le [style de transition][2] (par défaut,`coververtical`).
    *   **toolbarposition**: la valeur `top` ou `bottom` (valeur par défaut est `bottom` ). Causes de la barre d'outils être en haut ou en bas de la fenêtre.
    
    Windows uniquement :
    
    *   **caché**: la valeur `yes` pour créer le navigateur et charger la page, mais ne pas le montrer. L'événement loadstop est déclenché lorsque le chargement est terminé. Omettre ou la valeur `no` (par défaut) pour que le navigateur ouvrir et charger normalement.

 [1]: http://developer.apple.com/library/ios/documentation/UIKit/Reference/UIViewController_Class/Reference/Reference.html#//apple_ref/occ/instp/UIViewController/modalPresentationStyle
 [2]: http://developer.apple.com/library/ios/#documentation/UIKit/Reference/UIViewController_Class/Reference/Reference.html#//apple_ref/occ/instp/UIViewController/modalTransitionStyle

### Plates-formes prises en charge

*   Amazon Fire OS
*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows 8 et 8.1
*   Windows Phone 7 et 8

### Exemple

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    var ref2 = cordova.InAppBrowser.open(encodeURI('http://ja.m.wikipedia.org/wiki/ハングル'), '_blank', 'location=yes');
    

### Firefox OS Quirks

Comme plugin n'est pas appliquer n'importe quelle conception il est nécessaire d'ajouter quelques règles CSS si ouvert avec `target= _blank`. Les règles pourraient ressembler à ces

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

L'objet retourné par un appel à `cordova.InAppBrowser.open`.

### Méthodes

*   addEventListener
*   removeEventListener
*   close
*   show
*   executeScript
*   insertCSS

## addEventListener

> Ajoute un écouteur pour un évènement de la fenêtre `InAppBrowser`.

    ref.addEventListener(eventname, callback);
    

*   **ref** : référence à la fenêtre `InAppBrowser`. *(InAppBrowser)*

*   **eventname** : l'évènement à écouter *(String)*
    
    *   **loadstart** : évènement déclenché lorsque le chargement d'une URL débute dans la fenêtre `InAppBrowser`.
    *   **loadstop** : évènement déclenché lorsque la fenêtre `InAppBrowser` finit de charger une URL.
    *   **loaderror** : évènement déclenché si la fenêtre `InAppBrowser` rencontre une erreur lors du chargement d'une URL.
    *   **exit** : évènement déclenché lorsque la fenêtre `InAppBrowser` est fermée.

*   **callback** : la fonction à exécuter lorsque l'évènement se déclenche. Un objet `InAppBrowserEvent` lui est transmis comme paramètre.

### Propriétés de InAppBrowserEvent

*   **type** : le nom de l'évènement, soit `loadstart`, `loadstop`, `loaderror` ou `exit`. *(String)*

*   **url** : l'URL ayant été chargée. *(String)*

*   **code** : le code d'erreur, seulement pour `loaderror`. *(Number)*

*   **message** : un message d'erreur, seulement pour `loaderror`. *(String)*

### Plates-formes prises en charge

*   Amazon Fire OS
*   Android
*   iOS
*   Windows 8 et 8.1
*   Windows Phone 7 et 8

### Petit exemple

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    ref.addEventListener('loadstart', function(event) { alert(event.url); });
    

## removeEventListener

> Supprime un écouteur pour un évènement de la fenêtre `InAppBrowser`.

    ref.removeEventListener(eventname, callback);
    

*   **ref** : référence à la fenêtre `InAppBrowser`. *(InAppBrowser)*

*   **eventname** : l'évènement pour lequel arrêter l'écoute. *(String)*
    
    *   **loadstart**: événement déclenche quand le `InAppBrowser` commence à charger une URL.
    *   **loadstop**: événement déclenche lorsque la `InAppBrowser` finit de charger une URL.
    *   **loaderror** : évènement déclenché si la fenêtre `InAppBrowser` rencontre une erreur lors du chargement d'une URL.
    *   **sortie**: événement déclenche quand le `InAppBrowser` fenêtre est fermée.

*   **callback** : la fonction à exécuter lorsque l'évènement se déclenche. Un objet `InAppBrowserEvent` lui est transmis comme paramètre.

### Plates-formes prises en charge

*   Amazon Fire OS
*   Android
*   iOS
*   Windows 8 et 8.1
*   Windows Phone 7 et 8

### Petit exemple

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    var myCallback = function(event) { alert(event.url); }
    ref.addEventListener('loadstart', myCallback);
    ref.removeEventListener('loadstart', myCallback);
    

## close

> Ferme la fenêtre `InAppBrowser`.

    ref.close();
    

*   **Réf**: référence à la `InAppBrowser` fenêtre *(InAppBrowser)*

### Plates-formes prises en charge

*   Amazon Fire OS
*   Android
*   Firefox OS
*   iOS
*   Windows 8 et 8.1
*   Windows Phone 7 et 8

### Petit exemple

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    ref.close();
    

## show

> Affiche une fenêtre InAppBrowser qui a été ouverte cachée. Appeler cette méthode n'a aucun effet si la fenêtre en question est déjà visible.

    ref.show();
    

*   **Réf**: référence à la fenêtre () InAppBrowser`InAppBrowser`)

### Plates-formes prises en charge

*   Amazon Fire OS
*   Android
*   iOS
*   Windows 8 et 8.1

### Petit exemple

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'hidden=yes');
    // some time later...
    ref.show();
    

## executeScript

> Injecte du code JavaScript dans la fenêtre `InAppBrowser`

    ref.executeScript(details, callback);
    

*   **Réf**: référence à la `InAppBrowser` fenêtre. *(InAppBrowser)*

*   **injectDetails** : détails du script à exécuter, requérant une propriété `file` ou `code`. *(Object)*
    
    *   **file** : URL du script à injecter.
    *   **code** : texte du script à injecter.

*   **callback** : une fonction exécutée après l'injection du code JavaScript.
    
    *   Si le script injecté est de type `code`, un seul paramètre est transmis à la fonction callback, correspondant à la valeur de retour du script enveloppée dans un `Array`. Pour les scripts multilignes, il s'agit de la valeur renvoyée par la dernière instruction ou la dernière expression évaluée.

### Plates-formes prises en charge

*   Amazon Fire OS
*   Android
*   iOS
*   Windows 8 et 8.1

### Petit exemple

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    ref.addEventListener('loadstop', function() {
        ref.executeScript({file: "myscript.js"});
    });
    

## insertCSS

> Injecte des règles CSS dans la fenêtre `InAppBrowser`.

    ref.insertCSS(details, callback);
    

*   **Réf**: référence à la `InAppBrowser` fenêtre *(InAppBrowser)*

*   **injectDetails**: Détails du script à exécuter, spécifiant soit un `file` ou `code` clés. *(Objet)*
    
    *   **file** : URL de la feuille de style à injecter.
    *   **code** : contenu de la feuille de style à injecter.

*   **callback** : une fonction exécutée après l'injection du fichier CSS.

### Plates-formes prises en charge

*   Amazon Fire OS
*   Android
*   iOS

### Petit exemple

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    ref.addEventListener('loadstop', function() {
        ref.insertCSS({file: "mystyles.css"});
    });
