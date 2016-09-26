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

/* global Windows */

var ContactField = require('./ContactField'),
    ContactAddress = require('./ContactAddress'),
    ContactName = require('./ContactName'),
    Contact = require('./Contact');


function convertToContact(windowsContact) {
    var contact = new Contact();
    var i;

    // displayName & nickname
    contact.displayName = windowsContact.name;
    contact.nickname = windowsContact.name;

    // name
    contact.name = new ContactName(windowsContact.name);

    // phoneNumbers
    contact.phoneNumbers = [];
    for (i = 0; i < windowsContact.phoneNumbers.size; i++) {
        var phone = new ContactField(windowsContact.phoneNumbers[i].category, windowsContact.phoneNumbers[i].value);
        contact.phoneNumbers.push(phone);
    }

    // emails
    contact.emails = [];
    for (i = 0; i < windowsContact.emails.size; i++) {
        var email = new ContactField(windowsContact.emails[i].category, windowsContact.emails[i].value);
        contact.emails.push(email);
    }

    // addressres
    contact.addresses = [];
    for (i = 0; i < windowsContact.locations.size; i++) {
        var address = new ContactAddress(null, windowsContact.locations[i].category,
            windowsContact.locations[i].unstructuredAddress, windowsContact.locations[i].street,
            null, windowsContact.locations[i].region, windowsContact.locations[i].postalCode,
            windowsContact.locations[i].country);
        contact.addresses.push(address);
    }

    // ims
    contact.ims = [];
    for (i = 0; i < windowsContact.instantMessages.size; i++) {
        var im = new ContactField(windowsContact.instantMessages[i].category, windowsContact.instantMessages[i].userName);
        contact.ims.push(im);
    }

    return contact;
}

module.exports = {
    pickContact: function(win, fail, args) {
        var picker = new Windows.ApplicationModel.Contacts.ContactPicker();

        function success(con) {
            // if contact was not picked
            if (!con) {
                if (fail) {
                    setTimeout(function() {
                        fail(new Error("User did not pick a contact."));
                    }, 0);
                }
                return;
            }

            // send em back
            win(convertToContact(con));
        }

        picker.selectionMode = Windows.ApplicationModel.Contacts.ContactSelectionMode.contacts; // select entire contact

        // pickContactAsync is available on Windows 8.1 or later, instead of
        // pickSingleContactAsync, which is deprecated after Windows 8,
        // so try to use newer method, if available.
        // see http://msdn.microsoft.com/en-us/library/windows/apps/windows.applicationmodel.contacts.contactpicker.picksinglecontactasync.aspx
        if (picker.pickContactAsync) {
            // TODO: 8.1 has better contact support via the 'Contact' object
        } else {
            picker.pickSingleContactAsync().done(success, fail);
        }
    },

    save:function(win,fail,args){
        if (console && console.error) {
            console.error("Error : Windows 8 does not support creating/saving contacts");
        }
        if (fail) {
            setTimeout(function () {
                fail(new Error("Contact create/save not supported on Windows 8"));
            }, 0);
        }
    },

    search: function(win, fail, args) {
        if (console && console.error) {
            console.error("Error : Windows 8 does not support searching contacts");
        }
        if (fail) {
            setTimeout(function() {
                fail(new Error("Contact search not supported on Windows 8"));
            }, 0);
        }
    }
};

require("cordova/exec/proxy").add("Contacts", module.exports);
