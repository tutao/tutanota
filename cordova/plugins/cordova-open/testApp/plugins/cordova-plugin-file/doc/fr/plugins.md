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

# Notes pour les développeurs de plugins

Ces notes sont principalement destinés à des développeurs Android et iOS qui veulent écrire des plugins qui interface avec le système de fichiers en utilisant le fichier plugin.

## Travailler avec Cordova fichier système URL

Depuis la version 1.0.0, ce plugin utilise des URL avec un `cdvfile` guichet pour toutes les communications sur le pont, plutôt que d'exposer des chemins de système de fichiers de périphérique brut à JavaScript.

Du côté du JavaScript, cela signifie que les objets FileEntry et DirectoryEntry ont un attribut fullPath qui est relatif à la racine du système de fichiers HTML. Si votre plugin JavaScript API accepte un objet FileEntry ou DirectoryEntry, vous devez appeler `.toURL()` sur cet objet avant de le passer sur le pont en code natif.

### Conversion de cdvfile: / / URL aux chemins d'accès fileystem

Plugins qui ont besoin d'écrire dans le système de fichiers pouvez convertir un fichier reçu système URL vers un emplacement de système de fichiers réels. Il y a plusieurs façons de le faire, selon la plate-forme native.

Il est important de rappeler que pas tous les `cdvfile://` URL sont cartographiables à des fichiers sur le périphérique. Certaines URL peut faire référence aux actifs sur les périphériques qui ne sont pas représentés par des fichiers, ou peuvent même faire référence aux ressources distantes. En raison de ces possibilités, plugins devraient toujours tester si ils obtiennent un résultat significatif retour lorsque vous essayez de convertir les URL aux chemins d'accès.

#### Androïde

Sur Android, la méthode la plus simple pour convertir un `cdvfile://` URL vers un chemin d'accès de système de fichiers est d'utiliser `org.apache.cordova.CordovaResourceApi` . `CordovaResourceApi`possède plusieurs méthodes qui peuvent gérer `cdvfile://` URL :

    webView est membre de la Plugin classe CordovaResourceApi resourceApi = webView.getResourceApi() ;
    
    Obtenir une URL file:/// représentant ce fichier sur le périphérique, / / ou le même URL inchangée si elle ne peut pas être mappée à un fichier Uri fileURL = resourceApi.remapUri(Uri.parse(cdvfileURL)) ;
    

Il est également possible d'utiliser le fichier plugin directement :

    Import org.apache.cordova.file.FileUtils ;
    Import org.apache.cordova.file.FileSystem ;
    java.net.MalformedURLException d'importation ;
    
    Téléchargez le fichier plugin depuis le gestionnaire de plugin FileUtils filePlugin = (FileUtils)webView.pluginManager.getPlugin("File") ;
    
    En donnant une URL, obtenir un chemin d'accès pour essayer {String path = filePlugin.filesystemPathForURL(cdvfileURL);} catch (MalformedURLException e) {/ / l'url du système de fichiers n'a pas été reconnu}
    

Pour convertir un chemin d'accès à un `cdvfile://` URL :

    Import org.apache.cordova.file.LocalFilesystemURL ;
    
    Obtenir un objet LocalFilesystemURL pour un chemin de périphérique, / / ou null si elle ne peut être représentée sous forme d'URL cdvfile.
    LocalFilesystemURL url = filePlugin.filesystemURLforLocalPath(path) ;
    Obtenir la chaîne représentant l'URL objet String cdvfileURL = url.toString() ;
    

Si votre plugin crée un fichier et que vous souhaitez renvoyer un objet FileEntry pour cela, utilisez le fichier plugin :

    Retourne une structure JSON approprié pour revenir en JavaScript, / / ou null si ce fichier n'est pas représentable sous forme d'URL cdvfile.
    JSONObject entrée = filePlugin.getEntryForFile(file) ;
    

#### iOS

Cordova sur iOS n'utilise pas le même `CordovaResourceApi` concept d'Android. Sur iOS, vous devez utiliser le fichier plugin pour convertir entre les URL et les chemins d'accès de système de fichiers.

    Obtenir un objet URL CDVFilesystem partir d'une chaîne d'URL CDVFilesystemURL * url = [CDVFilesystemURL fileSystemURLWithString:cdvfileURL] ;
    Obtenir un chemin d'accès de l'objet URL, ou zéro si elle ne peut pas être mappée à un chemin de fichier NSString * = [filePlugin filesystemPathForURL:url] ;
    
    
    Obtenir un objet CDVFilesystem URL pour un chemin de périphérique, ou / / zéro si elle ne peut être représentée sous forme d'URL cdvfile.
    CDVFilesystemURL * url = [filePlugin fileSystemURLforLocalPath:path] ;
    Obtenir la représentation de chaîne de l'objet NSString * cdvfileURL URL = [url absoluteString] ;
    

Si votre plugin crée un fichier et que vous souhaitez renvoyer un objet FileEntry pour cela, utilisez le fichier plugin :

    Obtenir un objet CDVFilesystem URL pour un chemin de périphérique, ou / / zéro si elle ne peut être représentée sous forme d'URL cdvfile.
    CDVFilesystemURL * url = [filePlugin fileSystemURLforLocalPath:path] ;
    Obtenir une structure pour revenir à JavaScript NSDictionary * entrée = [filePlugin makeEntryForLocalURL:url]
    

#### JavaScript

En JavaScript, pour obtenir un `cdvfile://` URL d'un objet FileEntry ou DirectoryEntry, il suffit d'appeler `.toURL()` à ce sujet :

    var cdvfileURL = entry.toURL() ;
    

Dans gestionnaires de plugin de réponse, pour convertir une structure FileEntry retournée vers un objet réel de l'entrée, votre code de gestionnaire doit importer le fichier plugin et créer un nouvel objet :

    créer l'entrée de var d'objet entrée appropriée ;
    Si (entryStruct.isDirectory) {entrée = new DirectoryEntry (entryStruct.name, entryStruct.fullPath, nouveau FileSystem(entryStruct.filesystemName));} else {entrée = nouvelle FileEntry (entryStruct.name, entryStruct.fullPath, nouvelle FileSystem(entryStruct.filesystemName));}