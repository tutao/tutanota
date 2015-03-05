"use strict";

tutao.provide('tutao.RecipientsNotFoundError');

/**
 * Indicates that the email could not be sent because some of the recipients could not be found.
 * @param {Array.<string>} recipients The email addresses of the recipients that could not be found.
 * @constructor
 */
tutao.RecipientsNotFoundError = function RecipientsNotFoundError(recipients) {
    this._recipients = recipients;
    this.message = "recipients not found: " + recipients.join(", ");
    this.name = "RecipientsNotFoundError";
    if (Error.captureStackTrace) {
        Error.captureStackTrace(this, RecipientsNotFoundError);
    } else {
        var newError = new Error();
        if (!newError.stack) {
            // fill the stack trace on ios devices
            try {
                throw error;
            } catch (e) {
            }
        }

        if (newError.stack) { // not existing in IE9
            this.stack = this.name + ". " + this.message + "\n" + newError.stack.split("\n").slice(1).join("\n"); // removes first line from stack
        }
    }
};
tutao.RecipientsNotFoundError.prototype = Object.create(Error.prototype);
tutao.RecipientsNotFoundError.prototype.constructor = tutao.RecipientsNotFoundError;

/**
 * Provides the email addresses of the recipients that could not be found.
 * @return {Array.<string>} The email addresses of the recipients.
 */
tutao.RecipientsNotFoundError.prototype.getRecipients = function() {
    return this._recipients;
};
