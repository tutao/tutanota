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

# org.apache.cordova.vibration

Este plugin se alinea con la vibración W3C especificación http://www.w3.org/TR/vibration/

Este plugin proporciona una manera de vibrar el dispositivo.

## Instalación

    cordova plugin add org.apache.cordova.vibration
    

## Plataformas soportadas

Navigator.Vibrate  
Navigator.Notification.Vibrate - Amazon fuego OS - sistema operativo Android - BlackBerry 10 - Firefox - iOS - Windows Phone 7 y 8

navigator.notification.vibrateWithPattern,  
navigator.notification.cancelVibration - Android

## vibrar (recomendado)

Esta función tiene tres diferentes funcionalidades basadas en los parámetros pasados a él.

### Estándar de vibrar

Vibra el dispositivo para una cantidad dada de tiempo.

    navigator.vibrate(time)
    

o

    navigator.vibrate([time])
    

-**tiempo**: milisegundos a vibrar el dispositivo. *(Número)*

#### Ejemplo

    // Vibrate for 3 seconds
    navigator.vibrate(3000);
    
    // Vibrate for 3 seconds
    navigator.vibrate([3000]);
    

#### iOS rarezas

*   **tiempo**: ignora el tiempo especificado y vibra durante un tiempo preestablecido.
    
    Navigator.Vibrate(3000); 3000 se omite

#### Windows y rarezas de Blackberry

*   **tiempo**: tiempo máximo es 5000ms (5s) y min tiempo 1ms
    
    navigator.vibrate(8000); // will be truncated to 5000

### Vibrar con un patrón (Android y Windows solamente)

Vibra el dispositivo con un patrón determinado

    navigator.vibrate(pattern);   
    

*   **patrón**: secuencia de duraciones (en milisegundos) que desea activar o desactivar el vibrador. *(Matriz de números)*

#### Ejemplo

    // Vibrate for 1 second
    // Wait for 1 second
    // Vibrate for 3 seconds
    // Wait for 1 second
    // Vibrate for 5 seconds
    navigator.vibrate([1000, 1000, 3000, 1000, 5000]);
    

### Cancelar vibración (no soportada en iOS)

Inmediatamente se cancela cualquier vibración actualmente en ejecución.

    navigator.vibrate(0)
    

o

    navigator.vibrate([])
    

o

    navigator.vibrate([0])
    

Pasando en un parámetro de 0, una matriz vacía o una matriz con un elemento de valor 0 se cancelará cualquier vibraciones.

## *Notification.Vibrate (obsoleto)

Vibra el dispositivo para una cantidad dada de tiempo.

    navigator.notification.vibrate(time)
    

*   **tiempo**: milisegundos a vibrar el dispositivo. *(Número)*

### Ejemplo

    // Vibrate for 2.5 seconds
    navigator.notification.vibrate(2500);
    

### iOS rarezas

*   **tiempo**: ignora el tiempo especificado y vibra durante un tiempo preestablecido.
    
        navigator.notification.vibrate();
        navigator.notification.vibrate(2500);   // 2500 is ignored
        

## *Notification.vibrateWithPattern (obsoleto)

Vibra el dispositivo con un patrón determinado.

    navigator.notification.vibrateWithPattern(pattern, repeat)
    

*   **patrón**: secuencia de duraciones (en milisegundos) que desea activar o desactivar el vibrador. *(Matriz de números)*
*   **repito**: índice opcional en la matriz de patrón en el cual comenzar repitiendo (se repite hasta que se cancele), o -1 para la no repetición (por defecto). *(Número)*

### Ejemplo

    // Immediately start vibrating
    // vibrate for 100ms,
    // wait for 100ms,
    // vibrate for 200ms,
    // wait for 100ms,
    // vibrate for 400ms,
    // wait for 100ms,
    // vibrate for 800ms,
    // (do not repeat)
    navigator.notification.vibrateWithPattern([0, 100, 100, 200, 100, 400, 100, 800]);
    

## *Notification.cancelVibration (obsoleto)

Inmediatamente se cancela cualquier vibración actualmente en ejecución.

    navigator.notification.cancelVibration()
    

* Nota: debido a la alineación con la especificación del w3c, los métodos favoritos a ser eliminados