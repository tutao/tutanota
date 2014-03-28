"use strict";

goog.provide('tutao.tutanota.ctrl.ProgressDialogModel');

/**
 * The Model for the progress dialog. Only one progress dialog can be shown at any time because this view model is defined as singleton in the Locator.
 * @constructor
 */
tutao.tutanota.ctrl.ProgressDialogModel = function() {
    tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
    this.title = ko.observable(null);
    this.progress = ko.observable(0);
    this.showDialog = ko.observable(false);
};

/**
 * Shows the progress dialog.
 * @param {string} titleId The message id for the title.
 */
tutao.tutanota.ctrl.ProgressDialogModel.prototype.open = function(titleId) {
    this.title(titleId);
    this.progress(0);
    this.showDialog(true);
};

/**
 * Closes the progress dialog.
 */
tutao.tutanota.ctrl.ProgressDialogModel.prototype.close = function() {
    this.showDialog(false);
};

/**
 * Updates the progress in the dialog.
 * @param {number} progress Progress between 0 and 100.
 */
tutao.tutanota.ctrl.ProgressDialogModel.prototype.updateProgress = function(progress) {
    this.progress(progress);
};

