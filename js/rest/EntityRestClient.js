"use strict";

goog.provide('tutao.rest.EntityRestClient');

/**
 * The EntityRestClient provides a convenient interface for invoking server side REST services.
 * They make use of the RestClient and add an additional layer for mapping from/to Entity-Objects.
 * @constructor
 * @implements {tutao.rest.EntityRestInterface}
 */
tutao.rest.EntityRestClient = function() {};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestClient.prototype.getElement = function(type, path, id, listId, parameters, headers, callback) {
	var url = tutao.rest.EntityRestClient.createUrl(path, listId, id, parameters);
	tutao.locator.restClient.getElement(url, headers, null, function(data, exception) {
		if (exception) {
			callback(null, new tutao.rest.EntityRestException(exception));
		} else {
			callback(new type(data));
		}
	});
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestClient.prototype.getService = function(type, path, data, parameters, headers, callback) {
	var url = tutao.rest.EntityRestClient.createUrl(path, null, null, parameters);
	tutao.locator.restClient.getElement(url, headers, JSON.stringify(data.toJsonData()), function(returnData, exception) {
		if (exception) {
			callback(null, new tutao.rest.EntityRestException(exception));
		} else {
			callback(new type(returnData));
		}
	});
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestClient.prototype.getElements = function(type, path, ids, parameters, headers, callback) {
	var self = this;
	var allParameters = this._cloneParameters(parameters);
	var idParameter = "";
	for (var i = 0; i < ids.length; i++) {
		idParameter += ids[i];
		if (i != ids.length - 1) {
			idParameter += ",";
		}
	}
	allParameters[tutao.rest.ResourceConstants.IDS_PARAMETER_NAME] = idParameter;
	var url = tutao.rest.EntityRestClient.createUrl(path, null, null, allParameters);
	tutao.locator.restClient.getElement(url, headers, null, function(data, exception) {
		if (exception) {
			callback(null, new tutao.rest.EntityRestException(exception));
		} else {
			callback(self._createElements(type, data));
		}
	});
};

/**
 * Creates an array of elements from given data with a given type.
 * @param {function(new:Object, Object)} type Type of the elements to load, i.e. the constructor.
 * @param {Array.<Object>} data The data of the elements.
 * @return {Array.<Object>} The entities.
 */
tutao.rest.EntityRestClient.prototype._createElements = function(type, data) {
	var elements = [];
	for (var i=0; i<data.length; i++) {
		elements.push(new type(data[i]));
	}
	return elements;
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestClient.prototype.postElement = function(path, element, listId, parameters, headers, callback) {
	var url = tutao.rest.EntityRestClient.createUrl(path, listId, null, parameters);

	// send the request
	tutao.locator.restClient.postElement(url, headers, JSON.stringify(element.toJsonData()), function(returnString, exception) {
		if (exception) {
			callback(null, new tutao.rest.EntityRestException(exception));
		} else {
			var returnEntity = new tutao.entity.base.PersistenceResourcePostReturn(returnString);
			if (!element.__id) {		
				if (listId) {
					element.__id = [listId, returnEntity.getGeneratedId()];
				} else {
					element.__id = returnEntity.getGeneratedId();
				}
			}
			element.__permissions = returnEntity.getPermissionListId();
			callback(returnEntity);
		}
	});
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestClient.prototype.postService = function(path, element, parameters, headers, returnType, callback) {
	var url = tutao.rest.EntityRestClient.createUrl(path, null, null, parameters);
	tutao.locator.restClient.postElement(url, headers, JSON.stringify(element.toJsonData()), function(returnData, exception) {
		if (exception) {
			callback(null, new tutao.rest.EntityRestException(exception));
		} else {
			if (returnType) {
				callback(new returnType(returnData));
			} else {
				callback(null);
			}
		}
	});
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestClient.prototype.putElement = function(path, element, parameters, headers, callback) {
	var listId;
	var id;
	if (element.__id instanceof Array) {
		listId = element.__id[0];
		id = element.__id[1];
	} else {
		listId = null;
		id = element.__id;
	}
	var url = tutao.rest.EntityRestClient.createUrl(path, listId, id, parameters);

	tutao.locator.restClient.putElement(url, headers, JSON.stringify(element.toJsonData()), function(data, exception) {
		if (exception) {
			callback(new tutao.rest.EntityRestException(exception));
		} else {
			callback();
		}
	});
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestClient.prototype.putService = function(path, element, parameters, headers, returnType, callback) {
    var url = tutao.rest.EntityRestClient.createUrl(path, null, null, parameters);
    tutao.locator.restClient.putElement(url, headers, JSON.stringify(element.toJsonData()), function(returnData, exception) {
        if (exception) {
            callback(null, new tutao.rest.EntityRestException(exception));
        } else {
            if (returnType) {
                callback(new returnType(returnData));
            } else {
                callback(null);
            }
        }
    });
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestClient.prototype.postList = function(path, parameters, headers, callback) {
	var url = tutao.rest.EntityRestClient.createUrl(path, null, null, parameters);
	tutao.locator.restClient.postElement(url, headers, "", function(returnEntity, exception) {
		if (exception) {
			callback(null, new tutao.rest.EntityRestException(exception));
		} else {
			callback(new tutao.entity.base.PersistenceResourcePostReturn(returnEntity));
		}
	});
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestClient.prototype.getElementRange = function(type, path, listId, start, count, reverse, parameters, headers, callback) {
	var self = this;
	var allParameters = this._cloneParameters(parameters);
	allParameters[tutao.rest.ResourceConstants.START_ID_PARAMETER] = start;
	allParameters[tutao.rest.ResourceConstants.ELEMENT_COUNT_PARAMETER] = count;
	allParameters[tutao.rest.ResourceConstants.REVERSE_PARAMETER] = reverse;
	var url = tutao.rest.EntityRestClient.createUrl(path, listId, null, allParameters);
	tutao.locator.restClient.getElement(url, headers, null, function(data, exception) {
		if (exception) {
			callback(null, new tutao.rest.EntityRestException(exception));
		} else {
			callback(self._createElements(type, data));
		}
	});
};

/**
 * Makes a copy of the given parameters and returns it.
 * @param {Object.<string, string>} parameters. The parameters to clone.
 * @return {Object.<string, string>} The copy.
 */
tutao.rest.EntityRestClient.prototype._cloneParameters = function(parameters) {
	var copy = {};
	if (parameters) {
		for (var parameter in parameters) {
			copy[parameter] = parameters[parameter];
		}
	}
	return copy;
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestClient.prototype.deleteElement = function(path, id, listId, parameters, headers, callback) {
    tutao.locator.restClient.deleteElement(tutao.rest.EntityRestClient.createUrl(path, listId, id, parameters), headers, null, function(data, exception) {
        if (exception) {
            console.log(exception);
            callback(null, exception);
        } else {
            callback(data);
        }
    });
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestClient.prototype.deleteService = function(path, element, parameters, headers, returnType, callback) {
    var url = tutao.rest.EntityRestClient.createUrl(path, null, null, parameters);
    tutao.locator.restClient.deleteElement(url, headers, JSON.stringify(element.toJsonData()), function(returnData, exception) {
        if (exception) {
            callback(null, new tutao.rest.EntityRestException(exception));
        } else {
            if (returnType) {
                callback(new returnType(returnData));
            } else {
                callback(null);
            }
        }
    });
};

/**
 * Provides an uri consisting of the given data.
 * @param {string} path The base path.
 * @param {?string} listId The optional list id of the element.
 * @param {?string} id The id of the element.
 * @param {?Object} parameters Request parameters.
 * @return {string} The uri.
 */
tutao.rest.EntityRestClient.createUrl = function(path, listId, id, parameters) {
	var url = path.toLowerCase();
	if (listId) {
		url += "/" + listId;
	}
	if (id) {
		url += "/" + id;
	}
	if (parameters) {
		url += "?";
		for (var key in parameters) {
			url += key + "=" + parameters[key] + "&";
		}
		url = url.substring(0, url.length - 1);
	}
	return url;
};
