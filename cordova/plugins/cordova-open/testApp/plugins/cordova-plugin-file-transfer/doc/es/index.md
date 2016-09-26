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

Este plugin te permite cargar y descargar archivos.

Este plugin define global `FileTransfer` , `FileUploadOptions` constructores.

Aunque en el ámbito global, no están disponibles hasta después de la `deviceready` evento.

    document.addEventListener ("deviceready", onDeviceReady, false);
    function onDeviceReady() {console.log(FileTransfer)};
    

## Instalación

    Cordova plugin añade cordova-plugin-file-transferencia
    

## Plataformas soportadas

*   Amazon fire OS
*   Android
*   BlackBerry 10
*   Explorador
*   Firefox OS **
*   iOS
*   Windows Phone 7 y 8 *
*   Windows 8
*   Windows

* *No son compatibles con `onprogress` ni `abort()` *

** *No son compatibles con `onprogress` *

# FileTransfer

El `FileTransfer` objeto proporciona una manera de subir archivos mediante una solicitud HTTP de POST varias parte y para descargar archivos.

## Propiedades

*   **OnProgress**: llama con un `ProgressEvent` cuando se transfiere un nuevo paquete de datos. *(Función)*

## Métodos

*   **cargar**: envía un archivo a un servidor.

*   **Descargar**: descarga un archivo del servidor.

*   **abortar**: aborta una transferencia en curso.

## subir

**Parámetros**:

*   **fileURL**: URL de Filesystem que representa el archivo en el dispositivo. Para atrás compatibilidad, esto también puede ser la ruta de acceso completa del archivo en el dispositivo. (Ver [hacia atrás compatibilidad notas] debajo)

*   **servidor**: dirección URL del servidor para recibir el archivo, como codificada por`encodeURI()`.

*   **successCallback**: una devolución de llamada que se pasa un `FileUploadResult` objeto. *(Función)*

*   **errorCallback**: una devolución de llamada que se ejecuta si se produce un error recuperar la `FileUploadResult` . Invocado con un `FileTransferError` objeto. *(Función)*

*   **Opciones**: parámetros opcionales *(objeto)*. Teclas válidas:
    
    *   **fileKey**: el nombre del elemento de formulario. Por defecto es `file` . (DOMString)
    *   **nombre de archivo**: el nombre del archivo a utilizar al guardar el archivo en el servidor. Por defecto es `image.jpg` . (DOMString)
    *   **httpMethod**: método HTTP el utilizar - o `PUT` o `POST` . Por defecto es `POST` . (DOMString)
    *   **mimeType**: el tipo mime de los datos para cargar. Por defecto es `image/jpeg` . (DOMString)
    *   **params**: un conjunto de pares clave/valor opcional para pasar en la petición HTTP. (Objeto)
    *   **chunkedMode**: Si desea cargar los datos en modo de transmisión fragmentado. Por defecto es `true` . (Boolean)
    *   **cabeceras**: un mapa de valores de encabezado nombre/cabecera. Utilice una matriz para especificar más de un valor. (Objeto)

*   **trustAllHosts**: parámetro opcional, por defecto es `false` . Si establece en `true` , acepta todos los certificados de seguridad. Esto es útil ya que Android rechaza certificados autofirmados seguridad. No se recomienda para uso productivo. Compatible con iOS y Android. *(boolean)*

### Ejemplo

    // !! Asume fileURL variable contiene una dirección URL válida a un archivo de texto en el dispositivo, / / por ejemplo, ganar var cdvfile://localhost/persistent/path/to/file.txt = function (r) {console.log ("código =" + r.responseCode);
        Console.log ("respuesta =" + r.response);
        Console.log ("Sent =" + r.bytesSent);}
    
    var fallar = function (error) {alert ("ha ocurrido un error: código =" + error.code);
        Console.log ("error al cargar el origen" + error.source);
        Console.log ("upload error objetivo" + error.target);}
    
    var opciones = new FileUploadOptions();
    options.fileKey = "file";
    options.fileName = fileURL.substr(fileURL.lastIndexOf('/') + 1);
    options.mimeType = "text/plain";
    
    var params = {};
    params.value1 = "prueba";
    params.value2 = "param";
    
    options.params = params;
    
    var ft = new FileTransfer();
    Ft.upload (fileURL, encodeURI ("http://some.server.com/upload.php"), win, fail, opciones);
    

### Ejemplo con cabeceras de subir y eventos de progreso (Android y iOS solamente)

    function win(r) {console.log ("código =" + r.responseCode);
        Console.log ("respuesta =" + r.response);
        Console.log ("Sent =" + r.bytesSent);}
    
    function fail(error) {alert ("ha ocurrido un error: código =" + error.code);
        Console.log ("error al cargar el origen" + error.source);
        Console.log ("upload error objetivo" + error.target);}
    
    var uri = encodeURI ("http://some.server.com/upload.php");
    
    var opciones = new FileUploadOptions();
    options.fileKey="file";
    options.fileName=fileURL.substr(fileURL.lastIndexOf('/')+1);
    options.mimeType="text/plain";
    
    cabeceras de var ={'headerParam':'headerValue'};
    
    options.headers = encabezados;
    
    var ft = new FileTransfer();
    Ft.OnProgress = function(progressEvent) {si (progressEvent.lengthComputable) {loadingStatus.setPercentage(progressEvent.loaded / progressEvent.total);
        } {loadingStatus.increment() más;
        }
    };
    Ft.upload (fileURL, uri, win, fail, opciones);
    

## FileUploadResult

A `FileUploadResult` objeto se pasa a la devolución del éxito de la `FileTransfer` del objeto `upload()` método.

### Propiedades

*   **bytesSent**: el número de bytes enviados al servidor como parte de la carga. (largo)

*   **responseCode**: código de respuesta HTTP el devuelto por el servidor. (largo)

*   **respuesta**: respuesta el HTTP devuelto por el servidor. (DOMString)

*   **cabeceras**: cabeceras de respuesta HTTP el por el servidor. (Objeto)
    
    *   Actualmente compatible con iOS solamente.

### iOS rarezas

*   No es compatible con `responseCode` o`bytesSent`.

## descargar

**Parámetros**:

*   **fuente**: dirección URL del servidor para descargar el archivo, como codificada por`encodeURI()`.

*   **objetivo**: Filesystem url que representa el archivo en el dispositivo. Para atrás compatibilidad, esto también puede ser la ruta de acceso completa del archivo en el dispositivo. (Ver [hacia atrás compatibilidad notas] debajo)

*   **successCallback**: una devolución de llamada que se pasa un `FileEntry` objeto. *(Función)*

*   **errorCallback**: una devolución de llamada que se ejecuta si se produce un error al recuperar los `FileEntry` . Invocado con un `FileTransferError` objeto. *(Función)*

*   **trustAllHosts**: parámetro opcional, por defecto es `false` . Si establece en `true` , acepta todos los certificados de seguridad. Esto es útil porque Android rechaza certificados autofirmados seguridad. No se recomienda para uso productivo. Compatible con iOS y Android. *(boolean)*

*   **Opciones**: parámetros opcionales, actualmente sólo soporta cabeceras (como autorización (autenticación básica), etc.).

### Ejemplo

    // !! Asume fileURL variable contiene una dirección URL válida a un camino en el dispositivo, / / por ejemplo, File Transfer var cdvfile://localhost/persistent/path/to/downloads/ = new FileTransfer();
    var uri = encodeURI ("http://some.server.com/download.php");
    
    fileTransfer.download (uri, fileURL, function(entry) {console.log ("descarga completa:" + entry.toURL());
        }, function(error) {console.log ("error al descargar el origen" + error.source);
            Console.log ("descargar error objetivo" + error.target);
            Console.log ("código de error de carga" + error.code);
        }, falso, {encabezados: {"Autorización": "Basic dGVzdHVzZXJuYW1lOnRlc3RwYXNzd29yZA =="}});
    

## abortar

Aborta a una transferencia en curso. El callback onerror se pasa un objeto FileTransferError que tiene un código de error de FileTransferError.ABORT_ERR.

### Ejemplo

    // !! Asume fileURL variable contiene una dirección URL válida a un archivo de texto en el dispositivo, / / por ejemplo, ganar cdvfile://localhost/persistent/path/to/file.txt var function(r) = {console.log ("no se debe llamar.");}
    
    var fallar = function(error) {/ / error.code == FileTransferError.ABORT_ERR alert ("ha ocurrido un error: código =" + error.code);
        Console.log ("error al cargar el origen" + error.source);
        Console.log ("upload error objetivo" + error.target);}
    
    var opciones = new FileUploadOptions();
    options.fileKey="file";
    options.fileName="myphoto.jpg";
    options.mimeType="image/jpeg";
    
    var ft = new FileTransfer();
    Ft.upload (fileURL, encodeURI ("http://some.server.com/upload.php"), win, fail, opciones);
    Ft.Abort();
    

## FileTransferError

A `FileTransferError` objeto se pasa a un callback de error cuando se produce un error.

### Propiedades

*   **código**: uno de los códigos de error predefinido enumerados a continuación. (Número)

*   **fuente**: URL a la fuente. (String)

*   **objetivo**: URL a la meta. (String)

*   **HTTP_STATUS**: código de estado HTTP. Este atributo sólo está disponible cuando se recibe un código de respuesta de la conexión HTTP. (Número)

*   **cuerpo** Cuerpo de la respuesta. Este atributo sólo está disponible cuando se recibe una respuesta de la conexión HTTP. (String)

*   **excepción**: cualquier e.getMessage o e.toString (String)

### Constantes

*   1 = `FileTransferError.FILE_NOT_FOUND_ERR`
*   2 = `FileTransferError.INVALID_URL_ERR`
*   3 = `FileTransferError.CONNECTION_ERR`
*   4 = `FileTransferError.ABORT_ERR`
*   5 = `FileTransferError.NOT_MODIFIED_ERR`

## Al revés notas de compatibilidad

Versiones anteriores de este plugin sólo aceptaría dispositivo-absoluto-archivo-rutas como la fuente de carga, o como destino para las descargas. Estos caminos normalmente sería de la forma

    /var/mobile/Applications/<application UUID>/Documents/path/to/file  (iOS)
    /storage/emulated/0/path/to/file                                    (Android)
    

Para atrás compatibilidad, estos caminos son aceptados todavía, y si su solicitud ha grabado caminos como éstos en almacenamiento persistente, entonces pueden seguir utilizarse.

Estos caminos fueron expuestos anteriormente en el `fullPath` propiedad de `FileEntry` y `DirectoryEntry` objetos devueltos por el plugin de archivo. Las nuevas versiones del archivo plugin, sin embargo, ya no exponen estos caminos a JavaScript.

Si va a actualizar a una nueva (1.0.0 o más reciente) versión del archivo y previamente han estado utilizando `entry.fullPath` como argumentos para `download()` o `upload()` , entonces tendrá que cambiar su código para usar URLs de sistema de archivos en su lugar.

`FileEntry.toURL()`y `DirectoryEntry.toURL()` devolver un filesystem dirección URL de la forma

    cdvfile://localhost/persistent/path/to/file
    

que puede ser utilizado en lugar de la ruta del archivo absoluta tanto en `download()` y `upload()` los métodos.
