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

# Hinweise für Plugin-Entwickler

Diese Notizen sind hauptsächlich für Android und iOS-Entwickler, die Plugins welche Schnittstelle mit dem Dateisystem, mit dem Plugin Datei schreiben möchten.

## Arbeiten mit Cordova-Datei-System-URLs

Seit der Version 1.0.0, wurde dieses Plugin verwendet URLs mit einer `cdvfile` Regelung für die gesamte Kommunikation über die Brücke, sondern als raw-Device Dateisystempfade zu JavaScript auszusetzen.

Auf der Seite JavaScript bedeutet dies, dass FileEntries und DirectoryEntry-Objekt ein FullPath-Attribut haben, die relativ zum Stammverzeichnis des Dateisystems HTML ist. Wenn Ihr Plugins-JavaScript-API ein FileEntries oder DirectoryEntry-Objekt akzeptiert, rufen Sie `.toURL()` auf das Objekt vor der Übergabe an systemeigenen Code über die Brücke.

### Konvertieren von Cdvfile: / / URLs auf Fileystem Pfade

Plugins, die auf das Dateisystem schreiben müssen, sollten eine empfangene Datei-System-URL auf eine tatsächliche Stelle des Dateisystems zu konvertieren. Es gibt mehrere Wege, dies zu tun, je nach einheitlichen Plattform.

Es ist wichtig, daran erinnern, dass nicht alle `cdvfile://` URLs sind zuweisbaren real Dateien auf das Gerät. Einige URLs verweisen auf Vermögenswerte auf Gerät nicht durch Dateien dargestellt werden, oder sogar auf Remoteressourcen verweisen können. Aufgrund dieser Möglichkeiten sollten Plugins immer testen, ob sie ein sinnvolles Ergebnis zu erhalten, wieder bei dem Versuch, die URLs in Pfade umwandeln.

#### Android

Auf Android, konvertiert die einfachste Methode eine `cdvfile://` URL zu einem Dateisystempfad zu verwenden ist `org.apache.cordova.CordovaResourceApi` . `CordovaResourceApi`verfügt über mehrere Methoden der verarbeiten kann `cdvfile://` URLs:

    WebView ist Mitglied der Plugin-Klasse CordovaResourceApi ResourceApi = webView.getResourceApi();
    
    Erhalten eine file:/// URL, diese Datei auf dem Gerät / / oder die gleiche URL unverändert, wenn es eine Datei-Uri FileURL zugeordnet werden kann nicht = resourceApi.remapUri(Uri.parse(cdvfileURL));
    

Es ist auch möglich, das Plugin Datei direkt zu verwenden:

    Import org.apache.cordova.file.FileUtils;
    Import org.apache.cordova.file.FileSystem;
    Import Java.net.MalformedURLException:;
    
    Erhalten Sie das Datei-Plugin aus dem Plugin-Manager FileUtils FilePlugin = (FileUtils)webView.pluginManager.getPlugin("File");
    
    Angesichts eine URL, einen Pfad zu erhalten, denn es versuchen {String Pfad = filePlugin.filesystemPathForURL(cdvfileURL);} catch (MalformedURLException e) {/ / die Dateisystem-Url war nicht erkannt}
    

Aus einem Pfad zu konvertieren eine `cdvfile://` URL:

    Import org.apache.cordova.file.LocalFilesystemURL;
    
    Rufen Sie ein LocalFilesystemURL-Objekt für einen Gerätepfad / / oder null, wenn sie nicht als URL Cdvfile dargestellt wird.
    LocalFilesystemURL Url = filePlugin.filesystemURLforLocalPath(path);
    Erhalten Sie die Zeichenfolgendarstellung der URL Objekt String CdvfileURL = url.toString();
    

Wenn Ihr Plugin eine Datei erstellt, und Sie dafür ein FileEntries-Objekt zurückgeben möchten, verwenden Sie das Datei-Plugin:

    Zurückgeben eine JSON-Struktur geeignet für die Rückgabe an JavaScript, / / oder null, wenn diese Datei nicht als URL Cdvfile darstellbar ist.
    JSONObject Eintrag = filePlugin.getEntryForFile(file);
    

#### iOS

Cordova auf iOS verwendet nicht das gleiche `CordovaResourceApi` Konzept als Android. Auf iOS sollten Sie das Datei-Plugin verwenden, zum Konvertieren von URLs und Dateisystem-Pfaden.

    Rufen Sie ein CDVFilesystem URL-Objekt von einer URL-Zeichenfolge CDVFilesystemURL * Url = [CDVFilesystemURL FileSystemURLWithString:cdvfileURL];
    Erhalten Sie einen Pfad für die URL-Objekt oder NULL, wenn es einen Dateipfad NSString * zugeordnet werden kann nicht = [FilePlugin FilesystemPathForURL:url];
    
    
    Eine CDVFilesystem URL-Objekt für einen Gerätepfad abrufen oder / / gleich NULL, wenn sie nicht als URL Cdvfile dargestellt wird.
    CDVFilesystemURL-Url = [FilePlugin FileSystemURLforLocalPath:path];
    Erhalten Sie die Zeichenfolgendarstellung der URL Objekt NSString * CdvfileURL = [Url AbsoluteString];
    

Wenn Ihr Plugin eine Datei erstellt, und Sie dafür ein FileEntries-Objekt zurückgeben möchten, verwenden Sie das Datei-Plugin:

    Eine CDVFilesystem URL-Objekt für einen Gerätepfad abrufen oder / / gleich NULL, wenn sie nicht als URL Cdvfile dargestellt wird.
    CDVFilesystemURL-Url = [FilePlugin FileSystemURLforLocalPath:path];
    Erhalten eine Struktur zurück nach JavaScript NSDictionary * Eintrag = [FilePlugin MakeEntryForLocalURL:url]
    

#### JavaScript

In JavaScript, bekommen eine `cdvfile://` URL aus einem FileEntries oder DirectoryEntry-Objekt, rufen Sie einfach `.toURL()` drauf:

    Var CdvfileURL = entry.toURL();
    

Im Plugin Antwort Handler zur Konvertierung von einer zurückgegebenen FileEntries-Struktur in einem tatsächlichen Eintrag-Objekt sollte Handlercode importieren die Datei-Erweiterung und ein neues Objekt zu erstellen:

    Erstellen Sie entsprechenden Eintrag Objekt Var Eintrag;
    Wenn (entryStruct.isDirectory) {Eintrag = neues DirectoryEntry (entryStruct.name, entryStruct.fullPath, neue FileSystem(entryStruct.filesystemName));} sonst {Eintrag = neue FileEntries (entryStruct.name, entryStruct.fullPath, neue FileSystem(entryStruct.filesystemName));}