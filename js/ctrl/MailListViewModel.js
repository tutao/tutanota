//"use strict";

goog.provide('tutao.tutanota.ctrl.MailListViewModel');

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

	this._currentActiveSystemTag = tutao.tutanota.ctrl.TagListViewModel.RECEIVED_TAG_ID;
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

	this.mails = ko.observableArray();

	this.log = ko.observable("");

	this.buttons = ko.observableArray();

	// the mail id (Array.<string>) of the email that shall be shown when init() is called
	this.mailToShow = null;
};

/**
 * Initialize the MailListViewModel:
 * <ul>
 *   <li>Load the Mails to display from the server
 *   <li>register as an observer to the mail list
 * </ul>
 * @param {function()|undefined} callback Is called as soon as the initialization is finished.
 */
tutao.tutanota.ctrl.MailListViewModel.prototype.init = function(callback) {
	var self = this;

//	currently not needed any more because deletion is done in mail view
//	tutao.tutanota.gui.registerMailLongPress(function(domElement, posX, posY) {
//		// only show the delete menu if the element is selected
//		for (var i = 0; i < self._selectedDomElements.length; i++) {
//			if (domElement == self._selectedDomElements[i]) {
//				var trash = !self._selectedMails[i].getTrashed();
//				tutao.tutanota.gui.ContextMenu.getInstance().showMenu(domElement, posX, posY, [trash ? "delete" : "undelete"], function() {
//					self.trashSelectedMails(trash);
//				});
//				break;
//			}
//		}
//	});
// loading the whole list to avoid single loads by indexer
	tutao.entity.tutanota.Mail.loadRange(tutao.locator.mailBoxController.getUserMailBox().getMails(), tutao.rest.EntityRestInterface.GENERATED_MIN_ID, tutao.rest.EntityRestInterface.MAX_RANGE_COUNT, false, function(mails, exception) {
		// execute the tag filters, then update the mail list, then register the event tracker for mails
		// it is important to update the filter results in the tag id order because the mails may only appear in the first list that fits
		self._updateTagFilterResult(tutao.tutanota.ctrl.TagListViewModel.TRASHED_TAG_ID, function() {
			self._updateTagFilterResult(tutao.tutanota.ctrl.TagListViewModel.RECEIVED_TAG_ID, function() {
				self._updateTagFilterResult(tutao.tutanota.ctrl.TagListViewModel.SENT_TAG_ID, function() {
					self._updateMailList(function() {
						if (tutao.locator.userController.isExternalUserLoggedIn()) {
							// no notifications for external users. instead add all loaded mails
							self.updateOnNewMails(mails, function() {
								if (self.mailToShow) {
									tutao.entity.tutanota.Mail.load(self.mailToShow, function(mail, exception) {
										if (!exception) {
											self.selectMail(mail);
										}
										if (callback) {
											callback();
										}
									});
								} else {
                                    if (self.mails().length > 0) {
                                        self.selectMail(self.mails()[0]);
                                    }
									if (callback) {
										callback();
									}
								}
							});
						} else {
							// get the highest indexed mail id for the event tracker
							tutao.locator.indexer.getLastIndexedId(tutao.entity.tutanota.Mail.prototype.TYPE_ID, function(lastIndexedId) {
								var eventTracker = new tutao.event.PushListEventTracker(tutao.entity.tutanota.Mail, tutao.locator.mailBoxController.getUserMailBox().getMails(), "Mail", tutao.entity.Constants.Version);
								eventTracker.addObserver(self.updateOnNewMails);
								eventTracker.observeList(lastIndexedId);
								if (callback) {
									callback();
								}
							});
						}
					});
				});
			});
		});
	});
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
 * @param {function} callback Called when finished.
 */
tutao.tutanota.ctrl.MailListViewModel.prototype.systemTagActivated = function(tagId, callback) {
	this.unselectAll();
	this._currentActiveSystemTag = tagId;
	this._updateMailList(callback);
	tutao.locator.mailView.showDefaultColumns();
};

/**
 * @protected
 * Updates the id list for the given tag.
 * Precondition: All tag filter results with a lower tag id are updated.
 * @param {number} tagId Id of the tag.
 * @param {function()|undefined} callback Called when finished.
 */
tutao.tutanota.ctrl.MailListViewModel.prototype._updateTagFilterResult = function(tagId, callback) {
	var self = this;
	var attributeId = this.tagToMailAttributeIdMapping[tagId];
	var attributeValue = this.tagToMailAttributeValueMapping[tagId];

	var indexedValue = attributeValue;
	if (indexedValue === true) {
		indexedValue = "1";
	} else if (indexedValue === false) {
		indexedValue = "0";
	} else {
		indexedValue = indexedValue + "";
	}

	tutao.locator.indexer.getElementsByValues(tutao.entity.tutanota.Mail.prototype.TYPE_ID, [attributeId], [indexedValue], function(result) {
		// only add the mail ids if they do not appear in the tag lists with lower tag ids
		self.currentTagFilterResult[tagId] = [];
		for (var a = 0; a < result.length; a++) {
			var mailId = result[a];
			var addMail = true;
			for (var i = 0; i < tagId; i++) {
				if (tutao.util.ArrayUtils.contains(self.currentTagFilterResult[i], mailId)) {
					addMail = false;
					break;
				}
			}
			if (addMail) {
				self.currentTagFilterResult[tagId].push(mailId);
			}
		}
		if (callback) {
			callback();
		}
	});
};

/**
 * Updates the mail list according to the current search and tag filter results.
 * @param {function} callback Called when finished.
 */
tutao.tutanota.ctrl.MailListViewModel.prototype._updateMailList = function(callback) {
	var self = this;

	// collect all id arrays that need to be combined to get the list of mails to show
	var idsToCombine = undefined;
	if (this.currentSearchResult == null) {
		idsToCombine = [this.currentTagFilterResult[this._currentActiveSystemTag]];
	} else {
		idsToCombine = [this.currentTagFilterResult[this._currentActiveSystemTag], this.currentSearchResult];
	}

	this.addLog("start download");

	var currentResult = tutao.util.ArrayUtils.getUniqueAndArray(idsToCombine);
	// sort the array by mail id descending
	currentResult.sort(function(a, b) {
		return (tutao.rest.EntityRestInterface.firstBiggerThanSecond(a, b)) ? -1 : 1;
	});
	var loadedMails = [];

	self._loadMails(currentResult, loadedMails, 0, function() {
		self.mails(loadedMails);
		self.selectPreviouslySelectedMail();
		tutao.locator.mailView.mailListUpdated();
		self.addLog("finished downloading " + self.mails().length + " mail headers");
		callback();
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
 * @param {function(Array.<tutao.entity.tutanota.Mail>)} callback Called when finished. Parameter: the loadedMails.
 */
tutao.tutanota.ctrl.MailListViewModel.prototype._loadMails = function(mailIds, loadedMails, nextMail, callback) {
	if (mailIds.length == 0) {
		callback();
		return;
	}
	var self = this;
	tutao.entity.tutanota.Mail.load([tutao.locator.mailBoxController.getUserMailBox().getMails(), mailIds[nextMail]], function(mail, exception) {
		if (!exception) {
			loadedMails.push(mail);
		}
		if (nextMail == mailIds.length - 1) {
			callback();
		} else {
			self._loadMails(mailIds, loadedMails, nextMail + 1, callback);
		}
	});
};

/**
 * Adds the given mails to the index if they are not yet indexed.
 * @param {Array.<Array.<string>>} mailIds The ids of the mails that shall be indexed. The order must be ascending.
 * @param {Array.<string>} mailBodyIds The ids of the mail bodys belonging to the mails in the same order as the mails.
 * @param {function()|undefined} callback Is called when indexing is finished.
 */
tutao.tutanota.ctrl.MailListViewModel.prototype._addToIndex = function(mailIds, mailBodyIds, callback) {
	this.addLog("start indexing");
	var self = this;
	tutao.locator.indexer.tryIndexElements(tutao.entity.tutanota.Mail.prototype.TYPE_ID, mailIds, function(firstIndexedMailId) {
		if (firstIndexedMailId) {
			// the mails starting with the id firstIndexedId have been indexed, so index the corresponding bodies now
			var bodyIds = [];
			for (var a = 0; a < mailIds.length; a++) {
				if (mailIds[a][1] === firstIndexedMailId[1]) {
					bodyIds = mailBodyIds.slice(a);
					break;
				}
			}
			tutao.locator.indexer.tryIndexElements(tutao.entity.tutanota.MailBody.prototype.TYPE_ID, bodyIds, function() {
				self.addLog("finished indexing");
				if (callback) {
					callback();
				}
			});
		} else {
			self.addLog("finished indexing");
			if (callback) {
				callback();
			}
		}
	});
};

/**
 * This method gets invoked if new mails have been received from the server.
 * @param {Array.<Mail>} mails The mails that are new.
 * @param {function()?} callback Is called when finished.
 */
tutao.tutanota.ctrl.MailListViewModel.prototype.updateOnNewMails = function(mails, callback) {
	// collect the mail and body ids for indexing and update the tag filter results
	var mailIds = [];
	var mailBodyIds = [];
	for (var i = 0; i < mails.length; i++) {
		mailIds.push(mails[i].getId());
		mailBodyIds.push(mails[i].getBody());
		for (var tagId = 0; tagId < this.currentTagFilterResult.length; tagId++) {
			// get the mail tag value and put the mail id into the corresponding result list if it fits
			var mailAttribute = this.tagToMailAttributeMapping[tagId];
			var mailTagValue = mails[i][mailAttribute];
			if (this.tagToMailAttributeValueMapping[tagId] == mailTagValue) {
				this.currentTagFilterResult[tagId].unshift(mails[i].getId()[1]);
				if (this._currentActiveSystemTag == tagId) {
					// TODO (story search mails): only add the mail if it passes the search query
					this.mails.unshift(mails[i]);
				}
				// the mail must only go into the first tag list that fits, so break now (the tag ids are sorted by priority)
				break;
			}
		}
	}
	tutao.locator.mailView.mailListUpdated();
	this._addToIndex(mailIds, mailBodyIds, callback);
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
 * @param {Event} The click event.
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
		mail.update(function() {});
		tutao.locator.indexer.removeIndexEntries(tutao.entity.tutanota.Mail.prototype.TYPE_ID,
				[[tutao.entity.tutanota.Mail.prototype.UNREAD_ATTRIBUTE_ID]], mail.getId()[1], function() {
			tutao.locator.indexer.addIndexEntries(tutao.entity.tutanota.Mail.prototype.TYPE_ID,
					[tutao.entity.tutanota.Mail.prototype.UNREAD_ATTRIBUTE_ID], mail.getId()[1], (mail.getUnread()) ? ["1"] : ["0"]);
		});
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
		this._lastSelectedMail[this._currentActiveSystemTag] = this._selectedMails[0];
	}
	tutao.tutanota.gui.unselect(this._selectedDomElements);
	this._selectedDomElements = [];
	this._selectedMails = [];
	// TODO (before beta) remove the next lines if it is fine not to hide the conversation if the mail list changes, also delete MailViewModel.hideConversation
//	if (!tutao.locator.mailViewModel.isComposingState()) {
//		tutao.locator.mailViewModel.hideConversation();
//	}
};

/**
 * Provides the last selected mail or null if none was selected.
 */
tutao.tutanota.ctrl.MailListViewModel.prototype.getLastSelectedMail = function() {
	if (this._lastSelectedMail[this._currentActiveSystemTag] && this.mails.indexOf(this._lastSelectedMail[this._currentActiveSystemTag]) != -1) {
		return this._lastSelectedMail[this._currentActiveSystemTag];
	} else {
		return null;
	}
};

// not used currently because trashing mails is initiated in the mail view
///**
// * Deletes all mails that are selected.
// * @param {boolean} trash If true, the mail is trashed, otherwise it is untrashed.
// * @param {function()} callback Called when operation is finished.
// */
//tutao.tutanota.ctrl.MailListViewModel.prototype.trashSelectedMails = function(trash, callback) {
//	if (this._selectedMails.length > 0) {
//		this._trashNextMail(this._selectedMails, 0, trash, false, callback);
//	} else if (callback) {
//		callback();
//	}
//};

/**
 * Trashes/untrashes all the given mails. updates the mail list view accordingly.
 * @param {boolean} trash If true, the mail is trashed, otherwise it is untrashed.
 * @param {function()} callback Called when operation is finished.
 */
tutao.tutanota.ctrl.MailListViewModel.prototype.trashMail = function(mails, trash, callback) {
	this._trashNextMail(mails, 0, trash, false, callback);
};

/**
 * @protected
 * Trashes/untrashes all mails passed as first argument.
 * @param {Array.<tutao.entity.tutanota.Mail>} mails The mails to trash.
 * @param {number} index The index of the first mail to trash.
 * @param {boolean} trash If true, the mail is trashed, otherwise it is untrashed.
 * @param {boolean} attributeChanged Indicates if a trash attribute of any mail was changed so far.
 * When all selected mails are finished, if any was trashed/untrashed, this value is true.
 * @param {function()} callback Called when operation is finished.
 */
tutao.tutanota.ctrl.MailListViewModel.prototype._trashNextMail = function(mails, index, trash, attributeChanged, callback) {
	var self = this;
	var mail = mails[index];
	if (mail.getTrashed() != trash) {
		mail.setTrashed(trash);
		mail.update(function() {});
		tutao.locator.indexer.removeIndexEntries(tutao.entity.tutanota.Mail.prototype.TYPE_ID,
				[[tutao.entity.tutanota.Mail.prototype.TRASHED_ATTRIBUTE_ID]], mail.getId()[1], function() {
			tutao.locator.indexer.addIndexEntries(tutao.entity.tutanota.Mail.prototype.TYPE_ID,
					[tutao.entity.tutanota.Mail.prototype.TRASHED_ATTRIBUTE_ID], mail.getId()[1], (mail.getTrashed()) ? ["1"] : ["0"], function() {
				// make the icon in the gui visible/invisible if the mail stays in the list. currently it doesn't

				// update the filter results
				for (var tagId = 0; tagId < self.currentTagFilterResult.length; tagId++) {
					if ((tagId == tutao.tutanota.ctrl.TagListViewModel.TRASHED_TAG_ID) == trash) {
						// we need to add the mail id if it is the correct state value
						if (mail[self.tagToMailAttributeMapping[tagId]] == self.tagToMailAttributeValueMapping[tagId]) {
							self.currentTagFilterResult[tagId].push(mail.getId()[1]);
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
					self._updateMailList(function() {
						self.showIndex(nextSelectedIndex);
						if (callback) {
							callback();
						}
					});
				} else {
					self._trashNextMail(mails, ++index, trash, true, callback);
				}
			});
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
			self._updateMailList(function() {
				self.showIndex(nextSelectedIndex);
				if (callback) {
					callback();
				}
			});
		} else {
			self._trashNextMail(mails, ++index, trash, attributeChanged, callback);
		}
	}
};

/**
 * Provides a list with the ids of all emails that all contain the provides search words (combined with AND logic).
 * @param {Array.<string>} searchWords The words to search for.
 * @param {number} index The index of the next word to seach for in searchWords.
 * @param {?Array.<string>} resultList The list with the current result ids. When received the list of ids for the next search word, that list is ANDed
 * with resultList.
 * @param {function(Array.<string>)} callback Is called when the search is finished and passes an array of the ids of all mails containing all search words.
 * @protected
 */
tutao.tutanota.ctrl.MailListViewModel.prototype._getIdsForSearchWords = function(searchWords, index, resultList, callback) {
	var self = this;
	// get the matching ids of subject
	tutao.locator.indexer.getElementsByValues(tutao.entity.tutanota.Mail.prototype.TYPE_ID,
			[tutao.entity.tutanota.Mail.prototype.SUBJECT_ATTRIBUTE_ID], [searchWords[index]], function(subjectMatchingIds) {
		// get the matching ids of the sender
		tutao.locator.indexer.getElementsByValues(tutao.entity.tutanota.Mail.prototype.TYPE_ID,
				[tutao.entity.tutanota.Mail.prototype.SENDER_ATTRIBUTE_ID], [searchWords[index]], function(senderMatchingIds) {
			// get the matching ids of the recipients
			tutao.locator.indexer.getElementsByValues(tutao.entity.tutanota.Mail.prototype.TYPE_ID,
					// all recipients index is stored in toRecipients for now
					[tutao.entity.tutanota.Mail.prototype.TORECIPIENTS_ATTRIBUTE_ID], [searchWords[index]], function(recipientsMatchingIds) {
				// get the matching body ids for the body text
				tutao.locator.indexer.getElementsByValues(tutao.entity.tutanota.MailBody.prototype.TYPE_ID,
						[tutao.entity.tutanota.MailBody.prototype.TEXT_ATTRIBUTE_ID], [searchWords[index]], function(textMatchingBodyIds) {
					// get the mail ids that belong to the body ids
					tutao.locator.indexer.getElementsByValues(tutao.entity.tutanota.Mail.prototype.TYPE_ID,
							[tutao.entity.tutanota.Mail.prototype.BODY_ATTRIBUTE_ID], textMatchingBodyIds, function(bodyMatchingIds) {
						var orMergedIds = tutao.util.ArrayUtils.getUniqueOrArray([subjectMatchingIds, senderMatchingIds,
						                                                              recipientsMatchingIds, bodyMatchingIds]);
						// if this is the first search word, the current result list is still null, so we use orMergedIds as first resultList
						var andMergedIds = undefined;
						if (resultList == null) {
							andMergedIds = orMergedIds;
						} else {
							andMergedIds = tutao.util.ArrayUtils.getUniqueAndArray([orMergedIds, resultList]);
						}
						if (index == searchWords.length - 1) {
							callback(andMergedIds);
						} else {
							self._getIdsForSearchWords(searchWords, ++index, andMergedIds, callback);
						}
					});
				});
			});
		});
	});
};

/**
 * Performs a search according to the current search words and updates the mail list accordingly.
 * @param {function()|Object|undefined} callback Is called when finished. Maybe a the dom object that triggered the search. Attention, please!
 */
tutao.tutanota.ctrl.MailListViewModel.prototype.search = function(callback) {
	if (this.bubbleInputViewModel.bubbles().length === 0) {
		this.currentSearchResult = null;
		this.unselectAll();
		this._updateMailList(function() {
			if (callback && callback instanceof Function) {
				callback();
			}
		});
	} else {
		this.addLog("start search");
		var self = this;
		var bubbles = this.bubbleInputViewModel.bubbles();
		var searchString = "";
		for (var i = 0; i < bubbles.length; i++) {
			searchString += bubbles[i].text() + " ";
		}
		var searchWords = tutao.locator.indexer.getSearchIndexWordsFromText(searchString);
		this.addLog(searchWords);
		// search for each word separately, then combine the results with AND
		self._getIdsForSearchWords(searchWords, 0, null, function(ids) {
			self.currentSearchResult = ids;
			self.addLog("finished search: " + ids.length);
			self.unselectAll();
			self._updateMailList(function() {
				if (callback && callback instanceof Function) {
					callback();
				}
			});
		});
	}
};

/**
 * Adds a line of text to the log output.
 * @param {string} logLine The text to add to the log.
 */
tutao.tutanota.ctrl.MailListViewModel.prototype.addLog = function(logLine) {
// currently disabled
//	var date = new Date();
//	var pad = tutao.util.StringUtils.pad;
//	logLine = pad(date.getMinutes(), 2) + ":" + pad(date.getSeconds(), 2) + " " + logLine;
//	var MAX_NBR_OF_LINES = 4;
//	if (this.log() == "") {
//		this.log(logLine);
//	} else {
//		var lines = this.log().split("\n");
//		if (lines.length == MAX_NBR_OF_LINES) {
//			lines.shift();
//			this.log(lines.join("\n") + "\n" + logLine);
//		} else {
//			this.log(this.log() + "\n" + logLine);
//		}
//	}
};

/**
 * Requests for validity from the search field.
 * @param {string} text The text to validate.
 * @return {Object<text, colorId>} The validated text and color id.
 */
tutao.tutanota.ctrl.MailListViewModel.prototype.validateBubbleText = function(text) {
	return {text: text, colorId: 0};
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
tutao.tutanota.ctrl.MailListViewModel.prototype.createBubbleFromText = function(text) {
	return new tutao.tutanota.ctrl.bubbleinput.Bubble(null, ko.observable(text), ko.observable(null), ko.observable('default'));
};

/** @inheritDoc */
tutao.tutanota.ctrl.MailListViewModel.prototype.bubbleDeleted = function(bubble) {
	// nothing to do
};

/** @inheritDoc */
tutao.tutanota.ctrl.MailListViewModel.prototype.buttonClick = function() {
	this.bubbleInputViewModel.bubbles.removeAll();
	this.bubbleInputViewModel.inputValue("");
	this.search();
};
