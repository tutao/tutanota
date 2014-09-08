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

# org.apache.cordova.file-transfer

Этот плагин позволяет вам загружать и скачивать файлы.

## Установка

    cordova plugin add org.apache.cordova.file-transfer
    

## Поддерживаемые платформы

*   Amazon Fire ОС
*   Android
*   BlackBerry 10
*   Firefox OS **
*   iOS
*   Windows Phone 7 и 8 *
*   Windows 8 *

* *Не поддерживают `onprogress` , ни `abort()` *

** *Не поддерживает `onprogress` *

# FileTransfer

`FileTransfer`Объект предоставляет способ для загрузки файлов с помощью нескольких частей запроса POST HTTP и для загрузки файлов, а также.

## Свойства

*   **OnProgress**: называется с `ProgressEvent` всякий раз, когда новый фрагмент данных передается. *(Функция)*

## Методы

*   **добавлено**: отправляет файл на сервер.

*   **скачать**: Скачать файл с сервера.

*   **прервать**: прерывает передачу в прогресс.

## загрузить

**Параметры**:

*   **fileURL**: файловой системы URL-адрес, представляющий файл на устройстве. Для обратной совместимости, это также может быть полный путь к файлу на устройстве. (См. [обратной совместимости отмечает] ниже)

*   **сервер**: URL-адрес сервера, чтобы получить файл, как закодированные`encodeURI()`.

*   **successCallback**: обратного вызова, передаваемого `Metadata` объект. *(Функция)*

*   **errorCallback**: обратного вызова, который выполняется в случае получения ошибки `Metadata` . Вызываемый с `FileTransferError` объект. *(Функция)*

*   **опции**: необязательные параметры *(объект)*. Допустимые ключи:
    
    *   **fileKey**: имя элемента form. По умолчанию `file` . (DOMString)
    *   **имя файла**: имя файла для использования при сохранении файла на сервере. По умолчанию `image.jpg` . (DOMString)
    *   **mimeType**: mime-тип данных для загрузки. По умолчанию `image/jpeg` . (DOMString)
    *   **params**: набор пар дополнительный ключ/значение для передачи в HTTP-запросе. (Объект)
    *   **chunkedMode**: следует ли загружать данные в фрагментарности потоковом режиме. По умолчанию `true` . (Логическое значение)
    *   **заголовки**: Карта значений заголовок имя заголовка. Используйте массив для указания более одного значения. (Объект)

*   **trustAllHosts**: необязательный параметр, по умолчанию `false` . Если значение `true` , она принимает все сертификаты безопасности. Это полезно, поскольку Android отвергает самозаверяющие сертификаты. Не рекомендуется для использования в производстве. Поддерживается на Android и iOS. *(логическое значение)*

### Пример

    // !! Assumes variable fileURL contains a valid URL to a text file on the device,
    //    for example, cdvfile://localhost/persistent/path/to/file.txt
    
    var win = function (r) {
        console.log("Code = " + r.responseCode);
        console.log("Response = " + r.response);
        console.log("Sent = " + r.bytesSent);
    }
    
    var fail = function (error) {
        alert("An error has occurred: Code = " + error.code);
        console.log("upload error source " + error.source);
        console.log("upload error target " + error.target);
    }
    
    var options = new FileUploadOptions();
    options.fileKey = "file";
    options.fileName = fileURL.substr(fileURL.lastIndexOf('/') + 1);
    options.mimeType = "text/plain";
    
    var params = {};
    params.value1 = "test";
    params.value2 = "param";
    
    options.params = params;
    
    var ft = new FileTransfer();
    ft.upload(fileURL, encodeURI("http://some.server.com/upload.php"), win, fail, options);
    

### Пример с загружать заголовки и события Progress (Android и iOS только)

    function win(r) {
        console.log("Code = " + r.responseCode);
        console.log("Response = " + r.response);
        console.log("Sent = " + r.bytesSent);
    }
    
    function fail(error) {
        alert("An error has occurred: Code = " + error.code);
        console.log("upload error source " + error.source);
        console.log("upload error target " + error.target);
    }
    
    var uri = encodeURI("http://some.server.com/upload.php");
    
    var options = new FileUploadOptions();
    options.fileKey="file";
    options.fileName=fileURL.substr(fileURL.lastIndexOf('/')+1);
    options.mimeType="text/plain";
    
    var headers={'headerParam':'headerValue'};
    
    options.headers = headers;
    
    var ft = new FileTransfer();
    ft.onprogress = function(progressEvent) {
        if (progressEvent.lengthComputable) {
          loadingStatus.setPercentage(progressEvent.loaded / progressEvent.total);
        } else {
          loadingStatus.increment();
        }
    };
    ft.upload(fileURL, uri, win, fail, options);
    

## FileUploadResult

A `FileUploadResult` объект передается методу обратного вызова успех `FileTransfer` объекта `upload()` метод.

### Свойства

*   **bytesSent**: количество байт, отправленных на сервер как часть загрузки. (длинная)

*   **responseCode**: код ответа HTTP, возвращаемых сервером. (длинная)

*   **ответ**: ответ HTTP, возвращаемых сервером. (DOMString)

*   **заголовки**: заголовки ответов HTTP-сервером. (Объект)
    
    *   В настоящее время поддерживается только для iOS.

### iOS причуды

*   Не поддерживает `responseCode` или`bytesSent`.

## Скачать

**Параметры**:

*   **источник**: URL-адрес сервера для загрузки файла, как закодированные`encodeURI()`.

*   **Цель**: файловой системы URL-адрес, представляющий файл на устройстве. Для обратной совместимости, это также может быть полный путь к файлу на устройстве. (См. [обратной совместимости отмечает] ниже)

*   **successCallback**: обратного вызова, передаваемого `FileEntry` объект. *(Функция)*

*   **errorCallback**: обратного вызова, который выполняется, если возникает ошибка при получении `Metadata` . Вызываемый с `FileTransferError` объект. *(Функция)*

*   **trustAllHosts**: необязательный параметр, по умолчанию `false` . Если значение `true` , она принимает все сертификаты безопасности. Это полезно, потому что Android отвергает самозаверяющие сертификаты. Не рекомендуется для использования в производстве. Поддерживается на Android и iOS. *(логическое значение)*

*   **опции**: необязательные параметры, в настоящее время только поддерживает заголовки (например авторизации (базовая аутентификация) и т.д.).

### Пример

    // !! Assumes variable fileURL contains a valid URL to a path on the device,
    //    for example, cdvfile://localhost/persistent/path/to/downloads/
    
    var fileTransfer = new FileTransfer();
    var uri = encodeURI("http://some.server.com/download.php");
    
    fileTransfer.download(
        uri,
        fileURL,
        function(entry) {
            console.log("download complete: " + entry.toURL());
        },
        function(error) {
            console.log("download error source " + error.source);
            console.log("download error target " + error.target);
            console.log("upload error code" + error.code);
        },
        false,
        {
            headers: {
                "Authorization": "Basic dGVzdHVzZXJuYW1lOnRlc3RwYXNzd29yZA=="
            }
        }
    );
    

## прервать

Прерывает передачу в прогресс. Onerror обратного вызова передается объект FileTransferError, который имеет код ошибки FileTransferError.ABORT_ERR.

### Пример

    // !! Assumes variable fileURL contains a valid URL to a text file on the device,
    //    for example, cdvfile://localhost/persistent/path/to/file.txt
    
    var win = function(r) {
        console.log("Should not be called.");
    }
    
    var fail = function(error) {
        // error.code == FileTransferError.ABORT_ERR
        alert("An error has occurred: Code = " + error.code);
        console.log("upload error source " + error.source);
        console.log("upload error target " + error.target);
    }
    
    var options = new FileUploadOptions();
    options.fileKey="file";
    options.fileName="myphoto.jpg";
    options.mimeType="image/jpeg";
    
    var ft = new FileTransfer();
    ft.upload(fileURL, encodeURI("http://some.server.com/upload.php"), win, fail, options);
    ft.abort();
    

## FileTransferError

A `FileTransferError` при ошибке обратного вызова передается объект, при возникновении ошибки.

### Свойства

*   **код**: один из кодов стандартных ошибок, перечисленные ниже. (Число)

*   **источник**: URL-адрес источника. (Строка)

*   **Цель**: URL-адрес к целевому объекту. (Строка)

*   **http_status**: код состояния HTTP. Этот атрибут доступен только при код ответа от HTTP-соединения. (Число)

*   **исключение**: либо e.getMessage или e.toString (строка)

### Константы

*   1 = `FileTransferError.FILE_NOT_FOUND_ERR`
*   2 = `FileTransferError.INVALID_URL_ERR`
*   3 = `FileTransferError.CONNECTION_ERR`
*   4 = `FileTransferError.ABORT_ERR`
*   5 = `FileTransferError.NOT_MODIFIED_ERR`

## Обратной совместимости отмечает

Предыдущие версии этого плагина будет принимать только устройства Абсолют файлам как источник для закачки, или как целевых для загрузок. Обычно эти пути бы формы

    /var/mobile/Applications/<application UUID>/Documents/path/to/file  (iOS)
    /storage/emulated/0/path/to/file                                    (Android)
    

Для обратной совместимости, по-прежнему принимаются эти пути, и если ваше приложение зарегистрировано пути как в постоянное хранилище, то они могут продолжать использоваться.

Эти пути ранее были видны в `fullPath` свойства `FileEntry` и `DirectoryEntry` объекты, возвращаемые файл плагина. Новые версии файла плагина, однако, не подвергать эти пути в JavaScript.

Если вы переходите на новый (1.0.0 или новее) версию файла и вы ранее использовали `entry.fullPath` в качестве аргументов `download()` или `upload()` , то вам необходимо будет изменить код для использования файловой системы URL вместо.

`FileEntry.toURL()`и `DirectoryEntry.toURL()` возвращает URL-адрес формы файловой системы

    cdvfile://localhost/persistent/path/to/file
    

которые могут быть использованы вместо абсолютного пути в обоих `download()` и `upload()` методы.