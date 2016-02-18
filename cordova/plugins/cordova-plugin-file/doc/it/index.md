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

# cordova-plugin-file

Questo plugin implementa un API File permettendo l'accesso di lettura/scrittura ai file che risiedono sul dispositivo.

Questo plugin si basa su diverse specifiche, tra cui: The HTML5 File API <http://www.w3.org/TR/FileAPI/>

Le directory (ormai defunta) e il sistema delle estensioni più recenti: <http://www.w3.org/TR/2012/WD-file-system-api-20120417/> anche se la maggior parte del codice plugin è stato scritto quando una spec precedenti era corrente: <http://www.w3.org/TR/2011/WD-file-system-api-20110419/>

Implementa inoltre FileWriter spec: <http://dev.w3.org/2009/dap/file-system/file-writer.html>

Per l'utilizzo, fare riferimento a HTML5 Rocks' eccellente [articolo FileSystem.][1]

 [1]: http://www.html5rocks.com/en/tutorials/file/filesystem/

Per una panoramica delle altre opzioni di archiviazione, consultare [Guida di archiviazione di Cordova][2].

 [2]: http://cordova.apache.org/docs/en/edge/cordova_storage_storage.md.html

Questo plugin definisce oggetto global `cordova.file`.

Anche se in ambito globale, non è disponibile fino a dopo l'evento `deviceready`.

    document.addEventListener("deviceready", onDeviceReady, false);
    function onDeviceReady() {
        console.log(cordova.file);
    }
    

## Installazione

    cordova plugin add cordova-plugin-file
    

## Piattaforme supportate

*   Amazon fuoco OS
*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 e 8 *
*   Windows 8 *
*   Browser

* *Queste piattaforme non supportano `FileReader.readAsArrayBuffer` né `FileWriter.write(blob)`.*

## Dove memorizzare i file

A partire dalla v 1.2.0, vengono forniti gli URL per le directory importanti file di sistema. Ogni URL è nella forma *file:///path/to/spot/* e può essere convertito in un `DirectoryEntry` utilizzando `window.resolveLocalFileSystemURL()`.

*   `cordova.file.applicationDirectory`-Sola lettura directory dove è installato l'applicazione. (*iOS*, *Android*, *BlackBerry 10*)

*   `cordova.file.applicationStorageDirectory`-Directory radice di sandbox dell'applicazione; su iOS questa posizione è in sola lettura (ma sottodirectory specifiche [come `/Documents` ] sono di sola lettura). Tutti i dati contenuti all'interno è privato all'app. ( *iOS*, *Android*, *BlackBerry 10*)

*   `cordova.file.dataDirectory`-Archiviazione dati persistente e privati nella sandbox dell'applicazione utilizzando la memoria interna (su Android, se è necessario utilizzare la memoria esterna, utilizzare `.externalDataDirectory` ). IOS, questa directory non è sincronizzata con iCloud (utilizzare `.syncedDataDirectory` ). (*iOS*, *Android*, *BlackBerry 10*)

*   `cordova.file.cacheDirectory`-Directory per i file memorizzati nella cache di dati o qualsiasi file che app possibile ricreare facilmente. L'OS può eliminare questi file quando il dispositivo viene eseguito basso sull'archiviazione, tuttavia, apps non deve basarsi sul sistema operativo per cancellare i file qui. (*iOS*, *Android*, *BlackBerry 10*)

*   `cordova.file.externalApplicationStorageDirectory`-Spazio applicazione su storage esterno. (*Android*)

*   `cordova.file.externalDataDirectory`-Dove mettere i file di dati specifico app su storage esterno. (*Android*)

*   `cordova.file.externalCacheDirectory`-Cache applicazione su storage esterno. (*Android*)

*   `cordova.file.externalRootDirectory`-Radice di archiviazione esterna (scheda SD). (*Android*, *BlackBerry, 10*)

*   `cordova.file.tempDirectory`-Temp directory che l'OS è possibile cancellare a volontà. Non fare affidamento sul sistema operativo per cancellare questa directory; l'app deve sempre rimuovere file come applicabile. (*iOS*)

*   `cordova.file.syncedDataDirectory`-Contiene i file app specifiche che devono essere sincronizzati (per esempio a iCloud). (*iOS*)

*   `cordova.file.documentsDirectory`-I file privati per le app, ma che sono significativi per altre applicazioni (ad esempio i file di Office). (*iOS*)

*   `cordova.file.sharedDirectory`-File disponibili globalmente a tutte le applicazioni (*BlackBerry 10*)

## Layout dei file di sistema

Anche se tecnicamente un dettaglio di implementazione, può essere molto utile per conoscere come le proprietà `cordova.file.*` mappa di percorsi fisici su un dispositivo reale.

### iOS File sistema Layout

| Percorso dispositivo                         | `Cordova.file.*`            | `iosExtraFileSystems` | r/w? | persistente? | OS cancella | sincronizzazione | privato |
|:-------------------------------------------- |:--------------------------- |:--------------------- |:----:|:------------:|:-----------:|:----------------:|:-------:|
| `/ var/mobile/Applications/< UUID > /` | applicationStorageDirectory | -                     |  r   |     N/A      |     N/A     |       N/A        |   Sì    |
|    `appname.app/`                            | applicationDirectory        | bundle                |  r   |     N/A      |     N/A     |       N/A        |   Sì    |
|       `www/`                                 | -                           | -                     |  r   |     N/A      |     N/A     |       N/A        |   Sì    |
|    `Documents/`                              | documentsDirectory          | documenti             | r/w  |      Sì      |     No      |        Sì        |   Sì    |
|       `NoCloud/`                             | -                           | nosync-documenti      | r/w  |      Sì      |     No      |        No        |   Sì    |
|    `Library`                                 | -                           | libreria              | r/w  |      Sì      |     No      |       Sì?        |   Sì    |
|       `NoCloud/`                             | dataDirectory               | nosync-libreria       | r/w  |      Sì      |     No      |        No        |   Sì    |
|       `Cloud/`                               | syncedDataDirectory         | -                     | r/w  |      Sì      |     No      |        Sì        |   Sì    |
|       `Caches/`                              | cacheDirectory              | cache                 | r/w  |     Sì *     | Sì * * *|  |        No        |   Sì    |
|    `tmp/`                                    | tempDirectory               | -                     | r/w  |    No * *    | Sì * * *|  |        No        |   Sì    |

* File persistono attraverso riavvii app e aggiornamenti, ma questa directory può essere azzerata ogni volta che desideri l'OS. L'app dovrebbe essere in grado di ricreare qualsiasi contenuto che potrebbe essere eliminato.

* * File può persistere attraverso app riavvii, ma non fare affidamento su questo comportamento. I file non sono garantiti a persistere attraverso gli aggiornamenti. L'app deve rimuovere i file dalla directory quando è applicabile, come il sistema operativo non garantisce quando (o anche se) questi file vengono rimossi.

* * *| Il sistema operativo può cancellare il contenuto di questa directory ogni volta che si sente è necessario, ma non fare affidamento su questo. Si dovrebbe cancellare questa directory come adatto per l'applicazione.

### Layout sistema Android File

| Percorso dispositivo              | `Cordova.file.*`                    | `AndroidExtraFileSystems` | r/w? | persistente? | OS cancella | privato |
|:--------------------------------- |:----------------------------------- |:------------------------- |:----:|:------------:|:-----------:|:-------:|
| `File:///android_asset/`          | applicationDirectory                |                           |  r   |     N/A      |     N/A     |   Sì    |
| `< app-id > /dati/dati / /` | applicationStorageDirectory         | -                         | r/w  |     N/A      |     N/A     |   Sì    |
|    `cache`                        | cacheDirectory                      | cache                     | r/w  |      Sì      |    Sì *     |   Sì    |
|    `files`                        | dataDirectory                       | file                      | r/w  |      Sì      |     No      |   Sì    |
|       `Documents`                 |                                     | documenti                 | r/w  |      Sì      |     No      |   Sì    |
| `< sdcard > /`              | externalRootDirectory               | sdcard                    | r/w  |      Sì      |     No      |   No    |
|    `Android/data/<app-id>/` | externalApplicationStorageDirectory | -                         | r/w  |      Sì      |     No      |   No    |
|       `cache`                     | externalCacheDirectry               | cache-esterno             | r/w  |      Sì      |   No * *    |   No    |
|       `files`                     | externalDataDirectory               | file-esterno              | r/w  |      Sì      |     No      |   No    |

* Il sistema operativo può cancellare periodicamente questa directory, ma non fare affidamento su questo comportamento. Cancellare il contenuto di questa directory come adatto per l'applicazione. Il contenuto di questa directory dovrebbe un utente eliminare manualmente la cache, vengono rimossi.

* * Il sistema operativo non cancella questa directory automaticamente; Tu sei responsabile per la gestione dei contenuti da soli. Il contenuto della directory dovrebbe l'utente eliminare manualmente la cache, vengono rimossi.

**Nota**: se la memorizzazione esterna non può essere montato, le proprietà `cordova.file.external*` sono `null`.

### BlackBerry 10 File sistema Layout

| Percorso dispositivo                                | `Cordova.file.*`            | r/w? | persistente? | OS cancella | privato |
|:--------------------------------------------------- |:--------------------------- |:----:|:------------:|:-----------:|:-------:|
| `File:///accounts/1000/AppData/ < id app > /` | applicationStorageDirectory |  r   |     N/A      |     N/A     |   Sì    |
|    `app/native`                                     | applicationDirectory        |  r   |     N/A      |     N/A     |   Sì    |
|    `data/webviews/webfs/temporary/local__0`         | cacheDirectory              | r/w  |      No      |     Sì      |   Sì    |
|    `data/webviews/webfs/persistent/local__0`        | dataDirectory               | r/w  |      Sì      |     No      |   Sì    |
| `File:///accounts/1000/Removable/sdcard`            | externalRemovableDirectory  | r/w  |      Sì      |     No      |   No    |
| `File:///accounts/1000/Shared`                      | sharedDirectory             | r/w  |      Sì      |     No      |   No    |

*Nota*: quando l'applicazione viene distribuita a lavorare perimetrale, tutti i percorsi sono relativi a /accounts/1000-enterprise.

## Stranezze Android

### Posizione di archiviazione persistente Android

Ci sono più percorsi validi per memorizzare i file persistenti su un dispositivo Android. Vedi [questa pagina][3] per un'ampia discussione delle varie possibilità.

 [3]: http://developer.android.com/guide/topics/data/data-storage.html

Versioni precedenti del plugin avrebbe scelto il percorso dei file temporanei e permanenti su avvio, in base se il dispositivo ha sostenuto che la scheda SD (o partizione storage equivalente) è stato montato. Se è stata montata sulla scheda SD o una partizione di storage interno grande era disponibile (come sui dispositivi Nexus,) allora saranno memorizzati i file persistenti nella radice di quello spazio. Questo significava che tutte le apps di Cordova poteva vedere tutti i file disponibili sulla carta.

Se la scheda SD non era disponibile, poi versioni precedenti vuoi memorizzare dati sotto `/data/data/<packageId>`, che isola i apps da altro, ma può ancora causa dati da condividere tra gli utenti.

Ora è possibile scegliere se memorizzare i file nel percorso di archiviazione di file interno o utilizzando la logica precedente, con una preferenza nel file `config. xml` dell'applicazione. Per fare questo, aggiungere una di queste due linee al `file config. xml`:

    <preference name="AndroidPersistentFileLocation" value="Internal" />
    
    <preference name="AndroidPersistentFileLocation" value="Compatibility" />
    

Senza questa linea, il File del plugin utilizzerà la `Compatibility` come predefinito. Se è presente un tag di preferenza e non è uno di questi valori, l'applicazione non si avvia.

Se l'applicazione è stato spedito in precedenza agli utenti, utilizzando un vecchio (pre-1.0) versione di questo plugin e ha i file memorizzati nel filesystem persistente, allora si dovrebbe impostare la preferenza di `Compatibility`. La posizione su "Interno" di commutazione significherebbe che gli utenti esistenti che aggiornare la loro applicazione potrebbero essere Impossibile accedere ai loro file precedentemente memorizzati, a seconda del loro dispositivo.

Se l'applicazione è nuova, o ha mai precedentemente memorizzati i file nel filesystem persistente, è generalmente consigliato l'impostazione `Internal`.

## iOS stranezze

*   `cordova.file.applicationStorageDirectory`è di sola lettura; tentativo di memorizzare i file all'interno della directory radice avrà esito negativo. Utilizzare uno degli altri `cordova.file.*` proprietà definite per iOS (solo `applicationDirectory` e `applicationStorageDirectory` sono di sola lettura).
*   `FileReader.readAsText(blob, encoding)` 
    *   Il `encoding` parametro non è supportato, e codifica UTF-8 è sempre attivo.

### posizione di archiviazione persistente di iOS

Ci sono due percorsi validi per memorizzare i file persistenti su un dispositivo iOS: la directory documenti e la biblioteca. Precedenti versioni del plugin archiviati solo mai persistenti file nella directory documenti. Questo ha avuto l'effetto collaterale di tutti i file di un'applicazione che rende visibili in iTunes, che era spesso involontaria, soprattutto per le applicazioni che gestiscono un sacco di piccoli file, piuttosto che produrre documenti completi per l'esportazione, che è la destinazione della directory.

Ora è possibile scegliere se memorizzare i file nella directory di libreria, con una preferenza nel file `config. xml` dell'applicazione o documenti. Per fare questo, aggiungere una di queste due linee al `file config. xml`:

    <preference name="iosPersistentFileLocation" value="Library" />
    
    <preference name="iosPersistentFileLocation" value="Compatibility" />
    

Senza questa linea, il File del plugin utilizzerà la `Compatibility` come predefinito. Se è presente un tag di preferenza e non è uno di questi valori, l'applicazione non si avvia.

Se l'applicazione è stato spedito in precedenza agli utenti, utilizzando un vecchio (pre-1.0) versione di questo plugin e ha i file memorizzati nel filesystem persistente, allora si dovrebbe impostare la preferenza di `Compatibility`. La posizione di commutazione alla `libreria` significherebbe che gli utenti esistenti che aggiornare la loro applicazione è in grado di accedere ai loro file precedentemente memorizzati.

Se l'applicazione è nuova, o ha mai precedentemente memorizzati i file nel filesystem persistente, è generalmente consigliato l'impostazione della `Library`.

## Firefox OS stranezze

L'API di sistema del File non è supportato nativamente dal sistema operativo Firefox e viene implementato come uno spessore in cima indexedDB.

*   Non manca quando si rimuove le directory non vuota
*   Non supporta i metadati per le directory
*   Metodi `copyTo` e `moveTo` non supporta le directory

Sono supportati i seguenti percorsi di dati: * `applicationDirectory` - utilizza `xhr` per ottenere i file locali che sono confezionati con l'app. *`dataDirectory` - per i file di dati persistenti app specifiche. *`cacheDirectory` - file memorizzati nella cache che dovrebbe sopravvivere si riavvia app (applicazioni non devono basarsi sull'OS di eliminare i file qui).

## Stranezze browser

### Stranezze e osservazioni comuni

*   Ogni browser utilizza il proprio filesystem in modalità sandbox. IE e Firefox utilizzare IndexedDB come base. Tutti i browser utilizzano barra come separatore di directory in un percorso.
*   Le voci di directory devono essere creato successivamente. Ad esempio, la chiamata `fs.root.getDirectory (' dir1/dir2 ', {create:true}, successCallback, errorCallback)` non riuscirà se non esistesse dir1.
*   Il plugin richiede autorizzazione utente per utilizzare un archivio permanente presso il primo avvio dell'applicazione. 
*   Plugin supporta `cdvfile://localhost` (risorse locali) solo. Cioè risorse esterne non sono supportate tramite `cdvfile`.
*   Il plugin non segue ["Limitazioni di denominazione 8.3 File sistema API"][4].
*   BLOB e File' `close` la funzione non è supportata.
*   `FileSaver` e `BlobBuilder` non sono supportati da questo plugin e non hanno gli stub.
*   Il plugin non supporta `requestAllFileSystems`. Questa funzione manca anche nelle specifiche.
*   Entrate nella directory non verranno rimossi se si utilizza `create: true` bandiera per directory esistente.
*   Non sono supportati i file creati tramite il costruttore. È invece necessario utilizzare il metodo entry.file.
*   Ogni browser utilizza la propria forma per riferimenti URL blob.
*   `readAsDataURL` funzione è supportata, ma il mediatype in Chrome dipende dall'estensione di voce, mediatype in IE è sempre vuota (che è lo stesso come `text-plain` secondo la specifica), il mediatype in Firefox è sempre `application/octet-stream`. Ad esempio, se il contenuto è `abcdefg` quindi Firefox restituisce `dati: applicazione / octet-stream; base64, YWJjZGVmZw = =`, cioè restituisce `dati:; base64, YWJjZGVmZw = =`, Chrome restituisce `dati: < mediatype a seconda dell'estensione del nome della voce >; base64, YWJjZGVmZw = =`.
*   `toInternalURL` restituisce il percorso in forma `file:///persistent/path/to/entry` (Firefox, IE). Chrome restituisce il percorso nella forma `cdvfile://localhost/persistent/file`.

 [4]: http://www.w3.org/TR/2011/WD-file-system-api-20110419/#naming-restrictions

### Stranezze di cromo

*   Cromo filesystem non è subito pronto dopo evento ready dispositivo. Come soluzione alternativa, è possibile iscriversi all'evento `filePluginIsReady`. Esempio: 

    javascript
    window.addEventListener('filePluginIsReady', function(){ console.log('File plugin is ready');}, false);
    

È possibile utilizzare la funzione `window.isFilePluginReadyRaised` per verificare se evento già è stato generato. -quote di filesystem TEMPORARY e PERSISTENT window.requestFileSystem non sono limitate in Chrome. -Per aumentare la memoria persistente in Chrome è necessario chiamare il metodo `window.initPersistentFileSystem`. Quota di archiviazione persistente è di 5 MB per impostazione predefinita. -Chrome richiede `-consentire-file-accesso-da-file` eseguire argomento a supporto API tramite protocollo `file:///`. -`File` oggetto non cambierà se si utilizza il flag `{create:true}` quando ottenendo un' esistente `entrata`. -eventi `cancelable` è impostata su true in Chrome. Ciò è in contrasto con la [specifica][5]. -funzione `toURL` Chrome restituisce `filesystem:`-premessi percorso a seconda dell'applicazione host. Ad esempio, `filesystem:file:///persistent/somefile.txt`, `filesystem:http://localhost:8080/persistent/somefile.txt`. -`toURL` risultato di funzione non contiene una barra finale in caso di voce di directory. Chrome risolve le directory con gli URL slash-trainati però correttamente. -`resolveLocalFileSystemURL` metodo richiede in ingresso `url` avere il prefisso del `file System`. Ad esempio, il parametro `url` per `resolveLocalFileSystemURL` dovrebbe essere nella forma `filesystem:file:///persistent/somefile.txt` in contrasto con la forma `file:///persistent/somefile.txt` in Android. -Obsoleto `toNativeURL` funzione non è supportata e non dispone di uno stub. -funzione `setMetadata` non è indicato nelle specifiche e non supportato. -INVALID_MODIFICATION_ERR (codice: 9) viene generata invece di SYNTAX_ERR(code: 8) su richiesta di un filesystem inesistente. -INVALID_MODIFICATION_ERR (codice: 9) viene generata invece di PATH_EXISTS_ERR(code: 12) sul tentativo di creare esclusivamente un file o una directory, che esiste già. -INVALID_MODIFICATION_ERR (codice: 9) viene generata invece di NO_MODIFICATION_ALLOWED_ERR(code: 6) sul tentativo di chiamare removeRecursively su file system root. -INVALID_MODIFICATION_ERR (codice: 9) viene generata invece di NOT_FOUND_ERR(code: 1) sul tentativo moveTo directory che non esiste.

 [5]: http://dev.w3.org/2009/dap/file-system/file-writer.html

### Stranezze impl IndexedDB-basato (Firefox e IE)

*   `.` e `.` non sono supportati.
*   IE non supporta `file:///`-modalità; modalità solo ospitata è supportato (http://localhost:xxxx).
*   Dimensione filesystem Firefox non è limitata, ma ogni estensione 50MB sarà richiesta un'autorizzazione dell'utente. IE10 consente fino a 10mb di combinato AppCache e IndexedDB utilizzato nell'implementazione del filesystem senza chiedere conferma, una volta premuto quel livello che vi verrà chiesto se si desidera consentire ad essere aumentata fino a un max di 250 mb per ogni sito. Quindi la `size` parametro per la funzione `requestFileSystem` non influisce il filesystem in Firefox e IE.
*   `readAsBinaryString` funzione non è indicato nelle specifiche e non supportati in IE e non dispone di uno stub.
*   `file.Type` è sempre null.
*   Non è necessario creare la voce utilizzando il risultato del callback istanza DirectoryEntry che è stato eliminato. In caso contrario, si otterrà una 'voce di sospensione'.
*   Prima è possibile leggere un file che è stato appena scritto è necessario ottenere una nuova istanza di questo file.
*   supporta la funzione `setMetadata`, che non è indicato nelle specifiche `modificationTime` cambiamento di campo solo. 
*   funzioni `copyTo` e `moveTo` non supporta le directory.
*   Le directory metadati non sono supportato.
*   Sia Entry.remove e directoryEntry.removeRecursively non fallire quando si rimuove le directory non vuota - directory da rimuovere vengono pulite invece insieme al contenuto.
*   `abort` e `truncate` le funzioni non sono supportate.
*   non vengono generati eventi di progresso. Ad esempio, questo gestore verrà non eseguito:

    javascript
    writer.onprogress = function() { /*commands*/ };
    

## Note di aggiornamento

In v 1.0.0 di questo plugin, le strutture `FileEntry` e `DirectoryEntry` sono cambiati, per essere più in linea con le specifiche pubblicate.

Versioni precedenti (pre-1.0.0) del plugin archiviati il dispositivo-assoluto--percorso del file nella proprietà `fullPath` di oggetti della `voce`. In genere questi percorsi si sarebbe simile

    /var/mobile/Applications/<application UUID>/Documents/path/to/file  (iOS)
    /storage/emulated/0/path/to/file                                    (Android)
    

Questi percorsi sono stati anche restituiti dal metodo `toURL()` degli oggetti `Entry`.

Con v 1.0.0, l'attributo `fullPath` è il percorso del file, *rispetto alla radice del filesystem HTML*. Così, i percorsi sopra sarebbe ora sia rappresentato da un oggetto `FileEntry` con un `fullPath` di

    /path/to/file
    

Se l'applicazione funziona con dispositivo-assoluto-percorsi, e precedentemente recuperato quei percorsi attraverso la proprietà `fullPath` della `voce` oggetti, è necessario aggiornare il codice per utilizzare `entry.toURL()` invece.

Per indietro la compatibilità, il metodo `resolveLocalFileSystemURL()` verrà accettare un dispositivo-assoluto-percorso e restituirà un oggetto di `entrata` corrispondente ad essa, fintanto che il file esiste all'interno del filesystem la `temporanea` o `permanente`.

Questo particolare è stato un problema con il plugin di trasferimento File, che in precedenza utilizzati percorsi-dispositivo-assoluto (e ancora può accoglierli). Esso è stato aggiornato per funzionare correttamente con gli URL di FileSystem, così sostituendo `entry.fullPath` con `entry.toURL()` dovrebbe risolvere eventuali problemi ottenendo quel plugin per lavorare con i file nel dispositivo.

In v 1.1.0 il valore restituito di `toURL()` è stato cambiato (vedere \[CB-6394\] (https://issues.apache.org/jira/browse/CB-6394)) per restituire un URL assoluto 'file://'. ove possibile. Per assicurare un ' cdvfile:'-URL, è possibile utilizzare `toInternalURL()` ora. Questo metodo restituirà ora filesystem URL del modulo

    cdvfile://localhost/persistent/path/to/file
    

che può essere utilizzato per identificare univocamente il file.

## Elenco dei codici di errore e significati

Quando viene generato un errore, uno dei seguenti codici da utilizzare.

| Codice | Costante                      |
| ------:|:----------------------------- |
|      1 | `NOT_FOUND_ERR`               |
|      2 | `SECURITY_ERR`                |
|      3 | `ABORT_ERR`                   |
|      4 | `NOT_READABLE_ERR`            |
|      5 | `ENCODING_ERR`                |
|      6 | `NO_MODIFICATION_ALLOWED_ERR` |
|      7 | `INVALID_STATE_ERR`           |
|      8 | `SYNTAX_ERR`                  |
|      9 | `INVALID_MODIFICATION_ERR`    |
|     10 | `QUOTA_EXCEEDED_ERR`          |
|     11 | `TYPE_MISMATCH_ERR`           |
|     12 | `PATH_EXISTS_ERR`             |

## Configurare il Plugin (opzionale)

Il set di filesystem disponibili può essere configurato per ogni piattaforma. Sia iOS che Android riconoscere un <preference> Tag nel `file config. xml` che nomina il filesystem per essere installato. Per impostazione predefinita, tutte le radici del file system sono abilitate.

    <preference name="iosExtraFilesystems" value="library,library-nosync,documents,documents-nosync,cache,bundle,root" />
    <preference name="AndroidExtraFilesystems" value="files,files-external,documents,sdcard,cache,cache-external,root" />
    

### Android

*   `files`: directory di archiviazione di file interno dell'applicazione
*   `files-external`: directory di archiviazione dell'applicazione file esterno
*   `sdcard`: la directory di archiviazione di file esterni globale (questa è la radice della scheda SD, se uno è installato). È necessario disporre dell'autorizzazione `android.permission.WRITE_EXTERNAL_STORAGE` utilizzare questo.
*   `cache`: la cache interna directory applicazione
*   `cache-external`: directory di cache esterna dell'applicazione
*   `root`: il dispositivo intero filesystem

Android supporta anche un filesystem speciale denominato "documenti", che rappresenta una sottodirectory "/ documenti /" all'interno del filesystem "files".

### iOS

*   `library`: la directory dell'applicazione libreria
*   `documents`: la directory dell'applicazione documenti
*   `cache`: la Cache directory applicazione
*   `bundle`: bundle dell'applicazione; la posizione dell'app sul disco (sola lettura)
*   `root`: il dispositivo intero filesystem

Per impostazione predefinita, la directory di libreria e documenti può essere sincronizzata a iCloud. È anche possibile richiedere due filesystem aggiuntivi, `library-nosync` e `documents-nosync`, che rappresentano una speciale directory non sincronizzati entro il `/Library` o filesystem `/Documents`.
