"use strict";

tutao.provide('tutao.native.ContactApp');

/**
 * Functions to retrieve all contacts that are store on the phone
 * @interface
 */
tutao.native.ContactApp = function(){};

tutao.native.ContactApp.prototype.find = function(text) {
    return new Promise(function (resolve, reject) {
        var options      = new ContactFindOptions();
        options.filter   = text;
        options.multiple = true;
        var fields       = ["*"];

        navigator.contacts.find(fields, function(nativeContacts) {
            try {
                var contacts = [];
                for(var i=0;i < nativeContacts.length; i++) {
                    var nativeContact = nativeContacts[i];
                    var contact = new tutao.entity.tutanota.Contact();
                    contacts.push(contact);
                }
                resolve(contacts);
            } catch(e) {
                reject(e);
            }
        }, reject, options);
    });
};