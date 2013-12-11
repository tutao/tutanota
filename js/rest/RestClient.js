"use strict";

goog.provide('tutao.rest.RestClient');

/**
 * The RestClient class is a facade to jquery's ajax implementation. It provides operations
 * that are more appropriate for our server side.
 * @constructor
 */
tutao.rest.RestClient = function() {};

/**
 * Provides an element or multiple elements loaded from the server.
 * @param {string} path path of the element(s), includes element type name, optionally a list id, an id and optionally parameters.
 * E.g. "body/428347293847" or "mail/232410342431/203482034234".
 * @param {?Object.<string, string>} headers A map with header key/value pairs to send with the request.
 * @param {?string} json The payload. 
 * @param {function(?Object, tutao.rest.RestException=)} callback Provides the data of the element(s) or an exception if the rest call failed.
 */
tutao.rest.RestClient.prototype.getElement = function(path, headers, json, callback) {
	var contentType = (json) ? tutao.rest.ResourceConstants.CONTENT_TYPE_APPLICATION_JSON_CHARSET_UTF_8 : null;
	json = json ? json : "";
	// avoid caching (needed for IE) by setting cache: false
	jQuery.ajax({ type: "GET", url: path, contentType: contentType, data: json, dataType: 'json', async: true, cache: false, headers: headers,
		success: function(data, textStatus, jqXHR) {
			callback(data);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			callback(null, new tutao.rest.RestException(jqXHR.status));
		}
	});
};

/**
 * Stores an element on the server.
 * @param {string} path path of the element, includes element type name.
 * @param {?Object.<string, string>} headers A map with header key/value pairs to send with the request.
 * @param {string} json The json data to store.
 * @param {function(?string, tutao.rest.RestException=)} callback Provides the response from the server as a string or an exception if the rest call failed.
 */
tutao.rest.RestClient.prototype.postElement = function(path, headers, json, callback) {
	jQuery.ajax({ type: "POST", url: path, contentType: tutao.rest.ResourceConstants.CONTENT_TYPE_APPLICATION_JSON_CHARSET_UTF_8, data: json, dataType: 'json', async: true, headers: headers,
		success: function(data, textStatus, jqXHR) {
			callback(data);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			callback(null, new tutao.rest.RestException(jqXHR.status));
		}
	});
};

/**
 * Updates an element on the server.
 * @param {string} path path of the element, includes element type name, a list id (in case of LET) and an id.
 * @param {?Object.<string, string>} headers A map with header key/value pairs to send with the request.
 * E.g. "body/428347293847" or "mail/232410342431/203482034234".
 * @param {string} json The json data to store.
 * @param {function(tutao.rest.RestException=)} callback Provides an exception if the rest call failed.
 */
tutao.rest.RestClient.prototype.putElement = function(path, headers, json, callback) {
	jQuery.ajax({ type: "PUT", url: path, contentType: tutao.rest.ResourceConstants.CONTENT_TYPE_APPLICATION_JSON_CHARSET_UTF_8, data: json, dataType: 'text', async: true, headers: headers,
		success: function(data, textStatus, jqXHR) {
			callback();
		},
		error: function(jqXHR, textStatus, errorThrown) {
			callback(new tutao.rest.RestException(jqXHR.status));
		}
	});
};

/**
 * Deletes one or more elements.
 * @param {string} path Path of the element(s);.
 * @param {?Object.<string, string>} headers A map with header key/value pairs to send with the request.
 * @param {string} json The payload.
 * @param {function(tutao.rest.RestException=)} callback Provides an exception if the rest call failed.
 */
tutao.rest.RestClient.prototype.deleteElements = function(path, headers, json, callback) {
	var contentType = (json) ? tutao.rest.ResourceConstants.CONTENT_TYPE_APPLICATION_JSON_CHARSET_UTF_8 : null;
	json = json ? json : "";
	jQuery.ajax({ type: "DELETE", url: path, contentType: contentType, data: json, dataType: 'text', async: true, headers: headers,
		success: function(data, textStatus, jqXHR) {
			callback();
		},
		error: function(jqXHR, textStatus, errorThrown) {
			callback(new tutao.rest.RestException(jqXHR.status));
		}
	});
};

/**
 * Uploads binary data.
 * @param {string} path Path of the service which receives the binary data.
 * @param {?Object.<string, string>} headers A map with header key/value pairs to send with the request.
 * @param {ArrayBuffer} data The binary data as ArrayBuffer.
 * @param {function(tutao.rest.RestException=)} callback Provides an exception if the rest call failed.
 */
tutao.rest.RestClient.prototype.putBinary = function(path, headers, data, callback) {
	jQuery.ajax({ type: "PUT", url: path, contentType: 'application/octet-stream', data: data, processData: false, dataType: 'text', async: true, headers: headers,
		success: function(data, textStatus, jqXHR) {
			callback(data);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			callback(new tutao.rest.RestException(jqXHR.status));
		}
	});
};

/**
 * Downloads binary data.
 * @param {string} path Path of the service which provides the binary data.
 * @param {?Object.<string, string>} headers A map with header key/value pairs to send with the request.
 * @param {function((ArrayBuffer|String|null), tutao.rest.RestException=)} callback Provides the binary data as ArrayBuffer or base64 coded string if the parameter base64=true is set. Provides an exception if the rest call failed.
 */
tutao.rest.RestClient.prototype.getBinary = function(path, headers, callback) {
	var xhr = new XMLHttpRequest();
	// use the same trick to avoid caching (actually only needed for IE) like jquery: append a unique timestamp
	xhr.open('GET', path + "&_=" + new Date().getTime(), true);
	xhr.responseType = 'arraybuffer';
	for (var i in headers) {
		xhr.setRequestHeader(i, headers[i]);
	}
	xhr.onreadystatechange = function(e) { // XMLHttpRequestProgressEvent, but not needed
		if (this.readyState == 4) { // DONE
			if (this.status == 200) {
				callback(this.response ? this.response : this.responseText); // LEGACY variant for IE 8/9 which uses responseBody for base64 string data
			} else {
				callback(null, new tutao.rest.RestException(this.status));
			}
		}
	};
	xhr.send();
};
