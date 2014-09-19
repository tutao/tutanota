"use strict";

tutao.provide('tutao.native.ContactBrowser');

/**
 * Functions to retrieve all contacts that are store on the phone
 * @interface
 */
tutao.native.ContactBrowser = function() {};

tutao.native.ContactBrowser.prototype.findRecipients = function(text, maxNumberOfSuggestions, suggestions) {
    return Promise.resolve();
};