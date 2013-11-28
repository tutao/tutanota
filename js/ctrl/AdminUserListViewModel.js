"use strict";

goog.provide('tutao.tutanota.ctrl.AdminUserListViewModel');

/**
 * Shows a list of all users of a company
 * @constructor
 */
tutao.tutanota.ctrl.AdminUserListViewModel = function() {
	this.startId = ko.observable(tutao.rest.EntityRestInterface.GENERATED_MIN_ID);
	this.reverse = ko.observable(false)
	this._interval = 1000;
	tutao.locator.userController.getLoggedInUser().loadCustomer(function(customer, exception) {
		if (exception) {
			console.log(exception);
			return;
		}
		customer.loadCustomerGroup(function(customerGroup, exception) {
			if (exception) {
				console.log(exception);
				return;
			}
			tutao.entity.sys.UserReference.loadRange(customerGroup.getMembers(), this.startId(), this._interval, this.reverse(), function(userReferenceList, exception) {
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
		});
	});
};