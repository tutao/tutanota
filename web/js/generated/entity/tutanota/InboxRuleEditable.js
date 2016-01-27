"use strict";

tutao.provide('tutao.entity.tutanota.InboxRuleEditable');

/**
 * Provides a knockout observable mechanism for a InboxRule.
 * @param {tutao.entity.tutanota.InboxRule} inboxrule The actual InboxRule.
 * @constructor
 */
tutao.entity.tutanota.InboxRuleEditable = function(inboxrule) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this._entity = inboxrule;
	this._id = ko.observable(inboxrule.getId());
	this.type = ko.observable(inboxrule.getType());
	this.value = ko.observable(inboxrule.getValue());
	this.targetFolder = ko.observable(inboxrule.getTargetFolder());

	this.lastUpdatedTimestamp = ko.observable(null);

	if (tutao.entity.tutanota.InboxRuleExtension) {
		tutao.entity.tutanota.InboxRuleExtension(this);
	}
};

/**
 * Provides the actual InboxRule.
 * @return {tutao.entity.tutanota.InboxRule} The InboxRule.
 */
tutao.entity.tutanota.InboxRuleEditable.prototype.getInboxRule = function() {
	return this._entity;
};

/**
 * Updates the underlying InboxRule with the modified attributes.
 */
tutao.entity.tutanota.InboxRuleEditable.prototype.update = function() {
	this._entity.setId(this._id());
	this._entity.setType(this.type());
	this._entity.setValue(this.value());
	this._entity.setTargetFolder(this.targetFolder());
	this.lastUpdatedTimestamp(new Date().getTime());
};
