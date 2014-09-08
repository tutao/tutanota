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

## Travaillant avec des URL de système pour le fichier Cordova

Depuis la version 1.0.0, ce plugin utilise des URL avec un `cdvfile` guichet pour toutes les communications sur le pont, plutôt que d'exposer les chemins de système de fichiers de périphérique brut à JavaScript.

Du côté du JavaScript, cela signifie que les objets DirectoryEntry et de FileEntry ont un attribut fullPath qui est relatif à la racine du système de fichiers HTML. Si l'API JavaScript de votre plugin accepte un objet FileEntry ou DirectoryEntry, vous devez appeler `.toURL()` sur cet objet avant de le passer sur le pont en code natif.

### Conversion des cdvfile: / / URL pour les chemins de fileystem

Plugins qui ont besoin d'écrire dans le système de fichiers pouvez convertir un fichier reçu système URL vers un emplacement de système de fichiers réels. Il y a plusieurs façons de le faire, selon la plate-forme native.

Il est important de rappeler que pas tous les `cdvfile://` URL sont cartographiables à des fichiers sur le périphérique. Certaines URL peut faire référence aux actifs sur les périphériques qui ne sont pas représentés par des fichiers, ou peuvent même faire référence aux ressources distantes. En raison de ces possibilités, plugins devraient toujours tester si ils obtiennent un résultat significatif, retour en essayant de convertir les URL aux chemins d'accès.

#### Android

Sur Android, la méthode la plus simple pour convertir un `cdvfile://` URL vers un chemin d'accès de système de fichiers est d'utiliser `org.apache.cordova.CordovaResourceApi` . `CordovaResourceApi`comporte plusieurs méthodes qui peuvent gérer `cdvfile://` URL :

    // webView is a member of the Plugin class
    CordovaResourceApi resourceApi = webView.getResourceApi();
    
    // Obtain a file:/// URL representing this file on the device,
    // or the same URL unchanged if it cannot be mapped to a file
    Uri fileURL = resourceApi.remapUri(Uri.parse(cdvfileURL));
    

Il est également possible d'utiliser le fichier plugin directement :

    import org.apache.cordova.file.FileUtils;
    import org.apache.cordova.file.FileSystem;
    import java.net.MalformedURLException;
    
    // Get the File plugin from the plugin manager
    FileUtils filePlugin = (FileUtils)webView.pluginManager.getPlugin("File");
    
    // Given a URL, get a path for it
    try {
        String path = filePlugin.filesystemPathForURL(cdvfileURL);
    } catch (MalformedURLException e) {
        // The filesystem url wasn't recognized
    }
    

Pour convertir un chemin d'accès à un `cdvfile://` URL :

    import org.apache.cordova.file.LocalFilesystemURL;
    
    // Get a LocalFilesystemURL object for a device path,
    // or null if it cannot be represented as a cdvfile URL.
    LocalFilesystemURL url = filePlugin.filesystemURLforLocalPath(path);
    // Get the string representation of the URL object
    String cdvfileURL = url.toString();
    

Si votre plugin crée un fichier et que vous souhaitez renvoyer un objet FileEntry pour cela, utilisez le fichier plugin :

    // Return a JSON structure suitable for returning to JavaScript,
    // or null if this file is not representable as a cdvfile URL.
    JSONObject entry = filePlugin.getEntryForFile(file);
    

#### iOS

Cordova sur iOS n'utilise pas le même `CordovaResourceApi` concept d'Android. Sur iOS, vous devez utiliser le fichier plugin pour convertir entre les URL et les chemins d'accès de système de fichiers.

    // Get a CDVFilesystem URL object from a URL string
    CDVFilesystemURL* url = [CDVFilesystemURL fileSystemURLWithString:cdvfileURL];
    // Get a path for the URL object, or nil if it cannot be mapped to a file
    NSString* path = [filePlugin filesystemPathForURL:url];
    
    
    // Get a CDVFilesystem URL object for a device path, or
    // nil if it cannot be represented as a cdvfile URL.
    CDVFilesystemURL* url = [filePlugin fileSystemURLforLocalPath:path];
    // Get the string representation of the URL object
    NSString* cdvfileURL = [url absoluteString];
    

Si votre plugin crée un fichier et que vous souhaitez renvoyer un objet FileEntry pour cela, utilisez le fichier plugin :

    // Get a CDVFilesystem URL object for a device path, or
    // nil if it cannot be represented as a cdvfile URL.
    CDVFilesystemURL* url = [filePlugin fileSystemURLforLocalPath:path];
    // Get a structure to return to JavaScript
    NSDictionary* entry = [filePlugin makeEntryForLocalURL:url]
    

#### JavaScript

En JavaScript, pour obtenir un `cdvfile://` URL d'un objet FileEntry ou DirectoryEntry, il suffit d'appeler `.toURL()` à ce sujet :

    var cdvfileURL = entry.toURL();
    

Dans gestionnaires de plugin de réponse, pour convertir une structure FileEntry retournée vers un objet réel de l'entrée, votre code de gestionnaire doit importer le fichier plugin et créer un nouvel objet :

    // create appropriate Entry object
    var entry;
    if (entryStruct.isDirectory) {
        entry = new DirectoryEntry(entryStruct.name, entryStruct.fullPath, new FileSystem(entryStruct.filesystemName));
    } else {
        entry = new FileEntry(entryStruct.name, entryStruct.fullPath, new FileSystem(entryStruct.filesystemName));
    }