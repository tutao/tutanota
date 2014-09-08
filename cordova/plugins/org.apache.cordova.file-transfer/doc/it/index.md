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

Questo plugin permette di caricare e scaricare file.

## Installazione

    cordova plugin add org.apache.cordova.file-transfer
    

## Piattaforme supportate

*   Amazon fuoco OS
*   Android
*   BlackBerry 10
*   Firefox OS * *
*   iOS
*   Windows Phone 7 e 8 *
*   Windows 8 *

* *Non supportano `onprogress` né `abort()` *

* * *Non supportano `onprogress` *

# FileTransfer

Il `FileTransfer` oggetto fornisce un modo per caricare i file utilizzando una richiesta HTTP di POST più parte e scaricare file pure.

## Proprietà

*   **OnProgress**: chiamata con un `ProgressEvent` ogni volta che un nuovo blocco di dati viene trasferito. *(Funzione)*

## Metodi

*   **caricare**: invia un file a un server.

*   **Scarica**: Scarica un file dal server.

*   **Abort**: interrompe un trasferimento in corso.

## caricare

**Parametri**:

*   **fileURL**: Filesystem URL che rappresenta il file nel dispositivo. Per indietro la compatibilità, questo può anche essere il percorso completo del file sul dispositivo. (Vedere [indietro compatibilità rileva] qui sotto)

*   **server**: URL del server per ricevere il file, come codificato dal`encodeURI()`.

*   **successCallback**: un callback passato un `Metadata` oggetto. *(Funzione)*

*   **errorCallback**: un callback che viene eseguito se si verifica un errore recuperando il `Metadata` . Invocato con un `FileTransferError` oggetto. *(Funzione)*

*   **opzioni**: parametri facoltativi *(oggetto)*. Chiavi valide:
    
    *   **fileKey**: il nome dell'elemento form. Valore predefinito è `file` . (DOMString)
    *   **nome file**: il nome del file da utilizzare quando si salva il file sul server. Valore predefinito è `image.jpg` . (DOMString)
    *   **mimeType**: il tipo mime dei dati da caricare. Valore predefinito è `image/jpeg` . (DOMString)
    *   **params**: un insieme di coppie chiave/valore opzionale per passare nella richiesta HTTP. (Oggetto)
    *   **chunkedMode**: se a caricare i dati in modalità streaming chunked. Valore predefinito è `true` . (Boolean)
    *   **intestazioni**: mappa di valori nome/intestazione intestazione. Utilizzare una matrice per specificare più valori. (Oggetto)

*   **trustAllHosts**: parametro opzionale, valore predefinito è `false` . Se impostata su `true` , accetta tutti i certificati di sicurezza. Questo è utile poiché Android respinge i certificati autofirmati sicurezza. Non raccomandato per uso in produzione. Supportato su Android e iOS. *(boolean)*

### Esempio

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
    

### Esempio con intestazioni di caricare ed eventi Progress (Android e iOS solo)

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

A `FileUploadResult` oggetto viene passato al metodo di callback di successo il `FileTransfer` dell'oggetto `upload()` metodo.

### Proprietà

*   **bytesSent**: il numero di byte inviati al server come parte dell'upload. (lungo)

*   **responseCode**: codice di risposta HTTP restituito dal server. (lungo)

*   **risposta**: risposta HTTP restituito dal server. (DOMString)

*   **intestazioni**: intestazioni di risposta HTTP dal server. (Oggetto)
    
    *   Attualmente supportato solo iOS.

### iOS stranezze

*   Non supporta `responseCode` o`bytesSent`.

## Scarica

**Parametri**:

*   **fonte**: URL del server per scaricare il file, come codificato dal`encodeURI()`.

*   **destinazione**: Filesystem url che rappresenta il file nel dispositivo. Per indietro la compatibilità, questo può anche essere il percorso completo del file sul dispositivo. (Vedere [indietro compatibilità rileva] qui sotto)

*   **successCallback**: un callback passato un `FileEntry` oggetto. *(Funzione)*

*   **errorCallback**: un callback che viene eseguito se si verifica un errore durante il recupero del `Metadata` . Invocato con un `FileTransferError` oggetto. *(Funzione)*

*   **trustAllHosts**: parametro opzionale, valore predefinito è `false` . Se impostata su `true` , accetta tutti i certificati di sicurezza. Questo è utile perché Android respinge i certificati autofirmati sicurezza. Non raccomandato per uso in produzione. Supportato su Android e iOS. *(boolean)*

*   **opzioni**: parametri facoltativi, attualmente solo supporti intestazioni (ad esempio autorizzazione (autenticazione di base), ecc.).

### Esempio

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
    

## Abort

Interrompe un trasferimento in corso. Il callback onerror viene passato un oggetto FileTransferError che presenta un codice di errore di FileTransferError.ABORT_ERR.

### Esempio

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

A `FileTransferError` oggetto viene passato a un callback di errore quando si verifica un errore.

### Proprietà

*   **codice**: uno dei codici di errore predefiniti elencati di seguito. (Numero)

*   **fonte**: URL all'origine. (String)

*   **destinazione**: URL di destinazione. (String)

*   **http_status**: codice di stato HTTP. Questo attributo è disponibile solo quando viene ricevuto un codice di risposta della connessione HTTP. (Numero)

*   **eccezione**: O e.getMessage o e.toString (String)

### Costanti

*   1 = `FileTransferError.FILE_NOT_FOUND_ERR`
*   2 = `FileTransferError.INVALID_URL_ERR`
*   3 = `FileTransferError.CONNECTION_ERR`
*   4 = `FileTransferError.ABORT_ERR`
*   5 = `FileTransferError.NOT_MODIFIED_ERR`

## Note di compatibilità all'indietro

Versioni precedenti di questo plugin accetterebbe solo dispositivo-assoluto-percorsi di file come origine per upload, o come destinazione per il download. Questi percorsi si sarebbero generalmente di forma

    /var/mobile/Applications/<application UUID>/Documents/path/to/file  (iOS)
    /storage/emulated/0/path/to/file                                    (Android)
    

Per indietro compatibilità, questi percorsi sono ancora accettati, e se l'applicazione ha registrato percorsi come questi in un archivio permanente, quindi possono continuare a essere utilizzato.

Questi percorsi sono state precedentemente esposte nella `fullPath` proprietà di `FileEntry` e `DirectoryEntry` oggetti restituiti dal File plugin. Nuove versioni del File plugin, tuttavia, non è più espongono questi percorsi a JavaScript.

Se si esegue l'aggiornamento a una nuova (1.0.0 o più recente) precedentemente utilizzano la versione del File e si `entry.fullPath` come argomenti a `download()` o `upload()` , sarà necessario modificare il codice per utilizzare gli URL filesystem invece.

`FileEntry.toURL()`e `DirectoryEntry.toURL()` restituiscono un filesystem URL del modulo

    cdvfile://localhost/persistent/path/to/file
    

che può essere utilizzato al posto del percorso assoluto in entrambi `download()` e `upload()` metodi.