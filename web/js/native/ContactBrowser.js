"use strict";

tutao.provide('tutao.native.ContactBrowser');

/**
 * Functions to retrieve all contacts that are store on the phone
 * @interface
 */
tutao.native.ContactBrowser = function(){};

/**
 * Returns the contacts of this device.
 * @return {Promise.<string, Error>} Called with the phone number.
 */
tutao.native.ContactBrowser.prototype.getAllContacts = function() {
    return new Promise(function (resolve, reject) {
        resolve([
            new mizz.entity.Contact(
                {name: "none",
                    statusMessage: "-",
                    phoneNumbers: [
                        {type: "work", value: "none", preferred: "true"},
                    ],
                    photos: []})
        ]);
    });
};