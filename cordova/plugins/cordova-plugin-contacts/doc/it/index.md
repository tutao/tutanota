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

# cordova-plugin-contacts

Questo plugin definisce un oggetto globale `navigator.contacts`, che fornisce l'accesso al database di contatti del dispositivo.

Anche se l'oggetto è associato con ambito globale del `navigator`, non è disponibile fino a dopo l'evento `deviceready`.

    document.addEventListener("deviceready", onDeviceReady, false);
    function onDeviceReady() {
        console.log(navigator.contacts);
    }
    

**Avviso**: raccolta e utilizzo dei dati di contatto solleva questioni di privacy importante. Politica sulla privacy dell'app dovrebbe discutere come app utilizza i dati di contatto e se è condiviso con altre parti. Informazioni di contatto sono considerate sensibile perché rivela le persone con cui una persona comunica. Pertanto, oltre alla politica di privacy dell'app, è fortemente consigliabile fornendo un preavviso di just-in-time prima app accede o utilizza i dati di contatto, se il sistema operativo del dispositivo non farlo già. Tale comunicazione deve fornire le informazioni stesse notate sopra, oltre ad ottenere l'autorizzazione (ad esempio, presentando scelte per **OK** e **No grazie**). Si noti che alcuni mercati app possono richiedere l'app per fornire un preavviso di just-in-time e ottenere l'autorizzazione dell'utente prima di accedere ai dati di contatto. Un'esperienza utente chiara e facile--capisce che circonda l'uso del contatto dati aiuta a evitare la confusione dell'utente e percepito un uso improprio dei dati di contatto. Per ulteriori informazioni, vedere la guida sulla Privacy.

## Installazione

    cordova plugin add cordova-plugin-contacts
    

### Firefox OS stranezze

Creare **www/manifest.webapp** come descritto nel [Manifest Docs][1]. Aggiungi permisions rilevanti. C'è anche la necessità di modificare il tipo di webapp in "privilegiato" - [Manifest Docs][2]. **AVVERTENZA**: tutte le apps privilegiato applicare [Content Security Policy][3] che vieta script inline. Inizializzare l'applicazione in un altro modo.

 [1]: https://developer.mozilla.org/en-US/Apps/Developing/Manifest
 [2]: https://developer.mozilla.org/en-US/Apps/Developing/Manifest#type
 [3]: https://developer.mozilla.org/en-US/Apps/CSP

    "type": "privileged",
    "permissions": {
        "contacts": {
            "access": "readwrite",
            "description": "Describe why there is a need for such permission"
        }
    }
    

### Stranezze di Windows

Eventuali contatti restituiti dai metodi `find` e `pickContact` sono readonly, quindi l'applicazione non può modificarli. Metodo `find` disponibile solo sui dispositivi Windows Phone 8.1.

### Stranezze di Windows 8

Windows 8 contatti sono readonly. Tramite i contatti di Cordova API non sono queryable/ricerche, si dovrebbe informare l'utente di scegliere un contatto come una chiamata a contacts.pickContact che aprirà l'app 'Persone' dove l'utente deve scegliere un contatto. Eventuali contatti restituiti sono readonly, quindi l'applicazione non può modificarli.

## Navigator.contacts

### Metodi

*   navigator.contacts.create
*   navigator.contacts.find
*   navigator.contacts.pickContact

### Oggetti

*   Contact
*   ContactName
*   ContactField
*   ContactAddress
*   ContactOrganization
*   ContactFindOptions
*   ContactError
*   ContactFieldType

## navigator.contacts.create

Il metodo `navigator.contacts.create` è sincrono e restituisce un nuovo oggetto di `Contact`.

Questo metodo non mantiene l'oggetto contatto nel database contatti dispositivo, per cui è necessario richiamare il metodo `Contact.save`.

### Piattaforme supportate

*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 e 8

### Esempio

    var myContact = navigator.contacts.create({"displayName": "Test User"});
    

## navigator.contacts.find

Il metodo `navigator.contacts.find` in modo asincrono, esegue una query sul database di contatti del dispositivo e restituisce una matrice di oggetti `Contact`. Gli oggetti risultanti vengono passati alla funzione di callback `contactSuccess` specificata dal parametro **contactSuccess**.

Il parametro **contactFields** specifica i campi per essere utilizzato come un qualificatore di ricerca. Un parametro di lunghezza zero, **contactFields** non è valido e si traduce in `ContactError.INVALID_ARGUMENT_ERROR`. Un valore di **contactFields** di `"*"` ricerche campi tutti i contatti.

La stringa di **contactFindOptions.filter** può essere utilizzata come un filtro di ricerca quando una query sul database di contatti. Se fornito, una distinzione, corrispondenza parziale valore viene applicato a ogni campo specificato nel parametro **contactFields**. Se esiste una corrispondenza per *qualsiasi* dei campi specificati, viene restituito il contatto. Uso **contactFindOptions.desiredFields** parametro di controllo quale contattare la proprietà deve essere rispedito indietro.

### Parametri

*   **contactFields**: contattare campi da utilizzare come un qualificatore di ricerca. *(DOMString[])* [Required]

*   **contactSuccess**: funzione di callback successo richiamato con la matrice di oggetti contatto restituiti dal database. [Required]

*   **contactError**: funzione di callback di errore, viene richiamato quando si verifica un errore. [Facoltativo]

*   **contactFindOptions**: opzioni per filtrare navigator.contacts di ricerca. [Optional]
    
    I tasti sono:
    
    *   **filter**: la stringa di ricerca utilizzata per trovare navigator.contacts. *(DOMString)* (Default: `""`)
    
    *   **multiple**: determina se l'operazione di ricerca restituisce più navigator.contacts. *(Boolean)* (Default: `false`)
        
        *   **desiredFields**: contattare i campi per essere tornato indietro. Se specificato, il risultante `contatto` oggetto solo caratteristiche valori per questi campi. *(DOMString[])* [Optional]

### Piattaforme supportate

*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 e 8
*   Windows (solo per dispositivi Windows Phone 8.1)

### Esempio

    function onSuccess(contacts) {
        alert('Found ' + contacts.length + ' contacts.');
    };
    
    function onError(contactError) {
        alert('onError!');
    };
    
    // find all contacts with 'Bob' in any name field
    var options      = new ContactFindOptions();
    options.filter   = "Bob";
    options.multiple = true;
    options.desiredFields = [navigator.contacts.fieldType.id];
    var fields       = [navigator.contacts.fieldType.displayName, navigator.contacts.fieldType.name];
    navigator.contacts.find(fields, onSuccess, onError, options);
    

### Stranezze di Windows

*   `__contactFields__`non è supportato, verrà ignorato. `find`metodo cercherà sempre di abbinare il nome, indirizzo email o numero di telefono di un contatto.

## navigator.contacts.pickContact

Il metodo `navigator.contacts.pickContact` lancia il contatto selettore per selezionare un singolo contatto. L'oggetto risultante viene passato alla funzione di callback `contactSuccess` specificata dal parametro **contactSuccess**.

### Parametri

*   **contactSuccess**: funzione di callback di successo viene richiamato con il singolo oggetto di contatto. [Richiesto]

*   **contactError**: funzione di callback di errore, viene richiamato quando si verifica un errore. [Facoltativo]

### Piattaforme supportate

*   Android
*   iOS
*   Windows Phone 8
*   Windows 8
*   Windows

### Esempio

    navigator.contacts.pickContact(function(contact){
            console.log('The following contact has been selected:' + JSON.stringify(contact));
        },function(err){
            console.log('Error: ' + err);
        });
    

## Contact

L'oggetto `Contact` rappresenta il contatto di un utente. Contatti possono essere creati, memorizzati o rimossi dal database di contatti dispositivo. Contatti possono anche essere estratto (singolarmente o in blocco) dal database richiamando il metodo `navigator.contacts.find`.

**Nota**: non tutti i campi di contatto sopra elencati sono supportati su ogni piattaforma del dispositivo. Consultare la sezione di *stranezze* su ogni piattaforma per dettagli.

### Proprietà

*   **ID**: un identificatore univoco globale. *(DOMString)*

*   **displayName**: il nome di questo contatto, adatto per la visualizzazione a utenti finali. *(DOMString)*

*   **nome**: un oggetto che contiene tutti i componenti di un nome di persone. *(ContactName)*

*   **Nickname**: un nome informale con cui affrontare il contatto. *(DOMString)*

*   **phoneNumbers**: una matrice di numeri di telefono del contatto. *(ContactField[])*

*   **email**: una matrice di indirizzi di posta elettronica del contatto. *(ContactField[])*

*   **indirizzi**: una matrice di indirizzi di contatto. *(ContactAddress[])*

*   **IMS**: una matrice di indirizzi IM tutto il contatto. *(ContactField[])*

*   **organizzazioni**: una matrice di organizzazioni di tutto il contatto. *(ContactOrganization[])*

*   **compleanno**: il compleanno del contatto. *(Data)*

*   **Nota**: una nota sul contatto. *(DOMString)*

*   **foto**: una matrice di foto del contatto. *(ContactField[])*

*   **categorie**: matrice di tutte le categorie definite dall'utente connesso con il contatto. *(ContactField[])*

*   **URL**: matrice di pagine web connesso con il contatto. *(ContactField[])*

### Metodi

*   **clone**: restituisce una nuova `Contact` oggetto che è una copia completa dell'oggetto chiamante, con la `id` proprietà impostata`null`.

*   **rimuovere**: rimuove il contatto dal database contatti dispositivo, altrimenti esegue un callback di errore con un `ContactError` oggetto.

*   **Salva**: salva un nuovo contatto nel database di contatti del dispositivo, o aggiorna un contatto esistente se esiste già un contatto con lo stesso **id** .

### Piattaforme supportate

*   Amazon fuoco OS
*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 e 8
*   Windows 8
*   Windows

### Esempio di salvare

    function onSuccess(contact) {
        alert("Save Success");
    };
    
    function onError(contactError) {
        alert("Error = " + contactError.code);
    };
    
    // create a new contact object
    var contact = navigator.contacts.create();
    contact.displayName = "Plumber";
    contact.nickname = "Plumber";            // specify both to support all devices
    
    // populate some fields
    var name = new ContactName();
    name.givenName = "Jane";
    name.familyName = "Doe";
    contact.name = name;
    
    // save to device
    contact.save(onSuccess,onError);
    

### Esempio di clone

        // clone the contact object
        var clone = contact.clone();
        clone.name.givenName = "John";
        console.log("Original contact name = " + contact.name.givenName);
        console.log("Cloned contact name = " + clone.name.givenName);
    

### Rimuovere esempio

    function onSuccess() {
        alert("Removal Success");
    };
    
    function onError(contactError) {
        alert("Error = " + contactError.code);
    };
    
    // remove the contact from the device
    contact.remove(onSuccess,onError);
    

### Stranezze di Android 2. x

*   **categorie**: non è supportato sui dispositivi Android 2. x, restituendo`null`.

### BlackBerry 10 capricci

*   **ID**: assegnate dal dispositivo quando si salva il contatto.

### Capricci di FirefoxOS

*   **categorie**: parzialmente supportati. Campi **pref** e **tipo** stanno tornando`null`

*   **IMS**: non supportato

*   **foto**: non supportato

### iOS stranezze

*   **displayName**: non supportata su iOS, tornando `null` se non c'è nessun `ContactName` specificato, nel qual caso restituisce il nome composito, **soprannome** o `""` , rispettivamente.

*   **compleanno**: deve essere inserito come un JavaScript `Date` oggetto, allo stesso modo viene restituito.

*   **foto**: restituisce un URL del File dell'immagine, che viene memorizzato nella directory temporanea dell'applicazione. Contenuto della directory temporanea vengono rimossi quando l'applicazione termina.

*   **categorie**: questa proprietà non è attualmente supportata, restituendo`null`.

### Windows Phone 7 e 8 stranezze

*   **displayName**: quando si crea un contatto, il valore specificato per il parametro del nome di visualizzazione è diverso dal nome visualizzato Estratto quando trovare il contatto.

*   **URL**: quando si crea un contatto, gli utenti possono inserire e salvare più di un indirizzo web, ma solo uno è disponibile durante la ricerca del contatto.

*   **phoneNumbers**: non è supportata l'opzione *pref* . Il *tipo* non è supportato in un'operazione di *trovare* . Un solo `phoneNumber` è consentita per ogni *tipo*.

*   **email**: non è supportata l'opzione *pref* . Home e personal fa riferimento la stessa voce di posta elettronica. È consentito un solo ingresso per ogni *tipo*.

*   **indirizzi**: supporta solo lavoro e casa/personali *tipo*. Il riferimento principale e personale *tipo* la stessa voce di indirizzo. È consentito un solo ingresso per ogni *tipo*.

*   **organizzazioni**: solo uno è consentito e non supporta gli attributi *pref*, *tipo*e *dipartimento* .

*   **Nota**: non supportato, restituendo`null`.

*   **IMS**: non supportato, restituendo`null`.

*   **compleanni**: non supportato, restituendo`null`.

*   **categorie**: non supportato, restituendo`null`.

### Stranezze di Windows

*   **foto**: restituisce un URL del File dell'immagine, che viene memorizzato nella directory temporanea dell'applicazione.

*   **compleanni**: non supportato, restituendo`null`.

*   **categorie**: non supportato, restituendo`null`.

## ContactAddress

L'oggetto `ContactAddress` memorizza le proprietà di un singolo indirizzo di un contatto. Un oggetto `Contact` può includere più di un indirizzo in una matrice `[] ContactAddress`.

### Proprietà

*   **pref**: impostare su `true` se questo `ContactAddress` contiene il valore dell'utente preferito. *(booleano)*

*   **tipo**: una stringa che indica il tipo di campo è, *casa* ad esempio. *(DOMString)*

*   **formattato**: indirizzo completo formattato per la visualizzazione. *(DOMString)*

*   **streetAddress**: l'indirizzo completo. *(DOMString)*

*   **località**: la città o località. *(DOMString)*

*   **regione**: lo stato o la regione. *(DOMString)*

*   **postalCode**: il codice postale o il codice postale. *(DOMString)*

*   **paese**: il nome del paese. *(DOMString)*

### Piattaforme supportate

*   Amazon fuoco OS
*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 e 8
*   Windows 8
*   Windows

### Esempio

    // display the address information for all contacts
    
    function onSuccess(contacts) {
        for (var i = 0; i < contacts.length; i++) {
            for (var j = 0; j < contacts[i].addresses.length; j++) {
                alert("Pref: "         + contacts[i].addresses[j].pref          + "\n" +
                    "Type: "           + contacts[i].addresses[j].type          + "\n" +
                    "Formatted: "      + contacts[i].addresses[j].formatted     + "\n" +
                    "Street Address: " + contacts[i].addresses[j].streetAddress + "\n" +
                    "Locality: "       + contacts[i].addresses[j].locality      + "\n" +
                    "Region: "         + contacts[i].addresses[j].region        + "\n" +
                    "Postal Code: "    + contacts[i].addresses[j].postalCode    + "\n" +
                    "Country: "        + contacts[i].addresses[j].country);
            }
        }
    };
    
    function onError(contactError) {
        alert('onError!');
    };
    
    // find all contacts
    var options = new ContactFindOptions();
    options.filter = "";
    var filter = ["displayName", "addresses"];
    navigator.contacts.find(filter, onSuccess, onError, options);
    

### Stranezze di Android 2. x

*   **pref**: non supportato, tornando `false` su dispositivi Android 2. x.

### BlackBerry 10 capricci

*   **pref**: non è supportato sui dispositivi BlackBerry, restituendo`false`.

*   **tipo**: parzialmente supportati. Solo uno di *lavoro* e *casa* tipo indirizzi può essere memorizzato per ciascun contatto.

*   **formattato**: parzialmente supportati. Restituisce una concatenazione di tutti i campi Indirizzo BlackBerry.

*   **streetAddress**: supportato. Restituisce una concatenazione di BlackBerry **Indirizzo1** e **Indirizzo2** campi indirizzo.

*   **località**: supportato. Memorizzato nel campo indirizzo **città** di BlackBerry.

*   **regione**: supportato. Memorizzato nel campo indirizzo di **stateProvince** BlackBerry.

*   **postalCode**: supportato. Memorizzato nel campo dell'indirizzo **zipPostal** BlackBerry.

*   **paese**: supportato.

### Capricci di FirefoxOS

*   **formattato**: attualmente non supportato

### iOS stranezze

*   **pref**: non è supportato sui dispositivi iOS, restituendo`false`.

*   **formattato**: attualmente non supportati.

### Stranezze di Windows 8

*   **pref**: non supportato

### Stranezze di Windows

*   **pref**: non supportato

## ContactError

L'oggetto `ContactError` viene restituito all'utente tramite la funzione di callback `contactError` quando si verifica un errore.

### Proprietà

*   **codice**: uno dei codici di errore predefiniti elencati di seguito.

### Costanti

*   `ContactError.UNKNOWN_ERROR` (code 0)
*   `ContactError.INVALID_ARGUMENT_ERROR` (code 1)
*   `ContactError.TIMEOUT_ERROR` (code 2)
*   `ContactError.PENDING_OPERATION_ERROR` (code 3)
*   `ContactError.IO_ERROR` (code 4)
*   `ContactError.NOT_SUPPORTED_ERROR` (code 5)
*   `ContactError.PERMISSION_DENIED_ERROR` (code 20)

## ContactField

L'oggetto `ContactField` è un componente riutilizzabile che rappresenta Contatta campi genericamente. Ogni oggetto `ContactField` contiene una proprietà di `value`, `type` e `pref`. Un oggetto `Contact` memorizza diverse proprietà in matrici `[] ContactField`, come numeri di telefono e indirizzi email.

Nella maggior parte dei casi, esistono pre-determinati valori per l'attributo `type` di un oggetto **ContactField**. Ad esempio, un numero di telefono può specificare valori di **type** di *casa*, *lavoro*, *mobile*, *iPhone* o qualsiasi altro valore che è supportato dal database dei contatti su una piattaforma particolare dispositivo. Tuttavia, per il campo di **photo** del `Contacto`, il campo **type** indica il formato dell'immagine restituita: **url** quando il **value** di attributo contiene un URL per l'immagine fotografica, o *base64*, quando il **value** contiene una stringa con codifica base64 immagine.

### Proprietà

*   **tipo**: una stringa che indica il tipo di campo è, *casa* ad esempio. *(DOMString)*

*   **valore**: il valore del campo, ad esempio un telefono numero o indirizzo e-mail. *(DOMString)*

*   **pref**: impostare su `true` se questo `ContactField` contiene il valore dell'utente preferito. *(booleano)*

### Piattaforme supportate

*   Amazon fuoco OS
*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 e 8
*   Windows 8
*   Windows

### Esempio

        // create a new contact
        var contact = navigator.contacts.create();
    
        // store contact phone numbers in ContactField[]
        var phoneNumbers = [];
        phoneNumbers[0] = new ContactField('work', '212-555-1234', false);
        phoneNumbers[1] = new ContactField('mobile', '917-555-5432', true); // preferred number
        phoneNumbers[2] = new ContactField('home', '203-555-7890', false);
        contact.phoneNumbers = phoneNumbers;
    
        // save the contact
        contact.save();
    

### Stranezze Android

*   **pref**: non supportato, restituendo`false`.

### BlackBerry 10 capricci

*   **tipo**: parzialmente supportati. Usato per i numeri di telefono.

*   **valore**: supportato.

*   **pref**: non supportato, restituendo`false`.

### iOS stranezze

*   **pref**: non supportato, restituendo`false`.

### Stranezze di Windows8

*   **pref**: non supportato, restituendo`false`.

### Stranezze di Windows

*   **pref**: non supportato, restituendo`false`.

## ContactName

Contiene diversi tipi di informazioni sul nome di un oggetto `Contact`.

### Proprietà

*   **formattato**: il nome completo del contatto. *(DOMString)*

*   **familyName**: cognome del contatto. *(DOMString)*

*   **givenName**: nome del contatto. *(DOMString)*

*   **middleName**: il nome del contatto medio. *(DOMString)*

*   **honorificPrefix**: prefisso del contatto (esempio *Mr* o *Dr*) *(DOMString)*

*   **honorificSuffix**: suffisso del contatto (esempio *Esq.*). *(DOMString)*

### Piattaforme supportate

*   Amazon fuoco OS
*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 e 8
*   Windows 8
*   Windows

### Esempio

    function onSuccess(contacts) {
        for (var i = 0; i < contacts.length; i++) {
            alert("Formatted: "  + contacts[i].name.formatted       + "\n" +
                "Family Name: "  + contacts[i].name.familyName      + "\n" +
                "Given Name: "   + contacts[i].name.givenName       + "\n" +
                "Middle Name: "  + contacts[i].name.middleName      + "\n" +
                "Suffix: "       + contacts[i].name.honorificSuffix + "\n" +
                "Prefix: "       + contacts[i].name.honorificSuffix);
        }
    };
    
    function onError(contactError) {
        alert('onError!');
    };
    
    var options = new ContactFindOptions();
    options.filter = "";
    filter = ["displayName", "name"];
    navigator.contacts.find(filter, onSuccess, onError, options);
    

### Stranezze Android

*   **formattato**: parzialmente supportati e di sola lettura. Restituisce una concatenazione di `honorificPrefix` , `givenName` , `middleName` , `familyName` , e`honorificSuffix`.

### BlackBerry 10 capricci

*   **formattato**: parzialmente supportati. Restituisce una concatenazione di campi **firstName** e **lastName** BlackBerry.

*   **familyName**: supportato. Archiviato in campo **lastName** BlackBerry.

*   **givenName**: supportato. Archiviato in campo **firstName** BlackBerry.

*   **middleName**: non supportato, restituendo`null`.

*   **honorificPrefix**: non supportato, restituendo`null`.

*   **honorificSuffix**: non supportato, restituendo`null`.

### Capricci di FirefoxOS

*   **formattato**: parzialmente supportati e di sola lettura. Restituisce una concatenazione di `honorificPrefix` , `givenName` , `middleName` , `familyName` , e`honorificSuffix`.

### iOS stranezze

*   **formattato**: parzialmente supportati. Restituisce il nome composito di iOS, ma è di sola lettura.

### Stranezze di Windows 8

*   **formattato**: questo è l'unico nome proprietà ed è identico a `displayName` , e`nickname`

*   **familyName**: non supportato

*   **givenName**: non supportato

*   **middleName**: non supportato

*   **honorificPrefix**: non supportato

*   **honorificSuffix**: non supportato

### Stranezze di Windows

*   **formattato**: esso è identico al`displayName`

## ContactOrganization

L'oggetto `ContactOrganization` memorizza la proprietà di organizzazione di un contatto. Un oggetto `Contact` memorizza uno o più oggetti `ContactOrganization` in una matrice.

### Proprietà

*   **pref**: impostare su `true` se questo `ContactOrganization` contiene il valore dell'utente preferito. *(booleano)*

*   **tipo**: una stringa che indica il tipo di campo è, *casa* ad esempio. _(DOMString)

*   **nome**: il nome dell'organizzazione. *(DOMString)*

*   **dipartimento**: contratto lavora per il dipartimento. *(DOMString)*

*   **titolo**: titolo del contatto presso l'organizzazione. *(DOMString)*

### Piattaforme supportate

*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 e 8
*   Windows (solo dispositivi Windows 8.1 e 8.1 di Windows Phone)

### Esempio

    function onSuccess(contacts) {
        for (var i = 0; i < contacts.length; i++) {
            for (var j = 0; j < contacts[i].organizations.length; j++) {
                alert("Pref: "      + contacts[i].organizations[j].pref       + "\n" +
                    "Type: "        + contacts[i].organizations[j].type       + "\n" +
                    "Name: "        + contacts[i].organizations[j].name       + "\n" +
                    "Department: "  + contacts[i].organizations[j].department + "\n" +
                    "Title: "       + contacts[i].organizations[j].title);
            }
        }
    };
    
    function onError(contactError) {
        alert('onError!');
    };
    
    var options = new ContactFindOptions();
    options.filter = "";
    filter = ["displayName", "organizations"];
    navigator.contacts.find(filter, onSuccess, onError, options);
    

### Stranezze di Android 2. x

*   **pref**: non supportato dai dispositivi Android 2. x, restituendo`false`.

### BlackBerry 10 capricci

*   **pref**: non supportato dai dispositivi BlackBerry, restituendo`false`.

*   **tipo**: non supportato dai dispositivi BlackBerry, restituendo`null`.

*   **nome**: parzialmente supportati. Il primo nome dell'organizzazione è memorizzato nel campo **azienda** BlackBerry.

*   **dipartimento**: non supportato, restituendo`null`.

*   **titolo**: parzialmente supportati. Il primo titolo di organizzazione è memorizzato nel campo **jobTitle** BlackBerry.

### Firefox OS stranezze

*   **pref**: non supportato

*   **tipo**: non supportato

*   **dipartimento**: non supportato

*   Campi **nome** e **titolo** memorizzato in **org** e **jobTitle**.

### iOS stranezze

*   **pref**: non è supportato sui dispositivi iOS, restituendo`false`.

*   **tipo**: non è supportato sui dispositivi iOS, restituendo`null`.

*   **nome**: parzialmente supportati. Il primo nome dell'organizzazione è memorizzato nel campo **kABPersonOrganizationProperty** iOS.

*   **dipartimento**: parzialmente supportati. Il primo nome del dipartimento è memorizzato nel campo **kABPersonDepartmentProperty** iOS.

*   **titolo**: parzialmente supportati. Il primo titolo è memorizzato nel campo **kABPersonJobTitleProperty** iOS.

### Stranezze di Windows

*   **pref**: non supportato, restituendo`false`.

*   **tipo**: non supportato, restituendo`null`.
