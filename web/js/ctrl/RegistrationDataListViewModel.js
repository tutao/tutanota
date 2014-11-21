"use strict";

tutao.provide('tutao.tutanota.ctrl.RegistrationDataListViewModel');

/**
 * Handles the registration data in Tutanota.
 * @constructor
 */
tutao.tutanota.ctrl.RegistrationDataListViewModel = function(systemInstance) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this.registrationDataList = ko.observableArray();

	this.company = ko.observable("");
	this.domain = ko.observable("");
	this.accountTypes = [{id: '2', name: 'Starter'}, {id: '1', name: 'Free'}];
    this.language = ko.observable("de");
	this.selectedAccountType = ko.observable("");
	this.groupName = ko.observable("");
	this.mobilePhoneNumber = ko.observable("");
	this.phoneNumber = ko.observable("");
	this.mailAddress = ko.observable("");
	
	this._listId = ko.observable(systemInstance.getRegistrationDataList());

    this.loading = ko.observable(false);
    this.moreAvailable = ko.observable(true);
};

tutao.tutanota.ctrl.RegistrationDataListViewModel.STEP_RANGE_COUNT = 200;

tutao.tutanota.ctrl.RegistrationDataListViewModel.prototype.show = function() {
    this.registrationDataList([]);
    this.loadMore();
};


tutao.tutanota.ctrl.RegistrationDataListViewModel.prototype.loadMore = function() {
    var self = this;
    if (this.loading()) {
        return Promise.resolve();
    }
    this.loading(true);
    var lowestId = tutao.rest.EntityRestInterface.CUSTOM_MIN_ID;
    if (this.registrationDataList().length > 0) {
        var lastRegData = this.registrationDataList()[this.registrationDataList().length - 1];
        lowestId = tutao.rest.EntityRestInterface.getElementId(lastRegData);
    }

    return tutao.entity.sys.RegistrationData.loadRange(this._listId(), lowestId, tutao.tutanota.ctrl.RegistrationDataListViewModel.STEP_RANGE_COUNT, false).then(function(regData) {
        self.moreAvailable(regData.length == tutao.tutanota.ctrl.RegistrationDataListViewModel.STEP_RANGE_COUNT);
        for (var i = 0; i < regData.length; i++) {
            self.registrationDataList.push(regData[i]);
        }
    }).lastly(function(){
        self.loading(false);
    });
};
tutao.tutanota.ctrl.RegistrationDataListViewModel.prototype.reset = function() {
	this.company("");
	this.domain("");
	this.selectedAccountType("");
	this.groupName("");
	this.mobilePhoneNumber("");
	this.phoneNumber("");
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


/**
 * Adds a new registration data entry
 */
tutao.tutanota.ctrl.RegistrationDataListViewModel.prototype.add = function() {
	var regData = new tutao.entity.sys.RegistrationServiceData()
		.setAccountType(this.selectedAccountType())
        .setLanguage(this.language())
		.setCompany(this.company())
		.setDomain(this.domain())
		.setGroupName(this.groupName())
		.setMobilePhoneNumber(this.mobilePhoneNumber())
		.setMailAddress(this.mailAddress())
		.setState(tutao.entity.tutanota.TutanotaConstants.REGISTRATION_STATE_INITIAL);
	var self = this;
	var authToken = regData.setup({}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(registrationReturn) {
        // Workaround as re-loading a range does not work under all circumstances if the id is custom
        tutao.entity.sys.RegistrationData.load([self._listId(),registrationReturn.getAuthToken()]).then(function(element) {
            self.registrationDataList.push(element);
        });
        self.reset();
	});
	return false;
};

/**
 * removes a registration data entry
 */
tutao.tutanota.ctrl.RegistrationDataListViewModel.prototype.remove = function(element) {
    var self = this;
	tutao.tutanota.gui.confirm("Really delete?").then(function(ok) {
        if (ok) {
            element.erase();
            self.registrationDataList.remove(element);
        }
    });
};

/**
 * sends the domain verification mail to the requesting user
 */
tutao.tutanota.ctrl.RegistrationDataListViewModel.prototype.sentDomainVerificationMail = function(element) {
    tutao.tutanota.gui.confirm("Really send domain verification mail?").then(function (ok) {
        if (ok) {
            var input = new tutao.entity.sys.RegistrationVerifyDomainDataPut()
                .setAuthToken(element.getId()[1]);
            return input.update({}, null).then(function() {
                return tutao.entity.sys.RegistrationData.load(element.getId()).then(function(regData) {
                    element.setDomainVerificationMailSentOn(regData.getDomainVerificationMailSentOn());
                });
            });
        }
    });
};


