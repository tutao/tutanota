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

Ce plugin permet d'accéder à certains éléments d'interface utilisateur native de dialogue.

## Installation

    cordova plugin add org.apache.cordova.dialogs
    

## Méthodes

*   `navigator.notification.alert`
*   `navigator.notification.confirm`
*   `navigator.notification.prompt`
*   `navigator.notification.beep`

## navigator.notification.alert

Affiche une boîte de dialogue ou d'alerte personnalisé. La plupart des implémentations de Cordova utilisent une boîte de dialogue natives pour cette fonctionnalité, mais certaines plates-formes du navigateur `alert` fonction, qui est généralement moins personnalisable.

    Navigator.notification.Alert (message, alertCallback, [titre], [buttonName])
    

*   **message**: message de la boîte de dialogue. *(String)*

*   **alertCallback**: callback à appeler lorsque la boîte de dialogue d'alerte est rejetée. *(Fonction)*

*   **titre**: titre de la boîte de dialogue. *(String)* (Facultatif, par défaut`Alert`)

*   **buttonName**: nom du bouton. *(String)* (Facultatif, par défaut`OK`)

### Exemple

    function alertDismissed() {
        // do something
    }
    
    navigator.notification.alert(
        'You are the winner!',  // message
        alertDismissed,         // callback
        'Game Over',            // title
        'Done'                  // buttonName
    );
    

### Plates-formes prises en charge

*   Amazon Fire OS
*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Tizen
*   Windows Phone 7 et 8
*   Windows 8

### Windows Phone 7 et 8 Quirks

*   Il n'y a aucune boîte de dialogue d'alerte intégrée au navigateur, mais vous pouvez en lier une pour appeler `alert()` dans le scope global:
    
        window.alert = navigator.notification.alert;
        

*   Les deux appels `alert` et `confirm` sont non-blocants, leurs résultats ne sont disponibles que de façon asynchrone.

### Firefox OS Quirks :

Les deux indigènes bloquant `window.alert()` et non-bloquante `navigator.notification.alert()` sont disponibles.

## navigator.notification.confirm

Affiche une boîte de dialogue de confirmation personnalisable.

    navigator.notification.confirm(message, confirmCallback, [title], [buttonLabels])
    

*   **message**: message de la boîte de dialogue. *(String)*

*   **confirmCallback**: callback à appeler avec l'index du bouton pressé (1, 2 ou 3) ou lorsque la boîte de dialogue est fermée sans qu'un bouton ne soit pressé (0). *(Fonction)*

*   **titre**: titre de dialogue. *(String)* (Facultatif, par défaut`Confirm`)

*   **buttonLabels**: tableau de chaînes spécifiant les étiquettes des boutons. *(Array)* (Optionnel, par défaut, [ `OK,Cancel` ])

### confirmCallback

Le `confirmCallback` s'exécute lorsque l'utilisateur appuie sur un bouton dans la boîte de dialogue de confirmation.

Le rappel prend l'argument `buttonIndex` *(nombre)*, qui est l'index du bouton activé. Notez que l'index utilise base d'indexation, la valeur est `1` , `2` , `3` , etc..

### Exemple

    function onConfirm(buttonIndex) {
        alert('You selected button ' + buttonIndex);
    }
    
    navigator.notification.confirm(
        'You are the winner!', // message
         onConfirm,            // callback to invoke with index of button pressed
        'Game Over',           // title
        ['Restart','Exit']     // buttonLabels
    );
    

### Plates-formes prises en charge

*   Amazon Fire OS
*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Paciarelli
*   Windows Phone 7 et 8
*   Windows 8

### Windows Phone 7 et 8 Quirks

*   Il n'y a aucune fonction intégrée au navigateur pour `window.confirm`, mais vous pouvez en lier une en affectant:
    
        window.confirm = navigator.notification.confirm ;
        

*   Les appels à `alert` et `confirm` sont non-bloquants, donc le résultat est seulement disponible de façon asynchrone.

### Firefox OS Quirks :

Les deux indigènes bloquant `window.confirm()` et non-bloquante `navigator.notification.confirm()` sont disponibles.

## navigator.notification.prompt

Affiche une boîte de dialogue natif qui est plus personnalisable que le navigateur `prompt` fonction.

    navigator.notification.prompt(message, promptCallback, [title], [buttonLabels], [defaultText])
    

*   **message**: message de la boîte de dialogue. *(String)*

*   **promptCallback**: rappel d'invoquer avec l'index du bouton pressé (1, 2 ou 3) ou lorsque la boîte de dialogue est fermée sans une presse de bouton (0). *(Fonction)*

*   **titre**: titre de la boîte de dialogue. *(String)* (Facultatif, par défaut`Alert`)

*   **buttonLabels**: tableau de chaînes spécifiant les étiquettes de boutons *(Array)* (facultatif, par défaut, les étiquettes `["OK","Cancel"]`)

*   **defaultText**: texte par défaut de la zone de texte ( `String` ) (en option, par défaut : chaîne vide)

### promptCallback

Le `promptCallback` s'exécute lorsque l'utilisateur appuie sur un bouton dans la boîte de dialogue d'invite. Le `results` objet passé au rappel contient les propriétés suivantes :

*   **buttonIndex**: l'index du bouton activé. *(Nombre)* Notez que l'index utilise une indexation de base 1, donc la valeur est `1` , `2` , `3` , etc.

*   **entrée 1**: le texte entré dans la boîte de dialogue d'invite. *(String)*

### Exemple

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
    

### Plates-formes prises en charge

*   Amazon Fire OS
*   Android
*   Firefox OS
*   iOS
*   Windows Phone 7 et 8

### Quirks Android

*   Android prend en charge un maximum de trois boutons et ignore plus que cela.

*   Sur Android 3.0 et versions ultérieures, les boutons sont affichés dans l'ordre inverse pour les appareils qui utilisent le thème Holo.

### Firefox OS Quirks :

Les deux indigènes bloquant `window.prompt()` et non-bloquante `navigator.notification.prompt()` sont disponibles.

## navigator.notification.beep

Le dispositif joue un bip sonore.

    navigator.notification.beep(times);
    

*   **temps**: le nombre de fois répéter le bip. *(Nombre)*

### Exemple

    // Beep twice!
    navigator.notification.beep(2);
    

### Plates-formes prises en charge

*   Amazon Fire OS
*   Android
*   BlackBerry 10
*   iOS
*   Paciarelli
*   Windows Phone 7 et 8
*   Windows 8

### Amazon Fire OS Quirks

*   Amazon Fire OS joue la valeur par défaut le **Son de Notification** spécifié sous le panneau **d'affichage des réglages/& Sound** .

### Quirks Android

*   Android joue la **sonnerie de Notification** spécifié sous le panneau des **réglages/son et affichage** de valeur par défaut.

### Windows Phone 7 et 8 Quirks

*   S'appuie sur un fichier générique bip de la distribution de Cordova.

### Bizarreries de paciarelli

*   Paciarelli implémente les bips en lisant un fichier audio via les médias API.

*   Le fichier sonore doit être court, doit se trouver dans un `sounds` sous-répertoire du répertoire racine de l'application et doit être nommé`beep.wav`.