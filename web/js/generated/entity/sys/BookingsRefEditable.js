"use strict";

tutao.provide('tutao.entity.sys.BookingsRefEditable');

/**
 * Provides a knockout observable mechanism for a BookingsRef.
 * @param {tutao.entity.sys.BookingsRef} bookingsref The actual BookingsRef.
 * @constructor
 */
tutao.entity.sys.BookingsRefEditable = function(bookingsref) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this._entity = bookingsref;
	this._id = ko.observable(bookingsref.getId());

	this.lastUpdatedTimestamp = ko.observable(null);

	if (tutao.entity.sys.BookingsRefExtension) {
		tutao.entity.sys.BookingsRefExtension(this);
	}
};

/**
 * Provides the actual BookingsRef.
 * @return {tutao.entity.sys.BookingsRef} The BookingsRef.
 */
tutao.entity.sys.BookingsRefEditable.prototype.getBookingsRef = function() {
	return this._entity;
};

/**
 * Updates the underlying BookingsRef with the modified attributes.
 */
tutao.entity.sys.BookingsRefEditable.prototype.update = function() {
	this._entity.setId(this._id());
	this.lastUpdatedTimestamp(new Date().getTime());
};
