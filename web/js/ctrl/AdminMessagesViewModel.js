"use strict";

tutao.provide('tutao.tutanota.ctrl.AdminMessagesViewModel');

tutao.tutanota.ctrl.AdminMessagesViewModel = function() {
    tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

    this.externalWelcomeMessage = ko.observable("");
    this.externalWelcomeMessageStatus = ko.observable({ type: "neutral", text: "emptyString_msg" });

    this.busy = ko.observable(true);
    this.properties = ko.observable(null);

    var self = this;
    tutao.locator.userController.getLoggedInUser().loadCustomer().then(function(customer) {
        return customer.loadProperties().then(function(properties) {
            self.properties = properties;
            self.externalWelcomeMessage(properties.getExternalUserWelcomeMessage());
            self.busy(false);
        });
    });
};

/**
 * Called when the confirm button is clicked by the user. Triggers the next state in the state machine.
 */
tutao.tutanota.ctrl.AdminMessagesViewModel.prototype.confirm = function() {
    if (this.busy()) {
        return;
    }
    this.properties.setExternalUserWelcomeMessage(this.externalWelcomeMessage());
    this.busy(true);
    var self = this;
    this.properties.update().then(function() {
        self.externalWelcomeMessageStatus({ type: "valid", text: "externalWelcomeMessageUpdated_msg" });
    });
};
