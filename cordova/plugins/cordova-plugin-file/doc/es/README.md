<!--
# license: Licensed to the Apache Software Foundation (ASF) under one
#         or more contributor license agreements.  See the NOTICE file
#         distributed with this work for additional information
#         regarding copyright ownership.  The ASF licenses this file
#         to you under the Apache License, Version 2.0 (the
#         "License"); you may not use this file except in compliance
#         with the License.  You may obtain a copy of the License at
#
#           http://www.apache.org/licenses/LICENSE-2.0
#
#         Unless required by applicable law or agreed to in writing,
#         software distributed under the License is distributed on an
#         "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
#         KIND, either express or implied.  See the License for the
#         specific language governing permissions and limitations
#         under the License.
-->

# cordova-plugin-file

[![Build Status](https://travis-ci.org/apache/cordova-plugin-file.svg)](https://travis-ci.org/apache/cordova-plugin-file)

Este plugin implementa una API de archivo que permite acceso de lectura/escritura a los archivos que residen en el dispositivo.

Este plugin se basa en varias especificaciones, incluyendo: el HTML5 archivo API <http://www.w3.org/TR/FileAPI/>

Los directorios (ahora extinto) y sistema de extensiones más recientes: <http://www.w3.org/TR/2012/WD-file-system-api-20120417/> aunque la mayor parte del código del plugin fue escrito cuando una especificación anterior era actual: <http://www.w3.org/TR/2011/WD-file-system-api-20110419/>

También implementa la especificación de FileWriter: <http://dev.w3.org/2009/dap/file-system/file-writer.html>

Para el uso, por favor, consulte 'HTML5 Rocks excelente [FileSystem artículo.](http://www.html5rocks.com/en/tutorials/file/filesystem/)

Para tener una visión general de otras opciones de almacenamiento, consulte [Guía de almacenamiento Cordova](http://cordova.apache.org/docs/en/edge/cordova_storage_storage.md.html).

Este plugin define global `cordova.file` objeto.

Aunque en el ámbito global, no estará disponible hasta después de la `deviceready` evento.

    document.addEventListener("deviceready", onDeviceReady, false);
    function onDeviceReady() {
        console.log(cordova.file);
    }
    

## Instalación

    cordova plugin add cordova-plugin-file
    

## Plataformas soportadas

  * Amazon fire OS
  * Android
  * BlackBerry 10
  * Firefox OS
  * iOS
  * Windows Phone 7 y 8 *
  * Windows 8 *
  * Windows*
  * Explorador

\* *These platforms do not support `FileReader.readAsArrayBuffer` nor `FileWriter.write(blob)`.*

## Donde almacenar los archivos

A partir de v1.2.0, URLs a directorios de sistema de archivos importantes son proporcionadas. Cada dirección URL está en la forma *file:///path/to/spot/*y se puede convertir en un `DirectoryEntry` usando`window.resolveLocalFileSystemURL()`.

  * `cordova.file.applicationDirectory`-Directorio Read-only donde está instalada la aplicación. (*iOS*, *Android*, *BlackBerry 10*)

  * `cordova.file.applicationStorageDirectory`-Directorio del entorno limitado de la aplicación; en iOS esta ubicación es de sólo lectura (pero subdirectorios específicos [como `/Documents` ] son de lectura y escritura). Todos los datos contenidos dentro es privado para la aplicación. ( *iOS*, *Android*, *BlackBerry 10*)

  * `cordova.file.dataDirectory`-Almacenamiento de datos persistente y privadas dentro de entorno limitado de la aplicación utilizando la memoria interna (en Android, si necesitas usar memoria externa, use `.externalDataDirectory` ). En iOS, este directorio no está sincronizado con iCloud (utilice `.syncedDataDirectory` ). (*iOS*, *Android*, *BlackBerry 10*)

  * `cordova.file.cacheDirectory`-Directorio para los archivos de datos almacenados en caché o los archivos que su aplicación puede volver a crear fácilmente. El sistema operativo puede borrar estos archivos cuando el dispositivo se agota en almacenamiento de información, sin embargo, aplicaciones no deben confiar en el sistema operativo para eliminar los archivos de aquí. (*iOS*, *Android*, *BlackBerry 10*)

  * `cordova.file.externalApplicationStorageDirectory`-Espacio aplicación de almacenamiento externo. (*Android*)

  * `cordova.file.externalDataDirectory`¿Dónde poner los archivos de datos específicos de la aplicación de almacenamiento externo. (*Android*)

  * `cordova.file.externalCacheDirectory`-Caché aplicación de almacenamiento externo. (*Android*)

  * `cordova.file.externalRootDirectory`-Raíz de almacenamiento externo (tarjeta SD). (*Android*, *BlackBerry 10*)

  * `cordova.file.tempDirectory`-Directorio temporal que puede borrar el sistema operativo en sí. No confíe en el sistema operativo para borrar este directorio; su aplicación siempre debe eliminar archivos según corresponda. (*iOS*)

  * `cordova.file.syncedDataDirectory`-Contiene los archivos de la aplicación específica que deben ser sincronizados (e.g. a iCloud). (*iOS*)

  * `cordova.file.documentsDirectory`-Archivos privados a la aplicación, pero que son significativos para otra aplicación (por ejemplo archivos de Office). (*iOS*)

  * `cordova.file.sharedDirectory`-Archivos disponibles globalmente para todas las aplicaciones (*BlackBerry 10*)

## Diseños de sistema de archivo

Aunque técnicamente un detalle de la implementación, puede ser muy útil saber cómo la `cordova.file.*` mapa de propiedades en trazados físicos en un dispositivo real.

### iOS diseño de sistema de archivo

| Ruta de dispositivo                            | `Cordova.file.*`            | `iosExtraFileSystems` | ¿r/w? | ¿persistente? |  OS despeja   | sincronización | privado |
|:---------------------------------------------- |:--------------------------- |:--------------------- |:-----:|:-------------:|:-------------:|:--------------:|:-------:|
| `/ var/mobile/Applications/< UUID > /`   | applicationStorageDirectory | -                     |   r   |     N / A     |     N / A     |     N / A      |   Sí    |
| &nbsp;&nbsp;&nbsp;`appname.app/`               | applicationDirectory        | Bundle                |   r   |     N / A     |     N / A     |     N / A      |   Sí    |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`www/`     | -                           | -                     |   r   |     N / A     |     N / A     |     N / A      |   Sí    |
| &nbsp;&nbsp;&nbsp;`Documents/`                 | documentsDirectory          | documentos            |  r/w  |      Sí       |      No       |       Sí       |   Sí    |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`NoCloud/` | -                           | documentos-nosync     |  r/w  |      Sí       |      No       |       No       |   Sí    |
| &nbsp;&nbsp;&nbsp;`Library`                    | -                           | Biblioteca            |  r/w  |      Sí       |      No       |      ¿Sí?      |   Sí    |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`NoCloud/` | dataDirectory               | Biblioteca-nosync     |  r/w  |      Sí       |      No       |       No       |   Sí    |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`Cloud/`   | syncedDataDirectory         | -                     |  r/w  |      Sí       |      No       |       Sí       |   Sí    |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`Caches/`  | cacheDirectory              | caché                 |  r/w  |     Sí *      | Yes**\* |       No       |   Sí    |
| &nbsp;&nbsp;&nbsp;`tmp/`                       | tempDirectory               | -                     |  r/w  |   No**    | Yes**\* |       No       |   Sí    |

\ * Archivos persisten a través de reinicios de aplicación y actualizaciones, pero este directorio puede ser despejó cuando el OS deseos. Su aplicación debe ser capaz de recrear cualquier contenido que puede ser eliminado.

** Archivos puede persistir a través de la aplicación se reinicia, pero no confiar en este comportamiento. Los archivos no se garantizan que persisten a través de actualizaciones. Su aplicación debe eliminar los archivos de este directorio cuando es aplicable, como el sistema operativo no garantiza cuando (o incluso si) estos archivos se quitan.

**\ * OS la puede borrar el contenido de este directorio siempre que se siente es necesario, pero no dependen de esto. Debe borrar este directorio según sea apropiado para su aplicación.

### Disposición del sistema Android File

| Ruta de dispositivo                              | `Cordova.file.*`                    | `AndroidExtraFileSystems` | ¿r/w? | ¿persistente? | OS despeja | privado |
|:------------------------------------------------ |:----------------------------------- |:------------------------- |:-----:|:-------------:|:----------:|:-------:|
| `File:///android_asset/`                         | applicationDirectory                |                           |   r   |     N / A     |   N / A    |   Sí    |
| `/Data/data/< id de aplicación > /`        | applicationStorageDirectory         | -                         |  r/w  |     N / A     |   N / A    |   Sí    |
| &nbsp;&nbsp;&nbsp;`cache`                        | cacheDirectory                      | caché                     |  r/w  |      Sí       |  Sí \ *   |   Sí    |
| &nbsp;&nbsp;&nbsp;`files`                        | dataDirectory                       | archivos                  |  r/w  |      Sí       |     No     |   Sí    |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`Documents`  |                                     | documentos                |  r/w  |      Sí       |     No     |   Sí    |
| `< sdcard > /`                             | externalRootDirectory               | sdcard                    |  r/w  |      Sí       |     No     |   No    |
| &nbsp;&nbsp;&nbsp;`Android/data/<app-id>/` | externalApplicationStorageDirectory | -                         |  r/w  |      Sí       |     No     |   No    |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`cache`      | externalCacheDirectry               | caché-externo             |  r/w  |      Sí       |  No**  |   No    |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`files`      | externalDataDirectory               | archivos externos         |  r/w  |      Sí       |     No     |   No    |

\ * El sistema operativo periódicamente puede borrar este directorio, pero no confiar en este comportamiento. Borrar el contenido de este directorio según sea apropiado para su aplicación. El contenido de este directorio debe un usuario purga la caché manualmente, se eliminan.

** El sistema operativo no borrar este directorio automáticamente; usted es responsable de administrar el contenido usted mismo. Deberá el usuario purga la caché manualmente, se extraen los contenidos del directorio.

**Nota**: Si no se puede montar de almacenamiento externo, el `cordova.file.external*` Propiedades`null`.

### Disposición del sistema blackBerry 10 archivo

| Ruta de dispositivo                                           | `Cordova.file.*`            | ¿r/w? | ¿persistente? | OS despeja | privado |
|:------------------------------------------------------------- |:--------------------------- |:-----:|:-------------:|:----------:|:-------:|
| `File:///accounts/1000/AppData/ < id de aplicación > /` | applicationStorageDirectory |   r   |     N / A     |   N / A    |   Sí    |
| &nbsp;&nbsp;&nbsp;`app/native`                                | applicationDirectory        |   r   |     N / A     |   N / A    |   Sí    |
| &nbsp;&nbsp;&nbsp;`data/webviews/webfs/temporary/local__0`    | cacheDirectory              |  r/w  |      No       |     Sí     |   Sí    |
| &nbsp;&nbsp;&nbsp;`data/webviews/webfs/persistent/local__0`   | dataDirectory               |  r/w  |      Sí       |     No     |   Sí    |
| `File:///accounts/1000/Removable/sdcard`                      | externalRemovableDirectory  |  r/w  |      Sí       |     No     |   No    |
| `File:///accounts/1000/shared`                                | sharedDirectory             |  r/w  |      Sí       |     No     |   No    |

*Nota*: cuando se implementa la aplicación al trabajo de perímetro, todos los caminos son relativos a /accounts/1000-enterprise.

## Rarezas Android

### Ubicación de almacenamiento persistente Android

Hay múltiples ubicaciones válidas para almacenar archivos persistentes en un dispositivo Android. Vea [esta página](http://developer.android.com/guide/topics/data/data-storage.html) para una extensa discusión de las distintas posibilidades.

Las versiones anteriores del plugin elegiría la ubicación de los archivos temporales y persistentes en el arranque, basado en si el dispositivo afirmó que fue montado en la tarjeta SD (o partición de almacenamiento equivalente). Si fue montada en la tarjeta SD, o una partición de gran almacenamiento interno estaba disponible (como en dispositivos de Nexus,) y luego los archivos persistentes se almacenaría en la raíz de ese espacio. Esto significaba que todas las apps Cordova podían ver todos los archivos disponibles en la tarjeta.

Si la tarjeta SD no estaba disponible, entonces versiones anteriores podría almacenar datos debajo de `/data/data/<packageId>` , que aísla las apps del otro, pero puede todavía causa datos para ser compartido entre los usuarios.

Ahora es posible elegir si desea almacenar archivos en la ubicación de almacenamiento del archivo interno, o usando la lógica anterior, con una preferencia en de la aplicación `config.xml` archivo. Para ello, añada una de estas dos líneas a `config.xml` :

    <preference name="AndroidPersistentFileLocation" value="Internal" />
    
    <preference name="AndroidPersistentFileLocation" value="Compatibility" />
    

Sin esta línea, se utilizará el archivo plugin `Compatibility` como valor predeterminado. Si una etiqueta de preferencia está presente y no es uno de estos valores, no se iniciará la aplicación.

Si su solicitud se ha enviado previamente a los usuarios, usando un mayor (1.0 pre) versión de este plugin y archivos almacenados en el sistema de ficheros persistente, entonces debería establecer la preferencia en `Compatibility` . Cambiar la ubicación para "Internal" significa que los usuarios existentes que actualización su aplicación pueden ser incapaces de acceder a sus archivos previamente almacenadas, dependiendo de su dispositivo.

Si su solicitud es nuevo, o nunca antes ha almacenado archivos en el sistema de ficheros persistente, entonces el `Internal` generalmente se recomienda el ajuste.

### Operaciones recursivas lento para /android_asset

Listado de directorios activos es realmente lento en Android. Usted puede acelerar hacia arriba, agregando `src/android/build-extras.gradle` a la raíz de tu proyecto android (también requiere de cordova-android@4.0.0 o mayor).

## iOS rarezas

  * `cordova.file.applicationStorageDirectory`es de sólo lectura; intentar almacenar archivos en el directorio raíz fallará. Utilice uno de los `cordova.file.*` las propiedades definidas para iOS (sólo `applicationDirectory` y `applicationStorageDirectory` son de sólo lectura).
  * `FileReader.readAsText(blob, encoding)` 
      * El `encoding` no se admite el parámetro, y codificación UTF-8 es siempre en efecto.

### iOS ubicación de almacenamiento persistente

Hay dos ubicaciones válidas para almacenar archivos persistentes en un dispositivo iOS: el directorio de documentos y el directorio de biblioteca. Las versiones anteriores del plugin sólo almacenan archivos persistentes en el directorio de documentos. Esto tenía el efecto secundario de todos los archivos de la aplicación haciendo visible en iTunes, que era a menudo involuntarios, especialmente para aplicaciones que manejan gran cantidad de archivos pequeños, en lugar de producir documentos completos para la exportación, que es la finalidad del directorio.

Ahora es posible elegir si desea almacenar archivos en los documentos o directorio de bibliotecas, con preferencia en de la aplicación `config.xml` archivo. Para ello, añada una de estas dos líneas a `config.xml` :

    <preference name="iosPersistentFileLocation" value="Library" />
    
    <preference name="iosPersistentFileLocation" value="Compatibility" />
    

Sin esta línea, se utilizará el archivo plugin `Compatibility` como valor predeterminado. Si una etiqueta de preferencia está presente y no es uno de estos valores, no se iniciará la aplicación.

Si su solicitud se ha enviado previamente a los usuarios, usando un mayor (1.0 pre) versión de este plugin y archivos almacenados en el sistema de ficheros persistente, entonces debería establecer la preferencia en `Compatibility` . Cambiar la ubicación de `Library` significa que los usuarios existentes que actualización su aplicación sería incapaces de acceder a sus archivos previamente almacenadas.

Si su solicitud es nuevo, o nunca antes ha almacenado archivos en el sistema de ficheros persistente, entonces el `Library` generalmente se recomienda el ajuste.

## Firefox OS rarezas

La API de sistema de archivo de forma nativa no es compatible con Firefox OS y se implementa como una cuña en la parte superior indexedDB.

  * No falla cuando eliminar directorios no vacía
  * No admite metadatos para directorios
  * Los métodos `copyTo` y `moveTo` no son compatibles con directorios

Se admiten las siguientes rutas de datos: * `applicationDirectory` -usa `xhr` para obtener los archivos locales que están envasados con la aplicación. * `dataDirectory` - Para archivos de datos específicos de aplicación persistente. * `cacheDirectory` -En caché archivos que deben sobrevivir se reinicia la aplicación (aplicaciones no deben confiar en el sistema operativo para eliminar archivos aquí).

## Navegador rarezas

### Rarezas y observaciones comunes

  * Cada navegador utiliza su propio sistema de ficheros un espacio aislado. IE y Firefox utilizan IndexedDB como base. Todos los navegadores utilizan diagonal como separador de directorio en un camino.
  * Las entradas de directorio deben crearse sucesivamente. Por ejemplo, la llamada `fs.root.getDirectory (' dir1/dir2 ', {create:true}, successCallback, errorCallback)` se producirá un error si no existiera dir1.
  * El plugin solicita permiso de usuario para usar almacenamiento persistente en el primer comienzo de la aplicación. 
  * Plugin soporta `cdvfile://localhost` (recursos locales) solamente. Es decir, no se admiten los recursos externos vía `cdvfile`.
  * El plugin no sigue ["Archivo sistema API 8.3 nombrando restricciones"](http://www.w3.org/TR/2011/WD-file-system-api-20110419/#naming-restrictions).
  * BLOB y archivo ' `close` la función no es compatible.
  * `FileSaver` y `BlobBuilder` no son compatibles con este plugin y no tengo recibos.
  * El plugin no es compatible con `requestAllFileSystems`. Esta función también está desaparecida en las especificaciones.
  * No se quitarán las entradas de directorio Si utilizas `create: true` bandera de directorio existente.
  * No se admiten archivos creados mediante el constructor. Debe utilizar método entry.file en su lugar.
  * Cada navegador utiliza su propia forma de blob URL referencias.
  * se admite la función `readAsDataURL`, pero el mediatype en cromo depende de la extensión de nombre de entrada, mediatype en IE siempre está vacío (que es lo mismo como `plain-text` según la especificación), el mediatype en Firefox siempre es `application/octet-stream`. Por ejemplo, si el contenido es `abcdefg` entonces Firefox devuelve `datos: aplicación / octet-stream; base64, YWJjZGVmZw ==`, es decir devuelve `datos:; base64, YWJjZGVmZw ==`, cromo devuelve `datos: < mediatype dependiendo de la extensión de nombre de la entrada >; base64, YWJjZGVmZw ==`.
  * `toInternalURL` devuelve la ruta de la forma `file:///persistent/path/to/entry` (Firefox, IE). Cromo devuelve la ruta de acceso en el formulario `cdvfile://localhost/persistent/file`.

### Rarezas de Chrome

  * Filesystem de Chrome no es inmediatamente después de evento ready dispositivo. Como solución temporal puede suscribirse al evento `filePluginIsReady`. Ejemplo: 

```javascript
window.addEventListener('filePluginIsReady', function(){ console.log('File plugin is ready');}, false);
```

Puede utilizar la función `window.isFilePluginReadyRaised` para verificar si ya se provoca el evento. -window.requestFileSystem temporal y persistente filesystem cuotas no están limitadas en cromo. -Para aumentar el almacenamiento persistente en cromo necesitas llamar el método `window.initPersistentFileSystem`. Cuota de almacenamiento persistente es de 5 MB por defecto. -Chrome requiere `--permitir-archivo-acceso-de-archivos` ejecutar argumento al soporte API mediante protocolo `file:///`. -`Archivo` objeto no cambiará si utilizas bandera `{create:true}` cuando una `entrada` de existente. -eventos `cancelable` propiedad está establecida en true en cromo. Esto es contrario a la [Especificación](http://dev.w3.org/2009/dap/file-system/file-writer.html). -función de `toURL` en Chrome devuelve `filesystem:`-prefijo camino dependiendo de host de la aplicación. Por ejemplo, `filesystem:file:///persistent/somefile.txt`, `filesystem:http://localhost:8080/persistent/somefile.txt`. -resultado de la función de `toURL` no contiene barra en caso de entrada en el directorio. Cromo resuelve directorios con urls slash-siguió correctamente sin embargo. -método `resolveLocalFileSystemURL` requiere la entrantes `url` que tienen prefijo `filesystem`. Por ejemplo, el parámetro de `url` para `resolveLocalFileSystemURL` debería estar en la forma `filesystem:file:///persistent/somefile.txt` en comparación con la forma `file:///persistent/somefile.txt` en Android. -Obsoleto `toNativeURL` función no es compatible y no tiene un trozo. -función de `setMetadata` no es indicada en las especificaciones y no admite. -INVALID_MODIFICATION_ERR (código: 9) se lanza en lugar de SYNTAX_ERR(code: 8) a petición de un sistema de ficheros inexistentes. -INVALID_MODIFICATION_ERR (código: 9) se lanza en vez de PATH_EXISTS_ERR(code: 12) en intentar exclusivamente crear un archivo o directorio, que ya existe. -INVALID_MODIFICATION_ERR (código: 9) se lanza en lugar de NO_MODIFICATION_ALLOWED_ERR(code: 6) para tratar de llamar a removeRecursively en el sistema de archivos raíz. -INVALID_MODIFICATION_ERR (código: 9) se lanza en vez de NOT_FOUND_ERR(code: 1) en tratar de moveTo directorio que no existe.

### Impl base IndexedDB rarezas (IE y Firefox)

  * `.` y `..` no son compatibles.
  * IE no soporta `file:///`-modo; modo alojado sólo es compatible (http://localhost:xxxx).
  * Tamaño del sistema de archivos de Firefox no es limitada pero cada extensión de 50 MB solicitará un permiso de usuario. IE10 permite hasta 10mb de combinados AppCache y IndexedDB utilizados en la implementación del sistema de ficheros sin preguntar, cuando llegas a ese nivel que se le preguntará si desea permitir que ser aumentada hasta un máximo de 250 mb por sitio. Para que `size` parámetro para la función `requestFileSystem` no afecta sistema de ficheros en Firefox y IE.
  * la función `readAsBinaryString` no se indica en las especificaciones y no compatible con IE y no tiene un trozo.
  * `file.type` siempre es null.
  * No debe crear entrada utilizando DirectoryEntry resultado de devolución de llamada de instancia que fue borrado. De lo contrario, obtendrá una entrada' colgar'.
  * Antes de que se puede leer un archivo, el cual fue escrito sólo que necesitas una nueva instancia de este archivo.
  * la función `setMetadata`, que no es indicada en las especificaciones soporta sólo el cambio de campo `modificationTime`. 
  * `copyTo` y `moveTo` funciones no son compatibles con directorios.
  * Metadatos de directorios no es compatible.
  * Tanto Entry.remove y directoryEntry.removeRecursively no fallan al retirar no vacía directorios - directorios de ser eliminados se limpian junto con contenido en su lugar.
  * `abort` y `truncate` las funciones no son compatibles.
  * eventos de progreso no están despedidos. Por ejemplo, este controlador no ejecutará:

```javascript
writer.onprogress = function() { /*commands*/ };
```

## Actualización de notas

En v1.0.0 de este plugin, han cambiado las estructuras `FileEntry` y `DirectoryEntry`, para estar más acorde con las especificaciones publicadas.

Versiones anteriores (pre-1.0.0) del plugin almacenan el dispositivo-absoluto-archivo-ubicación en la propiedad `fullPath` de objetos de `entrada`. Estos caminos típicamente parecería

    /var/mobile/Applications/<application UUID>/Documents/path/to/file  (iOS)
    /storage/emulated/0/path/to/file                                    (Android)
    

Estas rutas también fueron devueltos por el método `toURL()` de los objetos de `entrada`.

Con v1.0.0, el atributo `fullPath` es la ruta del archivo, *relativo a la raíz del sistema de archivos HTML*. Así, los caminos más arriba sería ahora ambos ser representado por un objeto `FileEntry` con un `fullPath` de

    /path/to/file
    

Si su aplicación funciona con dispositivo-absoluto-caminos, y previamente obtenido esos caminos a través de la propiedad `fullPath` de objetos de `Entry`, deberá actualizar el código para utilizar `entry.toURL()` en su lugar.

Para atrás compatibilidad, el método `resolveLocalFileSystemURL()` a aceptar un dispositivo-absoluto-trayectoria y devolverá un objeto de `Entry` correspondiente que, mientras exista ese archivo dentro de los sistemas de ficheros `TEMPORARY` o la `PERSISTENT`.

Esto ha sido particularmente un problema con el plugin de transferencia de archivos, que anteriormente utilizado dispositivo-absoluto-caminos (y todavía puede aceptarlas). Ha sido actualizado para funcionar correctamente con sistema de ficheros URLs, para reemplazar `entry.fullPath` con `entry.toURL()` debe resolver cualquier problema conseguir ese plugin para trabajar con archivos en el dispositivo.

En v1.1.0 el valor devuelto por `toURL()` fue cambiado (consulte \[CB-6394\] (https://issues.apache.org/jira/browse/CB-6394)) para devolver una dirección URL absoluta 'file://'. siempre que sea posible. Para asegurar una ' cdvfile:'-URL ahora puede utilizar `toInternalURL()`. Este método devolverá ahora filesystem URLs de la forma

    cdvfile://localhost/persistent/path/to/file
    

que puede utilizarse para identificar el archivo únicamente.

## Lista de códigos de Error y significados

Cuando se produce un error, uno de los siguientes códigos se utilizará.

| Código | Constante                     |
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

## Configurando el Plugin (opcional)

El conjunto de los sistemas de ficheros disponibles puede ser configurado por plataforma. Tanto iOS y Android reconocen un <preference> etiqueta en el `archivo config.xml` que nombra a los sistemas de archivos para ser instalado. De forma predeterminada, se activan todas las raíces del sistema de archivos.

    <preference name="iosExtraFilesystems" value="library,library-nosync,documents,documents-nosync,cache,bundle,root" />
    <preference name="AndroidExtraFilesystems" value="files,files-external,documents,sdcard,cache,cache-external,root" />
    

### Android

  * `files`: directorio de almacenamiento de archivo interno de la aplicación
  * `files-external`: directorio de almacenamiento de archivo externo de la aplicación
  * `sdcard`: el directorio de almacenamiento de archivo externo global (esta es la raíz de la tarjeta SD, si uno está instalado). Debe tener el permiso de `android.permission.WRITE_EXTERNAL_STORAGE` a usar esto.
  * `cache`: directorio de memoria caché interna de la aplicación
  * `cache-external`: directorio de caché externo de la aplicación
  * `root`: el sistema de archivos de todo el dispositivo

Android también es compatible con un sistema de archivos especial llamado "documents", que representa un subdirectorio "/Documents/" dentro del sistema de archivos "archivos".

### iOS

  * `library`: directorio de bibliotecas de la aplicación
  * `documents`: directorio de documentos de la aplicación
  * `cache`: directorio de caché de la aplicación
  * `bundle`: paquete de la aplicación; la ubicación de la aplicación en sí mismo en el disco (sólo lectura)
  * `root`: el sistema de archivos de todo el dispositivo

De forma predeterminada, los directorios de documentos y la biblioteca pueden ser sincronizados con iCloud. También puede solicitar dos sistemas adicionales, `library-nosync` y `documents-nosync`, que representan un directorio especial no sincronizados dentro de la `/Library` o sistema de ficheros `/Documents`.