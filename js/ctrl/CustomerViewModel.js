"use strict";

goog.provide('tutao.tutanota.ctrl.CustomerViewModel');

/**
 * Handles the customers admin view in Tutanota.
 * @constructor
 */
tutao.tutanota.ctrl.CustomerViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this.displayed = ko.observable("listCustomers"); // list free, list starter, single
	this.customerListViewModel = new tutao.tutanota.ctrl.CustomerListViewModel();
	this.registrationDataListViewModel = new tutao.tutanota.ctrl.RegistrationDataListViewModel();
};

/**
 * Shows the customer list.
 */
tutao.tutanota.ctrl.CustomerViewModel.prototype.listFreeCustomers = function() {
	this.displayed("listCustomers");
	this.customerListViewModel.type('free');
};

/**
 * Shows the customer list.
 */
tutao.tutanota.ctrl.CustomerViewModel.prototype.listStarterCustomers = function() {
	this.displayed("listCustomers");
	this.customerListViewModel.type('starter');
};

/**
 * Shows the customer list.
 */
tutao.tutanota.ctrl.CustomerViewModel.prototype.listPremiumCustomers = function() {
	this.displayed("listCustomers");
	this.customerListViewModel.type('premium');
};

/**
 * Shows the registrationData list.
 */
tutao.tutanota.ctrl.CustomerViewModel.prototype.listRegistrationData = function() {
	this.displayed("listRegistrationData");
	this.registrationDataListViewModel.showSelected();
};

