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

Ten plugin umożliwia dostęp do niektórych rodzimych okna dialogowego elementy interfejsu użytkownika.

## Instalacji

    cordova plugin add org.apache.cordova.dialogs
    

## Metody

*   `navigator.notification.alert`
*   `navigator.notification.confirm`
*   `navigator.notification.prompt`
*   `navigator.notification.beep`

## navigator.notification.alert

Pokazuje niestandardowe wpisu lub okno dialogowe. Większość implementacji Cordova używać rodzimych okno dialogowe dla tej funkcji, ale niektóre platformy używać przeglądarki `alert` funkcja, który jest zazwyczaj mniej konfigurowalny.

    navigator.notification.alert(message, alertCallback, [title], [buttonName])
    

*   **wiadomość**: komunikat okna dialogowego. *(String)*

*   **alertCallback**: wywołanie zwrotne do wywołania, gdy okno dialogowe alert jest oddalona. *(Funkcja)*

*   **tytuł**: okno tytuł. *(String)* (Opcjonalna, domyślnie`Alert`)

*   **buttonName**: Nazwa przycisku. *(String)* (Opcjonalna, domyślnie`OK`)

### Przykład

    function alertDismissed() {
        // do something
    }
    
    navigator.notification.alert(
        'You are the winner!',  // message
        alertDismissed,         // callback
        'Game Over',            // title
        'Done'                  // buttonName
    );
    

### Obsługiwane platformy

*   Amazon ogień OS
*   Android
*   Jeżyna 10
*   Firefox OS
*   iOS
*   Tizen
*   Windows Phone 7 i 8
*   Windows 8

### Windows Phone 7 i 8 dziwactwa

*   Istnieje wpis nie wbudowana przeglądarka, ale można powiązać w następujący sposób na wywołanie `alert()` w globalnym zasięgu:
    
        window.alert = navigator.notification.alert;
        

*   Zarówno `alert` i `confirm` są bez blokowania połączeń, których wyniki są tylko dostępne asynchronicznie.

### Firefox OS dziwactwa:

Blokuje zarówno rodzimych `window.alert()` i bez blokowania `navigator.notification.alert()` są dostępne.

## navigator.notification.confirm

Wyświetla okno dialogowe potwierdzenia konfigurowalny.

    navigator.notification.confirm(message, confirmCallback, [title], [buttonLabels])
    

*   **wiadomość**: komunikat okna dialogowego. *(String)*

*   **confirmCallback**: wywołanie zwrotne do wywołania z indeksu z przycisku (1, 2 lub 3), lub gdy okno jest zwolniony bez naciśnij przycisk (0). *(Funkcja)*

*   **tytuł**: okno tytuł. *(String)* (Opcjonalna, domyślnie`Confirm`)

*   **buttonLabels**: tablica ciągów, określając etykiety przycisków. *(Tablica)* (Opcjonalna, domyślnie [ `OK,Cancel` ])

### confirmCallback

`confirmCallback`Wykonuje, gdy użytkownik naciśnie klawisz jeden z przycisków w oknie dialogowym potwierdzenia.

Wywołania zwrotnego przyjmuje argument `buttonIndex` *(numer)*, który jest indeksem wciśnięty przycisk. Uwaga, że indeks używa, na podstawie jednego indeksowania, więc wartość jest `1` , `2` , `3` , itp.

### Przykład

    function onConfirm(buttonIndex) {
        alert('You selected button ' + buttonIndex);
    }
    
    navigator.notification.confirm(
        'You are the winner!', // message
         onConfirm,            // callback to invoke with index of button pressed
        'Game Over',           // title
        ['Restart','Exit']     // buttonLabels
    );
    

### Obsługiwane platformy

*   Amazon ogień OS
*   Android
*   Jeżyna 10
*   Firefox OS
*   iOS
*   Tizen
*   Windows Phone 7 i 8
*   Windows 8

### Windows Phone 7 i 8 dziwactwa

*   Istnieje funkcja wbudowana przeglądarka nie `window.confirm` , ale można go powiązać przypisując:
    
        window.confirm = navigator.notification.confirm;
        

*   Wzywa do `alert` i `confirm` są bez blokowania, więc wynik jest tylko dostępnych asynchronicznie.

### Firefox OS dziwactwa:

Blokuje zarówno rodzimych `window.confirm()` i bez blokowania `navigator.notification.confirm()` są dostępne.

## navigator.notification.prompt

Wyświetla okno dialogowe macierzystego, który bardziej niż przeglądarki `prompt` funkcja.

    navigator.notification.prompt(message, promptCallback, [title], [buttonLabels], [defaultText])
    

*   **wiadomość**: komunikat okna dialogowego. *(String)*

*   **promptCallback**: wywołanie zwrotne do wywołania z indeksu z przycisku (1, 2 lub 3), lub gdy okno jest zwolniony bez naciśnij przycisk (0). *(Funkcja)*

*   **tytuł**: okno tytuł *(String)* (opcjonalna, domyślnie`Prompt`)

*   **buttonLabels**: tablica ciągów, określając przycisk etykiety *(tablica)* (opcjonalna, domyślnie`["OK","Cancel"]`)

*   **defaultText**: wartość wejściowa tekstowym domyślnego ( `String` ) (opcjonalna, domyślnie: pusty ciąg)

### promptCallback

`promptCallback`Wykonuje, gdy użytkownik naciśnie klawisz jeden z przycisków w oknie dialogowym polecenia. `results`Obiekt przekazywany do wywołania zwrotnego zawiera następujące właściwości:

*   **buttonIndex**: indeks wciśnięty przycisk. *(Liczba)* Uwaga, że indeks używa, na podstawie jednego indeksowania, więc wartość jest `1` , `2` , `3` , itp.

*   **input1**: Tekst wprowadzony w oknie polecenia. *(String)*

### Przykład

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
    

### Obsługiwane platformy

*   Amazon ogień OS
*   Android
*   Firefox OS
*   iOS
*   Windows Phone 7 i 8

### Android dziwactwa

*   Android obsługuje maksymalnie trzy przyciski i więcej niż to ignoruje.

*   Android 3.0 i nowszych przyciski są wyświetlane w kolejności odwrotnej do urządzenia, które używają tematu Holo.

### Firefox OS dziwactwa:

Blokuje zarówno rodzimych `window.prompt()` i bez blokowania `navigator.notification.prompt()` są dostępne.

## navigator.notification.beep

Urządzenie odtwarza sygnał ciągły dźwięk.

    navigator.notification.beep(times);
    

*   **razy**: liczba powtórzeń po sygnale. *(Liczba)*

### Przykład

    // Beep twice!
    navigator.notification.beep(2);
    

### Obsługiwane platformy

*   Amazon ogień OS
*   Android
*   Jeżyna 10
*   iOS
*   Tizen
*   Windows Phone 7 i 8
*   Windows 8

### Amazon ogień OS dziwactwa

*   Amazon ogień OS gra domyślny **Dźwięk powiadomienia** określone w panelu **ekranu/ustawienia i dźwięk** .

### Android dziwactwa

*   Android gra domyślnie **dzwonek powiadomienia** określone w panelu **ustawień/dźwięk i wyświetlacz** .

### Windows Phone 7 i 8 dziwactwa

*   Opiera się na pliku rodzajowego sygnał z rozkładu Cordova.

### Osobliwości Tizen

*   Tizen implementuje dźwięków przez odtwarzania pliku audio za pośrednictwem mediów API.

*   Plik dźwiękowy muszą być krótkie, musi znajdować się w `sounds` podkatalogu katalogu głównego aplikacji i musi być nazwany`beep.wav`.