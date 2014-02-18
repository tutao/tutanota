"use strict";

goog.provide('tutao.tutanota.ctrl.CustomerListViewModel');

/**
 * Handles the customer list in Tutanota.
 * @constructor
 */
tutao.tutanota.ctrl.CustomerListViewModel = function(systemInstance) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	
	this.editableCustomerInfos = ko.observableArray();
	this.upperBoundId = ko.observable(tutao.rest.EntityRestInterface.GENERATED_MAX_ID);
	this.type = ko.observable(null);
	this._customerInfoListId = null;
	this.type.subscribe(function(value) {
		if (tutao.locator.viewManager.getActiveView() != tutao.locator.customerView) {
			return;
		}
		if (value == 'free') {
			this._customerInfoListId = systemInstance.getFreeCustomerInfos();
		} else if (value == 'premium') {
			this._customerInfoListId = systemInstance.getPremiumCustomerInfos();
		} else if (value == 'starter') {
			this._customerInfoListId = systemInstance.getStarterCustomerInfos();
		}
		this.showSelected();
	}, this);
	
};

/**
 * Shows the customer list.
 */
tutao.tutanota.ctrl.CustomerListViewModel.prototype.showSelected = function() {
	var self = this;
    tutao.entity.sys.CustomerInfo.loadRange(this._customerInfoListId, self.upperBoundId(), 1000, true, function(customerInfos, exception) {
        if (exception) {
            console.log(exception);
        } else {
            var editableCustomerInfos = [];
            for (var i=0; i<customerInfos.length; i++) {
                editableCustomerInfos.push(new tutao.entity.sys.CustomerInfoEditable(customerInfos[i]));
            }
            self.editableCustomerInfos(editableCustomerInfos);
        }
	});
};

/**
 * Updates the given CustomerInfoEditable on the server. Only the test end time should have been changed.
 * @param {tutao.entity.sys.CustomerInfoEditable} editableCustomerInfo The customer to update.
 */
tutao.tutanota.ctrl.CustomerListViewModel.prototype.updateTestEndTime = function(editableCustomerInfo) {
	var self = this;
	if (editableCustomerInfo.testEndTime() == null) {
		console.log("invalid date: null");
		return;
	}
	//TODO (before release) disable cache, reload customer info?
	var oldDate = editableCustomerInfo.getCustomerInfo().getTestEndTime();
	editableCustomerInfo.update();
	editableCustomerInfo.getCustomerInfo().update(function(exception) {
		if (exception) {
			// reset the date to indicate that the update failed
			editableCustomerInfo.testEndTime(oldDate);
			editableCustomerInfo.update();
			console.log(exception);
		}
	});
};

/**
 * Updates the given CustomerInfoEditable on the server. Only the activation time should have been changed.
 * @param {tutao.entity.sys.CustomerInfoEditable} editableCustomerInfo The customer to update.
 */
tutao.tutanota.ctrl.CustomerListViewModel.prototype.updateActivationTime = function(editableCustomerInfo) {
    var self = this;
    if (editableCustomerInfo.activationTime() == null) {
        console.log("invalid date: null");
        return;
    }
    //TODO (before release) disable cache, reload customer info?
    var oldDate = editableCustomerInfo.getCustomerInfo().getActivationTime();
    editableCustomerInfo.update();
    editableCustomerInfo.getCustomerInfo().update(function(exception) {
        if (exception) {
            // reset the date to indicate that the update failed
            editableCustomerInfo.activationTime(oldDate);
            editableCustomerInfo.update();
            console.log(exception);
        }
    });
};
