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

# cordova-plugin-file-transfer

Ce plugin vous permet de télécharger des fichiers.

Ce plugin définit global `FileTransfer` , `FileUploadOptions` constructeurs.

Bien que dans la portée globale, ils ne sont pas disponibles jusqu'après la `deviceready` événement.

    document.addEventListener (« deviceready », onDeviceReady, false) ;
    function onDeviceReady() {console.log(FileTransfer);}
    

## Installation

    Cordova plugin ajouter cordova-plugin-file-transfert
    

## Plates-formes prises en charge

*   Amazon Fire OS
*   Android
*   BlackBerry 10
*   Navigateur
*   Firefox OS **
*   iOS
*   Windows Phone 7 et 8 *
*   Windows 8
*   Windows

* *Ne supportent pas `onprogress` ni `abort()` *

** *Ne prennent pas en charge `onprogress` *

# Transfert de fichiers

Le `FileTransfer` objet fournit un moyen de télécharger des fichiers à l'aide d'une requête HTTP de la poste plusieurs partie et pour télécharger des fichiers aussi bien.

## Propriétés

*   **onprogress** : fonction appelée avec un `ProgressEvent` à chaque fois qu'un nouveau segment de données est transféré. *(Function)*

## Méthodes

*   **upload** : envoie un fichier à un serveur.

*   **download** : télécharge un fichier depuis un serveur.

*   **abort** : annule le transfert en cours.

## upload

**Paramètres**:

*   **fileURL** : système de fichiers URL représentant le fichier sur le périphérique. Pour la compatibilité ascendante, cela peut aussi être le chemin complet du fichier sur le périphérique. (Voir [Backwards Compatibility Notes] ci-dessous)

*   **server** : l'URL du serveur destiné à recevoir le fichier, encodée via `encodeURI()`.

*   **successCallback**: un rappel passé un `FileUploadResult` objet. *(Fonction)*

*   **errorCallback**: un rappel qui s'exécute si une erreur survient récupérer la `FileUploadResult` . Appelée avec un `FileTransferError` objet. *(Fonction)*

*   **options**: paramètres facultatifs *(objet)*. Clés valides :
    
    *   **fileKey**: le nom de l'élément form. Valeur par défaut est `file` . (DOMString)
    *   **fileName**: le nom de fichier à utiliser lorsque vous enregistrez le fichier sur le serveur. Valeur par défaut est `image.jpg` . (DOMString)
    *   **httpMethod**: méthode de The HTTP à utiliser - soit `PUT` ou `POST` . Valeur par défaut est `POST` . (DOMString)
    *   **type MIME**: le type mime des données à télécharger. Valeur par défaut est `image/jpeg` . (DOMString)
    *   **params**: un ensemble de paires clé/valeur facultative pour passer dans la requête HTTP. (Objet)
    *   **chunkedMode**: s'il faut télécharger les données en mode streaming mémorisé en bloc. Valeur par défaut est `true` . (Boolean)
    *   **en-têtes**: une carte des valeurs d'en-tête en-tête/nom. Un tableau permet de spécifier plusieurs valeurs. (Objet)

*   **trustAllHosts**: paramètre facultatif, valeur par défaut est `false` . Si la valeur `true` , il accepte tous les certificats de sécurité. Ceci est utile car Android rejette des certificats auto-signés. Non recommandé pour une utilisation de production. Supporté sur Android et iOS. *(boolean)*

### Exemple

    // !! Suppose fileURL variable contient une URL valide dans un fichier texte sur le périphérique, / / par exemple, cdvfile://localhost/persistent/path/to/file.txt var win = function (r) {console.log ("Code =" + r.responseCode) ;
        Console.log ("réponse =" + r.response) ;
        Console.log ("envoyés =" + r.bytesSent);}
    
    échouer var = function (erreur) {alert ("une erreur est survenue : Code =" + error.code) ;
        Console.log (« source de l'erreur de téléchargement » + error.source) ;
        Console.log ("erreur de téléchargement cible" + error.target);}
    
    options de var = new FileUploadOptions() ;
    options.fileKey = « fichier » ;
    options.fileName = fileURL.substr(fileURL.lastIndexOf('/') + 1) ;
    options.mimeType = « text/plain » ;
    
    var params = {} ;
    params.value1 = « test » ;
    params.Value2 = « param » ;
    
    options.params = params ;
    
    ft var = new FileTransfer() ;
    ft.upload (fileURL, encodeURI ("http://some.server.com/upload.php"), win, fail, options) ;
    

### Exemple avec téléchargement du Header et des Progress Events (Android et iOS uniquement)

    function win(r) {console.log ("Code =" + r.responseCode) ;
        Console.log ("réponse =" + r.response) ;
        Console.log ("envoyés =" + r.bytesSent);}
    
    function fail(error) {alert ("une erreur est survenue : Code =" + error.code) ;
        Console.log (« source de l'erreur de téléchargement » + error.source) ;
        Console.log ("erreur de téléchargement cible" + error.target);}
    
    var uri = encodeURI ("http://some.server.com/upload.php") ;
    
    options de var = new FileUploadOptions() ;
    options.fileKey="file" ;
    options.fileName=fileURL.substr(fileURL.lastIndexOf('/')+1) ;
    options.mimeType="text/plain" ;
    
    en-têtes var ={'headerParam':'headerValue'} ;
    
    options.Headers = en-têtes ;
    
    ft var = new FileTransfer() ;
    ft.OnProgress = function(progressEvent) {si (progressEvent.lengthComputable) {loadingStatus.setPercentage(progressEvent.loaded / progressEvent.total) ;
        } else {loadingStatus.increment() ;
        }
    };
    ft.upload (fileURL, uri, win, fail, options) ;
    

## FileUploadResult

A `FileUploadResult` objet est passé au rappel de succès la `FileTransfer` de l'objet `upload()` méthode.

### Propriétés

*   **bytesSent** : le nombre d'octets envoyés au serveur dans le cadre du téléchargement. (long)

*   **responseCode** : le code de réponse HTTP retourné par le serveur. (long)

*   **response** : la réponse HTTP renvoyée par le serveur. (DOMString)

*   **en-têtes** : en-têtes de réponse HTTP par le serveur. (Objet)
    
    *   Actuellement pris en charge sur iOS seulement.

### iOS Remarques

*   Ne prend pas en charge les propriétés `responseCode` et `bytesSent`.

## download

**Paramètres**:

*   **source** : l'URL du serveur depuis lequel télécharger le fichier, encodée via `encodeURI()`.

*   **target** : système de fichiers url représentant le fichier sur le périphérique. Pour vers l'arrière la compatibilité, cela peut aussi être le chemin d'accès complet du fichier sur le périphérique. (Voir [vers l'arrière compatibilité note] ci-dessous)

*   **successCallback** : une callback de succès à laquelle est passée un objet `FileEntry`. *(Function)*

*   **errorCallback**: un rappel qui s'exécute si une erreur se produit lors de la récupération du `FileEntry` . Appelée avec un `FileTransferError` objet. *(Fonction)*

*   **trustAllHosts**: paramètre facultatif, valeur par défaut est `false` . Si la valeur est `true` , il accepte tous les certificats de sécurité. Ceci peut être utile car Android rejette les certificats auto-signés. N'est pas recommandé pour une utilisation en production. Supporté sur Android et iOS. *(booléen)*

*   **options** : paramètres facultatifs, seules les en-têtes sont actuellement supportées (par exemple l'autorisation (authentification basique), etc.).

### Exemple

    // !! Suppose fileURL variable contient une URL valide vers un chemin d'accès sur le périphérique, / / par exemple, transfert de fichiers var cdvfile://localhost/persistent/path/to/downloads/ = new FileTransfer() ;
    var uri = encodeURI ("http://some.server.com/download.php") ;
    
    fileTransfer.download (uri, fileURL, function(entry) {console.log ("téléchargement complet:" + entry.toURL()) ;
        }, function(error) {console.log (« source de l'erreur de téléchargement » + error.source) ;
            Console.log (« erreur de téléchargement cible » + error.target) ;
            Console.log (« code d'erreur de téléchargement » + error.code) ;
        }, faux, {en-têtes: {« Autorisation »: « dGVzdHVzZXJuYW1lOnRlc3RwYXNzd29yZA base == "}}) ;
    

## abort

Abandonne un transfert en cours. Le rappel onerror est passé à un objet FileTransferError qui a un code d'erreur de FileTransferError.ABORT_ERR.

### Exemple

    // !! Suppose fileURL variable contient une URL valide dans un fichier texte sur le périphérique, / / par exemple, cdvfile://localhost/persistent/path/to/file.txt var win = function(r) {console.log ("ne devrait pas être appelée.");}
    
    var fail = function(error) {/ / error.code == FileTransferError.ABORT_ERR alert ("une erreur est survenue : Code =" + error.code) ;
        Console.log (« source de l'erreur de téléchargement » + error.source) ;
        Console.log ("erreur de téléchargement cible" + error.target);}
    
    options de var = new FileUploadOptions() ;
    options.fileKey="file" ;
    options.fileName="myphoto.jpg" ;
    options.mimeType="image/jpeg" ;
    
    ft var = new FileTransfer() ;
    ft.upload (fileURL, encodeURI ("http://some.server.com/upload.php"), win, fail, options) ;
    ft.Abort() ;
    

## FileTransferError

A `FileTransferError` objet est passé à un rappel d'erreur lorsqu'une erreur survient.

### Propriétés

*   **code** : l'un des codes d'erreur prédéfinis énumérés ci-dessous. (Number)

*   **source** : l'URI de la source. (String)

*   **target**: l'URI de la destination. (String)

*   **http_status** : code d'état HTTP. Cet attribut n'est disponible que lorsqu'un code de réponse est fourni via la connexion HTTP. (Number)

*   **corps** Corps de réponse. Cet attribut n'est disponible que lorsqu'une réponse est reçue de la connexion HTTP. (String)

*   **exception**: soit e.getMessage ou e.toString (String)

### Constantes

*   1 = `FileTransferError.FILE_NOT_FOUND_ERR`
*   2 = `FileTransferError.INVALID_URL_ERR`
*   3 = `FileTransferError.CONNECTION_ERR`
*   4 = `FileTransferError.ABORT_ERR`
*   5 = `FileTransferError.NOT_MODIFIED_ERR`

## Backwards Compatibility Notes

Les versions précédentes de ce plugin n'accepterait périphérique--fichier-chemins d'accès absolus comme source pour les téléchargements, ou comme cible pour les téléchargements. Ces chemins seraient généralement de la forme

    / var/mobile/Applications/< application UUID >/Documents/chemin/vers/fichier (iOS), /storage/emulated/0/path/to/file (Android)
    

Pour vers l'arrière la compatibilité, ces chemins sont toujours acceptés, et si votre application a enregistré des chemins comme celles-ci dans un stockage persistant, alors ils peuvent continuer à être utilisé.

Ces chemins ont été précédemment exposés dans le `fullPath` propriété de `FileEntry` et `DirectoryEntry` les objets retournés par le fichier plugin. Nouvelles versions du fichier plugin, cependant, ne plus exposent ces chemins à JavaScript.

Si vous migrez vers une nouvelle (1.0.0 ou plus récent) version de fichier et vous avez précédemment utilisé `entry.fullPath` comme arguments à `download()` ou `upload()` , alors vous aurez besoin de modifier votre code pour utiliser le système de fichiers URL au lieu de cela.

`FileEntry.toURL()`et `DirectoryEntry.toURL()` retournent une URL de système de fichiers du formulaire

    cdvfile://localhost/persistent/path/to/file
    

qui peut être utilisé à la place le chemin d'accès absolu au fichier dans les deux `download()` et `upload()` méthodes.
