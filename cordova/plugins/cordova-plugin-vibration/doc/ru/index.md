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

# cordova-plugin-vibration

Этот плагин соотвествует спецификации W3C http://www.w3.org/TR/vibration/ о вибрации

Этот плагин позволяет управлять вибрацией устройства.

## Установка

    cordova plugin add cordova-plugin-vibration
    

## Поддерживаемые платформы

Navigator.Vibrate  
Navigator.Notification.Vibrate - Amazon Fire OS - Android - BlackBerry 10 - Firefox OS - iOS - Windows Phone 7 и 8

navigator.notification.vibrateWithPattern,  
navigator.notification.cancelVibration - Android

## vibrate (рекомендуемый)

Эта функция имеет три различных функцала, на основе параметров, передаваемых ей.

### Стандартная вибрация

Устройство вибрирует в течении определенного количества времени.

    navigator.vibrate(time)
    

или

    navigator.vibrate([time])
    

-**time**: Сколько миллисекунд будет вибрировать устройство. *(Число)*

#### Пример

    // Vibrate for 3 seconds
    navigator.vibrate(3000);
    
    // Vibrate for 3 seconds
    navigator.vibrate([3000]);
    

#### Особенности iOS

*   **time**: игнорирует указанное время и вибрирует предопределенный отрезок времени.
    
    navigator.vibrate(3000); // 3000 is ignored

#### Особенности Windows и Blackberry

*   **time**: Максимальное время 5000мс (5с) и минимальное время 1 мс
    
    navigator.vibrate(8000); // will be truncated to 5000

### Вибрировать по шаблону (только Android и Windows)

Вибрирует на устройства с заданным шаблоном

    navigator.vibrate(pattern);   
    

*   **pattern**: последовательность длительностей (в миллисекундах), в течение которого требуется включить или выключить вибрацию. *(Массив из чисел)*

#### Пример

    // Vibrate for 1 second
    // Wait for 1 second
    // Vibrate for 3 seconds
    // Wait for 1 second
    // Vibrate for 5 seconds
    navigator.vibrate([1000, 1000, 3000, 1000, 5000]);
    

### Отмена вибрации (не поддерживается в iOS)

Немедленно отменяет любые выполняющиеся вибрации.

    navigator.vibrate(0)
    

или

    navigator.vibrate([])
    

или

    navigator.vibrate([0])
    

Передавая в параметре 0, пустой массив, или массив с одним элементом значения 0, на устройстве будет отменена любая вибрация.

## *notification.vibrate (устарело)

Устройство вибрирует за определенное количество времени.

    navigator.notification.vibrate(time)
    

*   **time**: Сколько миллисекунд будет вибрировать устройство. *(Число)*

### Пример

    // Vibrate for 2.5 seconds
    navigator.notification.vibrate(2500);
    

### Особенности iOS

*   **time**: игнорирует указанное время и вибрирует предопределенный отрезок времени.
    
        navigator.notification.vibrate();
        navigator.notification.vibrate(2500);   // 2500 is ignored
        

## *notification.vibrateWithPattern (устарело)

Вибрирует на устройства с заданным шаблоном.

    navigator.notification.vibrateWithPattern(pattern, repeat)
    

*   **pattern**: последовательность длительностей (в миллисекундах), в течение которого требуется включить или выключить вибрацию. *(Массив из чисел)*
*   **repeat**: Необязательные индекс в массиве шаблона вибрации, начиная с которого начать повторять вибрацию (будет повторяться пока не будет отменен), или -1 для отсуствия повторения (по умолчанию). *(Число)*

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
    

## *notification.cancelVibration (устарело)

Немедленно отменяет любые выполняющиеся вибрации.

    navigator.notification.cancelVibration()
    

* Обратите внимание - из-за соответствие спецификации w3c, Отмеченные методы будут поэтапно выведены из эксплаутации
