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

Este plugin implementa una API de archivo que permite acceso de lectura/escritura a los archivos que residen en el dispositivo.

Este plugin se basa en varias especificaciones, incluyendo: el HTML5 archivo API <http://www.w3.org/TR/FileAPI/>

Los directorios (ahora extinto) y sistema de extensiones más recientes: <http://www.w3.org/TR/2012/WD-file-system-api-20120417/> aunque la mayor parte del código del plugin fue escrito cuando una especificación anterior era actual: <http://www.w3.org/TR/2011/WD-file-system-api-20110419/>

También implementa la especificación de FileWriter: <http://dev.w3.org/2009/dap/file-system/file-writer.html>

Para el uso, por favor, consulte 'HTML5 Rocks excelente [FileSystem artículo.][1]

 [1]: http://www.html5rocks.com/en/tutorials/file/filesystem/

Para tener una visión general de otras opciones de almacenamiento, consulte [Guía de almacenamiento Cordova][2].

 [2]: http://cordova.apache.org/docs/en/edge/cordova_storage_storage.md.html

## Instalación

    cordova plugin add org.apache.cordova.file
    

## Plataformas soportadas

*   Amazon fuego OS
*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 y 8 *
*   Windows 8 *

* *No son compatibles con estas plataformas `FileReader.readAsArrayBuffer` ni `FileWriter.write(blob)` .*

## Donde almacenar los archivos

A partir de v1.2.0, URLs a directorios de sistema de archivos importantes son proporcionadas. Cada dirección URL está en la forma *file:///path/to/spot/*y se puede convertir en un `DirectoryEntry` usando`window.resolveLocalFileSystemURL()`.

*   `cordova.file.applicationDirectory`-Directorio Read-only donde está instalada la aplicación. (*iOS*, *Android*, *BlackBerry 10*)

*   `cordova.file.applicationStorageDirectory`-Directorio del entorno limitado de la aplicación; en iOS esta ubicación es de sólo lectura (pero subdirectorios específicos [como `/Documents` ] son de lectura y escritura). Todos los datos contenidos dentro es privado para la aplicación. ( *iOS*, *Android*, *BlackBerry 10*)

*   `cordova.file.dataDirectory`-Almacenamiento de datos persistente y privadas dentro de entorno limitado de la aplicación utilizando la memoria interna (en Android, si necesitas usar memoria externa, use `.externalDataDirectory` ). En iOS, este directorio no está sincronizado con iCloud (utilice `.syncedDataDirectory` ). (*iOS*, *Android*, *BlackBerry 10*)

*   `cordova.file.cacheDirectory`-Directorio para los archivos de datos almacenados en caché o los archivos que su aplicación puede volver a crear fácilmente. El sistema operativo puede borrar estos archivos cuando el dispositivo se agota en almacenamiento de información, sin embargo, aplicaciones no deben confiar en el sistema operativo para eliminar los archivos de aquí. (*iOS*, *Android*, *BlackBerry 10*)

*   `cordova.file.externalApplicationStorageDirectory`-Espacio aplicación de almacenamiento externo. (*Android*)

*   `cordova.file.externalDataDirectory`¿Dónde poner los archivos de datos específicos de la aplicación de almacenamiento externo. (*Android*)

*   `cordova.file.externalCacheDirectory`-Caché aplicación de almacenamiento externo. (*Android*)

*   `cordova.file.externalRootDirectory`-Raíz de almacenamiento externo (tarjeta SD). (*Android*, *BlackBerry 10*)

*   `cordova.file.tempDirectory`-Directorio temporal que puede borrar el sistema operativo en sí. No confíe en el sistema operativo para borrar este directorio; su aplicación siempre debe eliminar archivos según corresponda. (*iOS*)

*   `cordova.file.syncedDataDirectory`-Contiene los archivos de la aplicación específica que deben ser sincronizados (e.g. a iCloud). (*iOS*)

*   `cordova.file.documentsDirectory`-Archivos privados a la aplicación, pero que son significativos para otra aplicación (por ejemplo archivos de Office). (*iOS*)

*   `cordova.file.sharedDirectory`-Archivos disponibles globalmente para todas las aplicaciones (*BlackBerry 10*)

## Diseños de sistema de archivo

Aunque técnicamente un detalle de la implementación, puede ser muy útil saber cómo la `cordova.file.*` mapa de propiedades en trazados físicos en un dispositivo real.

### iOS diseño de sistema de archivo

| Ruta de dispositivo                          | `Cordova.file.*`            | `iosExtraFileSystems` | ¿r/w? | ¿persistente? | OS despeja | sincronización | privado |
|:-------------------------------------------- |:--------------------------- |:--------------------- |:-----:|:-------------:|:----------:|:--------------:|:-------:|
| `/ var/mobile/Applications/< UUID > /` | applicationStorageDirectory | -                     |  r/o  |     N / A     |   N / A    |     N / A      |   Sí    |
|    `appname.app/`                            | applicationDirectory        | Bundle                |  r/o  |     N / A     |   N / A    |     N / A      |   Sí    |
|       `www/`                                 | -                           | -                     |  r/o  |     N / A     |   N / A    |     N / A      |   Sí    |
|    `Documents/`                              | documentsDirectory          | documentos            |  r/w  |      Sí       |     No     |       Sí       |   Sí    |
|       `NoCloud/`                             | -                           | documentos-nosync     |  r/w  |      Sí       |     No     |       No       |   Sí    |
|    `Library`                                 | -                           | Biblioteca            |  r/w  |      Sí       |     No     |      ¿Sí?      |   Sí    |
|       `NoCloud/`                             | dataDirectory               | Biblioteca-nosync     |  r/w  |      Sí       |     No     |       No       |   Sí    |
|       `Cloud/`                               | syncedDataDirectory         | -                     |  r/w  |      Sí       |     No     |       Sí       |   Sí    |
|       `Caches/`                              | cacheDirectory              | caché                 |  r/w  |     Sí *      | Si \* * *| |       No       |   Sí    |
|    `tmp/`                                    | tempDirectory               | -                     |  r/w  |    No * *     | Si \* * *| |       No       |   Sí    |

* Archivos persisten a través de la aplicación se reinicia y actualizaciones, pero este directorio puede ser despejó cuando el OS desea. Su aplicación debe ser capaz de recrear cualquier contenido que puede ser eliminado.

* * Archivos pueden persistir a través de la aplicación se reinicia, pero no confiar en este comportamiento. Los archivos no se garantizan que persisten a través de actualizaciones. Su aplicación debe eliminar los archivos de este directorio cuando es aplicable, como el sistema operativo no garantiza cuando (o incluso si) estos archivos se quitan.

\* * *| OS la puede borrar el contenido de este directorio cuando se siente que es necesario, pero no dependen de éste. Debe borrar este directorio según sea apropiado para su aplicación.

### Disposición del sistema Android File

| Ruta de dispositivo                       | `Cordova.file.*`                    | `AndroidExtraFileSystems` | ¿r/w? | ¿persistente? | OS despeja | privado |
|:----------------------------------------- |:----------------------------------- |:------------------------- |:-----:|:-------------:|:----------:|:-------:|
| `File:///android_asset/`                  | applicationDirectory                |                           |  r/o  |     N / A     |   N / A    |   Sí    |
| `/Data/data/< id de aplicación > /` | applicationStorageDirectory         | -                         |  r/w  |     N / A     |   N / A    |   Sí    |
|    `cache`                                | cacheDirectory                      | caché                     |  r/w  |      Sí       |    Sí *    |   Sí    |
|    `files`                                | dataDirectory                       | archivos                  |  r/w  |      Sí       |     No     |   Sí    |
|       `Documents`                         |                                     | documentos                |  r/w  |      Sí       |     No     |   Sí    |
| `< sdcard > /`                      | externalRootDirectory               | sdcard                    |  r/w  |      Sí       |     No     |   No    |
|    `Android/data/<app-id>/`         | externalApplicationStorageDirectory | -                         |  r/w  |      Sí       |     No     |   No    |
|       `cache`                             | externalCacheDirectry               | caché-externo             |  r/w  |      Sí       |   No * *   |   No    |
|       `files`                             | externalDataDirectory               | archivos externos         |  r/w  |      Sí       |     No     |   No    |

* El sistema operativo puede eliminar periódicamente este directorio, pero no dependen de este comportamiento. Borrar el contenido de este directorio según sea apropiado para su aplicación. El contenido de este directorio debe un usuario purga la caché manualmente, se eliminan.

* * El sistema operativo no borra este directorio automáticamente; Usted es responsable de administrar el contenido mismo. Deberá el usuario purga la caché manualmente, se extraen los contenidos del directorio.

**Nota**: Si no se puede montar de almacenamiento externo, el `cordova.file.external*` Propiedades`null`.

### Disposición del sistema blackBerry 10 archivo

| Ruta de dispositivo                                           | `Cordova.file.*`            | ¿r/w? | ¿persistente? | OS despeja | privado |
|:------------------------------------------------------------- |:--------------------------- |:-----:|:-------------:|:----------:|:-------:|
| `File:///accounts/1000/AppData/ < id de aplicación > /` | applicationStorageDirectory |  r/o  |     N / A     |   N / A    |   Sí    |
|    `app/native`                                               | applicationDirectory        |  r/o  |     N / A     |   N / A    |   Sí    |
|    `data/webviews/webfs/temporary/local__0`                   | cacheDirectory              |  r/w  |      No       |     Sí     |   Sí    |
|    `data/webviews/webfs/persistent/local__0`                  | dataDirectory               |  r/w  |      Sí       |     No     |   Sí    |
| `File:///accounts/1000/Removable/sdcard`                      | externalRemovableDirectory  |  r/w  |      Sí       |     No     |   No    |
| `File:///accounts/1000/shared`                                | sharedDirectory             |  r/w  |      Sí       |     No     |   No    |

*Nota*: cuando se implementa la aplicación al trabajo de perímetro, todos los caminos son relativos a /accounts/1000-enterprise.

## Rarezas Android

### Ubicación de almacenamiento persistente Android

Hay múltiples ubicaciones válidas para almacenar archivos persistentes en un dispositivo Android. Vea [esta página][3] para una extensa discusión de las distintas posibilidades.

 [3]: http://developer.android.com/guide/topics/data/data-storage.html

Las versiones anteriores del plugin elegiría la ubicación de los archivos temporales y persistentes en el arranque, basado en si el dispositivo afirmó que fue montado en la tarjeta SD (o partición de almacenamiento equivalente). Si fue montada en la tarjeta SD, o una partición de gran almacenamiento interno estaba disponible (como en dispositivos de Nexus,) y luego los archivos persistentes se almacenaría en la raíz de ese espacio. Esto significaba que todas las apps Cordova podían ver todos los archivos disponibles en la tarjeta.

Si la tarjeta SD no estaba disponible, entonces versiones anteriores podría almacenar datos debajo de `/data/data/<packageId>` , que aísla las apps del otro, pero puede todavía causa datos para ser compartido entre los usuarios.

Ahora es posible elegir si desea almacenar archivos en la ubicación de almacenamiento del archivo interno, o usando la lógica anterior, con una preferencia en de la aplicación `config.xml` archivo. Para ello, añada una de estas dos líneas a `config.xml` :

    <preference name="AndroidPersistentFileLocation" value="Internal" />
    
    <preference name="AndroidPersistentFileLocation" value="Compatibility" />
    

Sin esta línea, se utilizará el archivo plugin `Compatibility` como valor predeterminado. Si una etiqueta de preferencia está presente y no es uno de estos valores, no se iniciará la aplicación.

Si su solicitud se ha enviado previamente a los usuarios, mediante una mayor (1.0 pre) versión de este plugin y archivos almacenados en el sistema de ficheros persistente, entonces debería establecer la preferencia en `Compatibility` . Cambiar la ubicación para "Internal" significa que los usuarios existentes que actualización su aplicación pueden ser incapaces de acceder a sus archivos previamente almacenadas, dependiendo de su dispositivo.

Si su solicitud es nuevo, o nunca antes ha almacenado archivos en el sistema de ficheros persistente, entonces el `Internal` generalmente se recomienda el ajuste.

## iOS rarezas

*   `cordova.file.applicationStorageDirectory`es de sólo lectura; intentar almacenar archivos en el directorio raíz fallará. Utilice uno de los `cordova.file.*` las propiedades definidas para iOS (sólo `applicationDirectory` y `applicationStorageDirectory` son de sólo lectura).
*   `FileReader.readAsText(blob, encoding)` 
    *   El `encoding` no se admite el parámetro, y codificación UTF-8 es siempre en efecto.

### iOS ubicación de almacenamiento persistente

Hay dos ubicaciones válidas para almacenar archivos persistentes en un dispositivo iOS: el directorio de documentos y el directorio de biblioteca. Las versiones anteriores del plugin sólo almacenan archivos persistentes en el directorio de documentos. Esto tenía el efecto secundario de todos los archivos de la aplicación haciendo visible en iTunes, que era a menudo involuntarios, especialmente para aplicaciones que manejan gran cantidad de archivos pequeños, en lugar de producir documentos completos para la exportación, que es la finalidad del directorio.

Ahora es posible elegir si desea almacenar archivos en los documentos o directorio de bibliotecas, con preferencia en de la aplicación `config.xml` archivo. Para ello, añada una de estas dos líneas a `config.xml` :

    <preference name="iosPersistentFileLocation" value="Library" />
    
    <preference name="iosPersistentFileLocation" value="Compatibility" />
    

Sin esta línea, se utilizará el archivo plugin `Compatibility` como valor predeterminado. Si una etiqueta de preferencia está presente y no es uno de estos valores, no se iniciará la aplicación.

Si su solicitud se ha enviado previamente a los usuarios, mediante una mayor (1.0 pre) versión de este plugin y archivos almacenados en el sistema de ficheros persistente, entonces debería establecer la preferencia en `Compatibility` . Cambiar la ubicación de `Library` significa que los usuarios existentes que actualización su aplicación sería incapaces de acceder a sus archivos previamente almacenadas.

Si su solicitud es nuevo, o nunca antes ha almacenado archivos en el sistema de ficheros persistente, entonces el `Library` generalmente se recomienda el ajuste.

## Firefox OS rarezas

La API de sistema de archivo de forma nativa no es compatible con Firefox OS y se implementa como una cuña en la parte superior indexedDB.

*   No falla cuando eliminar directorios no vacía
*   No admite metadatos para directorios
*   Los métodos `copyTo` y `moveTo` no son compatibles con directorios

Se admiten las siguientes rutas de datos: * `applicationDirectory` -usa `xhr` para obtener los archivos locales que están envasados con la aplicación. * `dataDirectory` - Para archivos de datos específicos de aplicación persistente. * `cacheDirectory` -En caché archivos que deben sobrevivir se reinicia la aplicación (aplicaciones no deben confiar en el sistema operativo para eliminar archivos aquí).

## Actualización de notas

En v1.0.0 de este plugin, la `FileEntry` y `DirectoryEntry` han cambiado las estructuras, para estar más acorde con las especificaciones publicadas.

Versiones anteriores (pre-1.0.0) del plugin almacenan el dispositivo-absoluto-archivo-ubicación en la `fullPath` propiedad de `Entry` objetos. Estos caminos típicamente parecería

    /var/mobile/Applications/<application UUID>/Documents/path/to/file  (iOS)
    /storage/emulated/0/path/to/file                                    (Android)
    

Estas rutas también fueron devueltos por el `toURL()` método de la `Entry` objetos.

Con v1.0.0, la `fullPath` es la ruta del archivo, *relativo a la raíz del sistema de archivos HTML*. Así, los caminos anteriores que ahora ambos ser representado por un `FileEntry` objeto con un `fullPath` de

    /path/to/file
    

Si su aplicación funciona con dispositivo-absoluto-caminos, y previamente obtenido esos caminos a través de la `fullPath` propiedad de `Entry` objetos, entonces debe actualizar su código para utilizar `entry.toURL()` en su lugar.

Para atrás compatibilidad, el `resolveLocalFileSystemURL()` método aceptará un dispositivo-absoluto-trayectoria y volverá un `Entry` objeto correspondiente, mientras exista ese archivo dentro o el `TEMPORARY` o `PERSISTENT` filesystems.

Esto ha sido particularmente un problema con el plugin de transferencia de archivos, que anteriormente utilizado dispositivo-absoluto-caminos (y todavía puede aceptarlas). Se ha actualizado para que funcione correctamente con las URLs de FileSystem, reemplazando así `entry.fullPath` con `entry.toURL()` debe resolver cualquier problema conseguir ese plugin para trabajar con archivos en el dispositivo.

En v1.1.0 el valor devuelto de `toURL()` fue cambiado (véase \[CB-6394\] (https://issues.apache.org/jira/browse/CB-6394)) para devolver una dirección URL absoluta 'file://'. siempre que sea posible. Para asegurar una ' cdvfile:'-URL puede usar `toInternalURL()` ahora. Este método devolverá ahora filesystem URLs de la forma

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

El conjunto de los sistemas de ficheros disponibles puede ser configurado por plataforma. Tanto iOS y Android reconocen un <preference> etiqueta en `config.xml` que nombra a los sistemas de archivos para ser instalado. De forma predeterminada, se activan todas las raíces del sistema de archivos.

    <preference name="iosExtraFilesystems" value="library,library-nosync,documents,documents-nosync,cache,bundle,root" />
    <preference name="AndroidExtraFilesystems" value="files,files-external,documents,sdcard,cache,cache-external,root" />
    

### Android

*   `files`: Directorio de almacenamiento de archivos internos de la aplicación
*   `files-external`: Directorio de almacenamiento del la aplicación archivo externo
*   `sdcard`: El directorio de almacenamiento de archivo externo global (esta es la raíz de la tarjeta SD, si uno está instalado). Debes tener el `android.permission.WRITE_EXTERNAL_STORAGE` permiso para usar esto.
*   `cache`: Directorio de la aplicación la memoria caché interna
*   `cache-external`: Directorio de caché externo de la aplicación
*   `root`: El sistema de archivos de todo el dispositivo

Android también es compatible con un sistema de archivos especial llamado "documentos", que representa un subdirectorio "/ documentos /" dentro del sistema de archivos "archivos".

### iOS

*   `library`: Directorio de la aplicación la biblioteca
*   `documents`: Directorio de documentos de la solicitud
*   `cache`: Directorio de caché de la aplicación la
*   `bundle`: Paquete la aplicación; la ubicación de la aplicación en sí mismo en el disco (sólo lectura)
*   `root`: El sistema de archivos de todo el dispositivo

De forma predeterminada, los directorios de documentos y la biblioteca pueden ser sincronizados con iCloud. También puede solicitar dos sistemas de archivos adicionales, `library-nosync` y `documents-nosync` , que representa un directorio especial no sincronizados dentro de la `/Library` o `/Documents` sistema de ficheros.