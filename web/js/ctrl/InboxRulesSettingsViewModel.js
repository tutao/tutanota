"use strict";

tutao.provide('tutao.tutanota.ctrl.InboxRulesSettingsViewModel');

/**
 * View model to configure inbox rules for incooming emails..
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

    this.userProperties = null;

    this.newRule = ko.observable();
};

tutao.tutanota.ctrl.InboxRulesSettingsViewModel.prototype.init = function() {
    this.userProperties = new tutao.entity.tutanota.TutanotaPropertiesEditable(tutao.locator.mailBoxController.getUserProperties());
    this.availableTargetFolders([]);
    this._createTargetFolders(tutao.locator.mailFolderListViewModel.getMailFolders());
    this._resetNewRule();
    this.state.entering(true);
};

tutao.tutanota.ctrl.InboxRulesSettingsViewModel.prototype._resetNewRule = function() {
    var newInboxRule = new tutao.entity.tutanota.InboxRule(this.userProperties.getTutanotaProperties()).setValue("").setType(tutao.entity.tutanota.TutanotaConstants.INBOX_RULE_SENDER_EQUALS).setTargetFolder(this.availableTargetFolders()[0].getMailFolderId());
    this.newRule(new tutao.entity.tutanota.InboxRuleEditable(newInboxRule));
    this.selectedFolder(tutao.locator.mailFolderListViewModel.getSystemFolder(tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_TRASH));
};

tutao.tutanota.ctrl.InboxRulesSettingsViewModel.prototype._getInputInvalidMessage = function() {
    var currentValue = this.newRule().value().toLowerCase().trim();

    if (currentValue == "" ) {
        return "emptyString_msg";
    }
    if (this._isEmailRuleSelected() && !tutao.tutanota.util.Formatter.isDomainName(currentValue) && !tutao.tutanota.util.Formatter.isMailAddress(currentValue)){
        return "inboxRuleInvalidEmailAddress_msg";
    }
    if (this._isNewRuleExisting() ) {
        return "inboxRuleAlreadyExists_msg";
    }

    return null;
};

tutao.tutanota.ctrl.InboxRulesSettingsViewModel.prototype._isEmailRuleSelected = function() {
    return this.newRule().type() != tutao.entity.tutanota.TutanotaConstants.INBOX_RULE_SUBJECT_CONTAINS;
};

tutao.tutanota.ctrl.InboxRulesSettingsViewModel.prototype._isNewRuleExisting = function() {
    var inboxRules = this.userProperties.inboxRules();
    for(var i=0; i < inboxRules.length; i++){
        if (this.newRule().type() == inboxRules[i].type() && this.newRule().value().trim().toLowerCase() == inboxRules[i].value()) {
            return true;
        }
    }
    return false;
};

tutao.tutanota.ctrl.InboxRulesSettingsViewModel.prototype.addInboxRule = function() {
    var self = this;
    if (!this.state.submitEnabled()) {
        return;
    }

    this.newRule().targetFolder(self.selectedFolder().getMailFolderId());
    this.newRule().value(this.newRule().value().trim().toLowerCase());
    this.userProperties.inboxRules.push(this.newRule());
    this._updateTutanotaProperties().then(function(){
        self._resetNewRule();
    });
};

tutao.tutanota.ctrl.InboxRulesSettingsViewModel.prototype.removeInboxRule = function(inboxRuleListEntry) {
    this.userProperties.inboxRules.splice(inboxRuleListEntry, 1);
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
    if ( inboxRuleType == tutao.entity.tutanota.TutanotaConstants.INBOX_RULE_SENDER_EQUALS ){
        return tutao.lang("inboxRuleSenderEquals_action");
    } else if ( inboxRuleType == tutao.entity.tutanota.TutanotaConstants.INBOX_RULE_RECIPIENT_TO_EQUALS ){
        return tutao.lang("inboxRuleToRecipientEquals_action")
    } else if ( inboxRuleType == tutao.entity.tutanota.TutanotaConstants.INBOX_RULE_RECIPIENT_CC_EQUALS ){
        return tutao.lang("inboxRuleCCRecipientEquals_action")
    } else if ( inboxRuleType == tutao.entity.tutanota.TutanotaConstants.INBOX_RULE_RECIPIENT_BCC_EQUALS ){
        return tutao.lang("inboxRuleBCCRecipientEquals_action")
    } else if ( inboxRuleType == tutao.entity.tutanota.TutanotaConstants.INBOX_RULE_SUBJECT_CONTAINS ){
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
    if (this.newRule().type() == tutao.entity.tutanota.TutanotaConstants.INBOX_RULE_SUBJECT_CONTAINS) {
        return tutao.lang('inboxRuleContainsPlaceholder_label');
    } else {
        return tutao.lang('emailSenderPlaceholder_label');
    }
};

tutao.tutanota.ctrl.InboxRulesSettingsViewModel.isRuleExistingForMailAddress = function(mailAddress) {
    var rules = tutao.locator.mailBoxController.getUserProperties().getInboxRules();
    for (var i = 0; i < rules.length; i++) {
        if (rules[i].getValue() == mailAddress.trim().toLowerCase()) {
            return true;
        }
    }
    return false;
};
