"use strict";

tutao.provide('tutao.tutanota.ctrl.TermsAndConditionsDialogViewModel.js');

/**
 * The ViewModel for the terms and conditions dialog.
 * @constructor
 */
tutao.tutanota.ctrl.TermsAndConditionsDialogViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this.content = ko.observable("");
    this.visible = ko.observable(false);
    this.currentLang = ko.observable("en");
};


/**
 * Shows the terms and conditions dialog.
 */
tutao.tutanota.ctrl.TermsAndConditionsDialogViewModel.prototype.showTerms = function() {
    this._type = "terms";
    this.currentLang(tutao.locator.languageViewModel.getCurrentLanguage() == "de" ? "de" : "en");
    this._updateText();
    this.visible(true);
};

/**
 * Shows the privacy statement dialog.
 */
tutao.tutanota.ctrl.TermsAndConditionsDialogViewModel.prototype.showPrivacy = function(document, type, lang) {
    this._type = "privacy";
    this.currentLang(tutao.locator.languageViewModel.getCurrentLanguage() == "de" ? "de" : "en");
    this._updateText();

};

tutao.tutanota.ctrl.TermsAndConditionsDialogViewModel.prototype._updateText = function() {
    //this.visible(true);
    var link = "terms.html" + " #" + this._type + "-" + this.currentLang();
    var element = $("<div>");
    var self = this;
    element.load(link, null, function() {
        self.content(element.html());
        self.visible(true);
        $('#modalTermsAndConditionConfirmDialog').scrollTop(0);
    });
};


tutao.tutanota.ctrl.TermsAndConditionsDialogViewModel.prototype.showGermanVersion = function() {
    this.currentLang("de");
    this._updateText();
};


tutao.tutanota.ctrl.TermsAndConditionsDialogViewModel.prototype.close = function() {
    this.visible(false);
};


