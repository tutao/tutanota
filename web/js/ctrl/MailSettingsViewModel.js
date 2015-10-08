"use strict";

tutao.provide('tutao.tutanota.ctrl.MailSettingsViewModel');

tutao.tutanota.ctrl.MailSettingsViewModel = function() {
    tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

    this._currentSenderMailAddress = tutao.locator.mailBoxController.getUserProperties().getDefaultSender();
    if (!this._currentSenderMailAddress) {
        this._currentSenderMailAddress = tutao.locator.userController.getUserGroupInfo().getMailAddress();
    }
    this.defaultSenderMailAddress = ko.observable(this._currentSenderMailAddress);

    this._currentConfidential = !tutao.locator.mailBoxController.getUserProperties().getDefaultUnconfidential();
    this.defaultConfidential = ko.observable(this._currentConfidential);

    this.mailSettingsStatus = ko.observable({ type: "neutral", text: "emptyString_msg"});

    this.inputEnabled = ko.observable(true);
    this._currentEmailSignatureType = tutao.locator.mailBoxController.getUserProperties().getEmailSignatureType();
    this.emailSignatureTypes = [];
    this.emailSignatureTypes.push({ value: tutao.entity.tutanota.TutanotaConstants.EMAIL_SIGNATURE_TYPE_DEFAULT, text: tutao.lang("emailSignatureTypeDefault_msg") });
    this.emailSignatureTypes.push({ value: tutao.entity.tutanota.TutanotaConstants.EMAIL_SIGNATURE_TYPE_CUSTOM, text: tutao.lang("emailSignatureTypeCustom_msg") });
    this.emailSignatureTypes.push({ value: tutao.entity.tutanota.TutanotaConstants.EMAIL_SIGNATURE_TYPE_NONE, text: tutao.lang("emailSignatureTypeNone_msg") });

    this._currentCustomEmailSignature = tutao.locator.mailBoxController.getUserProperties().getCustomEmailSignature();
    this.displayedEmailSignature = ko.observable("");

    this.selectedEmailSignatureType = ko.observable("");
    this.selectedEmailSignatureType.subscribe( function(newValue) {
        this.displayedEmailSignature(this._getEmailSignatureText(newValue));
    }, this);

    this.selectedEmailSignatureType(this.emailSignatureTypes[this._currentEmailSignatureType]);
};

tutao.tutanota.ctrl.MailSettingsViewModel.prototype._getEmailSignatureText = function(type) {
    if ( type.value == tutao.entity.tutanota.TutanotaConstants.EMAIL_SIGNATURE_TYPE_DEFAULT ) {
        return tutao.lang(tutao.entity.tutanota.TutanotaConstants.DEFAULT_EMAIL_SIGNATURE, { "{1}" : "https://app.tutanota.de/#register"} );
    } else if (type.value == tutao.entity.tutanota.TutanotaConstants.EMAIL_SIGNATURE_TYPE_CUSTOM) {
        return this._currentCustomEmailSignature; // handle empty email signature for firefox browser.
    } else {
        return "";
    }
};

tutao.tutanota.ctrl.MailSettingsViewModel.prototype.getEmailSignatureMsg = function() {
    if ( this.selectedEmailSignatureType().value == tutao.entity.tutanota.TutanotaConstants.EMAIL_SIGNATURE_TYPE_DEFAULT ) {
        return tutao.lang("customEmailSignatureAppend_msg");
    } else if (this.selectedEmailSignatureType().value == tutao.entity.tutanota.TutanotaConstants.EMAIL_SIGNATURE_TYPE_CUSTOM ) {
        return tutao.lang("customEmailSignatureEnter_msg") + " " + tutao.lang("customEmailSignatureAppend_msg");
    } else {
        return tutao.lang("customEmailSignatureNone_msg");
    }
};

tutao.tutanota.ctrl.MailSettingsViewModel.prototype.isEmailSignatureInputEnabled = function() {
  return this.inputEnabled() && this.selectedEmailSignatureType().value == tutao.entity.tutanota.TutanotaConstants.EMAIL_SIGNATURE_TYPE_CUSTOM;
};

/**
 * Provides the information if the user may press the confirm button.
 * @return {boolean} True if the button can be presse, false otherwise.
 */
tutao.tutanota.ctrl.MailSettingsViewModel.prototype.confirmPossible = function() {
    // check both observables here to make sure that both are bound
    var senderChanged = (this._currentSenderMailAddress != this.defaultSenderMailAddress());
    var confidentialChanged = (this._currentConfidential != this.defaultConfidential());
    var signatureTypeChanged = (this.emailSignatureTypes[this._currentEmailSignatureType] != this.selectedEmailSignatureType());
    var userEmailSignatureChanged = (this._currentCustomEmailSignature != this._getCustomEmailSignature());
    return this.inputEnabled() && (senderChanged || confidentialChanged || userEmailSignatureChanged || signatureTypeChanged);
};

tutao.tutanota.ctrl.MailSettingsViewModel.prototype._getCustomEmailSignature = function() {
    if (this.selectedEmailSignatureType().value == tutao.entity.tutanota.TutanotaConstants.EMAIL_SIGNATURE_TYPE_CUSTOM ) {
        return this.displayedEmailSignature().trim();
    }
    return this._currentCustomEmailSignature;
};

/**
 * Called when the confirm button is clicked by the user.
 */
tutao.tutanota.ctrl.MailSettingsViewModel.prototype.confirm = function() {
    if (!this.confirmPossible()) {
        return;
    }

    this.inputEnabled(false);
    this.mailSettingsStatus({ type: "neutral", text: "pleaseWait_msg" });

    var self = this;
    var props = tutao.locator.mailBoxController.getUserProperties();
    props.setDefaultSender(this.defaultSenderMailAddress());
    props.setDefaultUnconfidential(!this.defaultConfidential());
    props.setEmailSignatureType(this.selectedEmailSignatureType().value);
    props.setCustomEmailSignature(this._getCustomEmailSignature());
    props.update().then(function() {
        self.mailSettingsStatus({ type: "valid", text: "finished_msg" });
        self._currentSenderMailAddress = self.defaultSenderMailAddress();
        self._currentConfidential = self.defaultConfidential();
        self._currentEmailSignatureType = self.selectedEmailSignatureType().value;
        self._currentCustomEmailSignature = self._getCustomEmailSignature();
    }).finally( function(){
        self.inputEnabled(true);
    });
};
