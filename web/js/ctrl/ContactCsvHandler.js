"use strict";

tutao.provide('tutao.tutanota.ctrl.ContactCsvHandler');

/**
 * @interface
 */
tutao.tutanota.ctrl.ContactCsvHandler = function() {};

/**
 * For csv to contact import.
 */
tutao.tutanota.ctrl.ContactCsvHandler.prototype.startContact = function(contact) {};

/**
 * For csv to contact import.
 */
tutao.tutanota.ctrl.ContactCsvHandler.prototype.addField = function(contact, name, value) {};

/**
 * For csv to contact import.
 */
tutao.tutanota.ctrl.ContactCsvHandler.prototype.finishContact = function(contact) {};

/**
 * For contact to csv export.
 * @param {function(string,string)):boolean} fieldReceiver Must be called for each field in the contact in the correct order.
 */
tutao.tutanota.ctrl.ContactCsvHandler.prototype.getContactFields = function(contact, fieldReceiver) {};
