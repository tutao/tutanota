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

	/* the currently selected dom elements for contacts */
	this._selectedDomElements = [];
	/* the contacts corresponding to the currently selected dom elements */
	this._selectedContacts = [];

	this._multiSelect = false;

	// the list of contact ids as result of the currently active search query.
	this.currentSearchResult = [];

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
    this._rawContacts = [];

};

tutao.tutanota.ctrl.ContactListViewModel.prototype.initButtonBar = function() {
    // button bar
    this.buttons = [
        //function (labelTextId, priority, clickListener, isVisible, directClick, id, imageClass, imageAltTextId, isSelected) {
        new tutao.tutanota.ctrl.Button("newContact_action", 10,  tutao.locator.navigator.newContact, function(){return true;}, false, "newContactAction", "add")
    ];
    this.buttonBarViewModel = new tutao.tutanota.ctrl.ButtonBarViewModel(this.buttons);
    var self = this;
    tutao.locator.contactView.getSwipeSlider().getViewSlider().addWidthObserver(tutao.tutanota.gui.ContactView.COLUMN_CONTACT_LIST, function (width) {
        // we reduce the max width by 10 px which are used in our css for paddings + borders
        self.buttonBarViewModel.setButtonBarWidth(width - 10);
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
  return this._rawContacts;
};

/**
 * Called when new contacts are downloaded by the event tracker.
 * @param {Array.<tutao.entity.tutanota.Contact>} contacts The new contacts.
 * @return {Promise.<>} Resolved when finished, rejected if the rest call failed.
 */
tutao.tutanota.ctrl.ContactListViewModel.prototype.updateOnNewContacts = function(contacts) {
	for (var i = 0; i < contacts.length; i++) {
		this.currentSearchResult.push(contacts[i].getId()[1]);
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

	var currentResult = tutao.util.ArrayUtils.getUniqueAndArray([this.currentSearchResult]);
	// sort the array by contact id descending
	currentResult.sort(function(a, b) {
		return (tutao.rest.EntityRestInterface.firstBiggerThanSecond(a, b)) ? -1 : 1;
	});
	var loadedContacts = [];
	return self._loadContacts(currentResult, loadedContacts, 0).then(function() {
        // sort contacts by name
        loadedContacts.sort(function(a, b) {
            return (a.getSortName() > b.getSortName());
        });

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
 * Loads the contacts with the given ids in the given order. Uses recursion to load all contacts.
 * @param {Array.<Array.<String>>} contactIds The ids of the contacts to load.
 * @param {Array.<tutao.entity.tutanota.ContactWrapper>} loadedContacts An array that contains all contacts that are loaded up to now.
 * @param {number} nextContact The index of the contact id in contactIds that shall be loaded next.
 * @return {Promise.<>} Resolved when finished, rejected if the rest call failed.
 */
tutao.tutanota.ctrl.ContactListViewModel.prototype._loadContacts = function(contactIds, loadedContacts, nextContact) {
    if (contactIds.length == 0) {
        return Promise.resolve();
    }
    var self = this;
	return tutao.entity.tutanota.Contact.load([tutao.locator.mailBoxController.getUserContactList().getContacts(), contactIds[nextContact]]).then(function(contact) {
        loadedContacts.push(new tutao.entity.tutanota.ContactWrapper(contact));
    }).lastly(function() {
        if (nextContact == contactIds.length - 1) {
            return Promise.resolve();
        } else {
            return self._loadContacts(contactIds, loadedContacts, nextContact + 1);
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