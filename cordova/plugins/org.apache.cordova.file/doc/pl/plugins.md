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

# Uwagi dla programistów wtyczki

Te notatki są przeznaczone przede wszystkim dla Androida i iOS programistów, którzy chcieli pisac pluginy które interfejs z systemu plików za pomocą wtyczki pliku.

## Praca z Cordova pliku system adresów URL

Od wersji 1.0.0, ten plugin jest używane adresy URL z `cdvfile` system do komunikacji przez most, a nie narażać urządzenia raw ścieżki systemu plików JavaScript.

Na stronie JavaScript oznacza to, że FileEntry i DirectoryEntry obiekty mają fullPath atrybut, który jest głównym systemie plików HTML. Jeśli twój plugin JavaScript API akceptuje obiektu DirectoryEntry lub FileEntry, należy zadzwonić `.toURL()` na obiekt przed przekazaniem przez most do kodu macierzystego.

### Konwersja cdvfile: / / URL do ścieżki fileystem

Wtyczek, które trzeba pisać do systemu plików może chcesz przekonwertować odebranych plików systemu adres URL lokalizacji rzeczywistych plików. Istnieje wiele sposobów działania, od macierzystego platformy.

Ważne jest, aby pamiętać, że nie wszystkie `cdvfile://` adresy URL są można zmapować na prawdziwe akta urządzeniu. Niektóre adresy URL może odnosić się do aktywów na urządzeniu, które nie są reprezentowane przez pliki, lub nawet może odnosić się do zasobów zdalnych. Z powodu tych możliwości wtyczki należy zawsze sprawdzić, czy się znaczących wyników wstecz, podczas próby konwersji adresów URL do ścieżki.

#### Android

Na Android, najprostsza metoda konwersji `cdvfile://` URL do ścieżki systemu plików jest użycie `org.apache.cordova.CordovaResourceApi` . `CordovaResourceApi`jest kilka metod, które mogą obsługiwać `cdvfile://` adresów URL:

    // webView is a member of the Plugin class
    CordovaResourceApi resourceApi = webView.getResourceApi();
    
    // Obtain a file:/// URL representing this file on the device,
    // or the same URL unchanged if it cannot be mapped to a file
    Uri fileURL = resourceApi.remapUri(Uri.parse(cdvfileURL));
    

Jest również możliwe, aby korzystać z wtyczki pliku bezpośrednio:

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
    

Do przeliczenia ścieżki do `cdvfile://` adres URL:

    import org.apache.cordova.file.LocalFilesystemURL;
    
    // Get a LocalFilesystemURL object for a device path,
    // or null if it cannot be represented as a cdvfile URL.
    LocalFilesystemURL url = filePlugin.filesystemURLforLocalPath(path);
    // Get the string representation of the URL object
    String cdvfileURL = url.toString();
    

Jeśli twój plugin tworzy plik, i chcesz zwraca obiekt FileEntry dla niego, użyj pliku plugin:

    // Return a JSON structure suitable for returning to JavaScript,
    // or null if this file is not representable as a cdvfile URL.
    JSONObject entry = filePlugin.getEntryForFile(file);
    

#### iOS

Cordova na iOS nie korzystać z tego samego `CordovaResourceApi` koncepcji jak Android. Na iOS należy użyć pliku plugin do konwersji między adresach URL i ścieżkach plików.

    // Get a CDVFilesystem URL object from a URL string
    CDVFilesystemURL* url = [CDVFilesystemURL fileSystemURLWithString:cdvfileURL];
    // Get a path for the URL object, or nil if it cannot be mapped to a file
    NSString* path = [filePlugin filesystemPathForURL:url];
    
    
    // Get a CDVFilesystem URL object for a device path, or
    // nil if it cannot be represented as a cdvfile URL.
    CDVFilesystemURL* url = [filePlugin fileSystemURLforLocalPath:path];
    // Get the string representation of the URL object
    NSString* cdvfileURL = [url absoluteString];
    

Jeśli twój plugin tworzy plik, i chcesz zwraca obiekt FileEntry dla niego, użyj pliku plugin:

    // Get a CDVFilesystem URL object for a device path, or
    // nil if it cannot be represented as a cdvfile URL.
    CDVFilesystemURL* url = [filePlugin fileSystemURLforLocalPath:path];
    // Get a structure to return to JavaScript
    NSDictionary* entry = [filePlugin makeEntryForLocalURL:url]
    

#### JavaScript

W JavaScript, aby uzyskać `cdvfile://` adres URL z obiektu FileEntry lub DirectoryEntry, wystarczy zadzwonić `.toURL()` na to:

    var cdvfileURL = entry.toURL();
    

W plugin obsługi odpowiedzi do przeliczenia strukturę FileEntry wrócił do rzeczywistego obiektu wejścia, kod obsługi należy importować pliku plugin i utworzyć nowy obiekt:

    // create appropriate Entry object
    var entry;
    if (entryStruct.isDirectory) {
        entry = new DirectoryEntry(entryStruct.name, entryStruct.fullPath, new FileSystem(entryStruct.filesystemName));
    } else {
        entry = new FileEntry(entryStruct.name, entryStruct.fullPath, new FileSystem(entryStruct.filesystemName));
    }