"use strict";

tutao.provide('tutao.tutanota.ctrl.ModalDialogViewModel');

/**
 * The ViewModel for alert and confirm dialogs.
 * @constructor
 */
tutao.tutanota.ctrl.ModalDialogViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

    this.titleText = ko.observable("Tutanota");
	this.message = ko.observable("");
    this.externalLink = ko.observable(null);
    this.image = ko.observable(null);
    this.buttons = ko.observableArray();
    this.visible = ko.observable(false);

    this.closeFunction = null;
};

/**
 * Shows an alert dialog with an "ok" button.
 * @param {string} message The text to display in the dialog.
 * @return {Promise} Resolved when the dialog is closed by the user.
 */
tutao.tutanota.ctrl.ModalDialogViewModel.prototype.showAlert = function(message) {
    return this.showDialog(message, ["ok_action"]).then(function() {
        // nothing to return
    });
};

/**
 * Shows a confirm dialog with an "ok" button and a "cancel" button.
 * @param {string} message The text to display in the dialog.
 * @return {Promise<bool>} Resolved when the dialog is closed by the user. Returns true if the ok button was selected, false if the cancel button was selected.
 */
tutao.tutanota.ctrl.ModalDialogViewModel.prototype.showConfirm = function(message) {
    return this.showDialog(message, ["ok_action", "cancel_action"]).then(function(buttonIndex) {
        return (buttonIndex == 0);
    });
};

/**
 * Shows the dialog with the given buttons. Returns the index of the button that was selected by the user. The index of the last button is returned if the user closes the dialog with "X".
 * @param {string} message The text to display in the dialog.
 * @param {Array.<string>} buttonTextIds The texts to show on the buttons. The number text ids is the number of buttons that are shown.
 * @param {string=} title A title text that shoul appear, if not set the default title will be used.
 * @param {string=} externalLink A link to an external website.
 * @param {string=} image Name of an image that should be displayed in the dialog.
 * @return {Promise<Number>} Provides the id of the button that was clicked.
 */
tutao.tutanota.ctrl.ModalDialogViewModel.prototype.showDialog = function(message, buttonTextIds, title, externalLink, image) {
    var self = this;
    return new Promise(function(resolve, reject) {
        self.message(message);
        var buttons = [];
        for (var i=0; i<buttonTextIds.length; i++) {
            (function() { // wrapper function is needed to make buttonIndex available in the closure
                var buttonIndex = i;
                buttons.push({ text: buttonTextIds[i], click: function() {
                    self.visible(false);
                    resolve(buttonIndex);
                }});
            })();
        }
        self.buttons(buttons);

        // the last button shall be clicked if the dialog is closed via "X"
        self.closeFunction = function() {
            resolve(buttonTextIds.length - 1);
        };
        self.titleText(title ? title : "Tutanota" );
        self.externalLink(externalLink ? externalLink : null);
        self.image(image ? image : null);
        self.visible(true);
    });
};

tutao.tutanota.ctrl.ModalDialogViewModel.prototype.close = function() {
    this.visible(false);
    this.closeFunction();
};

tutao.tutanota.ctrl.ModalDialogViewModel.prototype.isDefaultButton = function(button) {
    // first element is the default button.
    return this.buttons.indexOf(button) == 0;
};



