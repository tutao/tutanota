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

Dieses Plugin ermöglicht den Zugriff auf einige native Dialog-UI-Elemente.

## Installation

    cordova plugin add org.apache.cordova.dialogs
    

## Methoden

*   `navigator.notification.alert`
*   `navigator.notification.confirm`
*   `navigator.notification.prompt`
*   `navigator.notification.beep`

## navigator.notification.alert

Zeigt eine benutzerdefinierte Warnung oder Dialogfeld Feld. Die meisten Implementierungen von Cordova ein native Dialogfeld für dieses Feature verwenden, aber einige Plattformen des Browsers `alert` Funktion, die in der Regel weniger anpassbar ist.

    Navigator.Notification.Alert (Message, AlertCallback, [Titel], [ButtonName])
    

*   **Nachricht**: Dialogfeld Nachricht. *(String)*

*   **AlertCallback**: Callback aufgerufen wird, wenn Warnungs-Dialogfeld geschlossen wird. *(Funktion)*

*   **Titel**: Dialog "Titel". *(String)* (Optional, Standard ist`Alert`)

*   **ButtonName**: Name der Schaltfläche. *(String)* (Optional, Standard ist`OK`)

### Beispiel

    function alertDismissed() {
        // do something
    }
    
    navigator.notification.alert(
        'You are the winner!',  // message
        alertDismissed,         // callback
        'Game Over',            // title
        'Done'                  // buttonName
    );
    

### Unterstützte Plattformen

*   Amazon Fire OS
*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Tizen
*   Windows Phone 7 und 8
*   Windows 8

### Windows Phone 7 und 8 Macken

*   Es gibt keine eingebaute Datenbanksuchroutine-Warnung, aber Sie können binden, wie folgt zu nennen `alert()` im globalen Gültigkeitsbereich:
    
        window.alert = navigator.notification.alert;
        

*   Beide `alert` und `confirm` sind nicht blockierende Aufrufe, die Ergebnisse davon nur asynchron sind.

### Firefox OS Macken:

Beide Native blockierenden `window.alert()` und nicht-blockierende `navigator.notification.alert()` stehen zur Verfügung.

## navigator.notification.confirm

Zeigt das Dialogfeld anpassbare Bestätigung.

    navigator.notification.confirm(message, confirmCallback, [title], [buttonLabels])
    

*   **Nachricht**: Dialogfeld Nachricht. *(String)*

*   **ConfirmCallback**: Callback aufgerufen wird, mit Index gedrückt (1, 2 oder 3) oder wenn das Dialogfeld geschlossen wird, ohne einen Tastendruck (0). *(Funktion)*

*   **Titel**: Dialog "Titel". *(String)* (Optional, Standard ist`Confirm`)

*   **ButtonLabels**: Array von Zeichenfolgen, die Schaltflächenbezeichnungen angeben. *(Array)* (Optional, Standard ist [ `OK,Cancel` ])

### confirmCallback

Die `confirmCallback` wird ausgeführt, wenn der Benutzer eine der Schaltflächen im Dialogfeld zur Bestätigung drückt.

Der Rückruf dauert das Argument `buttonIndex` *(Anzahl)*, die der Index der Schaltfläche gedrückt ist. Beachten Sie, dass der Index 1-basierte Indizierung, verwendet, sodass der Wert ist `1` , `2` , `3` , etc..

### Beispiel

    function onConfirm(buttonIndex) {
        alert('You selected button ' + buttonIndex);
    }
    
    navigator.notification.confirm(
        'You are the winner!', // message
         onConfirm,            // callback to invoke with index of button pressed
        'Game Over',           // title
        ['Restart','Exit']     // buttonLabels
    );
    

### Unterstützte Plattformen

*   Amazon Fire OS
*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Tizen
*   Windows Phone 7 und 8
*   Windows 8

### Windows Phone 7 und 8 Macken

*   Es gibt keine integrierte Browser-Funktion für `window.confirm` , aber Sie können es binden, indem Sie zuweisen:
    
        window.confirm = navigator.notification.confirm;
        

*   Aufrufe von `alert` und `confirm` sind nicht blockierend, so dass das Ergebnis nur asynchron zur Verfügung steht.

### Firefox OS Macken:

Beide Native blockierenden `window.confirm()` und nicht-blockierende `navigator.notification.confirm()` stehen zur Verfügung.

## navigator.notification.prompt

Zeigt eine native Dialogfeld, das mehr als des Browsers anpassbar ist `prompt` Funktion.

    navigator.notification.prompt(message, promptCallback, [title], [buttonLabels], [defaultText])
    

*   **Nachricht**: Dialogfeld Nachricht. *(String)*

*   **PromptCallback**: Callback aufgerufen wird, mit Index gedrückt (1, 2 oder 3) oder wenn das Dialogfeld geschlossen wird, ohne einen Tastendruck (0). *(Funktion)*

*   **Titel**: Dialog Title *(String)* (Optional, Standard ist`Prompt`)

*   **ButtonLabels**: Array von Zeichenfolgen angeben Schaltfläche Etiketten *(Array)* (Optional, Standard ist`["OK","Cancel"]`)

*   **DefaultText**: Standard-Textbox Eingabewert ( `String` ) (Optional, Standard: leere Zeichenfolge)

### promptCallback

Die `promptCallback` wird ausgeführt, wenn der Benutzer eine der Schaltflächen im Eingabedialogfeld drückt. Die `results` an den Rückruf übergebene Objekt enthält die folgenden Eigenschaften:

*   **ButtonIndex**: der Index der Schaltfläche gedrückt. *(Anzahl)* Beachten Sie, dass der Index 1-basierte Indizierung, verwendet, sodass der Wert ist `1` , `2` , `3` , etc..

*   **Eingang1**: in Eingabedialogfeld eingegebenen Text. *(String)*

### Beispiel

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
    

### Unterstützte Plattformen

*   Amazon Fire OS
*   Android
*   Firefox OS
*   iOS
*   Windows Phone 7 und 8

### Android Macken

*   Android unterstützt maximal drei Schaltflächen und mehr als das ignoriert.

*   Auf Android 3.0 und höher, werden die Schaltflächen in umgekehrter Reihenfolge für Geräte angezeigt, die das Holo-Design verwenden.

### Firefox OS Macken:

Beide Native blockierenden `window.prompt()` und nicht-blockierende `navigator.notification.prompt()` stehen zur Verfügung.

## navigator.notification.beep

Das Gerät spielt einen Signalton sound.

    navigator.notification.beep(times);
    

*   **Zeiten**: die Anzahl der Wiederholungen des Signaltons. *(Anzahl)*

### Beispiel

    // Beep twice!
    navigator.notification.beep(2);
    

### Unterstützte Plattformen

*   Amazon Fire OS
*   Android
*   BlackBerry 10
*   iOS
*   Tizen
*   Windows Phone 7 und 8
*   Windows 8

### Amazon Fire OS Macken

*   Amazon Fire OS spielt die Standardeinstellung **Akustische Benachrichtigung** unter **Einstellungen/Display & Sound** Bereich angegeben.

### Android Macken

*   Android spielt die Standardeinstellung **Benachrichtigung Klingelton** unter **Einstellungen/Sound & Display** -Panel angegeben.

### Windows Phone 7 und 8 Macken

*   Stützt sich auf eine generische Piepton-Datei aus der Cordova-Distribution.

### Tizen Macken

*   Tizen implementiert Signaltöne durch Abspielen einer Audiodatei über die Medien API.

*   Die Beep-Datei muss kurz sein, befinden muss einem `sounds` Unterverzeichnis des Stammverzeichnisses der Anwendung, und muss den Namen`beep.wav`.