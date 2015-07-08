"use strict";
tutao.provide("tutao.tutanota.pay.Bootstrap");
/**
 * Executes all initializations needed for the live one-and-only tutanota website.
 * This binding is located in gui, so that it is not used for unit or integration tests.
 */
tutao.tutanota.pay.Bootstrap.init = function () {
    var launch = function () {

        // disable all registered event handlers on the document and the window
        $(document).off();
        $(window).off();
		
        tutao.tutanota.pay.Bootstrap.initControllers();
        //tutao.locator.viewManager.select(tutao.locator.fastMessageView);

        tutao.tutanota.gui.initKnockout();
    };

    $(document).ready(launch);
};

tutao.tutanota.pay.Bootstrap.initControllers = function () {

    tutao.tutanota.pay.Bootstrap.initLocator();

    // shortcuts
    tutao.lang = tutao.locator.languageViewModel.get;

    tutao.locator.paymentDataValidationViewModel.init();
};

/**
 * May be overwritten by other clients.
 */
tutao.tutanota.pay.Bootstrap.initLocator = function() {
    tutao.locator = {};
    tutao.locator.languageViewModel = new tutao.tutanota.ctrl.LanguageViewModel();
    tutao.locator.paymentDataValidationViewModel = new tutao.tutanota.pay.PaymentDataValidationViewModel();
};
