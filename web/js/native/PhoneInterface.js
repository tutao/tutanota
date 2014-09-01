"use strict";

tutao.provide('tutao.native.PhoneInterface');

/**
 * All phone functions
 * @interface
 */
tutao.native.PhoneInterface = function(){};

/**
 * Returns the phone number of this device, if available.
 * @return {Promise.<string, Error>} callback Called with the phone number.
 */
tutao.native.PhoneInterface.prototype.getNumber = function() {};