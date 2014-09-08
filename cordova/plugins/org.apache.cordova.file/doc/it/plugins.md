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

# Note per gli sviluppatori di plugin

Queste note sono principalmente destinate agli sviluppatori di Android e iOS che vogliono scrivere plugin quale interfaccia con il sistema di file utilizzando il File del plugin.

## Lavorare con file di Cordova sistema gli URL

Dalla versione 1.0.0, questo plugin ha utilizzato gli URL con un `cdvfile` regime per tutte le comunicazioni oltre il ponte, piuttosto che esporre i percorsi del dispositivo raw file system a JavaScript.

Sul lato JavaScript, questo significa che gli oggetti FileEntry e DirectoryEntry hanno un attributo fullPath che è relativo alla directory principale del sistema di file HTML. Se JavaScript API del vostro plugin accetta un oggetto FileEntry o DirectoryEntry, dovrebbe chiamare `.toURL()` su quell'oggetto prima di passarlo attraverso il ponte in codice nativo.

### Conversione cdvfile: / / URL per percorsi fileystem

Plugin che occorre scrivere al filesystem potrebbe voler convertire un URL del sistema file ricevuto in una filesystem effettiva posizione. Ci sono diversi modi di fare questo, a seconda della piattaforma nativa.

È importante ricordare che non tutti i `cdvfile://` gli URL sono mappabili ai veri file sul dispositivo. Alcuni URL può riferirsi a beni sul dispositivo che non sono rappresentati da file, o possono anche riferirsi a risorse remote. A causa di queste possibilità, plugin dovrebbe sempre verificare se ottengono un risultato espressivo indietro quando si tenta di convertire gli URL in tracciati.

#### Android

Su Android, il metodo più semplice per convertire un `cdvfile://` URL a un percorso di file System è quello di utilizzare `org.apache.cordova.CordovaResourceApi` . `CordovaResourceApi`dispone di diversi metodi in grado di gestire `cdvfile://` URL:

    // webView is a member of the Plugin class
    CordovaResourceApi resourceApi = webView.getResourceApi();
    
    // Obtain a file:/// URL representing this file on the device,
    // or the same URL unchanged if it cannot be mapped to a file
    Uri fileURL = resourceApi.remapUri(Uri.parse(cdvfileURL));
    

È anche possibile utilizzare direttamente il File del plugin:

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
    

Per convertire da un percorso a un `cdvfile://` URL:

    import org.apache.cordova.file.LocalFilesystemURL;
    
    // Get a LocalFilesystemURL object for a device path,
    // or null if it cannot be represented as a cdvfile URL.
    LocalFilesystemURL url = filePlugin.filesystemURLforLocalPath(path);
    // Get the string representation of the URL object
    String cdvfileURL = url.toString();
    

Se il tuo plugin crea un file e si desidera restituire un oggetto FileEntry per esso, utilizzare il File del plugin:

    // Return a JSON structure suitable for returning to JavaScript,
    // or null if this file is not representable as a cdvfile URL.
    JSONObject entry = filePlugin.getEntryForFile(file);
    

#### iOS

Cordova su iOS non utilizza lo stesso `CordovaResourceApi` concetto come Android. Su iOS, è necessario utilizzare il File del plugin per la conversione tra URL e percorsi del file System.

    // Get a CDVFilesystem URL object from a URL string
    CDVFilesystemURL* url = [CDVFilesystemURL fileSystemURLWithString:cdvfileURL];
    // Get a path for the URL object, or nil if it cannot be mapped to a file
    NSString* path = [filePlugin filesystemPathForURL:url];
    
    
    // Get a CDVFilesystem URL object for a device path, or
    // nil if it cannot be represented as a cdvfile URL.
    CDVFilesystemURL* url = [filePlugin fileSystemURLforLocalPath:path];
    // Get the string representation of the URL object
    NSString* cdvfileURL = [url absoluteString];
    

Se il tuo plugin crea un file e si desidera restituire un oggetto FileEntry per esso, utilizzare il File del plugin:

    // Get a CDVFilesystem URL object for a device path, or
    // nil if it cannot be represented as a cdvfile URL.
    CDVFilesystemURL* url = [filePlugin fileSystemURLforLocalPath:path];
    // Get a structure to return to JavaScript
    NSDictionary* entry = [filePlugin makeEntryForLocalURL:url]
    

#### JavaScript

In JavaScript, per ottenere un `cdvfile://` URL da un oggetto FileEntry o DirectoryEntry, semplicemente chiamare `.toURL()` su di esso:

    var cdvfileURL = entry.toURL();
    

Nei gestori di risposta plugin, per convertire da una struttura FileEntry restituita in un oggetto effettivo della voce, il codice del gestore dovrebbe importare il File del plugin e creare un nuovo oggetto:

    // create appropriate Entry object
    var entry;
    if (entryStruct.isDirectory) {
        entry = new DirectoryEntry(entryStruct.name, entryStruct.fullPath, new FileSystem(entryStruct.filesystemName));
    } else {
        entry = new FileEntry(entryStruct.name, entryStruct.fullPath, new FileSystem(entryStruct.filesystemName));
    }