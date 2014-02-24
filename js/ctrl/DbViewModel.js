"use strict";

goog.provide('tutao.tutanota.ctrl.DbViewModel');

/**
 * Provides a viewer showing all elements in the database by app, type and id.
 * @constructor
 */
tutao.tutanota.ctrl.DbViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	
	this.MAX_LIST_LOAD_COUNT = tutao.rest.EntityRestInterface.MAX_RANGE_COUNT;

	this.message = ko.observable("");
	
	this.version = ko.observable();

	this.applications = ko.observableArray([tutao.tutanota.model.sys_model, tutao.tutanota.model.monitor_model, tutao.tutanota.model.tutanota_model]);

	// run through all ETs and LETS of each application, set the app on all these types and put them
	// into a list inside the application so they can be displayed in the select when the app is selected
	for (var i=0; i<this.applications().length; i++) {
		var app = this.applications()[i];
		var types = [];
		for (var type in app.types) {
			// set the type's application
			if (app.types[type].type == "ELEMENT_TYPE" || app.types[type].type == "LIST_ELEMENT_TYPE") {
				app.types[type].app = app;
				types.push(app.types[type]);
			}
		}
		app.typeList = types;
	}

	this.application = ko.observable();
	this.application.subscribe(function(newValue) {
		this.version(newValue.version);
	}, this);

	this.types = ko.computed(function() {
		if (this.application()) {
			// the ET and LET types of the application were gathered and stored in the app before.
			return this.application().typeList;
		} else {
			return [];			
		}
	}, this);
	this.type = ko.observable();
	// there is only one System instance, so set the id for convenience when the type is selected
	this.type.subscribe(function(newValue) {
		if (newValue.name == "System") {
			this.id(tutao.rest.EntityRestInterface.GENERATED_MIN_ID);
		}
	}, this);
	this.listId = ko.observable("");
	this.id = ko.observable();

	// all loaded instances are stored in this history list. an instance actually be an array of instances if a list
	// was loaded. the last in the list is shown. elements contain: { type, [listId], id, instance, [version] }
	this.instanceHistory = ko.observableArray([]);

	this._restClient = new tutao.rest.RestClient();
};

/**
 * Defines if an additional button shall be shown to get the root instance of the selected type by entering
 * the desired group id into the id field.
 */
tutao.tutanota.ctrl.DbViewModel.prototype.showRootButton = function() {
	return (this.type().name == "MailBox" || this.type().name == "ContactList" || this.type().name == "FileSystem" || this.type().name == "TutanotaProperties" || this.type().name == "GroupRoot"  || this.type().name == "Shares");
};

/**
 * Defines if the versions button shall be shown.
 */
tutao.tutanota.ctrl.DbViewModel.prototype.showVersionsButton = function() {
	return (this.type().versioned);
};

/**
 * Provides the currently shown instance, resp. list of instances.
 */
tutao.tutanota.ctrl.DbViewModel.prototype.getCurrentInstance = function() {
	if (this.instanceHistory().length > 0) {
		return this.instanceHistory()[this.instanceHistory().length - 1];
	} else {
		return null;
	}
};

/**
 * Provides a type by type name and application.
 */
tutao.tutanota.ctrl.DbViewModel.prototype.getType = function(app, typeName) {
	return app.types[typeName];
};

/**
 * Loads and shows the selected instance from the app, type, listId and id fields. 
 */
tutao.tutanota.ctrl.DbViewModel.prototype.showSelected = function() {
	// convert custom ids from string to base64url, so check if the id type of the selected type is customId
	var idType = this._getIdType(this.type());
	var id = this.id();
	// treat the custom ids of some special types as strings, all others as the custom id default type base64url
	if (idType == "CustomId" && (this.type().name == "MailAddressToGroup" || this.type().name == "CounterSnapshotSeries" || this.type().name == "DomainToCustomer")) {
		id = tutao.rest.EntityRestInterface.stringToCustomId(this.id());
	}
	this.showInstance(this.type(), this.listId(), id);
};

/**
 * Loads and shows the selected instance referenced by the root instance for the selected app, type and group id in the id field.
 * Currently only implemented for element types!  
 */
tutao.tutanota.ctrl.DbViewModel.prototype.showRoot = function() {
	var self = this;
	var rootInstanceType = this.getType(this.applications()[0], "RootInstance");
	this._loadInstance(rootInstanceType, this.id(), this.type().rootId, null, null, function(instance, exception) {
		if (exception) {
			self.message("instance not found");
		} else {
			self.showInstance(self.type(), null, instance.reference);
		}
	});
};

/**
 * Loads and shows an instance by reference (type name, list id and id) from the application of the currently shown instance.
 */
tutao.tutanota.ctrl.DbViewModel.prototype.showReference = function(typeName, listId, id) {
	var type = this.getType(this.getCurrentInstance().type.app, typeName);
	this.showInstance(type, listId, id);
};

/**
 * Shows an instance by type.
 * startId is optional
 * version is optional
 */
tutao.tutanota.ctrl.DbViewModel.prototype.showInstance = function(type, listId, id, startId, version) {
	var self = this;
	this._loadInstance(type, listId, id, startId, version, function(instance, exception) {
		if (exception) {
			self.message("instance not found");
		} else {
			self.message("");
			self.instanceHistory.push({ type: type, listId: listId, id: id, instance: instance, version: version });
		}
		tutao.locator.dbView.instancesUpdated();
	});
};

/**
 * Loads and shows the version infos for the selected app, type, listId and id. 
 */
tutao.tutanota.ctrl.DbViewModel.prototype.showSelectedVersions = function() {
	this.showVersionInfosById(this.type(), this.listId(), this.id());
};

/**
 * Loads and shows the instance corresponding to the given VersionInfo.
 */
tutao.tutanota.ctrl.DbViewModel.prototype.showVersion = function(versionInfo) {
	// get the type by app name and type id in versionInfo
	var type = null;
	for (var i=0; i<this.applications().length; i++) {
		var app = this.applications()[i];
		if (app.name == versionInfo.app) {
			for (var type in app.types) {
				if (app.types[type].id == versionInfo.type) {
					type = app.types[type];
					break;
				}
			}
		}
	}
	this.showInstance(type, versionInfo.referenceList, versionInfo._id[0], null, versionInfo._id[1]);
};

/**
 * Shows the version infos for a given instance.
 */
tutao.tutanota.ctrl.DbViewModel.prototype.showVersionInfosByInstance = function(type, instance) {
	if (type.type == "ELEMENT_TYPE") {
		this.showVersionInfosById(type, null, instance._id);
	} else {
		this.showVersionInfosById(type, instance._id[0], instance._id[1]);
	}
};

/**
 * Shows the version infos for a given type, listId and id.
 * listId is optional
 */
tutao.tutanota.ctrl.DbViewModel.prototype.showVersionInfosById = function(type, listId, id) {
	if (id) {
		this.showInstance(this.applications()[0].types["VersionInfo"], id);
	} else {
		this.showInstance(this.applications()[0].types["ListVersionInfo"], listId);
	}
};

/**
 * Provides the id type of the given type.
 */
tutao.tutanota.ctrl.DbViewModel.prototype._getIdType = function(type) {
	for (var i=0; i<type.values.length; i++) {
		if (type.values[i].name == "_id") {
			return type.values[i].type;
		}
	}
	throw new Error("_id not found in type");
};

/**
 * Loads an instance by type, list id and id. listId must be null for ETs. id may be null for loading lists.
 * startId is optional
 * version is optional
 * startId or version must not be set at the same time
 */
tutao.tutanota.ctrl.DbViewModel.prototype._loadInstance = function(type, listId, id, startId, version, callback) {
	var path = "/rest/" + type.app.name.toLowerCase() + "/" + type.name.toLowerCase() + "/";
	if (type.type == "LIST_ELEMENT_TYPE") {
		if (id) {
			path += listId + "/" + id + "?v=" + type.app.version;
		} else {
			if (!startId) {
				if (this._getIdType(type) == "CustomId") {
					startId = tutao.rest.EntityRestInterface.CUSTOM_MIN_ID;
				} else {
					startId = tutao.rest.EntityRestInterface.GENERATED_MIN_ID;
				}
			}
			path += listId + "?start=" + startId + "&" + "count=" + this.MAX_LIST_LOAD_COUNT + "&reverse=false&v=" + type.app.version;
		}
	} else {
		path += id + "?v=" + type.app.version;
	}
	if (version) {
		path += "&version=" + version;
	}
	this._restClient.getElement(path, tutao.entity.EntityHelper.createAuthHeaders(), null, function(instance, exception) {
		callback(instance, exception);
	});
};

/**
 * Shows the instance that was loaded before the current one.
 */
tutao.tutanota.ctrl.DbViewModel.prototype.showLast = function() {
	this.instanceHistory.pop();
};

/**
 * Returns true if currently a list is shown and more elements can be loaded.
 */
tutao.tutanota.ctrl.DbViewModel.prototype.showMorePossible = function() {
	return ((this.instanceHistory().length > 0) && 
			(this.getCurrentInstance().instance instanceof Array) && 
			(this.getCurrentInstance().instance.length == this.MAX_LIST_LOAD_COUNT)); 
};

/**
 * Loads the next elemenst from the  currently shown list.
 */
tutao.tutanota.ctrl.DbViewModel.prototype.showMore = function() {
	this.showInstance(this.getCurrentInstance().type, this.getCurrentInstance().listId, this.getCurrentInstance().id, this.getCurrentInstance().instance[this.getCurrentInstance().instance.length - 1]._id[1]);
};

/**
 * Provides an abbreviation for the given type name. The type name may be a TypeId, ValueType, AssociationTypeId or CardinalityType.
 */
tutao.tutanota.ctrl.DbViewModel.prototype.getTypeAbbreviation = function(typeName) {
	switch (typeName) {
		case "ELEMENT_TYPE": return "ET";
		case "LIST_ELEMENT_TYPE": return "LET";
		case "AGGREGATED_TYPE": return "AT";
		case "SERVICE_TYPE": return "ST";
		case "String": return "str";
		case "Number": return "num";
		case "Bytes": return "byte";
		case "Date": return "date";
		case "Boolean": return "bool";
		case "GeneratedId": return "gen";
		case "CustomId": return "cust";
		case "LIST_ASSOCIATION": return "LA";
		case "ELEMENT_ASSOCIATION": return "EA";
		case "LIST_ELEMENT_ASSOCIATION": return "LEA";
		case "AGGREGATION": return "AG";
		case "ZeroOrOne": return "0..1";
		case "One": return "1";
		case "Any": return "*";
	}
	return typeName;
};
