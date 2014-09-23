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

Обеспечивает доступ к базе данных контактов устройства.

**Предупреждение**: сбор и использование данные контактов поднимает важные вопросы конфиденциальности. Политика конфиденциальности вашего приложения должна объяснять, как приложение использует контактные данные и передается ли она третьим лицам. Контактная информация считается конфиденциальной, потому что он показывает людей, с которыми общается человек. Таким образом в дополнение к политике конфиденциальности приложения, вы должны рассмотреть возможность предоставления уведомления в момент времени перед тем как приложение обращается к, или использует контактные данные, если операционная системы устройства не делает этого. Это уведомление должно обеспечивать ту же информацию, указанную выше, а также получение разрешения пользователя (например, путем представления выбора **OK** и **Нет, спасибо**). Обратите внимание, что некоторые магазины приложения могут требовать от приложения уведомления в момент доступа к данным и получить разрешение пользователя перед доступом к контактным данным. Четкая и понятная эргономика использования контактных данных помогает избежать недоразумений и ощущаемых злоупотреблений контактными данными. Для получения дополнительной информации пожалуйста, смотрите в руководстве конфиденциальности.

## Установка

    cordova plugin add org.apache.cordova.contacts
    

### Firefox OS причуды

Создание **www/manifest.webapp** , как описано в [Манифест Docs][1]. Добавление соответствующих разрешений. Существует также необходимость изменить веб-приложение типа «привилегированные» - [Манифест Docs][2]. **Предупреждение**: все привилегированные apps применять [Содержание политики безопасности][3] , которая запрещает встроенный скрипт. Другим способом инициализации приложения.

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
    

### Совместимости Windows 8

Windows 8 Контакты являются readonly. Через контакты Cordova API не являются queryable/для поиска, вы должны сообщить пользователю выбрать контакт как вызов contacts.pickContact, который откроет приложение «Люди», где пользователь должен выбрать контакт. Любые контакты вернулся, readonly, поэтому ваше приложение не может изменять их.

## navigator.contacts

### Методы

*   navigator.contacts.create
*   navigator.contacts.find
*   navigator.contacts.pickContact

### Объекты

*   Contact
*   ContactName
*   ContactField
*   ContactAddress
*   ContactOrganization
*   ContactFindOptions
*   ContactError
*   ContactFieldType

## navigator.contacts.create

`navigator.contacts.create`Метод является синхронным и возвращает новый объект `Contact` объект.

Этот метод не сохраняет контакт объекта в базе данных контактов устройства, для которого необходимо вызвать `Contact.save` метод.

### Поддерживаемые платформы

*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 и 8

### Пример

    var myContact = navigator.contacts.create({"displayName": "Test User"});
    

## navigator.contacts.find

`navigator.contacts.find`Метод выполняется асинхронно, запрашивая базу контактов устройства и возвращая массив `Contact` объектов. Полученные объекты передаются в `contactSuccess` функции обратного вызова, указанный параметром **contactSuccess** .

Параметр **contactFields** указывает поля, чтобы использоваться в качестве квалификатора Поиск. Нулевой длины **contactFields** параметр является недопустимым и приводит к `ContactError.INVALID_ARGUMENT_ERROR` . **ContactFields** значение `"*"` возвращает все поля контактов.

**ContactFindOptions.filter** строка может использоваться как фильтр поиска при запросах к базе данных контактов. Если, без учета регистра, частичное значение матч применяется к каждому полю, указанному в параметре **contactFields** . Если есть совпадение для *любого* из указанных полей, возвращается контакт. Использование параметра **contactFindOptions.desiredFields** для управления свойства контакта должны быть возвращены обратно.

### Параметры

*   **contactSuccess**: успех функция обратного вызова вызывается с массивом объектов Contact вернулся из базы данных. [Требуется]

*   **contactError**: ошибка функции обратного вызова, вызывается при возникновении ошибки. [Опционально]

*   **contactFields**: контакт поля для использования в качестве квалификатора Поиск. *(DOMString[])* [Требуется]

*   **contactFindOptions**: Параметры поиска для фильтрации filter navigator.contacts. [Опционально] Ключи включают:

*   **Фильтр**: Поиск строку, используемую для поиска navigator.contacts. *(DOMString)* (По умолчанию:`""`)

*   **несколько**: определяет, если операция поиска возвращает несколько navigator.contacts. *(Логическое)* (По умолчанию:`false`)
    
    *   **desiredFields**: контакт поля возвращается обратно. Если указан, в результате `Contact` объект только функции значения для этих полей. *(DOMString[])* [Опционально]

### Поддерживаемые платформы

*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 и 8

### Пример

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

`navigator.contacts.pickContact`Метод запускает контакт выбора, чтобы выбрать один контакт. Результирующий объект передается в `contactSuccess` функции обратного вызова, указанный параметром **contactSuccess** .

### Параметры

*   **contactSuccess**: успех функция обратного вызова вызывается с одним объектом контакта. [Требуется]

*   **contactError**: ошибка функции обратного вызова, вызывается при возникновении ошибки. [Опционально]

### Поддерживаемые платформы

*   Android
*   iOS
*   Windows Phone 8
*   Windows 8

### Пример

    navigator.contacts.pickContact(function(contact){
            console.log('The following contact has been selected:' + JSON.stringify(contact));
        },function(err){
            console.log('Error: ' + err);
        });
    

## Контакт

`Contact`Представляет объект пользователя в контакте. Контакты можно созданы, хранятся или удалены из базы данных контактов устройства. Контакты могут также быть получены (индивидуально или навалом) из базы данных путем вызова `navigator.contacts.find` метод.

**Примечание**: не все поля контактов, перечисленных выше, поддерживаются на каждой платформе устройства. Пожалуйста, проверьте раздел *причуды* каждой платформы для деталей.

### Свойства

*   **ID**: глобальный уникальный идентификатор. *(DOMString)*

*   **displayName**: имя этого контакта, подходящую для отображения для конечных пользователей. *(DOMString)*

*   **имя**: объект, содержащий все компоненты имени лиц. *(ContactName)*

*   **прозвище**: случайные имя, чтобы адрес контакта. *(DOMString)*

*   **phoneNumbers**: массив все контактные телефонные номера. *(ContactField[])*

*   **письма**: массив адресов электронной почты всех контактов. *(ContactField[])*

*   **адреса**: массив все контактные адреса. *(ContactAddress[])*

*   **IMS**: массив адресов IM все контакты. *(ContactField[])*

*   **организаций**: массив всех контактов организаций. *(ContactOrganization[])*

*   **день рождения**: день рождения контакта. *(Дата)*

*   **Примечание**: Примечание о контакте. *(DOMString)*

*   **фотографии**: массив фотографии контакта. *(ContactField[])*

*   **категории**: массив всех пользовательских категорий, связанных с контактом. *(ContactField[])*

*   **URL-адреса**: массив веб-страниц, связанных с контактом. *(ContactField[])*

### Методы

*   **клон**: возвращает новый `Contact` объект, являющийся глубокой копией вызывающего объекта, с `id` свойству присвоено значение`null`.

*   **Удалить**: удаляет контакт из базы данных контактов устройства, в противном случае выполняет обратный вызов ошибки с `ContactError` объект.

*   **сохранить**: сохраняет новый контакт в базе данных контактов устройства, или обновления существующего контакта, если контакт с тем же **идентификатором** уже существует.

### Поддерживаемые платформы

*   Amazon Fire ОС
*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 и 8
*   Windows 8

### Сохраните пример

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
    

### Пример клон

        // clone the contact object
        var clone = contact.clone();
        clone.name.givenName = "John";
        console.log("Original contact name = " + contact.name.givenName);
        console.log("Cloned contact name = " + clone.name.givenName);
    

### Удаление примера

    function onSuccess() {
        alert("Removal Success");
    };
    
    function onError(contactError) {
        alert("Error = " + contactError.code);
    };
    
    // remove the contact from the device
    contact.remove(onSuccess,onError);
    

### Причуды Android 2.X

*   **категории**: не поддерживается на устройствах Android 2.X, возвращая`null`.

### Причуды blackBerry 10

*   **ID**: присвоенный устройства при сохранении контакта.

### FirefoxOS причуды

*   **категории**: частично поддерживается. Поля **pref** и **типа** возвращаются`null`

*   **IMS**: не поддерживается

*   **фотографии**: не поддерживается

### iOS причуды

*   **displayName**: не поддерживается на iOS, возвращая `null` Если нет ни `ContactName` указан, в этом случае он возвращает имя составного, **прозвище** или `""` , соответственно.

*   **день рождения**: необходимо ввести как JavaScript `Date` объект, так же, как он возвращается.

*   **фотографии**: Возвращает URL-адрес файла изображения, которое хранится во временном каталоге приложения. Содержание временного каталога удаляются при выходе из приложения.

*   **категории**: это свойство в настоящее время не поддерживается, возвращая`null`.

### Windows Phone 7 и 8 причуды

*   **displayName**: при создании контакта, значение, предоставленное для параметра отображаемое имя отличается от отображаемого имени получены при поиске контакта.

*   **URL-адреса**: при создании контакта, пользователи могут ввести и сохранить более чем одного веб-адрес, но только один доступен при поиске контакта.

*   **phoneNumbers**: *pref* параметр не поддерживается. *Тип* не поддерживается в операции *поиска* . Только один `phoneNumber` для каждого *типа* допускается.

*   **письма**: *pref* параметр не поддерживается. Дома и личные ссылки же запись электронной почты. Разрешена только одна запись для каждого *типа*.

*   **адреса**: поддерживает только работе и дома/личного *типа*. Ссылка на *тип* дома и личные же записи адреса. Разрешена только одна запись для каждого *типа*.

*   **организаций**: только один разрешено и не поддерживает атрибуты *pref*, *тип*и *Департамента* .

*   **Примечание**: не поддерживается, возвращая`null`.

*   **IMS**: не поддерживается, возвращая`null`.

*   **день рождения**: не поддерживается, возвращая`null`.

*   **категории**: не поддерживается, возвращая`null`.

## ContactAddress

`ContactAddress`Объект сохраняет свойства одного адреса контакта. A `Contact` объект может включать более чем один адрес в `ContactAddress[]` массиве.

### Свойства

*   **pref**: набор `true` Если `ContactAddress` содержит значение предпочтительный для пользователя. *(логическое)*

*   **тип**: строка, указывающая тип поля, *дома* , например. *(DOMString)*

*   **Формат**: полный адрес отформатирован для отображения. *(DOMString)*

*   **streetAddress**: полный почтовый адрес. *(DOMString)*

*   **населенный пункт**: город или населенный пункт. *(DOMString)*

*   **регион**: государства или региона. *(DOMString)*

*   **postalCode**: почтовый индекс или почтовый код. *(DOMString)*

*   **страна**: название страны. *(DOMString)*

### Поддерживаемые платформы

*   Amazon Fire ОС
*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 и 8
*   Windows 8

### Пример

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
    

### Причуды Android 2.X

*   **ап**: не поддерживается, возвращая `false` на устройствах Android 2.X.

### Причуды blackBerry 10

*   **ап**: не поддерживается на устройствах BlackBerry, возвращая`false`.

*   **тип**: частично поддерживается. Контакт может храниться только один из *работы* и *дома* типа адреса.

*   **Формат**: частично поддерживается. Возвращает объединение всех полей адреса BlackBerry.

*   **streetAddress**: поддерживается. Возвращает объединение и BlackBerry **Адрес1** **Адрес2** поля адреса.

*   **населенный пункт**: поддерживается. Хранится в поле адрес **город** BlackBerry.

*   **регион**: поддерживает. Хранится в поле адреса **stateProvince** BlackBerry.

*   **postalCode**: поддерживается. Хранится в поле адреса **zipPostal** BlackBerry.

*   **страна**: поддерживается.

### FirefoxOS причуды

*   **Формат**: в настоящее время не поддерживается

### iOS причуды

*   **ап**: не поддерживается на устройствах iOS, возвращая`false`.

*   **Формат**: в настоящее время не поддерживается.

### Совместимости Windows 8

*   **ап**: не поддерживается

## ContactError

`ContactError`Объект возвращается пользователю через `contactError` функцию обратного вызова при возникновении ошибки.

### Свойства

*   **код**: один из предопределенных кодов, перечисленных ниже.

### Константы

*   `ContactError.UNKNOWN_ERROR` (code 0)
*   `ContactError.INVALID_ARGUMENT_ERROR` (code 1)
*   `ContactError.TIMEOUT_ERROR` (code 2)
*   `ContactError.PENDING_OPERATION_ERROR` (code 3)
*   `ContactError.IO_ERROR` (code 4)
*   `ContactError.NOT_SUPPORTED_ERROR` (code 5)
*   `ContactError.PERMISSION_DENIED_ERROR` (code 20)

## ContactField

`ContactField`Объект-это повторно используемый компонент, что представляет родово контактные поля. Каждый `ContactField` объект содержит `value` , `type` , и `pref` Свойства. A `Contact` объект хранит несколько свойств в `ContactField[]` массивы, например номера телефонов, адреса электронной почты.

В большинстве случаев, отсутствуют заранее определенные значения для `ContactField` **тип** атрибута объекта. Например номер телефона можно указать значения **типа** *дома*, *работы*, *Мобильная*, *iPhone*или любого другого значения, Поддерживаемые платформы конкретного устройства базы данных контактов. Однако, для `Contact` **фотографии** поля, **тип** поля указывает формат возвращаемого изображения: **URL-адрес,** когда атрибут **value** содержит URL-адрес изображения фото, или *base64* , если **значение** содержит строку изображения в кодировке base64.

### Свойства

*   **тип**: строка, указывающая тип поля, *дома* , например. *(DOMString)*

*   **значение**: значение поля, такие как телефонный номер или адрес электронной почты. *(DOMString)*

*   **pref**: набор `true` Если `ContactField` содержит значение предпочтительный для пользователя. *(логическое)*

### Поддерживаемые платформы

*   Amazon Fire ОС
*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 и 8
*   Windows 8

### Пример

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
    

### Android причуды

*   **ап**: не поддерживается, возвращая`false`.

### Причуды blackBerry 10

*   **тип**: частично поддерживается. Используется для телефонных номеров.

*   **значение**: поддерживается.

*   **ап**: не поддерживается, возвращая`false`.

### iOS причуды

*   **ап**: не поддерживается, возвращая`false`.

### Причуды Windows8

*   **ап**: не поддерживается, возвращая`false`.

## ContactName

Содержит различные сведения о `Contact` имя объекта.

### Свойства

*   **Формат**: полное имя контакта. *(DOMString)*

*   **familyName**: семья имя контакта. *(DOMString)*

*   **givenName**: имя контакта. *(DOMString)*

*   **отчество**: отчество контакта. *(DOMString)*

*   **honorificPrefix**: контакта префикс (например, *г-н* или *доктор*) *(DOMString)*

*   **honorificSuffix**: контакта суффикс (например, *эсквайр*). *(DOMString)*

### Поддерживаемые платформы

*   Amazon Fire ОС
*   Android 2.X
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 и 8
*   Windows 8

### Пример

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
    

### Android причуды

*   **Формат**: частично поддерживается и только для чтения. Возвращает объединение `honorificPrefix` , `givenName` , `middleName` , `familyName` , и`honorificSuffix`.

### Причуды blackBerry 10

*   **Формат**: частично поддерживается. Возвращает сцепление BlackBerry полей **firstName** и **lastName** .

*   **familyName**: поддерживается. Хранится в поле **«Фамилия»** BlackBerry.

*   **givenName**: поддерживается. Хранится в поле **firstName** BlackBerry.

*   **отчество**: не поддерживается, возвращая`null`.

*   **honorificPrefix**: не поддерживается, возвращая`null`.

*   **honorificSuffix**: не поддерживается, возвращая`null`.

### FirefoxOS причуды

*   **Формат**: частично поддерживается и только для чтения. Возвращает объединение `honorificPrefix` , `givenName` , `middleName` , `familyName` , и`honorificSuffix`.

### iOS причуды

*   **Формат**: частично поддерживается. Возвращает iOS составного имени, но только для чтения.

### Совместимости Windows 8

*   **Формат**: это единственное имя свойства и идентичен `displayName` , и`nickname`

*   **familyName**: не поддерживается

*   **givenName**: не поддерживается

*   **отчество**: не поддерживается

*   **honorificPrefix**: не поддерживается

*   **honorificSuffix**: не поддерживается

## ContactOrganization

`ContactOrganization`Объект сохраняет свойства организации контакта. A `Contact` объект хранит один или более `ContactOrganization` объектов в массиве.

### Свойства

*   **pref**: набор `true` Если `ContactOrganization` содержит значение предпочтительный для пользователя. *(логическое)*

*   **тип**: строка, указывающая тип поля, *дома* , например. _(DOMString)

*   **имя**: имя Организации. *(DOMString)*

*   **Департамент**: Департамент контракт работает для. *(DOMString)*

*   **название**: название контакта в Организации. *(DOMString)*

### Поддерживаемые платформы

*   Android
*   BlackBerry 10
*   Firefox OS
*   iOS
*   Windows Phone 7 и 8

### Пример

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
    

### Причуды Android 2.X

*   **ап**: не поддерживается устройствами Android 2.X, возвращая`false`.

### Причуды blackBerry 10

*   **ап**: не поддерживается на устройствах BlackBerry, возвращая`false`.

*   **тип**: не поддерживается на устройствах BlackBerry, возвращая`null`.

*   **имя**: частично поддерживается. Имя первой организации хранится в поле **компании** BlackBerry.

*   **Департамент**: не поддерживается, возвращая`null`.

*   **название**: частично поддерживается. Первый титул организации хранится в поле **название должности** BlackBerry.

### Firefox OS причуды

*   **ап**: не поддерживается

*   **тип**: не поддерживается

*   **Департамент**: не поддерживается

*   Поля **имя** и **название** **org** и **название должности** , хранящиеся в.

### iOS причуды

*   **ап**: не поддерживается на устройствах iOS, возвращая`false`.

*   **тип**: не поддерживается на устройствах iOS, возвращая`null`.

*   **имя**: частично поддерживается. Имя первой организации хранится в поле **kABPersonOrganizationProperty** iOS.

*   **Департамент**: частично поддерживается. Имя первого Департамента хранится в поле **kABPersonDepartmentProperty** iOS.

*   **название**: частично поддерживается. Первый титул сохраняется в поле **kABPersonJobTitleProperty** iOS.