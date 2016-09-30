---
title: Contacts
description: Manage the contacts on the device.
---
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

|Android|iOS| Windows 8.1 Store | Windows 8.1 Phone | Windows 10 Store | Travis CI |
|:-:|:-:|:-:|:-:|:-:|:-:|
|[![Build Status](http://cordova-ci.cloudapp.net:8080/buildStatus/icon?job=cordova-periodic-build/PLATFORM=android,PLUGIN=cordova-plugin-contacts)](http://cordova-ci.cloudapp.net:8080/job/cordova-periodic-build/PLATFORM=android,PLUGIN=cordova-plugin-contacts/)|[![Build Status](http://cordova-ci.cloudapp.net:8080/buildStatus/icon?job=cordova-periodic-build/PLATFORM=ios,PLUGIN=cordova-plugin-contacts)](http://cordova-ci.cloudapp.net:8080/job/cordova-periodic-build/PLATFORM=ios,PLUGIN=cordova-plugin-contacts/)|[![Build Status](http://cordova-ci.cloudapp.net:8080/buildStatus/icon?job=cordova-periodic-build/PLATFORM=windows-8.1-store,PLUGIN=cordova-plugin-contacts)](http://cordova-ci.cloudapp.net:8080/job/cordova-periodic-build/PLATFORM=windows-8.1-store,PLUGIN=cordova-plugin-contacts/)|[![Build Status](http://cordova-ci.cloudapp.net:8080/buildStatus/icon?job=cordova-periodic-build/PLATFORM=windows-8.1-phone,PLUGIN=cordova-plugin-contacts)](http://cordova-ci.cloudapp.net:8080/job/cordova-periodic-build/PLATFORM=windows-8.1-phone,PLUGIN=cordova-plugin-contacts/)|[![Build Status](http://cordova-ci.cloudapp.net:8080/buildStatus/icon?job=cordova-periodic-build/PLATFORM=windows-10-store,PLUGIN=cordova-plugin-contacts)](http://cordova-ci.cloudapp.net:8080/job/cordova-periodic-build/PLATFORM=windows-10-store,PLUGIN=cordova-plugin-contacts/)|[![Build Status](https://travis-ci.org/apache/cordova-plugin-contacts.svg?branch=master)](https://travis-ci.org/apache/cordova-plugin-contacts)

# cordova-plugin-contacts

This plugin defines a global `navigator.contacts` object, which provides access to the device contacts database.

Although the object is attached to the global scoped `navigator`, it is not available until after the `deviceready` event.
```js
document.addEventListener("deviceready", onDeviceReady, false);
function onDeviceReady() {
console.log(navigator.contacts);
}
```

__WARNING__: Collection and use of contact data raises
important privacy issues.  Your app's privacy policy should discuss
how the app uses contact data and whether it is shared with any other
parties.  Contact information is considered sensitive because it
reveals the people with whom a person communicates.  Therefore, in
addition to the app's privacy policy, you should strongly consider
providing a just-in-time notice before the app accesses or uses
contact data, if the device operating system doesn't do so
already. That notice should provide the same information noted above,
as well as obtaining the user's permission (e.g., by presenting
choices for __OK__ and __No Thanks__).  Note that some app
marketplaces may require the app to provide a just-in-time notice and
obtain the user's permission before accessing contact data.  A
clear and easy-to-understand user experience surrounding the use of
contact data helps avoid user confusion and perceived misuse of
contact data.  For more information, please see the [Privacy Guide](http://cordova.apache.org/docs/en/latest/guide/appdev/privacy/index.html).

Report issues with this plugin on the [Apache Cordova issue tracker](https://issues.apache.org/jira/issues/?jql=project%20%3D%20CB%20AND%20status%20in%20%28Open%2C%20%22In%20Progress%22%2C%20Reopened%29%20AND%20resolution%20%3D%20Unresolved%20AND%20component%20%3D%20%22Plugin%20Contacts%22%20ORDER%20BY%20priority%20DESC%2C%20summary%20ASC%2C%20updatedDate%20DESC)

## Installation

This requires cordova 5.0+ ( current stable v1.0.0 )

    cordova plugin add cordova-plugin-contacts
Older versions of cordova can still install via the __deprecated__ id ( stale v0.2.16 )

    cordova plugin add org.apache.cordova.contacts
It is also possible to install via repo url directly ( unstable )

    cordova plugin add https://github.com/apache/cordova-plugin-contacts.git


### iOS Quirks

Since iOS 10 it's mandatory to add a `NSContactsUsageDescription` entry in the info.plist.

`NSContactsUsageDescription` describes the reason that the app accesses the user’s contacts. When the system prompts the user to allow access, this string is displayed as part of the dialog box. To add this entry you can pass the variable `CONTACTS_USAGE_DESCRIPTION` on plugin install.

Example:
`cordova plugin add cordova-plugin-contacts --variable CONTACTS_USAGE_DESCRIPTION="your usage message"`

If you don't pass the variable, the plugin will add an empty string as value.

### Firefox OS Quirks

Create __www/manifest.webapp__ as described in
[Manifest Docs](https://developer.mozilla.org/en-US/Apps/Developing/Manifest).
Add relevant permisions.
There is also a need to change the webapp type to "privileged"  - [Manifest Docs](https://developer.mozilla.org/en-US/Apps/Developing/Manifest#type).
__WARNING__: All privileged apps enforce [Content Security Policy](https://developer.mozilla.org/en-US/Apps/CSP) which forbids inline script. Initialize your application in another way.

```json
"type": "privileged",
"permissions": {
	"contacts": {
		"access": "readwrite",
		"description": "Describe why there is a need for such permission"
	}
}
```
### Windows Quirks

**Prior to Windows 10:** Any contacts returned from `find` and `pickContact` methods are readonly, so your application cannot modify them.
`find` method available only on Windows Phone 8.1 devices.

**Windows 10 and above:** Contacts may be saved and will be saved to app-local contacts storage.  Contacts may also be deleted.

### Windows 8 Quirks

Windows 8 Contacts are readonly. Via the Cordova API Contacts are not queryable/searchable, you should inform the user to pick a contact as a call to contacts.pickContact which will open the 'People' app where the user must choose a contact.
Any contacts returned are readonly, so your application cannot modify them.

## navigator.contacts

### Methods

- navigator.contacts.create
- navigator.contacts.find
- navigator.contacts.pickContact

### Objects

- Contact
- ContactName
- ContactField
- ContactAddress
- ContactOrganization
- ContactFindOptions
- ContactError
- ContactFieldType

## navigator.contacts.create

The `navigator.contacts.create` method is synchronous, and returns a new `Contact` object.

This method does not retain the Contact object in the device contacts
database, for which you need to invoke the `Contact.save` method.

### Supported Platforms

- Android
- BlackBerry 10
- Firefox OS
- iOS
- Windows Phone 8

### Example

```js
    var myContact = navigator.contacts.create({"displayName": "Test User"});
```

## navigator.contacts.find

The `navigator.contacts.find` method executes asynchronously, querying the
device contacts database and returning an array of `Contact` objects.
The resulting objects are passed to the `contactSuccess` callback
function specified by the __contactSuccess__ parameter.

The __contactFields__ parameter specifies the fields to be used as a
search qualifier.  A zero-length __contactFields__ parameter is invalid and results in
`ContactError.INVALID_ARGUMENT_ERROR`. A __contactFields__ value of
`"*"` searches all contact fields.

The __contactFindOptions.filter__ string can be used as a search
filter when querying the contacts database.  If provided, a
case-insensitive, partial value match is applied to each field
specified in the __contactFields__ parameter.  If there's a match for
_any_ of the specified fields, the contact is returned. Use __contactFindOptions.desiredFields__
parameter to control which contact properties must be returned back.

Supported values for both __contactFields__ and __contactFindOptions.desiredFields__ parameters are enumerated in [`ContactFieldType`](#contactfieldtype) object.

### Parameters

- __contactFields__: Contact fields to use as a search qualifier. _(DOMString[])_ [Required]

- __contactSuccess__: Success callback function invoked with the array of Contact objects returned from the database. [Required]

- __contactError__: Error callback function, invoked when an error occurs. [Optional]

- __contactFindOptions__: Search options to filter navigator.contacts. [Optional]

	Keys include:

	- __filter__: The search string used to find navigator.contacts. _(DOMString)_ (Default: `""`)

	- __multiple__: Determines if the find operation returns multiple navigator.contacts. _(Boolean)_ (Default: `false`)

    - __desiredFields__: Contact fields to be returned back. If specified, the resulting `Contact` object only features values for these fields. _(DOMString[])_ [Optional]

    - __hasPhoneNumber__(Android only): Filters the search to only return contacts with a phone number informed. _(Boolean)_ (Default: `false`)

### Supported Platforms

- Android
- BlackBerry 10
- Firefox OS
- iOS
- Windows Phone 8
- Windows (Windows Phone 8.1 and Windows 10)

### Example

```js
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
options.hasPhoneNumber = true;
var fields       = [navigator.contacts.fieldType.displayName, navigator.contacts.fieldType.name];
navigator.contacts.find(fields, onSuccess, onError, options);
```

### Windows Quirks

- `__contactFields__` is not supported and will be ignored. `find` method will always attempt to match the name, email address, or phone number of a contact.

## navigator.contacts.pickContact

The `navigator.contacts.pickContact` method launches the Contact Picker to select a single contact.
The resulting object is passed to the `contactSuccess` callback
function specified by the __contactSuccess__ parameter.

### Parameters

- __contactSuccess__: Success callback function invoked with the single Contact object. [Required]

- __contactError__: Error callback function, invoked when an error occurs. [Optional]

### Supported Platforms

- Android
- iOS
- Windows Phone 8
- Windows

### Example

```js
navigator.contacts.pickContact(function(contact){
        console.log('The following contact has been selected:' + JSON.stringify(contact));
    },function(err){
        console.log('Error: ' + err);
    });
```

### Android Quirks

This plugin launches an external Activity for picking contacts. See the
[Android Lifecycle Guide](http://cordova.apache.org/docs/en/latest/guide/platforms/android/index.html#lifecycle-guide)
for an explanation of how this affects your application. If the plugin returns
its result in the `resume` event, then you must first wrap the returned object
in a `Contact` object before using it. Here is an example:

```javascript
function onResume(resumeEvent) {
    if(resumeEvent.pendingResult) {
        if(resumeEvent.pendingResult.pluginStatus === "OK") {
            var contact = navigator.contacts.create(resumeEvent.pendingResult.result);
            successCallback(contact);
        } else {
            failCallback(resumeEvent.pendingResult.result);
        }
    }
}
```

## Contact

The `Contact` object represents a user's contact.  Contacts can be
created, stored, or removed from the device contacts database.
Contacts can also be retrieved (individually or in bulk) from the
database by invoking the `navigator.contacts.find` method.

__NOTE__: Not all of the contact fields listed above are supported on
every device platform.  Please check each platform's _Quirks_ section
for details.


### Properties

- __id__: A globally unique identifier. _(DOMString)_

- __displayName__: The name of this Contact, suitable for display to end users. _(DOMString)_

- __name__: An object containing all components of a persons name. _(ContactName)_

- __nickname__: A casual name by which to address the contact. _(DOMString)_

- __phoneNumbers__: An array of all the contact's phone numbers. _(ContactField[])_

- __emails__: An array of all the contact's email addresses. _(ContactField[])_

- __addresses__: An array of all the contact's addresses. _(ContactAddress[])_

- __ims__: An array of all the contact's IM addresses. _(ContactField[])_

- __organizations__: An array of all the contact's organizations. _(ContactOrganization[])_

- __birthday__: The birthday of the contact. _(Date)_

- __note__: A note about the contact. _(DOMString)_

- __photos__: An array of the contact's photos. _(ContactField[])_

- __categories__:  An array of all the user-defined categories associated with the contact. _(ContactField[])_

- __urls__:  An array of web pages associated with the contact. _(ContactField[])_

### Methods

- __clone__: Returns a new `Contact` object that is a deep copy of the calling object, with the `id` property set to `null`.

- __remove__: Removes the contact from the device contacts database, otherwise executes an error callback with a `ContactError` object.

- __save__: Saves a new contact to the device contacts database, or updates an existing contact if a contact with the same __id__ already exists.

### Supported Platforms

- Amazon Fire OS
- Android
- BlackBerry 10
- Firefox OS
- iOS
- Windows Phone 8
- Windows

### Save Example

```js
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
```

### Clone Example

```js
// clone the contact object
var clone = contact.clone();
clone.name.givenName = "John";
console.log("Original contact name = " + contact.name.givenName);
console.log("Cloned contact name = " + clone.name.givenName);
```

### Remove Example

```js
function onSuccess() {
    alert("Removal Success");
};

function onError(contactError) {
    alert("Error = " + contactError.code);
};

// remove the contact from the device
contact.remove(onSuccess,onError);
```
### Removing phone number(s) from a saved contact

```js
// Example to create a contact with 3 phone numbers and then remove
// 2 phone numbers. This example is for illustrative purpose only
var myContact = navigator.contacts.create({"displayName": "Test User"});
var phoneNumbers = [];

phoneNumbers[0] = new ContactField('work', '768-555-1234', false);
phoneNumbers[1] = new ContactField('mobile', '999-555-5432', true); // preferred number
phoneNumbers[2] = new ContactField('home', '203-555-7890', false);

myContact.phoneNumbers = phoneNumbers;
myContact.save(function (contact_obj) {
    var contactObjToModify = contact_obj.clone();
    contact_obj.remove(function(){
        var phoneNumbers = [contactObjToModify.phoneNumbers[0]];
        contactObjToModify.phoneNumbers = phoneNumbers;
        contactObjToModify.save(function(c_obj){
            console.log("All Done");
        }, function(error){
            console.log("Not able to save the cloned object: " + error);
        });
    }, function(contactError) {
        console.log("Contact Remove Operation failed: " + contactError);
    });
});
```

### Android 2.X Quirks

- __categories__:  Not supported on Android 2.X devices, returning `null`.

### BlackBerry 10 Quirks

- __id__: Assigned by the device when saving the contact.

### FirefoxOS Quirks

- __categories__: Partially supported. Fields __pref__ and __type__ are returning `null`

- __ims__: Not supported

- __photos__: Not supported


### iOS Quirks

- __displayName__: Not supported on iOS, returning `null` unless there is no `ContactName` specified, in which case it returns the composite name, __nickname__ or `""`, respectively.

- __birthday__: Must be input as a JavaScript `Date` object, the same way it is returned.

- __photos__: Returns a File URL to the image, which is stored in the application's temporary directory.  Contents of the temporary directory are removed when the application exits.

- __categories__:  This property is currently not supported, returning `null`.

### Windows Phone 8 Quirks

- __displayName__: When creating a contact, the value provided for the display name parameter differs from the display name retrieved when finding the contact.

- __urls__: When creating a contact, users can input and save more than one web address, but only one is available when searching the contact.

- __phoneNumbers__: The _pref_ option is not supported. The _type_ is not supported in a _find_ operation. Only one `phoneNumber` is allowed for each _type_.

- __emails__: The _pref_ option is not supported. Home and personal references same email entry. Only one entry is allowed for each _type_.

- __addresses__: Supports only work, and home/personal _type_. The home and personal _type_ reference the same address entry. Only one entry is allowed for each _type_.

- __organizations__: Only one is allowed, and does not support the _pref_, _type_, and _department_ attributes.

- __note__: Not supported, returning `null`.

- __ims__: Not supported, returning `null`.

- __birthdays__: Not supported, returning `null`.

- __categories__: Not supported, returning `null`.

- __remove__: Method is not supported

### Windows Quirks

- __photos__: Returns a File URL to the image, which is stored in the application's temporary directory.

- __birthdays__: Not supported, returning `null`.

- __categories__: Not supported, returning `null`.

- __remove__: Method is only supported in Windows 10 or above.

## ContactAddress

The `ContactAddress` object stores the properties of a single address
of a contact.  A `Contact` object may include more than one address in
a `ContactAddress[]` array.


### Properties

- __pref__: Set to `true` if this `ContactAddress` contains the user's preferred value. _(boolean)_

- __type__: A string indicating what type of field this is, _home_ for example. _(DOMString)_

- __formatted__: The full address formatted for display. _(DOMString)_

- __streetAddress__: The full street address. _(DOMString)_

- __locality__: The city or locality. _(DOMString)_

- __region__: The state or region. _(DOMString)_

- __postalCode__: The zip code or postal code. _(DOMString)_

- __country__: The country name. _(DOMString)_

### Supported Platforms

- Amazon Fire OS
- Android
- BlackBerry 10
- Firefox OS
- iOS
- Windows Phone 8
- Windows

### Example

```js
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
options.multiple = true;
var filter = ["displayName", "addresses"];
navigator.contacts.find(filter, onSuccess, onError, options);
```

### Android 2.X Quirks

- __pref__: Not supported, returning `false` on Android 2.X devices.

### BlackBerry 10 Quirks

- __pref__: Not supported on BlackBerry devices, returning `false`.

- __type__: Partially supported.  Only one each of _Work_ and _Home_ type addresses can be stored per contact.

- __formatted__: Partially supported.  Returns a concatenation of all BlackBerry address fields.

- __streetAddress__: Supported.  Returns a concatenation of BlackBerry __address1__ and __address2__ address fields.

- __locality__: Supported.  Stored in BlackBerry __city__ address field.

- __region__: Supported.  Stored in BlackBerry __stateProvince__ address field.

- __postalCode__: Supported.  Stored in BlackBerry __zipPostal__ address field.

- __country__: Supported.

### FirefoxOS Quirks

- __formatted__: Currently not supported

### iOS Quirks

- __pref__: Not supported on iOS devices, returning `false`.

- __formatted__: Currently not supported.

### Windows Quirks

- __pref__: Not supported


## ContactError

The `ContactError` object is returned to the user through the
`contactError` callback function when an error occurs.

### Properties

- __code__: One of the predefined error codes listed below.

### Constants

- `ContactError.UNKNOWN_ERROR` (code 0)
- `ContactError.INVALID_ARGUMENT_ERROR` (code 1)
- `ContactError.TIMEOUT_ERROR` (code 2)
- `ContactError.PENDING_OPERATION_ERROR` (code 3)
- `ContactError.IO_ERROR` (code 4)
- `ContactError.NOT_SUPPORTED_ERROR` (code 5)
- `ContactError.OPERATION_CANCELLED_ERROR` (code 6)
- `ContactError.PERMISSION_DENIED_ERROR` (code 20)


## ContactField

The `ContactField` object is a reusable component that represents
contact fields generically.  Each `ContactField` object contains a
`value`, `type`, and `pref` property.  A `Contact` object stores
several properties in `ContactField[]` arrays, such as phone numbers
and email addresses.

In most instances, there are no pre-determined values for a
`ContactField` object's __type__ attribute.  For example, a phone
number can specify __type__ values of _home_, _work_, _mobile_,
_iPhone_, or any other value that is supported by a particular device
platform's contact database.  However, for the `Contact` __photos__
field, the __type__ field indicates the format of the returned image:
__url__ when the __value__ attribute contains a URL to the photo
image, or _base64_ when the __value__ contains a base64-encoded image
string.

### Properties

- __type__: A string that indicates what type of field this is, _home_ for example. _(DOMString)_

- __value__: The value of the field, such as a phone number or email address. _(DOMString)_

- __pref__: Set to `true` if this `ContactField` contains the user's preferred value. _(boolean)_

### Supported Platforms

- Amazon Fire OS
- Android
- BlackBerry 10
- Firefox OS
- iOS
- Windows Phone 8
- Windows

### Example

```js
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
```

### Android Quirks

- __pref__: Not supported, returning `false`.

### BlackBerry 10 Quirks

- __type__: Partially supported.  Used for phone numbers.

- __value__: Supported.

- __pref__: Not supported, returning `false`.

### iOS Quirks

- __pref__: Not supported, returning `false`.

### Windows Quirks

- __pref__: Not supported, returning `false`.


## ContactName

Contains different kinds of information about a `Contact` object's name.

### Properties

- __formatted__: The complete name of the contact. _(DOMString)_

- __familyName__: The contact's family name. _(DOMString)_

- __givenName__: The contact's given name. _(DOMString)_

- __middleName__: The contact's middle name. _(DOMString)_

- __honorificPrefix__: The contact's prefix (example _Mr._ or _Dr._) _(DOMString)_

- __honorificSuffix__: The contact's suffix (example _Esq._). _(DOMString)_

### Supported Platforms

- Amazon Fire OS
- Android
- BlackBerry 10
- Firefox OS
- iOS
- Windows Phone 8
- Windows

### Example

```js
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
options.multiple = true;
filter = ["displayName", "name"];
navigator.contacts.find(filter, onSuccess, onError, options);
```

### Android Quirks

- __formatted__: Partially supported, and read-only.  Returns a concatenation of `honorificPrefix`, `givenName`, `middleName`, `familyName`, and `honorificSuffix`.

### BlackBerry 10 Quirks

- __formatted__: Partially supported.  Returns a concatenation of BlackBerry __firstName__ and __lastName__ fields.

- __familyName__: Supported.  Stored in BlackBerry __lastName__ field.

- __givenName__: Supported.  Stored in BlackBerry __firstName__ field.

- __middleName__: Not supported, returning `null`.

- __honorificPrefix__: Not supported, returning `null`.

- __honorificSuffix__: Not supported, returning `null`.

### FirefoxOS Quirks

- __formatted__: Partially supported, and read-only.  Returns a concatenation of `honorificPrefix`, `givenName`, `middleName`, `familyName`, and `honorificSuffix`.


### iOS Quirks

- __formatted__: Partially supported.  Returns iOS Composite Name, but is read-only.

### Windows Quirks

- __formatted__: This is the only name property, and is identical to `displayName`, and `nickname`

- __familyName__: not supported

- __givenName__: not supported

- __middleName__: not supported

- __honorificPrefix__: not supported

- __honorificSuffix__: not supported


## ContactOrganization

The `ContactOrganization` object stores a contact's organization
properties.  A `Contact` object stores one or more
`ContactOrganization` objects in an array.

### Properties

- __pref__: Set to `true` if this `ContactOrganization` contains the user's preferred value. _(boolean)_

- __type__: A string that indicates what type of field this is, _home_ for example. _(DOMString)

- __name__: The name of the organization. _(DOMString)_

- __department__: The department the contract works for. _(DOMString)_

- __title__: The contact's title at the organization. _(DOMString)_


### Supported Platforms

- Android
- BlackBerry 10
- Firefox OS
- iOS
- Windows Phone 8
- Windows (Windows 8.1 and Windows Phone 8.1 devices only)

### Example

```js
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
options.multiple = true;
filter = ["displayName", "organizations"];
navigator.contacts.find(filter, onSuccess, onError, options);
```

### Android 2.X Quirks

- __pref__: Not supported by Android 2.X devices, returning `false`.

### BlackBerry 10 Quirks

- __pref__: Not supported by BlackBerry devices, returning `false`.

- __type__: Not supported by BlackBerry devices, returning `null`.

- __name__: Partially supported.  The first organization name is stored in the BlackBerry __company__ field.

- __department__: Not supported, returning `null`.

- __title__: Partially supported.  The first organization title is stored in the BlackBerry __jobTitle__ field.

### Firefox OS Quirks

- __pref__: Not supported

- __type__: Not supported

- __department__: Not supported

- Fields __name__ and __title__ stored in __org__ and __jobTitle__.

### iOS Quirks

- __pref__: Not supported on iOS devices, returning `false`.

- __type__: Not supported on iOS devices, returning `null`.

- __name__: Partially supported.  The first organization name is stored in the iOS __kABPersonOrganizationProperty__ field.

- __department__: Partially supported.  The first department name is stored in the iOS __kABPersonDepartmentProperty__ field.

- __title__: Partially supported.  The first title is stored in the iOS __kABPersonJobTitleProperty__ field.

### Windows Quirks

- __pref__: Not supported, returning `false`.

- __type__: Not supported, returning `null`.

## ContactFieldType
The `ContactFieldType` object is an enumeration of possible field types, such as `'phoneNumbers'` or `'emails'`, that could be used to control which contact properties must be returned back from `contacts.find()` method (see `contactFindOptions.desiredFields`), or to specify fields to search in (through `contactFields` parameter). Possible values are:

- `navigator.contacts.fieldType.addresses`
- `navigator.contacts.fieldType.birthday`
- `navigator.contacts.fieldType.categories`
- `navigator.contacts.fieldType.country`
- `navigator.contacts.fieldType.department`
- `navigator.contacts.fieldType.displayName`
- `navigator.contacts.fieldType.emails`
- `navigator.contacts.fieldType.familyName`
- `navigator.contacts.fieldType.formatted`
- `navigator.contacts.fieldType.givenName`
- `navigator.contacts.fieldType.honorificPrefix`
- `navigator.contacts.fieldType.honorificSuffix`
- `navigator.contacts.fieldType.id`
- `navigator.contacts.fieldType.ims`
- `navigator.contacts.fieldType.locality`
- `navigator.contacts.fieldType.middleName`
- `navigator.contacts.fieldType.name`
- `navigator.contacts.fieldType.nickname`
- `navigator.contacts.fieldType.note`
- `navigator.contacts.fieldType.organizations`
- `navigator.contacts.fieldType.phoneNumbers`
- `navigator.contacts.fieldType.photos`
- `navigator.contacts.fieldType.postalCode`
- `navigator.contacts.fieldType.region`
- `navigator.contacts.fieldType.streetAddress`
- `navigator.contacts.fieldType.title`
- `navigator.contacts.fieldType.urls`
