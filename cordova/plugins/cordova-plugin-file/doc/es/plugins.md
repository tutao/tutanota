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

# Notas para los desarrolladores del plugin

Estas notas están pensadas principalmente para desarrolladores de Android y el iOS que quieran escribir plugins que interfaz con el sistema de ficheros usando el plugin del archivo.

## Trabajar con URLs de sistema de archivo de Córdoba

Desde la versión 1.0.0, este plugin ha utilizado las direcciones URL con un `cdvfile` plan para todas las comunicaciones sobre el puente, en lugar de exponer rutas de sistema de archivos de dispositivos raw para JavaScript.

En el lado de JavaScript, esto significa que los objetos FileEntry y DirectoryEntry tienen un atributo fullPath que es relativo a la raíz del sistema de archivos HTML. Si JavaScript API de tu plugin acepta un objeto FileEntry o DirectoryEntry, usted debe llamar a `.toURL()` en ese objeto antes de pasar a través del puente al código nativo.

### Conversión de cdvfile: / / URL al fileystem caminos

Plugins que necesita escribir en el sistema de archivos puede convertir un archivo recibido sistema URL a una ubicación de sistema de archivos real. Hay varias formas de hacerlo, dependiendo de la plataforma nativa.

Es importante recordar que no todos `cdvfile://` las direcciones URL son asignables a reales archivos en el dispositivo. Algunas URLs pueden referirse a activos en dispositivos que no están representadas por archivos, o incluso pueden hacer referencia a recursos remotos. Debido a estas posibilidades, plugins siempre debe comprobar si consiguen un resultado significativo cuando tratando de convertir las URL en trazados.

#### Android

En Android, el método más simple para convertir un `cdvfile://` URL a una ruta de sistema de archivos es utilizar `org.apache.cordova.CordovaResourceApi` . `CordovaResourceApi`tiene varios métodos que pueden manejar `cdvfile://` URL:

    webView es un miembro de la clase Plugin CordovaResourceApi resourceApi = webView.getResourceApi();
    
    Obtener una URL file:/// representando este archivo en el dispositivo, / / o el mismo URL sin cambios si no se puede asignar a un archivo Uri fileURL = resourceApi.remapUri(Uri.parse(cdvfileURL));
    

También es posible utilizar el plugin de archivos directamente:

    Import org.apache.cordova.file.FileUtils;
    Import org.apache.cordova.file.FileSystem;
    Import java.net.MalformedURLException;
    
    Obtener el archivo plugin desde el administrador de plugin FileUtils filePlugin = (FileUtils)webView.pluginManager.getPlugin("File");
    
    Dada una URL, haz un camino para tratar de {camino de cadena = filePlugin.filesystemPathForURL(cdvfileURL);} catch (DD e) {/ / el sistema de archivos url no reconocida}
    

Para convertir de una ruta a un `cdvfile://` URL:

    Import org.apache.cordova.file.LocalFilesystemURL;
    
    Obtener un objeto LocalFilesystemURL para una ruta, / / o null si no se puede representar como una dirección URL cdvfile.
    LocalFilesystemURL url = filePlugin.filesystemURLforLocalPath(path);
    Obtener la representación string de la URL objeto String cdvfileURL = url.toString();
    

Si tu plugin crea un archivo y desea devolver un objeto FileEntry para él, usar el plugin de archivos:

    Devolver una estructura JSON adecuado para volver a JavaScript, / / o null si este archivo no es representable como una dirección URL cdvfile.
    JSONObject entrada = filePlugin.getEntryForFile(file);
    

#### iOS

Cordova en iOS no utiliza la misma `CordovaResourceApi` concepto como Android. En iOS, debe usar el archivo plugin para convertir las direcciones URL y rutas de sistema de archivos.

    Obtener un objeto URL CDVFilesystem de una URL string CDVFilesystemURL * url = [CDVFilesystemURL fileSystemURLWithString:cdvfileURL];
    Obtener una ruta de acceso para el objeto URL, o nil si no puede ser asignado a una ruta de archivo NSString * = [filePlugin filesystemPathForURL:url];
    
    
    Obtener un objeto URL CDVFilesystem para una ruta, o / / nula si no se puede representar como una dirección URL cdvfile.
    CDVFilesystemURL * url = [filePlugin fileSystemURLforLocalPath:path];
    Obtener la representación string de la URL objetos NSString * cdvfileURL = [enlace absoluteString];
    

Si tu plugin crea un archivo y desea devolver un objeto FileEntry para él, usar el plugin de archivos:

    Obtener un objeto URL CDVFilesystem para una ruta, o / / nula si no se puede representar como una dirección URL cdvfile.
    CDVFilesystemURL * url = [filePlugin fileSystemURLforLocalPath:path];
    Conseguir una estructura para volver a JavaScript NSDictionary * entrada = [filePlugin makeEntryForLocalURL:url]
    

#### JavaScript

En JavaScript, para obtener un `cdvfile://` dirección URL de un objeto FileEntry o DirectoryEntry, simplemente llame al `.toURL()` en él:

    var cdvfileURL = entry.toURL();
    

En manipuladores de la respuesta del plugin, para convertir de una estructura FileEntry devuelta a un objeto real de la entrada, su código de controlador debe importar el archivo plugin y crear un nuevo objeto:

    crear apropiado objeto var ingreso;
    Si (entryStruct.isDirectory) {entrada = new DirectoryEntry (entryStruct.name, entryStruct.fullPath, FileSystem(entryStruct.filesystemName)) nuevo;} else {entrada = nuevo FileEntry (entryStruct.name, entryStruct.fullPath, nuevo FileSystem(entryStruct.filesystemName));}