"use strict";

tutao.provide('tutao.entity.tutanota.TutanotaPropertiesEditable');

/**
 * Provides a knockout observable mechanism for a TutanotaProperties.
 * @param {tutao.entity.tutanota.TutanotaProperties} tutanotaproperties The actual TutanotaProperties.
 * @constructor
 */
tutao.entity.tutanota.TutanotaPropertiesEditable = function(tutanotaproperties) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this._entity = tutanotaproperties;
	this.customEmailSignature = ko.observable(tutanotaproperties.getCustomEmailSignature());
	this.defaultSender = ko.observable(tutanotaproperties.getDefaultSender());
	this.defaultUnconfidential = ko.observable(tutanotaproperties.getDefaultUnconfidential());
	this.emailSignatureType = ko.observable(tutanotaproperties.getEmailSignatureType());
	this.groupEncEntropy = ko.observable(tutanotaproperties.getGroupEncEntropy());
	this.noAutomaticContacts = ko.observable(tutanotaproperties.getNoAutomaticContacts());
	this.notificationMailLanguage = ko.observable(tutanotaproperties.getNotificationMailLanguage());
	this.sendPlaintextOnly = ko.observable(tutanotaproperties.getSendPlaintextOnly());
	this.imapSyncConfig = ko.observableArray();
	for (var i = 0; i < tutanotaproperties.getImapSyncConfig().length; i++) {
		this.imapSyncConfig.push(new tutao.entity.tutanota.ImapSyncConfigurationEditable(tutanotaproperties.getImapSyncConfig()[i]));
	}
	this.inboxRules = ko.observableArray();
	for (var i = 0; i < tutanotaproperties.getInboxRules().length; i++) {
		this.inboxRules.push(new tutao.entity.tutanota.InboxRuleEditable(tutanotaproperties.getInboxRules()[i]));
	}

	this.lastUpdatedTimestamp = ko.observable(null);

	if (tutao.entity.tutanota.TutanotaPropertiesExtension) {
		tutao.entity.tutanota.TutanotaPropertiesExtension(this);
	}
};

/**
 * Provides the actual TutanotaProperties.
 * @return {tutao.entity.tutanota.TutanotaProperties} The TutanotaProperties.
 */
tutao.entity.tutanota.TutanotaPropertiesEditable.prototype.getTutanotaProperties = function() {
	return this._entity;
};

/**
 * Updates the underlying TutanotaProperties with the modified attributes.
 */
tutao.entity.tutanota.TutanotaPropertiesEditable.prototype.update = function() {
	this._entity.setCustomEmailSignature(this.customEmailSignature());
	this._entity.setDefaultSender(this.defaultSender());
	this._entity.setDefaultUnconfidential(this.defaultUnconfidential());
	this._entity.setEmailSignatureType(this.emailSignatureType());
	this._entity.setGroupEncEntropy(this.groupEncEntropy());
	this._entity.setNoAutomaticContacts(this.noAutomaticContacts());
	this._entity.setNotificationMailLanguage(this.notificationMailLanguage());
	this._entity.setSendPlaintextOnly(this.sendPlaintextOnly());
	this._entity.getImapSyncConfig().length = 0;
	for (var i = 0; i < this.imapSyncConfig().length; i++) {
		this.imapSyncConfig()[i].update();
		this._entity.getImapSyncConfig().push(this.imapSyncConfig()[i].getImapSyncConfiguration());
	}
	this._entity.getInboxRules().length = 0;
	for (var i = 0; i < this.inboxRules().length; i++) {
		this.inboxRules()[i].update();
		this._entity.getInboxRules().push(this.inboxRules()[i].getInboxRule());
	}
	this.lastUpdatedTimestamp(new Date().getTime());
};
