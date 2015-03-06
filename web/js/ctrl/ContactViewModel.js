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
        new tutao.tutanota.ctrl.Button("delete_action", 9, self._deleteContact, isState(tutao.tutanota.ctrl.ContactViewModel.MODE_SHOW), false, "deleteContact", "removeContact"),
        new tutao.tutanota.ctrl.Button("newContact_action", 11, tutao.locator.navigator.newContact, function() {
            return self.mode() == tutao.tutanota.ctrl.ContactViewModel.MODE_NONE || self.mode() == tutao.tutanota.ctrl.ContactViewModel.MODE_SHOW;
        }, false, "newContactAction", "addContact"),


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
 * @return {Promise.<bool>} True if the user does not want to cancel the current conact, false otherwise.
 */
tutao.tutanota.ctrl.ContactViewModel.prototype._keepNewOrEditMode = function () {
    var self = this;
    var text = null;
    if (this.mode() == tutao.tutanota.ctrl.ContactViewModel.MODE_NEW) {
        text = tutao.lang("discardContact_msg");
    } else if (this.mode() == tutao.tutanota.ctrl.ContactViewModel.MODE_EDIT) {
        if (this.contactWrapper().getFullName() == "") {
            text = tutao.lang("discardContactChanges_msg");
        } else {
            text = tutao.lang("discardContactChangesFor_msg", {"{1}": this.contactWrapper().getFullName()});
        }
    } else {
        return Promise.resolve(false);
    }
    return tutao.tutanota.gui.confirm(text).then(function (ok) {
        if (!ok) {
            return true;
        } else {
            self.contactWrapper().stopEditingContact(self);
            return false;
        }
    });
};

/**
 * Set the contact that shall be shown. Asks the user to cancel any editing contact.
 * @param {tutao.entity.tutanota.ContactWrapper} contactWrapper The contact.
 */
tutao.tutanota.ctrl.ContactViewModel.prototype.showContact = function (contactWrapper) {
    var self = this;
    this._keepNewOrEditMode().then(function(keep) {
        if (!keep) {
            self._showContact(contactWrapper);
        }
    });
};

/**
 * Set the contact that shall be shown. Removes editing contacts if existing.
 * @param {tutao.entity.tutanota.ContactWrapper} contactWrapper The contact.
 */
tutao.tutanota.ctrl.ContactViewModel.prototype._showContact = function (contactWrapper) {
    this.contactWrapper(contactWrapper);
    this.editableContact = null;

    this.mode(tutao.tutanota.ctrl.ContactViewModel.MODE_SHOW);
    tutao.locator.contactView.showContactColumn();
};

/**
 * Create a new contact.
 */
tutao.tutanota.ctrl.ContactViewModel.prototype.newContact = function () {
    var self = this;
    this._keepNewOrEditMode().then(function(keep) {
        if (!keep){
            self.contactWrapper(tutao.entity.tutanota.ContactWrapper.createEmptyContactWrapper());
            self.editableContact = self.contactWrapper().startEditingContact(self);
            if (self.mode() == tutao.tutanota.ctrl.ContactViewModel.MODE_NEW || self.mode() == tutao.tutanota.ctrl.ContactViewModel.MODE_EDIT) {
                // switch to MODE_NONE to make knockout recognize the new fields
                self.mode(tutao.tutanota.ctrl.ContactViewModel.MODE_NONE);
            }
            self.mode(tutao.tutanota.ctrl.ContactViewModel.MODE_NEW);
            tutao.locator.contactView.showContactColumn();
        }
    });
};

/**
 * Edit the given contact. If any editing contact is already existing, the user is asked to cancel that contact.
 * @param {tutao.entity.tutanota.ContactWrapper} contactWrapper The contact to edit.
 * @return {Promise.<Boolean>} True if the contact can be edited, false otherwise.
 */
tutao.tutanota.ctrl.ContactViewModel.prototype.tryToShowAndEditContact = function (contactWrapper) {
    var self = this;
    if (this.mode() == tutao.tutanota.ctrl.ContactViewModel.MODE_EDIT && this.contactWrapper().getContact() == contactWrapper.getContact()) {
        // we are already editing the contact
        return Promise.resolve(true);
    }
    return this._keepNewOrEditMode().then(function(keep) {
        if (keep) {
            return false;
        } else {
            self._showContact(contactWrapper);
            self.editContact();
            return true;
        }
    });
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
    var self = this;
    if (this.mode() == tutao.tutanota.ctrl.ContactViewModel.MODE_NEW) {
        this.contactWrapper().getContact().setup(tutao.locator.mailBoxController.getUserContactList().getContacts()).then(function() {
            self.contactWrapper().stopEditingContact(self);
            self._showContact(self.contactWrapper());
        });
    } else if (this.mode() == tutao.tutanota.ctrl.ContactViewModel.MODE_EDIT) {
        this.contactWrapper().getContact().update().then(function() {
            self.contactWrapper().stopEditingContact(self);
            self._showContact(self.contactWrapper());
        }).caught(tutao.NotFoundError, function(e) {
            // avoid exception for missing sync
            self.contactWrapper().stopEditingContact(self);
            self.removeContact();
        });
    }
};

/**
 * Deletes the currently shown contact.
 */
tutao.tutanota.ctrl.ContactViewModel.prototype._deleteContact = function () {
    var self = this;
    tutao.tutanota.gui.confirm(tutao.lang("deleteContact_msg")).then(function(ok) {
        if (ok) {
            self.contactWrapper().getContact().erase().then(function () {
                self.removeContact();
            }).caught(tutao.NotFoundError, function () {
                // avoid exception for missing sync
                self.removeContact();
            });
        }
    });
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
