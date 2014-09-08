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

Dieses Plugin implementiert eine File-API, die Lese-/Schreibzugriff Zugriff auf Dateien, die auf dem Gerät befinden.

Dieses Plugin basiert auf mehrere Angaben, einschließlich: die HTML5-File-API <http://www.w3.org/TR/FileAPI/>

Die (heute nicht mehr existierenden) Verzeichnisse und System neuesten Erweiterungen: <http://www.w3.org/TR/2012/WD-file-system-api-20120417/> , obwohl die meisten von den Plugin-Code wurde geschrieben, als eine frühere Spec aktuell waren: <http://www.w3.org/TR/2011/WD-file-system-api-20110419/>

Es implementiert auch die FileWriter Spec: <http://dev.w3.org/2009/dap/file-system/file-writer.html>

Verwendung finden Sie in HTML5 Rocks ausgezeichnete [Dateisystem Artikel.][1]

 [1]: http://www.html5rocks.com/en/tutorials/file/filesystem/

Finden Sie einen Überblick über andere Speicheroptionen Cordovas [Speicher-Führer][2].

 [2]: http://cordova.apache.org/docs/en/edge/cordova_storage_storage.md.html

## Installation

    cordova plugin add org.apache.cordova.file
    

## Unterstützte Plattformen

*   Amazon Fire OS
*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 und 8 *
*   Windows 8 *

* *Diese Plattformen unterstützen nicht `FileReader.readAsArrayBuffer` noch `FileWriter.write(blob)` .*

## Wo Dateien gespeichert

Stand: V1 werden URLs auf wichtige Datei-System-Verzeichnisse zur Verfügung gestellt. Jede URL in der Form *file:///path/to/spot/*ist, und konvertiert werden können eine `DirectoryEntry` mit`window.resolveLocalFileSystemURL()`.

*   `cordova.file.applicationDirectory`-Die schreibgeschützten Verzeichnis, in dem die Anwendung installiert ist. (*iOS*, *Android*, *BlackBerry 10*)

*   `cordova.file.applicationStorageDirectory`-Root-Verzeichnis der Anwendungs-Sandbox; auf iOS ist schreibgeschützt (aber bestimmte Unterverzeichnisse [wie `/Documents` ] sind Lese-und Schreibzugriff). Alle enthaltene Daten ist für die app privat. ( *iOS*, *Android*, *BlackBerry 10*)

*   `cordova.file.dataDirectory`-Beständige und private Datenspeicherung innerhalb der Anwendungs-Sandbox, die mit internen Speicher (auf Android, externen Speicher verwenden, verwenden Sie `.externalDataDirectory` ). Auf iOS, ist dieses Verzeichnis nicht mit iCloud synchronisiert (verwenden Sie `.syncedDataDirectory` ). (*iOS*, *Android*, *BlackBerry 10*)

*   `cordova.file.cacheDirectory`-Verzeichnis der zwischengespeicherten Daten-Dateien oder Dateien, die Ihre app einfach neu erstellen können. Das Betriebssystem kann diese Dateien löschen, wenn das Gerät auf Speicher knapp wird, dennoch sollten die apps vom Betriebssystem zum Löschen von Dateien hier nicht verlassen. (*iOS*, *Android*, *BlackBerry 10*)

*   `cordova.file.externalApplicationStorageDirectory`-Anwendungsraum auf externen Speicher. (*Android*)

*   `cordova.file.externalDataDirectory`-Wo, app-spezifische Datendateien auf externen Speicher setzen. (*Android*)

*   `cordova.file.externalCacheDirectory`-Anwendungscache auf externen Speicher. (*Android*)

*   `cordova.file.externalRootDirectory`-Externer Speicher (SD-Karte) Stamm. (*Android*, *BlackBerry 10*)

*   `cordova.file.tempDirectory`-Temp-Verzeichnis, dem das OS auf deaktivieren können wird. Verlassen Sie sich nicht auf das Betriebssystem, um dieses Verzeichnis zu löschen; Ihre Anwendung sollte immer Dateien gegebenenfalls entfernen. (*iOS*)

*   `cordova.file.syncedDataDirectory`-Hält app-spezifische Dateien, die (z. B. auf iCloud) synchronisiert werden sollten. (*iOS*)

*   `cordova.file.documentsDirectory`-Dateien für die app, aber privat sind sinnvoll, andere Anwendungen (z.B. Office-Dateien). (*iOS*)

*   `cordova.file.sharedDirectory`-Dateien für alle Anwendungen (*BlackBerry 10* weltweit verfügbar)

## Dateisystemlayouts

Obwohl technisch ein Implementierungsdetail, kann es sehr hilfreich zu wissen wie die `cordova.file.*` Eigenschaften anzeigen auf physischen Pfade auf einem echten Gerät.

### iOS-Datei-System-Layout

| Gerätepfad                                   | `Cordova.file.*`            | `iosExtraFileSystems` | R/w? | persistent? | OS löscht  | Sync | Private |
|:-------------------------------------------- |:--------------------------- |:--------------------- |:----:|:-----------:|:----------:|:----:|:-------:|
| `/ Var/mobile/Applications/< UUID > /` | applicationStorageDirectory | -                     | R/o  |     N/A     |    N/A     | N/A  |   Ja    |
|    `appname.app/`                            | applicationDirectory        | Bundle                | R/o  |     N/A     |    N/A     | N/A  |   Ja    |
|       `www/`                                 | -                           | -                     | R/o  |     N/A     |    N/A     | N/A  |   Ja    |
|    `Documents/`                              | documentsDirectory          | Dokumente             | R/w  |     Ja      |    Nein    |  Ja  |   Ja    |
|       `NoCloud/`                             | -                           | Dokumente-nosync      | R/w  |     Ja      |    Nein    | Nein |   Ja    |
|    `Library`                                 | -                           | Bibliothek            | R/w  |     Ja      |    Nein    | Ja?  |   Ja    |
|       `NoCloud/`                             | dataDirectory               | Bibliothek-nosync     | R/w  |     Ja      |    Nein    | Nein |   Ja    |
|       `Cloud/`                               | syncedDataDirectory         | -                     | R/w  |     Ja      |    Nein    |  Ja  |   Ja    |
|       `Caches/`                              | cacheDirectory              | Cache                 | R/w  |    Ja *     | Ja \* * *| | Nein |   Ja    |
|    `tmp/`                                    | tempDirectory               | -                     | R/w  |  Nicht * *  | Ja \* * *| | Nein |   Ja    |

* Dateien werden hinweg app Neustarts und Upgrades beibehalten, aber dieses Verzeichnis kann gelöscht werden, wenn das OS begehrt. Ihre Anwendung sollte in der Lage, Inhalte zu erschaffen, die möglicherweise gelöscht werden.

* *-Dateien kann über app-Neustarts beizubehalten, aber verlasse dich nicht auf dieses Verhalten. Dateien sind nicht unbedingt Aktuelles beibehalten. Ihre Anwendung sollte Dateien aus diesem Verzeichnis entfernen, wenn es gilt, diese Dateien werden entfernt, da das OS nicht wann (oder auch wenn) garantiert.

\* * *| The OS kann den Inhalt dieses Verzeichnisses löschen, wenn es sich anfühlt, ist es erforderlich, aber verlassen Sie sich nicht dazu. Sie sollten dieses Verzeichnis entsprechend Ihrer Anwendung deaktivieren.

### Android File System-Layout

| Gerätepfad                        | `Cordova.file.*`                    | `AndroidExtraFileSystems` | R/w? | persistent? | OS löscht | Private |
|:--------------------------------- |:----------------------------------- |:------------------------- |:----:|:-----------:|:---------:|:-------:|
| `file:///android_asset/`          | applicationDirectory                |                           | R/o  |     N/A     |    N/A    |   Ja    |
| `/ Data/Data/< app-Id > /`  | applicationStorageDirectory         | -                         | R/w  |     N/A     |    N/A    |   Ja    |
|    `cache`                        | cacheDirectory                      | Cache                     | R/w  |     Ja      |   Ja *    |   Ja    |
|    `files`                        | dataDirectory                       | Dateien                   | R/w  |     Ja      |   Nein    |   Ja    |
|       `Documents`                 |                                     | Dokumente                 | R/w  |     Ja      |   Nein    |   Ja    |
| `< Sdcard > /`              | externalRootDirectory               | sdcard                    | R/w  |     Ja      |   Nein    |  Nein   |
|    `Android/data/<app-id>/` | externalApplicationStorageDirectory | -                         | R/w  |     Ja      |   Nein    |  Nein   |
|       `cache`                     | externalCacheDirectry               | Cache-extern              | R/w  |     Ja      | Nicht * * |  Nein   |
|       `files`                     | externalDataDirectory               | Dateien-extern            | R/w  |     Ja      |   Nein    |  Nein   |

* Das Betriebssystem kann regelmäßig dieses Verzeichnis zu löschen, aber verlasse dich nicht auf dieses Verhalten. Deaktivieren Sie den Inhalt dieses Verzeichnisses für Ihre Anwendung geeigneten. Ein Benutzer den Cache manuell löschen sollte, werden die Inhalte dieses Verzeichnisses entfernt.

* * The OS nicht klar dieses Verzeichnis automatisch; Sie sind verantwortlich für die Inhalte selbst verwalten. Der Benutzer den Cache manuell löschen sollte, werden der Inhalt des Verzeichnisses entfernt.

**Hinweis**: Wenn externe Speichergeräte nicht bereitgestellt werden kann, die `cordova.file.external*` Eigenschaften sind`null`.

### BlackBerry 10-File-System-Layout

| Gerätepfad                                          | `Cordova.file.*`            | R/w? | persistent? | OS löscht | Private |
|:--------------------------------------------------- |:--------------------------- |:----:|:-----------:|:---------:|:-------:|
| `file:///Accounts/1000/APPDATA/ < app Id > /` | applicationStorageDirectory | R/o  |     N/A     |    N/A    |   Ja    |
|    `app/native`                                     | applicationDirectory        | R/o  |     N/A     |    N/A    |   Ja    |
|    `data/webviews/webfs/temporary/local__0`         | cacheDirectory              | R/w  |    Nein     |    Ja     |   Ja    |
|    `data/webviews/webfs/persistent/local__0`        | dataDirectory               | R/w  |     Ja      |   Nein    |   Ja    |
| `file:///Accounts/1000/Removable/sdcard`            | externalRemovableDirectory  | R/w  |     Ja      |   Nein    |  Nein   |
| `file:///Accounts/1000/Shared`                      | sharedDirectory             | R/w  |     Ja      |   Nein    |  Nein   |

*Hinweis*: Wenn die Anwendung bereitgestellt wird, um Perimeter zu arbeiten, alle Pfade sind relativ /accounts/1000-enterprise.

## Android Macken

### Android permanenten Speicherort

Es gibt mehrere gültige Speicherorte, persistente Dateien auf einem Android-Gerät zu speichern. Finden Sie auf [dieser Seite][3] eine ausführliche Diskussion über die verschiedenen Möglichkeiten.

 [3]: http://developer.android.com/guide/topics/data/data-storage.html

Frühere Versionen des Plugins wählen würde, den Speicherort der temporären und permanenten Dateien beim Start, basierend auf, ob das Gerät behauptete, dass die SD-Karte (oder gleichwertige Speicherpartition) bereitgestellt wurde. Wenn die SD-Karte eingelegt wurde, oder wenn eine große interne Speicherpartition verfügbar war (wie auf Nexus-Geräten) und dann in die Wurzel dieses Raumes, die persistenten Dateien gespeichert werden. Dies bedeutete, dass alle Cordova apps aller verfügbaren Dateien auf der Karte sehen konnte.

Wenn die SD-Karte nicht verfügbar war, dann Vorgängerversionen Daten unter speichern würde `/data/data/<packageId>` , die isoliert Anwendungen voneinander, aber möglicherweise noch Ursache Daten zwischen Benutzern freigegeben werden.

Es ist nun möglich, auszuwählen, ob zum Speichern von Dateien in den internen Datei-Speicherort oder unter Verwendung der bisherigen Logik mit einer Vorliebe in Ihrer Anwendung `config.xml` Datei. Hierzu fügen Sie eines dieser beiden Linien zu `config.xml` :

    <preference name="AndroidPersistentFileLocation" value="Internal" />
    
    <preference name="AndroidPersistentFileLocation" value="Compatibility" />
    

Ohne diese Zeile das Datei-Plugin verwendet `Compatibility` als Standard. Wenn ein Präferenz-Tag vorhanden ist, und nicht einen der folgenden Werte, wird die Anwendung nicht gestartet.

Wenn Ihre Anwendung für Benutzer zuvor versandt wird, mithilfe eines älteren (Pre-1.0) Version dieses Plugins und gespeicherte Dateien im permanenten Dateisystem hat, dann legen Sie die Voreinstellung "" auf `Compatibility` . Wechseln die Location auf "Internal" würde bedeuten, dass Benutzer, die aktualisieren Sie ihre Anwendung, möglicherweise nicht auf ihre zuvor gespeicherte Dateien, abhängig von ihrem Gerät zugreifen.

Wenn die Anwendung neu, oder nie zuvor, Dateien im Dateisystem persistent gespeichert hat, dann die `Internal` Einstellung wird im Allgemeinen empfohlen.

## iOS Macken

*   `cordova.file.applicationStorageDirectory`ist schreibgeschützt; zum Speichern von Dateien im Stammverzeichnis der Versuch schlägt fehl. Verwenden Sie eine der anderen `cordova.file.*` für iOS definierten Eigenschaften (nur `applicationDirectory` und `applicationStorageDirectory` sind schreibgeschützt).
*   `FileReader.readAsText(blob, encoding)` 
    *   Die `encoding` Parameter wird nicht unterstützt und UTF-8-Kodierung ist immer wirksam.

### iOS permanenten Speicherort

Es gibt zwei gültige Speicherorte persistente Dateien auf ein iOS-Gerät speichern: das Dokumenten-Verzeichnis und das Verzeichnis Library. Frühere Versionen des Plugins gespeichert immer nur persistente Dateien im Verzeichnis Dokumente. Dies hatte den Nebeneffekt einer Anwendung Dateien in iTunes, die oft unbeabsichtigte, speziell für Anwendungen, die viele kleine Dateien behandeln war, sichtbar zu machen, anstatt komplette Dokumente für den Export, die den beabsichtigten Zweck des Verzeichnisses ist zu produzieren.

Es ist nun möglich, auszuwählen, ob zum Speichern von Dateien in Dokumente oder Verzeichnis Library mit einer Vorliebe in Ihrer Anwendung `config.xml` Datei. Hierzu fügen Sie eines dieser beiden Linien zu `config.xml` :

    <preference name="iosPersistentFileLocation" value="Library" />
    
    <preference name="iosPersistentFileLocation" value="Compatibility" />
    

Ohne diese Zeile das Datei-Plugin verwendet `Compatibility` als Standard. Wenn ein Präferenz-Tag vorhanden ist, und nicht einen der folgenden Werte, wird die Anwendung nicht gestartet.

Wenn Ihre Anwendung für Benutzer zuvor versandt wird, mithilfe eines älteren (Pre-1.0) Version dieses Plugins und gespeicherte Dateien im permanenten Dateisystem hat, dann legen Sie die Voreinstellung "" auf `Compatibility` . Wechsel der Lage zu `Library` würde bedeuten, dass Benutzer, aktualisieren Sie ihre Anwendung, nicht in der Lage, ihre zuvor gespeicherte Dateien zugreifen.

Wenn die Anwendung neu, oder nie zuvor, Dateien im Dateisystem persistent gespeichert hat, dann die `Library` Einstellung wird im Allgemeinen empfohlen.

## Firefox OS Macken

Der Datei-System-API wird von Firefox-OS nicht nativ unterstützt und wird als ein Shim auf IndexedDB implementiert.

*   Schlägt nicht fehl, wenn Sie nicht leere Verzeichnisse entfernen
*   Metadaten wird für Verzeichnisse nicht unterstützt.
*   Methoden `copyTo` und `moveTo` unterstützen keine Verzeichnisse

Die folgenden Datenpfade werden unterstützt: * `applicationDirectory` -verwendet `xhr` um lokale Dateien zu erhalten, die mit der app verpackt sind. * `dataDirectory` - Für persistente app-spezifische Daten-Dateien. * `cacheDirectory` -Cache-Dateien, die app startet überleben sollte (Apps sollten nicht vom Betriebssystem zum Löschen von Dateien hier verlassen).

## Upgrade Notes

In v1.0.0 des Plugins die `FileEntry` und `DirectoryEntry` Strukturen haben sich geändert, um mehr im Einklang mit der veröffentlichten Spezifikation zu sein.

Vorgängerversionen (Pre-1.0.0) des Plugins gespeichert den Gerät-Absolute-Dateispeicherort in der `fullPath` -Eigenschaft der `Entry` Objekte. Diese Pfade würde in der Regel aussehen

    /var/mobile/Applications/<application UUID>/Documents/path/to/file  (iOS)
    /storage/emulated/0/path/to/file                                    (Android)
    

Diese Pfade wurden auch zurückgegeben, indem die `toURL()` -Methode des der `Entry` Objekte.

Mit v1.0.0 das `fullPath` -Attribut ist der Pfad zu der Datei, *relativ zum Stammverzeichnis des Dateisystems HTML*. Also die oben genannten Pfade würden jetzt beide durch dargestellt werden ein `FileEntry` -Objekt mit einer `fullPath` von

    /path/to/file
    

Wenn Ihre Anwendung mit absoluter Gerätepfade arbeitet und Sie zuvor diese Pfade durch abgerufenen die `fullPath` -Eigenschaft des `Entry` Objekte, dann Sie Ihren Code mithilfe von update sollte `entry.toURL()` statt.

Für rückwärts Kompatibilität, die `resolveLocalFileSystemURL()` -Methode akzeptiert einen Absolute-Gerätepfad und kehren ein `Entry` Objekt entspricht, solange diese Datei innerhalb existiert der `TEMPORARY` oder `PERSISTENT` Dateisysteme.

Dies wurde vor allem ein Problem mit dem File-Transfer-Plugin, die zuvor-Absolute-Gerätepfade verwendet (und kann damit noch einverstanden). Es wurde aktualisiert, um ordnungsgemäß mit Dateisystem-URLs, so anstelle `entry.fullPath` mit `entry.toURL()` sollte lösen Sie alle Probleme, die immer des Plugin zum Arbeiten mit Dateien auf dem Gerät.

In v1.1.0 der Rückgabewert der `toURL()` wurde geändert (siehe \[CB-6394\] (https://issues.apache.org/jira/browse/CB-6394)), um eine absolute "file://" URL zurückgeben. wo immer möglich. Sicherstellung einer ' Cdvfile:'-URL Sie können `toInternalURL()` jetzt. Diese Methode gibt jetzt Dateisystem URLs der Form zurück.

    cdvfile://localhost/persistent/path/to/file
    

die benutzt werden können, um die Datei eindeutig zu identifizieren.

## Liste der Fehlercodes und Bedeutungen

Wenn ein Fehler ausgelöst wird, wird eines der folgenden Codes verwendet werden.

| Code | Konstante                     |
| ----:|:----------------------------- |
|    1 | `NOT_FOUND_ERR`               |
|    2 | `SECURITY_ERR`                |
|    3 | `ABORT_ERR`                   |
|    4 | `NOT_READABLE_ERR`            |
|    5 | `ENCODING_ERR`                |
|    6 | `NO_MODIFICATION_ALLOWED_ERR` |
|    7 | `INVALID_STATE_ERR`           |
|    8 | `SYNTAX_ERR`                  |
|    9 | `INVALID_MODIFICATION_ERR`    |
|   10 | `QUOTA_EXCEEDED_ERR`          |
|   11 | `TYPE_MISMATCH_ERR`           |
|   12 | `PATH_EXISTS_ERR`             |

## Konfigurieren das Plugin (Optional)

Die Menge der verfügbaren Dateisysteme kann pro Plattform konfiguriert sein. Erkennen von iOS und Android ein <preference> -Tag im `config.xml` die Namen der Dateisysteme installiert werden. Standardmäßig sind alle Datei-System-Roots aktiviert.

    <preference name="iosExtraFilesystems" value="library,library-nosync,documents,documents-nosync,cache,bundle,root" />
    <preference name="AndroidExtraFilesystems" value="files,files-external,documents,sdcard,cache,cache-external,root" />
    

### Android

*   `files`: Die Anwendung interner Speicher Dateiverzeichnis
*   `files-external`: Das Verzeichnis der Anwendung externe Datei Speicher
*   `sdcard`: Das externe Globaldatei-Speicherverzeichnis (Dies ist die Wurzel der SD-Karte, sofern installiert). Sie müssen die `android.permission.WRITE_EXTERNAL_STORAGE` Erlaubnis, diese zu verwenden.
*   `cache`: Internen Cache-Verzeichnis der Anwendung
*   `cache-external`: Die Anwendung externer Cache-Verzeichnis
*   `root`: Das gesamte Gerät-Dateisystem

Android unterstützt auch eine spezielle Dateisystem mit dem Namen "Dokumente", die ein Unterverzeichnis "/ Dokumente /" die "Dateien" Dateisystem darstellt.

### iOS

*   `library`: Bibliothek das Anwendungsverzeichnis
*   `documents`: Dokumente das Anwendungsverzeichnis
*   `cache`: Cache-Verzeichnis der Anwendung
*   `bundle`: Die Anwendung Bündel; den Speicherort der die app selbst auf dem Datenträger (schreibgeschützt)
*   `root`: Das gesamte Gerät-Dateisystem

Standardmäßig können die Bibliothek und Dokumenten-Verzeichnisse mit iCloud synchronisiert werden. Können Sie auch beantragen, zwei zusätzliche Dateisysteme, `library-nosync` und `documents-nosync` , die repräsentieren eine spezielle nicht synchronisierten Verzeichnis innerhalb der `/Library` oder `/Documents` Dateisystem.