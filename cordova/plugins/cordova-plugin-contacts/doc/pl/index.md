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

Ten plugin definiuje obiekt globalny `navigator.contacts`, która zapewnia dostęp do bazy danych kontaktów urządzenia.

Mimo, że obiekt jest dołączony do globalnego zakresu `navigator`, to nie dostępne dopiero po zdarzeniu `deviceready`.

    document.addEventListener("deviceready", onDeviceReady, false);
    function onDeviceReady() {
        console.log(navigator.contacts);
    }
    

**Ostrzeżenie**: zbierania i wykorzystywania danych kontaktowych podnosi kwestie prywatności ważne. Polityka prywatności danej aplikacji należy Dyskutować, jak aplikacja używa danych kontaktowych i czy jest on dzielony z innymi stronami. Informacje kontaktowe uznaje wrażliwych, ponieważ ukazuje ludzi, z którymi osoba komunikuje się. W związku z tym oprócz aplikacji prywatności, zdecydowanie zaleca się zapewnienie just-in czas wypowiedzenia zanim aplikacja uzyskuje dostęp do lub używa danych kontaktowych, jeśli system operacyjny urządzenia nie robi już. Że ogłoszenie powinno zawierać te same informacje, o których wspomniano powyżej, jak również uzyskanie uprawnienia użytkownika (np. poprzez przedstawianie wyborów **OK** i **Nie dzięki**). Należy pamiętać, że niektóre platformy aplikacji może wymagać aplikacji powiadomienia just-in czas i uzyskać uprawnienia użytkownika przed uzyskaniem dostępu do danych kontaktowych. Jasne i łatwe do zrozumienia użytkownika doświadczenie, wykorzystanie kontaktów danych pomaga uniknąć nieporozumień użytkownik i postrzegane nadużycia danych kontaktowych. Aby uzyskać więcej informacji zobacz przewodnik prywatności.

## Instalacja

    cordova plugin add cordova-plugin-contacts
    

### Firefox OS dziwactwa

Tworzenie **www/manifest.webapp**, jak opisano w [Dokumentach Manifest][1]. Dodaj odpowiednie permisions. Istnieje również potrzeba zmienić typ webapp do "privileged" - [Manifest dokumenty][2]. **Ostrzeżenie**: wszystkie uprzywilejowany apps egzekwowania [Treści polityki bezpieczeństwa][3], który zabrania skrypt. Zainicjować aplikacji w inny sposób.

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
    

### Windows dziwactwa

Wszelkie kontakty wrócił z `pickContact` i `find` metody są tylko do odczytu, więc aplikacja nie mogą ich modyfikować. `find` metody dostępne tylko na urządzenia Windows Phone 8.1.

### Windows 8 dziwactwa

Windows 8 kontaktów są tylko do odczytu. Poprzez kontakty Cordova API są nie queryable/wyszukiwania, należy poinformować użytkownika wybrać kontakt jako wezwanie do contacts.pickContact, która zostanie otwarta aplikacja 'Ludzie', gdzie użytkownik musi wybrać kontakt. Wszelkie kontakty, zwracane są tylko do odczytu, więc aplikacja nie mogą ich modyfikować.

## Navigator.Contacts

### Metody

*   navigator.contacts.create
*   navigator.contacts.find
*   navigator.contacts.pickContact

### Obiekty

*   Kontakt
*   Przedstawiciel
*   ContactField
*   ContactAddress
*   ContactOrganization
*   ContactFindOptions
*   ContactError
*   ContactFieldType

## Navigator.Contacts.Create

Metoda `navigator.contacts.create` jest synchroniczna i zwraca nowy obiekt `Contact`.

Ta metoda nie zachowuje kontakt obiektu bazy danych kontaktów urządzenie, dla którego należy wywołać metodę `Contact.save`.

### Obsługiwane platformy

*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 i 8

### Przykład

    var myContact = navigator.contacts.create({"displayName": "Test User"});
    

## navigator.contacts.find

Metoda `navigator.contacts.find` asynchronicznie, wykonuje kwerendy bazy danych kontaktów urządzenia i tablicę obiektów `kontaktów`. Wynikowe obiekty są przekazywane do funkcji wywołania zwrotnego `contactSuccess`, określony przez parametr **contactSuccess**.

Parametr **contactFields** Określa pola, które mają być używane jako kwalifikator Szukaj. Zerowej długości **contactFields** parametr jest nieprawidłowy i wyniki w `ContactError.INVALID_ARGUMENT_ERROR`. **ContactFields** wartość `"*"` przeszukuje wszystkie kontakt z pola.

Ciąg **contactFindOptions.filter** może służyć jako filtr wyszukiwania, gdy kwerenda bazy danych kontaktów. Jeśli dostarczone, przypadek-niewrażliwe, częściowej wartości mecz jest stosowane do każdego pola określony w parametrze **contactFields**. Jeśli ma odpowiednika dla *każdego* pola określony, zwracany jest kontakt. Użycie **contactFindOptions.desiredFields** parametr do kontroli, które kontakt właściwości muszą zostać zwrócone ponownie.

### Parametry

*   **contactFields**: kontakt z pól do wykorzystania jako kwalifikator Szukaj. *(DOMString[])* [Required]

*   **contactSuccess**: sukcesu funkcji wywołania zwrotnego, wywoływane z tablicy obiektów kontaktów zwracane z bazy danych. [Required]

*   **contactError**: Błąd funkcji wywołania zwrotnego, wywoływana, gdy wystąpi błąd. [Opcjonalnie]

*   **contactFindOptions**: Szukaj opcji filtrowania navigator.contacts. [Optional]
    
    Klucze obejmuje:
    
    *   **filter**: ciąg wyszukiwania umożliwia znalezienie navigator.contacts. *(DOMString)* (Domyślnie: `""`)
    
    *   **multiple**: określa, czy operacja Znajdź zwraca wiele navigator.contacts. *(Wartość logiczna)* (Domyślnie: `false`)
        
        *   **desiredFields**: kontakt z pola, aby być zwrócona. Jeśli określony, wynikowy `kontakt` obiekt tylko funkcje wartości tych pól. *(DOMString[])* [Optional]

### Obsługiwane platformy

*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 i 8
*   Windows (tylko urządzenia Windows Phone 8.1)

### Przykład

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
    

### Windows dziwactwa

*   `__contactFields__`nie jest obsługiwane i zostanie zignorowana. `find`Metoda zawsze będzie próbował dopasować nazwę, adres e-mail lub numer telefonu kontaktu.

## navigator.contacts.pickContact

Metoda `navigator.contacts.pickContact` uruchamia próbnika kontakt, wybierz jeden kontaktem. Wynikowy obiekt jest przekazywany do funkcji wywołania zwrotnego `contactSuccess`, określony przez parametr **contactSuccess**.

### Parametry

*   **contactSuccess**: sukcesu funkcji wywołania zwrotnego, wywoływane z jednego obiektu kontakt. [Wymagane]

*   **contactError**: Błąd funkcji wywołania zwrotnego, wywoływana, gdy wystąpi błąd. [Opcjonalnie]

### Obsługiwane platformy

*   Android
*   iOS
*   Windows Phone 8
*   Windows 8
*   Windows

### Przykład

    navigator.contacts.pickContact(function(contact){
            console.log('The following contact has been selected:' + JSON.stringify(contact));
        },function(err){
            console.log('Error: ' + err);
        });
    

## Kontakt

`Contact` obiekt reprezentuje informacje kontaktowe. Kontakty mogą być tworzone, przechowywane lub usunięte z bazy danych kontaktów urządzenia. Kontakty można również pobrać (pojedynczo lub zbiorczo) bazy danych przez wywołanie metody `navigator.contacts.find`.

**Uwaga**: nie wszystkie pola kontaktowe wymienione powyżej są obsługiwane na każdej platformie urządzenia. Proszę sprawdzić każdej platformy *dziwactw* sekcji szczegółów.

### Właściwości

*   **Identyfikator**: unikatowy identyfikator globalny. *(DOMString)*

*   **displayName**: Nazwa tego kontaktu, nadaje się do wyświetlania użytkownikom końcowym. *(DOMString)*

*   **Nazwa**: obiekt zawierający wszystkie składniki nazwy osób. *(Przedstawiciel)*

*   **nick**: dorywczo nazwy na adres kontakt. *(DOMString)*

*   **numery telefon≤w**: tablica numerów telefonów kontaktowych. *(ContactField[])*

*   **e-maile**: tablica adresów e-mail kontakt. *(ContactField[])*

*   **adresy**: tablica wszystkie adresy. *(ContactAddress[])*

*   **IMS**: tablica kontakt IM adresy. *(ContactField[])*

*   **organizacje**: tablicy wszystkie kontakty organizacji. *(ContactOrganization[])*

*   **urodziny**: urodziny kontakt. *(Data)*

*   **Uwaga**: Uwaga o kontakt. *(DOMString)*

*   **zdjęcia**: tablica zdjęcia kontaktu. *(ContactField[])*

*   **Kategorie**: tablica wszystkie zdefiniowane przez użytkownika kategorie związane z kontaktem. *(ContactField[])*

*   **adresy URL**: tablicy stron internetowych związanych z kontaktem. *(ContactField[])*

### Metody

*   **klon**: Zwraca nowy `Contact` obiekt, który jest kopią głęboko obiektu wywołującego, z `id` Właściwość zestaw`null`.

*   **Usuń**: usuwa kontakt z bazy danych kontaktów urządzenia, w przeciwnym razie wykonuje błąd wywołania zwrotnego z `ContactError` obiektu.

*   **Zapisz**: zapisuje nowy kontakt do bazy kontaktów urządzenia, lub aktualizacje już istniejący kontakt, jeśli istnieje już kontakt o tym samym **identyfikatorze** .

### Obsługiwane platformy

*   Amazon Fire OS
*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 i 8
*   Windows 8
*   Windows

### Zapisz przykład

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
    

### Przykład klon

        // clone the contact object
        var clone = contact.clone();
        clone.name.givenName = "John";
        console.log("Original contact name = " + contact.name.givenName);
        console.log("Cloned contact name = " + clone.name.givenName);
    

### Remove przykład

    function onSuccess() {
        alert("Removal Success");
    };
    
    function onError(contactError) {
        alert("Error = " + contactError.code);
    };
    
    // remove the contact from the device
    contact.remove(onSuccess,onError);
    

### Android 2.X dziwactwa

*   **Kategorie**: nie obsługiwane na urządzeniach Android 2.X, powrót`null`.

### Jeżyna 10 dziwactwa

*   **Identyfikator**: przypisany przez urządzenie podczas zapisywania kontaktu.

### Osobliwości FirefoxOS

*   **Kategorie**: częściowo obsługiwane. Pola **pref** i **Typ** wracają`null`

*   **IMS**: nie obsługiwane

*   **zdjęcia**: nie obsługiwane

### Dziwactwa iOS

*   **displayName**: nie obsługiwane na iOS, powrót `null` chyba jest nie `ContactName` określony, w którym to przypadku zwraca nazwę kompozytowe, **nick** lub `""` , odpowiednio.

*   **urodziny**: należy wpisać jako JavaScript `Date` obiektu, tak samo jest zwracany.

*   **zdjęcia**: zwraca adres URL pliku obrazu, który jest przechowywany w katalogu tymczasowego stosowania. Zawartość katalogu tymczasowe są usuwane, kiedy kończy pracę aplikacji.

*   **Kategorie**: Ta właściwość obecnie jest nie obsługiwane, powrót`null`.

### Windows Phone 7 i 8 dziwactwa

*   **displayName**: podczas tworzenia kontaktu, Źródło wartość podana dla parametru nazwy wyświetlania różni się od nazwy wyświetlanej, gdy znalezienie kontaktu.

*   **adresy URL**: podczas tworzenia kontaktu, użytkownicy mogą wpisać i zapisać więcej niż jeden adres sieci web, ale tylko jeden jest dostępne podczas wyszukiwania kontaktów.

*   **numery telefon≤w**: *pref* opcja nie jest obsługiwana. *Typ* nie jest obsługiwany w operacji *znaleźć* . Jedynym `phoneNumber` jest dozwolone dla każdego *typu*.

*   **e-maile**: *pref* opcja nie jest obsługiwana. Domu i osobiste odwołuje się w tym samym wpisu email. Dla każdego *typu* dozwolone jest tylko jeden wpis.

*   **adresy**: obsługuje tylko pracy i domu/osobisty *typu*. Domowych i osobistych *typu* odwołania tej samej pozycji adres. Dla każdego *typu* dozwolone jest tylko jeden wpis.

*   **organizacje**: tylko jeden jest dozwolone, a nie obsługuje * *pref*, *Typ*i* atrybuty.

*   **Uwaga**: nie obsługiwane, powrót`null`.

*   **IMS**: nie obsługiwane, powrót`null`.

*   **urodziny**: nie obsługiwane, powrót`null`.

*   **Kategorie**: nie obsługiwane, powrót`null`.

### Windows dziwactwa

*   **zdjęcia**: zwraca adres URL pliku obrazu, który jest przechowywany w katalogu tymczasowego stosowania.

*   **urodziny**: nie obsługiwane, powrót`null`.

*   **Kategorie**: nie obsługiwane, powrót`null`.

## ContactAddress

Obiekt `ContactAddress` przechowuje właściwości pojedynczego adresu kontaktu. Obiekt `Contact` może zawierać więcej niż jeden adres w tablicy `[ContactAddress]`.

### Właściwości

*   **Pref**: zestaw `true` Jeśli `ContactAddress` zawiera wartości preferowanych użytkownika. *(wartość logiczna)*

*   **Typ**: string wskazującą typ pola, *do domu* na przykład. *(DOMString)*

*   **w formacie**: pełny adres w formacie wyświetlania. *(DOMString)*

*   **adres**: pełny adres. *(DOMString)*

*   **miejscowości**: miasta lub miejscowości. *(DOMString)*

*   **region**: Państwo lub region. *(DOMString)*

*   **Kod pocztowy**: kod pocztowy lub kod pocztowy. *(DOMString)*

*   **kraj**: nazwę kraju. *(DOMString)*

### Obsługiwane platformy

*   Amazon Fire OS
*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 i 8
*   Windows 8
*   Windows

### Przykład

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
    

### Android 2.X dziwactwa

*   **Pref**: nie obsługiwane, powrót `false` na urządzeniach Android 2.X.

### Jeżyna 10 dziwactwa

*   **Pref**: nie obsługiwane na urządzenia BlackBerry, powrót`false`.

*   **Typ**: częściowo obsługiwane. Tylko jeden z *pracy* i *Strona główna* wpisz adresy mogą być przechowywane na kontakt.

*   **w formacie**: częściowo obsługiwane. Zwraca łączenie wszystkich pól adres BlackBerry.

*   **adres**: obsługiwane. Zwraca łączenie BlackBerry **address1** i **Adres2** pola adresu.

*   **miejscowości**: obsługiwane. Przechowywane w polu adres **miasto** BlackBerry.

*   **region**: obsługiwane. Przechowywane w polu adres **stateProvince** BlackBerry.

*   **Kod pocztowy**: obsługiwane. Przechowywane w polu adres **zipPostal** BlackBerry.

*   **kraj**: obsługiwane.

### Osobliwości FirefoxOS

*   **w formacie**: aktualnie nieobsługiwane

### Dziwactwa iOS

*   **Pref**: nie obsługiwane urządzenia iOS, powrót`false`.

*   **w formacie**: obecnie nie jest obsługiwane.

### Windows 8 dziwactwa

*   **Pref**: nie obsługiwane

### Windows dziwactwa

*   **Pref**: nie obsługiwane

## ContactError

`ContactError` obiekt jest zwracany użytkownikowi za pośrednictwem funkcji wywołania zwrotnego `contactError`, gdy wystąpi błąd.

### Właściwości

*   **Kod**: jeden z kodów błędów wstępnie zdefiniowanych poniżej.

### Stałe

*   `ContactError.UNKNOWN_ERROR` (code 0)
*   `ContactError.INVALID_ARGUMENT_ERROR` (code 1)
*   `ContactError.TIMEOUT_ERROR` (code 2)
*   `ContactError.PENDING_OPERATION_ERROR` (code 3)
*   `ContactError.IO_ERROR` (code 4)
*   `ContactError.NOT_SUPPORTED_ERROR` (code 5)
*   `ContactError.PERMISSION_DENIED_ERROR` (code 20)

## ContactField

Obiekt `ContactField` jest składnikiem wielokrotnego użytku, że reprezentuje kontakt pola ogólnie. Każdy obiekt `ContactField` zawiera `wartość`, `Typ` i `pref` Właściwość. Obiekt `Contact` sklepy kilku właściwości w tablicach `[ContactField]`, takich jak numery telefonów i adresy e-mail.

W większości przypadków są nie wcześniej ustalonych wartości atrybutu **type** obiektu `ContactField`. Na przykład numer telefonu można określić **type** wartości *home*, *work*, *mobile*, *iPhone*, lub jakąkolwiek inną wartość, który jest obsługiwany przez platformę danego urządzenia bazy danych kontaktów. Jednak `Contact` **photos** pola, pole **type** wskazuje format zwrócone obrazu: **url**, gdy **value** atrybut zawiera adres URL, do zdjęć, lub *base64*, gdy **value** zawiera ciąg zakodowany base64 obrazu.

### Właściwości

*   **Typ**: ciąg, który wskazuje typ pola, *do domu* , np. *(DOMString)*

*   **wartości**: wartość pola, na przykład adresu e-mail lub numer telefonu. *(DOMString)*

*   **Pref**: zestaw `true` Jeśli `ContactField` zawiera wartości preferowanych użytkownika. *(wartość logiczna)*

### Obsługiwane platformy

*   Amazon Fire OS
*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 i 8
*   Windows 8
*   Windows

### Przykład

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
    

### Dziwactwa Androida

*   **Pref**: nie obsługiwane, powrót`false`.

### Jeżyna 10 dziwactwa

*   **Typ**: częściowo obsługiwane. Używane numery telefonów.

*   **wartość**: obsługiwane.

*   **Pref**: nie obsługiwane, powrót`false`.

### Dziwactwa iOS

*   **Pref**: nie obsługiwane, powrót`false`.

### Osobliwości Windows8

*   **Pref**: nie obsługiwane, powrót`false`.

### Windows dziwactwa

*   **Pref**: nie obsługiwane, powrót`false`.

## Przedstawiciel

Zawiera różne rodzaje informacji o nazwę obiektu `Contact`.

### Właściwości

*   **w formacie**: pełną nazwę kontaktu. *(DOMString)*

*   **danych**: nazwisko kontaktu. *(DOMString)*

*   **imię**: imię kontaktu. *(DOMString)*

*   **middleName**: nazwy bliskiego kontaktu. *(DOMString)*

*   **honorificPrefix**: kontakt prefiks (przykład *Pan* lub *Dr*) *(DOMString)*

*   **honorificSuffix**: kontakt sufiks (przykład *Esq.*). *(DOMString)*

### Obsługiwane platformy

*   Amazon Fire OS
*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 i 8
*   Windows 8
*   Windows

### Przykład

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
    

### Dziwactwa Androida

*   **w formacie**: częściowo obsługiwane i tylko do odczytu. Zwraca składa się z `honorificPrefix` , `givenName` , `middleName` , `familyName` , i`honorificSuffix`.

### Jeżyna 10 dziwactwa

*   **w formacie**: częściowo obsługiwane. Zwraca łączenie pól **imię** i **nazwisko** BlackBerry.

*   **danych**: obsługiwane. Przechowywane w BlackBerry pola **nazwisko** .

*   **imię**: obsługiwane. Przechowywane w polu **imię** BlackBerry.

*   **middleName**: nie obsługiwane, powrót`null`.

*   **honorificPrefix**: nie obsługiwane, powrót`null`.

*   **honorificSuffix**: nie obsługiwane, powrót`null`.

### Osobliwości FirefoxOS

*   **w formacie**: częściowo obsługiwane i tylko do odczytu. Zwraca składa się z `honorificPrefix` , `givenName` , `middleName` , `familyName` , i`honorificSuffix`.

### Dziwactwa iOS

*   **w formacie**: częściowo obsługiwane. Zwraca iOS nazwy, ale jest tylko do odczytu.

### Windows 8 dziwactwa

*   **w formacie**: to jest tylko nazwa właściwość i jest taka sama, jak `displayName` , i`nickname`

*   **danych**: nie obsługiwane

*   **imię**: nie obsługiwane

*   **middleName**: nie obsługiwane

*   **honorificPrefix**: nie obsługiwane

*   **honorificSuffix**: nie obsługiwane

### Windows dziwactwa

*   **w formacie**: jest identyczny z`displayName`

## ContactOrganization

Obiekt `ContactOrganization` przechowuje właściwości organizacji kontaktu. Obiekt `Contact` sklepy jeden lub więcej obiektów `ContactOrganization` w tablicy.

### Właściwości

*   **Pref**: zestaw `true` Jeśli `ContactOrganization` zawiera wartości preferowanych użytkownika. *(wartość logiczna)*

*   **Typ**: ciąg, który wskazuje typ pola, *do domu* , np. _(DOMString)

*   **Nazwa**: nazwa organizacji. *(DOMString)*

*   **w departamencie**: dziale umowy działa. *(DOMString)*

*   **tytuł**: tytuł kontaktu w organizacji. *(DOMString)*

### Obsługiwane platformy

*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 i 8
*   Windows (tylko urządzenia Windows 8.1 i Windows Phone 8.1)

### Przykład

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
    

### Android 2.X dziwactwa

*   **Pref**: nie obsługiwane przez urządzenia Android 2.X, powrót`false`.

### Jeżyna 10 dziwactwa

*   **Pref**: nie obsługiwane przez urządzenia BlackBerry, powrót`false`.

*   **Typ**: nie obsługiwane przez urządzenia BlackBerry, powrót`null`.

*   **Nazwa**: częściowo obsługiwane. Pierwsza nazwa organizacji są przechowywane w polu **firma** BlackBerry.

*   **w departamencie**: nie obsługiwane, powrót`null`.

*   **tytuł**: częściowo obsługiwane. Pierwszy tytuł organizacji są przechowywane w polu **jobTitle** BlackBerry.

### Firefox OS dziwactwa

*   **Pref**: nie obsługiwane

*   **Typ**: nie obsługiwane

*   **w departamencie**: nie obsługiwane

*   Pola **Nazwa** i **tytuł** przechowywane w **org** i **jobTitle**.

### Dziwactwa iOS

*   **Pref**: nie obsługiwane urządzenia iOS, powrót`false`.

*   **Typ**: nie obsługiwane urządzenia iOS, powrót`null`.

*   **Nazwa**: częściowo obsługiwane. Pierwsza nazwa organizacji są przechowywane w polu **kABPersonOrganizationProperty** iOS.

*   **w departamencie**: częściowo obsługiwane. Pierwsza nazwa jest przechowywana w polu **kABPersonDepartmentProperty** iOS.

*   **tytuł**: częściowo obsługiwane. Pierwszy tytuł jest przechowywany w polu **kABPersonJobTitleProperty** iOS.

### Windows dziwactwa

*   **Pref**: nie obsługiwane, powrót`false`.

*   **Typ**: nie obsługiwane, powrót`null`.
