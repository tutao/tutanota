"use strict";

tutao.provide('tutao.tutanota.ctrl.AdminMailSettingsViewModel');

tutao.tutanota.ctrl.AdminMailSettingsViewModel = function() {
    tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

    this.currentSenderMailAddress = tutao.locator.mailBoxController.getUserProperties().getDefaultSender();
    if (!this.currentSenderMailAddress) {
        this.currentSenderMailAddress = tutao.locator.userController.getUserGroupInfo().getMailAddress();
    }
    this.defaultSenderMailAddress = ko.observable(this.currentSenderMailAddress);

    this.currentConfidential = !tutao.locator.mailBoxController.getUserProperties().getDefaultUnconfidential();
    this.defaultConfidential = ko.observable(this.currentConfidential);

    this.mailSettingsStatus = ko.observable({ type: "neutral", text: "emptyString_msg"});

    this.inputEnabled = ko.observable(true);
};

/**
 * Provides the information if the user may press the confirm button.
 * @return {boolean} True if the button can be presse, false otherwise.
 */
tutao.tutanota.ctrl.AdminMailSettingsViewModel.prototype.confirmPossible = function() {
    // check both observables here to make sure that both are bound
    var senderChanged = (this.currentSenderMailAddress != this.defaultSenderMailAddress());
    var confidentialChanged = (this.currentConfidential != this.defaultConfidential());
    return this.inputEnabled() && this.mailSettingsStatus().type == "neutral" && (senderChanged || confidentialChanged);
};

/**
 * Called when the confirm button is clicked by the user.
 */
tutao.tutanota.ctrl.AdminMailSettingsViewModel.prototype.confirm = function() {
    if (!this.confirmPossible()) {
        return;
    }

    this.inputEnabled(false);
    this.mailSettingsStatus({ type: "neutral", text: "pleaseWait_msg" });

    var self = this;
    var props = this.currentSenderMailAddress = tutao.locator.mailBoxController.getUserProperties();
    props.setDefaultSender(this.defaultSenderMailAddress());
    props.setDefaultUnconfidential(!this.defaultConfidential());
    props.update().then(function() {
        self.mailSettingsStatus({ type: "valid", text: "finished_msg" });
    });
};
