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

Dieses Plugin ermöglicht Ihnen zum Hochladen und Herunterladen von Dateien.

Dieses Plugin wird global `FileTransfer`, `FileUploadOptions` Konstruktoren definiert.

Obwohl im globalen Gültigkeitsbereich, sind sie nicht bis nach dem `deviceready`-Ereignis.

    document.addEventListener("deviceready", onDeviceReady, false);
    function onDeviceReady() {
        console.log(FileTransfer);
    }
    

## Installation

    cordova plugin add cordova-plugin-file-transfer
    

## Unterstützte Plattformen

*   Amazon Fire OS
*   Android
*   BlackBerry 10
*   Browser
*   Firefox OS **
*   iOS
*   Windows Phone 7 und 8 *
*   Windows 8
*   Windows

* *Unterstützen keine `onprogress` noch `abort()`*

* * *`onprogress` nicht unterstützt*

# FileTransfer

Das `FileTransfer`-Objekt bietet eine Möglichkeit zum Hochladen von Dateien, die mithilfe einer HTTP-Anforderung für mehrteiligen POST sowie Informationen zum Herunterladen von Dateien sowie.

## Eigenschaften

*   **OnProgress**: aufgerufen, wobei ein `ProgressEvent` wann wird eine neue Datenmenge übertragen. *(Funktion)*

## Methoden

*   **Upload**: sendet eine Datei an einen Server.

*   **Download**: lädt eine Datei vom Server.

*   **abort**: Abbruch eine Übertragung in Bearbeitung.

## Upload

**Parameter**:

*   **FileURL**: Dateisystem-URL, das die Datei auf dem Gerät. Für rückwärts Kompatibilität, dies kann auch der vollständige Pfad der Datei auf dem Gerät sein. (Siehe [rückwärts Kompatibilität Notes] unten)

*   **Server**: URL des Servers, die Datei zu empfangen, wie kodiert`encodeURI()`.

*   **successCallback**: ein Rückruf, der ein `FileUploadResult`-Objekt übergeben wird. *(Funktion)*

*   **errorCallback**: ein Rückruf, der ausgeführt wird, tritt ein Fehler beim Abrufen der `FileUploadResult`. Mit einem `FileTransferError`-Objekt aufgerufen. *(Funktion)*

*   **Optionen**: optionale Parameter *(Objekt)*. Gültige Schlüssel:
    
    *   **FileKey**: der Name des Form-Elements. Wird standardmäßig auf `file` . (DOM-String und enthält)
    *   **Dateiname**: der Dateiname beim Speichern der Datei auf dem Server verwendet. Wird standardmäßig auf `image.jpg` . (DOM-String und enthält)
    *   **httpMethod**: die HTTP-Methode, die-entweder `PUT` oder `POST`. Der Standardwert ist `POST`. (DOM-String und enthält)
    *   **mimeType**: den Mime-Typ der Daten hochzuladen. Standardwerte auf `Image/Jpeg`. (DOM-String und enthält)
    *   **params**: eine Reihe von optionalen Schlüssel/Wert-Paaren in der HTTP-Anforderung übergeben. (Objekt)
    *   **chunkedMode**: ob die Daten in "Chunked" streaming-Modus hochladen. Der Standardwert ist `true`. (Boolean)
    *   **headers**: eine Karte von Header-Name-Header-Werte. Verwenden Sie ein Array, um mehr als einen Wert anzugeben. (Objekt)

*   **TrustAllHosts**: Optionaler Parameter, wird standardmäßig auf `false` . Wenn legen Sie auf `true` , es akzeptiert alle Sicherheitszertifikate. Dies ist nützlich, da Android selbstsignierte Zertifikate ablehnt. Nicht für den produktiven Einsatz empfohlen. Auf Android und iOS unterstützt. *(Boolean)*

### Beispiel

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
    

### Beispiel mit hochladen Kopf- und Progress-Ereignisse (Android und iOS nur)

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

Ein `FileUploadResult`-Objekt wird an den Erfolg-Rückruf des `Objekts <code>FileTransfer`-Upload()-Methode</code> übergeben.

### Eigenschaften

*   **BytesSent**: die Anzahl der Bytes, die als Teil des Uploads an den Server gesendet. (lange)

*   **ResponseCode**: die HTTP-Response-Code vom Server zurückgegeben. (lange)

*   **response**: der HTTP-Antwort vom Server zurückgegeben. (DOM-String und enthält)

*   **Header**: die HTTP-Response-Header vom Server. (Objekt)
    
    *   Derzeit unterstützt auf iOS nur.

### iOS Macken

*   Unterstützt keine `responseCode` oder`bytesSent`.

## Download

**Parameter**:

*   **source**: URL des Servers, um die Datei herunterzuladen, wie kodiert`encodeURI()`.

*   **target**: Dateisystem-Url, das die Datei auf dem Gerät. Für rückwärts Kompatibilität, dies kann auch der vollständige Pfad der Datei auf dem Gerät sein. (Siehe [rückwärts Kompatibilität Notes] unten)

*   **SuccessCallback**: ein Rückruf, der übergeben wird ein `FileEntry` Objekt. *(Funktion)*

*   **errorCallback**: ein Rückruf, der ausgeführt wird, tritt ein Fehler beim Abrufen der `FileEntry`. Mit einem `FileTransferError`-Objekt aufgerufen. *(Funktion)*

*   **TrustAllHosts**: Optionaler Parameter, wird standardmäßig auf `false` . Wenn legen Sie auf `true` , es akzeptiert alle Sicherheitszertifikate. Dies ist nützlich, da Android selbstsignierte Zertifikate ablehnt. Nicht für den produktiven Einsatz empfohlen. Auf Android und iOS unterstützt. *(Boolean)*

*   **Options**: optionale Parameter, derzeit nur unterstützt Kopfzeilen (z. B. Autorisierung (Standardauthentifizierung), etc.).

### Beispiel

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
    

## abort

Bricht einen in-Progress-Transfer. Der Onerror-Rückruf wird ein FileTransferError-Objekt übergeben, die einen Fehlercode FileTransferError.ABORT_ERR hat.

### Beispiel

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

Ein `FileTransferError`-Objekt wird an eine Fehler-Callback übergeben, wenn ein Fehler auftritt.

### Eigenschaften

*   **Code**: einer der vordefinierten Fehlercodes aufgeführt. (Anzahl)

*   **Quelle**: URL der Quelle. (String)

*   **Ziel**: URL zum Ziel. (String)

*   **HTTP_STATUS**: HTTP-Statuscode. Dieses Attribut ist nur verfügbar, wenn ein Response-Code aus der HTTP-Verbindung eingeht. (Anzahl)

*   **body** Antworttext. Dieses Attribut ist nur verfügbar, wenn eine Antwort von der HTTP-Verbindung eingeht. (String)

*   **exception**: entweder e.getMessage oder e.toString (String)

### Konstanten

*   1 = `FileTransferError.FILE_NOT_FOUND_ERR`
*   2 = `FileTransferError.INVALID_URL_ERR`
*   3 = `FileTransferError.CONNECTION_ERR`
*   4 = `FileTransferError.ABORT_ERR`
*   5 = `FileTransferError.NOT_MODIFIED_ERR`

## Hinweise rückwärts Kompatibilität

Frühere Versionen des Plugins würde nur Gerät-Absolute-Dateipfade als Quelle für Uploads oder als Ziel für Downloads übernehmen. Diese Pfade wäre in der Regel der form

    /var/mobile/Applications/<application UUID>/Documents/path/to/file  (iOS)
    /storage/emulated/0/path/to/file                                    (Android)
    

Für rückwärts Kompatibilität, diese Pfade noch akzeptiert werden, und wenn Ihre Anwendung Pfade wie diese im permanenten Speicher aufgezeichnet hat, dann sie können weiter verwendet werden.

Diese Pfade waren zuvor in der Eigenschaft `fullPath` `FileEntry` und `DirectoryEntry`-Objekte, die durch das Plugin Datei zurückgegeben ausgesetzt. Neue Versionen der die Datei-Erweiterung, jedoch nicht länger werden diese Pfade zu JavaScript.

Wenn Sie ein auf eine neue Upgrade (1.0.0 oder neuere) Version der Datei, und Sie haben zuvor mit `entry.fullPath` als Argumente `download()` oder `upload()`, dann ändern Sie den Code, um die Dateisystem-URLs verwenden müssen.

`FileEntry.toURL()` und `DirectoryEntry.toURL()` zurück, eine Dateisystem-URL in der form

    cdvfile://localhost/persistent/path/to/file
    

die anstelle der absoluten Dateipfad in `download()` und `upload()` Methode verwendet werden kann.
