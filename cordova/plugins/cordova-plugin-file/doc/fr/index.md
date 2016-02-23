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

# cordova-plugin-file

Ce plugin implémente une API de fichier permettant l'accès en lecture/écriture aux fichiers qui résident sur le périphérique.

Ce plugin est basé sur plusieurs spécifications, y compris : l'API de fichier HTML5 <http://www.w3.org/TR/FileAPI/>

Les répertoires (aujourd'hui disparue) et le système des extensions plus récentes : <http://www.w3.org/TR/2012/WD-file-system-api-20120417/> bien que la plupart du code du plugin a été écrit quand une technique antérieure était en vigueur : <http://www.w3.org/TR/2011/WD-file-system-api-20110419/>

Il met également en œuvre la spécification FileWriter : <http://dev.w3.org/2009/dap/file-system/file-writer.html>

Pour son utilisation, veuillez vous reporter au HTML5 Rocks' excellent [article de système de fichiers.][1]

 [1]: http://www.html5rocks.com/en/tutorials/file/filesystem/

Pour un aperçu des autres options de stockage, consultez [guide d'entreposage de Cordova][2].

 [2]: http://cordova.apache.org/docs/en/edge/cordova_storage_storage.md.html

Ce plugin définit global `cordova.file` objet.

Bien que dans la portée globale, il n'est pas disponible jusqu'après la `deviceready` événement.

    document.addEventListener (« deviceready », onDeviceReady, false) ;
    function onDeviceReady() {console.log(cordova.file);}
    

## Installation

    Cordova plugin ajouter cordova-plugin-file
    

## Plates-formes prises en charge

*   Amazon Fire OS
*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 et 8 *
*   Windows 8 *
*   Navigateur

* *Ces plates-formes ne supportent pas `FileReader.readAsArrayBuffer` ni `FileWriter.write(blob)` .*

## Emplacement de stockage des fichiers

À partir de v1.2.0, URL vers des répertoires de système de fichiers importants est fournis. Chaque URL est dans la forme *file:///path/to/spot/*et peut être converti en un `DirectoryEntry` à l'aide`window.resolveLocalFileSystemURL()`.

*   `cordova.file.applicationDirectory`-Lecture seule répertoire où l'application est installée. (*iOS*, *Android*, *BlackBerry 10*)

*   `cordova.file.applicationStorageDirectory`-Répertoire racine du bac à sable de l'application ; cet endroit est en lecture seule sur iOS (mais les sous-répertoires spécifiques [comme `/Documents` ] sont en lecture / écriture). Toutes les données qu'il contient est privé de l'application. ( *iOS*, *Android*, *BlackBerry 10*)

*   `cordova.file.dataDirectory`-Stockage des données persistants et privés au sein de bac à sable de l'application à l'aide de la mémoire interne (sur Android, si vous avez besoin d'utiliser une mémoire externe, utilisez `.externalDataDirectory` ). Sur iOS, ce répertoire n'est pas synchronisé avec iCloud (utiliser `.syncedDataDirectory` ). (*iOS*, *Android*, *BlackBerry 10*)

*   `cordova.file.cacheDirectory`-Répertoire pour les fichiers de données en mémoire cache ou les fichiers que votre application peut recréer facilement. L'OS peut supprimer ces fichiers lorsque l'appareil faiblit sur stockage, néanmoins, les applications ne doivent pas compter sur l'OS pour supprimer les fichiers ici. (*iOS*, *Android*, *BlackBerry 10*)

*   `cordova.file.externalApplicationStorageDirectory`-Espace l'application sur le stockage externe. (*Android*)

*   `cordova.file.externalDataDirectory`-Où placer les fichiers de données d'application spécifiques sur le stockage externe. (*Android*)

*   `cordova.file.externalCacheDirectory`-Cache de l'application sur le stockage externe. (*Android*)

*   `cordova.file.externalRootDirectory`-Racine de stockage externe (carte SD). (*Android*, *BlackBerry 10*)

*   `cordova.file.tempDirectory`-Répertoire temp que l'OS peut effacer à volonté. Ne comptez pas sur l'OS pour effacer ce répertoire ; votre application doit toujours supprimer les fichiers selon le cas. (*iOS*)

*   `cordova.file.syncedDataDirectory`-Contient des fichiers d'app spécifique qui doivent se synchroniser (par exemple à iCloud). (*iOS*)

*   `cordova.file.documentsDirectory`-Fichiers privés à l'app, mais qui sont significatives pour l'autre application (par exemple les fichiers Office). (*iOS*)

*   `cordova.file.sharedDirectory`-Fichiers disponibles globalement à toutes les applications (*BlackBerry 10*)

## Structures de système de fichiers

Bien que techniquement un détail d'implémentation, il peut être très utile de savoir comment les `cordova.file.*` carte de propriétés à des chemins d'accès physiques sur un périphérique réel.

### iOS agencement de système de fichier

| Chemin de l'unité                            | `Cordova.file.*`            | `iosExtraFileSystems` | r/w ? | persistants ? |  OS efface  | Sync  | privé |
|:-------------------------------------------- |:--------------------------- |:--------------------- |:-----:|:-------------:|:-----------:|:-----:|:-----:|
| `/ var/mobile/Applications/< UUID > /` | applicationStorageDirectory | -                     |   r   |      N/A      |     N/A     |  N/A  |  Oui  |
|    `appname.app/`                            | applicationDirectory        | Bundle                |   r   |      N/A      |     N/A     |  N/A  |  Oui  |
|       `www/`                                 | -                           | -                     |   r   |      N/A      |     N/A     |  N/A  |  Oui  |
|    `Documents/`                              | documentsDirectory          | documents             |  r/w  |      Oui      |     Non     |  Oui  |  Oui  |
|       `NoCloud/`                             | -                           | documents-nosync      |  r/w  |      Oui      |     Non     |  Non  |  Oui  |
|    `Library`                                 | -                           | Bibliothèque          |  r/w  |      Oui      |     Non     | Oui ? |  Oui  |
|       `NoCloud/`                             | dataDirectory               | Bibliothèque-nosync   |  r/w  |      Oui      |     Non     |  Non  |  Oui  |
|       `Cloud/`                               | syncedDataDirectory         | -                     |  r/w  |      Oui      |     Non     |  Oui  |  Oui  |
|       `Caches/`                              | cacheDirectory              | cache                 |  r/w  |     Oui *     | Oui * * *| |  Non  |  Oui  |
|    `tmp/`                                    | tempDirectory               | -                     |  r/w  |    Ne * *     | Oui * * *| |  Non  |  Oui  |

* Fichiers persistent à travers les redémarrages de l'application et mises à niveau, mais ce répertoire peut être effacé à chaque fois que les désirs de l'OS. Votre application doit être en mesure de recréer tout contenu qui pourrait être supprimé.

* * Fichiers peuvent persister redémarrages de l'application, mais ne vous fiez pas ce comportement. Les fichiers ne sont pas garantis à persister dans l'ensemble de mises à jour. Votre application doit supprimer les fichiers de ce répertoire lorsqu'elle s'applique, comme le système d'exploitation ne garantit pas quand (ou même si) ces fichiers sont supprimés.

* * *| L'OS peut effacer le contenu de ce répertoire chaque fois qu'il se sent il est nécessaire, mais ne comptez pas là-dessus. Vous devez supprimer ce répertoire comme approprié pour votre application.

### Agencement de système de fichiers Android

| Chemin de l'unité                   | `Cordova.file.*`                    | `AndroidExtraFileSystems` | r/w ? | persistants ? | OS efface | privé |
|:----------------------------------- |:----------------------------------- |:------------------------- |:-----:|:-------------:|:---------:|:-----:|
| `file:///android_asset/`            | applicationDirectory                |                           |   r   |      N/A      |    N/A    |  Oui  |
| `/ données/data/app < id > /` | applicationStorageDirectory         | -                         |  r/w  |      N/A      |    N/A    |  Oui  |
|    `cache`                          | cacheDirectory                      | cache                     |  r/w  |      Oui      |   Oui *   |  Oui  |
|    `files`                          | dataDirectory                       | fichiers                  |  r/w  |      Oui      |    Non    |  Oui  |
|       `Documents`                   |                                     | documents                 |  r/w  |      Oui      |    Non    |  Oui  |
| `< sdcard > /`                | externalRootDirectory               | sdcard                    |  r/w  |      Oui      |    Non    |  Non  |
|    `Android/data/<app-id>/`   | externalApplicationStorageDirectory | -                         |  r/w  |      Oui      |    Non    |  Non  |
|       `cache`                       | externalCacheDirectry               | cache-externe             |  r/w  |      Oui      |  Ne * *   |  Non  |
|       `files`                       | externalDataDirectory               | fichiers externes         |  r/w  |      Oui      |    Non    |  Non  |

* Le système d'exploitation peut effacer périodiquement ce répertoire, mais ne vous fiez pas ce comportement. Effacer le contenu de ce répertoire comme approprié pour votre application. Un utilisateur doit purger le cache manuellement, le contenu de ce répertoire est supprimé.

* * The OS vous n'effacez pas ce répertoire automatiquement ; vous êtes chargé de gérer le contenu vous-même. L'utilisateur devrait purger le cache manuellement, le contenu du répertoire est supprimé.

**Remarque**: si le stockage externe ne peut pas être monté, les `cordova.file.external*` sont des propriétés`null`.

### Configuration du système blackBerry 10 fichier

| Chemin de l'unité                                   | `Cordova.file.*`            | r/w ? | persistants ? | OS efface | privé |
|:--------------------------------------------------- |:--------------------------- |:-----:|:-------------:|:---------:|:-----:|
| `file:///Accounts/1000/AppData/ < id app > /` | applicationStorageDirectory |   r   |      N/A      |    N/A    |  Oui  |
|    `app/native`                                     | applicationDirectory        |   r   |      N/A      |    N/A    |  Oui  |
|    `data/webviews/webfs/temporary/local__0`         | cacheDirectory              |  r/w  |      Non      |    Oui    |  Oui  |
|    `data/webviews/webfs/persistent/local__0`        | dataDirectory               |  r/w  |      Oui      |    Non    |  Oui  |
| `file:///Accounts/1000/Removable/sdcard`            | externalRemovableDirectory  |  r/w  |      Oui      |    Non    |  Non  |
| `file:///Accounts/1000/Shared`                      | sharedDirectory             |  r/w  |      Oui      |    Non    |  Non  |

*Remarque*: lorsque l'application est déployée dans le périmètre de travail, tous les chemins sont par rapport à /accounts/1000-enterprise.

## Quirks Android

### Emplacement de stockage persistant Android

Il y a plusieurs emplacements valides pour stocker des fichiers persistants sur un appareil Android. Voir [cette page][3] pour une analyse approfondie des diverses possibilités.

 [3]: http://developer.android.com/guide/topics/data/data-storage.html

Les versions précédentes du plugin choisirait l'emplacement des fichiers temporaires et persistantes au démarrage, basé sur la question de savoir si le dispositif réclamé que la carte SD (ou une partition de stockage équivalent) a été montée. Si la carte SD a été montée, ou si une partition de stockage interne importante était disponible (comme sur les appareils Nexus,) puis les fichiers persistants seraient stockés dans la racine de cet espace. Cela signifie que toutes les apps de Cordova pouvaient voir tous les fichiers disponibles sur la carte.

Si la carte SD n'était pas disponible, les versions précédentes pourraient stocker des données sous `/data/data/<packageId>` , qui isole des apps de l'autre, mais peut encore cause données à partager entre les utilisateurs.

Il est maintenant possible de choisir de stocker les fichiers dans l'emplacement de stockage de fichier interne, ou en utilisant la logique précédente, avec une préférence au sein de votre application `config.xml` fichier. Pour ce faire, ajoutez l'un de ces deux lignes de `config.xml` :

    < nom de l'option = « AndroidPersistentFileLocation » value = « Internal » / >< nom de préférence = « AndroidPersistentFileLocation » value = « Compatibilité » / >
    

Sans cette ligne, utilisera le fichier plugin `Compatibility` par défaut. Si une balise de préférence est présente et n'est pas une des valeurs suivantes, l'application ne démarrera pas.

Si votre application a déjà été expédiée aux utilisateurs, en utilisant une ancienne (avant 1.0) version de ce plugin et dispose des fichiers stockés dans le système de fichiers persistant, alors vous devez définir la préférence au `Compatibility` . Commutation de l'emplacement « Internal » signifierait que les utilisateurs existants qui mettre à niveau leur application peuvent être impossible d'accéder à leurs fichiers déjà enregistrés, selon leur appareil.

Si votre application est nouvelle ou a jamais précédemment stocké les fichiers dans le système de fichiers persistant, puis la `Internal` réglage est généralement recommandé.

## iOS Quirks

*   `cordova.file.applicationStorageDirectory`est en lecture seule ; tentative de stocker des fichiers dans le répertoire racine échoue. Utilisez l'une de l'autre `cordova.file.*` les propriétés définies pour iOS (seulement `applicationDirectory` et `applicationStorageDirectory` sont en lecture seule).
*   `FileReader.readAsText(blob, encoding)` 
    *   Le `encoding` paramètre n'est pas pris en charge, et le codage UTF-8 est toujours en vigueur.

### emplacement de stockage persistant d'iOS

Il y a deux emplacements valides pour stocker des fichiers persistants sur un appareil iOS : le répertoire de Documents et le répertoire de la bibliothèque. Les versions précédentes du plugin stockaient ne jamais fichiers persistants dans le répertoire de Documents. Cela a eu l'effet secondaire de rendre tous les fichiers de l'application visible dans iTunes, qui était souvent inattendus, en particulier pour les applications qui traitent beaucoup de petits fichiers, plutôt que de produire des documents complets destinés à l'exportation, qui est l'objectif visé par le répertoire.

Il est maintenant possible de choisir de stocker les fichiers dans le répertoire de bibliothèque, avec une préférence au sein de votre application ou de documents `config.xml` fichier. Pour ce faire, ajoutez l'un de ces deux lignes de `config.xml` :

    < nom de l'option = « iosPersistentFileLocation » value = « Library » / >< nom de préférence = « iosPersistentFileLocation » value = « Compatibilité » / >
    

Sans cette ligne, utilisera le fichier plugin `Compatibility` par défaut. Si une balise de préférence est présente et n'est pas une des valeurs suivantes, l'application ne démarrera pas.

Si votre application a déjà été expédiée aux utilisateurs, en utilisant une ancienne (avant 1.0) version de ce plugin et dispose des fichiers stockés dans le système de fichiers persistant, alors vous devez définir la préférence au `Compatibility` . Changer l'emplacement de `Library` voudrait dire que les utilisateurs existants qui mettre à niveau leur application serait incapables d'accéder à leurs fichiers déjà enregistrés.

Si votre application est nouvelle ou a jamais précédemment stocké les fichiers dans le système de fichiers persistant, puis la `Library` réglage est généralement recommandé.

## Firefox OS Quirks

L'API de système de fichier n'est pas nativement pris en charge par Firefox OS et est implémentée comme une cale d'épaisseur sur le dessus d'indexedDB.

*   Ne manque pas lors de la suppression des répertoires non vide
*   Ne supporte pas les métadonnées pour les répertoires
*   Méthodes `copyTo` et `moveTo` ne prennent pas en charge les répertoires

Les chemins de données suivants sont pris en charge: * `applicationDirectory` -utilise `xhr` pour obtenir des fichiers les qui sont emballées avec l'app. * `dataDirectory` - Pour les fichiers de données persistantes de app spécifique. * `cacheDirectory` -Mise en cache de fichiers qui doivent survivre les redémarrages de l'application (les applications ne doivent pas compter sur le système d'exploitation pour supprimer les fichiers ici).

## Bizarreries navigateur

### Commune de bizarreries et de remarques

*   Chaque navigateur utilise son propre système de fichiers en bac à sable. IE et Firefox utilisent IndexedDB comme base. Tous les navigateurs utilisent oblique comme séparateur de répertoire dans un chemin d'accès.
*   Entrées d'annuaire doivent être créées successivement. Par exemple, l'appel `fs.root.getDirectory (' dir1/dir2 ', {create:true}, successCallback, errorCallback)` échouera si dir1 n'existait pas.
*   Le plugin demande utilisateur l'autorisation d'utiliser le stockage persistant lors du premier démarrage d'application. 
*   Plugin supporte `cdvfile://localhost` (ressources locales) seulement. C'est-à-dire les ressources externes ne sont pas supportés par l'intermédiaire de `cdvfile`.
*   Le plugin ne suit pas les ["Restrictions de nommage des fichiers système API 8.3"][4].
*   BLOB et le fichier "`close` la fonction n'est pas pris en charge.
*   `FileSaver` et `BlobBuilder` ne sont pas pris en charge par ce plugin et n'ont stubs.
*   Le plugin ne supporte pas les `requestAllFileSystems`. Cette fonction est également absent dans les cahier des charges.
*   Inscriptions dans l'annuaire ne seront pas supprimées si vous utilisez `create: true` drapeau pour le répertoire existant.
*   Fichiers créés via le constructeur ne sont pas pris en charge. Vous devez plutôt utiliser entry.file méthode.
*   Chaque navigateur utilise sa propre forme de références URL blob.
*   `readAsDataURL` fonction est prise en charge, mais le mediatype en Chrome dépend de l'extension entrée, mediatype dans IE est toujours vide (qui est le même que le `texte-plaine` selon la spécification), le mediatype dans Firefox est toujours `application/octet-stream`. Par exemple, si le contenu est `abcdefg` puis Firefox renvoie `données : application / octet-stream ; base64, YWJjZGVmZw ==`, c'est à dire les retours `données:; base64, YWJjZGVmZw ==`, retours de Chrome `données : < mediatype selon l'extension de nom d'entrée > ; base64, YWJjZGVmZw ==`.
*   `toInternalURL` retourne le chemin d'accès dans le formulaire `file:///persistent/path/to/entry` (Firefox, IE). Chrome retourne le chemin d'accès dans le formulaire `cdvfile://localhost/persistent/file`.

 [4]: http://www.w3.org/TR/2011/WD-file-system-api-20110419/#naming-restrictions

### Bizarreries de chrome

*   Chrome filesystem n'est pas prête immédiatement après l'événement ready périphérique. Pour contourner le problème, vous pouvez vous abonner à l'événement `filePluginIsReady`. Exemple : 

    javascript
    window.addEventListener('filePluginIsReady', function(){ console.log('File plugin is ready');}, false);
    

Vous pouvez utiliser la fonction `window.isFilePluginReadyRaised` pour vérifier si les événement était déjà déclenché. -quotas de window.requestFileSystem temporaire et permanent de système de fichiers ne sont pas limités en Chrome. -Pour augmenter le stockage persistant en Chrome, vous devez appeler la méthode `window.initPersistentFileSystem`. Quota de stockage persistant est 5 Mo par défaut. -Chrome nécessite `--permettre-fichier-accès-de-fichiers` exécuter l'argument au support API via le protocole `file:///`. -`Fichier` objet changera pas si vous utilisez le drapeau `{create:true}` lors du passage d'une `entrée` existante. -événements `annulables` propriété a la valeur true dans Chrome. Il s'agit à l'encontre de la [spécification][5]. -`toURL` renvoie à Chrome `système de fichiers :`-préfixe de chemin d'accès selon l'application hôte. Par exemple, `filesystem:file:///persistent/somefile.txt`, `filesystem:http://localhost:8080/persistent/somefile.txt`. -résultat de la fonction `toURL` ne contient-elle pas de barre oblique dans le cas d'entrée d'annuaire. Chrome résout répertoires avec barre oblique-trainés URL correctement cependant. -`resolveLocalFileSystemURL` méthode nécessite l' entrant `url` préfixe de `système de fichiers`. Par exemple, le paramètre `d'url` pour `resolveLocalFileSystemURL` devrait être dans la forme `filesystem:file:///persistent/somefile.txt` par opposition à la forme `file:///persistent/somefile.txt` dans Android. -Déconseillée `toNativeURL` fonction n'est pas prise en charge et n'est pas une ébauche. -fonction de `setMetadata` n'est pas stipulée dans le devis et pas pris en charge. -INVALID_MODIFICATION_ERR (code: 9) est levée au lieu de SYNTAX_ERR(code: 8) sur la demande d'un système de fichier inexistant. -INVALID_MODIFICATION_ERR (code: 9) est levée au lieu de PATH_EXISTS_ERR(code: 12) à essayer de créer exclusivement un fichier ou un répertoire, qui existe déjà. -INVALID_MODIFICATION_ERR (code: 9) est levée au lieu de NO_MODIFICATION_ALLOWED_ERR(code: 6) à essayer d'appeler removeRecursively sur le système de fichiers racine. -INVALID_MODIFICATION_ERR (code: 9) est levée au lieu de NOT_FOUND_ERR(code: 1) en essayant de moveTo répertoire qui n'existe pas.

 [5]: http://dev.w3.org/2009/dap/file-system/file-writer.html

### Base IndexedDB impl bizarreries (Firefox et IE)

*   `.` et `.` ne sont pas pris en charge.
*   IE ne prend pas en charge les `file:///`-mode ; seul le mode hébergé est pris en charge (http://localhost:xxxx).
*   Taille de système de fichiers de Firefox n'est pas limité, mais chaque extension de 50Mo demandera une autorisation de l'utilisateur. IE10 permet jusqu'à 10 Mo de combiné AppCache et IndexedDB utilisés dans la mise en œuvre du système de fichiers sans demander de confirmation, une fois que vous atteignez ce niveau, Qu'on vous demandera si vous souhaitez lui permettre d'être augmentée jusqu'à un maximum de 250 Mo par site. Si le paramètre de `taille` pour la fonction `requestFileSystem` n'affecte pas le système de fichiers dans Firefox et IE.
*   fonction de `readAsBinaryString` n'est pas indiquée dans les spécifications et pas pris en charge dans Internet Explorer et n'a pas une ébauche.
*   `file.type` est toujours null.
*   Vous ne devez pas créer en utilisant le résultat du callback instance DirectoryEntry qui avait été supprimée. Sinon, vous obtiendrez une « entrée de pendaison ».
*   Avant que vous pouvez lire un fichier qui a été écrit juste que vous devez obtenir une nouvelle instance de ce fichier.
*   `setMetadata` fonction, qui n'est pas indiquée dans les spécifications supporte `modificationTime` changement de champ seulement. 
*   fonctions `copyTo` et `moveTo` ne supportent pas les répertoires.
*   Répertoires métadonnées ne sont pas pris en charge.
*   Les deux Entry.remove et directoryEntry.removeRecursively ne manquent pas lors de la suppression des répertoires non-vides - répertoires retirés sont nettoyés avec contenu au lieu de cela.
*   fonctions `abort` et `truncate` ne sont pas supportées.
*   événements de progression ne sont pas déclenchés. Par exemple, ce gestionnaire ne sera pas exécuté :

    javascript
    writer.onprogress = function() { /*commands*/ };
    

## Notes de mise à niveau

V1.0.0 de ce plugin, les structures `FileEntry` et `DirectoryEntry` ont changé, pour être plus conforme à la spécification publiée.

Les versions précédentes de (pré-1.0.0) du plugin stockaient le dispositif-absolu--emplacement du fichier dans la propriété `fullPath` d'objets `d'entrée`. Ces chemins seraient présente généralement comme

    / var/mobile/Applications/< application UUID >/Documents/chemin/vers/fichier (iOS), /storage/emulated/0/path/to/file (Android)
    

Ces chemins ont été également retournés par la méthode de `toURL()` les objets `d'entrée`.

Avec v1.0.0, l'attribut `fullPath` est le chemin d'accès au fichier, *par rapport à la racine du système de fichiers HTML*. Ainsi, les chemins d'accès ci-dessus seraient maintenant tous les deux être représentée par un objet `FileEntry` avec un `fullPath` de

    /path/to/file
    

Si votre application fonctionne avec le dispositif-absolu-chemins et que vous avez récupéré précédemment ces chemins d'accès par le biais de la propriété `fullPath` d'objets `d'entrée`, puis vous devez mettre à jour votre code afin d'utiliser `entry.toURL()` à la place.

Pour vers l'arrière la compatibilité, la méthode `resolveLocalFileSystemURL()` sera un chemin absolu de l'unité et retourne un objet `Entry` correspondant à elle, tant que ce fichier existe au sein des systèmes de fichiers les `TEMPORARY` ou `PERSISTENT`.

Cela a été particulièrement un problème avec le plugin de transfert de fichiers, qui autrefois périphérique-absolu-chemins (et peut encore accepter). Il a été mis à jour pour fonctionner correctement avec le système de fichiers URL, afin de remplacer `entry.fullPath` par `entry.toURL()` devrait résoudre tout problème obtenir ce plugin pour travailler avec des fichiers sur le périphérique.

Dans v1.1.0 la valeur de retour de `toURL()` a été changée (voir \[CB-6394\] (https://issues.apache.org/jira/browse/CB-6394)) pour renvoyer une URL absolue "file://". dans la mesure du possible. Pour assurer un ' cdvfile:'-URL, vous pouvez utiliser `toInternalURL()` maintenant. Cette méthode retourne maintenant filesystem URL du formulaire

    cdvfile://localhost/persistent/path/to/file
    

qui peut servir à identifier de manière unique le fichier.

## Liste des Codes d'erreur et leur signification

Lorsqu'une erreur est levée, l'un des codes suivants sera utilisé.

| Code | Constant                      |
| ----:|:----------------------------- |
|    1 | `NOT_FOUND_ERR`               |
|    2 | `SECURITY_ERR`                |
|    3 | `ABORT_ERR`                   |
|    4 | `NOT_READABLE_ERR`            |
|    5 | `ENCODING_ERR`                |
|    6 | `NO_MODIFICATION_ALLOWED_ERR` |
|    7 | `INVALID_STATE_ERR`           |
|    8 | `SYNTAX_ERR`                  |
|    9 | `INVALID_MODIFICATION_ERR`    |
|   10 | `QUOTA_EXCEEDED_ERR`          |
|   11 | `TYPE_MISMATCH_ERR`           |
|   12 | `PATH_EXISTS_ERR`             |

## Configuration du Plugin (facultatif)

L'ensemble des systèmes de fichiers disponibles peut être configurée par plate-forme. Les iOS et Android reconnaissent une <preference> balise dans le `fichier config.xml` qui nomme les systèmes de fichiers à installer. Par défaut, toutes les racines du système de fichiers sont activées.

    <preference name="iosExtraFilesystems" value="library,library-nosync,documents,documents-nosync,cache,bundle,root" />
    <preference name="AndroidExtraFilesystems" value="files,files-external,documents,sdcard,cache,cache-external,root" />
    

### Android

*   `files` : répertoire de stockage de fichier interne de l'application
*   `files-external` : répertoire de l'application de stockage de fichier externe
*   `sdcard` : le répertoire de stockage global fichier externe (c'est la racine de la carte SD, s'il est installé). Vous devez avoir la permission de `android.permission.WRITE_EXTERNAL_STORAGE` de l'utiliser.
*   `cache` : répertoire de cache interne de l'application
*   `cache-external` : répertoire de cache externe de l'application
*   `root` : le système de fichiers de tout dispositif

Android prend également en charge un système de fichiers spécial nommé « documents », qui représente un sous-répertoire « / Documents / » dans le système de fichiers « files ».

### iOS

*   `library` : répertoire de bibliothèque de l'application
*   `documents` : répertoire de Documents de l'application
*   `cache` : répertoire de Cache de l'application
*   `bundle` : bundle de l'application ; l'emplacement de l'application elle-même sur disque (lecture seule)
*   `root` : le système de fichiers de tout dispositif

Par défaut, vous peuvent synchroniser les répertoires de la bibliothèque et les documents à iCloud. Vous pouvez également demander des deux systèmes de fichiers supplémentaires, `library-nosync` et `documents-nosync`, qui représentent un répertoire spécial non synchronisées dans le `/Library` ou système de fichiers `/ Documents`.
