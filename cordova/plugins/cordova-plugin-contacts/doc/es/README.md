<!---
# license: Licensed to the Apache Software Foundation (ASF) under one
#         or more contributor license agreements.  See the NOTICE file
#         distributed with this work for additional information
#         regarding copyright ownership.  The ASF licenses this file
#         to you under the Apache License, Version 2.0 (the
#         "License"); you may not use this file except in compliance
#         with the License.  You may obtain a copy of the License at
#
#           http://www.apache.org/licenses/LICENSE-2.0
#
#         Unless required by applicable law or agreed to in writing,
#         software distributed under the License is distributed on an
#         "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
#         KIND, either express or implied.  See the License for the
#         specific language governing permissions and limitations
#         under the License.
-->

# cordova-plugin-contacts

[![Build Status](https://travis-ci.org/apache/cordova-plugin-contacts.svg)](https://travis-ci.org/apache/cordova-plugin-contacts)

Este plugin define un global `navigator.contacts` objeto que proporciona acceso a la base de datos de contactos de dispositivo.

Aunque el objeto está unido al ámbito global `navigator` , no estará disponible hasta después de la `deviceready` evento.

    document.addEventListener("deviceready", onDeviceReady, false);
    function onDeviceReady() {
        console.log(navigator.contacts);
    }
    

**ADVERTENCIA**: recopilación y uso de datos plantea cuestiones de privacidad importante. Política de privacidad de su aplicación debe discutir cómo la aplicación utiliza datos de contacto y si es compartida con terceros. Información de contacto se considera sensible porque revela la gente con quien se comunica una persona. Por lo tanto, además de política de privacidad de la app, fuertemente considere dar un aviso de just-in-time antes de la aplicación accede a ellos o utiliza los datos de contacto, si el sistema operativo del dispositivo no hacerlo ya. Que el aviso debe proporcionar la misma información mencionada, además de obtener un permiso del usuario (por ejemplo, presentando opciones para **Aceptar** y **No gracias**). Tenga en cuenta que algunos mercados de aplicación podrán exigir la aplicación para proporcionar un aviso de just-in-time y obtener el permiso del usuario antes de acceder a datos de contacto. Una experiencia de usuario clara y fácil de entender que rodean el uso de contacto datos ayuda a evitar la confusión del usuario y percibe uso indebido de los datos de contacto. Para obtener más información, por favor consulte a la guía de privacidad.

## Instalación

Esto requiere cordova 5.0 + (v1.0.0 estable actual)

    cordova plugin add cordova-plugin-contacts
    

Las versiones más antiguas de Córdoba todavía pueden instalar mediante el id de **obsoleto** (viejo v0.2.16)

    cordova plugin add org.apache.cordova.contacts
    

También es posible instalar directamente vía url repo (inestable)

    cordova plugin add https://github.com/apache/cordova-plugin-contacts.git
    

### Firefox OS rarezas

Crear **www/manifest.webapp** como se describe en [Manifestar Docs](https://developer.mozilla.org/en-US/Apps/Developing/Manifest). Agregar permisos pertinentes. También hay una necesidad de cambiar el tipo de aplicación a "privilegiados" - [Docs manifiestan](https://developer.mozilla.org/en-US/Apps/Developing/Manifest#type). **ADVERTENCIA**: todas las apps privilegiadas aplicar [Política de seguridad de contenidos](https://developer.mozilla.org/en-US/Apps/CSP) que prohíbe en línea de comandos. Inicializar la aplicación de otra manera.

    "type": "privileged",
    "permissions": {
        "contacts": {
            "access": "readwrite",
            "description": "Describe why there is a need for such permission"
        }
    }
    

### Windows rarezas

**Antes de Windows 10:** Contactos `encontrar` y `pickContact` métodos son sólo lectura, por lo que su aplicación no puede modificarlos. método `Find` disponible sólo en dispositivos Windows Phone 8.1.

**Windows 10 y anteriores:** Contactos se pueden guardar y se guarda en almacenamiento local de la aplicación contactos. Contactos también pueden ser eliminados.

### Rarezas de Windows 8

Windows 8 contactos son de sólo lectura. Través de los contactos de la API de Córdoba no son consultables/búsqueda, se debe informar al usuario a buscar un contacto como una llamada a contacts.pickContact que se abrirá la aplicación 'Personas' donde el usuario debe elegir un contacto. Cualquier contacto volvió es readonly, su aplicación no puede modificarlos.

## Navigator.Contacts

### Métodos

  * navigator.contacts.create
  * navigator.contacts.find
  * navigator.contacts.pickContact

### Objetos

  * Contact
  * ContactName
  * ContactField
  * ContactAddress
  * ContactOrganization
  * ContactFindOptions
  * ContactError
  * ContactFieldType

## navigator.contacts.create

El `navigator.contacts.create` método es sincrónico y devuelve una nueva `Contact` objeto.

Este método no retiene el objeto de contacto en la base de contactos de dispositivo, para lo cual necesita invocar el `Contact.save` método.

### Plataformas soportadas

  * Android
  * BlackBerry 10
  * Firefox OS
  * iOS
  * Windows Phone 7 y 8

### Ejemplo

    var myContact = navigator.contacts.create({"displayName": "Test User"});
    

## navigator.contacts.find

El `navigator.contacts.find` método se ejecuta asincrónicamente, consultando la base de datos de contactos de dispositivo y devolver una matriz de `Contact` objetos. Los objetos resultantes son pasados a la `contactSuccess` función de devolución de llamada especificada por el parámetro **contactSuccess** .

El parámetro **contactFields** especifica los campos para ser utilizado como un calificador de búsqueda. Un parámetro de longitud cero **contactFields** no es válido y resultados en `ContactError.INVALID_ARGUMENT_ERROR` . Un valor de **contactFields** de `"*"` busca campos todo contactos.

La cadena de **contactFindOptions.filter** puede ser usada como un filtro de búsqueda al consultar la base de datos de contactos. Si proporciona, una entre mayúsculas y minúsculas, coincidencia parcial valor se aplica a cada campo especificado en el parámetro **contactFields** . Si hay un partido para *cualquier* de los campos especificados, se devuelve el contacto. Uso **contactFindOptions.desiredFields** parámetro al control que Contacta con propiedades debe devolverse atrás.

### Parámetros

  * **contactFields**: póngase en contacto con campos para usar como un calificador de búsqueda. *(DOMString[])* [Required]

  * **contactSuccess**: función de callback de éxito se invoca con la matriz de objetos contacto devueltos desde la base de datos. [Required]

  * **contactError**: función de callback de Error, se invoca cuando se produce un error. [Opcional]

  * **contactFindOptions**: buscar opciones para filtrar navigator.contacts. [Optional]
    
    Claves incluyen:
    
      * **filtro**: la cadena de búsqueda utilizada para encontrar navigator.contacts. *(DOMString)* (Por defecto:`""`)
    
      * **múltiples**: determina si la operación de búsqueda devuelve múltiples navigator.contacts. *(Booleano)* (Por defecto:`false`)
        
          * **desiredFields**: póngase en contacto con campos para volver atrás. Si se especifica, la resultante `Contact` objeto sólo cuenta con los valores de estos campos. *(DOMString[])* [Optional]

### Plataformas soportadas

  * Android
  * BlackBerry 10
  * Firefox OS
  * iOS
  * Windows Phone 7 y 8
  * Windows (Windows Phone 8.1 y Windows 10)

### Ejemplo

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
    

### Windows rarezas

  * `__contactFields__`No se admite y se ignorará. `find`método siempre tratará de coincidir con el nombre, dirección de correo electrónico o número de teléfono de un contacto.

## navigator.contacts.pickContact

El `navigator.contacts.pickContact` método lanza el selector para seleccionar un único contacto contacto. El objeto resultante se pasa a la `contactSuccess` función de devolución de llamada especificada por el parámetro **contactSuccess** .

### Parámetros

  * **contactSuccess**: función de callback de éxito se invoca con el único objeto de contacto. [Obligatorio]

  * **contactError**: función de callback de Error, se invoca cuando se produce un error. [Opcional]

### Plataformas soportadas

  * Android
  * iOS
  * Windows Phone 8
  * Windows 8
  * Windows

### Ejemplo

    navigator.contacts.pickContact(function(contact) {console.log (' se ha seleccionado el siguiente contacto: "+ JSON.stringify(contact));
        }, function(err) {console.log ('Error: ' + err);
        });
    

## Contact

El `Contact` objeto representa el contacto de un usuario. Contactos pueden ser creados, almacenados o eliminados de la base de datos de contactos de dispositivo. Contactos pueden también ser obtenidos (individualmente o a granel) de la base de datos invocando el `navigator.contacts.find` método.

**Nota**: no todos los campos de contacto mencionados son compatibles con la plataforma de cada dispositivo. Consulte sección *peculiaridades* de cada plataforma para más detalles.

### Propiedades

  * **ID**: un identificador único global. *(DOMString)*

  * **displayName**: el nombre de este contacto, conveniente para la exhibición a los usuarios finales. *(DOMString)*

  * **nombre**: un objeto que contiene todos los componentes de un nombre de las personas. *(ContactName)*

  * **apodo**: un nombre para abordar el contacto casual. *(DOMString)*

  * **números**: una matriz de números de teléfono de contacto. *(ContactField[])*

  * **correos electrónicos**: un conjunto de direcciones de correo electrónico del contacto. *(ContactField[])*

  * **direcciones**: un conjunto de direcciones de todos los contactos. *(ContactAddress[])*

  * **IMS**: un conjunto de direcciones de todos los contactos IM. *(ContactField[])*

  * **organizaciones**: un conjunto de organizaciones de todos los contactos. *(ContactOrganization[])*

  * **cumpleaños**: el cumpleaños del contacto. *(Fecha)*

  * **Nota**: una nota sobre el contacto. *(DOMString)*

  * **fotos**: una serie de fotos de los contactos. *(ContactField[])*

  * **categorías**: una matriz de todas las categorías definidas por el usuario asociado con el contacto. *(ContactField[])*

  * **URL**: un conjunto de páginas web asociadas con el contacto. *(ContactField[])*

### Métodos

  * **clon**: devuelve un nuevo `Contact` objeto que es una copia en profundidad del objeto de llamadas con el `id` propiedad establecida en`null`.

  * **eliminar**: elimina el contacto de la base de datos de contactos de dispositivo, si no se ejecuta un callback de error con un `ContactError` objeto.

  * **Guardar**: guarda un nuevo contacto en la base de datos de contactos de dispositivo o actualiza un contacto existente si ya existe un contacto con el mismo **id** .

### Plataformas soportadas

  * Amazon fire OS
  * Android
  * BlackBerry 10
  * Firefox OS
  * iOS
  * Windows Phone 7 y 8
  * Windows 8
  * Windows

### Salvar ejemplo

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
    

### Ejemplo de clon

        clon del clon de contacto objeto var = contact.clone();
        clone.name.givenName = "John";
        Console.log ("contacto Original nombre =" + contact.name.givenName);
        Console.log ("Cloned contacto nombre =" + clone.name.givenName);
    

### Quitar ejemplo

    function onSuccess() {
        alert("Removal Success");
    };
    
    function onError(contactError) {
        alert("Error = " + contactError.code);
    };
    
    // remove the contact from the device
    contact.remove(onSuccess,onError);
    

### Rarezas Android 2.X

  * **categories**: no compatible con dispositivos Android 2.X, devolver `null`.

### BlackBerry 10 rarezas

  * **ID**: asignado por el dispositivo cuando se guarda el contacto.

### FirefoxOS rarezas

  * **categorías**: parcialmente soportado. Campos **pref** y **tipo** regresan`null`

  * **IMS**: no se admite

  * **fotos**: no se admite

### iOS rarezas

  * **displayName**: no compatible con iOS, regresando `null` si no hay ningún `ContactName` especifica, en cuyo caso devuelve el nombre del compuesto, **apodo** o `""` , respectivamente.

  * **cumpleaños**: debe ser de entrada como un JavaScript `Date` objeto, del mismo modo que se la devuelvan.

  * **fotos**: devuelve una dirección URL del archivo de la imagen, que se almacena en el directorio temporal de la aplicación. Contenidos del directorio temporal se eliminan cuando salga de la aplicación.

  * **categorías**: esta propiedad actualmente no es compatible, regresando`null`.

### Windows Phone 7 y 8 rarezas

  * **displayName**: cuando se crea un contacto, previsto para el parámetro de nombre pantalla difiere el nombre para mostrar el valor obtenido al encontrar el contacto.

  * **URL**: cuando se crea un contacto, los usuarios pueden ingresar y salvar más de una dirección web, pero sólo está disponible cuando busque el contacto.

  * **números**: no se admite la opción *pref* . El *tipo* no se admite en una operación de *encontrar* . Solamente un `phoneNumber` está permitido para cada *tipo*.

  * **correos electrónicos**: no se admite la opción *pref* . Home y referencias misma entrada de correo electrónico. Se permite solamente una entrada para cada *tipo*.

  * **direcciones**: soporta sólo trabajo y hogar/personal *tipo*. La casa y personales de *tipo* referencia la misma entrada de dirección. Se permite solamente una entrada para cada *tipo*.

  * **organizaciones**: sólo está permitido y no es compatible con los atributos *pref*, *tipo*y *Departamento* .

  * **Nota**: no compatible, regresando`null`.

  * **ims**: no soportado, devolver `null`.

  * **cumpleaños**: no soportado, regresando`null`.

  * **categorías**: no soportado, regresando`null`.

  * **remove**: no se admite el método

### Windows rarezas

  * **fotos**: devuelve una dirección URL del archivo de la imagen, que se almacena en el directorio temporal de la aplicación.

  * **cumpleaños**: no soportado, regresando`null`.

  * **categorías**: no soportado, regresando`null`.

  * **remove**: el método sólo es soportado en Windows 10 o superior.

## ContactAddress

El `ContactAddress` objeto almacena las propiedades de una única dirección de un contacto. A `Contact` objeto puede incluir más de una dirección en un `ContactAddress[]` matriz.

### Propiedades

  * **pref**: establecido en `true` si esta `ContactAddress` contiene el usuario preferido de valor. *(boolean)*

  * **type**: una cadena que indica qué tipo de campo es, *home* por ejemplo. *(DOMString)*

  * **formatted**: la dirección completa con formato de visualización. *(DOMString)*

  * **streetAddress**: la dirección completa. *(DOMString)*

  * **locality**: la ciudad o localidad. *(DOMString)*

  * **region**: el estado o la región. *(DOMString)*

  * **postalCode**: el código postal o código postal. *(DOMString)*

  * **country**: el nombre del país. *(DOMString)*

### Plataformas soportadas

  * Amazon fire OS
  * Android
  * BlackBerry 10
  * Firefox OS
  * iOS
  * Windows Phone 7 y 8
  * Windows 8
  * Windows

### Ejemplo

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
    

### Rarezas Android 2.X

  * **pref**: no soportado, devolviendo `false` en dispositivos Android 2.X.

### BlackBerry 10 rarezas

  * **pref**: no compatible con dispositivos BlackBerry, devolviendo `false`.

  * **type**: parcialmente soportado. Sólo uno de cada *Work* y *Home* tipo direcciones puede ser almacenado por contacto.

  * **formatted**: parcialmente soportado. Devuelve una concatenación de todos los campos de dirección de BlackBerry.

  * **streetAddress**: soportado. Devuelve una concatenación de BlackBerry **address1** y **2** campos de dirección.

  * **locality**: apoyado. Almacenada en el campo de dirección de la **city** de BlackBerry.

  * **region**: apoyado. Almacenada en el campo de dirección de BlackBerry **stateProvince**.

  * **postalCode**: apoyado. Almacenada en el campo de dirección de BlackBerry **zipPostal**.

  * **country**: apoyado.

### FirefoxOS rarezas

  * **formato**: actualmente no se admite

### iOS rarezas

  * **pref**: no se admite en dispositivos iOS, devolviendo `false`.

  * **formatted**: actualmente no se admite.

### Rarezas de Windows 8

  * **Pref**: no se admite

### Windows rarezas

  * **Pref**: no se admite

## ContactError

El `ContactError` objeto se devuelve al usuario a través de la `contactError` función de devolución de llamada cuando se produce un error.

### Propiedades

  * **code**: uno de los códigos de error predefinido enumerados a continuación.

### Constantes

  * `ContactError.UNKNOWN_ERROR` (code 0)
  * `ContactError.INVALID_ARGUMENT_ERROR` (code 1)
  * `ContactError.TIMEOUT_ERROR` (code 2)
  * `ContactError.PENDING_OPERATION_ERROR` (code 3)
  * `ContactError.IO_ERROR` (code 4)
  * `ContactError.NOT_SUPPORTED_ERROR` (code 5)
  * `ContactError.PERMISSION_DENIED_ERROR` (code 20)

## ContactField

El `ContactField` objeto es un componente reutilizable que representa en contacto con campos genéricamente. Cada `ContactField` objeto contiene un `value` , `type` , y `pref` propiedad. A `Contact` objeto almacena varias propiedades en `ContactField[]` arreglos de discos, como las direcciones de teléfono números y correo electrónico.

En la mayoría de los casos, no existen previamente determinados valores para un `ContactField` atributo **type** del objeto. Por ejemplo, un número de teléfono puede especificar valores de **tipo** de *hogar*, *trabajo*, *móvil*, *iPhone*o cualquier otro valor que es apoyado por contacto de base de datos de una plataforma dispositivo determinado. Sin embargo, para el `Contact` **fotos de** campo, el campo **tipo** indica el formato de la imagen devuelta: **url** cuando el atributo de **valor** contiene una dirección URL de la imagen de la foto, o *base64* cuando el **valor** contiene una cadena codificada en base64 imagen.

### Propiedades

  * **tipo**: una cadena que indica qué tipo de campo es, *casa* por ejemplo. *(DOMString)*

  * **valor**: el valor del campo, como un teléfono número o dirección de email. *(DOMString)*

  * **Pref**: A `true` si este `ContactField` contiene el valor del usuario preferido. *(booleano)*

### Plataformas soportadas

  * Amazon fire OS
  * Android
  * BlackBerry 10
  * Firefox OS
  * iOS
  * Windows Phone 7 y 8
  * Windows 8
  * Windows

### Ejemplo

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
    

### Rarezas Android

  * **Pref**: no soportado, regresando`false`.

### BlackBerry 10 rarezas

  * **tipo**: parcialmente soportado. Utilizado para los números de teléfono.

  * **valor**: apoyado.

  * **Pref**: no soportado, regresando`false`.

### iOS rarezas

  * **Pref**: no soportado, regresando`false`.

### Windows8 rarezas

  * **Pref**: no soportado, regresando`false`.

### Windows rarezas

  * **Pref**: no soportado, regresando`false`.

## ContactName

Contiene diferentes tipos de información sobre un `Contact` nombre del objeto.

### Propiedades

  * **formato**: el nombre completo del contacto. *(DOMString)*

  * **familia**: el nombre del contacto familiar. *(DOMString)*

  * **givenName**: nombre del contacto. *(DOMString)*

  * **middleName**: el nombre del contacto media. *(DOMString)*

  * **honorificPrefix**: prefijo del contacto (ejemplo *señor* o *doctor*) *(DOMString)*

  * **honorificSuffix**: sufijo de contacto (ejemplo *Esq.*). *(DOMString)*

### Plataformas soportadas

  * Amazon fire OS
  * Android
  * BlackBerry 10
  * Firefox OS
  * iOS
  * Windows Phone 7 y 8
  * Windows 8
  * Windows

### Ejemplo

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
    

### Rarezas Android

  * **formato**: parcialmente compatibles y de sólo lectura. Devuelve una concatenación de `honorificPrefix` , `givenName` , `middleName` , `familyName` , y`honorificSuffix`.

### BlackBerry 10 rarezas

  * **formato**: parcialmente soportado. Devuelve una concatenación de campos **firstName** y **lastName** de BlackBerry.

  * **familia**: apoyo. Almacenada en el campo **lastName** BlackBerry.

  * **givenName**: apoyado. Almacenados en campo **firstName** BlackBerry.

  * **middleName**: no soportado, regresando`null`.

  * **honorificPrefix**: no soportado, regresando`null`.

  * **honorificSuffix**: no soportado, regresando`null`.

### FirefoxOS rarezas

  * **formato**: parcialmente compatibles y de sólo lectura. Devuelve una concatenación de `honorificPrefix` , `givenName` , `middleName` , `familyName` , y`honorificSuffix`.

### iOS rarezas

  * **formato**: parcialmente soportado. Devuelve iOS nombre compuesto, pero es de sólo lectura.

### Rarezas de Windows 8

  * **formato**: este es el único nombre de propiedad y es idéntico al `displayName` , y`nickname`

  * **familia**: no se admite

  * **givenName**: no se admite

  * **middleName**: no se admite

  * **honorificPrefix**: no se admite

  * **honorificSuffix**: no se admite

### Windows rarezas

  * **formato**: es idéntica a`displayName`

## ContactOrganization

El `ContactOrganization` objeto almacena las propiedades de organización de un contacto. A `Contact` objeto almacena uno o más `ContactOrganization` los objetos en una matriz.

### Propiedades

  * **Pref**: A `true` si este `ContactOrganization` contiene el valor del usuario preferido. *(booleano)*

  * **tipo**: una cadena que indica qué tipo de campo es, *casa* por ejemplo. _(DOMString)

  * **nombre**: el nombre de la organización. *(DOMString)*

  * **Departamento**: el contrato de obras para el departamento. *(DOMString)*

  * **título**: título del contacto de la organización. *(DOMString)*

### Plataformas soportadas

  * Android
  * BlackBerry 10
  * Firefox OS
  * iOS
  * Windows Phone 7 y 8
  * Windows (sólo dispositivos Windows 8.1 y 8.1 de Windows Phone)

### Ejemplo

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
    

### Rarezas Android 2.X

  * **Pref**: no compatible con dispositivos Android 2.X, regresando`false`.

### BlackBerry 10 rarezas

  * **Pref**: no compatible con dispositivos BlackBerry, regresando`false`.

  * **tipo**: no compatible con dispositivos BlackBerry, regresando`null`.

  * **nombre**: parcialmente soportado. El primer nombre de la organización se almacena en el campo de la **empresa** BlackBerry.

  * **Departamento**: no soportado, regresando`null`.

  * **título**: parcialmente soportado. El primer título de la organización se almacena en el campo de **jobTitle** BlackBerry.

### Firefox OS rarezas

  * **Pref**: no se admite

  * **tipo**: no se admite

  * **Departamento**: no se admite

  * Los campos **nombre** y **título** almacenado en **org** y **jobTitle**.

### iOS rarezas

  * **pref**: no se admite en dispositivos iOS, devolviendo `false`.

  * **tipo**: no se admite en dispositivos iOS, regresando`null`.

  * **nombre**: parcialmente soportado. El primer nombre de la organización se almacena en el campo de **kABPersonOrganizationProperty** de iOS.

  * **Departamento**: parcialmente soportado. El primer nombre de departamento se almacena en el campo de **kABPersonDepartmentProperty** de iOS.

  * **título**: parcialmente soportado. El primer título se almacena en el campo de **kABPersonJobTitleProperty** de iOS.

### Windows rarezas

  * **Pref**: no soportado, regresando`false`.

  * **tipo**: no soportado, regresando`null`.