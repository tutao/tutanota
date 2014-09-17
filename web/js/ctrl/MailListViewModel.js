//"use strict";

tutao.provide('tutao.tutanota.ctrl.MailListViewModel');

/**
 * The list of mail headers on the left.
 * The context of all methods is re-bound to this for allowing the ViewModel to be called from event Handlers that might get executed in a different context.
 * @constructor
 * @implements {tutao.tutanota.ctrl.bubbleinput.BubbleHandler}
 */
tutao.tutanota.ctrl.MailListViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

	/* the currently selected dom elements for mails */
	this._selectedDomElements = [];
	/* the mails corresponding to the currently selected dom elements */
	this._selectedMails = [];
	this._lastSelectedMail = {}; // map from tag to last selected mail; stored to make visible when a new mail was sent/canceled

	this._multiSelect = false;

	// the list of mail ids as result of the currently active search query. if null, there is no search query active.
	this.currentSearchResult = null;

	this._currentActiveSystemTag = ko.observable(tutao.tutanota.ctrl.TagListViewModel.RECEIVED_TAG_ID);
	// the list of mail ids as result of the currently active tag filters. if null, there is no filter set. each tag has one entry in the array.
	this.currentTagFilterResult = [];
	this.currentTagFilterResult[tutao.tutanota.ctrl.TagListViewModel.RECEIVED_TAG_ID] = [];
	this.currentTagFilterResult[tutao.tutanota.ctrl.TagListViewModel.SENT_TAG_ID] = [];
	this.currentTagFilterResult[tutao.tutanota.ctrl.TagListViewModel.TRASHED_TAG_ID] = [];

	this.tagToMailAttributeIdMapping = [];
	this.tagToMailAttributeIdMapping[tutao.tutanota.ctrl.TagListViewModel.RECEIVED_TAG_ID] = tutao.entity.tutanota.Mail.prototype.STATE_ATTRIBUTE_ID;
	this.tagToMailAttributeIdMapping[tutao.tutanota.ctrl.TagListViewModel.SENT_TAG_ID] = tutao.entity.tutanota.Mail.prototype.STATE_ATTRIBUTE_ID;
	this.tagToMailAttributeIdMapping[tutao.tutanota.ctrl.TagListViewModel.TRASHED_TAG_ID] = tutao.entity.tutanota.Mail.prototype.TRASHED_ATTRIBUTE_ID;

	this.tagToMailAttributeMapping = [];
	this.tagToMailAttributeMapping[tutao.tutanota.ctrl.TagListViewModel.RECEIVED_TAG_ID] = "_state";
	this.tagToMailAttributeMapping[tutao.tutanota.ctrl.TagListViewModel.SENT_TAG_ID] = "_state";
	this.tagToMailAttributeMapping[tutao.tutanota.ctrl.TagListViewModel.TRASHED_TAG_ID] = "_trashed";

	this.tagToMailAttributeValueMapping = [];
	this.tagToMailAttributeValueMapping[tutao.tutanota.ctrl.TagListViewModel.RECEIVED_TAG_ID] = tutao.entity.tutanota.TutanotaConstants.MAIL_STATE_RECEIVED;
	this.tagToMailAttributeValueMapping[tutao.tutanota.ctrl.TagListViewModel.SENT_TAG_ID] = tutao.entity.tutanota.TutanotaConstants.MAIL_STATE_SENT;
	this.tagToMailAttributeValueMapping[tutao.tutanota.ctrl.TagListViewModel.TRASHED_TAG_ID] = true;   // trashed = true

    this._tagMoreAvailable = [];
    this._tagMoreAvailable[tutao.tutanota.ctrl.TagListViewModel.RECEIVED_TAG_ID] = ko.observable(true);
    this._tagMoreAvailable[tutao.tutanota.ctrl.TagListViewModel.SENT_TAG_ID] = ko.observable(true);
    this._tagMoreAvailable[tutao.tutanota.ctrl.TagListViewModel.TRASHED_TAG_ID] = ko.observable(true);

	// ===== SEARCH ========

	this.bubbleInputViewModel = new tutao.tutanota.ctrl.bubbleinput.BubbleInputViewModel(this);

	this.bubbleInputViewModel.bubbles.subscribe(function() {
		//this.search();
	}, this);

	// ===== SEARCH ========

	this.mails = ko.observableArray();

	// the mail id (Array.<string>) of the email that shall be shown when init() is called
	this.mailToShow = null;
    this.loading = ko.observable(false);
    this.deleting = ko.observable(false);

    this.searchBarVisible = ko.observable(false);
    this.searchButtonVisible = ko.observable(false);

    this.actionBarVisible = ko.computed( function() {
        return !this.deleting() && (this.isDeleteTrashButtonVisible() || this.searchButtonVisible());
    },this);

    this.buttons = [];
    this.buttons.push(new tutao.tutanota.ctrl.Button("deleteTrash_action", 10, this._deleteTrash, this.isDeleteTrashButtonVisible, false, "deleteTrashAction"));
    this.buttonBarViewModel = new tutao.tutanota.ctrl.ButtonBarViewModel(this.buttons);
    // this is a workaround:
    // the action bar visibility depends on the visibility of the delete trash button
    // the visible buttons in the button bar view model can only be calculated if the action bar is visible and in the dom
    // to make sure the button bar view model gets notified as late as possible, notify it when the action bar is made visible with a timeout
    this.actionBarVisible.subscribe(function(value) {
        if (value) {
            var self = this;
            setTimeout(function() {
                self.buttonBarViewModel.updateVisibleButtons();
            }, 0);
        }
    }, this);

    this.showSpinner = ko.computed(function () {
        return this.deleting();
    }, this);

    this.moreAvailable = ko.computed(function() {
        return this._tagMoreAvailable[this._currentActiveSystemTag()]();
    }, this);

    this.stepRangeCount = 25;
};


/**
 * Initialize the MailListViewModel:
 * <ul>
 *   <li>Load the Mails to display from the server
 *   <li>register as an observer to the mail list
 * </ul>
 */
tutao.tutanota.ctrl.MailListViewModel.prototype.init = function() {
    var self = this;
    if (tutao.tutanota.util.ClientDetector.isMobileDevice()){
        this.stepRangeCount = 25;
    } else {
        this.stepRangeCount = 200;
    }
    this.searchButtonVisible(tutao.locator.dao.isSupported() && tutao.locator.viewManager.isInternalUserLoggedIn());
    return this.loadMoreMails().then(function() {
        if (tutao.locator.userController.isExternalUserLoggedIn()) {
            if (self.mailToShow) {
                return tutao.entity.tutanota.Mail.load(self.mailToShow).then(function(mail) {
                    self.selectMail(mail);
                });
            } else {
                if (self.mails().length > 0) {
                    self.selectMail(self.mails()[0]);
                }
                return Promise.resolve();
            }
        } else {
            var eventTracker = new tutao.event.PushListEventTracker(tutao.entity.tutanota.Mail, tutao.locator.mailBoxController.getUserMailBox().getMails(), "Mail");
            eventTracker.addObserver(self.updateOnNewMails);
            eventTracker.observeList(tutao.rest.EntityRestInterface.GENERATED_MAX_ID);
            return Promise.resolve();
        }
    });
};


tutao.tutanota.ctrl.MailListViewModel.prototype.loadMoreMails = function() {
    var self = this;

    if (this.loading() || this.deleting()) {
        return Promise.resolve();
    }
    this.loading(true);
    var tagId = self._currentActiveSystemTag();
    var lowestId = self._getLowestMailId(tagId);
    //return Promise.delay(5000).then(function(){
        return self._loadMoreMails(0, lowestId, tagId).lastly(function(){
            self.loading(false);
        });
    //});
};

tutao.tutanota.ctrl.MailListViewModel.prototype._loadMoreMails = function(alreadyLoadedForTagCount, startId, tagId) {
    var self = this;
    return tutao.entity.tutanota.Mail.loadRange(tutao.locator.mailBoxController.getUserMailBox().getMails(), startId, self.stepRangeCount, true).then(function(mails) {
        self._tagMoreAvailable[tagId](mails.length == self.stepRangeCount);
        for (var i = 0; i < mails.length; i++) {
            if (tagId == self._getTagForMail(mails[i])) {
                var elementId = tutao.rest.EntityRestInterface.getElementId(mails[i]);
                self._insertTagFilterResult(tagId, elementId);
                alreadyLoadedForTagCount++;
            }
            if (alreadyLoadedForTagCount == self.stepRangeCount) {
                // we may have loaded more mails, but we have already added enough for the current tag list, so stop now
                break;
            }
        }
        if ((alreadyLoadedForTagCount < self.stepRangeCount) && self._tagMoreAvailable[tagId]()) {
            var startId = tutao.rest.EntityRestInterface.getElementId(mails[mails.length-1]);
            return self._loadMoreMails(alreadyLoadedForTagCount, startId, tagId);
        } else {
			return self._updateMailList();
        }
    });
};

tutao.tutanota.ctrl.MailListViewModel.prototype._insertTagFilterResult = function(tagId, elementId){
    if (!tutao.util.ArrayUtils.contains(this.currentTagFilterResult[tagId], elementId)) {
        this.currentTagFilterResult[tagId].push(elementId);
        // sort the array by mail id descending
        this.currentTagFilterResult[tagId].sort(function(a, b) {
            return (tutao.rest.EntityRestInterface.firstBiggerThanSecond(a, b)) ? -1 : 1;
        });
    }
};


/**
 * Provides the string to show in the mail list of the given mail for the sender/recipient field.
 * @param {tutao.entity.tutanota.Mail} mail The mail.
 * @return {string} The string.
 */
tutao.tutanota.ctrl.MailListViewModel.getListSenderOrRecipientString = function(mail) {
	var label = null;
	if (mail.getState() == tutao.entity.tutanota.TutanotaConstants.MAIL_STATE_SENT) {
		var allRecipients = mail.getToRecipients().concat(mail.getCcRecipients()).concat(mail.getBccRecipients());
		if (allRecipients[0].getAddress() == tutao.locator.userController.getMailAddress()) {
			label = tutao.locator.languageViewModel.get("meNominative_label");
		} else if (allRecipients[0].getName() != "") {
			label = allRecipients[0].getName();
		} else {
			label = allRecipients[0].getAddress();
		}
		if (allRecipients.length > 1) {
			label += ", ...";
		}
	} else if (mail.getState() == tutao.entity.tutanota.TutanotaConstants.MAIL_STATE_RECEIVED) {
		if (mail.getSender().getAddress() == tutao.locator.userController.getMailAddress()) {
			label = tutao.locator.languageViewModel.get("meNominative_label");
		} else if (mail.getSender().getName() != "") {
			label = mail.getSender().getName();
		} else {
			label = mail.getSender().getAddress();
		}
	}
	return label;
};

/**
 * Called when a different tag was activated. Updates the mail list accordingly.
 * @param {number} tagId Id of the changed tag.
 * @return {Promise.<>} Resolved when finished, rejected if failed.
 */
tutao.tutanota.ctrl.MailListViewModel.prototype.systemTagActivated = function(tagId) {
    var self = this;
	this.unselectAll();
	this._currentActiveSystemTag(tagId);
    return this._updateMailList().then(function() {
        tutao.locator.mailView.showDefaultColumns();
        // load more mails if there are not enough shown for this tag
        if (self.moreAvailable() && self.currentTagFilterResult[tagId].length < self.stepRangeCount) {
            return self.loadMoreMails();
        } else {
            return Promise.resolve();
        }
    });
};


tutao.tutanota.ctrl.MailListViewModel.prototype.isDeleteTrashButtonVisible = function() {
     return this._currentActiveSystemTag() == tutao.tutanota.ctrl.TagListViewModel.TRASHED_TAG_ID && this.mails().length > 0;
};


/**
 * Updates the mail list according to the current search and tag filter results.
 * @return {Promise.<>} Resolved when finished, rejected if failed.
 */
tutao.tutanota.ctrl.MailListViewModel.prototype._updateMailList = function() {
	var self = this;

	var currentResult = this.currentTagFilterResult[this._currentActiveSystemTag()].slice();

	var loadedMails = [];

	return self._loadMails(currentResult, loadedMails, 0).then(function() {
		self.mails(loadedMails);
		self.selectPreviouslySelectedMail();
	});
};

/**
 * Selects the mail that has been selected before for the current tag.
 */
tutao.tutanota.ctrl.MailListViewModel.prototype.selectPreviouslySelectedMail = function() {
	var lastSelected = this.getLastSelectedMail();
	if (lastSelected) {
		this.selectMail(lastSelected);
	} else {
		tutao.locator.mailViewModel.hideConversation();
	}
};

/**
 * Loads the mails with the given ids in the given order. Uses recoursion to load all mails.
 * @param {Array.<Array.<String>>} mailIds The ids of the mails to load.
 * @param {Array.<tutao.entity.tutanota.Mail>} loadedMails An array that contains all mails that are loaded up to now.
 * @param {number} nextMail The index of the mail id in mailIds that shall be loaded next.
 * @return {Promise.<Array.<tutao.entity.tutanota.Mail>} Resolves to the loaded mails, rejected if failed.
 */
tutao.tutanota.ctrl.MailListViewModel.prototype._loadMails = function(mailIds, loadedMails, nextMail) {
	if (mailIds.length == 0) {
		return Promise.resolve();
	}
	var self = this;
	return tutao.entity.tutanota.Mail.load([tutao.locator.mailBoxController.getUserMailBox().getMails(), mailIds[nextMail]]).then(function(mail) {
        loadedMails.push(mail);
	}).lastly(function(e) {
        // move on, even if an exception occured.
        if (nextMail != mailIds.length - 1) {
            return self._loadMails(mailIds, loadedMails, nextMail + 1);
        }
    });
};


/**
 * This method gets invoked if new mails have been received from the server.
 * @param {Array.<Mail>} mails The mails that are new.
 */
tutao.tutanota.ctrl.MailListViewModel.prototype.updateOnNewMails = function(mails) {
	tutao.locator.notification.add(tutao.lang("newMails_msg"));
	for (var i = 0; i < mails.length; i++) {
        var mailTagId = this._getTagForMail(mails[i]);
        this.currentTagFilterResult[mailTagId].unshift(mails[i].getId()[1]);
        if (this._currentActiveSystemTag() == mailTagId) {
            this.mails.unshift(mails[i]);
        }
	}
};

tutao.tutanota.ctrl.MailListViewModel.prototype._getTagForMail = function(mail) {
    for (var tagId = 0; tagId < this.currentTagFilterResult.length; tagId++) {
        var mailAttribute = this.tagToMailAttributeMapping[tagId];
        var mailTagValue = mail[mailAttribute];
        if (this.tagToMailAttributeValueMapping[tagId] == mailTagValue) {
            return tagId;
        }
    }
    throw new Error("no tag found for mail " + mail.getId()[0] + "/" + mail.getId()[1]);
};

/**
 * Shows the mail with the given index in the mail view. If the index does not exist, the first index is shown.
 * If no mail exists, no mail is shown.
 * @param index The index to show.
 */
tutao.tutanota.ctrl.MailListViewModel.prototype.showIndex = function(index) {
	if (this.mails().length == 0) {
		return;
	}
	if (index < 0) {
		index = 0;
	} else if (index >= this.mails().length) {
		index = this.mails().length - 1;
	}
	this.selectMail(this.mails()[index]);
};

/**
 * Shows the given mail in the mail view but does not switch to the conversation column.
 * @param mail The mail to show.
 */
tutao.tutanota.ctrl.MailListViewModel.prototype.selectMail = function(mail) {
	this._selectMail(mail, tutao.locator.mailView.getMailListDomElement(mail), false);
};

/**
 * Shows the given mail in the mail view and switches to the conversation column.
 * @param mail The mail to show.
 * @param {Event} event The click event.
 */
tutao.tutanota.ctrl.MailListViewModel.prototype.selectMailAndSwitchToConversationColumn = function(mail, event) {
	this._selectMail(mail, event.currentTarget, true);
};

/**
 * Selects the given mail and shows it in the conversation column. Switches to the conversation column depending on the switchToConversationColumn param.
 * @param {tutao.entity.tutanota.Mail} mail Mail to select.
 * @param {Object} domElement dom element of the mail.
 * @param {boolean} switchToConversationColumn True if we shall switch.
 */
tutao.tutanota.ctrl.MailListViewModel.prototype._selectMail = function(mail, domElement, switchToConversationColumn) {
	if (!tutao.locator.mailViewModel.tryCancelAllComposingMails()) {
		return;
	}
	if (mail.getUnread()) {
		mail.setUnread(false);
		mail.update();
	}

	if (this._multiSelect) {
	} else {
		if (this._selectedMails.length > 0 && mail == this._selectedMails[0]) {
			tutao.locator.mailView.fadeConversation();
			tutao.locator.mailView.showConversationColumn();
		} else {
			tutao.tutanota.gui.unselect(this._selectedDomElements);
			this._selectedDomElements = [domElement];
			this._selectedMails = [mail];
			tutao.tutanota.gui.select(this._selectedDomElements);
			tutao.locator.mailViewModel.hideConversation();
			if (switchToConversationColumn) {
				tutao.locator.mailView.showConversationColumn(function() {
					tutao.locator.mailViewModel.showMail(mail);
				});
			} else {
				tutao.locator.mailViewModel.showMail(mail);
			}
		}
	}
};

/**
 * Provides the information if a mail is selected.
 * @return {boolean} True if a mail is selected, false otherwise.
 */
tutao.tutanota.ctrl.MailListViewModel.prototype.isMailSelected = function() {
	return (this._selectedMails.length != 0);
};

/**
 * Deselects all mails and remembers the last selected mail.
 */
tutao.tutanota.ctrl.MailListViewModel.prototype.unselectAll = function() {
	if (this._selectedMails.length == 1) {
		this._lastSelectedMail[this._currentActiveSystemTag()] = this._selectedMails[0];
	}
	tutao.tutanota.gui.unselect(this._selectedDomElements);
	this._selectedDomElements = [];
	this._selectedMails = [];
};

/**
 * Provides the last selected mail or null if none was selected.
 */
tutao.tutanota.ctrl.MailListViewModel.prototype.getLastSelectedMail = function() {
	if (this._lastSelectedMail[this._currentActiveSystemTag()] && this.mails.indexOf(this._lastSelectedMail[this._currentActiveSystemTag()]) != -1) {
		return this._lastSelectedMail[this._currentActiveSystemTag()];
	} else {
		return null;
	}
};

/**
 * Trashes/untrashes all the given mails. updates the mail list view accordingly.
 * @param {Array.<Array<String>>} mailIds The mails to delete finally.
 */
tutao.tutanota.ctrl.MailListViewModel.prototype.finallyDeleteMails = function(mailIds) {
    var self = this;
    var service = new tutao.entity.tutanota.DeleteMailData();
    tutao.util.ArrayUtils.addAll(service.getMails(), mailIds);
    return service.erase({}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(deleteMailReturn) {
        for (var i=0; i<mailIds.length; i++) {
            tutao.util.ArrayUtils.remove(self.currentTagFilterResult[tutao.tutanota.ctrl.TagListViewModel.TRASHED_TAG_ID], mailIds[i][1]);
        }
        self.unselectAll();
        return self._updateMailList();
    });
};


/**
 * Executes the delete trash functionality.
 */
tutao.tutanota.ctrl.MailListViewModel.prototype._deleteTrash = function() {
    if (this.loading() || this.deleting()) {
        return Promise.resolve();
    }

    var self = this;
    if (tutao.tutanota.gui.confirm(tutao.lang('confirmDeleteTrash_msg'))) {
        this.deleting(true);
        // we want to delete all mails in the trash, not only the visible ones, so load them now. load reverse to avoid caching errors
        return tutao.rest.EntityRestInterface.loadAllReverse(tutao.entity.tutanota.Mail, tutao.locator.mailBoxController.getUserMailBox().getMails()).then(function(allMails) {
            var mailsToDelete = [];
            for (var i = 0; i < allMails.length; i++) {
                if (allMails[i].getTrashed()) {
                    mailsToDelete.push(allMails[i].getId());
                }
            }
            return self.finallyDeleteMails(mailsToDelete);
        }).lastly(function() {
            self.deleting(false);
        });
    } else {
        return Promise.resolve();
    }
};


/**
 * Trashes/untrashes all the given mails. updates the mail list view accordingly.
 * @param {Array.<tutao.entity.tutanota.Mail>} mails The mails to delete or undelete.
 * @param {boolean} trash If true, the mail is trashed, otherwise it is untrashed.
 * @return {window.Promise.<>} Resolved when finished.
 */
tutao.tutanota.ctrl.MailListViewModel.prototype.trashMail = function(mails, trash) {
	return this._trashNextMail(mails, 0, trash, false);
};

/**
 * @protected
 * Trashes/untrashes all mails passed as first argument.
 * @param {Array.<tutao.entity.tutanota.Mail>} mails The mails to trash.
 * @param {number} index The index of the first mail to trash.
 * @param {boolean} trash If true, the mail is trashed, otherwise it is untrashed.
 * @param {boolean} attributeChanged Indicates if a trash attribute of any mail was changed so far.
 * When all selected mails are finished, if any was trashed/untrashed, this value is true.
 * @return {window.Promise.<>} Resolved when finished.
 */
tutao.tutanota.ctrl.MailListViewModel.prototype._trashNextMail = function(mails, index, trash, attributeChanged) {
	var self = this;
	var mail = mails[index];
	if (mail.getTrashed() != trash) {
		mail.setTrashed(trash);
		mail.update();
        return new window.Promise(function(resolve, reject) {
            try  {
                // make the icon in the gui visible/invisible if the mail stays in the list. currently it doesn't
                // update the filter results
                for (var tagId = 0; tagId < self.currentTagFilterResult.length; tagId++) {
                    if ((tagId == tutao.tutanota.ctrl.TagListViewModel.TRASHED_TAG_ID) == trash) {
                        // we need to add the mail id if it is the correct state value and if the mail is in the loaded range or all mails have been loaded
                        var lowestId = self._getLowestMailId(tagId);
                        if (mail[self.tagToMailAttributeMapping[tagId]] == self.tagToMailAttributeValueMapping[tagId] &&
                            (tutao.rest.EntityRestInterface.firstBiggerThanSecond(mail.getId()[1], lowestId) || !self._tagMoreAvailable[tagId]())) {
                            self._insertTagFilterResult(tagId, mail.getId()[1]);
                        }
                    } else {
                        // we need to remove the mail id
                        tutao.util.ArrayUtils.remove(self.currentTagFilterResult[tagId], mail.getId()[1]);
                    }
                }

                if (index == mails.length - 1) {
                    // when the mails are removed from the list select the first mail if multiple mails have been trashed and
                    // select the next mail if one mail has been trashed
                    var nextSelectedIndex = 0;
                    if (mails.length == 1) {
                        nextSelectedIndex = self.mails.indexOf(mails[index]);
                    }
                    self.unselectAll();
                    resolve(self._updateMailList().then(function() {
                        self.showIndex(nextSelectedIndex);
                    }));
                } else {
                    resolve(self._trashNextMail(mails, ++index, trash, true));
                }
            } catch (exception) {
                reject(exception);
            }
        });

	} else {
		if (index == mails.length - 1) {
			// when the mails are removed from the list select the first mail if multiple mails have been trashed and
			// select the next mail if one mail has been trashed
			var nextSelectedIndex = 0;
			if (mails.length == 1) {
				nextSelectedIndex = self.mails.indexOf(mails[index]);
			}
			self.unselectAll();
			return self._updateMailList().then(function() {
				self.showIndex(nextSelectedIndex);
			});
		} else {
			return self._trashNextMail(mails, ++index, trash, attributeChanged);
		}
	}
};

tutao.tutanota.ctrl.MailListViewModel.prototype._getLowestMailId = function(tagId) {
    var lowestId = tutao.rest.EntityRestInterface.GENERATED_MAX_ID;
    if (this.currentTagFilterResult[tagId].length > 0) {
        lowestId = this.currentTagFilterResult[tagId][this.currentTagFilterResult[tagId].length -1];
    }
    return lowestId;
};


/**
 * Requests for validity from the search field.
 * @param {string} text The text to validate.
 * @return {Object<text, colorId>} The validated text and color id.
 */
tutao.tutanota.ctrl.MailListViewModel.prototype.validateBubbleText = function(text) {
	return {text: text, colorId: 0};
};

tutao.tutanota.ctrl.MailListViewModel.prototype.showSearchBar = function() {
    this.searchBarVisible(true);
};

tutao.tutanota.ctrl.MailListViewModel.prototype.hideSearchBar = function() {
    this.searchBarVisible(false);
};




/************** implementation of tutao.tutanota.ctrl.bubbleinput.BubbleHandler **************/

/** @inheritDoc */
tutao.tutanota.ctrl.MailListViewModel.prototype.getSuggestions = function(text) {
	return [];
};

/** @inheritDoc */
tutao.tutanota.ctrl.MailListViewModel.prototype.createBubbleFromSuggestion = function(suggestion) {
	return null;
};

/** @inheritDoc */
tutao.tutanota.ctrl.MailListViewModel.prototype.createBubblesFromText = function(text) {
	return [new tutao.tutanota.ctrl.bubbleinput.Bubble(null, ko.observable(text), ko.observable(null), ko.observable('default'), false)];
};

/** @inheritDoc */
tutao.tutanota.ctrl.MailListViewModel.prototype.bubbleDeleted = function(bubble) {
	// nothing to do
};

/** @inheritDoc */
tutao.tutanota.ctrl.MailListViewModel.prototype.buttonClick = function() {
    if ( this.buttonCss() == 'search'){
        this.hideSearchBar();
    }else {
        this.bubbleInputViewModel.bubbles.removeAll();
        this.bubbleInputViewModel.inputValue("");
        //this.search();
    }
};

tutao.tutanota.ctrl.MailListViewModel.prototype.buttonCss = function() {
    if (this.bubbleInputViewModel.inputValue().trim() || this.bubbleInputViewModel.bubbles().length > 0) {
        return 'cancel';
    } else {
        return 'search';
    }
};


