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

Queste note sono destinate principalmente per gli sviluppatori di Android e iOS che vogliono scrivere plugin quale interfaccia con il sistema di file utilizzando il File plugin.

## Lavorando con URL di sistema file di Cordova

Dalla versione 1.0.0, questo plugin ha utilizzato gli URL con un `cdvfile` schema per tutte le comunicazioni oltre il ponte, piuttosto che esporre i percorsi del file system di dispositivo raw a JavaScript.

Sul lato JavaScript, questo significa che gli oggetti FileEntry e DirectoryEntry dispongano di un attributo fullPath che è relativo alla directory principale del sistema di file HTML. Se API JavaScript del vostro plugin accetta un oggetto FileEntry o DirectoryEntry, è necessario chiamare `.toURL()` su quell'oggetto prima di passarlo attraverso il ponte in codice nativo.

### Conversione cdvfile: / / URL ai percorsi fileystem

Plugin che hanno bisogno di scrivere il filesystem può essere necessario convertire un URL di sistema del file ricevuto in un percorso effettivo filesystem. Ci sono diversi modi di fare questo, a seconda della piattaforma nativa.

È importante ricordare che non tutti i `cdvfile://` URL sono mappabili ai veri file sul dispositivo. Alcuni URL può riferirsi a beni sul dispositivo che non sono rappresentate da file, o possono anche fare riferimento a risorse remote. A causa di queste possibilità, plugin dovrebbe sempre verificare se ottengono un risultato significativo indietro quando si tenta di convertire gli URL in percorsi.

#### Android

Su Android, il metodo più semplice per convertire un `cdvfile://` URL a un percorso di file System è quello di utilizzare `org.apache.cordova.CordovaResourceApi` . `CordovaResourceApi`dispone di diversi metodi che è possono gestire `cdvfile://` URL:

    webView è un membro del Plugin classe CordovaResourceApi resourceApi = webView.getResourceApi();
    
    Ottenere un URL file:/// che rappresenta questo file sul dispositivo, / / o lo stesso URL invariata se non può essere mappato a un file Uri fileURL = resourceApi.remapUri(Uri.parse(cdvfileURL));
    

È anche possibile utilizzare direttamente il File plugin:

    importazione org.apache.cordova.file.FileUtils;
    importazione org.apache.cordova.file.FileSystem;
    importazione java.net.MalformedURLException;
    
    Ottenere il File plugin dal gestore plugin FileUtils filePlugin = (FileUtils)webView.pluginManager.getPlugin("File");
    
    Dato un URL, ottenere un percorso per esso prova {String path = filePlugin.filesystemPathForURL(cdvfileURL);}} catch (MalformedURLException e) {/ / l'url del file System non è stato riconosciuto}
    

Convertire da un percorso a un `cdvfile://` URL:

    importazione org.apache.cordova.file.LocalFilesystemURL;
    
    Ottenere un oggetto LocalFilesystemURL per un percorso di dispositivo, / / oppure null se non può essere rappresentata come un URL di cdvfile.
    LocalFilesystemURL url = filePlugin.filesystemURLforLocalPath(path);
    Ottenere la rappresentazione di stringa dell'URL oggetto String cdvfileURL = url.toString();
    

Se il vostro plugin crea un file e si desidera restituire un oggetto FileEntry per esso, utilizzare il File plugin:

    Restituire una struttura JSON appropriato per restituire a JavaScript, / / o null se questo file non è rappresentabile come un URL di cdvfile.
    Voce di JSONObject = filePlugin.getEntryForFile(file);
    

#### iOS

Cordova su iOS non utilizza lo stesso `CordovaResourceApi` concetto come Android. Su iOS, si dovrebbe utilizzare il plugin File per convertire tra URL e percorsi di file System.

    Ottenere un oggetto CDVFilesystem URL da una stringa CDVFilesystemURL * url = [CDVFilesystemURL fileSystemURLWithString:cdvfileURL];
    Ottenere un percorso per l'oggetto URL, o zero se non può essere mappato a un percorso di file NSString * = [filePlugin filesystemPathForURL:url];
    
    
    Ottenere un oggetto CDVFilesystem URL per un percorso di dispositivo, o / / nullo se non può essere rappresentata come un URL di cdvfile.
    CDVFilesystemURL * url = [filePlugin fileSystemURLforLocalPath:path];
    Ottenere la rappresentazione di stringa dell'URL oggetto NSString * cdvfileURL = [absoluteString url];
    

Se il vostro plugin crea un file e si desidera restituire un oggetto FileEntry per esso, utilizzare il File plugin:

    Ottenere un oggetto CDVFilesystem URL per un percorso di dispositivo, o / / nullo se non può essere rappresentata come un URL di cdvfile.
    CDVFilesystemURL * url = [filePlugin fileSystemURLforLocalPath:path];
    Ottenere una struttura per tornare alla voce JavaScript NSDictionary * = [filePlugin makeEntryForLocalURL:url]
    

#### JavaScript

In JavaScript, per ottenere un `cdvfile://` URL da un oggetto FileEntry o DirectoryEntry, semplicemente chiamare `.toURL()` su di esso:

    var cdvfileURL = entry.toURL();
    

Nei gestori di risposta del plugin, per convertire da una struttura FileEntry restituita in un oggetto reale di voce, il codice del gestore dovrebbe importare il File plugin e creare un nuovo oggetto:

    creare la voce appropriata a voce oggetto var;
    Se (entryStruct.isDirectory) {voce = new DirectoryEntry (entryStruct.name, entryStruct.fullPath, nuovo FileSystem(entryStruct.filesystemName));} altro {voce = FileEntry nuovo (entryStruct.name, entryStruct.fullPath, nuovo FileSystem(entryStruct.filesystemName));}