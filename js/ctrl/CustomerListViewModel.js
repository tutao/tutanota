"use strict";

goog.provide('tutao.tutanota.ctrl.CustomerListViewModel');

/**
 * Handles the customer list in Tutanota.
 * @constructor
 */
tutao.tutanota.ctrl.CustomerListViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this.customers = ko.observableArray();
	this.upperBoundId = ko.observable(tutao.rest.EntityRestInterface.GENERATED_MAX_ID);
	this.type = ko.observable('starter');
	this._customerListId = null;
	this.type.subscribe(function(value) {
		if (!this._systemInstance()) {
			return;
		}
		if (value == 'free') {
			this._customerListId = this._systemInstance().getFreeCustomers();
		} else if (value == 'premium') {
			this._customerListId = this._systemInstance().getPremiumCustomers();
		} else if (value == 'starter') {
			this._customerListId = this._systemInstance().getStarterCustomers();
		}
		this.showSelected();
	}, this);
	
	this._systemInstance = ko.observable(null);
	var self = this;
	tutao.entity.sys.System.load(tutao.rest.EntityRestInterface.GENERATED_MIN_ID, function(systemInstance) {
		self._systemInstance(systemInstance);
	});
};

/**
 * Shows the customer list.
 */
tutao.tutanota.ctrl.CustomerListViewModel.prototype.showSelected = function() {
	var self = this;
	this._loadCustomersEntries(this.upperBoundId(), true, function(customerList) {
		self.customers(customerList);
	});
};

/**
 * Loads a maximum of 1000 entries beginning with the entry with a smaller id than upperBoundId 
 * @param {string} upperBoundId The id of upper limit (base64 encoded)
 * @param {boolean} reverse If the entries shall be loaded reverse.
 * @param {function(Array.<tutao.entity.sys.Customer>)} callback Will be called with the list of customers. 
 */
tutao.tutanota.ctrl.CustomerListViewModel.prototype._loadCustomersEntries = function(upperBoundId, reverse, callback) {
	tutao.entity.sys.CustomerReference.loadRange(this._customerListId, upperBoundId, 1000, reverse, function(customerReferenceList, exception) {
		if (exception) {
			console.log(exception);
		} else {
			var ids = [];
			for ( var i = 0; i < customerReferenceList.length; i++) {
				ids.push(customerReferenceList[i].getCustomer());
			}
			if (ids.length == 0) {
				callback([]);
			} else {
				tutao.entity.sys.Customer.loadMultiple(ids, callback);
			}
		}
	});
};