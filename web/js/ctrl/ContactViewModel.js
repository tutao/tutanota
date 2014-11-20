"use strict";

tutao.provide('tutao.tutanota.ctrl.ContactViewModel');

/**
 * The contact on the right.
 * @constructor
 */
tutao.tutanota.ctrl.ContactViewModel = function () {
    tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

    this.contactWrapper = ko.observable(null);
    this.editableContact = null;
    this.mode = ko.observable(tutao.tutanota.ctrl.ContactViewModel.MODE_NONE);
    this.showPresharedPassword = ko.observable(false);
    this.showAutoTransmitPassword = ko.observable(false);
};

tutao.tutanota.ctrl.ContactViewModel.MODE_NONE = 0;
tutao.tutanota.ctrl.ContactViewModel.MODE_SHOW = 1;
tutao.tutanota.ctrl.ContactViewModel.MODE_EDIT = 2;
tutao.tutanota.ctrl.ContactViewModel.MODE_NEW = 3;

/**
 * Removes the currently visible contact. TODO (timely) make private if not used from outside.
 */
tutao.tutanota.ctrl.ContactViewModel.prototype.removeContact = function () {
    this.mode(tutao.tutanota.ctrl.ContactViewModel.MODE_NONE);
    this.contactWrapper(null);
    tutao.locator.contactView.showContactListColumn();
};


tutao.tutanota.ctrl.ContactViewModel.prototype.initButtonBar = function() {
    var self = this;
    var isState = function (state) {
        return function () {
            return self.mode() == state;
        };
    };

    this.buttons = [
        new tutao.tutanota.ctrl.Button("edit_action", 10, self.editContact, isState(tutao.tutanota.ctrl.ContactViewModel.MODE_SHOW), false, "editContact", "edit" ),
        new tutao.tutanota.ctrl.Button("delete_action", 9, self._deleteContact, isState(tutao.tutanota.ctrl.ContactViewModel.MODE_SHOW), false, "deleteContact", "trash"),
        new tutao.tutanota.ctrl.Button("newContact_action", 11, tutao.locator.navigator.newContact, function() {
            return self.mode() == tutao.tutanota.ctrl.ContactViewModel.MODE_NONE || self.mode() == tutao.tutanota.ctrl.ContactViewModel.MODE_SHOW;
        }, false, "newContactAction", "add"),


        new tutao.tutanota.ctrl.Button("dismiss_action", tutao.tutanota.ctrl.Button.ALWAYS_VISIBLE_PRIO, function () {
            self.contactWrapper().stopEditingContact(self);
            self.removeContact();
        }, isState(tutao.tutanota.ctrl.ContactViewModel.MODE_NEW), false, "dismissContactNew", "cancel"),
        new tutao.tutanota.ctrl.Button("save_action", 10, self._saveContact, isState(tutao.tutanota.ctrl.ContactViewModel.MODE_NEW), false, "saveContactNew", "confirm"),

        new tutao.tutanota.ctrl.Button("dismiss_action", tutao.tutanota.ctrl.Button.ALWAYS_VISIBLE_PRIO, function () {
            self.contactWrapper().stopEditingContact(self);
            self._showContact(self.contactWrapper());
        }, isState(tutao.tutanota.ctrl.ContactViewModel.MODE_EDIT), false, "dismissContact", "cancel"),

        new tutao.tutanota.ctrl.Button("save_action", 10, self._saveContact, isState(tutao.tutanota.ctrl.ContactViewModel.MODE_EDIT), false, "saveContact", "confirm")

    ];

    this.buttonBarViewModel = new tutao.tutanota.ctrl.ButtonBarViewModel(this.buttons, null, tutao.tutanota.gui.measureActionBarEntry);
    tutao.locator.contactView.getSwipeSlider().getViewSlider().addWidthObserver(tutao.tutanota.gui.ContactView.COLUMN_CONTACT, function (width) {
        // we reduce the max width by 10 px which are used in our css for paddings + borders
        self.buttonBarViewModel.setButtonBarWidth(width - 6);
    });
};

/**
 * Asks the user to cancel the current editing mode.
 */
tutao.tutanota.ctrl.ContactViewModel.prototype._keepNewOrEditMode = function () {
    if (this.mode() == tutao.tutanota.ctrl.ContactViewModel.MODE_NEW) {
        if (!tutao.tutanota.gui.confirm(tutao.locator.languageViewModel.get("discardContact_msg"))) {
            return true;
        }
        this.contactWrapper().stopEditingContact(this);
    } else if (this.mode() == tutao.tutanota.ctrl.ContactViewModel.MODE_EDIT) {
        var text = tutao.locator.languageViewModel.get("discardContactChanges_msg");
        if (this.contactWrapper().getFullName() != "") {
            text = tutao.locator.languageViewModel.get("discardContactChangesFor_msg", {"$": this.contactWrapper().getFullName()});
        }
        if (!tutao.tutanota.gui.confirm(text)) {
            return true;
        }
        this.contactWrapper().stopEditingContact(this);
    }
    return false;
};

/**
 * Set the contact that shall be shown. Asks the user to cancel any editing contact.
 * @param {tutao.entity.tutanota.ContactWrapper} contactWrapper The contact.
 */
tutao.tutanota.ctrl.ContactViewModel.prototype.showContact = function (contactWrapper) {
    if (this._keepNewOrEditMode()) {
        return;
    }
    this._showContact(contactWrapper);
};

/**
 * Set the contact that shall be shown. Removes editing contacts if existing.
 * @param {tutao.entity.tutanota.ContactWrapper} contactWrapper The contact.
 */
tutao.tutanota.ctrl.ContactViewModel.prototype._showContact = function (contactWrapper) {
    var self = this;
    this.contactWrapper(contactWrapper);
    this.editableContact = null;

    this.mode(tutao.tutanota.ctrl.ContactViewModel.MODE_SHOW);
    tutao.locator.contactView.showContactColumn();
};

/**
 * Create a new contact.
 */
tutao.tutanota.ctrl.ContactViewModel.prototype.newContact = function () {
    if (this._keepNewOrEditMode()) {
        return;
    }

    var self = this;
    this.contactWrapper(tutao.entity.tutanota.ContactWrapper.createEmptyContactWrapper());
    this.editableContact = this.contactWrapper().startEditingContact(this);
    if (this.mode() == tutao.tutanota.ctrl.ContactViewModel.MODE_NEW || this.mode() == tutao.tutanota.ctrl.ContactViewModel.MODE_EDIT) {
        // switch to MODE_NONE to make knockout recognize the new fields
        this.mode(tutao.tutanota.ctrl.ContactViewModel.MODE_NONE);
    }
    this.mode(tutao.tutanota.ctrl.ContactViewModel.MODE_NEW);
    tutao.locator.contactView.showContactColumn();
};

/**
 * Edit the given contact. If any editing contact is already existing, the user is asked to cancel that contact.
 * @param {tutao.entity.tutanota.ContactWrapper} contactWrapper The contact to edit.
 * @return {Boolean} True if the contact can be edited, false otherwise.
 */
tutao.tutanota.ctrl.ContactViewModel.prototype.tryToShowAndEditContact = function (contactWrapper) {
    if (this.mode() == tutao.tutanota.ctrl.ContactViewModel.MODE_EDIT && this.contactWrapper().getContact() == contactWrapper.getContact()) {
        // we are already editing the contact
        return true;
    }
    if (this._keepNewOrEditMode()) {
        return false;
    }
    this._showContact(contactWrapper);
    this.editContact();
    return true;
};

/**
 * Edit a contact.
 * @precondition A contact is currently visible.
 */
tutao.tutanota.ctrl.ContactViewModel.prototype.editContact = function () {
    var self = this;
    this.editableContact = this.contactWrapper().startEditingContact(this);
    this.mode(tutao.tutanota.ctrl.ContactViewModel.MODE_EDIT);
    tutao.locator.contactView.showContactColumn();
};

/**
 * Saves the currently edited contact.
 */
tutao.tutanota.ctrl.ContactViewModel.prototype._saveContact = function () {
    // we have to reset the pre-shared password to null if none is set
    // Disable reset of pre-shared password for free users because automatic password transfer is disabled.
    if (this.editableContact.presharedPassword() == "" && !tutao.locator.userController.isLoggedInUserFreeAccount()) {
        this.editableContact.presharedPassword(null);
    }
    this.editableContact.update();
    var promise;
    if (this.mode() == tutao.tutanota.ctrl.ContactViewModel.MODE_NEW) {
        promise = this.contactWrapper().getContact().setup(tutao.locator.mailBoxController.getUserContactList().getContacts());
    } else if (this.mode() == tutao.tutanota.ctrl.ContactViewModel.MODE_EDIT) {
        promise = this.contactWrapper().getContact().update();
    }
    var self = this;
    promise.then(function() {
        self.contactWrapper().stopEditingContact(this);
        self._showContact(self.contactWrapper());
    })
};

/**
 * Deletes the currently shown contact.
 */
tutao.tutanota.ctrl.ContactViewModel.prototype._deleteContact = function () {
    var self = this;
    if (tutao.tutanota.gui.confirm(tutao.locator.languageViewModel.get("deleteContact_msg"))) {
        this.contactWrapper().getContact().erase().then(function() {
            self.removeContact();
        });
    }
};

/**
 * Opens the mail view to send a mail to the given mail address. If a mail is already edited, the user is asked to cancel that mail.
 * @param {tutao.entity.tutanota.ContactMailAddress} contactMailAddress The recipients mail address.
 */
tutao.tutanota.ctrl.ContactViewModel.prototype.sendMail = function (contactMailAddress) {
    var recipient = new tutao.tutanota.ctrl.RecipientInfo(contactMailAddress.getAddress(), this.contactWrapper().getFullName(), this.contactWrapper());
    recipient.resolveType().caught(tutao.ConnectionError, function(e) {
        // we are offline but we want to show the dialog only when we click on send.
    });
    tutao.locator.navigator.newMail(recipient);
};

/**
 * Provides the URL to access the given social service.
 * @param {tutao.entity.tutanota.ContactSocialId} contactSocialId The social id of the service.
 * @return {string} The URL.
 */
tutao.tutanota.ctrl.ContactViewModel.prototype.getSocialIdUrl = function (contactSocialId) {
    var url = tutao.entity.tutanota.TutanotaConstants.CONTACT_SOCIAL_ID_TYPE_LINKS[contactSocialId.getType()];
    if (url == null) {
        return null;
    } else {
        return url + contactSocialId.getSocialId();
    }
};

/**
 * Provides an URL pointing to the given address in google maps.
 * @param {tutao.entity.tutanota.ContactAddress} contactAddress The address to point to.
 * @return {string} The URL.
 */
tutao.tutanota.ctrl.ContactViewModel.prototype.getMapUrl = function (contactAddress) {
    var url = "https://maps.google.com/?q=";
    var query = contactAddress.getAddress();
    query = query.replace(/\n/g, ", ");
    return url + query;
};

/**
 * Returns the text to display for the pre-shared password.
 * @return {string} The text to display.
 */
tutao.tutanota.ctrl.ContactViewModel.prototype.getPresharedPasswordText = function () {
    return (this.showPresharedPassword()) ? this.contactWrapper().getContact().getPresharedPassword() : "*****";
};

/**
 * Returns the text to display for the SMS password.
 * @return {string} The text to display.
 */
tutao.tutanota.ctrl.ContactViewModel.prototype.getAutoTransmitPasswordText = function () {
    return (this.showAutoTransmitPassword()) ? this.contactWrapper().getContact().getAutoTransmitPassword() : "*****";
};
