"use strict";

goog.provide('tutao.tutanota.ctrl.CustomerListViewModel');

/**
 * Handles the customer list in Tutanota.
 * @constructor
 */
tutao.tutanota.ctrl.CustomerListViewModel = function(systemInstance) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	
	this.editableCustomerInfos = ko.observableArray();
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
        this.editableCustomerInfos([]);
		this.loadMore();
	}, this);

    this.loading = ko.observable(false);
    this.moreAvailable = ko.observable(true);
};

tutao.tutanota.ctrl.CustomerListViewModel.STEP_RANGE_COUNT = 200;

tutao.tutanota.ctrl.CustomerListViewModel.prototype.loadMore = function() {
    var self = this;
    if (this.loading()) {
        return Promise.resolve();
    }
    this.loading(true);
    var lowestId = tutao.rest.EntityRestInterface.GENERATED_MAX_ID;
    if (this.editableCustomerInfos().length > 0) {
        var lastCustomer = this.editableCustomerInfos()[this.editableCustomerInfos().length -1].getCustomerInfo();
        lowestId = tutao.rest.EntityRestInterface.getElementId(lastCustomer);
    }

    return tutao.entity.sys.CustomerInfo.loadRange(this._customerInfoListId, lowestId, tutao.tutanota.ctrl.CustomerListViewModel.STEP_RANGE_COUNT, true).then(function(customerInfos) {
        self.moreAvailable(customerInfos.length == tutao.tutanota.ctrl.CustomerListViewModel.STEP_RANGE_COUNT);
        for (var i = 0; i < customerInfos.length; i++) {
            self.editableCustomerInfos.push(new tutao.entity.sys.CustomerInfoEditable(customerInfos[i]));
        }
    }).lastly(function(){
        self.loading(false);
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
	editableCustomerInfo.getCustomerInfo().update().caught(function(exception) {
        // reset the date to indicate that the update failed
        editableCustomerInfo.testEndTime(oldDate);
        editableCustomerInfo.update();
        throw exception;
    })
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
    editableCustomerInfo.getCustomerInfo().update().caught(function(exception) {
        // reset the date to indicate that the update failed
        editableCustomerInfo.activationTime(oldDate);
        editableCustomerInfo.update();
        throw exception;
    });
};
