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

# org.apache.cordova.contacts

Ermöglicht den Zugriff auf die Kontaktdatenbank Gerät.

**Warnung**: Erhebung und Nutzung von Kontaktdaten löst wichtige Datenschutzprobleme. Ihre app-Datenschutzerklärung sollten besprechen, wie die app Kontaktdaten verwendet und ob es mit irgendwelchen anderen Parteien geteilt wird. Kontaktinformationen ist als vertraulich angesehen, weil es die Menschen zeigt, mit denen eine Person kommuniziert. Daher neben der app-Privacy Policy sollten stark Sie Bereitstellung einer just-in-Time-Bekanntmachung, bevor die app zugreift oder Kontaktdaten verwendet, wenn das Betriebssystem des Geräts bereits tun nicht. Diese Benachrichtigung sollte der gleichen Informationen, die vorstehend, sowie die Zustimmung des Benutzers (z.B. durch Präsentation Entscheidungen für das **OK** und **Nein danke**). Beachten Sie, dass einige app-Marktplätze die app eine Frist eine just-in-Time und erhalten die Erlaubnis des Benutzers vor dem Zugriff auf Kontaktdaten verlangen können. Eine klare und leicht verständliche Benutzererfahrung rund um die Verwendung der Kontakt-Daten Benutzer Verwirrung zu vermeiden können und wahrgenommene Missbrauch der Kontaktdaten. Weitere Informationen finden Sie in der Datenschutz-Guide.

## Installation

    cordova plugin add org.apache.cordova.contacts
    

### Firefox OS Macken

Erstellen Sie **www/manifest.webapp** , wie in [Docs Manifest][1]beschrieben. Fügen Sie die entsprechenden Permisions. Es muss auch die Webapp um "privilegierte" - [Manifest Docs][2]ändern. **Warnung**: alle privilegierten apps [Content Security Policy][3] , welche Inlineskript verbietet zu erzwingen. Initialisieren Sie die Anwendung auf andere Weise.

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
    

### Windows-Eigenheiten

Alle Kontakte von zurückgegebenen `find` und `pickContact` Methoden sind schreibgeschützt, so dass sie von die Anwendung nicht geändert werden kann. `find`Methode nur auf Windows Phone 8.1-Geräten verfügbar.

### Windows 8 Macken

Windows 8 Kontakte sind Readonly. Über die Cordova-API-Kontakte nicht abgefragt werden/können durchsucht werden, Sie sollten den Benutzer informieren, wählen Sie einen Kontakt als Aufruf an contacts.pickContact, die 'People'-app öffnet, wo muss der Benutzer einen Kontakt auswählen. Alle zurückgegebenen Kontakte sind Readonly, so dass sie von die Anwendung nicht geändert werden kann.

## Navigator.Contacts

### Methoden

*   navigator.contacts.create
*   navigator.contacts.find
*   navigator.contacts.pickContact

### Objekte

*   Kontakt
*   ContactName
*   ContactField
*   ContactAddress
*   ContactOrganization
*   ContactFindOptions
*   ContactError
*   ContactFieldType

## Navigator.Contacts.Create

Die `navigator.contacts.create` Methode ist synchron und gibt eine neue `Contact` Objekt.

Diese Methode behält nicht das Kontakt-Objekt in der Gerät-Kontakte-Datenbank, wofür Sie aufrufen müssen der `Contact.save` Methode.

### Unterstützte Plattformen

*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 und 8

### Beispiel

    var myContact = navigator.contacts.create({"displayName": "Test User"});
    

## navigator.contacts.find

Die `navigator.contacts.find` Methode wird asynchron ausgeführt, Abfragen der Gerät-Kontakte-Datenbank und gibt ein Array von `Contact` Objekten. Die resultierenden Objekte werden an übergeben die `contactSuccess` Callback-Funktion, die durch den **ContactSuccess** -Parameter angegeben.

Der **ContactFields** -Parameter gibt die Felder als Qualifizierer Suche verwendet werden. Ein leere **ContactFields** -Parameter ist ungültig und führt zu `ContactError.INVALID_ARGUMENT_ERROR` . **ContactFields** der Wert `"*"` gibt alle Kontaktfelder.

Die **contactFindOptions.filter** -Zeichenfolge kann als einen Suchfilter verwendet, wenn die Kontaktdatenbank Abfragen. Wenn angeboten, ein groß-und Kleinschreibung, wird jedes Feld in der **ContactFields** -Parameter angegebenen Teilwert Übereinstimmung. Wenn eine Übereinstimmung für *alle* angegebenen Felder vorliegt, wird der Kontakt zurückgegeben. Verwendung **contactFindOptions.desiredFields** Parameter steuern, welche Eigenschaften kontaktieren muss wieder zurückgegeben werden.

### Parameter

*   **ContactSuccess**: Erfolg-Callback-Funktion aufgerufen, die mit dem Array von Contact-Objekte aus der Datenbank zurückgegeben. [Erforderlich]

*   **ContactError**: Fehler-Callback-Funktion wird aufgerufen, wenn ein Fehler auftritt. [Optional]

*   **ContactFields**: Kontaktfelder als Qualifizierer Suche verwenden. *(DOMString[])* [Erforderlich]

*   **ContactFindOptions**: Optionen zum Filtern von navigator.contacts zu suchen. [Optional] Schlüssel enthalten:

*   **Filter**: die zu suchende Zeichenfolge verwendet, um navigator.contacts zu finden. *(DOM-String und enthält)* (Standard:`""`)

*   **mehrere**: bestimmt, ob der Suchvorgang mehrere navigator.contacts gibt. *(Boolesch)* (Standard:`false`)
    
    *   **DesiredFields**: Kontaktfelder wieder zurückgegeben werden. Wenn angegeben, die sich daraus ergebende `Contact` Objekt verfügt nur über Werte für diese Felder. *(DOMString[])* [Optional]

### Unterstützte Plattformen

*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 und 8
*   Windows (nur Windows Phone 8.1-Geräte)

### Beispiel

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
    

### Windows-Eigenheiten

*   `__contactFields__`wird nicht unterstützt und wird ignoriert. `find`Methode wird immer versucht, die Namen, e-Mail-Adresse oder Telefonnummer eines Kontakts übereinstimmen.

## navigator.contacts.pickContact

Die `navigator.contacts.pickContact` -Methode startet im Kontakt Farbwähler wählen Sie einen einzigen Ansprechpartner. Das resultierende Objekt wird übergeben, um die `contactSuccess` Callback-Funktion, die durch den **ContactSuccess** -Parameter angegeben.

### Parameter

*   **ContactSuccess**: Erfolg-Callback-Funktion, die mit den einzelnen Kontakt-Objekt aufgerufen. [Erforderlich]

*   **ContactError**: Fehler-Callback-Funktion wird aufgerufen, wenn ein Fehler auftritt. [Optional]

### Unterstützte Plattformen

*   Android
*   iOS
*   Windows Phone 8
*   Windows 8
*   Windows

### Beispiel

    navigator.contacts.pickContact(function(contact){
            console.log('The following contact has been selected:' + JSON.stringify(contact));
        },function(err){
            console.log('Error: ' + err);
        });
    

## Kontakt

Das `Contact` -Objekt repräsentiert einen Benutzer Kontakt. Kontakte können erstellt, gespeichert oder aus der Gerät-Kontakte-Datenbank entfernt werden. Kontakte können auch abgerufen werden (einzeln oder als Gruppe) aus der Datenbank durch den Aufruf der `navigator.contacts.find` Methode.

**Hinweis**: nicht alle oben aufgeführten Kontaktfelder werden auf jedes Geräteplattform unterstützt. Bitte überprüfen Sie jede Plattform *Quirks* Abschnitt für Details.

### Eigenschaften

*   **ID**: einen globally unique Identifier. *(DOM-String und enthält)*

*   **DisplayName**: der Name dieses Kontakts, geeignet für die Anzeige für Endbenutzer. *(DOM-String und enthält)*

*   **Name**: ein Objekt, das alle Komponenten eines Personen-Namen enthält. *(Kontaktperson)*

*   **Nickname**: einen lässig ein, um den Kontakt zu adressieren. *(DOM-String und enthält)*

*   **Telefonnummern**: ein Array von der Kontakt-Telefonnummern. *(ContactField[])*

*   **Email**: ein Array von e-Mail-Adressen des Kontakts. *(ContactField[])*

*   **Adressen**: ein Array von allen Kontaktadressen. *(ContactAddress[])*

*   **IMS**: ein Array von IM-Adressen des Kontakts. *(ContactField[])*

*   **Organisationen**: ein Array von Organisationen des Kontakts. *(ContactOrganization[])*

*   **Geburtstag**: der Geburtstag des Kontakts. *(Datum)*

*   **Anmerkung**: eine Anmerkung über den Kontakt. *(DOM-String und enthält)*

*   **Fotos**: ein Array mit den Kontakt-Fotos. *(ContactField[])*

*   **Kategorien**: ein Array mit allen benutzerdefinierten Kategorien zugeordnet den Kontakt. *(ContactField[])*

*   **URLs**: ein Array von Web-Seiten, die den Kontakt zugeordnet. *(ContactField[])*

### Methoden

*   **Klon**: gibt eine neue `Contact` Objekt, das eine tiefe Kopie des aufrufenden Objekts, mit der `id` -Eigenschaft festgelegt`null`.

*   **Entfernen**: entfernt den Kontakt aus der Gerät-Kontakte-Datenbank, ansonsten führt eine Fehler-Callback mit einem `ContactError` Objekt.

*   **Speichern**: speichert einen neuen Kontakt in der Gerätedatenbank Kontakte, oder einen vorhandenen Kontakt aktualisiert, wenn ein Kontakt mit der gleichen **Id** bereits vorhanden ist.

### Unterstützte Plattformen

*   Amazon Fire OS
*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 und 8
*   Windows 8
*   Windows

### Speichern Sie Beispiel

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
    

### Clone-Beispiel

        // clone the contact object
        var clone = contact.clone();
        clone.name.givenName = "John";
        console.log("Original contact name = " + contact.name.givenName);
        console.log("Cloned contact name = " + clone.name.givenName);
    

### Beispiel zu entfernen

    function onSuccess() {
        alert("Removal Success");
    };
    
    function onError(contactError) {
        alert("Error = " + contactError.code);
    };
    
    // remove the contact from the device
    contact.remove(onSuccess,onError);
    

### Android 2.X Macken

*   **Kategorien**: Android 2.X Geräten, Rückgabe nicht unterstützt`null`.

### BlackBerry 10 Macken

*   **ID**: vom Gerät zugewiesen werden, wenn den Kontakt zu speichern.

### FirefoxOS Macken

*   **Kategorien**: teilweise unterstützt. Felder **Pref** und **Typ** kehren zurück`null`

*   **IMS**: nicht unterstützt

*   **Fotos**: nicht unterstützt

### iOS Macken

*   **DisplayName**: nicht auf iOS, Rückkehr unterstützt `null` es sei kein `ContactName` angegeben, in welchem Fall es gibt den zusammengesetzten Namen, **Spitznamen** oder `""` bzw..

*   **Geburtstag**: muss eingegeben werden, als JavaScript `Date` Objekt, die gleiche Weise zurückgegeben wird.

*   **Fotos**: gibt einen Datei-URL auf das Bild, das im temporären Verzeichnis der Anwendung gespeichert ist. Inhalt des temporären Verzeichnisses werden entfernt, wenn die Anwendung beendet wird.

*   **Kategorien**: Diese Eigenschaft wird derzeit nicht unterstützt, Rückgabe`null`.

### Windows Phone 7 und 8 Macken

*   **DisplayName**: Wenn Sie einen Kontakt erstellen, der Nutzen für den Anzeigenamen der Display-Name-Parameter unterscheidet abgerufen, wenn den Kontakt zu finden.

*   **URLs**: Wenn Sie einen Kontakt erstellen, können Benutzer eingegeben und mehrere Web-Adressen zu speichern, aber nur einer ist verfügbar, wenn Sie den Kontakt zu suchen.

*   **Telefonnummern**: die *Pref* -Option wird nicht unterstützt. Der *Typ* wird in eine *find* -Operation nicht unterstützt. Nur ein `phoneNumber` ist erlaubt für jeden *Typ*.

*   **Email**: *Pref* -Option wird nicht unterstützt. Haus und persönliche verweist auf dasselbe e-Mail-Eintrag. Nur ein Eintrag ist für jeden *Typ* zulässig..

*   **Adressen**: unterstützt nur Arbeit und Home/persönliche *Art*. Den gleichen Adresseintrag auf den privaten und persönlichen *Typ* verweisen. Nur ein Eintrag ist für jeden *Typ* zulässig..

*   **Organisationen**: nur zulässig ist, und unterstützt nicht die Attribute *Pref*, *Typ*und *Abteilung* .

*   **Hinweis**: nicht unterstützt, Rückgabe`null`.

*   **IMS**: nicht unterstützt, Rückgabe`null`.

*   **Geburtstage**: nicht unterstützt, Rückgabe`null`.

*   **Kategorien**: nicht unterstützt, Rückgabe`null`.

### Windows-Eigenheiten

*   **Fotos**: gibt einen Datei-URL auf das Bild, das im temporären Verzeichnis der Anwendung gespeichert ist.

*   **Geburtstage**: nicht unterstützt, Rückgabe`null`.

*   **Kategorien**: nicht unterstützt, Rückgabe`null`.

## ContactAddress

Das `ContactAddress` -Objekt speichert die Eigenschaften einer einzelnen Adresse eines Kontakts. A `Contact` Objekt gehören mehr als eine Adresse in ein `ContactAddress[]` Array.

### Eigenschaften

*   **Pref**: Legen Sie auf `true` Wenn dieses `ContactAddress` des Benutzers bevorzugten Wert enthält. *(boolesch)*

*   **Typ**: eine Zeichenfolge, die angibt, welche Art von Feld in diesem *Hause* zum Beispiel. *(DOM-String und enthält)*

*   **formatiert**: die vollständige Adresse, die für die Anzeige formatiert. *(DOM-String und enthält)*

*   **StreetAddress**: die vollständige Postanschrift. *(DOM-String und enthält)*

*   **Ort**: die Stadt oder Gemeinde. *(DOM-String und enthält)*

*   **Region**: dem Staat oder der Region. *(DOM-String und enthält)*

*   **Postleitzahl**: die Postleitzahl oder Postleitzahl. *(DOM-String und enthält)*

*   **Land**: den Ländernamen. *(DOM-String und enthält)*

### Unterstützte Plattformen

*   Amazon Fire OS
*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 und 8
*   Windows 8
*   Windows

### Beispiel

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
    

### Android 2.X Macken

*   **Pref**: nicht unterstützt, Rückkehr `false` auf Android 2.X Geräten.

### BlackBerry 10 Macken

*   **Pref**: BlackBerry-Geräten, Rückgabe nicht unterstützt`false`.

*   **Typ**: teilweise unterstützt. Nur eine *Arbeit* und *Home* Typ Adressen kann pro Kontakt gespeichert werden.

*   **formatiert**: teilweise unterstützt. Gibt eine Verkettung von allen BlackBerry-Adressfelder.

*   **StreetAddress**: unterstützt. Gibt eine Verkettung von BlackBerry **Adresse1** und **Adresse2** Adressfelder.

*   **Ort**: unterstützt. Gespeichert in BlackBerry **Stadt** Adressfeld.

*   **Region**: unterstützt. Gespeichert in BlackBerry **StateProvince** Adressfeld.

*   **Postleitzahl**: unterstützt. Im Feld für die Adresse des BlackBerry- **ZipPostal** gespeichert.

*   **Land**: unterstützt.

### FirefoxOS Macken

*   **formatiert**: derzeit nicht unterstützt

### iOS Macken

*   **Pref**: iOS-Geräten, Rückgabe nicht unterstützt`false`.

*   **formatiert**: derzeit nicht unterstützt.

### Windows 8 Macken

*   **Pref**: nicht unterstützt

### Windows-Eigenheiten

*   **Pref**: nicht unterstützt

## ContactError

Das `ContactError` -Objekt wird zurückgegeben, die der Benutzer über die `contactError` Callback-Funktion, wenn ein Fehler auftritt.

### Eigenschaften

*   **Code**: einer der vordefinierten Fehlercodes aufgeführt.

### Konstanten

*   `ContactError.UNKNOWN_ERROR` (code 0)
*   `ContactError.INVALID_ARGUMENT_ERROR` (code 1)
*   `ContactError.TIMEOUT_ERROR` (code 2)
*   `ContactError.PENDING_OPERATION_ERROR` (code 3)
*   `ContactError.IO_ERROR` (code 4)
*   `ContactError.NOT_SUPPORTED_ERROR` (code 5)
*   `ContactError.PERMISSION_DENIED_ERROR` (code 20)

## ContactField

Das `ContactField` -Objekt ist eine wieder verwendbare Komponenten stellt Felder generisch kontaktieren. Jeder `ContactField` -Objekt enthält eine `value` , `type` , und `pref` Eigenschaft. A `Contact` -Objekt speichert mehrere Eigenschaften in `ContactField[]` -Arrays, wie Telefon-Nummern und e-Mail-Adressen.

In den meisten Fällen gibt es keine vorher festgelegten Werte für ein `ContactField` **Typ** -Attribut des Objekts. Beispielsweise kann eine Telefonnummer angeben **Typwerte von *Zuhause*, *arbeiten*, *mobile*, *iPhone*oder ein beliebiger anderer Wert, der von einem bestimmten Geräteplattform Kontaktdatenbank unterstützt wird** . Jedoch für die `Contact` **Fotos** Feld, das **Typ** -Feld gibt das Format des zurückgegebenen Bild: **Url** wenn das **Value** -Attribut eine URL zu dem Foto Bild oder *base64* , enthält Wenn der **Wert** eine base64-codierte Bild-Zeichenfolge enthält.

### Eigenschaften

*   **Typ**: eine Zeichenfolge, die angibt, welche Art von Feld in diesem *Hause* zum Beispiel. *(DOM-String und enthält)*

*   **Wert**: der Wert des Feldes, wie z. B. eine Telefonnummer oder e-Mail-Adresse. *(DOM-String und enthält)*

*   **Pref**: Legen Sie auf `true` Wenn dieses `ContactField` des Benutzers bevorzugten Wert enthält. *(boolesch)*

### Unterstützte Plattformen

*   Amazon Fire OS
*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 und 8
*   Windows 8
*   Windows

### Beispiel

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
    

### Android Macken

*   **Pref**: nicht unterstützt, Rückgabe`false`.

### BlackBerry 10 Macken

*   **Typ**: teilweise unterstützt. Für Telefonnummern verwendet.

*   **Wert**: unterstützt.

*   **Pref**: nicht unterstützt, Rückgabe`false`.

### iOS Macken

*   **Pref**: nicht unterstützt, Rückgabe`false`.

### Windows8 Macken

*   **Pref**: nicht unterstützt, Rückgabe`false`.

### Windows-Eigenheiten

*   **Pref**: nicht unterstützt, Rückgabe`false`.

## ContactName

Enthält verschiedene Arten von Informationen über ein `Contact` Name des Objekts.

### Eigenschaften

*   **formatiert**: den vollständigen Namen des Kontakts. *(DOM-String und enthält)*

*   **Nachname**: Familienname des Kontakts. *(DOM-String und enthält)*

*   **GivenName**: Given Name des Kontaktes. *(DOM-String und enthält)*

*   **MiddleName**: Middle Name des Kontaktes. *(DOM-String und enthält)*

*   **HonorificPrefix**: der Kontakt-Präfix (z.B. *Mr.* oder *Dr.*) *(DOM-String und enthält)*

*   **HonorificSuffix**: der Kontakt-Suffix (Beispiel *Esq.*). *(DOM-String und enthält)*

### Unterstützte Plattformen

*   Amazon Fire OS
*   Android 2.X
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 und 8
*   Windows 8
*   Windows

### Beispiel

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
    

### Android Macken

*   **formatiert**: teilweise unterstützte "und" Read-only. Gibt eine Verkettung von `honorificPrefix` , `givenName` , `middleName` , `familyName` , und`honorificSuffix`.

### BlackBerry 10 Macken

*   **formatiert**: teilweise unterstützt. Gibt eine Verkettung von BlackBerry- **FirstName** und **LastName** -Feldern.

*   **Nachname**: unterstützt. Im Feld der BlackBerry- **Nachname** gespeichert.

*   **GivenName**: unterstützt. Im BlackBerry **FirstName** -Feld gespeichert.

*   **MiddleName**: nicht unterstützt, Rückgabe`null`.

*   **HonorificPrefix**: nicht unterstützte, Rückgabe`null`.

*   **HonorificSuffix**: nicht unterstützte, Rückgabe`null`.

### FirefoxOS Macken

*   **formatiert**: teilweise unterstützte "und" Read-only. Gibt eine Verkettung von `honorificPrefix` , `givenName` , `middleName` , `familyName` , und`honorificSuffix`.

### iOS Macken

*   **formatiert**: teilweise unterstützt. IOS zusammengesetzten Namen gibt, aber ist schreibgeschützt.

### Windows 8 Macken

*   **formatiert**: Dies ist die einzige Eigenschaft, und ist identisch mit `displayName` , und`nickname`

*   **Nachname**: nicht unterstützt

*   **GivenName**: nicht unterstützt

*   **MiddleName**: nicht unterstützt

*   **HonorificPrefix**: nicht unterstützt

*   **HonorificSuffix**: nicht unterstützt

### Windows-Eigenheiten

*   **formatiert**: Er ist identisch mit`displayName`

## ContactOrganization

Das `ContactOrganization` -Objekt speichert Organisationseigenschaften eines Kontakts. A `Contact` -Objekt speichert eine oder mehrere `ContactOrganization` Objekte in einem Array.

### Eigenschaften

*   **Pref**: Legen Sie auf `true` Wenn dieses `ContactOrganization` des Benutzers bevorzugten Wert enthält. *(boolesch)*

*   **Typ**: eine Zeichenfolge, die angibt, welche Art von Feld in diesem *Hause* zum Beispiel. _(DOMString)

*   **Name**: der Name der Organisation. *(DOM-String und enthält)*

*   **Abteilung**: die Abteilung, die der Vertrag für arbeitet. *(DOM-String und enthält)*

*   **Titel**: Titel des Kontakts in der Organisation. *(DOM-String und enthält)*

### Unterstützte Plattformen

*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 und 8
*   Windows (nur Windows-8.1 und Windows Phone 8.1-Geräte)

### Beispiel

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
    

### Android 2.X Macken

*   **Pref**: von Android 2.X-Geräte, Rückgabe nicht unterstützt`false`.

### BlackBerry 10 Macken

*   **Pref**: von BlackBerry-Geräten zurückgeben nicht unterstützt`false`.

*   **Typ**: von BlackBerry-Geräten zurückgeben nicht unterstützt`null`.

*   **Name**: teilweise unterstützt. Der Name der ersten Organisation wird im Feld **Firma** BlackBerry gespeichert.

*   **Abteilung**: nicht unterstützt, Rückgabe`null`.

*   **Titel**: teilweise unterstützt. Der erste Titel der Organisation wird im Feld **JobTitle** BlackBerry gespeichert.

### Firefox OS Macken

*   **Pref**: nicht unterstützt

*   **Typ**: nicht unterstützt

*   **Abteilung**: nicht unterstützt

*   Felder **Name** und **Titel** in **Org** und **JobTitle** gespeichert.

### iOS Macken

*   **Pref**: iOS-Geräten, Rückgabe nicht unterstützt`false`.

*   **Typ**: iOS-Geräten, Rückgabe nicht unterstützt`null`.

*   **Name**: teilweise unterstützt. Der Name der ersten Organisation wird im Feld **kABPersonOrganizationProperty** iOS gespeichert.

*   **Abteilung**: teilweise unterstützt. Die Abteilungsnamen der erste ist im Feld **kABPersonDepartmentProperty** iOS gespeichert.

*   **Titel**: teilweise unterstützt. Der erste Titel wird im Feld **kABPersonJobTitleProperty** iOS gespeichert.

### Windows-Eigenheiten

*   **Pref**: nicht unterstützt, Rückgabe`false`.

*   **Typ**: nicht unterstützt, Rückgabe`null`.