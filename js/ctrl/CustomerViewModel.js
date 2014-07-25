"use strict";

goog.provide('tutao.tutanota.ctrl.CustomerViewModel');

/**
 * Handles the customers admin view in Tutanota.
 * @constructor
 */
tutao.tutanota.ctrl.CustomerViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

	this.customerListViewModel = null;
	this.registrationDataListViewModel = null;
	this.displayed = ko.observable(null);
	
	this._initialized = false;
	
	this.visible = ko.computed({
				read: function() {
					return tutao.locator.viewManager.getActiveView() == tutao.locator.customerView;
				},	
				deferEvaluation: true
			}, this);
	
	this.visible.subscribe(function(visible) {
		if (!this._initialized && visible) {
			this._initialized = true;
			var self = this;
			tutao.entity.sys.System.load(tutao.rest.EntityRestInterface.GENERATED_MIN_ID).then(function(systemInstance) {
                self.customerListViewModel = new tutao.tutanota.ctrl.CustomerListViewModel(systemInstance);
                self.registrationDataListViewModel = new tutao.tutanota.ctrl.RegistrationDataListViewModel(systemInstance);
                self.displayed("listCustomers"); // list free, list starter
			});
		}
	}, this);
};



/**
 * Shows the customer list.
 */
tutao.tutanota.ctrl.CustomerViewModel.prototype.listFreeCustomers = function() {
	this.displayed("listFreeCustomers");
	this.customerListViewModel.type('free');
};

/**
 * Shows the customer list.
 */
tutao.tutanota.ctrl.CustomerViewModel.prototype.listStarterCustomers = function() {
	this.displayed("listStarterCustomers");
	this.customerListViewModel.type('starter');
};

/**
 * Shows the customer list.
 */
tutao.tutanota.ctrl.CustomerViewModel.prototype.listPremiumCustomers = function() {
	this.displayed("listPremiumCustomers");
	this.customerListViewModel.type('premium');
};

/**
 * Shows the registrationData list.
 */
tutao.tutanota.ctrl.CustomerViewModel.prototype.listRegistrationData = function() {
	this.displayed("listRegistrationData");
	this.registrationDataListViewModel.showSelected();
};

