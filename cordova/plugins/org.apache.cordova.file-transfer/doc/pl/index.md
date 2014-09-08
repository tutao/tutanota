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

# org.apache.cordova.file-transfer

Plugin pozwala na przesyłanie i pobieranie plików.

## Instalacji

    cordova plugin add org.apache.cordova.file-transfer
    

## Obsługiwane platformy

*   Amazon ogień OS
*   Android
*   Jeżyna 10
*   Firefox OS **
*   iOS
*   Windows Phone 7 i 8 *
*   Windows 8 *

* *Nie obsługują `onprogress` ani `abort()` *

** *Nie obsługują `onprogress` *

# FileTransfer

`FileTransfer`Obiekt zapewnia sposób wgrać pliki przy użyciu żądania HTTP wieloczęściowe POST i pobierania plików, jak również.

## Właściwości

*   **OnProgress**: o nazwie `ProgressEvent` gdy nowy kawałek danych jest przenoszona. *(Funkcja)*

## Metody

*   **wgraj**: wysyła plik na serwer.

*   **do pobrania**: pliki do pobrania pliku z serwera.

*   **przerwać**: przerywa w toku transferu.

## upload

**Parametry**:

*   **fileURL**: URL plików reprezentujących pliku na urządzenie. Dla wstecznej kompatybilności, to może również być pełną ścieżkę pliku na urządzenie. (Zobacz [wstecz zgodności zauważa] poniżej)

*   **serwer**: adres URL serwera, aby otrzymać plik, jak kodowane przez`encodeURI()`.

*   **successCallback**: wywołania zwrotnego, który jest przekazywany `Metadata` obiektu. *(Funkcja)*

*   **errorCallback**: wywołanie zwrotne, które wykonuje, jeżeli wystąpi błąd pobierania `Metadata` . Wywołany z `FileTransferError` obiektu. *(Funkcja)*

*   **Opcje**: parametry opcjonalne *(obiektu)*. Ważne klucze:
    
    *   **fileKey**: nazwa elementu form. Domyślnie `file` . (DOMString)
    *   **Nazwa pliku**: nazwy pliku, aby użyć podczas zapisywania pliku na serwerze. Domyślnie `image.jpg` . (DOMString)
    *   **mimeType**: Typ mime danych do przesłania. Domyślnie `image/jpeg` . (DOMString)
    *   **Parametry**: zestaw par opcjonalny klucz/wartość w żądaniu HTTP. (Obiekt)
    *   **chunkedMode**: czy przekazać dane w trybie pakietowego przesyłania strumieniowego. Domyślnie `true` . (Wartość logiczna)
    *   **nagłówki**: Mapa wartości Nazwa/nagłówka nagłówek. Aby określić więcej niż jedną wartość, należy użyć tablicę. (Obiekt)

*   **trustAllHosts**: parametr opcjonalny, domyślnie `false` . Jeśli zestaw `true` , to akceptuje wszystkie certyfikaty bezpieczeństwa. Jest to przydatne, ponieważ Android odrzuca Certyfikaty samopodpisane. Nie zaleca się do użytku produkcyjnego. Obsługiwane na Androida i iOS. *(wartość logiczna)*

### Przykład

    // !! Assumes variable fileURL contains a valid URL to a text file on the device,
    //    for example, cdvfile://localhost/persistent/path/to/file.txt
    
    var win = function (r) {
        console.log("Code = " + r.responseCode);
        console.log("Response = " + r.response);
        console.log("Sent = " + r.bytesSent);
    }
    
    var fail = function (error) {
        alert("An error has occurred: Code = " + error.code);
        console.log("upload error source " + error.source);
        console.log("upload error target " + error.target);
    }
    
    var options = new FileUploadOptions();
    options.fileKey = "file";
    options.fileName = fileURL.substr(fileURL.lastIndexOf('/') + 1);
    options.mimeType = "text/plain";
    
    var params = {};
    params.value1 = "test";
    params.value2 = "param";
    
    options.params = params;
    
    var ft = new FileTransfer();
    ft.upload(fileURL, encodeURI("http://some.server.com/upload.php"), win, fail, options);
    

### Przykład z Prześlij nagłówki i zdarzeń postępu (Android i iOS tylko)

    function win(r) {
        console.log("Code = " + r.responseCode);
        console.log("Response = " + r.response);
        console.log("Sent = " + r.bytesSent);
    }
    
    function fail(error) {
        alert("An error has occurred: Code = " + error.code);
        console.log("upload error source " + error.source);
        console.log("upload error target " + error.target);
    }
    
    var uri = encodeURI("http://some.server.com/upload.php");
    
    var options = new FileUploadOptions();
    options.fileKey="file";
    options.fileName=fileURL.substr(fileURL.lastIndexOf('/')+1);
    options.mimeType="text/plain";
    
    var headers={'headerParam':'headerValue'};
    
    options.headers = headers;
    
    var ft = new FileTransfer();
    ft.onprogress = function(progressEvent) {
        if (progressEvent.lengthComputable) {
          loadingStatus.setPercentage(progressEvent.loaded / progressEvent.total);
        } else {
          loadingStatus.increment();
        }
    };
    ft.upload(fileURL, uri, win, fail, options);
    

## FileUploadResult

A `FileUploadResult` obiekt jest przekazywany do funkcji callback sukces z `FileTransfer` obiektu `upload()` Metoda.

### Właściwości

*   **bytesSent**: liczba bajtów wysłanych do serwera jako część upload. (długie)

*   **responseCode**: kod odpowiedzi HTTP, zwracane przez serwer. (długie)

*   **odpowiedź**: HTTP odpowiedzi zwracane przez serwer. (DOMString)

*   **nagłówki**: nagłówki HTTP odpowiedzi przez serwer. (Obiekt)
    
    *   Obecnie obsługiwane na iOS tylko.

### iOS dziwactwa

*   Nie obsługuje `responseCode` lub`bytesSent`.

## Pobierz za darmo

**Parametry**:

*   **Źródło**: adres URL serwera, aby pobrać plik, jak kodowane przez`encodeURI()`.

*   **cel**: url plików reprezentujących pliku na urządzenie. Dla wstecznej kompatybilności, to może również być pełną ścieżkę pliku na urządzenie. (Zobacz [wstecz zgodności zauważa] poniżej)

*   **successCallback**: wywołania zwrotnego, który jest przekazywany `FileEntry` obiektu. *(Funkcja)*

*   **errorCallback**: wywołanie zwrotne, które wykonuje, jeśli wystąpi błąd podczas pobierania `Metadata` . Wywołany z `FileTransferError` obiektu. *(Funkcja)*

*   **trustAllHosts**: parametr opcjonalny, domyślnie `false` . Jeśli zestaw `true` , to akceptuje wszystkie certyfikaty bezpieczeństwa. Jest to przydatne, ponieważ Android odrzuca Certyfikaty samopodpisane. Nie zaleca się do użytku produkcyjnego. Obsługiwane na Androida i iOS. *(wartość logiczna)*

*   **Opcje**: parametry opcjonalne, obecnie tylko obsługuje nagłówki (takie jak autoryzacja (uwierzytelnianie podstawowe), itp.).

### Przykład

    // !! Assumes variable fileURL contains a valid URL to a path on the device,
    //    for example, cdvfile://localhost/persistent/path/to/downloads/
    
    var fileTransfer = new FileTransfer();
    var uri = encodeURI("http://some.server.com/download.php");
    
    fileTransfer.download(
        uri,
        fileURL,
        function(entry) {
            console.log("download complete: " + entry.toURL());
        },
        function(error) {
            console.log("download error source " + error.source);
            console.log("download error target " + error.target);
            console.log("upload error code" + error.code);
        },
        false,
        {
            headers: {
                "Authorization": "Basic dGVzdHVzZXJuYW1lOnRlc3RwYXNzd29yZA=="
            }
        }
    );
    

## przerwanie

Przerywa w toku transferu. Onerror callback jest przekazywany obiekt FileTransferError, który kod błędu z FileTransferError.ABORT_ERR.

### Przykład

    // !! Assumes variable fileURL contains a valid URL to a text file on the device,
    //    for example, cdvfile://localhost/persistent/path/to/file.txt
    
    var win = function(r) {
        console.log("Should not be called.");
    }
    
    var fail = function(error) {
        // error.code == FileTransferError.ABORT_ERR
        alert("An error has occurred: Code = " + error.code);
        console.log("upload error source " + error.source);
        console.log("upload error target " + error.target);
    }
    
    var options = new FileUploadOptions();
    options.fileKey="file";
    options.fileName="myphoto.jpg";
    options.mimeType="image/jpeg";
    
    var ft = new FileTransfer();
    ft.upload(fileURL, encodeURI("http://some.server.com/upload.php"), win, fail, options);
    ft.abort();
    

## FileTransferError

A `FileTransferError` obiekt jest przekazywany do wywołania zwrotnego błąd, gdy wystąpi błąd.

### Właściwości

*   **Kod**: jeden z kodów błędów wstępnie zdefiniowanych poniżej. (Liczba)

*   **Źródło**: URL do źródła. (String)

*   **cel**: adres URL do docelowego. (String)

*   **HTTP_STATUS**: kod stanu HTTP. Ten atrybut jest dostępna tylko po otrzymaniu kodu odpowiedzi z połączenia HTTP. (Liczba)

*   **wyjątek**: albo e.getMessage lub e.toString (String)

### Stałe

*   1 = `FileTransferError.FILE_NOT_FOUND_ERR`
*   2 = `FileTransferError.INVALID_URL_ERR`
*   3 = `FileTransferError.CONNECTION_ERR`
*   4 = `FileTransferError.ABORT_ERR`
*   5 = `FileTransferError.NOT_MODIFIED_ERR`

## Do tyłu zgodności stwierdza

Poprzednie wersje tego pluginu tylko zaakceptować urządzenia bezwzględnych ścieżek jako źródło dla przekazywania, lub w celu pobrania. Te ścieżki będzie zazwyczaj formy

    /var/mobile/Applications/<application UUID>/Documents/path/to/file  (iOS)
    /storage/emulated/0/path/to/file                                    (Android)
    

Do tyłu zgodności, akceptowane są jeszcze te ścieżki, i jeśli aplikacja nagrał ścieżki, jak te w trwałej pamięci, następnie można nadal stosować.

Te ścieżki były wcześniej wystawione w `fullPath` właściwości `FileEntry` i `DirectoryEntry` obiektów zwróconych przez wtyczki pliku. Nowe wersje pliku plugin, jednak już wystawiać te ścieżki do JavaScript.

Jeśli uaktualniasz nowy (1.0.0 lub nowsza) wersji pliku, a wcześniej za pomocą `entry.fullPath` jako argumenty do `download()` lub `upload()` , a następnie trzeba będzie zmienić kod aby używać adresów URL plików zamiast.

`FileEntry.toURL()`i `DirectoryEntry.toURL()` zwraca adres URL plików formularza

    cdvfile://localhost/persistent/path/to/file
    

które mogą być używane zamiast bezwzględna ścieżka w obu `download()` i `upload()` metody.