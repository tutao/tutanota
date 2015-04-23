"use strict";

tutao.provide('tutao.tutanota.ctrl.PaymentDataViewModel');

/**
 * Allows changing invoice address and payment data.
 * @constructor
 */
tutao.tutanota.ctrl.PaymentDataViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

    this.businessUse = ko.observable(true);
    this.accountingInfo = ko.observable();

    this.selectedCountry = ko.computed({
        read: function () {
            if (this.accountingInfo()) {
                if (this.accountingInfo().invoiceCountry()) {
                    var c = tutao.util.CountryList.getByAbbreviation(this.accountingInfo().invoiceCountry());
                    if (c) {
                        return c;
                    }
                }
            }
            return undefined; // we need to return undefined, otherwise the options caption is not shown in the select
        },
        write: function (value) {
            if (!value) {
                this.accountingInfo().invoiceCountry(null);
            } else {
                this.accountingInfo().invoiceCountry(value.a);
            }
        },
        owner: this
    });

    this.availablePaymentMethods = ko.observableArray();
    this.selectedPaymentMethod = ko.computed({
        read: function () {
            if (this.accountingInfo()) {
                if (this.accountingInfo().paymentMethod()) {
                    for (var i = 0; i < this.availablePaymentMethods().length; i++) {
                        if (this.availablePaymentMethods()[i].id == this.accountingInfo().paymentMethod()) {
                            return this.availablePaymentMethods()[i];
                        }
                    }
                }
            }
            return undefined; // we need to return undefined, otherwise the options caption is not shown in the select
        },
        write: function (value) {
            if (!value) {
                this.accountingInfo().paymentMethod(null);
            } else {
                this.accountingInfo().paymentMethod(value.id);
            }
        },
        owner: this
    });

    this.state = new tutao.tutanota.util.StateMachine2();
    this.state.setInputInvalidMessageListener(this._getInputInvalidMessage);

    var self = this;
    tutao.locator.userController.getLoggedInUser().loadCustomer().then(function(customer) {
        return customer.loadCustomerInfo().then(function(customerInfo) {
            return customerInfo.loadAccountingInfo().then(function(accountingInfo) {
                //self.businessUse(customerInfo.getBusiness());
                self.availablePaymentMethods.push({ name: tutao.lang('paymentMethodCreditCard_label'), id: tutao.entity.tutanota.TutanotaConstants.PAYMENT_METHOD_CREDIT_CARD });
                if (self.businessUse()) {
                    self.availablePaymentMethods.push({ name: tutao.lang('paymentMethodInvoice_label'), id: tutao.entity.tutanota.TutanotaConstants.PAYMENT_METHOD_INVOICE });
                }
                self.accountingInfo(new tutao.entity.sys.AccountingInfoEditable(accountingInfo));
                self.state.entering(true);
            });
        });
    });
};

tutao.tutanota.ctrl.PaymentDataViewModel.prototype._getInputInvalidMessage = function() {
    if (this.accountingInfo()) {
        if (this.businessUse()) {
            if (this.accountingInfo().invoiceName().trim() == "") {
                return "invoiceRecipientInfoBusiness_msg";
            } else if (this.accountingInfo().invoiceAddress().trim() == "") {
                return "invoiceAddressInfoBusiness_msg";
            } else if (!this.accountingInfo().invoiceCountry()) {
                return "invoiceCountryInfoBusiness_msg";
            } else if (this.selectedCountry() && this.selectedCountry().t == tutao.util.CountryList.TYPE_EU && this.accountingInfo().invoiceVatIdNo().trim() == "") {
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
