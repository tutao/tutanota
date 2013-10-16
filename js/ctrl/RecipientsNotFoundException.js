"use strict";

goog.provide('tutao.tutanota.ctrl.RecipientsNotFoundException');

/**
 * Indicates that the email could not be sent because some of the recipients could not be found.
 * @param {Array.<string>} recipients The email addresses of the recipients that could not be found.
 * @constructor
 */
tutao.tutanota.ctrl.RecipientsNotFoundException = function(recipients) {
	this._recipients = recipients;
	this.stack = new Error().stack;
	var mailAddresses = "";
	for (var i = 0; i < recipients.length; i++) {
		if (i > 0) {
			mailAddresses += ", ";
		}
		mailAddresses += recipients[i];
	}
	this.message = "recipients not found: " + mailAddresses;
	this.name = "RecipientsNotFoundException";
};

goog.inherits(tutao.tutanota.ctrl.RecipientsNotFoundException, Error);

/**
 * Provides the email addresses of the recipients that could not be found.
 * @return {Array.<string>} The email addresses of the recipients.
 */
tutao.tutanota.ctrl.RecipientsNotFoundException.prototype.getRecipients = function() {
	  return this._recipients;
};
