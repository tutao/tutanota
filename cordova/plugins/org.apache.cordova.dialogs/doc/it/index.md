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

Questo plugin consente di accedere ad alcuni elementi di interfaccia utente nativa del dialogo.

## Installazione

    cordova plugin add org.apache.cordova.dialogs
    

## Metodi

*   `navigator.notification.alert`
*   `navigator.notification.confirm`
*   `navigator.notification.prompt`
*   `navigator.notification.beep`

## navigator.notification.alert

Mostra una finestra di avviso o la finestra di dialogo personalizzata. La maggior parte delle implementazioni di Cordova una dialogo nativa per questa caratteristica, ma alcune piattaforme utilizzano il browser `alert` funzione, che è in genere meno personalizzabile.

    navigator.notification.alert(message, alertCallback, [title], [buttonName])
    

*   **messaggio**: messaggio finestra di dialogo. *(String)*

*   **alertCallback**: Callback da richiamare quando viene chiusa la finestra di avviso. *(Funzione)*

*   **titolo**: titolo di dialogo. *(String)* (Opzionale, default è`Alert`)

*   **buttonName**: nome del pulsante. *(String)* (Opzionale, default è`OK`)

### Esempio

    function alertDismissed() {
        // do something
    }
    
    navigator.notification.alert(
        'You are the winner!',  // message
        alertDismissed,         // callback
        'Game Over',            // title
        'Done'                  // buttonName
    );
    

### Piattaforme supportate

*   Amazon fuoco OS
*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Tizen
*   Windows Phone 7 e 8
*   Windows 8

### Windows Phone 7 e 8 stranezze

*   Non non c'è nessun avviso del browser integrato, ma è possibile associare uno come segue per chiamare `alert()` in ambito globale:
    
        window.alert = navigator.notification.alert;
        

*   Entrambi `alert` e `confirm` sono non di blocco chiamate, risultati di cui sono disponibili solo in modo asincrono.

### Firefox OS Stranezze:

Entrambi nativi di blocco `window.alert()` e non bloccante `navigator.notification.alert()` sono disponibili.

## navigator.notification.confirm

Visualizza una finestra di dialogo conferma personalizzabile.

    navigator.notification.confirm(message, confirmCallback, [title], [buttonLabels])
    

*   **messaggio**: messaggio finestra di dialogo. *(String)*

*   **confirmCallback**: Callback da richiamare con l'indice del pulsante premuto (1, 2 o 3) o quando la finestra di dialogo viene chiusa senza una pressione del pulsante (0). *(Funzione)*

*   **titolo**: titolo di dialogo. *(String)* (Opzionale, default è`Confirm`)

*   **buttonLabels**: matrice di stringhe che specificano le etichette dei pulsanti. *(Matrice)* (Opzionale, default è [ `OK,Cancel` ])

### confirmCallback

Il `confirmCallback` viene eseguito quando l'utente preme uno dei pulsanti nella finestra di dialogo conferma.

Il callback accetta l'argomento `buttonIndex` *(numero)*, che è l'indice del pulsante premuto. Nota che l'indice utilizza l'indicizzazione base uno, quindi il valore è `1` , `2` , `3` , ecc.

### Esempio

    function onConfirm(buttonIndex) {
        alert('You selected button ' + buttonIndex);
    }
    
    navigator.notification.confirm(
        'You are the winner!', // message
         onConfirm,            // callback to invoke with index of button pressed
        'Game Over',           // title
        ['Restart','Exit']     // buttonLabels
    );
    

### Piattaforme supportate

*   Amazon fuoco OS
*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Tizen
*   Windows Phone 7 e 8
*   Windows 8

### Windows Phone 7 e 8 stranezze

*   Non non c'è nessuna funzione browser incorporato per `window.confirm` , ma è possibile associare assegnando:
    
        window.confirm = navigator.notification.confirm;
        

*   Chiama al `alert` e `confirm` sono non bloccante, quindi il risultato è disponibile solo in modo asincrono.

### Firefox OS Stranezze:

Entrambi nativi di blocco `window.confirm()` e non bloccante `navigator.notification.confirm()` sono disponibili.

## navigator.notification.prompt

Visualizza una finestra di dialogo nativa che è più personalizzabile del browser `prompt` funzione.

    navigator.notification.prompt(message, promptCallback, [title], [buttonLabels], [defaultText])
    

*   **messaggio**: messaggio finestra di dialogo. *(String)*

*   **promptCallback**: Callback da richiamare con l'indice del pulsante premuto (1, 2 o 3) o quando la finestra di dialogo viene chiusa senza una pressione del pulsante (0). *(Funzione)*

*   **titolo**: dialogo titolo *(String)* (opzionale, default è`Prompt`)

*   **buttonLabels**: matrice di stringhe specificando il pulsante etichette *(Array)* (opzionale, default è`["OK","Cancel"]`)

*   **defaultText**: valore di input predefinito textbox ( `String` ) (opzionale, Default: stringa vuota)

### promptCallback

Il `promptCallback` viene eseguito quando l'utente preme uno dei pulsanti nella finestra di dialogo richiesta. Il `results` oggetto passato al metodo di callback contiene le seguenti proprietà:

*   **buttonIndex**: l'indice del pulsante premuto. *(Numero)* Nota che l'indice utilizza l'indicizzazione base uno, quindi il valore è `1` , `2` , `3` , ecc.

*   **INPUT1**: il testo immesso nella finestra di dialogo richiesta. *(String)*

### Esempio

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
    

### Piattaforme supportate

*   Amazon fuoco OS
*   Android
*   Firefox OS
*   iOS
*   Windows Phone 7 e 8

### Stranezze Android

*   Android supporta un massimo di tre pulsanti e ignora di più di quello.

*   Su Android 3.0 e versioni successive, i pulsanti vengono visualizzati in ordine inverso per dispositivi che utilizzano il tema Holo.

### Firefox OS Stranezze:

Entrambi nativi di blocco `window.prompt()` e non bloccante `navigator.notification.prompt()` sono disponibili.

## navigator.notification.beep

Il dispositivo riproduce un bip sonoro.

    navigator.notification.beep(times);
    

*   **volte**: il numero di volte per ripetere il segnale acustico. *(Numero)*

### Esempio

    // Beep twice!
    navigator.notification.beep(2);
    

### Piattaforme supportate

*   Amazon fuoco OS
*   Android
*   BlackBerry 10
*   iOS
*   Tizen
*   Windows Phone 7 e 8
*   Windows 8

### Amazon fuoco OS stranezze

*   Amazon fuoco OS riproduce il **Suono di notifica** specificato sotto il pannello **Impostazioni/Display e il suono** predefinito.

### Stranezze Android

*   Android giochi default **Notification ringtone** specificato sotto il pannello **impostazioni/audio e Display** .

### Windows Phone 7 e 8 stranezze

*   Si basa su un file generico bip dalla distribuzione di Cordova.

### Tizen stranezze

*   Tizen implementa bip di riproduzione di un file audio tramite i media API.

*   Il file beep deve essere breve, deve essere situato un `sounds` sottodirectory della directory radice dell'applicazione e deve essere denominato`beep.wav`.