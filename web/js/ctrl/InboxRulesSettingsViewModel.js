"use strict";

tutao.provide('tutao.tutanota.ctrl.InboxRulesSettingsViewModel');

/**
 * View model to configure inbox rules for incoming emails..
 * @constructor
 */
tutao.tutanota.ctrl.InboxRulesSettingsViewModel = function() {

    tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

    this.state = new tutao.tutanota.util.SubmitStateMachine(true);
    this.state.setInputInvalidMessageListener(this._getInputInvalidMessage);

    this.availableInboxRules = ko.observableArray();
    this.availableInboxRules.push(tutao.entity.tutanota.TutanotaConstants.INBOX_RULE_SENDER_EQUALS);
    this.availableInboxRules.push(tutao.entity.tutanota.TutanotaConstants.INBOX_RULE_RECIPIENT_TO_EQUALS);
    this.availableInboxRules.push(tutao.entity.tutanota.TutanotaConstants.INBOX_RULE_RECIPIENT_CC_EQUALS);
    this.availableInboxRules.push(tutao.entity.tutanota.TutanotaConstants.INBOX_RULE_RECIPIENT_BCC_EQUALS);
    this.availableInboxRules.push(tutao.entity.tutanota.TutanotaConstants.INBOX_RULE_SUBJECT_CONTAINS);

    this.availableTargetFolders = ko.observableArray();

    this.selectedFolder = ko.observable(null);
    this.type = ko.observable(tutao.entity.tutanota.TutanotaConstants.INBOX_RULE_SENDER_EQUALS);
    this.value = ko.observable("");

    this.userProperties = null;
};

tutao.tutanota.ctrl.InboxRulesSettingsViewModel.prototype.init = function() {
    this.userProperties = new tutao.entity.tutanota.TutanotaPropertiesEditable(tutao.locator.mailBoxController.getUserProperties());
    this.availableTargetFolders([]);
    this._createTargetFolders(tutao.locator.mailFolderListViewModel.getMailFolders());
    this._resetNewRule();
    this.state.entering(true);
};

tutao.tutanota.ctrl.InboxRulesSettingsViewModel.prototype._resetNewRule = function() {
    this.type(tutao.entity.tutanota.TutanotaConstants.INBOX_RULE_SENDER_EQUALS);
    this.value("");
    this.selectedFolder(tutao.locator.mailFolderListViewModel.getSystemFolder(tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_ARCHIVE));
};

tutao.tutanota.ctrl.InboxRulesSettingsViewModel.prototype._getCleanedValue = function() {
    if (this.type() == tutao.entity.tutanota.TutanotaConstants.INBOX_RULE_SUBJECT_CONTAINS) {
        return this.value();
    } else {
        return this.value().trim().toLowerCase();
    }
};

tutao.tutanota.ctrl.InboxRulesSettingsViewModel.prototype._getInputInvalidMessage = function() {
    var currentCleanedValue = this._getCleanedValue();

    if (currentCleanedValue == "" ) {
        return "emptyString_msg";
    }
    if (this._isEmailRuleSelected() && !tutao.tutanota.util.Formatter.isDomainName(currentCleanedValue) && !tutao.tutanota.util.Formatter.isMailAddress(currentCleanedValue, false)){
        return "inboxRuleInvalidEmailAddress_msg";
    }
    if (this.isRuleExistingForType(currentCleanedValue, this.type())){
        return "inboxRuleAlreadyExists_msg";
    }

    return null;
};

tutao.tutanota.ctrl.InboxRulesSettingsViewModel.prototype._isEmailRuleSelected = function() {
    return this.type() != tutao.entity.tutanota.TutanotaConstants.INBOX_RULE_SUBJECT_CONTAINS;
};

tutao.tutanota.ctrl.InboxRulesSettingsViewModel.prototype.isRuleExistingForType = function(cleanValue, type) {
    var inboxRules = tutao.locator.mailBoxController.getUserProperties().getInboxRules();
    for(var i=0; i < inboxRules.length; i++){
        if (type == inboxRules[i].getType() && cleanValue == inboxRules[i].getValue()) {
            return true;
        }
    }
    return false;
};

tutao.tutanota.ctrl.InboxRulesSettingsViewModel.prototype.addInboxRule = function() {
    var self = this;

    if (tutao.locator.viewManager.isFreeAccount()) {
        tutao.locator.viewManager.showNotAvailableForFreeDialog();
        return;
    }

    if (!this.state.submitEnabled()) {
        return;
    }

    var newInboxRule = new tutao.entity.tutanota.InboxRule(this.userProperties.getTutanotaProperties())
        .setValue(this._getCleanedValue())
        .setType(this.type())
        .setTargetFolder(this.selectedFolder().getMailFolderId());
    this.userProperties.inboxRules.push(new tutao.entity.tutanota.InboxRuleEditable(newInboxRule));
    this._updateTutanotaProperties().then(function(){
        self._resetNewRule();
    });
};

tutao.tutanota.ctrl.InboxRulesSettingsViewModel.prototype.removeInboxRule = function(inboxRuleListEntry) {
    this.userProperties.inboxRules.remove(inboxRuleListEntry);
    this._updateTutanotaProperties();
};


tutao.tutanota.ctrl.InboxRulesSettingsViewModel.prototype._updateTutanotaProperties = function() {
    var self = this;
    this.userProperties.update();
    self.state.submitting(true);
    return this.userProperties.getTutanotaProperties().update().lastly(function(){
        self.state.entering(true)
    });
};

tutao.tutanota.ctrl.InboxRulesSettingsViewModel.prototype.getTextForType = function(inboxRuleType) {
    if (inboxRuleType == tutao.entity.tutanota.TutanotaConstants.INBOX_RULE_SENDER_EQUALS ) {
        return tutao.lang("inboxRuleSenderEquals_action");
    } else if (inboxRuleType == tutao.entity.tutanota.TutanotaConstants.INBOX_RULE_RECIPIENT_TO_EQUALS ) {
        return tutao.lang("inboxRuleToRecipientEquals_action")
    } else if (inboxRuleType == tutao.entity.tutanota.TutanotaConstants.INBOX_RULE_RECIPIENT_CC_EQUALS ) {
        return tutao.lang("inboxRuleCCRecipientEquals_action")
    } else if (inboxRuleType == tutao.entity.tutanota.TutanotaConstants.INBOX_RULE_RECIPIENT_BCC_EQUALS ) {
        return tutao.lang("inboxRuleBCCRecipientEquals_action")
    } else if (inboxRuleType == tutao.entity.tutanota.TutanotaConstants.INBOX_RULE_SUBJECT_CONTAINS ) {
        return tutao.lang("inboxRuleSubjectContains_action")
    } else {
        return "";
    }
};

tutao.tutanota.ctrl.InboxRulesSettingsViewModel.prototype.getTextForTarget = function(targetFolderId) {
    for( var i=0; i< this.availableTargetFolders().length; i++){
        if (tutao.rest.EntityRestInterface.sameListElementIds(this.availableTargetFolders()[i].getMailFolderId(), targetFolderId)) {
            return this.availableTargetFolders()[i].getName();
        }
    }
    return "?";
};

tutao.tutanota.ctrl.InboxRulesSettingsViewModel.prototype.getTargetName = function(mailFolder) {
    if (mailFolder) {
        return mailFolder.getName();
    } else {
        return ""; // only temporary, should not be visible
    }
};

/**
 * Creates a list of target folders for the inbox rules from the given folders, including subfolders.
 * @param {Array.<tutao.tutanota.ctrl.MailFolderViewModel>} folders The folders to add.
 */
tutao.tutanota.ctrl.InboxRulesSettingsViewModel.prototype._createTargetFolders = function(folders) {
    for (var i=0; i<folders.length; i++) {
        // skip the inbox folder, but allow sub-folders
        if (folders[i].getFolderType() != tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_INBOX) {
            var folder = folders[i];
            this.availableTargetFolders.push(folder);
        }
        this._createTargetFolders(folders[i].subFolders());
    }
};

tutao.tutanota.ctrl.InboxRulesSettingsViewModel.prototype.getPlaceholder = function() {
    if (this.type() == tutao.entity.tutanota.TutanotaConstants.INBOX_RULE_SUBJECT_CONTAINS) {
        return tutao.lang('inboxRuleContainsPlaceholder_label');
    } else {
        return tutao.lang('emailSenderPlaceholder_label');
    }
};
