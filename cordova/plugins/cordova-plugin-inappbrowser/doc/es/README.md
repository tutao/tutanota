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

# cordova-plugin-inappbrowser

[![Build Status](https://travis-ci.org/apache/cordova-plugin-inappbrowser.svg)](https://travis-ci.org/apache/cordova-plugin-inappbrowser)

Este plugin proporciona una vista de navegador web que se muestra cuando se llama a `cordova.InAppBrowser.open()`.

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    

El `cordova.InAppBrowser.open()` función se define como un reemplazo de sobreponer para la función `window.Open ()`. Llamadas existentes `window.Open ()` pueden utilizar la ventana InAppBrowser, mediante la sustitución de window.open:

    window.open = cordova.InAppBrowser.open;
    

La ventana de InAppBrowser se comporta como un navegador web estándar y no puede acceder a Cordova APIs. Por este motivo, se recomienda la InAppBrowser si necesita cargar contenido de terceros (confianza), en lugar de que cargar en el principal webview Cordova. El InAppBrowser no está sujeta a la lista blanca, ni va a abrir enlaces en el navegador del sistema.

El InAppBrowser proporciona por defecto sus propios controles GUI para el usuario (atras, adelante, hacer).

Para atrás compatibilidad, este plugin también ganchos `window.open`. Sin embargo, el gancho de `window.open` plugin instalado puede tener efectos secundarios no deseados (especialmente si este plugin está incluido únicamente como una dependencia de otro plugin). El gancho de `window.open` se quitará en una versión futura de principal. Hasta que el gancho se ha extraído el plugin, aplicaciones pueden restaurar manualmente el comportamiento por defecto:

    delete window.open // Reverts the call back to it's prototype's default
    

Aunque `window.open` es en el ámbito global, InAppBrowser no está disponible hasta después del evento `deviceready`.

    document.addEventListener("deviceready", onDeviceReady, false);
    function onDeviceReady() {
        console.log("window.open works well");
    }
    

## Instalación

    cordova plugin add cordova-plugin-inappbrowser
    

Si quieres todas las cargas de página en su aplicación para ir a través de la InAppBrowser, simplemente puedes conectar `window.open` durante la inicialización. Por ejemplo:

    document.addEventListener("deviceready", onDeviceReady, false);
    function onDeviceReady() {
        window.open = cordova.InAppBrowser.open;
    }
    

## cordova.InAppBrowser.open

Se abre una dirección URL en una nueva instancia de `InAppBrowser`, en la instancia actual del navegador o el navegador del sistema.

    var ref = cordova.InAppBrowser.open(url, target, options);
    

  * **ref**: referencia a la `InAppBrowser` ventana. *(InAppBrowser)*

  * **url**: el URL para cargar *(String)*. Llame a `encodeURI()` en esto si la URL contiene caracteres Unicode.

  * **target**: el objetivo en el que se carga la URL, un parámetro opcional que se utiliza de forma predeterminada `_self`. *(String)*
    
      * `_self`: se abre en el Cordova WebView si la URL está en la lista blanca, de lo contrario se abre en el `InAppBrowser`.
      * `_blank`: abre en el `InAppBrowser`.
      * `_system`: se abre en el navegador del sistema.

  * **options**: opciones para el `InAppBrowser`. Opcional, contumaz a: `location=yes`. *(String)*
    
    La cadena de `options` no debe contener ningún espacio en blanco, y los pares de nombre y valor de cada característica deben estar separados por una coma. Los nombres de función son minúsculas. Todas las plataformas admiten el valor siguiente:
    
      * **location**: se establece en `yes` o `no` para activar o desactivar la barra de ubicación de la `InAppBrowser`.
    
    Sólo Android:
    
      * **oculta**: a `yes` para crear el navegador y cargar la página, pero no lo demuestra. El evento loadstop se desencadena cuando termine la carga. Omitir o a `no` (por defecto) para que el navegador abra y carga normalmente.
      * **clearcache**: a `yes` para que el navegador es caché de galleta despejado antes de que se abra la nueva ventana
      * **clearsessioncache**: a `yes` que la caché de cookie de sesión despejado antes de que se abra la nueva ventana
      * **zoom**: establezca en `sí` para mostrar los controles de zoom del navegador de Android, a `no` para ocultarlas. El valor predeterminado es `sí`.
      * **hardwareback**: se establece en `sí` para utilizar el botón back de hardware para navegar hacia atrás a través de la historia de la `InAppBrowser`. Si no hay ninguna página anterior, se cerrará el `InAppBrowser` . El valor predeterminado es `sí`, por lo que se debe establecer en `no` si desea que el botón back para simplemente cerrar el InAppBrowser.
    
    Sólo iOS:
    
      * **closebuttoncaption**: establecer una cadena para usar como título del botón **hecho** . Tenga en cuenta que necesitas localizar este valor por sí mismo.
      * **disallowoverscroll**: A `yes` o `no` (valor por defecto es `no` ). Activa/desactiva la propiedad UIWebViewBounce.
      * **oculta**: a `yes` para crear el navegador y cargar la página, pero no lo demuestra. El evento loadstop se desencadena cuando termine la carga. Omitir o a `no` (por defecto) para que el navegador abra y carga normalmente.
      * **clearcache**: a `yes` para que el navegador es caché de galleta despejado antes de que se abra la nueva ventana
      * **clearsessioncache**: a `yes` que la caché de cookie de sesión despejado antes de que se abra la nueva ventana
      * **barra de herramientas**: a `yes` o `no` para activar la barra de herramientas on u off para el InAppBrowser (por defecto`yes`)
      * **enableViewportScale**: Set a `yes` o `no` para evitar viewport escalar a través de una etiqueta meta (por defecto a `no`).
      * **mediaPlaybackRequiresUserAction**: Set a `yes` o `no` para evitar HTML5 audio o vídeo de reproducción automática (por defecto a `no`).
      * **allowInlineMediaPlayback**: A `yes` o `no` para permitir la reproducción de los medios de comunicación en línea HTML5, mostrando en la ventana del navegador en lugar de una interfaz específica del dispositivo de reproducción. Elemento `video` de HTML también debe incluir el atributo de `webkit-playsinline` (por defecto a `no`)
      * **keyboardDisplayRequiresUserAction**: se establece en `yes` o `no` para abrir el teclado cuando elementos de formulario reciben el foco mediante llamada de JavaScript de `focus()` (por defecto a `yes`).
      * **suppressesIncrementalRendering**: se establece en `yes` o `no` para esperar hasta que todos los nuevos contenidos de vista se recibieron antes de ser prestados (por defecto a `no`).
      * **presentationstyle**: se establece en `pagesheet`, `formsheet` o `fullscreen` para definir el [estilo de la presentación](http://developer.apple.com/library/ios/documentation/UIKit/Reference/UIViewController_Class/Reference/Reference.html#//apple_ref/occ/instp/UIViewController/modalPresentationStyle) (por defecto a `fullscreen`).
      * **transitionstyle**: se establece en `fliphorizontal`, `crossdissolve` o `coververtical` para definir el [estilo de transición](http://developer.apple.com/library/ios/#documentation/UIKit/Reference/UIViewController_Class/Reference/Reference.html#//apple_ref/occ/instp/UIViewController/modalTransitionStyle) (por defecto `coververtical`).
      * **toolbarposition**: A `top` o `bottom` (valor por defecto es `bottom` ). Hace que la barra de herramientas en la parte superior o inferior de la ventana.
    
    Sólo Windows:
    
      * **oculta**: a `yes` para crear el navegador y cargar la página, pero no lo demuestra. El evento loadstop se desencadena cuando termine la carga. Omitir o a `no` (por defecto) para que el navegador abra y carga normalmente.
      * **fullscreen**: se establece en `sí` para crear el control del navegador sin un borde alrededor de él. Por favor tenga en cuenta que si **location=no** también se especifica, no habrá ningún control presentado al usuario para cerrar la ventana IAB.

### Plataformas soportadas

  * Amazon fire OS
  * Android
  * BlackBerry 10
  * Firefox OS
  * iOS
  * Windows 8 y 8.1
  * Windows Phone 7 y 8
  * Explorador

### Ejemplo

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    var ref2 = cordova.InAppBrowser.open(encodeURI('http://ja.m.wikipedia.org/wiki/ハングル'), '_blank', 'location=yes');
    

### Firefox OS rarezas

Como plugin no cumplir cualquier diseño es necesario añadir algunas reglas CSS si abre con `target = '_blank'`. Las reglas pueden parecerse a estos

```css
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
```

### Windows rarezas

Similar al comportamiento visual de la ventana de Firefox OS IAB puede anularse mediante `inAppBrowserWrap`/`inAppBrowserWrapFullscreen` clases CSS

### Navegador rarezas

  * Plugin se implementa mediante iframe,

  * Historial de navegación (botones`atrás` y `adelante` en LocationBar) no está implementado.

## InAppBrowser

El objeto devuelto desde una llamada a `cordova.InAppBrowser.open`.

### Métodos

  * addEventListener
  * removeEventListener
  * close
  * show
  * executeScript
  * insertCSS

## addEventListener

> Añade un detector para un evento de la `InAppBrowser`.

    ref.addEventListener(eventname, callback);
    

  * **ref**: referencia a la ventana de `InAppBrowser` *(InAppBrowser)*

  * **eventName**: el evento para escuchar *(String)*
    
      * **loadstart**: evento se desencadena cuando el `InAppBrowser` comienza a cargar una dirección URL.
      * **loadstop**: evento desencadena cuando los acabados `InAppBrowser` cargar una dirección URL.
      * **loaderror**: evento se desencadena cuando el `InAppBrowser` encuentra un error al cargar una dirección URL.
      * **exit**: evento se desencadena cuando se cierra la ventana de `InAppBrowser`.

  * **callback**: la función que se ejecuta cuando se desencadene el evento. La función se pasa un objeto `InAppBrowserEvent` como un parámetro.

### InAppBrowserEvent propiedades

  * **type**: eventname, `loadstart`, `loadstop`, `loaderror` o `exit`. *(String)*

  * **url**: la URL que se cargó. *(String)*

  * **code**: el código de error, sólo en el caso de `loaderror`. *(Número)*

  * **message**: el mensaje de error, sólo en el caso de `loaderror`. *(String)*

### Plataformas soportadas

  * Amazon fire OS
  * Android
  * iOS
  * Windows 8 y 8.1
  * Windows Phone 7 y 8
  * Explorador

### Navegador rarezas

eventos `loadstart` y `loaderror` no son alimentados.

### Ejemplo rápido

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    ref.addEventListener('loadstart', function(event) { alert(event.url); });
    

## removeEventListener

> Elimina un detector para un evento de la `InAppBrowser`.

    ref.removeEventListener(eventname, callback);
    

  * **ref**: referencia a la ventana de `InAppBrowser`. *(InAppBrowser)*

  * **eventName**: dejar de escuchar para el evento. *(String)*
    
      * **loadstart**: evento se desencadena cuando el `InAppBrowser` comienza a cargar una dirección URL.
      * **loadstop**: evento desencadena cuando los acabados `InAppBrowser` cargar una dirección URL.
      * **loaderror**: evento se desencadena cuando el `InAppBrowser` se encuentra con un error al cargar una dirección URL.
      * **exit**: evento se desencadena cuando se cierra la ventana de `InAppBrowser`.

  * **callback**: la función a ejecutar cuando se desencadene el evento. La función se pasa un objeto `InAppBrowserEvent`.

### Plataformas soportadas

  * Amazon fire OS
  * Android
  * iOS
  * Windows 8 y 8.1
  * Windows Phone 7 y 8
  * Explorador

### Ejemplo rápido

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    var myCallback = function(event) { alert(event.url); }
    ref.addEventListener('loadstart', myCallback);
    ref.removeEventListener('loadstart', myCallback);
    

## close

> Cierra la ventana de `InAppBrowser`.

    ref.close();
    

  * **ref**: referencia a la ventana de `InAppBrowser` *(InAppBrowser)*

### Plataformas soportadas

  * Amazon fire OS
  * Android
  * Firefox OS
  * iOS
  * Windows 8 y 8.1
  * Windows Phone 7 y 8
  * Explorador

### Ejemplo rápido

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    ref.close();
    

## show

> Muestra una ventana InAppBrowser que abrió sus puertas ocultada. Esto no tiene efecto si el InAppBrowser ya era visible.

    ref.show();
    

  * **ref**: referencia a la (ventana) InAppBrowser`InAppBrowser`)

### Plataformas soportadas

  * Amazon fire OS
  * Android
  * iOS
  * Windows 8 y 8.1
  * Explorador

### Ejemplo rápido

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'hidden=yes');
    // some time later...
    ref.show();
    

## executeScript

> Inyecta código JavaScript en la ventana de `InAppBrowser`

    ref.executeScript(details, callback);
    

  * **ref**: referencia a la ventana de `InAppBrowser`. *(InAppBrowser)*

  * **injectDetails**: detalles de la secuencia de comandos para ejecutar, o especificar un `file` o `code` clave. *(Objeto)*
    
      * **file**: URL del script para inyectar.
      * **code**: texto de la escritura para inyectar.

  * **devolución de llamada**: la función que se ejecuta después de inyecta el código JavaScript.
    
      * Si el script inyectado es del tipo de `code`, la devolución de llamada se ejecuta con un solo parámetro, que es el valor devuelto del guión, envuelto en una `Array`. Para scripts multilíneas, este es el valor devuelto de la última declaración, o la última expresión evaluada.

### Plataformas soportadas

  * Amazon fire OS
  * Android
  * iOS
  * Windows 8 y 8.1
  * Explorador

### Ejemplo rápido

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    ref.addEventListener('loadstop', function() {
        ref.executeScript({file: "myscript.js"});
    });
    

### Navegador rarezas

  * sólo **code** es compatible.

### Windows rarezas

Debido a la [documentación MSDN](https://msdn.microsoft.com/en-us/library/windows.ui.xaml.controls.webview.invokescriptasync.aspx) el script invocado puede devolver únicamente valores de cadena, de lo contrario el parámetro, pasa al **callback** será `[null]`.

## insertCSS

> Inyecta CSS en la ventana de `InAppBrowser`.

    ref.insertCSS(details, callback);
    

  * **ref**: referencia a la ventana de `InAppBrowser` *(InAppBrowser)*

  * **injectDetails**: detalles de la secuencia de comandos para ejecutar, o especificar un `file` o `code` clave. *(Objeto)*
    
      * **file**: URL de la hoja de estilos para inyectar.
      * **code**: texto de la hoja de estilos para inyectar.

  * **callback**: la función que se ejecuta después de inyectar el CSS.

### Plataformas soportadas

  * Amazon fire OS
  * Android
  * iOS
  * Windows

### Ejemplo rápido

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    ref.addEventListener('loadstop', function() {
        ref.insertCSS({file: "mystyles.css"});
    });