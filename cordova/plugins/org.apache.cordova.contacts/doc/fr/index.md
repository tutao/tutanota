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

Donne accès à la base de données de contacts de dispositif.

**Avertissement**: collecte et utilisation des données de contact soulève des questions importantes de la vie privée. La politique de confidentialité de votre application doit examiner comment l'application utilise les données de contact et si elles sont partagées avec d'autres parties. Les information de contact sont considérés comme sensibles parce qu'elles révèlent les gens avec lesquels une personne communique. Par conséquent, en plus de la politique de confidentialité de l'application, vous devez envisager fortement fournissant un avis juste-à-temps, avant que l'application accède ou utilise des données de contact, si le système d'exploitation de périphérique ne fait donc pas déjà. Cet avis doit fournir les mêmes renseignements mentionnés précédemment, ainsi qu'obtenir l'autorisation de l'utilisateur (par exemple, en présentant des choix **OK** et **Non merci**). Notez que certains marchés app peuvent exiger l'application de fournir un avis juste-à-temps et obtenir la permission de l'utilisateur avant d'accéder à des données de contact. Une expérience utilisateur claire et facile à comprendre qui entourent l'utilisation de données permettent d'éviter la confusion des utilisateurs de contact et une utilisation jugée abusive des données de contact. Pour plus d'informations, consultez le Guide de la vie privée.

## Installation

    cordova plugin add org.apache.cordova.contacts
    

### Firefox OS Quirks

Créez **www/manifest.webapp** comme décrit dans [Les Docs manifeste][1]. Ajouter permisions pertinentes. Il est également nécessaire de changer le type d'application Web de « privilégiés » - [Docs manifeste][2]. **Avertissement**: toutes les applications privilégiées appliquer [Contenu politique de sécurité][3] qui interdit à un script inline. Initialiser votre application d'une autre manière.

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
    

### Bizarreries de Windows 8

Windows 8 Contacts sont en lecture seule. Via les Contacts d'API Cordova ne sont pas queryable/consultables, vous devez en informer l'utilisateur de choisir un contact comme un appel à contacts.pickContact qui va ouvrir l'application « People » où l'utilisateur doit choisir un contact. Les contacts retournés sont en lecture seule, afin que votre application ne puisse les modifier.

## Navigator.contacts

### Méthodes

*   navigator.contacts.create
*   navigator.contacts.find
*   navigator.contacts.pickContact

### Objets

*   Contact
*   ContactName
*   ContactField
*   ContactAddress
*   ContactOrganization
*   ContactFindOptions
*   ContactError
*   ContactFieldType

## Navigator.contacts.Create

La `navigator.contacts.create` méthode est synchrone et retourne un nouveau `Contact` objet.

Cette méthode ne conserve pas l'objet de Contact dans la base de données des contacts périphériques, dont vous avez besoin d'appeler le `Contact.save` méthode.

### Plates-formes prises en charge

*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 et 8

### Exemple

    var myContact = navigator.contacts.create({"displayName": "Test User"});
    

## navigator.contacts.find

La `navigator.contacts.find` méthode s'exécute de façon asynchrone, l'interrogation de la base de données de contacts de dispositif et retourne un tableau de `Contact` objets. Les objets résultants sont passés à la `contactSuccess` la fonction de rappel spécifiée par le paramètre **contactSuccess** .

Le paramètre **contactFields** spécifie les champs à utiliser comme un qualificateur de recherche. Un paramètre de longueur nulle **contactFields** n'est pas valide et se traduit par `ContactError.INVALID_ARGUMENT_ERROR` . Une valeur de **contactFields** de `"*"` retourne les champs de tout contact.

La chaîne **contactFindOptions.filter** peut servir comme un filtre de recherche lors de l'interrogation de la base de données de contacts. Si fourni, un non-respect de la casse, correspondance de valeur partielle est appliquée à chaque champ spécifié dans le paramètre **contactFields** . S'il y a une correspondance pour *n'importe quel* des champs spécifiés, le contact est retourné. Utilisation **contactFindOptions.desiredFields** paramètre de contrôle qui contacter propriétés doit être retourné au retour.

### Paramètres

*   **contactSuccess**: fonction de rappel de succès avec le tableau d'objets Contact appelée retournée par la base de données. [Obligatoire]

*   **contactError**: fonction de rappel d'erreur, appelée lorsqu'une erreur se produit. [Facultatif]

*   **contactFields**: communiquer avec les champs à utiliser comme un qualificateur de recherche. *(DOMString[])* [Obligatoire]

*   **contactFindOptions**: recherche d'options pour filtrer navigator.contacts. [Facultatif] Clés incluent :

*   **filtre**: la chaîne de recherche utilisée pour trouver navigator.contacts. *(DOMString)* (Par défaut :`""`)

*   **multiples**: détermine si l'opération find retourne plusieurs navigator.contacts. *(Booléen)* (Par défaut :`false`)
    
    *   **desiredFields**: Contactez champs soit retourné en arrière. Si spécifié, l'entraînant `Contact` objet dispose seulement des valeurs de ces champs. *(DOMString[])* [Facultatif]

### Plates-formes prises en charge

*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 et 8

### Exemple

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
    

## navigator.contacts.pickContact

La `navigator.contacts.pickContact` méthode lance le sélecteur de Contact pour sélectionner un contact unique. L'objet qui en résulte est passé à la `contactSuccess` la fonction de rappel spécifiée par le paramètre **contactSuccess** .

### Paramètres

*   **contactSuccess**: fonction de rappel de succès appelée avec l'objet de Contact unique. [Obligatoire]

*   **contactError**: fonction de rappel d'erreur, appelée lorsqu'une erreur se produit. [Facultatif]

### Plates-formes prises en charge

*   Android
*   iOS
*   Windows Phone 8
*   Windows 8

### Exemple

    navigator.contacts.pickContact(function(contact){
            console.log('The following contact has been selected:' + JSON.stringify(contact));
        },function(err){
            console.log('Error: ' + err);
        });
    

## Contact

Le `Contact` objet représente le contact de l'utilisateur. Contacts peuvent être créés, conservés ou supprimés de la base de données de contacts de dispositif. Contacts peuvent également être récupérées (individuellement ou en vrac) de la base de données en appelant le `navigator.contacts.find` méthode.

**NOTE**: tous les champs de contact susmentionnés ne sont pris en charge sur chaque plate-forme de périphérique. S'il vous plaît vérifier la section *bizarreries* de chaque plate-forme pour plus de détails.

### Propriétés

*   **ID**: un identificateur global unique. *(DOMString)*

*   **displayName**: le nom de ce Contact, approprié pour l'affichage à l'utilisateur final. *(DOMString)*

*   **nom**: un objet contenant tous les composants d'un nom de personnes. *(ContactName)*

*   **Pseudo**: un nom occasionnel permettant de régler le contact. *(DOMString)*

*   **phoneNumbers**: un tableau des numéros de téléphone du contact. *(ContactField[])*

*   **courriels**: un tableau d'adresses de courriel du contact. *(ContactField[])*

*   **adresses**: un tableau d'adresses tous les contacts. *(ContactAddress[])*

*   **IMS**: un tableau d'adresses IM tout le contact. *(ContactField[])*

*   **organisations**: un tableau des organisations de tout le contact. *(ContactOrganization[])*

*   **anniversaire**: l'anniversaire du contact. *(Date)*

*   **Remarque**: une remarque sur le contact. *(DOMString)*

*   **photos**: un tableau de photos du contact. *(ContactField[])*

*   **catégories**: un tableau de toutes les catégories définies par l'utilisateur attribuée au contact. *(ContactField[])*

*   **URL**: un tableau des pages web attribuée au contact. *(ContactField[])*

### Méthodes

*   **Clone**: retourne un nouveau `Contact` objet qui est une copie complète de l'objet appelant, avec le `id` propriété la valeur`null`.

*   **supprimer**: supprime le contact de la base de données de contacts de dispositif, sinon exécute un rappel d'erreur avec un `ContactError` objet.

*   **Enregistrer**: enregistre un nouveau contact dans la base de données de contacts de périphérique, ou met à jour un contact existant, si un contact avec le même **id** existe déjà.

### Plates-formes prises en charge

*   Amazon Fire OS
*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 et 8
*   Windows 8

### Enregistrez l'exemple

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
    

### Exemple de clone

        // clone the contact object
        var clone = contact.clone();
        clone.name.givenName = "John";
        console.log("Original contact name = " + contact.name.givenName);
        console.log("Cloned contact name = " + clone.name.givenName);
    

### Supprimer l'exemple

    function onSuccess() {
        alert("Removal Success");
    };
    
    function onError(contactError) {
        alert("Error = " + contactError.code);
    };
    
    // remove the contact from the device
    contact.remove(onSuccess,onError);
    

### Android 2.X Quirks

*   **catégories**: non pris en charge sur les périphériques Android 2.X, retour`null`.

### BlackBerry 10 Quirks

*   **ID**: assignés par l'appareil lors de l'enregistrement du contact.

### Bizarreries de FirefoxOS

*   **catégories**: partiellement pris en charge. Champs **pref** et **type** sont de retour`null`

*   **IMS**: non pris en charge

*   **photos**: ne pas pris en charge

### iOS Quirks

*   **displayName**: ne pas possible sur iOS, retour `null` à moins qu'il n'y a aucun `ContactName` spécifié, auquel cas, il renvoie le nom composite, **Pseudo** ou `""` , respectivement.

*   **anniversaire**: doit être entré comme un JavaScript `Date` objet, de la même façon qu'il soit retourné.

*   **photos**: retourne une URL de fichier de l'image, qui est stocké dans le répertoire temporaire de l'application. Contenu du répertoire temporaire est supprimés lorsque l'application se ferme.

*   **catégories**: cette propriété n'est actuellement pas supportée, retour`null`.

### Windows Phone 7 et 8 Quirks

*   **displayName**: lorsque vous créez un contact, la valeur fournie pour le paramètre de nom d'affichage est différent de l'affichage nom Récupérée lors de la recherche du contact.

*   **URL**: lorsque vous créez un contact, les utilisateurs peuvent entrer et enregistrer plus d'une adresse web, mais seulement un est disponible lors de la recherche du contact.

*   **phoneNumbers**: l'option de *pref* n'est pas pris en charge. Le *type* n'est pas pris en charge lors d'une opération de *trouver* . Seul `phoneNumber` est autorisé pour chaque *type*.

*   **courriels**: l'option de *pref* n'est pas pris en charge. Accueil et personnels références même courriel entrée. Une seule participation est autorisée pour chaque *type*.

*   **adresses**: prend en charge seulement travail et accueil/personal *type*. La maison et personnels de *type* référence la même entrée d'adresse. Une seule participation est autorisée pour chaque *type*.

*   **organisations**: seul est autorisé et ne supporte pas les attributs *pref*, *type*et *Département* .

*   **Remarque**: ne pas pris en charge, retour`null`.

*   **IMS**: ne pas pris en charge, retour`null`.

*   **anniversaires**: ne pas pris en charge, retour`null`.

*   **catégories**: ne pas pris en charge, retour`null`.

## ContactAddress

Le `ContactAddress` objet Stocke les propriétés d'une seule adresse d'un contact. A `Contact` objet peut inclure plusieurs adresses dans un `ContactAddress[]` tableau.

### Propriétés

*   **pref**: la valeur `true` si ce `ContactAddress` contient la valeur de préférence de l'utilisateur. *(booléen)*

*   **type**: une chaîne qui indique quel type de terrain c'est le cas, *maison* par exemple. *(DOMString)*

*   **mise en forme**: l'adresse complète au format pour l'affichage. *(DOMString)*

*   **adresse**: l'adresse complète. *(DOMString)*

*   **localité**: la ville ou la localité. *(DOMString)*

*   **région**: l'État ou la région. *(DOMString)*

*   **Code postal**: le code zip ou code postal. *(DOMString)*

*   **pays**: le nom du pays. *(DOMString)*

### Plates-formes prises en charge

*   Amazon Fire OS
*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 et 8
*   Windows 8

### Exemple

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
    

### Android 2.X Quirks

*   **pref**: ne pas pris en charge, retour `false` sur les appareils Android 2.X.

### BlackBerry 10 Quirks

*   **pref**: non pris en charge sur les appareils BlackBerry, retour`false`.

*   **type**: partiellement pris en charge. Seule chaque de *travail* et tapez les adresses de *la maison* peut être stockée par contact.

*   **au format**: partiellement pris en charge. Retourne la concaténation de tous les champs d'adresse BlackBerry.

*   **streetAddress**: prise en charge. Retourne la concaténation de BlackBerry **address1** et **address2** champs d'adresse.

*   **localité**: prise en charge. Stockée dans le champ d'adresse BlackBerry **ville** .

*   **région**: pris en charge. Stockée dans le champ d'adresse BlackBerry **stateProvince** .

*   **Code postal**: prise en charge. Stockée dans le champ d'adresse BlackBerry **zipPostal** .

*   **pays**: prise en charge.

### Bizarreries de FirefoxOS

*   **au format**: actuellement ne pas pris en charge

### iOS Quirks

*   **pref**: non pris en charge sur les appareils iOS, retour`false`.

*   **au format**: actuellement ne pas pris en charge.

### Bizarreries de Windows 8

*   **pref**: non pris en charge

## ContactError

Le `ContactError` objet est retourné à l'utilisateur via le `contactError` fonction de rappel lorsqu'une erreur survient.

### Propriétés

*   **code**: l'un des codes d'erreur prédéfinis énumérés ci-dessous.

### Constantes

*   `ContactError.UNKNOWN_ERROR` (code 0)
*   `ContactError.INVALID_ARGUMENT_ERROR` (code 1)
*   `ContactError.TIMEOUT_ERROR` (code 2)
*   `ContactError.PENDING_OPERATION_ERROR` (code 3)
*   `ContactError.IO_ERROR` (code 4)
*   `ContactError.NOT_SUPPORTED_ERROR` (code 5)
*   `ContactError.PERMISSION_DENIED_ERROR` (code 20)

## ContactField

Le `ContactField` objet est un composant réutilisable que représente contacter champs génériquement. Chaque `ContactField` objet contient un `value` , `type` , et `pref` propriété. A `Contact` objet stocke plusieurs propriétés dans `ContactField[]` tableaux, tels que téléphone numéros et adresses e-mail.

Dans la plupart des cas, il n'y a pas de valeurs prédéterminées pour une `ContactField` l'attribut **type** de l'objet. Par exemple, un numéro de téléphone peut spécifier des valeurs de **type** de la *maison*, *travail*, *mobile*, *iPhone*ou toute autre valeur qui est pris en charge par la base de contacts de la plate-forme un périphérique particulier. Toutefois, pour les `Contact` **photos** champ, le champ **type** indique le format de l'image retournée : **url** lorsque l'attribut **value** contient une URL vers l'image photo ou *base64* lorsque la **valeur** contient une chaîne codée en base64 image.

### Propriétés

*   **type**: une chaîne qui indique quel type de terrain c'est le cas, *maison* par exemple. *(DOMString)*

*   **valeur**: la valeur du champ, comme un téléphone numéro ou adresse e-mail. *(DOMString)*

*   **pref**: la valeur `true` si ce `ContactField` contient la valeur de préférence de l'utilisateur. *(booléen)*

### Plates-formes prises en charge

*   Amazon Fire OS
*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 et 8
*   Windows 8

### Exemple

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
    

### Quirks Android

*   **pref**: ne pas pris en charge, retour`false`.

### BlackBerry 10 Quirks

*   **type**: partiellement pris en charge. Utilisé pour les numéros de téléphone.

*   **valeur**: prise en charge.

*   **pref**: ne pas pris en charge, retour`false`.

### iOS Quirks

*   **pref**: ne pas pris en charge, retour`false`.

### Quirks Windows8

*   **pref**: ne pas pris en charge, retour`false`.

## ContactName

Contient différents types d'informations sur un `Contact` nom de l'objet.

### Propriétés

*   **mise en forme**: le nom complet du contact. *(DOMString)*

*   **familyName**: nom de famille du contact. *(DOMString)*

*   **givenName**: prénom du contact. *(DOMString)*

*   **middleName**: deuxième prénom du contact. *(DOMString)*

*   **honorificPrefix**: préfixe du contact (exemple *M.* ou *Mme*) *(DOMString)*

*   **honorificSuffix**: suffixe du contact (exemple *Esq.*). *(DOMString)*

### Plates-formes prises en charge

*   Amazon Fire OS
*   Android 2.X
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 et 8
*   Windows 8

### Exemple

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
    

### Quirks Android

*   **au format**: partiellement pris en charge et en lecture seule. Retourne la concaténation de `honorificPrefix` , `givenName` , `middleName` , `familyName` , et`honorificSuffix`.

### BlackBerry 10 Quirks

*   **au format**: partiellement pris en charge. Retourne la concaténation de champs **firstName** et **lastName** de BlackBerry.

*   **familyName**: prise en charge. Stockée dans le champ **lastName** BlackBerry.

*   **givenName**: prise en charge. Stockée dans le champ **firstName** BlackBerry.

*   **middleName**: ne pas pris en charge, retour`null`.

*   **honorificPrefix**: ne pas pris en charge, retour`null`.

*   **honorificSuffix**: ne pas pris en charge, retour`null`.

### Bizarreries de FirefoxOS

*   **au format**: partiellement pris en charge et en lecture seule. Retourne la concaténation de `honorificPrefix` , `givenName` , `middleName` , `familyName` , et`honorificSuffix`.

### iOS Quirks

*   **au format**: partiellement pris en charge. Retourne la dénomination composée d'iOS, mais est en lecture seule.

### Bizarreries de Windows 8

*   **au format**: c'est le seul nom de propriété et est identique à `displayName` , et`nickname`

*   **familyName**: non pris en charge

*   **givenName**: non pris en charge

*   **middleName**: non pris en charge

*   **honorificPrefix**: non pris en charge

*   **honorificSuffix**: non pris en charge

## ContactOrganization

Le `ContactOrganization` objet Stocke des propriétés un contact de l'organisation. A `Contact` objet contient un ou plusieurs `ContactOrganization` des objets dans un tableau.

### Propriétés

*   **pref**: la valeur `true` si ce `ContactOrganization` contient la valeur de préférence de l'utilisateur. *(booléen)*

*   **type**: une chaîne qui indique quel type de terrain c'est le cas, *maison* par exemple. _(DOMString)

*   **nom**: le nom de l'organisation. *(DOMString)*

*   **Département**: le département et le contrat de travaille pour. *(DOMString)*

*   **titre**: titre du contact auprès de l'organisation. *(DOMString)*

### Plates-formes prises en charge

*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 et 8

### Exemple

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
    

### Android 2.X Quirks

*   **pref**: ne pas pris en charge par des dispositifs Android 2.X, retour`false`.

### BlackBerry 10 Quirks

*   **pref**: ne pas pris en charge par les appareils BlackBerry, retour`false`.

*   **type**: ne pas pris en charge par les appareils BlackBerry, retour`null`.

*   **nom**: partiellement pris en charge. Le premier nom de l'organisme est stocké dans le champ **company** de BlackBerry.

*   **Département**: ne pas pris en charge, retour`null`.

*   **titre**: partiellement pris en charge. Le premier titre de l'organisation est stocké dans le champ de **jobTitle** BlackBerry.

### Firefox OS Quirks

*   **pref**: non pris en charge

*   **type**: non pris en charge

*   **Département**: non pris en charge

*   Les champs **nom** et **titre** stocké dans **org** et **jobTitle**.

### iOS Quirks

*   **pref**: non pris en charge sur les appareils iOS, retour`false`.

*   **type**: non pris en charge sur les appareils iOS, retour`null`.

*   **nom**: partiellement pris en charge. Le premier nom de l'organisme est stocké dans le champ de **kABPersonOrganizationProperty** iOS.

*   **Département**: partiellement pris en charge. Le premier nom de département est stocké dans le champ de **kABPersonDepartmentProperty** iOS.

*   **titre**: partiellement pris en charge. Le premier titre est stocké dans le champ de **kABPersonJobTitleProperty** iOS.