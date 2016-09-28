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

Te notatki są przeznaczone przede wszystkim dla Androida i iOS deweloperów, którzy chcieli pisac pluginy które interfejs z systemu plików za pomocą wtyczki pliku.

## Praca z Cordova pliku system adresów URL

Od wersji 1.0.0, ten plugin ma używane adresy URL z `cdvfile` system dla wszystkich komunikacji przez most, a nie narażać urządzenia raw ścieżki systemu plików JavaScript.

Na stronie JavaScript oznacza to, że FileEntry i DirectoryEntry obiekty mają fullPath atrybut, który jest głównym systemie plików HTML. Jeśli twój plugin JavaScript API akceptuje obiektu FileEntry lub DirectoryEntry, należy zadzwonić `.toURL()` dla tego obiektu przed przekazaniem Altpradl do kodu macierzystego.

### Konwersja cdvfile: / / URL do ścieżki fileystem

Wtyczek, które trzeba pisać do systemu plików może chcesz przekonwertować odebranych plików systemu adres URL lokalizacji rzeczywistych plików. Istnieje wiele sposobów robi to, w zależności od macierzystego platformy.

Ważne jest, aby pamiętać, że nie wszystkie `cdvfile://` adresy URL są można zmapować na prawdziwe pliki w urządzeniu. Niektóre adresy URL może odnosić się do aktywów na urządzeniu, które nie są reprezentowane przez pliki, lub nawet może odnosić się do zasobów zdalnych. Ze względu na te możliwości wtyczki należy zawsze sprawdzić, czy się znaczącego wyniku powrót podczas próby konwersji adresów URL do ścieżki.

#### Androida

Na Android, najprostsza metoda konwersji `cdvfile://` URL do ścieżki systemu plików jest użycie `org.apache.cordova.CordovaResourceApi` . `CordovaResourceApi`jest kilka metod, które mogą obsługiwać `cdvfile://` adresów URL:

    Widok sieci Web jest członkiem Plugin klasy CordovaResourceApi resourceApi = webView.getResourceApi();
    
    Uzyskać URL file:/// reprezentujących ten plik na urządzeniu / / lub ten sam adres URL niezmienione, jeśli nie mogą być mapowane do pliku fileURL Uri = resourceApi.remapUri(Uri.parse(cdvfileURL));
    

Jest również możliwe, aby korzystać z wtyczki pliku bezpośrednio:

    org.apache.cordova.file.FileUtils przywóz;
    org.apache.cordova.file.FileSystem przywóz;
    java.net.MalformedURLException przywóz;
    
    Uzyskać pliku plugin manager wtyczki FileUtils filePlugin = (FileUtils)webView.pluginManager.getPlugin("File");
    
    Biorąc pod uwagę adres URL, uzyskać ścieżkę dla to spróbuj {String ścieżka = filePlugin.filesystemPathForURL(cdvfileURL);} catch (MalformedURLException e) {/ / url plików nie było uznane}
    

Do przeliczenia ścieżki do `cdvfile://` URL:

    org.apache.cordova.file.LocalFilesystemURL przywóz;
    
    Uzyskanie obiektu LocalFilesystemURL na ścieżkę urządzenia / / lub null, jeśli nie może być reprezentowana jako adres URL cdvfile.
    LocalFilesystemURL url = filePlugin.filesystemURLforLocalPath(path);
    Dostać reprezentację ciąg adresu URL obiektu String cdvfileURL = url.toString();
    

Jeśli twój plugin tworzy plik, i chcesz zwraca obiekt FileEntry dla niego, użyj pliku plugin:

    Zwraca JSON struktura nadaje się do powrotu do JavaScript, / / lub null, jeśli ten plik nie jest reprezentować jako adres URL cdvfile.
    Wpis JSONObject = filePlugin.getEntryForFile(file);
    

#### iOS

Cordova na iOS nie korzystać z tego samego `CordovaResourceApi` koncepcji jak Android. Na iOS należy użyć pliku plugin do konwersji między adresach URL i ścieżkach plików.

    Uzyskać obiekt CDVFilesystem URL URL url ciąg CDVFilesystemURL * = [CDVFilesystemURL fileSystemURLWithString:cdvfileURL];
    Uzyskać ścieżkę dla URL obiektu, stawka zerowa, jeśli nie mogą być mapowane do ścieżki pliku NSString * = [filePlugin filesystemPathForURL:url];
    
    
    Dostać CDVFilesystem URL obiektu na ścieżkę urządzenia lub / / zerowe, jeśli nie może być reprezentowana jako adres URL cdvfile.
    CDVFilesystemURL * url = [filePlugin fileSystemURLforLocalPath:path];
    Dostać reprezentację ciąg adresu URL obiektu NSString * cdvfileURL = [url absoluteString];
    

Jeśli twój plugin tworzy plik, i chcesz zwraca obiekt FileEntry dla niego, użyj pliku plugin:

    Dostać CDVFilesystem URL obiektu na ścieżkę urządzenia lub / / zerowe, jeśli nie może być reprezentowana jako adres URL cdvfile.
    CDVFilesystemURL * url = [filePlugin fileSystemURLforLocalPath:path];
    Struktura wrócić do JavaScript NSDictionary * wpis = [filePlugin makeEntryForLocalURL:url]
    

#### JavaScript

W JavaScript, aby uzyskać `cdvfile://` adres URL z obiektu FileEntry lub DirectoryEntry, wystarczy zadzwonić `.toURL()` na to:

    var cdvfileURL = entry.toURL();
    

W plugin reakcji obsługi przerobić od zwróconych struktury FileEntry do rzeczywistego obiektu wejścia, kod obsługi należy zaimportować pliku plugin i utworzyć nowy obiekt:

    utworzyć odpowiedni wpis obiektu var wpis;
    Jeśli (entryStruct.isDirectory) {wpis = nowy DirectoryEntry (entryStruct.name, entryStruct.fullPath, nowe FileSystem(entryStruct.filesystemName));} jeszcze {wpis = nowy FileEntry (entryStruct.name, entryStruct.fullPath, nowe FileSystem(entryStruct.filesystemName));}