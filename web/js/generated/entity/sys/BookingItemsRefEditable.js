"use strict";

tutao.provide('tutao.entity.sys.BookingItemsRefEditable');

/**
 * Provides a knockout observable mechanism for a BookingItemsRef.
 * @param {tutao.entity.sys.BookingItemsRef} bookingitemsref The actual BookingItemsRef.
 * @constructor
 */
tutao.entity.sys.BookingItemsRefEditable = function(bookingitemsref) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this._entity = bookingitemsref;
	this._id = ko.observable(bookingitemsref.getId());

	this.lastUpdatedTimestamp = ko.observable(null);

	if (tutao.entity.sys.BookingItemsRefExtension) {
		tutao.entity.sys.BookingItemsRefExtension(this);
	}
};

/**
 * Provides the actual BookingItemsRef.
 * @return {tutao.entity.sys.BookingItemsRef} The BookingItemsRef.
 */
tutao.entity.sys.BookingItemsRefEditable.prototype.getBookingItemsRef = function() {
	return this._entity;
};

/**
 * Updates the underlying BookingItemsRef with the modified attributes.
 */
tutao.entity.sys.BookingItemsRefEditable.prototype.update = function() {
	this._entity.setId(this._id());
	this.lastUpdatedTimestamp(new Date().getTime());
};
