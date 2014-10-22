/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 * 
 */

var ContactField = require('./ContactField'),
    ContactAddress = require('./ContactAddress'),
    ContactOrganization = require('./ContactOrganization'),
    ContactName = require('./ContactName'),
    ContactError = require('./ContactError'),
    Contact = require('./Contact');


function convertToContact(windowsContact) {
    var contact = new Contact();

    // displayName & nickname
    contact.displayName = windowsContact.name || windowsContact.displayName;
    contact.nickname = windowsContact.name;

    // name
    // Additional fields like lastName, middleName etc. available on windows8.1/wp8.1 only
    contact.name = new ContactName(
        windowsContact.name || windowsContact.displayName,
        windowsContact.lastName,
        windowsContact.middleName,
        windowsContact.honorificPrefix,
        windowsContact.honorificSuffix);

    // phoneNumbers
    contact.phoneNumbers = [];
    var phoneSource = windowsContact.phoneNumbers || windowsContact.phones;
    for (var i = 0; i < phoneSource.size; i++) {
        var rawPhone = phoneSource[i];
        var phone = new ContactField(rawPhone.category || rawPhone.kind, rawPhone.value || rawPhone.number);
        contact.phoneNumbers.push(phone);
    }

    // emails
    contact.emails = [];
    var emailSource = windowsContact.emails;
    for (var i = 0; i < emailSource.size; i++) {
        var rawEmail = emailSource[i];
        var email = new ContactField(rawEmail.category || rawEmail.kind, rawEmail.value || rawEmail.address);
        contact.emails.push(email);
    }

    // addressres
    contact.addresses = [];
    var addressSource = windowsContact.locations || windowsContact.addresses;
    for (var i = 0; i < addressSource.size; i++) {
        var rawAddress = addressSource[i];
        var address = new ContactAddress(
            null,
            rawAddress.category || rawAddress.kind,
            rawAddress.unstructuredAddress,
            rawAddress.street || rawAddress.streetAddress,
            rawAddress.city || rawAddress.locality,
            rawAddress.region,
            rawAddress.postalCode,
            rawAddress.country);
        contact.addresses.push(address);
    }

    // ims
    contact.ims = [];
    var imSource = windowsContact.instantMessages || windowsContact.connectedServiceAccounts;
    for (var i = 0; i < imSource.size; i++) {
        var rawIm = imSource[i];
        var im = new ContactField(rawIm.category || rawIm.serviceName, rawIm.userName || rawIm.id);
        contact.ims.push(im);
    }

    // jobInfo field available on Windows 8.1/WP8.1 only
    var jobInfo = windowsContact.jobInfo;
    if (jobInfo) {
        contact.organizations = [];
        for (var j = 0; j < jobInfo.size; j++) {
            var rawJob = jobInfo[i];
            contact.organizations.push(new ContactOrganization(false, null,
                rawJob.companyName, rawJob.department, rawJob.title));
        }
    }

    // note field available on Windows 8.1/WP8.1 only
    var contactNotes = windowsContact.notes;
    if (contactNotes) {
        contact.note = contactNotes;
    }

    // thumbnail field available on Windows 8.1/WP8.1 only
    var contactPhoto = windowsContact.thumbnail;
    if (contactPhoto && contactPhoto.path) {
        contact.photos = [new ContactField(null, contactPhoto.path , false)];
    }

    return contact;
}

// Win API Contacts namespace
var contactsNS = Windows.ApplicationModel.Contacts;

module.exports = {

    pickContact: function (win, fail, args) {

        // ContactPicker class works differently on Windows8/8.1 and Windows Phone 8.1
        // so we need to detect when we are running on phone
        var runningOnPhone = navigator.userAgent.indexOf('Windows Phone') !== -1;

        var picker = new contactsNS.ContactPicker();
        if (runningOnPhone) {
            // TODO: Windows Phone 8.1 requires this specification. This should be noted in quirks
            // See http://msdn.microsoft.com/en-us/library/windows/apps/windows.applicationmodel.contacts.contactpicker.desiredfieldswithcontactfieldtype.aspx for details
            // Multiple ContactFieldType items, appended to array causes `Request not suported` error.
            picker.desiredFieldsWithContactFieldType.append(Windows.ApplicationModel.Contacts.ContactFieldType.phoneNumber);
        }

        // pickContactAsync is available on Windows 8.1 or later, instead of
        // pickSingleContactAsync, which is deprecated in Windows 8.1,
        // so try to use newer method, if available.
        // see http://msdn.microsoft.com/en-us/library/windows/apps/windows.applicationmodel.contacts.contactpicker.picksinglecontactasync.aspx

        var pickRequest = picker.pickContactAsync ? picker.pickContactAsync() : picker.pickSingleContactAsync();
        pickRequest.done(function (contact) {
            // if contact was not picked
            if (!contact) {
                fail && fail(new Error("User did not pick a contact."));
                return;
            }
            // If we are on desktop, just send em back
            if (!runningOnPhone) {
                win(convertToContact(contact));
                return;
            }
            // On WP8.1 fields set in resulted Contact object depends on desiredFieldsWithContactFieldType property of contact picker
            // so we retrieve full contact by its' Id
            contactsNS.ContactManager.requestStoreAsync().done(function (contactStore) {
                contactStore.getContactAsync(contact.id).done(function(con) {
                    win(convertToContact(con));
                }, function() {
                    fail(new ContactError(ContactError.PENDING_OPERATION_ERROR));
                });
            }, function () {
                fail(new ContactError(ContactError.PENDING_OPERATION_ERROR));
            });
        });
    },

    save: function (win, fail, args) {
        // Not supported yet since WinJS API do not provide methods to manage contactStore
        // On Windows Phone 8.1 this can be implemented using native class library 
        // See Windows.Phone.PersonalInformation namespace
        // http://msdn.microsoft.com/en-us/library/windows/apps/xaml/windows.phone.personalinformation.aspx
        fail && fail(new ContactError(ContactError.NOT_SUPPORTED_ERROR));
    },

    search: function (win, fail, options) {

        // searchFields is not supported yet due to WP8.1 API limitations.
        // findContactsAsync(String) method will attempt to match the name, email address, or phone number of a contact. 
        // see http://msdn.microsoft.com/en-us/library/windows/apps/dn624861.aspx for details
        var searchFields = options[0],
            searchOptions = options[1],
            searchFilter = searchOptions.filter,
            searchMultiple = searchOptions && searchOptions.multiple;

        // Check if necessary API is available.
        // If not available, we are running on desktop, which doesn't support searching for contacts
        if (!(contactsNS.ContactManager && contactsNS.ContactManager.requestStoreAsync)) {
            fail(new ContactError(ContactError.NOT_SUPPORTED_ERROR));
            return;
        }

        // Retrieve contact store instance
        var contactStoreRequest = contactsNS.ContactManager.requestStoreAsync();

        // When contact store retrieved
        contactStoreRequest.done(function (contactStore) {
            // determine, which function we use depending on whether searchOptions.filter specified or not
            var contactsRequest = searchFilter ? contactStore.findContactsAsync(searchFilter) : contactStore.findContactsAsync();
            // request contacts and resolve either with success or error callback
            contactsRequest.done(function (contacts) {
                var result = [];
                if (contacts.size !== 0) {
                    // Depending on searchOptions we should return all contacts found or only first 
                    var outputContactsArray = searchMultiple ? contacts : [contacts[0]];
                    outputContactsArray.forEach(function (contact) {
                        // Convert windows contacts to plugin's contact objects
                        result.push(convertToContact(contact));
                    });
                }
                win(result);
            }, function() {
                fail(new ContactError(ContactError.PENDING_OPERATION_ERROR));
            });
        }, function() {
            fail(new ContactError(ContactError.PENDING_OPERATION_ERROR));
        });
    }
};

require("cordova/exec/proxy").add("Contacts", module.exports);
