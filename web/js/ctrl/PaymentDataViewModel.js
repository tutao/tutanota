"use strict";

tutao.provide('tutao.tutanota.ctrl.PaymentDataViewModel');

/**
 * Allows changing invoice address and payment data.
 * @constructor
 */
tutao.tutanota.ctrl.PaymentDataViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

    this.accountingInfo = ko.observable();
    this.accountType = ko.observable(tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_FREE);

    this.usageOptions = [{name: tutao.lang("privateUse_label"), value: false}, {name: tutao.lang("businessUse_label"), value: true}];

    this.usageStatus = ko.computed(function() {
        if (this.accountType() == tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_FREE && this.accountingInfo() && this.accountingInfo().business()) {
            return {type: "invalid", text: "emptyString_msg"};
        } else {
            return {type: "neutral", text: "emptyString_msg"};
        }
    }, this);

    this.availableCountries = [{n: tutao.lang('choose_label'), a: null, t: 0}].concat(tutao.util.CountryList.COUNTRIES);

    this.showVatIdNoField = ko.computed(function() {
        return this.accountingInfo() && this.accountingInfo().business() && this.accountingInfo().invoiceCountry() && tutao.util.CountryList.getByAbbreviation(this.accountingInfo().invoiceCountry()).t == tutao.util.CountryList.TYPE_EU;
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
            }
        } else {
            if (!this.accountingInfo().invoiceCountry()) {
                return "invoiceCountryInfoBusiness_msg"; // use business text here because it fits better
            } else if (!this.accountingInfo().paymentMethod()) {
                return "invoicePaymentMethodInfo_msg";
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
    this.accountingInfo().update();
    this.state.submitting(true);
    self.accountingInfo().getAccountingInfo().update().then(function() {
        self.state.success(true);
    }).caught(function() {
        self.state.failure(true);
    });
};
