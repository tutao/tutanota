"use strict";

goog.provide('tutao.db.WebSqlDb');
//import('tutao.db.DbInterface');
//import('tutao.entity.Mail');

/**
 * @constructor
 * @implements tutao.db.DbInterface
 */
tutao.db.WebSqlDb = function() {
};

/**
 * The name of the table that stores the last indexed element of a type.
 */
tutao.db.WebSqlDb.prototype._LAST_INDEXED_TABLE_NAME = "LastIndexed";

/**
 * @inheritDoc
 */
tutao.db.WebSqlDb.prototype.isSupported = function() {
	// workaround to detect private browsing mode in mobile safari
	try {
		window.localStorage.setItem("test", "test");
	} catch (e) {
		return false;
	}
	return !!window.openDatabase;
};

/**
 * @inheritDoc
 */
tutao.db.WebSqlDb.prototype.init = function(name, callback) {
	// use a fixed version for now
	// the size is a dummy value because it is not used
	this._db = openDatabase(name, "1", name, 1024);

	// stores a map of the names of all tables that we know exists (mapping to the value true), so we do not have to try to create them
	// before inserting data.
	this._availableTables = {};
	var self = this;
	this._db.transaction(function(tx) {
		tx.executeSql("SELECT name FROM sqlite_master WHERE type='table'", [], function(tx, result) {
			for (var i = 0; i < result.rows.length; i++) {
				if (result.rows.item(i).name.indexOf("__") != 0) {
					self._availableTables[result.rows.item(i).name] = true;
				}
			}
		}, function() {
			console.log("error getting table names");
		});
	}, function() {
		console.log("error executing transaction");
	}, function() {
		// there is one table which contains the information if an element was already indexed
		self._makeSureIndexedInfoTableExists(callback);
	});
};

/**
 * @inheritDoc
 */
tutao.db.WebSqlDb.prototype.clear = function(callback) {
	var self = this;
	this._db.transaction(function(tx) {
		for (var property in self._availableTables) {
			tx.executeSql('DROP TABLE IF EXISTS ' + property);
		}
	}, function() {
		console.log("error executing transaction");
	}, function() {
		self._availableTables = {};
		// the indexed table always needs to be available, so create it again
		self._makeSureIndexedInfoTableExists(callback);
	});
};

/**
 * @inheritDoc
 */
tutao.db.WebSqlDb.prototype.setIndexed = function(typeId, elementId, callback) {
	var self = this;
	self._db.transaction(function(tx) {
		tx.executeSql("INSERT OR REPLACE INTO " + self._LAST_INDEXED_TABLE_NAME + "(typeId, elementId) VALUES(?,?)", [typeId, elementId]);
	}, function(error) {
		console.log("error executing transaction in setIndexed", error);
	}, function() {
		if (callback) {
			callback(tutao.db.DbInterface.STATUS_SUCCESS);
		}
	});
};

/**
 * @inheritDoc
 */
tutao.db.WebSqlDb.prototype.getLastIndexed = function(typeId, callback) {
	//cache the last indexed element and return it directly without db access?
	var elementId = null;
	var self = this;
	this._db.transaction(function(tx) {
		tx.executeSql("SELECT elementId FROM " + self._LAST_INDEXED_TABLE_NAME + " WHERE typeId=?", [typeId], function(tx, result) {
			if (result.rows.length === 1) {
				elementId = (result.rows.item(0)["elementId"]);
			}
		}, function(error) {
			console.log(error);
			// no element was indexed yet, elementId shall stay null
		});
	}, function() {
		console.log("error executing transaction");
	}, function() {
		callback(tutao.db.DbInterface.STATUS_SUCCESS, elementId);
	});
};

/**
 * @inheritDoc
 */
tutao.db.WebSqlDb.prototype.addIndexEntries = function(typeId, attributeIds, elementId, values, callback) {
	var self = this;
	// there shall be one table per attribute
	// table names are not allowed to start with a number
	var tableName = this._createTableName(typeId, attributeIds);
	self._makeSureIndexTableExists(tableName, function() {
		self._db.transaction(function(tx) {
			for (var i = 0; i < values.length; i++) {
				tx.executeSql("INSERT INTO " + tableName + "(word, elementId) VALUES(?,?)", [values[i], elementId]);
			}
		}, function(error) {
			console.log("error executing transaction", error);
			if (callback) {
				callback(tutao.db.DbInterface.STATUS_NO_MEM);
			}
		}, function() {
			if (callback) {
				callback(tutao.db.DbInterface.STATUS_SUCCESS);
			}
		});
	});
};

/**
 * @inheritDoc
 */
tutao.db.WebSqlDb.prototype.getElementsByValue = function(typeId, attributeIds, value, callback) {
	var tableName = this._createTableName(typeId, attributeIds);
	// if the table does not exist, then we do not need to execute a query
	if (this._availableTables[tableName] !== true) {
		callback(tutao.db.DbInterface.STATUS_SUCCESS, []);
		return;
	}
	var error = false;
	var ids = [];
	this._db.transaction(function(tx) {
		tx.executeSql("SELECT elementId FROM " + tableName + " WHERE word=?", [value], function(tx, result) {
			for (var i = 0; i < result.rows.length; i++) {
				ids.push(result.rows.item(i)["elementId"]);
			}
		}, function() {
			// this sql command might fail and still the transaction is successful, so remember the error
			error = true;
			console.log("error getting element ids");
		});
	}, function() {
		console.log("error executing transaction");
	}, function() {
		if (!error && callback) {
			callback(tutao.db.DbInterface.STATUS_SUCCESS, ids);
		}
	});
};

/**
 * @inheritDoc
 */
tutao.db.WebSqlDb.prototype.removeIndexEntries = function(typeId, attributeIdsList, elementId, callback) {
	var self = this;
	// there shall be one table per attribute
	// table names are not allowed to start with a number
	self._db.transaction(function(tx) {
		for (var i = 0; i < attributeIdsList.length; i++) {
			var tableName = self._createTableName(typeId, attributeIdsList[i]);
			if (self._availableTables[tableName]) {
				tx.executeSql("DELETE FROM " + tableName + " WHERE elementId=?", [elementId]);
			}
		}
	}, function(error) {
		console.log("error executing transaction", error);
	}, function() {
		if (callback) {
			callback(tutao.db.DbInterface.STATUS_SUCCESS);
		}
	});
};

/**
 * Provides the name of the table that stores the index for the given type and attribute ids.
 * @param {number} typeId The type id of the type of elements.
 * @param {Array.<number>} attributeIds An array of attribute ids that identify an attribute.
 * @return {string} The index table name.
 */
tutao.db.WebSqlDb.prototype._createTableName = function(typeId, attributeIds) {
	// we use this name schema: "index_<typeId>_<attributeId1>_<attributeId2>..."
	var tableName = "index_" + typeId;
	for (var i = 0; i < attributeIds.length; i++) {
		tableName += "_" + attributeIds[i];
	}
	return tableName;
};

/**
 * Creates a table with the given name if it does not yet exist.
 * @param {string} name The name of the table.
 * @param {function(string)} callback Is called when the operation is finished. Passes a status value that indicates failure.
 */
tutao.db.WebSqlDb.prototype._makeSureIndexTableExists = function(name, callback) {
	var self = this;
	if (this._availableTables[name] === true) {
		// the table exist
		callback(tutao.db.DbInterface.STATUS_SUCCESS);
	} else {
		// create the table
		this._db.transaction(function(tx) {
			tx.executeSql('CREATE TABLE IF NOT EXISTS ' + name + '(word, elementId)', []);
		}, function() {
			console.log("failed to create index table");
		}, function() {
			self._availableTables[name] = true;
			if (callback) {
				callback(tutao.db.DbInterface.STATUS_SUCCESS);
			}
		});
	}
};

/**
 * Creates the table that stores the last element indexed element of a type if it does not yet exist.
 * @param {function(string)=} callback Is called when the operation is finished. Passes a status value that indicates failure.
 */
tutao.db.WebSqlDb.prototype._makeSureIndexedInfoTableExists = function(callback) {
	var self = this;
	this._db.transaction(function(tx) {
		tx.executeSql('CREATE TABLE IF NOT EXISTS ' + self._LAST_INDEXED_TABLE_NAME + '(typeId UNIQUE, elementId)', []);
	}, function() {
		console.log("failed to create indexed table");
	}, function() {
		self._availableTables[self._LAST_INDEXED_TABLE_NAME] = true;
		if (callback) {
			callback(tutao.db.DbInterface.STATUS_SUCCESS);
		}
	});
};

