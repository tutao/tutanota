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

Este plugin proporciona acceso a algunos elementos de la interfaz nativa de diálogo.

## Instalación

    cordova plugin add org.apache.cordova.dialogs
    

## Métodos

*   `navigator.notification.alert`
*   `navigator.notification.confirm`
*   `navigator.notification.prompt`
*   `navigator.notification.beep`

## navigator.notification.alert

Muestra un cuadro de alerta o cuadro de diálogo personalizado. La mayoría de las implementaciones de Cordova utilizan un cuadro de diálogo nativa para esta característica, pero algunas plataformas utilizan el navegador `alert` la función, que es típicamente menos personalizable.

    navigator.notification.alert(message, alertCallback, [title], [buttonName])
    

*   **mensaje**: mensaje de diálogo. *(String)*

*   **alertCallback**: Callback para invocar al diálogo de alerta es desestimada. *(Función)*

*   **título**: título de diálogo. *(String)* (Opcional, por defecto`Alert`)

*   **buttonName**: nombre del botón. *(String)* (Opcional, por defecto`OK`)

### Ejemplo

    function alertDismissed() {
        // do something
    }
    
    navigator.notification.alert(
        'You are the winner!',  // message
        alertDismissed,         // callback
        'Game Over',            // title
        'Done'                  // buttonName
    );
    

### Plataformas soportadas

*   Amazon fuego OS
*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Tizen
*   Windows Phone 7 y 8
*   Windows 8

### Windows Phone 7 y 8 rarezas

*   No hay ninguna alerta del navegador integrado, pero puede enlazar uno proceda a llamar a `alert()` en el ámbito global:
    
        window.alert = navigator.notification.alert;
        

*   Ambos `alert` y `confirm` son no-bloqueo llamadas, cuyos resultados sólo están disponibles de forma asincrónica.

### Firefox OS rarezas:

Dos nativos de bloqueo `window.alert()` y no-bloqueo `navigator.notification.alert()` están disponibles.

## navigator.notification.confirm

Muestra un cuadro de diálogo de confirmación personalizables.

    navigator.notification.confirm(message, confirmCallback, [title], [buttonLabels])
    

*   **mensaje**: mensaje de diálogo. *(String)*

*   **confirmCallback**: Callback para invocar con índice del botón pulsado (1, 2 ó 3) o cuando el cuadro de diálogo es despedido sin la presión del botón (0). *(Función)*

*   **título**: título de diálogo. *(String)* (Opcional, por defecto`Confirm`)

*   **buttonLabels**: matriz de cadenas especificando las etiquetas de botón. *(Matriz)* (Opcional, por defecto [ `OK,Cancel` ])

### confirmCallback

El `confirmCallback` se ejecuta cuando el usuario presiona uno de los botones en el cuadro de diálogo de confirmación.

La devolución de llamada toma el argumento `buttonIndex` *(número)*, que es el índice del botón presionado. Observe que el índice utiliza indexación basada en uno, entonces el valor es `1` , `2` , `3` , etc..

### Ejemplo

    function onConfirm(buttonIndex) {
        alert('You selected button ' + buttonIndex);
    }
    
    navigator.notification.confirm(
        'You are the winner!', // message
         onConfirm,            // callback to invoke with index of button pressed
        'Game Over',           // title
        ['Restart','Exit']     // buttonLabels
    );
    

### Plataformas soportadas

*   Amazon fuego OS
*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Tizen
*   Windows Phone 7 y 8
*   Windows 8

### Windows Phone 7 y 8 rarezas

*   No hay ninguna función de navegador incorporado para `window.confirm` , pero lo puede enlazar mediante la asignación:
    
        window.confirm = navigator.notification.confirm;
        

*   Llama a `alert` y `confirm` son no-bloqueo, así que el resultado sólo está disponible de forma asincrónica.

### Firefox OS rarezas:

Dos nativos de bloqueo `window.confirm()` y no-bloqueo `navigator.notification.confirm()` están disponibles.

## navigator.notification.prompt

Muestra un cuadro de diálogo nativa que es más personalizable que del navegador `prompt` función.

    navigator.notification.prompt(message, promptCallback, [title], [buttonLabels], [defaultText])
    

*   **mensaje**: mensaje de diálogo. *(String)*

*   **promptCallback**: Callback para invocar con índice del botón pulsado (1, 2 ó 3) o cuando el cuadro de diálogo es despedido sin la presión del botón (0). *(Función)*

*   **título**: título *(String)* (opcional, por defecto de diálogo`Prompt`)

*   **buttonLabels**: matriz de cadenas especificando botón etiquetas *(Array)* (opcional, por defecto`["OK","Cancel"]`)

*   **defaultText**: valor de la entrada predeterminada textbox ( `String` ) (opcional, por defecto: cadena vacía)

### promptCallback

El `promptCallback` se ejecuta cuando el usuario presiona uno de los botones del cuadro de diálogo pronto. El `results` objeto que se pasa a la devolución de llamada contiene las siguientes propiedades:

*   **buttonIndex**: el índice del botón presionado. *(Número)* Observe que el índice utiliza indexación basada en uno, entonces el valor es `1` , `2` , `3` , etc..

*   **INPUT1**: el texto introducido en el cuadro de diálogo pronto. *(String)*

### Ejemplo

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
    

### Plataformas soportadas

*   Amazon fuego OS
*   Android
*   Firefox OS
*   iOS
*   Windows Phone 7 y 8

### Rarezas Android

*   Android soporta un máximo de tres botones e ignora nada más.

*   En Android 3.0 y posteriores, los botones aparecen en orden inverso para dispositivos que utilizan el tema Holo.

### Firefox OS rarezas:

Dos nativos de bloqueo `window.prompt()` y no-bloqueo `navigator.notification.prompt()` están disponibles.

## navigator.notification.beep

El aparato reproduce un sonido sonido.

    navigator.notification.beep(times);
    

*   **tiempos**: el número de veces a repetir la señal. *(Número)*

### Ejemplo

    // Beep twice!
    navigator.notification.beep(2);
    

### Plataformas soportadas

*   Amazon fuego OS
*   Android
*   BlackBerry 10
*   iOS
*   Tizen
*   Windows Phone 7 y 8
*   Windows 8

### Amazon fuego OS rarezas

*   Amazon fuego OS reproduce el **Sonido de notificación** especificados en el panel de **configuración/pantalla y sonido** por defecto.

### Rarezas Android

*   Androide reproduce el **tono de notificación** especificados en el panel **ajustes de sonido y visualización** por defecto.

### Windows Phone 7 y 8 rarezas

*   Se basa en un archivo de sonido genérico de la distribución de Córdoba.

### Rarezas Tizen

*   Tizen implementa pitidos por reproducir un archivo de audio a través de los medios de comunicación API.

*   El archivo de sonido debe ser corto, debe estar ubicado en un `sounds` subdirectorio del directorio raíz de la aplicación y deben ser nombrados`beep.wav`.