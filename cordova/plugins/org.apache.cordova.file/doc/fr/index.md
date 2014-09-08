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

# org.apache.cordova.file

Ce plugin implémente une API de fichier permettant l'accès en lecture/écriture aux fichiers qui résident sur le périphérique.

Ce plugin est basé sur plusieurs spécifications, y compris : l'API de fichier HTML5 <http://www.w3.org/TR/FileAPI/>

Les répertoires (aujourd'hui disparue) et le système des extensions plus récentes : <http://www.w3.org/TR/2012/WD-file-system-api-20120417/> bien que la plupart du code du plugin a été écrit quand une technique antérieure était en vigueur : <http://www.w3.org/TR/2011/WD-file-system-api-20110419/>

Il met également en œuvre la spécification FileWriter : <http://dev.w3.org/2009/dap/file-system/file-writer.html>

Pour son utilisation, veuillez vous reporter au HTML5 Rocks' excellent [article de système de fichiers.][1]

 [1]: http://www.html5rocks.com/en/tutorials/file/filesystem/

Pour un aperçu des autres options de stockage, consultez [guide d'entreposage de Cordova][2].

 [2]: http://cordova.apache.org/docs/en/edge/cordova_storage_storage.md.html

## Installation

    cordova plugin add org.apache.cordova.file
    

## Plates-formes prises en charge

*   Amazon Fire OS
*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 et 8 *
*   Windows 8 *

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
| `/ var/mobile/Applications/< UUID > /` | applicationStorageDirectory | -                     |  r/o  |      N/A      |     N/A     |  N/A  |  Oui  |
|    `appname.app/`                            | applicationDirectory        | Bundle                |  r/o  |      N/A      |     N/A     |  N/A  |  Oui  |
|       `www/`                                 | -                           | -                     |  r/o  |      N/A      |     N/A     |  N/A  |  Oui  |
|    `Documents/`                              | documentsDirectory          | documents             |  r/w  |      Oui      |     Non     |  Oui  |  Oui  |
|       `NoCloud/`                             | -                           | documents-nosync      |  r/w  |      Oui      |     Non     |  Non  |  Oui  |
|    `Library`                                 | -                           | Bibliothèque          |  r/w  |      Oui      |     Non     | Oui ? |  Oui  |
|       `NoCloud/`                             | dataDirectory               | Bibliothèque-nosync   |  r/w  |      Oui      |     Non     |  Non  |  Oui  |
|       `Cloud/`                               | syncedDataDirectory         | -                     |  r/w  |      Oui      |     Non     |  Oui  |  Oui  |
|       `Caches/`                              | cacheDirectory              | cache                 |  r/w  |     Oui *     | Oui \* * *| |  Non  |  Oui  |
|    `tmp/`                                    | tempDirectory               | -                     |  r/w  |    Ne * *     | Oui \* * *| |  Non  |  Oui  |

* Fichiers persistent à travers les redémarrages de l'application et mises à niveau, mais ce répertoire peut être effacé à chaque fois que les désirs de l'OS. Votre application doit être en mesure de recréer tout contenu qui pourrait être supprimé.

* * Fichiers peuvent persister redémarrages de l'application, mais ne vous fiez pas ce comportement. Les fichiers ne sont pas garantis à persister dans l'ensemble de mises à jour. Votre application doit supprimer les fichiers de ce répertoire lorsqu'elle s'applique, comme le système d'exploitation ne garantit pas quand (ou même si) ces fichiers sont supprimés.

\* * *| L'OS peut effacer le contenu de ce répertoire chaque fois qu'il se sent il est nécessaire, mais ne comptez pas là-dessus. Vous devez supprimer ce répertoire comme approprié pour votre application.

### Agencement de système de fichiers Android

| Chemin de l'unité                   | `Cordova.file.*`                    | `AndroidExtraFileSystems` | r/w ? | persistants ? | OS efface | privé |
|:----------------------------------- |:----------------------------------- |:------------------------- |:-----:|:-------------:|:---------:|:-----:|
| `file:///android_asset/`            | applicationDirectory                |                           |  r/o  |      N/A      |    N/A    |  Oui  |
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
| `file:///Accounts/1000/AppData/ < id app > /` | applicationStorageDirectory |  r/o  |      N/A      |    N/A    |  Oui  |
|    `app/native`                                     | applicationDirectory        |  r/o  |      N/A      |    N/A    |  Oui  |
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

    <preference name="AndroidPersistentFileLocation" value="Internal" />
    
    <preference name="AndroidPersistentFileLocation" value="Compatibility" />
    

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

    <preference name="iosPersistentFileLocation" value="Library" />
    
    <preference name="iosPersistentFileLocation" value="Compatibility" />
    

Sans cette ligne, utilisera le fichier plugin `Compatibility` par défaut. Si une balise de préférence est présente et n'est pas une des valeurs suivantes, l'application ne démarrera pas.

Si votre application a déjà été expédiée aux utilisateurs, en utilisant une ancienne (avant 1.0) version de ce plugin et dispose des fichiers stockés dans le système de fichiers persistant, alors vous devez définir la préférence au `Compatibility` . Changer l'emplacement de `Library` voudrait dire que les utilisateurs existants qui mettre à niveau leur application serait incapables d'accéder à leurs fichiers déjà enregistrés.

Si votre application est nouvelle ou a jamais précédemment stocké les fichiers dans le système de fichiers persistant, puis la `Library` réglage est généralement recommandé.

## Firefox OS Quirks

L'API de système de fichier n'est pas nativement pris en charge par Firefox OS et est implémentée comme une cale d'épaisseur sur le dessus d'indexedDB.

*   Ne manque pas lors de la suppression des répertoires non vide
*   Ne supporte pas les métadonnées pour les répertoires
*   Méthodes `copyTo` et `moveTo` ne prennent pas en charge les répertoires

Les chemins de données suivants sont pris en charge: * `applicationDirectory` -utilise `xhr` pour obtenir des fichiers les qui sont emballés avec le $ $ etAPP. * `dataDirectory` - Pour les fichiers de données persistantes de app spécifique. * `cacheDirectory` -Mise en cache de fichiers qui doivent survivre les redémarrages de l'application (les applications ne doivent pas compter sur le système d'exploitation pour supprimer les fichiers ici).

## Notes de mise à niveau

Dans v1.0.0 de ce plugin, la `FileEntry` et `DirectoryEntry` structures ont changé, pour être plus conforme à la spécification publiée.

Les versions précédentes de (pré-1.0.0) du plugin stockaient l'appareil-absolu-fichier-emplacement dans la `fullPath` propriété de `Entry` objets. Ces chemins seraient présente généralement comme

    /var/mobile/Applications/<application UUID>/Documents/path/to/file  (iOS)
    /storage/emulated/0/path/to/file                                    (Android)
    

Ces chemins ont été également renvoyés par la `toURL()` méthode de la `Entry` des objets.

Avec v1.0.0, le `fullPath` attribut contient le chemin vers le fichier, *par rapport à la racine du système de fichiers HTML*. Ainsi, les chemins d'accès ci-dessus seraient maintenant tous les deux être représenté par un `FileEntry` d'objet avec un `fullPath` de

    /path/to/file
    

Si votre application fonctionne avec le dispositif-absolu-chemins, et que vous avez récupéré précédemment ces chemins à travers la `fullPath` propriété de `Entry` objets, puis vous devez mettre à jour votre code d'utiliser `entry.toURL()` à la place.

Pour vers l'arrière compatibilité, le `resolveLocalFileSystemURL()` méthode acceptera un chemin absolu de l'unité et retournera un `Entry` objet correspond, tant que ce fichier existe au sein de soit le `TEMPORARY` ou `PERSISTENT` systèmes de fichiers.

Cela a été particulièrement un problème avec le plugin de transfert de fichiers, qui autrefois périphérique-absolu-chemins (et peut encore accepter). Il a été mis à jour pour fonctionner correctement avec des URL de système de fichiers, remplaçant ainsi `entry.fullPath` avec `entry.toURL()` devrait résoudre tout problème obtenir ce plugin pour travailler avec des fichiers sur le périphérique.

Dans v1.1.0 la valeur de retour de `toURL()` a été changé (voir \[CB-6394\] (https://issues.apache.org/jira/browse/CB-6394)) pour renvoyer une URL absolue « file:// ». dans la mesure du possible. Pour assurer un ' cdvfile:'-URL, vous pouvez utiliser `toInternalURL()` maintenant. Cette méthode retourne maintenant filesystem URL du formulaire

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

L'ensemble des systèmes de fichiers disponibles peut être configurée par plate-forme. Les iOS et Android reconnaissent une <preference> tag dans `config.xml` qui désigne les systèmes de fichiers à installer. Par défaut, toutes les racines du système de fichiers sont activées.

    <preference name="iosExtraFilesystems" value="library,library-nosync,documents,documents-nosync,cache,bundle,root" />
    <preference name="AndroidExtraFilesystems" value="files,files-external,documents,sdcard,cache,cache-external,root" />
    

### Android

*   `files`: Répertoire de stockage de l'application le fichier interne
*   `files-external`: Répertoire de stockage de l'application le fichier externe
*   `sdcard`: Le répertoire de stockage global fichier externe (c'est la racine de la carte SD, s'il est installé). Vous devez avoir la `android.permission.WRITE_EXTERNAL_STORAGE` permission de l'utiliser.
*   `cache`: Répertoire de cache interne de l'application
*   `cache-external`: Répertoire de cache externe de l'application
*   `root`: Le système de fichiers de tout dispositif

Android prend également en charge un système de fichiers spécial nommé « documents », qui représente un sous-répertoire « / Documents / » dans le système de fichiers « files ».

### iOS

*   `library`: Répertoire de l'application la
*   `documents`: Répertoire de Documents de l'application la
*   `cache`: Répertoire du Cache de l'application la
*   `bundle`: Bundle de l'application ; l'emplacement de l'application elle-même sur disque (lecture seule)
*   `root`: Le système de fichiers de tout dispositif

Par défaut, vous peuvent synchroniser les répertoires de la bibliothèque et les documents à iCloud. Vous pouvez également demander des deux autres systèmes de fichiers, `library-nosync` et `documents-nosync` , qui représentent un répertoire spécial non synchronisées dans le `/Library` ou `/Documents` système de fichiers.