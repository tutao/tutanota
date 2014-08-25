"use strict";

tutao.provide('tutao.native.ContactApp');

/**
 * Functions to retrieve all contacts that are store on the phone
 * @interface
 */
tutao.native.ContactApp = function(){};

/**
 * Returns the contacts of this device.
 * @return {Promise.<Array.<mizz.entity.Contact>, Error>} Called with the phone number.
 */
tutao.native.ContactApp.prototype.getAllContacts = function() {
    return new Promise(function (resolve, reject) {
        var options      = new ContactFindOptions();
        options.filter   = "";
        options.multiple = true;
        var fields       = ["*"];

        navigator.contacts.find(fields, function(nativeContacts) {
            try {
                var contacts = [];
                for(var i=0;i < nativeContacts.length; i++) {
                    var nativeContact = nativeContacts[i];
                    var contact = new mizz.entity.Contact({
                        name: nativeContact.displayName,
                        phoneNumbers: nativeContact.phoneNumbers
                    });
                    if (contact.name) {
                        contacts.push(contact);
                    }
                }
                resolve(contacts.sort(function(a,b) {return a.name < b.name ? -1 : 1}));
            } catch(e) {
                reject(e);
            }
        }, reject, options);

    });
};