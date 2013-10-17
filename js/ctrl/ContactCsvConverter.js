"use strict";

goog.provide('tutao.tutanota.ctrl.ContactCsvConverter');

/**
 * Converts a csv string into an array of contacts.
 * @param {string} csvString The csv data containing the contacts to import.
 * @param {tutao.tutanota.ctrl.ContactCsvHandler} handler Gets called for each csv value with 
 * the scv column name, value and contact to be filled. If the handler returns false, the parsing is cancelled.
 * @return {Array.<tutao.entity.tutanota.Contact>} The contacts parsed from csv.
 */
tutao.tutanota.ctrl.ContactCsvConverter.csvToContacts = function(csvString, handler) {
	var array = tutao.tutanota.util.CsvConverter.csvToArray(csvString);
	if (array == null) {
		return null;
	}
	var contacts = [];
	var names = array[0];
	for (var i=1; i<array.length; i++) {
		var c = tutao.entity.tutanota.ContactWrapper.createEmptyContactWrapper().getContact(); // initializes default values
		if (array[i].length != names.length) {
			return null;
		}
		handler.startContact(c);
		for (var a=1; a<names.length; a++) {
			if (names[a] != "") {
				if (!handler.addField(c, names[a], array[i][a])) {
					return null;
				}
			}
		}
		
		if (!handler.finishContact(c)) {
			return null;
		}
		contacts.push(c);
	}
	return contacts;
};

/**
 * Converts an array of contacts to a csv string.
 * @param {Array.<tutao.entity.tutanota.Contact>} contacts The contacts to convert.
 * @param {tutao.tutanota.ctrl.ContactCsvHandler} handler Gets called for each 
 * contact getting passed the contact and a callback function receiving each field for the csv line (name and value). 
 * If handler returns false, the contact creation is cancelled.
 * @return {Array.<tutao.entity.tutanota.Contact>} The contacts parsed from csv.
 */
tutao.tutanota.ctrl.ContactCsvConverter.contactsToCsv = function(contacts, handler) {
	var array = [];
	var names = []; // is filled in the first handler call
	array.push(names);
	for (var i=0; i<contacts.length; i++) {
		var line = [];
		var success = handler.getContactFields(contacts[i], function(name, value) {
			if (i == 0) {
				// collect the names
				names.push(name);
			} else {
				// to do make sure the name is correct
			}
			line.push(value);
			
		});
		if (!success) {
			return null;
		} else {
			array.push(line);
		}
	}
	return tutao.tutanota.util.CsvConverter.arrayToCsv(array);
};
