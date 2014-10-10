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

# org.apache.cordova.file

Questo plugin implementa un API File permettendo l'accesso di lettura/scrittura ai file che risiedono sul dispositivo.

Questo plugin si basa su diverse specifiche, tra cui: The HTML5 File API <http://www.w3.org/TR/FileAPI/>

Le directory (ormai defunta) e il sistema delle estensioni più recenti: <http://www.w3.org/TR/2012/WD-file-system-api-20120417/> anche se la maggior parte del codice plugin è stato scritto quando una spec precedenti era corrente: <http://www.w3.org/TR/2011/WD-file-system-api-20110419/>

Implementa inoltre FileWriter spec: <http://dev.w3.org/2009/dap/file-system/file-writer.html>

Per l'utilizzo, fare riferimento a HTML5 Rocks' eccellente [articolo FileSystem.][1]

 [1]: http://www.html5rocks.com/en/tutorials/file/filesystem/

Per una panoramica delle altre opzioni di archiviazione, consultare [Guida di archiviazione di Cordova][2].

 [2]: http://cordova.apache.org/docs/en/edge/cordova_storage_storage.md.html

## Installazione

    cordova plugin add org.apache.cordova.file
    

## Piattaforme supportate

*   Amazon fuoco OS
*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 e 8 *
*   Windows 8 *

* *Non supportano queste piattaforme `FileReader.readAsArrayBuffer` né `FileWriter.write(blob)` .*

## Dove memorizzare i file

A partire dalla v 1.2.0, vengono forniti gli URL per le directory importanti file di sistema. Ogni URL è nella forma *file:///path/to/spot/*e può essere convertito in un `DirectoryEntry` utilizzando`window.resolveLocalFileSystemURL()`.

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

Anche se tecnicamente un dettaglio di implementazione, può essere molto utile per conoscere come la `cordova.file.*` Proprietà mappa per percorsi fisici su un dispositivo reale.

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
|       `Caches/`                              | cacheDirectory              | cache                 | r/w  |     Sì *     | Sì \* * *|  |        No        |   Sì    |
|    `tmp/`                                    | tempDirectory               | -                     | r/w  |    No * *    | Sì \* * *|  |        No        |   Sì    |

* File persistono attraverso riavvii app e aggiornamenti, ma questa directory può essere azzerata ogni volta che desideri l'OS. L'app dovrebbe essere in grado di ricreare qualsiasi contenuto che potrebbe essere eliminato.

* * File può persistere attraverso app riavvii, ma non fare affidamento su questo comportamento. I file non sono garantiti a persistere attraverso gli aggiornamenti. L'app deve rimuovere i file dalla directory quando è applicabile, come il sistema operativo non garantisce quando (o anche se) questi file vengono rimossi.

\* * *| Il sistema operativo può cancellare il contenuto di questa directory ogni volta che si sente è necessario, ma non fare affidamento su questo. Si dovrebbe cancellare questa directory come adatto per l'applicazione.

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

**Nota**: se la memorizzazione esterna non può essere montato, il `cordova.file.external*` sono di proprietà`null`.

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

Se la scheda SD non era disponibile, poi versioni precedenti vuoi memorizzare dati sotto `/data/data/<packageId>` , che isola i apps da altro, ma può ancora causa dati da condividere tra gli utenti.

Ora è possibile scegliere se memorizzare i file nel percorso di archiviazione di file interno o utilizzando la logica precedente, con una preferenza nell'applicazione `config.xml` file. A tale scopo, aggiungere una di queste due linee di `config.xml` :

    <preference name="AndroidPersistentFileLocation" value="Internal" />
    
    <preference name="AndroidPersistentFileLocation" value="Compatibility" />
    

Senza questa linea, si utilizzerà il File del plugin `Compatibility` come predefinito. Se è presente un tag di preferenza e non è uno di questi valori, l'applicazione non si avvia.

Se l'applicazione è stato spedito in precedenza agli utenti, utilizzando un vecchio (pre-1.0) versione di questo plugin e ha i file memorizzati nel filesystem persistente, quindi è necessario impostare la preferenza di `Compatibility` . La posizione su "Interno" di commutazione significherebbe che gli utenti esistenti che aggiornare la loro applicazione potrebbero essere Impossibile accedere ai loro file precedentemente memorizzati, a seconda del loro dispositivo.

Se l'applicazione è nuova, o ha mai precedentemente memorizzati i file nel filesystem persistente, poi il `Internal` impostazione è generalmente raccomandato.

## iOS stranezze

*   `cordova.file.applicationStorageDirectory`è di sola lettura; tentativo di memorizzare i file all'interno della directory radice avrà esito negativo. Utilizzare uno degli altri `cordova.file.*` proprietà definite per iOS (solo `applicationDirectory` e `applicationStorageDirectory` sono di sola lettura).
*   `FileReader.readAsText(blob, encoding)` 
    *   Il `encoding` parametro non è supportato, e codifica UTF-8 è sempre attivo.

### posizione di archiviazione persistente di iOS

Ci sono due percorsi validi per memorizzare i file persistenti su un dispositivo iOS: la directory documenti e la biblioteca. Precedenti versioni del plugin archiviati solo mai persistenti file nella directory documenti. Questo ha avuto l'effetto collaterale di tutti i file di un'applicazione che rende visibili in iTunes, che era spesso involontaria, soprattutto per le applicazioni che gestiscono un sacco di piccoli file, piuttosto che produrre documenti completi per l'esportazione, che è la destinazione della directory.

Ora è possibile scegliere se memorizzare i file nella directory di libreria, con una preferenza nella vostra applicazione o documenti `config.xml` file. A tale scopo, aggiungere una di queste due linee di `config.xml` :

    <preference name="iosPersistentFileLocation" value="Library" />
    
    <preference name="iosPersistentFileLocation" value="Compatibility" />
    

Senza questa linea, si utilizzerà il File del plugin `Compatibility` come predefinito. Se è presente un tag di preferenza e non è uno di questi valori, l'applicazione non si avvia.

Se l'applicazione è stato spedito in precedenza agli utenti, utilizzando un vecchio (pre-1.0) versione di questo plugin e ha i file memorizzati nel filesystem persistente, quindi è necessario impostare la preferenza di `Compatibility` . Il percorso per il passaggio `Library` significherebbe che gli utenti esistenti che aggiornare la loro applicazione è in grado di accedere ai loro file precedentemente memorizzati.

Se l'applicazione è nuova, o ha mai precedentemente memorizzati i file nel filesystem persistente, poi il `Library` impostazione è generalmente raccomandato.

## Firefox OS stranezze

L'API di sistema del File non è supportato nativamente dal sistema operativo Firefox e viene implementato come uno spessore in cima indexedDB.

*   Non manca quando si rimuove le directory non vuota
*   Non supporta i metadati per le directory
*   Metodi `copyTo` e `moveTo` non supporta le directory

Sono supportati i seguenti percorsi di dati: * `applicationDirectory` -utilizza `xhr` per ottenere i file locali che sono confezionati con l'app. * `dataDirectory` - Per i file di dati persistenti app specifiche. * `cacheDirectory` -Cache file che dovrebbero sopravvivere si riavvia app (applicazioni non devono basarsi sull'OS di eliminare i file qui).

## Note di aggiornamento

In v 1.0.0 di questo plugin, il `FileEntry` e `DirectoryEntry` strutture sono cambiati, per essere più in linea con le specifiche pubblicate.

Versioni precedenti (pre-1.0.0) del plugin archiviati il dispositivo-assoluto--percorso del file nella `fullPath` proprietà di `Entry` oggetti. In genere questi percorsi si sarebbe simile

    /var/mobile/Applications/<application UUID>/Documents/path/to/file  (iOS)
    /storage/emulated/0/path/to/file                                    (Android)
    

Questi percorsi sono stati restituiti anche dal `toURL()` metodo della `Entry` oggetti.

Con v 1.0.0, la `fullPath` attributo è il percorso del file, *rispetto alla radice del filesystem HTML*. Così, i percorsi sopra sarebbe ora sia rappresentato da un `FileEntry` oggetto con un `fullPath` di

    /path/to/file
    

Se l'applicazione funziona con dispositivo-assoluto-percorsi, e estratto in precedenza tali percorsi attraverso la `fullPath` proprietà di `Entry` oggetti, allora si dovrebbe aggiornare il codice per utilizzare `entry.toURL()` invece.

Per indietro compatibilità, il `resolveLocalFileSystemURL()` Metodo accetterà un dispositivo-assoluto-percorso e restituirà un `Entry` oggetto corrispondente ad essa, finché quel file esiste all'interno sia il `TEMPORARY` o `PERSISTENT` filesystem.

Questo particolare è stato un problema con il plugin di trasferimento File, che in precedenza utilizzati percorsi-dispositivo-assoluto (e ancora può accoglierli). Esso è stato aggiornato per funzionare correttamente con gli URL di FileSystem, così sostituendo `entry.fullPath` con `entry.toURL()` dovrebbe risolvere eventuali problemi ottenendo quel plugin per lavorare con i file nel dispositivo.

In v. 1.1.0 il valore restituito di `toURL()` è stato cambiato (vedere \[CB-6394\] (https://issues.apache.org/jira/browse/CB-6394)) per restituire un URL assoluto 'file://'. ove possibile. Per assicurare un ' cdvfile:'-URL, è possibile utilizzare `toInternalURL()` ora. Questo metodo restituirà ora filesystem URL del modulo

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

Il set di filesystem disponibili può essere configurato per ogni piattaforma. Sia iOS che Android riconoscere un <preference> taggare in `config.xml` che denomina il filesystem per essere installato. Per impostazione predefinita, tutte le radici del file system sono abilitate.

    <preference name="iosExtraFilesystems" value="library,library-nosync,documents,documents-nosync,cache,bundle,root" />
    <preference name="AndroidExtraFilesystems" value="files,files-external,documents,sdcard,cache,cache-external,root" />
    

### Android

*   `files`: Directory di archiviazione di file interno dell'applicazione
*   `files-external`: Directory di archiviazione dell'applicazione il file esterno
*   `sdcard`: La directory di archiviazione di file esterni globale (questa è la radice della scheda SD, se uno è installato). Deve avere il `android.permission.WRITE_EXTERNAL_STORAGE` il permesso di usare questo.
*   `cache`: La directory dell'applicazione cache interna
*   `cache-external`: La directory dell'applicazione cache esterna
*   `root`: Dispositivo intero filesystem

Android supporta anche un filesystem speciale denominato "documenti", che rappresenta una sottodirectory "/ documenti /" all'interno del filesystem "files".

### iOS

*   `library`: La directory dell'applicazione libreria
*   `documents`: La directory dell'applicazione documenti
*   `cache`: La directory dell'applicazione Cache
*   `bundle`: Bundle dell'applicazione; la posizione dell'app sul disco (sola lettura)
*   `root`: Dispositivo intero filesystem

Per impostazione predefinita, la directory di libreria e documenti può essere sincronizzata a iCloud. È anche possibile richiedere due filesystem aggiuntivi, `library-nosync` e `documents-nosync` , che rappresentano una speciale directory non sincronizzati entro il `/Library` o `/Documents` filesystem.