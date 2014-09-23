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

Этот плагин позволяет вибрировать устройство.

## Установка

    cordova plugin add org.apache.cordova.vibration
    

## Поддерживаемые платформы

Navigator.Notification.Vibrate - Amazon Fire OS - Android - BlackBerry 10 - Firefox OS - iOS - Windows Phone 7 и 8

navigator.notification.vibrateWithPattern,  
navigator.notification.cancelVibration - Android

## Notification.Vibrate

Устройство вибрирует за определенное количество времени.

    navigator.notification.vibrate(time)
    

*   **время**: миллисекунд вибрировать устройство. *(Число)*

### Пример

    // Vibrate for 2.5 seconds
    navigator.notification.vibrate(2500);
    

### iOS причуды

*   **время**: игнорирует указанное время и вибрирует для предварительно установленного времени.
    
        navigator.notification.vibrate();
        navigator.notification.vibrate(2500);   // 2500 is ignored
        

## notification.vibrateWithPattern

Вибрирует на устройства с заданным шаблоном.

    navigator.notification.vibrateWithPattern(pattern, repeat)
    

*   **шаблон**: последовательность длительностей (в миллисекундах), для которого требуется включить или выключить вибростол. *(Массив из чисел)*
*   **повторяю**: дополнительный индекс в массиве шаблон для начала повторять (будет повторять пока не отменен), или -1 для не повторения (по умолчанию). *(Число)*

### Пример

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
    

## notification.cancelVibration

Немедленно отменяет любые выполняющиеся вибрации.

    navigator.notification.cancelVibration()