"use strict";

goog.provide('tutao.tutanota.ctrl.ContactListViewModel');

/**
 * The list of contact headers on the left.
 * The context of all methods is re-bound to this for allowing the ViewModel to be called from event Handlers that might get executed in a different context.
 * @constructor
 */
tutao.tutanota.ctrl.ContactListViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

	/* the currently selected dom elements for contacts */
	this._selectedDomElements = [];
	/* the contacts corresponding to the currently selected dom elements */
	this._selectedContacts = [];

	this._multiSelect = false;

	// the list of contact ids as result of the currently active search query. if null, there is no search query active.
	this.currentSearchResult = null;

	// the current search string
	this.searchString = ko.observable("");

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

	// list of functions to be called after the contacts have been loaded for the first time
	this.contactsInitializedCallback = [];
};

/**
 * Initialize the ContactListViewModel. Registers an event listener on the contact list to get updates.
 */
tutao.tutanota.ctrl.ContactListViewModel.prototype.init = function() {
	this.currentSearchResult = [];
	var eventTracker = new tutao.event.PushListEventTracker(tutao.entity.tutanota.Contact, tutao.locator.mailBoxController.getUserContactList().getContacts(), "Contact", tutao.entity.Constants.Version);
	eventTracker.addObserver(this.updateOnNewContacts);
	eventTracker.observeList(tutao.rest.EntityRestInterface.GENERATED_MIN_ID);
};

/**
 * Called when new contacts are downloaded by the event tracker.
 * @param {Array.<tutao.entity.tutanota.ContactWrapper>} contacts The new contacts.
 * @param {function()} callback Called when finished.
 */
tutao.tutanota.ctrl.ContactListViewModel.prototype.updateOnNewContacts = function(contacts) {
	for (var i = 0; i < contacts.length; i++) {
		this.currentSearchResult.push(contacts[i].getId()[1]);
	}
	this._updateContactList(function() {});
	for (var i = 0; i < this.contactsInitializedCallback.length; i++) {
		this.contactsInitializedCallback[i]();
	}
};

/**
 * Updates the contact list according to the current search results.
 * @param {function} callback Called when finished.
 */
tutao.tutanota.ctrl.ContactListViewModel.prototype._updateContactList = function(callback) {
	var self = this;
	self.unselectAll();

	var currentResult = tutao.util.ArrayUtils.getUniqueAndArray([this.currentSearchResult]);
	// sort the array by contact id descending
	currentResult.sort(function(a, b) {
		return (tutao.rest.EntityRestInterface.firstBiggerThanSecond(a, b)) ? -1 : 1;
	});
	var loadedContacts = [];
	self._loadContacts(currentResult, loadedContacts, 0, function() {
		// unregister the listeners
		for (var i = 0; i < self.contacts().length; i++) {
			self.contacts()[i]().getContact().unregisterObserver(self._contactChanged);
		}
		var observables = [];
		// register the listeners
		for (var i = 0; i < loadedContacts.length; i++) {
			var obs = ko.observable(loadedContacts[i]);
			loadedContacts[i].getContact().registerObserver(self._contactChanged, obs);
			observables.push(obs);
		}
		self.contacts(observables);
		tutao.locator.contactView.contactListUpdated();
		callback();
	});
};

tutao.tutanota.ctrl.ContactListViewModel.prototype._contactChanged = function(deleted, contact, id) {
	// id is the observable of the contact
	if (deleted) {
		// we can not directly call remove(id) because that removes all observables (due to knockout equality check implementation)
		this.contacts.remove(function(item) {
			return (item().getContact() == contact);
		});
	} else {
		id.valueHasMutated();
	}
};

/**
 * Loads the contacts with the given ids in the given order. Uses recoursion to load all contacts.
 * @param {Array.<Array.<String>>} contactIds The ids of the contacts to load.
 * @param {Array.<tutao.entity.tutanota.Contact>} loadedContacts An array that contains all contacts that are loaded up to now.
 * @param {number} nextContact The index of the contact id in contactIds that shall be loaded next.
 * @param {function} callback Called when finished.
 */
tutao.tutanota.ctrl.ContactListViewModel.prototype._loadContacts = function(contactIds, loadedContacts, nextContact, callback) {
if (contactIds.length == 0) {
	callback();
	return;
}
var self = this;
	tutao.entity.tutanota.Contact.load([tutao.locator.mailBoxController.getUserContactList().getContacts(), contactIds[nextContact]], function(contact, exception) {
		if (!exception) {
			loadedContacts.push(new tutao.entity.tutanota.ContactWrapper(contact));
		}
		if (nextContact == contactIds.length - 1) {
			callback();
		} else {
			self._loadContacts(contactIds, loadedContacts, nextContact + 1, callback);
		}
	});
};

/**
 * Shows the given contact in the contact view.
 * @param {tutao.entity.tutanota.Contact} contact The contact to show.
 * @param {Object} event The event that triggered this call.
 */
tutao.tutanota.ctrl.ContactListViewModel.prototype.showContact = function(contact, event) {
	this._selectContact(contact, event.currentTarget);
	tutao.locator.contactViewModel.showContact(contact);
};

/**
 * Highlights the give contact.
 * @param {tutao.entity.tutanota.Contact} contact Contact to select.
 * @param {Object} domElement dom element of the contact.
 */
tutao.tutanota.ctrl.ContactListViewModel.prototype._selectContact = function(contact, domElement) {
	if (this._multiSelect) {
		// implement multi selection
	} else {
		tutao.tutanota.gui.unselect(this._selectedDomElements);
		this._selectedDomElements = [domElement];
		this._selectedContacts = [contact];
		tutao.tutanota.gui.select(this._selectedDomElements);
	}
};

/**
 * Deselects all contacts.
 */
tutao.tutanota.ctrl.ContactListViewModel.prototype.unselectAll = function() {
	tutao.tutanota.gui.unselect(this._selectedDomElements);
	this._selectedDomElements = [];
	this._selectedContacts = [];
	// do not remove the contact to avoid that new elements are removed
	// tutao.locator.contactViewModel.removeContact();
};

tutao.tutanota.ctrl.ContactListViewModel.prototype.importThunderbirdContactsAsCsv = function() {
	tutao.tutanota.util.FileUtils.showFileChooser(function(files) {
		if (files && files.length == 1 && tutao.util.StringUtils.endsWith(files.item(0).name, ".csv")) {
			tutao.tutanota.util.FileUtils.readLocalFileContentAsUtf8(files.item(0), function(csv, exception) {
				if (exception) {
					console.log(exception);
					return;
				}
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
 * @param {function()|Object|undefined} callback Is called when finished. Maybe a the dom object that triggered the search. Attention, please!
 */
tutao.tutanota.ctrl.ContactListViewModel.prototype.search = function(callback) {
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
tutao.tutanota.ctrl.ContactListViewModel.prototype.getSuggestions = function(text) {
	return [];
};

/** @inheritDoc */
tutao.tutanota.ctrl.ContactListViewModel.prototype.createBubbleFromSuggestion = function(suggestion) {
	return null;
};

/** @inheritDoc */
tutao.tutanota.ctrl.ContactListViewModel.prototype.createBubbleFromText = function(text) {
	return new tutao.tutanota.ctrl.bubbleinput.Bubble(null, ko.observable(text), ko.observable('default'));
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
