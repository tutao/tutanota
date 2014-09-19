"use strict";

tutao.provide('tutao.native.ContactInterface');

/**
 * Functions to retrieve all contacts that are store on the phone
 * @interface
 */
tutao.native.ContactInterface = function(){};

/**
 * Collects recipients from the contacts of the device which match the given text string in first name, last name or email address and adds a suggetion instance to the given list of suggestions for each matching recipient.
 * @param {string} text The text to find.
 * @param {number} maxNumberOfSuggestions The maximum number of suggestions collected in the suggestions list.
 * @param {Array.<tutao.tutanota.ctrl.bubbleinput.Suggestion>} suggestions The resulting collection of suggestions.
 * @return {Promise.<Error>} Called with the phone number.
 */
tutao.native.ContactInterface.prototype.findRecipients = function(text, maxNumberOfSuggestions, suggestions) {};