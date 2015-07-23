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

    this.availableCountries = [{n: tutao.lang('choose_label'), a: null, t: 0}].concat(tutao.util.CountryList.COUNTRIES);

    this.showVatIdNoField = ko.computed(function() {
        return this.accountingInfo() != null && this.accountingInfo().business() && this.accountingInfo().invoiceCountry() && tutao.util.CountryList.getByAbbreviation(this.accountingInfo().invoiceCountry()).t == tutao.util.CountryList.TYPE_EU;
    }, this);

    var businessMethods = [
        { name: tutao.lang('choose_label'), value: null },
        { name: tutao.lang('paymentMethodCreditCard_label'), value: tutao.entity.tutanota.TutanotaConstants.PAYMENT_METHOD_CREDIT_CARD },
        { name: tutao.lang('@PayPal'), value: tutao.entity.tutanota.TutanotaConstants.PAYMENT_METHOD_PAY_PAL },
        { name: tutao.lang('paymentMethodOnAccount_label'), value: tutao.entity.tutanota.TutanotaConstants.PAYMENT_METHOD_INVOICE }
    ];
    var privateMethods = [businessMethods[0], businessMethods[1], businessMethods[2]];

    this.availablePaymentMethods = ko.computed(function() {
        if (this.accountingInfo() && this.accountingInfo().business()) {
            return businessMethods;
        } else {
            return privateMethods;
        }
    }, this);

    this.state = new tutao.tutanota.util.SubmitStateMachine(true);
    this.state.setInputInvalidMessageListener(this._getInputInvalidMessage);

    this._pricePerMonth = ko.observable(null);
    this._pricePerYear = ko.observable(null);

    this.customer = null;

    // if we access the user in the user controller directly (without setTimeout), a new PaymentDataViewModel is created as soon as the user controller fires the update event on the user
    // to avoid that, we have to do all user dependent calls in a setTimeout.
    var self = this;
    setTimeout(function() {
        self.step(tutao.locator.viewManager.isFreeAccount() ? 0 : -1);
        tutao.locator.userController.getLoggedInUser().loadCustomer().then(function(customer) {
            self.accountType(customer.getType());
            self.customer = customer;
            return customer.loadCustomerInfo().then(function(customerInfo) {
                return customerInfo.loadAccountingInfo().then(function(accountingInfo) {
                    self.accountingInfo(new tutao.entity.sys.AccountingInfoEditable(accountingInfo));
                    self.accountingInfo().paymentMethod.subscribe(self._updatePaymentInfo, self);
                    return tutao.util.BookingUtils.getPrice(tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_USERS, 1, 1, tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_PREMIUM, false).then(function(pricePerMonth) {
                        self._pricePerMonth(Number(pricePerMonth.getFuturePriceNextPeriod().getPrice()));
                        return tutao.util.BookingUtils.getPrice(tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_USERS, 1, 12, tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_PREMIUM, false).then(function(pricePerYear) {
                            self._pricePerYear(Number(pricePerYear.getFuturePriceNextPeriod().getPrice()));
                            self.state.entering(true);
                        });
                    });
                });
            });
        });
    }, 0);

    tutao.locator.eventListenerManager.addSingleEventListener("message", this._paymentMessageHandler);
    this._paymentWindow = null;
    this._paymentToken = ko.observable(null);
    this._paymentToken.subscribe(this._updatePaymentInfo, this);

    // only for upgrade
    this.step = ko.observable(); // is initialized above in setTimeout
    this.paymentIntervals = [{ textId: tutao.lang("yearly_label"), interval: "12" }, { textId: tutao.lang("monthly_label"), interval: "1" }];
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
            } else if ( this.isEnterPaymentDataButtonVisible() && this.accountingInfo().paymentMethodInfo() == null){
                return "enterPaymentData_msg";
            }
        } else {
            if (!this.accountingInfo().invoiceCountry()) {
                return "invoiceCountryInfoBusiness_msg"; // use business text here because it fits better
            } else if (!this.accountingInfo().paymentMethod()) {
                return "invoicePaymentMethodInfo_msg";
            } else if ( this.isEnterPaymentDataButtonVisible() && this.accountingInfo().paymentMethodInfo() == null){
                return "enterPaymentData_msg";
            }

        }
    }
    return null; // input is valid
};

tutao.tutanota.ctrl.PaymentDataViewModel.prototype.storeAccountingInfo = function() {
    var self = this;
    var service = new tutao.entity.sys.PaymentDataServicePutData();
    service._entityHelper.setSessionKey(this.accountingInfo().getAccountingInfo()._entityHelper.getSessionKey());
    service.setBusiness(this.accountingInfo().business())
        .setInvoiceName(this.accountingInfo().invoiceName())
        .setInvoiceAddress(this.accountingInfo().invoiceAddress())
        .setInvoiceCountry(this.accountingInfo().invoiceCountry())
        .setInvoiceVatIdNo(this.accountingInfo().invoiceVatIdNo())
        .setPaymentMethod(this.accountingInfo().paymentMethod())
        .setPaymentMethodInfo(this.accountingInfo().paymentMethodInfo())
        .setPaymentInterval(this.accountingInfo().paymentInterval())
        .setPaymentToken(this._paymentToken() != null ? this._paymentToken().value : null)
        .setConfirmedCountry(null);

    this.state.submitting(true);
    return service.update({}, null).then(function (paymentResult) {
        return self._handlePaymentDataServiceResult(paymentResult, service);
    }).caught(function () {
        self.state.failure(true);
    });
};


tutao.tutanota.ctrl.PaymentDataViewModel.prototype._updatePaymentInfo = function() {
    if ( this.accountingInfo() == null) {
        return;
    }
    var selectedPaymentMethod = this.accountingInfo().paymentMethod();
    if (this._paymentToken() != null && this._paymentToken().method == selectedPaymentMethod) {
        this.accountingInfo().paymentMethodInfo(this._paymentToken().info);
    } else if ( this.accountingInfo().getAccountingInfo().getPaymentMethod()  == selectedPaymentMethod) {
        this.accountingInfo().paymentMethodInfo(this.accountingInfo().getAccountingInfo().getPaymentMethodInfo());
    } else  {
        this.accountingInfo().paymentMethodInfo(null);
    }
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
                } else {
                    self.state.entering(true);
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

tutao.tutanota.ctrl.PaymentDataViewModel.prototype.isEnterPaymentDataButtonVisible = function() {
    return this.accountingInfo() != null && (this.accountingInfo().paymentMethod() == tutao.entity.tutanota.TutanotaConstants.PAYMENT_METHOD_CREDIT_CARD || this.accountingInfo().paymentMethod() == tutao.entity.tutanota.TutanotaConstants.PAYMENT_METHOD_PAY_PAL );
};

tutao.tutanota.ctrl.PaymentDataViewModel.prototype.getPaymentMethodDataTextId = function() {
    if (this.accountingInfo() == null) {
        return "emptyString_msg";
    } else if (this.accountingInfo().paymentMethod() == tutao.entity.tutanota.TutanotaConstants.PAYMENT_METHOD_CREDIT_CARD) {
        return "creditCardData_label";
    } else if (this.accountingInfo().paymentMethod() == tutao.entity.tutanota.TutanotaConstants.PAYMENT_METHOD_PAY_PAL) {
        return "paypalData_label";
    } else {
        return "emptyString_msg";
    }
};

tutao.tutanota.ctrl.PaymentDataViewModel.prototype.isPaymentMethodInfoAvailable = function() {
    return this.isEnterPaymentDataButtonVisible() && this.accountingInfo().paymentMethodInfo() != null;
};

tutao.tutanota.ctrl.PaymentDataViewModel.prototype.getRedirectMessage = function() {
    return tutao.lang('enterPaymentDataRedirect_msg', {'{1}': tutao.env.paymentDataServer});
};

tutao.tutanota.ctrl.PaymentDataViewModel.prototype.enterCreditCardData = function() {
    window.name = "payment" + new Date().getTime(); // set a unique window name to
    this._paymentWindow = tutao.tutanota.gui.openLink(tutao.env.paymentDataServer + "/payment.html");
};

tutao.tutanota.ctrl.PaymentDataViewModel.prototype._paymentMessageHandler = function(event) {
    var self = this;
    if (event.data == tutao.entity.tutanota.TutanotaConstants.PAYMENT_MESSAGE_FORM_READY) {
        var targetOrigin = tutao.env.paymentDataServer;
        this._paymentWindow.postMessage(tutao.entity.tutanota.TutanotaConstants.PAYMENT_MESSAGE_WINDOW_NAME + ":" + window.name , targetOrigin);
        this._paymentWindow.postMessage(tutao.entity.tutanota.TutanotaConstants.PAYMENT_MESSAGE_PAYMENT_METHOD + ":" +  this.accountingInfo().paymentMethod() , targetOrigin);
        tutao.entity.sys.PaymentDataServiceGetReturn.load([], null).then(function(result){
            self._paymentWindow.postMessage(tutao.entity.tutanota.TutanotaConstants.PAYMENT_MESSAGE_CLIENT_TOKEN + ":" + result.getClientToken(), targetOrigin);
        });
    } else {
        var parts = event.data.split(":");
        if (parts.length == 4 && parts[0] == tutao.entity.tutanota.TutanotaConstants.PAYMENT_MESSAGE_PAYMENT_TOKEN) {
            console.log(event);
            var token = parts[1];

            var paymentMethod = parts[2];
            var paymentMethodInfo = parts[3];
            if ( paymentMethod == tutao.entity.tutanota.TutanotaConstants.PAYMENT_METHOD_PAY_PAL){
                paymentMethodInfo = "PayPal: " + parts[3];
            }
            console.log( tutao.entity.tutanota.TutanotaConstants.PAYMENT_MESSAGE_PAYMENT_TOKEN + ":" + token);
            this._paymentToken({value: token, method: paymentMethod, info: paymentMethodInfo});
            this.state.entering(true); // makes any previous failure message disappear
        }
    }
};

tutao.tutanota.ctrl.PaymentDataViewModel.prototype.enterAccountingInfo = function() {
    this.step(1);
};

tutao.tutanota.ctrl.PaymentDataViewModel.prototype.back = function() {
    if (!this.state.cancelEnabled()) {
        return;
    }
    this.step(this.step() - 1);
};

tutao.tutanota.ctrl.PaymentDataViewModel.prototype.submitPaymentData = function() {
    if (!this.state.submitEnabled()) {
        return;
    }

    if (this.step() == -1) {
        this.storeAccountingInfo();
    } else {
        // show summary
        this.step(2);
    }
};

tutao.tutanota.ctrl.PaymentDataViewModel.prototype.buy = function() {
    if (!this.state.submitEnabled()) {
        return;
    }

    var self = this;
    this.storeAccountingInfo().then(function() {
        if (self.state.success()) {
            var service = new tutao.entity.sys.SwitchAccountTypeData();
            service.setAccountType(tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_PREMIUM);
            service.setDate(tutao.entity.tutanota.TutanotaConstants.CURRENT_DATE);

            self.state.submitting(true);
            self.customer.registerObserver(self._customerUpdated);
            service.setup({}, null).then(function() {
                self.state.success(true);
                // we wait for _customerUpdated to switch to the account view
                self._switchFreeToPremiumGroup();
            }).caught(function (error) {
                self.state.failure(true);
            });
        }
    });
};

tutao.tutanota.ctrl.PaymentDataViewModel.prototype._switchFreeToPremiumGroup = function() {
    return tutao.entity.sys.SystemKeysReturn.load({}, null).then(function(keyData) {
        return new tutao.entity.sys.MembershipAddData()
            .setUser(tutao.locator.userController.getLoggedInUser().getId())
            .setGroup(keyData.getPremiumGroup())
            .setSymEncGKey(tutao.locator.aesCrypter.encryptKey(tutao.locator.userController.getUserGroupKey(), tutao.locator.aesCrypter.base64ToKey(keyData.getPremiumGroupKey())))
            .setup({}, null)
            .then(function() {
                return new tutao.entity.sys.MembershipRemoveData()
                    .setUser(tutao.locator.userController.getLoggedInUser().getId())
                    .setGroup(keyData.getFreeGroup())
                    .erase({}, null);
            });
    }).caught(function(e) {
        console.log("error switching free to premium group", e);
    });
};

tutao.tutanota.ctrl.PaymentDataViewModel.prototype._customerUpdated = function() {
    this.customer.unregisterObserver(this._customerUpdated);
    tutao.locator.settingsViewModel.show(tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_ADMIN_ACCOUNT_INFO);
};

tutao.tutanota.ctrl.PaymentDataViewModel.prototype.getPriceText = function() {
    if (this.accountingInfo().paymentInterval() == "12") {
        return tutao.util.BookingUtils.formatPrice(this._pricePerYear()) + " " + tutao.lang('perYear_label');
    } else {
        return tutao.util.BookingUtils.formatPrice(this._pricePerMonth()) + " " + tutao.lang('perMonth_label');
    }
};

tutao.tutanota.ctrl.PaymentDataViewModel.prototype.getPriceInfoText = function() {
    if (this.accountingInfo().business()) {
        if (this.accountingInfo().paymentInterval() == "12") {
            return "= " + tutao.util.BookingUtils.formatPrice(this._pricePerYear() / 12) + " " + tutao.lang('perMonth_label') + ". " + tutao.lang('priceExcludesTaxes_msg') + " " + tutao.lang('subscriptionPriceInfo_msg');
        } else {
            return tutao.lang('priceExcludesTaxes_msg') + " " + tutao.lang('subscriptionPriceInfo_msg');
        }
    } else {
        if (this.accountingInfo().paymentInterval() == "12") {
            return "= " + tutao.util.BookingUtils.formatPrice(this._pricePerYear() / 12) + " " + tutao.lang('perMonth_label') + ". " + tutao.lang('priceIncludesTaxes_msg') + " " + tutao.lang('subscriptionPriceInfo_msg');
        } else {
            return tutao.lang('priceIncludesTaxes_msg') + " " + tutao.lang('subscriptionPriceInfo_msg');
        }
    }
};

tutao.tutanota.ctrl.PaymentDataViewModel.prototype.getStoreButtonText = function() {
    if (this.step() == -1) {
        return "save_action";
    } else {
        return "continue_action";
    }
};

tutao.tutanota.ctrl.PaymentDataViewModel.prototype.getSummaryBookingText = function() {
    return 'Tutanota Premium ' + tutao.lang('for_label') + ' ' + tutao.locator.userController.getUserGroupInfo().getMailAddress();
};

tutao.tutanota.ctrl.PaymentDataViewModel.prototype.getSummarySubscriptionText = function() {
    if (this.accountingInfo().paymentInterval() == "12") {
        return tutao.lang("yearly_label") + ', ' + tutao.lang('automaticRenewal_label');
    } else {
        return tutao.lang("monthly_label") + ', ' + tutao.lang('automaticRenewal_label');
    }
};

tutao.tutanota.ctrl.PaymentDataViewModel.prototype.getSummaryPriceText = function() {
    if (this.accountingInfo().business()) {
        return this.getPriceText() + " (" + tutao.lang("net_label") + ")";
    } else {
        return this.getPriceText() + " (" + tutao.lang("gross_label") + ")";
    }
};

tutao.tutanota.ctrl.PaymentDataViewModel.prototype.getSummaryPaymentMethodInfoText = function() {
    if (this.accountingInfo().paymentMethodInfo()) {
        return this.accountingInfo().paymentMethodInfo();
    } else {
        return tutao.lang(tutao.util.BookingUtils.getPaymentMethodNameTextId(this.accountingInfo().paymentMethod()));
    }
};
