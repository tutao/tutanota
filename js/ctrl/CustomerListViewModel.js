"use strict";

goog.provide('tutao.tutanota.ctrl.CustomerListViewModel');

/**
 * Handles the customer list in Tutanota.
 * @constructor
 */
tutao.tutanota.ctrl.CustomerListViewModel = function(systemInstance) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	
	this.customers = ko.observableArray(); // contains CustomerEditables
	this.upperBoundId = ko.observable(tutao.rest.EntityRestInterface.GENERATED_MAX_ID);
	this.type = ko.observable('starter');
	this._customerListId = null;
	this.type.subscribe(function(value) {
		var self = this;
		if (tutao.locator.viewManager.getActiveView() != tutao.locator.customerView) {
			return;
		}
		if (value == 'free') {
			self._customerListId = systemInstance.getFreeCustomers();
		} else if (value == 'premium') {
			self._customerListId = systemInstance.getPremiumCustomers();
		} else if (value == 'starter') {
			self._customerListId = systemInstance.getStarterCustomers();
		}
		self.showSelected();
	}, this);
	
};

/**
 * Shows the customer list.
 */
tutao.tutanota.ctrl.CustomerListViewModel.prototype.showSelected = function() {
	var self = this;
	this._loadCustomersEntries(this.upperBoundId(), true, function(customerList) {
		var editableCustomers = [];
		for (var i=0; i<customerList.length; i++) {
			editableCustomers.push(new tutao.entity.sys.CustomerEditable(customerList[i]));
		}
		self.customers(editableCustomers);
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

/**
 * Updates the given CustomerEditable on the server. Only the test end time should have been changed.
 * @param {tutao.entity.sys.CustomerEditable} editableCustomer The customer to update.
 */
tutao.tutanota.ctrl.CustomerListViewModel.prototype.updateTestEndTime = function(editableCustomer) {
	if (editableCustomer.testEndTime() == null) {
		console.log("invalid date: null");
		return;
	}
	// load the customer again to make sure we do not overwrite changed data
	//FIXME disable cache, reload customer?
	editableCustomer.update();
	editableCustomer.getCustomer().update(function(exception) {
		if (exception) {
			console.log(exception);
		}
	});
};
