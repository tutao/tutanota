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

# org.apache.cordova.dialogs

Этот плагин обеспечивает доступ к некоторым элементам собственного диалогового окна пользовательского интерфейса.

## Установка

    cordova plugin add org.apache.cordova.dialogs
    

## Методы

*   `navigator.notification.alert`
*   `navigator.notification.confirm`
*   `navigator.notification.prompt`
*   `navigator.notification.beep`

## navigator.notification.alert

Показывает окно пользовательские оповещения или диалоговое окно. Большинство реализаций Cordova использовать диалоговое окно родной для этой функции, но некоторые платформы браузера `alert` функция, которая как правило менее настраивается.

    Navigator.Notification.Alert (сообщение, alertCallback, [название], [buttonName])
    

*   **сообщение**: сообщение диалога. *(Строка)*

*   **alertCallback**: обратного вызова для вызова, когда закрывается диалоговое окно оповещения. *(Функция)*

*   **название**: диалоговое окно название. *(Строка)* (Опционально, по умолчанию`Alert`)

*   **buttonName**: имя кнопки. *(Строка)* (Опционально, по умолчанию`OK`)

### Пример

    function alertDismissed() {
        // do something
    }
    
    navigator.notification.alert(
        'You are the winner!',  // message
        alertDismissed,         // callback
        'Game Over',            // title
        'Done'                  // buttonName
    );
    

### Поддерживаемые платформы

*   Amazon Fire ОС
*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Tizen
*   Windows Phone 7 и 8
*   Windows 8

### Windows Phone 7 и 8 причуды

*   Существует предупреждение не встроенный браузер, но можно привязать один следующим позвонить `alert()` в глобальной области действия:
    
        window.alert = navigator.notification.alert;
        

*   Оба `alert` и `confirm` являются не блокировка звонков, результаты которых доступны только асинхронно.

### Firefox OS причуды:

Как родной блокировка `window.alert()` и неблокирующий `navigator.notification.alert()` доступны.

## navigator.notification.confirm

Отображает диалоговое окно Настраиваемый подтверждения.

    navigator.notification.confirm(message, confirmCallback, [title], [buttonLabels])
    

*   **сообщение**: сообщение диалога. *(Строка)*

*   **confirmCallback**: обратного вызова с индексом кнопка нажата (1, 2 или 3) или когда диалоговое окно закрывается без нажатия кнопки (0). *(Функция)*

*   **название**: диалоговое окно название. *(Строка)* (Опционально, по умолчанию`Confirm`)

*   **buttonLabels**: массив строк, указав названия кнопок. *(Массив)* (Не обязательно, по умолчанию [ `OK,Cancel` ])

### confirmCallback

`confirmCallback`Выполняется, когда пользователь нажимает одну из кнопок в диалоговом окне подтверждения.

Аргументом функции обратного вызова `buttonIndex` *(номер)*, который является индекс нажатой кнопки. Обратите внимание, что индекс использует единицы индексации, поэтому значение `1` , `2` , `3` , и т.д.

### Пример

    function onConfirm(buttonIndex) {
        alert('You selected button ' + buttonIndex);
    }
    
    navigator.notification.confirm(
        'You are the winner!', // message
         onConfirm,            // callback to invoke with index of button pressed
        'Game Over',           // title
        ['Restart','Exit']     // buttonLabels
    );
    

### Поддерживаемые платформы

*   Amazon Fire ОС
*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Tizen
*   Windows Phone 7 и 8
*   Windows 8

### Windows Phone 7 и 8 причуды

*   Нет встроенного браузера функция для `window.confirm` , но его можно привязать путем присвоения:
    
        window.confirm = navigator.notification.confirm;
        

*   Вызовы `alert` и `confirm` являются не блокируется, поэтому результат доступен только асинхронно.

### Firefox OS причуды:

Как родной блокировка `window.confirm()` и неблокирующий `navigator.notification.confirm()` доступны.

## navigator.notification.prompt

Отображает родной диалоговое окно более настраиваемый, чем в браузере `prompt` функции.

    navigator.notification.prompt(message, promptCallback, [title], [buttonLabels], [defaultText])
    

*   **сообщение**: сообщение диалога. *(Строка)*

*   **promptCallback**: обратного вызова с индексом кнопка нажата (1, 2 или 3) или когда диалоговое окно закрывается без нажатия кнопки (0). *(Функция)*

*   **название**: диалоговое окно название *(String)* (опционально, по умолчанию`Prompt`)

*   **buttonLabels**: массив строк, указав кнопку этикетки *(массив)* (опционально, по умолчанию`["OK","Cancel"]`)

*   **defaultText**: по умолчанию textbox входное значение ( `String` ) (опционально, по умолчанию: пустая строка)

### promptCallback

`promptCallback`Выполняется, когда пользователь нажимает одну из кнопок в диалоговом окне приглашения. `results`Объект, переданный в метод обратного вызова содержит следующие свойства:

*   **buttonIndex**: индекс нажатой кнопки. *(Число)* Обратите внимание, что индекс использует единицы индексации, поэтому значение `1` , `2` , `3` , и т.д.

*   **INPUT1**: текст, введенный в диалоговом окне приглашения. *(Строка)*

### Пример

    function onPrompt(results) {
        alert("You selected button number " + results.buttonIndex + " and entered " + results.input1);
    }
    
    navigator.notification.prompt(
        'Please enter your name',  // message
        onPrompt,                  // callback to invoke
        'Registration',            // title
        ['Ok','Exit'],             // buttonLabels
        'Jane Doe'                 // defaultText
    );
    

### Поддерживаемые платформы

*   Amazon Fire ОС
*   Android
*   Firefox OS
*   iOS
*   Windows Phone 7 и 8

### Android причуды

*   Android поддерживает максимум из трех кнопок и игнорирует больше, чем это.

*   На Android 3.0 и более поздних версиях кнопки отображаются в обратном порядке для устройств, которые используют тему холо.

### Firefox OS причуды:

Как родной блокировка `window.prompt()` и неблокирующий `navigator.notification.prompt()` доступны.

## navigator.notification.beep

Устройство воспроизводит звуковой сигнал звук.

    navigator.notification.beep(times);
    

*   **раз**: количество раз, чтобы повторить сигнал. *(Число)*

### Пример

    // Beep twice!
    navigator.notification.beep(2);
    

### Поддерживаемые платформы

*   Amazon Fire ОС
*   Android
*   BlackBerry 10
*   iOS
*   Tizen
*   Windows Phone 7 и 8
*   Windows 8

### Amazon Fire OS причуды

*   Amazon Fire OS играет по умолчанию **Звук уведомления** , указанного на панели **параметров/дисплей и звук** .

### Android причуды

*   Android играет по умолчанию **уведомления рингтон** указанных в панели **настройки/звук и дисплей** .

### Windows Phone 7 и 8 причуды

*   Опирается на общий звуковой файл из дистрибутива Кордова.

### Причуды Tizen

*   Tizen реализует гудков, воспроизведении аудиофайла через СМИ API.

*   Звуковой файл должен быть коротким, должен быть расположен в `sounds` подкаталог корневого каталога приложения и должны быть названы`beep.wav`.