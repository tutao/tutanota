"use strict";

tutao.provide('tutao.tutanota.ctrl.PaymentDataViewModel');

/**
 * Allows changing invoice address and payment data.
 * @constructor
 */
tutao.tutanota.ctrl.PaymentDataViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

    this.accountingInfo = ko.observable(null);
    this.accountType = ko.observable(tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_FREE);

    this.usageOptions = [{name: tutao.lang("privateUse_label"), value: false}, {name: tutao.lang("businessUse_label"), value: true}];

    this.usageStatus = ko.computed(function() {
        if (this.accountType() == tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_FREE && this.accountingInfo() != null && this.accountingInfo().business()) {
            return {type: "invalid", text: "emptyString_msg"};
        } else {
            return {type: "neutral", text: "emptyString_msg"};
        }
    }, this);

    this.availableCountries = [{n: tutao.lang('choose_label'), a: null, t: 0}].concat(tutao.util.CountryList.COUNTRIES);

    this.showVatIdNoField = ko.computed(function() {
        return this.accountingInfo() != null && this.accountingInfo().business() && this.accountingInfo().invoiceCountry() && tutao.util.CountryList.getByAbbreviation(this.accountingInfo().invoiceCountry()).t == tutao.util.CountryList.TYPE_EU_OR_SIMILAR;
    }, this);

    var businessMethods = [
        { name: tutao.lang('choose_label'), value: null },
        { name: tutao.lang('paymentMethodCreditCard_label'), value: tutao.entity.tutanota.TutanotaConstants.PAYMENT_METHOD_CREDIT_CARD },
        { name: tutao.lang('paymentMethodInvoice_label'), value: tutao.entity.tutanota.TutanotaConstants.PAYMENT_METHOD_INVOICE }
    ];
    var privateMethods = [businessMethods[0], businessMethods[1]];

    this.availablePaymentMethods = ko.computed(function() {
        if (this.accountingInfo() && this.accountingInfo().business()) {
            return businessMethods;
        } else {
            return privateMethods;
        }
    }, this);

    this.state = new tutao.tutanota.util.SubmitStateMachine();
    this.state.setInputInvalidMessageListener(this._getInputInvalidMessage);

    var self = this;
    tutao.locator.userController.getLoggedInUser().loadCustomer().then(function(customer) {
        self.accountType(customer.getType());
        return customer.loadCustomerInfo().then(function(customerInfo) {
            return customerInfo.loadAccountingInfo().then(function(accountingInfo) {
                self.accountingInfo(new tutao.entity.sys.AccountingInfoEditable(accountingInfo));
                self.state.entering(true);
            });
        });
    });

    window.addEventListener("message", this._paymentMessageHandler, false);
    this._paymentWindow = null;
    this._paymentToken = ko.observable(null);

};

tutao.tutanota.ctrl.PaymentDataViewModel.prototype._getInputInvalidMessage = function() {
    if (this.accountingInfo()) {
        if (this.accountingInfo().business()) {
            if (this.accountingInfo().invoiceName().trim() == "") {
                return "invoiceRecipientInfoBusiness_msg";
            } else if (this.accountingInfo().invoiceAddress().trim() == "" || (this.accountingInfo().invoiceAddress().match(/\n/g) || []).length > 3) {
                return "invoiceAddressInfoBusiness_msg";
            } else if (!this.accountingInfo().invoiceCountry()) {
                return "invoiceCountryInfoBusiness_msg";
            } else if (this.showVatIdNoField() && this.accountingInfo().invoiceVatIdNo().trim() == "") {
                return "invoiceVatIdNoInfoBusiness_msg";
            } else if (!this.accountingInfo().paymentMethod()) {
                return "invoicePaymentMethodInfo_msg";
            } else if ( this.accountingInfo().paymentMethod() == tutao.entity.tutanota.TutanotaConstants.PAYMENT_METHOD_CREDIT_CARD && this.accountingInfo().paymentMethodInfo() == null){
                return "enterCreditCartData_msg";
            }
        } else {
            if (!this.accountingInfo().invoiceCountry()) {
                return "invoiceCountryInfoBusiness_msg"; // use business text here because it fits better
            } else if (!this.accountingInfo().paymentMethod()) {
                return "invoicePaymentMethodInfo_msg";
            } else if ( this.accountingInfo().paymentMethod() == tutao.entity.tutanota.TutanotaConstants.PAYMENT_METHOD_CREDIT_CARD && this.accountingInfo().paymentMethodInfo() == null){
                return "enterCreditCartData_msg";
            }
        }
    }
    return null; // input is valid
};

tutao.tutanota.ctrl.PaymentDataViewModel.prototype.storeAccountingInfo = function() {
    if (!this.state.submitEnabled()) {
        return;
    }
    var self = this;

    var service = new tutao.entity.sys.PaymentDataServicePutData();
    service.setBusiness(this.accountingInfo().business())
        .setInvoiceName(this.accountingInfo().invoiceName())
        .setInvoiceAddress(this.accountingInfo().invoiceAddress())
        .setInvoiceCountry(this.accountingInfo().invoiceCountry())
        .setInvoiceVatIdNo(this.accountingInfo().invoiceVatIdNo())
        .setPaymentMethod(this.accountingInfo().paymentMethod())
        .setPaymentMethodInfo(this.accountingInfo().paymentMethodInfo())
        .setPaymentInterval(this.accountingInfo().paymentInterval())
        .setPaymentToken(this._paymentToken())
        .setConfirmedCountry(null);

    this.state.submitting(true);
    service.update({}, null).then(function(paymentResult) {
        return self._handlePaymentDataServiceResult(paymentResult, service);
    }).caught(function() {
        self.state.failure(true);
    });
};


tutao.tutanota.ctrl.PaymentDataViewModel.prototype._handlePaymentDataServiceResult = function(paymentResult, service) {
    var self = this;
    var statusCode = paymentResult.getResult();
    if( statusCode == tutao.entity.tutanota.TutanotaConstants.PAYMENT_DATA_SERVICE_RESULT_TYPE_OK){
        self.state.success(true);
		return Promise.resolve();
    } else {
        if ( statusCode == tutao.entity.tutanota.TutanotaConstants.PAYMENT_DATA_SERVICE_RESULT_TYPE_COUNTRY_MISMATCH) {
            self.state.setFailureMessage("countryMismatch_msg");
            var countryName = tutao.util.CountryList.getByAbbreviation(self.accountingInfo().invoiceCountry()).n;
            var confirmMessage = tutao.lang("confirmCountry_msg", {"{1}" : countryName });
            return tutao.tutanota.gui.confirm(confirmMessage).then( function(confirmed) {
                if (confirmed){
                    service.setConfirmedCountry(self.accountingInfo().invoiceCountry()); // add confirmed invoice country
                    return service.update({}, null).then(function(paymentResult) {
                        return self._handlePaymentDataServiceResult(paymentResult);
                    }).caught(function() {
                        self.state.failure(true);
                    });
                }
            });
        } else if( statusCode == tutao.entity.tutanota.TutanotaConstants.PAYMENT_DATA_SERVICE_RESULT_TYPE_INVALID_VATID_NUMBER){
            self.state.setFailureMessage("invalidVatIdNumber_msg");
        } else if (statusCode ==  tutao.entity.tutanota.TutanotaConstants.PAYMENT_DATA_SERVICE_RESULT_TYPE_CREDIT_CARD_DECLINED) {
            self.state.setFailureMessage("creditCardNumberInvalid_msg");
        } else if (statusCode ==  tutao.entity.tutanota.TutanotaConstants.PAYMENT_DATA_SERVICE_RESULT_TYPE_CREDIT_CARD_CVV_INVALID) {
            self.state.setFailureMessage("creditCardCVVInvalid_msg");
        } else if (statusCode ==  tutao.entity.tutanota.TutanotaConstants.PAYMENT_DATA_SERVICE_RESULT_TYPE_PAYMENT_PROVIDER_NOT_AVAILABLE) {
            self.state.setFailureMessage("paymentProviderNotAvailable_msg");
        } else {
            self.state.setFailureMessage("otherPaymentProviderError_msg");
        }
        self.state.failure(true);
        return Promise.resolve();
    }
};



tutao.tutanota.ctrl.PaymentDataViewModel.prototype.isCreditCardButtonVisible = function() {
    return this.accountingInfo() != null && this.accountingInfo().paymentMethod() == tutao.entity.tutanota.TutanotaConstants.PAYMENT_METHOD_CREDIT_CARD;
};

tutao.tutanota.ctrl.PaymentDataViewModel.prototype.isCreditCardInfoAvailable = function() {
    return this.isCreditCardButtonVisible() && this.accountingInfo().paymentMethodInfo() != null;
};

tutao.tutanota.ctrl.PaymentDataViewModel.prototype.getRedirectMessage = function() {
    return tutao.lang('creditCardRedirect_msg', {'{1}': tutao.env.paymentDataServer});
};

tutao.tutanota.ctrl.PaymentDataViewModel.prototype.enterCreditCardData = function() {
    window.name = "paymentTest" + new Date().getTime(); // set a unique window name to
    this._paymentWindow = tutao.tutanota.gui.openLink(tutao.env.paymentDataServer + "/payment.html");
};

tutao.tutanota.ctrl.PaymentDataViewModel.prototype._paymentMessageHandler = function(event) {
    var self = this;
    if (event.data == tutao.entity.tutanota.TutanotaConstants.PAYMENT_MESSAGE_FORM_READY) {
        var targetOrigin = tutao.env.paymentDataServer;
        this._paymentWindow.postMessage(tutao.entity.tutanota.TutanotaConstants.PAYMENT_MESSAGE_WINDOW_NAME + ":" + window.name , targetOrigin);
        this._paymentWindow.postMessage(tutao.entity.tutanota.TutanotaConstants.PAYMENT_MESSAGE_PAYMENT_TYPE + ":" +  this.accountingInfo().paymentMethod() , targetOrigin);
        tutao.entity.sys.PaymentDataServiceGetReturn.load([], null).then(function(result){
            self._paymentWindow.postMessage(tutao.entity.tutanota.TutanotaConstants.PAYMENT_MESSAGE_CLIENT_TOKEN + ":" + result.getClientToken(), targetOrigin);
        });
    } else {
        var parts = event.data.split(":");
        if (parts.length == 2 && parts[0] == tutao.entity.tutanota.TutanotaConstants.PAYMENT_MESSAGE_PAYMENT_TOKEN) {
            console.log(event);
            var token = parts[1];
            console.log(  tutao.entity.tutanota.TutanotaConstants.PAYMENT_MESSAGE_PAYMENT_TOKEN + ":" + token);
            this._paymentToken(token);
        }
        if (parts.length == 2 && parts[0] == tutao.entity.tutanota.TutanotaConstants.PAYMENT_MESSAGE_PAYMENT_METHOD_DETAILS) {
            var details = parts[1];
            console.log(tutao.entity.tutanota.TutanotaConstants.PAYMENT_MESSAGE_PAYMENT_METHOD_DETAILS + ":" + details);
            this.accountingInfo().paymentMethodInfo(details);
        }
    }
};
