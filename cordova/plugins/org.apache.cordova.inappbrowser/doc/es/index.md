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

Este plugin proporciona una vista de navegador web que se muestra cuando se llama a`window.open()`.

    var ref = window.open('http://apache.org', '_blank', 'location=yes');
    

**Nota**: InAppBrowser la ventana se comporta como un navegador web estándar y no pueden acceder a Cordova APIs.

## Instalación

    cordova plugin add org.apache.cordova.inappbrowser
    

## window.open

Se abre una dirección URL en una nueva `InAppBrowser` ejemplo, la instancia actual del navegador o el navegador del sistema.

    var ref = window.open(url, target, options);
    

*   **ref**: referencia a la `InAppBrowser` ventana. *(InAppBrowser)*

*   **URL**: el URL para cargar *(String)*. Llame a `encodeURI()` en este si la URL contiene caracteres Unicode.

*   **objetivo**: el objetivo en el que se carga la URL, un parámetro opcional que por defecto es `_self` . *(String)*
    
    *   `_self`: Se abre en el Cordova WebView si la URL está en la lista blanca, de lo contrario se abre en el`InAppBrowser`.
    *   `_blank`: Se abre en el`InAppBrowser`.
    *   `_system`: Se abre en el navegador web del sistema.

*   **Opciones**: opciones para el `InAppBrowser` . Opcional, contumaz a: `location=yes` . *(String)*
    
    La `options` cadena no debe contener ningún espacio en blanco, y pares nombre/valor de cada característica deben estar separados por una coma. Los nombres de función son minúsculas. Todas las plataformas admiten el valor siguiente:
    
    *   **Ubicación**: A `yes` o `no` para activar el `InAppBrowser` de barra de ubicación activado o desactivado.
    
    Android sólo:
    
    *   **closebuttoncaption**: establecer una cadena para usar como título del botón **hecho** .
    *   **oculta**: a `yes` para crear el navegador y cargar la página, pero no lo demuestra. El evento loadstop se desencadena cuando termine la carga. Omitir o a `no` (por defecto) para que el navegador abra y carga normalmente.
    *   **clearcache**: a `yes` para que el navegador es caché de galleta despejado antes de que se abra la nueva ventana
    *   **clearsessioncache**: a `yes` que la caché de cookie de sesión despejado antes de que se abra la nueva ventana
    
    Sólo iOS:
    
    *   **closebuttoncaption**: establecer una cadena para usar como título del botón **hecho** . Tenga en cuenta que necesitas localizar este valor por sí mismo.
    *   **disallowoverscroll**: A `yes` o `no` (valor por defecto es `no` ). Activa/desactiva la propiedad UIWebViewBounce.
    *   **oculta**: a `yes` para crear el navegador y cargar la página, pero no lo demuestra. El evento loadstop se desencadena cuando termine la carga. Omitir o a `no` (por defecto) para que el navegador abra y carga normalmente.
    *   **clearcache**: a `yes` para que el navegador es caché de galleta despejado antes de que se abra la nueva ventana
    *   **clearsessioncache**: a `yes` que la caché de cookie de sesión despejado antes de que se abra la nueva ventana
    *   **barra de herramientas**: a `yes` o `no` para activar la barra de herramientas on u off para el InAppBrowser (por defecto`yes`)
    *   **enableViewportScale**: A `yes` o `no` para evitar la vista escala a través de una etiqueta meta (por defecto`no`).
    *   **mediaPlaybackRequiresUserAction**: A `yes` o `no` para evitar HTML5 audio o vídeo de reproducción automática (por defecto`no`).
    *   **allowInlineMediaPlayback**: A `yes` o `no` para permitir la reproducción de los medios de comunicación en línea HTML5, mostrando en la ventana del navegador en lugar de una interfaz específica del dispositivo de reproducción. El código de HTML `video` elemento también debe incluir la `webkit-playsinline` atributo (por defecto`no`)
    *   **keyboardDisplayRequiresUserAction**: A `yes` o `no` para abrir el teclado cuando elementos de formulario reciben el foco mediante JavaScript `focus()` llamada (por defecto`yes`).
    *   **suppressesIncrementalRendering**: A `yes` o `no` que esperar a que todo el contenido nuevo vista es recibido antes de ser prestados (por defecto`no`).
    *   **presentationstyle**: A `pagesheet` , `formsheet` o `fullscreen` para establecer el [estilo de la presentación][1] (por defecto`fullscreen`).
    *   **transitionstyle**: A `fliphorizontal` , `crossdissolve` o `coververtical` para establecer el [estilo de transición][2] (por defecto`coververtical`).
    *   **toolbarposition**: A `top` o `bottom` (valor por defecto es `bottom` ). Hace que la barra de herramientas en la parte superior o inferior de la ventana.

 [1]: http://developer.apple.com/library/ios/documentation/UIKit/Reference/UIViewController_Class/Reference/Reference.html#//apple_ref/occ/instp/UIViewController/modalPresentationStyle
 [2]: http://developer.apple.com/library/ios/#documentation/UIKit/Reference/UIViewController_Class/Reference/Reference.html#//apple_ref/occ/instp/UIViewController/modalTransitionStyle

### Plataformas soportadas

*   Amazon fuego OS
*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 y 8

### Ejemplo

    var ref = window.open('http://apache.org', '_blank', 'location=yes');
    var ref2 = window.open(encodeURI('http://ja.m.wikipedia.org/wiki/ハングル'), '_blank', 'location=yes');
    

### Firefox OS rarezas

Como plugin no cumplir cualquier diseño es necesario añadir algunas reglas CSS si abre con `target='_blank'` . Las reglas pueden parecerse a estos

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

El objeto devuelto desde una llamada a`window.open`.

### Métodos

*   addEventListener
*   removeEventListener
*   close
*   show
*   executeScript
*   insertCSS

## addEventListener

> Añade un detector para un evento de la`InAppBrowser`.

    ref.addEventListener(eventname, callback);
    

*   **ref**: referencia a la `InAppBrowser` ventana *(InAppBrowser)*

*   **eventName**: el evento para escuchar *(String)*
    
    *   **loadstart**: evento desencadena cuando el `InAppBrowser` comienza a cargar una dirección URL.
    *   **loadstop**: evento desencadena cuando el `InAppBrowser` termina cargando una dirección URL.
    *   **loaderror**: evento desencadena cuando el `InAppBrowser` encuentra un error al cargar una dirección URL.
    *   **salida**: evento desencadena cuando el `InAppBrowser` se cierra la ventana.

*   **devolución de llamada**: la función que se ejecuta cuando se desencadene el evento. La función se pasa un `InAppBrowserEvent` objeto como parámetro.

### InAppBrowserEvent propiedades

*   **tipo**: eventname, ya sea `loadstart` , `loadstop` , `loaderror` , o `exit` . *(String)*

*   **URL**: la URL que se cargó. *(String)*

*   **código**: el código de error, sólo en el caso de `loaderror` . *(Número)*

*   **mensaje**: el mensaje de error, sólo en el caso de `loaderror` . *(String)*

### Plataformas soportadas

*   Amazon fuego OS
*   Android
*   iOS
*   Windows Phone 7 y 8

### Ejemplo rápido

    var ref = window.open('http://apache.org', '_blank', 'location=yes');
    ref.addEventListener('loadstart', function(event) { alert(event.url); });
    

## removeEventListener

> Elimina un detector para un evento de la`InAppBrowser`.

    ref.removeEventListener(eventname, callback);
    

*   **ref**: referencia a la `InAppBrowser` ventana. *(InAppBrowser)*

*   **eventName**: dejar de escuchar para el evento. *(String)*
    
    *   **loadstart**: evento desencadena cuando el `InAppBrowser` comienza a cargar una dirección URL.
    *   **loadstop**: evento desencadena cuando el `InAppBrowser` termina cargando una dirección URL.
    *   **loaderror**: evento desencadena cuando el `InAppBrowser` se encuentra con un error al cargar una dirección URL.
    *   **salida**: evento desencadena cuando el `InAppBrowser` se cierra la ventana.

*   **devolución de llamada**: la función a ejecutar cuando se desencadene el evento. La función se pasa un `InAppBrowserEvent` objeto.

### Plataformas soportadas

*   Amazon fuego OS
*   Android
*   iOS
*   Windows Phone 7 y 8

### Ejemplo rápido

    var ref = window.open('http://apache.org', '_blank', 'location=yes');
    var myCallback = function(event) { alert(event.url); }
    ref.addEventListener('loadstart', myCallback);
    ref.removeEventListener('loadstart', myCallback);
    

## close

> Se cierra el `InAppBrowser` ventana.

    Ref.Close();
    

*   **ref**: referencia a la `InAppBrowser` ventana *(InAppBrowser)*

### Plataformas soportadas

*   Amazon fuego OS
*   Android
*   Firefox OS
*   iOS
*   Windows Phone 7 y 8

### Ejemplo rápido

    var ref = window.open('http://apache.org', '_blank', 'location=yes');
    ref.close();
    

## show

> Muestra una ventana InAppBrowser que abrió sus puertas ocultada. Esto no tiene efecto si el InAppBrowser ya era visible.

    Ref.Show();
    

*   **ref**: referencia a la (ventana) InAppBrowser`InAppBrowser`)

### Plataformas soportadas

*   Amazon fuego OS
*   Android
*   iOS

### Ejemplo rápido

    var ref = window.open('http://apache.org', '_blank', 'hidden=yes');
    // some time later...
    ref.show();
    

## executeScript

> Inyecta código JavaScript en la `InAppBrowser` ventana

    ref.executeScript(details, callback);
    

*   **ref**: referencia a la `InAppBrowser` ventana. *(InAppBrowser)*

*   **injectDetails**: detalles de la secuencia de comandos para ejecutar, o especificar un `file` o `code` clave. *(Objeto)*
    
    *   **archivo**: URL de la secuencia de comandos para inyectar.
    *   **código**: texto de la escritura para inyectar.

*   **devolución de llamada**: la función que se ejecuta después de inyecta el código JavaScript.
    
    *   Si el script inyectado es de tipo `code` , la devolución de llamada se ejecuta con un solo parámetro, que es el valor devuelto por el guión, envuelto en un `Array` . Para los scripts de varias líneas, este es el valor devuelto de la última declaración, o la última expresión evaluada.

### Plataformas soportadas

*   Amazon fuego OS
*   Android
*   iOS

### Ejemplo rápido

    var ref = window.open('http://apache.org', '_blank', 'location=yes');
    ref.addEventListener('loadstop', function() {
        ref.executeScript({file: "myscript.js"});
    });
    

## insertCSS

> Inyecta CSS en la `InAppBrowser` ventana.

    ref.insertCSS(details, callback);
    

*   **ref**: referencia a la `InAppBrowser` ventana *(InAppBrowser)*

*   **injectDetails**: detalles de la secuencia de comandos para ejecutar, o especificar un `file` o `code` clave. *(Objeto)*
    
    *   **archivo**: URL de la hoja de estilos para inyectar.
    *   **código**: texto de la hoja de estilos para inyectar.

*   **devolución de llamada**: la función que se ejecuta después de inyectar el CSS.

### Plataformas soportadas

*   Amazon fuego OS
*   Android
*   iOS

### Ejemplo rápido

    var ref = window.open('http://apache.org', '_blank', 'location=yes');
    ref.addEventListener('loadstop', function() {
        ref.insertCSS({file: "mystyles.css"});
    });