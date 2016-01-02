"use strict";

tutao.provide('tutao.tutanota.ctrl.ContactListViewModel');

/**
 * The list of contact headers on the left.
 * The context of all methods is re-bound to this for allowing the ViewModel to be called from event Handlers that might get executed in a different context.
 * @constructor
 * @implements {tutao.tutanota.ctrl.bubbleinput.BubbleHandler}
 */
tutao.tutanota.ctrl.ContactListViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

	this._selectedContacts = ko.observableArray();

	this._multiSelect = false;

	// the current search string
	this.searchString = ko.observable("");

	this.buttonBarViewModel = null;

	// ===== SEARCH ========

	this.bubbleInputViewModel = new tutao.tutanota.ctrl.bubbleinput.BubbleInputViewModel(this);
	this.buttonCss = ko.computed(function() {
		if (this.bubbleInputViewModel.inputValue().trim() || this.bubbleInputViewModel.bubbles().length > 0) {
			return 'cancel';
		} else {
			return 'search';
		}
	},this);
	this.bubbleInputViewModel.bubbles.subscribe(function() {
		this.search();
	}, this);

	// ===== SEARCH ========

	// contains observables with ContactWrappers
	this.contacts = ko.observableArray();
	this.buttons = ko.observableArray();

    // @type {?Array.<tutao.entity.tutanota.ContactWrapper>}
    this._rawContacts = ko.observableArray();

};

tutao.tutanota.ctrl.ContactListViewModel.prototype.initButtonBar = function() {
    // button bar
    this.buttons = [
        //function (labelTextId, priority, clickListener, isVisible, directClick, id, imageClass, imageAltTextId, isSelected) {
        new tutao.tutanota.ctrl.Button("newContact_action", 10,  tutao.locator.navigator.newContact, function(){
            return !tutao.locator.contactView.isContactColumnVisible();
        }, false, "newContactAction", "addContact")
    ];
    this.buttonBarViewModel = new tutao.tutanota.ctrl.ButtonBarViewModel(this.buttons, null, tutao.tutanota.gui.measureActionBarEntry);
    var self = this;
    tutao.locator.contactView.getSwipeSlider().getViewSlider().addWidthObserver(tutao.tutanota.gui.ContactView.COLUMN_CONTACT_LIST, function (width) {
        // we reduce the max width by 10 px which are used in our css for paddings + borders
        self.buttonBarViewModel.setButtonBarWidth(width - 6);
    });
};

/**
 * Initialize the ContactListViewModel. Registers an event listener on the contact list to get updates.
 * @return {Promise.<>} Resolves when finished
 */
tutao.tutanota.ctrl.ContactListViewModel.prototype.init = function() {
    var eventTracker = new tutao.event.PushListEventTracker(tutao.entity.tutanota.Contact, tutao.locator.mailBoxController.getUserContactList().getContacts(), "Contact");
    eventTracker.addObserver(this.updateOnNewContacts);
    eventTracker.observeList(tutao.rest.EntityRestInterface.GENERATED_MIN_ID);
};

tutao.tutanota.ctrl.ContactListViewModel.prototype.getRawContacts = function() {
  return this._rawContacts();
};

/**
 * Called when new contacts are downloaded by the event tracker.
 * @param {Array.<tutao.entity.tutanota.Contact>} contacts The new contacts.
 * @return {Promise.<>} Resolved when finished, rejected if the rest call failed.
 */
tutao.tutanota.ctrl.ContactListViewModel.prototype.updateOnNewContacts = function(contacts) {
	for (var i = 0; i < contacts.length; i++) {
        this._rawContacts.push(new tutao.entity.tutanota.ContactWrapper(contacts[i]));
    }
	return this._updateContactList();
};

/**
 * Updates the contact list according to the current search results.
 * @return {Promise.<>} Resolved when finished, rejected if the rest call failed.
 */
tutao.tutanota.ctrl.ContactListViewModel.prototype._updateContactList = function() {
	var self = this;
	self.unselectAll();

    this._rawContacts.sort(function(a, b) {
        return a.getSortName().localeCompare(b.getSortName());
    });

    // unregister the listeners
    for (var i = 0; i < self.contacts().length; i++) {
        self.contacts()[i]().getContact().unregisterObserver(self._contactChanged);
    }
    var observables = [];
    // register the listeners
    for (var i = 0; i < this._rawContacts().length; i++) {
        var obs = ko.observable(this._rawContacts()[i]);
        this._rawContacts()[i].getContact().registerObserver(self._contactChanged, obs);
        observables.push(obs);
    }
    self.contacts(observables);
};

tutao.tutanota.ctrl.ContactListViewModel.prototype._contactChanged = function(deleted, contact, id) {
	// id is the observable of the contact
	if (deleted) {
		this.removeFromList(contact);
	} else {
		id.valueHasMutated();
	}
};


tutao.tutanota.ctrl.ContactListViewModel.prototype.removeFromList = function(contact) {
	// we can not directly call remove(id) because that removes all observables (due to knockout equality check implementation)
	this.contacts.remove(function(item) {
		return (item().getContact() == contact);
	});
    this._rawContacts.remove(function(item) {
        return (item.getContact() == contact);
    });
};

/**
 * Shows the given contact in the contact view.
 * @param {tutao.entity.tutanota.ContactWrapper} contactWrapper The contact to show.
  @return {Promise.<bool>} True if showing the contact was cancelled.
 */
tutao.tutanota.ctrl.ContactListViewModel.prototype.showContact = function(contactWrapper) {
    var self = this;
	return tutao.locator.contactViewModel.showContact(contactWrapper).then(function(cancelled) {
        if (!cancelled) {
            self._selectedContacts([contactWrapper]);
        }
    });
};

/**
 * Deselects all contacts.
 */
tutao.tutanota.ctrl.ContactListViewModel.prototype.unselectAll = function() {
    this._selectedContacts([]);
	// do not remove the contact to avoid that new elements are removed
	// tutao.locator.contactViewModel.removeContact();
};

/**
 * Provides a ContactWrapper for the given mail address or null if none was found.
 * @param {string} mailAddress The mail address.
 * @return {tutao.entity.tutanota.ContactWrapper} The contact wrapper.
 */
tutao.tutanota.ctrl.ContactListViewModel.prototype.findContactByMailAddress = function(mailAddress) {
    var contacts = this.getRawContacts();
    for (var i = 0; i < contacts.length; i++) {
        if (contacts[i].hasMailAddress(mailAddress)) {
            return contacts[i];
        }
    }
    return null;
};
tutao.tutanota.ctrl.ContactListViewModel.prototype.isSelectedContact = function(contactWrapper) {
    return this._selectedContacts.indexOf(contactWrapper) >= 0;
};

tutao.tutanota.ctrl.ContactListViewModel.prototype.importThunderbirdContactsAsCsv = function() {
	tutao.locator.fileFacade.showFileChooser().then(function(files) {
		if (files && files.length == 1 && tutao.util.StringUtils.endsWith(files.item(0).name, ".csv")) {
			tutao.tutanota.util.FileUtils.readLocalFileContentAsUtf8(files.item(0)).then(function(csv, exception) {
				var contacts = new tutao.tutanota.ctrl.ThunderbirdContactCsvConverter().csvToContacts(csv);
				if (!contacts) {
					console.log("import failed");
					return;
				}
				for (var i=0; i<contacts.length; i++) {
					contacts[i].setup(tutao.locator.mailBoxController.getUserContactList().getContacts(), function() {});
				}
			});
		} else {
			console.log("nothing imported");
		}
	});
};

/**
 * Performs a search according to the current search words and updates the contact list accordingly.
 * @return {Promise.<>} Resolved when finished, rejected if the rest call failed.
 */
tutao.tutanota.ctrl.ContactListViewModel.prototype.search = function() {
};

/**
 * Called when the search button is clicked.
 */
tutao.tutanota.ctrl.ContactListViewModel.prototype.searchButtonClick = function() {
};

/**
 * Called when the search button is clicked.
 */
tutao.tutanota.ctrl.ContactListViewModel.prototype.cancelButtonClick = function() {
};

/**
 * Updates from the search field.
 * @param {Array.<Bubble>} bubbles The bubbles to put into the search field.
 * @param {string} currentTextElement The search field content as text.
 */
tutao.tutanota.ctrl.ContactListViewModel.prototype.update = function(bubbles, currentTextElement) {
};

/**
 * Requests for validity from the search field.
 * @param {string} text The text to validate.
 * @return {Object<text, colorId>} The validated text and color id.
 */
tutao.tutanota.ctrl.ContactListViewModel.prototype.validateBubbleText = function(text) {
};

/************** implementation of tutao.tutanota.ctrl.bubbleinput.BubbleHandler **************/

/** @inheritDoc */
tutao.tutanota.ctrl.ContactListViewModel.prototype.getSuggestions = function(text, callback) {
	callback([]);
};

/** @inheritDoc */
tutao.tutanota.ctrl.ContactListViewModel.prototype.createBubbleFromSuggestion = function(suggestion) {
	return null;
};

/** @inheritDoc */
tutao.tutanota.ctrl.ContactListViewModel.prototype.createBubblesFromText = function(text) {
	return [new tutao.tutanota.ctrl.bubbleinput.Bubble(null, ko.observable(text), ko.observable(null), ko.observable('default'), false)];
};

/** @inheritDoc */
tutao.tutanota.ctrl.ContactListViewModel.prototype.bubbleDeleted = function(bubble) {
	// nothing to do
};

/** @inheritDoc */
tutao.tutanota.ctrl.ContactListViewModel.prototype.buttonClick = function() {
	this.bubbleInputViewModel.bubbles.removeAll();
	this.bubbleInputViewModel.inputValue("");
	this.search();
};

/** @inheritDoc */
tutao.tutanota.ctrl.ContactListViewModel.prototype.buttonCss = function() {
    return null;
};

/** @inheritDoc */
tutao.tutanota.ctrl.ContactListViewModel.prototype.getTooltipButtons = function(bubble) {
    return [];
};