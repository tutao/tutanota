"use strict";

goog.provide('tutao.tutanota.ctrl.RegistrationDataListViewModel');

/**
 * Handles the registration data in Tutanota.
 * @constructor
 */
tutao.tutanota.ctrl.RegistrationDataListViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this.registrationDataList = ko.observableArray();
	this.upperBoundId = ko.observable(tutao.rest.EntityRestInterface.CUSTOM_MIN_ID);
	
	this.company = ko.observable("");
	this.domain = ko.observable("");
	this.accountTypes = [{id: '2', name: 'Starter'}];
	this.selectedAccountType = ko.observable("");
	this.groupName = ko.observable("");
	this.mobilePhoneNumber = ko.observable("");
	this.phoneNumber = ko.observable("");
	this.invoiceAddress = ko.observable("");
	this.mailAddress = ko.observable("");
	
	this._listId = ko.observable(null);
	var self = this;
	tutao.entity.sys.System.load(tutao.rest.EntityRestInterface.GENERATED_MIN_ID, function(systemInstance) {
		self._listId(systemInstance.getRegistrationDataList());
	});
};

tutao.tutanota.ctrl.RegistrationDataListViewModel.prototype.reset = function() {
	this.company("");
	this.domain("");
	this.selectedAccountType("");
	this.groupName("");
	this.mobilePhoneNumber("");
	this.phoneNumber("");
	this.invoiceAddress("");
	this.mailAddress("");
};

tutao.tutanota.ctrl.RegistrationDataListViewModel.prototype.getUrl = function(id) {
	return document.location.protocol + "//" + document.location.hostname + ":" + document.location.port + "/#register/" + tutao.rest.ResourceConstants.AUTH_TOKEN_PARAMETER_NAME + "=" + id;
};

tutao.tutanota.ctrl.RegistrationDataListViewModel.prototype.getAccountTypeName = function(typeId) {
	if (typeId == "1") {
		return "Free";
	} else if (typeId == "2") {
		return "Starter";
	} else if (typeId == "3") {
		return "Premium";
	} else if (typeId == "4") {
		return "Stream";
	}
};

tutao.tutanota.ctrl.RegistrationDataListViewModel.prototype.getStateName = function(stateId) {
	if (stateId == "0") {
		return "Initial";
	} else if (stateId == "1") {
		return "CodeSent";
	} else if (stateId == "2") {
		return "CodeVerified";
	} else if (stateId == "3") {
		return "Registered";
	}
};


// TODO add link: TutaDb.getProperty("TUTADB_SERVER") + "/#register/" + ResourceConstants.AUTH_TOKEN_PARAMETER_NAME + "=" + registrationToken;

/**
 * Adds a new registration data entry
 */
tutao.tutanota.ctrl.RegistrationDataListViewModel.prototype.add = function() {
	var regData = new tutao.entity.sys.RegistrationDataService()
		.setAccountType(this.selectedAccountType())
		.setCompany(this.company())
		.setDomain(this.domain())
		.setGroupName(this.groupName())
		.setMobilePhoneNumber(this.mobilePhoneNumber())
		.setInvoiceAddress(this.invoiceAddress())
		.setMailAddress(this.mailAddress())
		.setState(tutao.entity.tutanota.TutanotaConstants.REGISTRATION_STATE_INITIAL);
	var self = this;
	var authToken = regData.setup({}, tutao.entity.EntityHelper.createAuthHeaders(), function(authToken, exception) {
		if (exception) {
			console.log(exception);
		} else {
			// Workaround as re-loading a range does not work under all circumstances if the id is custom
			tutao.entity.sys.RegistrationData.load([self._listId(),authToken], function(element, exception) {
				self.registrationDataList.push(element);
			});
			self.reset();
		}
	});
	return false;
};

/**
 * removes a registration data entry
 */
tutao.tutanota.ctrl.RegistrationDataListViewModel.prototype.remove = function(element) {
	if (tutao.tutanota.gui.confirm("Really delete?")) {
		element.erase(function() {});
		this.registrationDataList.remove(element);
	}
	return false;
};

/**
 * Shows the registration data list.
 */
tutao.tutanota.ctrl.RegistrationDataListViewModel.prototype.showSelected = function() {
	if (!this._listId()) {
		return;
	}
	var self = this;
	this._loadRegistrationDataEntries(this.upperBoundId(), false, function(registrationDataList) {
		self.registrationDataList(registrationDataList);
	});
};

/**
 * Loads a maximum of 1000 entries beginning with the entry with a smaller id than upperBoundId 
 * @param {string} upperBoundId The id of upper limit (base64 encoded)
 * @param {boolean} reverse If the entries shall be loaded reverse.
 * @param {function(Array.<tutao.entity.sys.Customer>)} callback Will be called with the list of customers. 
 */
tutao.tutanota.ctrl.RegistrationDataListViewModel.prototype._loadRegistrationDataEntries = function(upperBoundId, reverse, callback) {
	var self = this;
	tutao.entity.sys.RegistrationData.loadRange(this._listId(), upperBoundId, 1000, reverse, function(registrationDataList, exception) {
		if (exception) {
			console.log(exception);
		} else {
			callback(registrationDataList);
		}
	});
};