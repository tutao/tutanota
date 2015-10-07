"use strict";

tutao.provide('tutao.entity.sys.FileEditable');

/**
 * Provides a knockout observable mechanism for a File.
 * @param {tutao.entity.sys.File} file The actual File.
 * @constructor
 */
tutao.entity.sys.FileEditable = function(file) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this._entity = file;
	this._id = ko.observable(file.getId());
	this.data = ko.observable(file.getData());
	this.mimeType = ko.observable(file.getMimeType());
	this.name = ko.observable(file.getName());

	this.lastUpdatedTimestamp = ko.observable(null);

	if (tutao.entity.sys.FileExtension) {
		tutao.entity.sys.FileExtension(this);
	}
};

/**
 * Provides the actual File.
 * @return {tutao.entity.sys.File} The File.
 */
tutao.entity.sys.FileEditable.prototype.getFile = function() {
	return this._entity;
};

/**
 * Updates the underlying File with the modified attributes.
 */
tutao.entity.sys.FileEditable.prototype.update = function() {
	this._entity.setId(this._id());
	this._entity.setData(this.data());
	this._entity.setMimeType(this.mimeType());
	this._entity.setName(this.name());
	this.lastUpdatedTimestamp(new Date().getTime());
};
