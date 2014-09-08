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

# Примечания для разработчиков плагинов

Эти примечания предназначены прежде всего для Android и iOS разработчиков, которые хотят писать плагины какой интерфейс с файловой системой, с помощью файла плагина.

## Работа с Кордова файловой системы URL

Начиная с версии 1.0.0, этот плагин использует URL-адресов с `cdvfile` схема для всех коммуникации через мост, а не подвергая пути файловой системы raw устройства для JavaScript.

На стороне JavaScript это означает, что объекты DirectoryEntry и FileEntry fullPath атрибут, который является по отношению к корневой файловой системе HTML. Если ваш плагин JavaScript API принимает объект DirectoryEntry или FileEntry, необходимо вызвать `.toURL()` для этого объекта перед передачей их через мост в машинный код.

### Преобразование cdvfile: / / URL-адреса в пути fileystem

Плагины, которые нужно написать в файловой системе может потребоваться преобразовать URL-адреса системы полученный файл в место фактической файловой системы. Существует несколько способов сделать это, в зависимости от родной платформе.

Важно помнить, что не все `cdvfile://` URL-адреса являются отображаемыми файлами на устройстве. Некоторые URL может относиться к активам на устройстве, которые не представлены файлы, или может даже обратиться к удаленным ресурсам. Из-за эти возможности плагины следует всегда проверять ли они получают результат обратно при попытке преобразовать URL-адреса в пути.

#### Android

На Android, самый простой способ для преобразования `cdvfile://` URL-адрес к пути файловой системы заключается в использовании `org.apache.cordova.CordovaResourceApi` . `CordovaResourceApi`Есть несколько методов, которые можно обработать `cdvfile://` URL-адреса:

    // webView is a member of the Plugin class
    CordovaResourceApi resourceApi = webView.getResourceApi();
    
    // Obtain a file:/// URL representing this file on the device,
    // or the same URL unchanged if it cannot be mapped to a file
    Uri fileURL = resourceApi.remapUri(Uri.parse(cdvfileURL));
    

Это также можно использовать плагин файл непосредственно:

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
    

Для преобразования пути к `cdvfile://` URL-адрес:

    import org.apache.cordova.file.LocalFilesystemURL;
    
    // Get a LocalFilesystemURL object for a device path,
    // or null if it cannot be represented as a cdvfile URL.
    LocalFilesystemURL url = filePlugin.filesystemURLforLocalPath(path);
    // Get the string representation of the URL object
    String cdvfileURL = url.toString();
    

Если ваш плагин создает файл, и вы хотите вернуть объект FileEntry для него, используйте файл плагина:

    // Return a JSON structure suitable for returning to JavaScript,
    // or null if this file is not representable as a cdvfile URL.
    JSONObject entry = filePlugin.getEntryForFile(file);
    

#### iOS

Кордова на iOS не использовать те же `CordovaResourceApi` понятие, как Android. На iOS вы должны использовать файл плагин для преобразования URL-адреса и пути файловой системы.

    // Get a CDVFilesystem URL object from a URL string
    CDVFilesystemURL* url = [CDVFilesystemURL fileSystemURLWithString:cdvfileURL];
    // Get a path for the URL object, or nil if it cannot be mapped to a file
    NSString* path = [filePlugin filesystemPathForURL:url];
    
    
    // Get a CDVFilesystem URL object for a device path, or
    // nil if it cannot be represented as a cdvfile URL.
    CDVFilesystemURL* url = [filePlugin fileSystemURLforLocalPath:path];
    // Get the string representation of the URL object
    NSString* cdvfileURL = [url absoluteString];
    

Если ваш плагин создает файл, и вы хотите вернуть объект FileEntry для него, используйте файл плагина:

    // Get a CDVFilesystem URL object for a device path, or
    // nil if it cannot be represented as a cdvfile URL.
    CDVFilesystemURL* url = [filePlugin fileSystemURLforLocalPath:path];
    // Get a structure to return to JavaScript
    NSDictionary* entry = [filePlugin makeEntryForLocalURL:url]
    

#### JavaScript

В JavaScript, чтобы получить `cdvfile://` URL от объекта DirectoryEntry или FileEntry, просто позвоните `.toURL()` на него:

    var cdvfileURL = entry.toURL();
    

В плагин обработчики ответ для преобразования из возвращаемой структуры FileEntry объект фактического вступления, код обработчика следует импортировать файл плагина и создайте новый объект:

    // create appropriate Entry object
    var entry;
    if (entryStruct.isDirectory) {
        entry = new DirectoryEntry(entryStruct.name, entryStruct.fullPath, new FileSystem(entryStruct.filesystemName));
    } else {
        entry = new FileEntry(entryStruct.name, entryStruct.fullPath, new FileSystem(entryStruct.filesystemName));
    }