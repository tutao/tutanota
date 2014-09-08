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

Diese Notizen sollen in erster Linie für Android und iOS-Entwickler, die Plugins welche Schnittstelle mit dem Dateisystem, mit dem Datei-Plugin schreiben möchten.

## Arbeiten mit Cordova-Datei-System-URLs

Seit der Version 1.0.0, wurde dieses Plugin URLs mit verwendet eine `cdvfile` Regelung für die gesamte Kommunikation über die Brücke, sondern als raw-Device Dateisystempfade zu JavaScript auszusetzen.

Auf der Seite JavaScript bedeutet dies, dass FileEntries und DirectoryEntry-Objekt ein FullPath-Attribut haben, die relativ zum Stammverzeichnis des Dateisystems HTML ist. Wenn Ihr Plugins-JavaScript-API ein FileEntries oder DirectoryEntry-Objekt akzeptiert, rufen Sie `.toURL()` auf das Objekt vor der Übergabe an systemeigenen Code über die Brücke.

### Konvertieren von Cdvfile: / / URLs auf Fileystem Pfade

Plugins, die auf das Dateisystem schreiben müssen, möchten möglicherweise eine empfangene Datei-System-URL auf eine tatsächliche Stelle des Dateisystems zu konvertieren. Es gibt mehrere Wege, dies zu tun, je nach einheitlichen Plattform.

Es ist wichtig zu erinnern, dass nicht alle `cdvfile://` URLs sind zuweisbaren real Dateien auf das Gerät. Einige URLs verweisen auf Vermögenswerte auf Gerät die werden nicht durch Dateien dargestellt, oder sogar auf Remoteressourcen verweisen kann. Aufgrund dieser Möglichkeiten sollten Plugins immer testen, ob sie ein sinnvolles Ergebnis zu erhalten, wieder beim URLs in Pfade umwandeln.

#### Android

Auf Android, die einfachste Methode zum Konvertieren eines `cdvfile://` darin, dass die URL zu einem Dateisystempfad verwenden `org.apache.cordova.CordovaResourceApi` . `CordovaResourceApi`verfügt über mehrere Methoden der verarbeiten kann `cdvfile://` URLs:

    // webView is a member of the Plugin class
    CordovaResourceApi resourceApi = webView.getResourceApi();
    
    // Obtain a file:/// URL representing this file on the device,
    // or the same URL unchanged if it cannot be mapped to a file
    Uri fileURL = resourceApi.remapUri(Uri.parse(cdvfileURL));
    

Es ist auch möglich, das Plugin Datei direkt zu verwenden:

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
    

Konvertieren von einen Pfad zu einer `cdvfile://` URL:

    import org.apache.cordova.file.LocalFilesystemURL;
    
    // Get a LocalFilesystemURL object for a device path,
    // or null if it cannot be represented as a cdvfile URL.
    LocalFilesystemURL url = filePlugin.filesystemURLforLocalPath(path);
    // Get the string representation of the URL object
    String cdvfileURL = url.toString();
    

Wenn Ihr Plugin eine Datei erstellt, und Sie dafür ein FileEntries-Objekt zurückgeben möchten, verwenden Sie das Datei-Plugin:

    // Return a JSON structure suitable for returning to JavaScript,
    // or null if this file is not representable as a cdvfile URL.
    JSONObject entry = filePlugin.getEntryForFile(file);
    

#### iOS

Cordova auf iOS verwendet nicht das gleiche `CordovaResourceApi` Konzept als Android. Auf iOS sollten Sie das Datei-Plugin verwenden, zum Konvertieren von URLs und Dateisystem-Pfaden.

    // Get a CDVFilesystem URL object from a URL string
    CDVFilesystemURL* url = [CDVFilesystemURL fileSystemURLWithString:cdvfileURL];
    // Get a path for the URL object, or nil if it cannot be mapped to a file
    NSString* path = [filePlugin filesystemPathForURL:url];
    
    
    // Get a CDVFilesystem URL object for a device path, or
    // nil if it cannot be represented as a cdvfile URL.
    CDVFilesystemURL* url = [filePlugin fileSystemURLforLocalPath:path];
    // Get the string representation of the URL object
    NSString* cdvfileURL = [url absoluteString];
    

Wenn Ihr Plugin eine Datei erstellt, und Sie dafür ein FileEntries-Objekt zurückgeben möchten, verwenden Sie das Datei-Plugin:

    // Get a CDVFilesystem URL object for a device path, or
    // nil if it cannot be represented as a cdvfile URL.
    CDVFilesystemURL* url = [filePlugin fileSystemURLforLocalPath:path];
    // Get a structure to return to JavaScript
    NSDictionary* entry = [filePlugin makeEntryForLocalURL:url]
    

#### JavaScript

In JavaScript, bekommen eine `cdvfile://` URL aus einem FileEntries oder DirectoryEntry-Objekt, rufen Sie einfach `.toURL()` drauf:

    var cdvfileURL = entry.toURL();
    

Im Plugin Antwort Handler um aus einer zurückgegebenen FileEntries-Struktur in ein tatsächliches Entry-Objekt zu konvertieren sollte Handlercode importieren die Datei-Erweiterung und ein neues Objekt erstellen:

    // create appropriate Entry object
    var entry;
    if (entryStruct.isDirectory) {
        entry = new DirectoryEntry(entryStruct.name, entryStruct.fullPath, new FileSystem(entryStruct.filesystemName));
    } else {
        entry = new FileEntry(entryStruct.name, entryStruct.fullPath, new FileSystem(entryStruct.filesystemName));
    }