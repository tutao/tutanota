"use strict";

tutao.provide('tutao.tutanota.ctrl.FolderNameDialogViewModel');

/**
 * The ViewModel for creating and renaming mail folders.
 * @constructor
 */
tutao.tutanota.ctrl.FolderNameDialogViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

	this.headingTextId = ko.observable();
    this.name = ko.observable("");
    this.visible = ko.observable(false);
    this._resolveFunction = null;
    this._existingNames = [];
    this._currentName = "";
};

/**
 * Shows the dialog to enter a folder name.
 * @param {string} headingTextId The text to display as heading.
 * @param {Array.<string>} existingNames The names of the parallel folders which can not be used.
 * @param {string} currentName The current name of the folder or empty if the name for a new folder shall be entered.
 * @return {Promise<?string>} Provides null if entering the name was cancelled and the entered name otherwise.
 */
tutao.tutanota.ctrl.FolderNameDialogViewModel.prototype.showDialog = function(headingTextId, currentName, existingNames) {
    var self = this;
    self.headingTextId(headingTextId);
    self._currentName = currentName;
    self.name(currentName);
    self._existingNames = existingNames;
    return new Promise(function(resolve, reject) {
        self._resolveFunction = resolve;
        self.visible(true);
    });
};

tutao.tutanota.ctrl.FolderNameDialogViewModel.prototype.getNameStatus = function() {
    var name = this.name().trim();
    if (name == "" || name == this._currentName) {
        return { type: "neutral", text: "folderNameNeutral_msg" };
    } else {
        for (var i=0; i<this._existingNames.length; i++) {
            if (name == this._existingNames[i]) {
                return { type: "invalid", text: "folderNameInvalidExisting_msg" };
            }
        }
        return { type: "valid", text: "folderNameValid_msg" };
    }
};

tutao.tutanota.ctrl.FolderNameDialogViewModel.prototype.ok = function() {
    if (this.getNameStatus().type != "valid") {
        return;
    }
    this.visible(false);
    this._resolveFunction(this.name().trim());
};


tutao.tutanota.ctrl.FolderNameDialogViewModel.prototype.cancel = function() {
    this.visible(false);
    this._resolveFunction(null);
};
