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

# Notas para los desarrolladores de plugin

Estas notas están pensadas principalmente para los desarrolladores de Android y el iOS que quieran escribir plugins que interfaz con el sistema de archivos usando el plugin de archivo.

## Trabajando con Cordova archivo sistema URLs

Desde la versión 1.0.0, este plugin utiliza las direcciones URL con un `cdvfile` plan para todas las comunicaciones sobre el puente, en lugar de exponer rutas de sistema de archivo de dispositivo raw a JavaScript.

En el lado de JavaScript, esto significa que los objetos FileEntry y DirectoryEntry tienen un atributo fullPath que es relativo a la raíz del sistema de archivos HTML. Si JavaScript API del plugin acepta un objeto FileEntry o DirectoryEntry, debe llamar a `.toURL()` en ese objeto antes de pasarla a través del puente a código nativo.

### Conversión de cdvfile: / / URL al fileystem caminos

Plugins que necesita escribir en el sistema de archivos puede querer convertir un archivo recibido sistema URL a una ubicación de archivos reales. Hay varias formas de hacer esto, dependiendo de la plataforma nativa.

Es importante recordar que no todos `cdvfile://` URLs son asignables a los archivos reales en el dispositivo. Algunas URLs pueden referirse a activos en dispositivos que no están representados por los archivos, o incluso pueden referirse a recursos remotos. Debido a estas posibilidades, plugins siempre debe probar si consiguen un resultado significativo cuando tratando de convertir URLs en trazados.

#### Android

En Android, el método más sencillo para convertir un `cdvfile://` URL a una ruta de sistema de archivos es utilizar `org.apache.cordova.CordovaResourceApi` . `CordovaResourceApi`tiene varios métodos que pueden manejar `cdvfile://` URLs:

    // webView is a member of the Plugin class
    CordovaResourceApi resourceApi = webView.getResourceApi();
    
    // Obtain a file:/// URL representing this file on the device,
    // or the same URL unchanged if it cannot be mapped to a file
    Uri fileURL = resourceApi.remapUri(Uri.parse(cdvfileURL));
    

También es posible utilizar directamente el archivo plugin:

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
    

Para convertir de un camino hacia un `cdvfile://` URL:

    import org.apache.cordova.file.LocalFilesystemURL;
    
    // Get a LocalFilesystemURL object for a device path,
    // or null if it cannot be represented as a cdvfile URL.
    LocalFilesystemURL url = filePlugin.filesystemURLforLocalPath(path);
    // Get the string representation of the URL object
    String cdvfileURL = url.toString();
    

Si tu plugin crea un archivo y desea devolver un objeto FileEntry para ello, utilice el archivo plugin:

    // Return a JSON structure suitable for returning to JavaScript,
    // or null if this file is not representable as a cdvfile URL.
    JSONObject entry = filePlugin.getEntryForFile(file);
    

#### iOS

Cordova en iOS no utiliza el mismo `CordovaResourceApi` concepto como Android. En iOS, utilice el archivo plugin para convertir las direcciones URL y rutas de archivos.

    // Get a CDVFilesystem URL object from a URL string
    CDVFilesystemURL* url = [CDVFilesystemURL fileSystemURLWithString:cdvfileURL];
    // Get a path for the URL object, or nil if it cannot be mapped to a file
    NSString* path = [filePlugin filesystemPathForURL:url];
    
    
    // Get a CDVFilesystem URL object for a device path, or
    // nil if it cannot be represented as a cdvfile URL.
    CDVFilesystemURL* url = [filePlugin fileSystemURLforLocalPath:path];
    // Get the string representation of the URL object
    NSString* cdvfileURL = [url absoluteString];
    

Si tu plugin crea un archivo y desea devolver un objeto FileEntry para ello, utilice el archivo plugin:

    // Get a CDVFilesystem URL object for a device path, or
    // nil if it cannot be represented as a cdvfile URL.
    CDVFilesystemURL* url = [filePlugin fileSystemURLforLocalPath:path];
    // Get a structure to return to JavaScript
    NSDictionary* entry = [filePlugin makeEntryForLocalURL:url]
    

#### JavaScript

En JavaScript, para conseguir un `cdvfile://` URL de un objeto FileEntry o DirectoryEntry, simplemente llame a `.toURL()` en él:

    var cdvfileURL = entry.toURL();
    

En plugin manipuladores de respuesta, para convertir de una estructura FileEntry devuelta a un objeto real de la entrada, el código del controlador debe importar el archivo plugin y crear un nuevo objeto:

    // create appropriate Entry object
    var entry;
    if (entryStruct.isDirectory) {
        entry = new DirectoryEntry(entryStruct.name, entryStruct.fullPath, new FileSystem(entryStruct.filesystemName));
    } else {
        entry = new FileEntry(entryStruct.name, entryStruct.fullPath, new FileSystem(entryStruct.filesystemName));
    }