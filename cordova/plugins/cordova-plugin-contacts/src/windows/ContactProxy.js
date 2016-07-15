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

/* global Windows, WinJS */

var ContactField = require('./ContactField'),
    ContactAddress = require('./ContactAddress'),
    ContactOrganization = require('./ContactOrganization'),
    ContactName = require('./ContactName'),
    ContactError = require('./ContactError'),
    Contact = require('./Contact');


function convertToContact(windowsContact) {
    var contact = new Contact();

    // displayName & nickname
    contact.displayName = windowsContact.displayName || windowsContact.name;
    contact.nickname = windowsContact.name;
    contact.id = windowsContact.id;

    // name
    // Additional fields like lastName, middleName etc. available on windows8.1/wp8.1 only
    contact.name = new ContactName(
        windowsContact.displayName || windowsContact.name,
        windowsContact.lastName,
        windowsContact.firstName || windowsContact.name,
        windowsContact.middleName,
        windowsContact.honorificNamePrefix || windowsContact.honorificPrefix,
        windowsContact.honorificNameSuffix || windowsContact.honorificSuffix);

    // phoneNumbers
    contact.phoneNumbers = [];
    var phoneSource = windowsContact.phoneNumbers || windowsContact.phones;
    var i;
    for (i = 0; i < phoneSource.size; i++) {
        var rawPhone = phoneSource[i];
        var phone = new ContactField(rawPhone.category || rawPhone.kind, rawPhone.value || rawPhone.number);
        contact.phoneNumbers.push(phone);
    }

    // emails
    contact.emails = [];
    var emailSource = windowsContact.emails;
    for (i = 0; i < emailSource.size; i++) {
        var rawEmail = emailSource[i];
        var email = new ContactField(rawEmail.category || rawEmail.kind, rawEmail.value || rawEmail.address);
        contact.emails.push(email);
    }

    // addressres
    contact.addresses = [];
    var addressSource = windowsContact.locations || windowsContact.addresses;
    for (i = 0; i < addressSource.size; i++) {
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
    for (i = 0; i < imSource.size; i++) {
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

    // returned is a file, a blob url can be made 
    var contactPhoto = windowsContact.thumbnail;
    if (contactPhoto && contactPhoto.path) {
        contact.photos = [new ContactField('url', URL.createObjectURL(contactPhoto) , false)];
    }

    return contact;
}

// Win API Contacts namespace
var contactsNS = Windows.ApplicationModel.Contacts;

function cdvContactToWindowsContact(contact) {
    var result = new contactsNS.Contact();
    
    // name first
    if (contact.name) {
        result.displayNameOverride = contact.name.formatted;
        result.firstName = contact.name.givenName;
        result.middleName = contact.name.middleName;
        result.lastName = contact.name.familyName;
        result.honorificNamePrefix = contact.name.honorificPrefix;
        result.honorificNameSuffix = contact.name.honorificSuffix;
    }
    
    result.nickname = contact.nickname;
    
    // phone numbers
    if (contact.phoneNumbers) {
        contact.phoneNumbers.forEach(function(contactPhone) {
            var resultPhone = new contactsNS.ContactPhone();
            resultPhone.description = contactPhone.type;
            resultPhone.number = contactPhone.value;
            result.phones.push(resultPhone);
        });
    }
    
    // emails
    if (contact.emails) {
        contact.emails.forEach(function(contactEmail) {
            var resultEmail = new contactsNS.ContactEmail();
            resultEmail.description = contactEmail.type;
            resultEmail.address = contactEmail.value;
            result.emails.push(resultEmail);
        });
    }
    
    // Addresses
    if (contact.addresses) {
        contact.addresses.forEach(function(contactAddress) {
            var address = new contactsNS.ContactAddress();
            address.description = contactAddress.type;
            address.streetAddress = contactAddress.streetAddress;
            address.locality = contactAddress.locality;
            address.region = contactAddress.region;
            address.postalCode = contactAddress.postalCode;
            address.country = contactAddress.country;
            result.addresses.push(address);
        });
    }
    
    // IMs
    if (contact.ims) {
        contact.ims.forEach(function(contactIM) {
            var acct = new contactsNS.ContactConnectedServiceAccount();
            acct.serviceName = contactIM.type;
            acct.id = contactIM.value;
            result.connectedServiceAccounts.push(acct);
        });
    }
    
    // JobInfo 
    if (contact.organizations) {
        contact.organizations.forEach(function(contactOrg) {
            var job = new contactsNS.ContactJobInfo();
            job.companyName = contactOrg.name;
            job.department = contactOrg.department;
            job.description = contactOrg.type;
            job.title = contactOrg.title;
            result.jobInfo.push(job);
        });
    }
    
    result.notes = contact.note;
    
    if (contact.photos) {
        var eligiblePhotos = contact.photos.filter(function(photo) { 
            return typeof photo.value !== 'undefined';
        });
        if (eligiblePhotos.length > 0) {
            var supportedPhoto = eligiblePhotos[0];
            var path = supportedPhoto.value;
            
            try {
                var streamRef;
                if (/^([a-z][a-z0-9+\-.]*):\/\//i.test(path)) {
                    streamRef = Windows.Storage.Streams.RandomAccessStreamReference.createFromUri(new Windows.Foundation.Uri(path));
                } else {
                    streamRef = Windows.Storage.Streams.RandomAccessStreamReference.createFromFile(path);
                }
                result.thumbnail = streamRef;
            }
            catch (e) {
                // incompatible reference to the photo
            }
        }
    }
    
    return result;
}

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
                var cancelledError = new ContactError(ContactError.OPERATION_CANCELLED_ERROR);
                cancelledError.message = "User did not pick a contact.";
                fail(cancelledError);
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
                    fail(new ContactError(ContactError.UNKNOWN_ERROR));
                });
            }, function () {
                fail(new ContactError(ContactError.UNKNOWN_ERROR));
            });
        });
    },

    save: function (win, fail, args) {
        if (typeof contactsNS.ContactList === 'undefined') {
            // Not supported yet since WinJS API do not provide methods to manage contactStore
            // On Windows Phone 8.1 this can be implemented using native class library 
            // See Windows.Phone.PersonalInformation namespace
            // http://msdn.microsoft.com/en-us/library/windows/apps/xaml/windows.phone.personalinformation.aspx
    
            //We don't need to create Error object here since it will be created at navigator.contacts.find() method
            if (fail) {
                fail(ContactError.NOT_SUPPORTED_ERROR);
            }
            return;
        }
        
        var winContact = cdvContactToWindowsContact(args[0]);
        
        contactsNS.ContactManager.requestStoreAsync(contactsNS.ContactStoreAccessType.appContactsReadWrite).then(function(store) {
                return store.findContactListsAsync().then(function(lists) {
                        if (lists.length > 0) {
                            return lists[0];    
                        } else {
                            return store.createContactListAsync('');
                        }
                    }, function(error) {
                        return store.createContactListAsync('');
                    });
            }).then(function(list) {
                return list.saveContactAsync(winContact);
            }).done(function(result) {
                win(convertToContact(winContact));
            }, function(error) {
                fail(error);
            });
    },
    
    remove: function(win, fail, args) {
        if (typeof contactsNS.ContactList === 'undefined') {
            // Not supported yet since WinJS API do not provide methods to manage contactStore
            // On Windows Phone 8.1 this can be implemented using native class library 
            // See Windows.Phone.PersonalInformation namespace
            // http://msdn.microsoft.com/en-us/library/windows/apps/xaml/windows.phone.personalinformation.aspx
    
            //We don't need to create Error object here since it will be created at navigator.contacts.find() method
            if (fail) {
                fail(ContactError.NOT_SUPPORTED_ERROR);
            }
            return;
        }
        
        // This is a complicated scenario because in Win10, there is a notion of 'app contacts' vs 'global contacts'.
        // search() returns all global contacts, which are "aggregate contacts", so the IDs of contacts that Cordova
        // creates never match the IDs of the contacts returned from search().
        // In order to work around this, we need to:
        //  - Get two Stores: one that is read-write to the app-contacts list, one which is read-only for global contacts  
        //  - Read the app-local store to see if a contact with the passed-in ID matches
        //  - Grab the global aggregate contact manager, then ask it for raw contacts (app-local ACM returns access denied)
        //  - Find my app-list of contacts
        //  - Enumerate the raw contacts and see if there is a raw contact whose parent list matches the app-list
        //  - If so, remove the raw contact from the app-list
        //  - If any of this fails, the operation fails
        WinJS.Promise.join([contactsNS.ContactManager.requestStoreAsync(contactsNS.ContactStoreAccessType.appContactsReadWrite), 
                            contactsNS.ContactManager.requestStoreAsync(contactsNS.ContactStoreAccessType.allContactsReadOnly)]).then(function(stores) {
                var readOnlyStore = stores[1];
                var writableStore = stores[0];
                
                var storeReader = writableStore.getContactReader();
                return storeReader.readBatchAsync().then(function(batch) {
                    if (batch.status !== contactsNS.ContactBatchStatus.success) {
                        // Couldn't read contacts store
                        throw new ContactError(ContactError.IO_ERROR);
                    }
                    
                    var candidates = batch.contacts.filter(function(testContact) {
                        return testContact.id === args[0];
                    });
                    
                    if (candidates.length === 0) {
                        // No matching contact from aggregate store
                        throw new ContactError(ContactError.IO_ERROR);
                    }
                    
                    return candidates[0];
                }).then(function(contactToDelete) {
                    return readOnlyStore.aggregateContactManager.findRawContactsAsync(contactToDelete);
                }).then(function(rawContacts) {
                    return writableStore.findContactListsAsync().then(function(lists) {
                        var deleteList = null;
                        var deleteContact = null;
                        var matched = lists.some(function(list) {
                            for (var i = 0; i < rawContacts.length; i++) {
                                if (rawContacts[i].contactListId === list.id) {
                                    deleteList = list;
                                    deleteContact = rawContacts[i];
                                    return true;
                                }
                            }
                            return false;
                        });
                        
                        if (!matched) {
                            throw new ContactError(ContactError.IO_ERROR);
                        }
                        
                        return deleteList.deleteContactAsync(deleteContact);
                    });
                });
            }).done(function() {
                win();
            }, function(error) {
                fail(error);
            });
    },

    search: function (win, fail, options) {

        // searchFields is not supported yet due to WP8.1 API limitations.
        // findContactsAsync(String) method will attempt to match the name, email address, or phone number of a contact. 
        // see http://msdn.microsoft.com/en-us/library/windows/apps/dn624861.aspx for details
        var searchFields = options[0], // jshint ignore:line
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
                fail(new ContactError(ContactError.UNKNOWN_ERROR));
            });
        }, function() {
            fail(new ContactError(ContactError.UNKNOWN_ERROR));
        });
    }
};

require("cordova/exec/proxy").add("Contacts", module.exports);
