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

# org.apache.cordova.inappbrowser

Этот плагин обеспечивает представление веб-браузера, что показывает при вызове`window.open()`.

    var ref = window.open('http://apache.org', '_blank', 'location=yes');
    

**Примечание**: InAppBrowser окно ведет себя как стандартный веб-браузер и не может доступ API Cordova.

## Установка

    cordova plugin add org.apache.cordova.inappbrowser
    

## window.open

Открывает URL-адрес в новом `InAppBrowser` например, текущий экземпляр браузера или браузера системы.

    var ref = window.open(url, target, options);
    

*   **ссылка**: ссылка для `InAppBrowser` окно. *(InAppBrowser)*

*   **URL**: URL-адрес для загрузки *(String)*. Вызвать `encodeURI()` на это, если URL-адрес содержит символы Unicode.

*   **Цель**: цель для загрузки URL-адреса, необязательный параметр, по умолчанию `_self` . *(Строка)*
    
    *   `_self`: Открывается в Cordova WebView, если URL-адрес в белый список, в противном случае он открывается в`InAppBrowser`.
    *   `_blank`: Открывает в`InAppBrowser`.
    *   `_system`: Открывается в веб-браузера системы.

*   **опции**: параметры для `InAppBrowser` . Необязательный параметр, виновная в: `location=yes` . *(Строка)*
    
    `options`Строка не должна содержать каких-либо пустое пространство, и каждая функция пар имя/значение должны быть разделены запятой. Функция имена нечувствительны к регистру. Все платформы поддерживают исходное значение:
    
    *   **Расположение**: равным `yes` или `no` превратить `InAppBrowser` в адресную строку или выключить.
    
    Только андроид:
    
    *   **closebuttoncaption**: задайте строку для использования в качестве заголовка кнопки **сделали** .
    *   **скрытые**: значение `yes` для создания браузера и загрузки страницы, но не показать его. Событие loadstop возникает, когда загрузка завершена. Опустить или набор `no` (по умолчанию), чтобы браузер открыть и загрузить нормально.
    *   **ClearCache**: набор `yes` иметь браузера куки кэш очищен перед открытием нового окна
    *   **clearsessioncache**: значение `yes` иметь кэш cookie сеанса очищается перед открытием нового окна
    
    только iOS:
    
    *   **closebuttoncaption**: задайте строку для использования в качестве заголовка кнопки **сделали** . Обратите внимание, что вам нужно самостоятельно локализовать это значение.
    *   **disallowoverscroll**: значение `yes` или `no` (по умолчанию `no` ). Включает/отключает свойство UIWebViewBounce.
    *   **скрытые**: значение `yes` для создания браузера и загрузки страницы, но не показать его. Событие loadstop возникает, когда загрузка завершена. Опустить или набор `no` (по умолчанию), чтобы браузер открыть и загрузить нормально.
    *   **ClearCache**: набор `yes` иметь браузера куки кэш очищен перед открытием нового окна
    *   **clearsessioncache**: значение `yes` иметь кэш cookie сеанса очищается перед открытием нового окна
    *   **панели инструментов**: набор `yes` или `no` для включения панели инструментов или выключить InAppBrowser (по умолчанию`yes`)
    *   **enableViewportScale**: значение `yes` или `no` для предотвращения просмотра, масштабирования через тег meta (по умолчанию`no`).
    *   **mediaPlaybackRequiresUserAction**: значение `yes` или `no` для предотвращения HTML5 аудио или видео от Автовоспроизведение (по умолчанию`no`).
    *   **allowInlineMediaPlayback**: значение `yes` или `no` чтобы разрешить воспроизведение мультимедиа HTML5 в строки, отображения в окне браузера, а не конкретного устройства воспроизведения интерфейс. HTML `video` элемент должен также включать `webkit-playsinline` атрибут (по умолчанию`no`)
    *   **keyboardDisplayRequiresUserAction**: значение `yes` или `no` чтобы открыть клавиатуру, когда формы элементы получают фокус через JavaScript в `focus()` вызов (по умолчанию`yes`).
    *   **suppressesIncrementalRendering**: значение `yes` или `no` ждать, пока все новое содержание представление получено до визуализации (по умолчанию`no`).
    *   **presentationstyle**: набор `pagesheet` , `formsheet` или `fullscreen` чтобы задать [стиль презентации][1] (по умолчанию`fullscreen`).
    *   **transitionstyle**: набор `fliphorizontal` , `crossdissolve` или `coververtical` чтобы задать [стиль перехода][2] (по умолчанию`coververtical`).
    *   **toolbarposition**: значение `top` или `bottom` (по умолчанию `bottom` ). Вызывает панели инструментов, чтобы быть в верхней или нижней части окна.

 [1]: http://developer.apple.com/library/ios/documentation/UIKit/Reference/UIViewController_Class/Reference/Reference.html#//apple_ref/occ/instp/UIViewController/modalPresentationStyle
 [2]: http://developer.apple.com/library/ios/#documentation/UIKit/Reference/UIViewController_Class/Reference/Reference.html#//apple_ref/occ/instp/UIViewController/modalTransitionStyle

### Поддерживаемые платформы

*   Amazon Fire ОС
*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 и 8

### Пример

    var ref = window.open('http://apache.org', '_blank', 'location=yes');
    var ref2 = window.open(encodeURI('http://ja.m.wikipedia.org/wiki/ハングル'), '_blank', 'location=yes');
    

### Firefox OS причуды

Как плагин не применять любой дизайн есть необходимость добавить некоторые правила CSS, если открыт с `target='_blank'` . Правила может выглядеть как эти

     css
    .inAppBrowserWrap {
      background-color: rgba(0,0,0,0.75);
      color: rgba(235,235,235,1.0);
    }
    .inAppBrowserWrap menu {
      overflow: auto;
      list-style-type: none;
      padding-left: 0;
    }
    .inAppBrowserWrap menu li {
      font-size: 25px;
      height: 25px;
      float: left;
      margin: 0 10px;
      padding: 3px 10px;
      text-decoration: none;
      color: #ccc;
      display: block;
      background: rgba(30,30,30,0.50);
    }
    .inAppBrowserWrap menu li.disabled {
        color: #777;
    }
    

## InAppBrowser

Объект, возвращаемый из вызова`window.open`.

### Методы

*   addEventListener
*   removeEventListener
*   close
*   show
*   executeScript
*   insertCSS

## addEventListener

> Добавляет прослушиватель для события от`InAppBrowser`.

    ref.addEventListener(eventname, callback);
    

*   **ссылка**: ссылка для `InAppBrowser` окно *(InAppBrowser)*

*   **EventName**: событие для прослушивания *(String)*
    
    *   **loadstart**: событие возникает, когда `InAppBrowser` начинает для загрузки URL-адреса.
    *   **loadstop**: событие возникает, когда `InAppBrowser` завершит загрузку URL-адреса.
    *   **loaderror**: событие возникает, когда `InAppBrowser` обнаруживает ошибку при загрузке URL-адреса.
    *   **выход**: возникает событие, когда `InAppBrowser` окно закрыто.

*   **обратного вызова**: функция, которая выполняется, когда возникает событие. Функция передается `InAppBrowserEvent` объект в качестве параметра.

### InAppBrowserEvent свойства

*   **тип**: eventname, либо `loadstart` , `loadstop` , `loaderror` , или `exit` . *(Строка)*

*   **URL**: URL-адрес, который был загружен. *(Строка)*

*   **код**: код ошибки, только в случае `loaderror` . *(Число)*

*   **сообщение**: сообщение об ошибке, только в случае `loaderror` . *(Строка)*

### Поддерживаемые платформы

*   Amazon Fire ОС
*   Android
*   iOS
*   Windows Phone 7 и 8

### Быстрый пример

    var ref = window.open('http://apache.org', '_blank', 'location=yes');
    ref.addEventListener('loadstart', function(event) { alert(event.url); });
    

## метод removeEventListener

> Удаляет прослушиватель для события от`InAppBrowser`.

    ref.removeEventListener(eventname, callback);
    

*   **ссылка**: ссылка для `InAppBrowser` окно. *(InAppBrowser)*

*   **EventName**: событие прекратить прослушивание. *(Строка)*
    
    *   **loadstart**: событие возникает, когда `InAppBrowser` начинает для загрузки URL-адреса.
    *   **loadstop**: событие возникает, когда `InAppBrowser` завершит загрузку URL-адреса.
    *   **loaderror**: событие возникает, когда `InAppBrowser` обнаруживает ошибку загрузки URL-адреса.
    *   **выход**: возникает событие, когда `InAppBrowser` окно закрывается.

*   **обратного вызова**: функция, выполняемая когда это событие наступает. Функция передается `InAppBrowserEvent` объект.

### Поддерживаемые платформы

*   Amazon Fire ОС
*   Android
*   iOS
*   Windows Phone 7 и 8

### Быстрый пример

    var ref = window.open('http://apache.org', '_blank', 'location=yes');
    var myCallback = function(event) { alert(event.url); }
    ref.addEventListener('loadstart', myCallback);
    ref.removeEventListener('loadstart', myCallback);
    

## close

> Закрывает `InAppBrowser` окно.

    Ref.Close();
    

*   **ссылка**: ссылка на `InAppBrowser` окно *(InAppBrowser)*

### Поддерживаемые платформы

*   Amazon Fire ОС
*   Android
*   Firefox OS
*   iOS
*   Windows Phone 7 и 8

### Быстрый пример

    var ref = window.open('http://apache.org', '_blank', 'location=yes');
    ref.close();
    

## show

> Отображается окно InAppBrowser, был открыт скрытые. Вызов это не имеет эффекта при InAppBrowser уже был виден.

    Ref.Show();
    

*   **ссылка**: ссылка на окно (InAppBrowser`InAppBrowser`)

### Поддерживаемые платформы

*   Amazon Fire ОС
*   Android
*   iOS

### Быстрый пример

    var ref = window.open('http://apache.org', '_blank', 'hidden=yes');
    // some time later...
    ref.show();
    

## executeScript

> Вставляет код JavaScript в `InAppBrowser` окно

    ref.executeScript(details, callback);
    

*   **ссылка**: ссылка на `InAppBrowser` окно. *(InAppBrowser)*

*   **injectDetails**: подробности сценария для запуска, указав либо `file` или `code` ключ. *(Объект)*
    
    *   **файл**: URL-адрес сценария вставки.
    *   **код**: текст сценария для вставки.

*   **обратного вызова**: функция, которая выполняет после вводят JavaScript-код.
    
    *   Если введенный скрипт имеет тип `code` , обратный вызов выполняется с одним параметром, который является возвращаемое значение сценария, завернутые в `Array` . Для многострочных сценариев это возвращаемое значение последнего оператора, или последнее вычисленное выражение.

### Поддерживаемые платформы

*   Amazon Fire ОС
*   Android
*   iOS

### Быстрый пример

    var ref = window.open('http://apache.org', '_blank', 'location=yes');
    ref.addEventListener('loadstop', function() {
        ref.executeScript({file: "myscript.js"});
    });
    

## insertCSS

> Внедряет CSS в `InAppBrowser` окно.

    ref.insertCSS(details, callback);
    

*   **ссылка**: ссылка на `InAppBrowser` окно *(InAppBrowser)*

*   **injectDetails**: детали сценария для запуска, указав либо `file` или `code` ключ. *(Объект)*
    
    *   **файл**: URL-адрес таблицы стилей для вставки.
    *   **код**: текст таблицы стилей для вставки.

*   **обратного вызова**: функция, которая выполняет после вводят CSS.

### Поддерживаемые платформы

*   Amazon Fire ОС
*   Android
*   iOS

### Быстрый пример

    var ref = window.open('http://apache.org', '_blank', 'location=yes');
    ref.addEventListener('loadstop', function() {
        ref.insertCSS({file: "mystyles.css"});
    });