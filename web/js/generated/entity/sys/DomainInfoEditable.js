"use strict";

tutao.provide('tutao.entity.sys.DomainInfoEditable');

/**
 * Provides a knockout observable mechanism for a DomainInfo.
 * @param {tutao.entity.sys.DomainInfo} domaininfo The actual DomainInfo.
 * @constructor
 */
tutao.entity.sys.DomainInfoEditable = function(domaininfo) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this._entity = domaininfo;
	this._id = ko.observable(domaininfo.getId());
	this.certificateExpiryDate = ko.observable(domaininfo.getCertificateExpiryDate());
	this.domain = ko.observable(domaininfo.getDomain());
	this.validatedMxRecord = ko.observable(domaininfo.getValidatedMxRecord());
	this.catchAllMailGroup = ko.observable(domaininfo.getCatchAllMailGroup());
	this.certificate = ko.observable(domaininfo.getCertificate());
	this.theme = ko.observable(domaininfo.getTheme());

	this.lastUpdatedTimestamp = ko.observable(null);

	if (tutao.entity.sys.DomainInfoExtension) {
		tutao.entity.sys.DomainInfoExtension(this);
	}
};

/**
 * Provides the actual DomainInfo.
 * @return {tutao.entity.sys.DomainInfo} The DomainInfo.
 */
tutao.entity.sys.DomainInfoEditable.prototype.getDomainInfo = function() {
	return this._entity;
};

/**
 * Updates the underlying DomainInfo with the modified attributes.
 */
tutao.entity.sys.DomainInfoEditable.prototype.update = function() {
	this._entity.setId(this._id());
	this._entity.setCertificateExpiryDate(this.certificateExpiryDate());
	this._entity.setDomain(this.domain());
	this._entity.setValidatedMxRecord(this.validatedMxRecord());
	this._entity.setCatchAllMailGroup(this.catchAllMailGroup());
	this._entity.setCertificate(this.certificate());
	this._entity.setTheme(this.theme());
	this.lastUpdatedTimestamp(new Date().getTime());
};
