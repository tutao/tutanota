"use strict";

tutao.provide('tutao.native.ContactInterface');

/**
 * Functions to retrieve all contacts that are store on the phone
 * @interface
 */
tutao.native.ContactInterface = function(){};

/**
 * Returns the contacts of this device.
 * @return {Promise.<string, Error>} Called with the phone number.
 */
tutao.native.ContactInterface.prototype.getAllContacts = function() {};