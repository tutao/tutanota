"use strict";

tutao.provide('tutao.tutanota.ctrl.TagListViewModel');

/**
 * The view model for the tag list.
 * @constructor
 */
tutao.tutanota.ctrl.TagListViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this.activeSystemTag = ko.observable(tutao.tutanota.ctrl.TagListViewModel.RECEIVED_TAG_ID);
};

// the tags are ordered by priority, e.g. a received mail that is trashed does not appear when selecting the received tag
/**
 * Represents the system tag for trashed mails.
 */
tutao.tutanota.ctrl.TagListViewModel.TRASHED_TAG_ID = 0;

/**
 * Represents the system tag for received mails.
 */
tutao.tutanota.ctrl.TagListViewModel.RECEIVED_TAG_ID = 1;

/**
 * Represents the system tag for sent mails.
 */
tutao.tutanota.ctrl.TagListViewModel.SENT_TAG_ID = 2;

/**
 * Provides the id of the currently active system tag.
 * @return {number} one of TRASHED_TAG_ID, RECEIVED_TAG_ID, SENT_TAG_ID.
 */
tutao.tutanota.ctrl.TagListViewModel.prototype.getActiveSystemTag = function() {
	return this.activeSystemTag;
};

/**
 * Activates the received system tag. All mails fitting to this tag are shown.
 */
tutao.tutanota.ctrl.TagListViewModel.prototype.activateReceivedTag = function() {
    if (!tutao.locator.mailViewModel.tryCancelAllComposingMails()) {
        return;
    }
	this.activeSystemTag(tutao.tutanota.ctrl.TagListViewModel.RECEIVED_TAG_ID);
	tutao.locator.mailListViewModel.systemTagActivated(this.activeSystemTag());
};

/**
 * Activates the sent system tag. All mails fitting to this tag are shown.
 */
tutao.tutanota.ctrl.TagListViewModel.prototype.activateSentTag = function() {
    if (!tutao.locator.mailViewModel.tryCancelAllComposingMails()) {
        return;
    }
	this.activeSystemTag(tutao.tutanota.ctrl.TagListViewModel.SENT_TAG_ID);
	tutao.locator.mailListViewModel.systemTagActivated(this.activeSystemTag());
};

/**
 * Activates the trashed system tag. All mails fitting to this tag are shown.
 */
tutao.tutanota.ctrl.TagListViewModel.prototype.activateTrashedTag = function() {
    if (!tutao.locator.mailViewModel.tryCancelAllComposingMails()) {
        return;
    }
	this.activeSystemTag(tutao.tutanota.ctrl.TagListViewModel.TRASHED_TAG_ID);
	tutao.locator.mailListViewModel.systemTagActivated(this.activeSystemTag());
};

tutao.tutanota.ctrl.TagListViewModel.prototype.getTagTextId = function(tagId) {
    if ( tagId == tutao.tutanota.ctrl.TagListViewModel.SENT_TAG_ID){
        return  "sent_action";
    }
    if ( tagId == tutao.tutanota.ctrl.TagListViewModel.TRASHED_TAG_ID){
        return  "trash_action";
    }
    if ( tagId == tutao.tutanota.ctrl.TagListViewModel.RECEIVED_TAG_ID){
        return  "received_action";
    }
    throw new Error("No text id for tag");
};

tutao.tutanota.ctrl.TagListViewModel.prototype.getActiveTagTextId = function() {
    return this.getTagTextId(this.activeSystemTag());
};


