"use strict";

tutao.provide('tutao.rest.RestClient');

/**
 * The RestClient class is a facade to jquery's ajax implementation. It provides operations
 * that are more appropriate for our server side.
 *
 * We do not provide any data types as jquery will infer them from the returned mime type (which should be set correctly by tutadb)
 * @constructor
 */
tutao.rest.RestClient = function() {
    this._errorFactory = new tutao.util.ErrorFactory();
    this.url = tutao.env.getHttpOrigin();
};

/**
 * Provides an element or multiple elements loaded from the server.
 * @param {string} path path of the element(s), includes element type name, optionally a list id, an id and optionally parameters.
 * E.g. "body/428347293847" or "mail/232410342431/203482034234".
 * @param {?Object.<string, string>} headers A map with header key/value pairs to send with the request.
 * @param {?string} json The payload. 
 * @return {Promise.<Object>} Resolves to the data of the element(s), rejects if the rest call failed.
 */
tutao.rest.RestClient.prototype.getElement = function(path, headers, json) {
    var self = this;
    path = this.url + path;
    return new Promise(function(resolve, reject) {
        var contentType = (json) ? "application/x-www-form-urlencoded; charset=UTF-8" : null;
        json = json ? tutao.rest.ResourceConstants.GET_BODY_PARAM + "=" + encodeURIComponent(json) : "";
        // avoid caching (needed for IE) by setting cache: false
        jQuery.ajax({ type: "GET", url: path, contentType: contentType, data: json, processData: true, async: true, cache: false, headers: headers,
            success: function(data, textStatus, jqXHR) {
                resolve(data);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                reject(self._errorFactory.handleRestError(jqXHR.status, textStatus));
            }
        });
    });
};

/**
 * Stores an element on the server.
 * @param {string} path path of the element, includes element type name.
 * @param {?Object.<string, string>} headers A map with header key/value pairs to send with the request.
 * @param {string} json The json data to store.
 * @return {Promise.<string>} Resolves to the response from the server as a string, rejects if the rest call failed.
 */
tutao.rest.RestClient.prototype.postElement = function(path, headers, json) {
    var self = this;
    path = this.url + path;
    return new Promise(function(resolve, reject) {
        jQuery.ajax({ type: "POST", url: path, contentType: tutao.rest.ResourceConstants.CONTENT_TYPE_APPLICATION_JSON_CHARSET_UTF_8, data: json, processData: false, async: true, headers: headers,
            success: function(data, textStatus, jqXHR) {
                resolve(data);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                reject(self._errorFactory.handleRestError(jqXHR.status, textStatus));
            }
        });
    });
};

/**
 * Updates an element on the server.
 * @param {string} path path of the element, includes element type name, a list id (in case of LET) and an id.
 * @param {?Object.<string, string>} headers A map with header key/value pairs to send with the request.
 * E.g. "body/428347293847" or "mail/232410342431/203482034234".
 * @param {string} json The json data to store.
 * @return {Promise.<string>} Provides an exception if the rest call failed
 */
tutao.rest.RestClient.prototype.putElement = function(path, headers, json) {
    var self = this;
    path = this.url + path;
    return new Promise(function(resolve, reject) {
        jQuery.ajax({ type: "PUT", url: path, contentType: tutao.rest.ResourceConstants.CONTENT_TYPE_APPLICATION_JSON_CHARSET_UTF_8, data: json, processData: false, async: true, headers: headers,
            success: function(data, textStatus, jqXHR) {
                resolve(data);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                reject(self._errorFactory.handleRestError(jqXHR.status, textStatus));
            }
        });
    });
};

/**
 * Deletes one or more elements.
 * @param {string} path Path of the element(s);.
 * @param {?Object.<string, string>} headers A map with header key/value pairs to send with the request.
 * @param {string} json The payload.
 * @return {Promise.<string>} Resolves to the response from the server as a string, rejects if the rest call failed.
 */
tutao.rest.RestClient.prototype.deleteElement = function(path, headers, json) {
    var self = this;
    path = this.url + path;
    return new Promise(function(resolve, reject) {
        var contentType = (json) ? tutao.rest.ResourceConstants.CONTENT_TYPE_APPLICATION_JSON_CHARSET_UTF_8 : null;
        json = json ? json : "";
        jQuery.ajax({ type: "DELETE", url: path, contentType: contentType, data: json, processData: false, async: true, headers: headers,
            success: function(data, textStatus, jqXHR) {
                resolve(data);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                reject(self._errorFactory.handleRestError(jqXHR.status, textStatus));
            }
        });
    });
};

/**
 * Uploads binary data.
 * @param {string} path Path of the service which receives the binary data.
 * @param {?Object.<string, string>} headers A map with header key/value pairs to send with the request.
 * @param {ArrayBuffer} data The binary data as ArrayBuffer.
 * @return {Promise.<>} Resolves after finished, rejects if the rest call failed.
 */
tutao.rest.RestClient.prototype.putBinary = function(path, headers, data) {
    var self = this;
    path = this.url + path;
    return new Promise(function(resolve, reject) {
        jQuery.ajax({ type: "PUT", url: path, contentType: 'application/octet-stream', data: data, processData: false, async: true, headers: headers,
            success: function(data, textStatus, jqXHR) {
                resolve(data);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                reject(self._errorFactory.handleRestError(jqXHR.status, textStatus));
            }
        });
    });
};

/**
 * Downloads binary data.
 * @param {string} path Path of the service which provides the binary data.
 * @param {?Object.<string, string>} headers A map with header key/value pairs to send with the request.
 * @return {Promise.<(ArrayBuffer|String|null)>} Resolves to the binary data as ArrayBuffer or base64 coded string if the parameter base64=true is set. Rejects if the rest call failed.
 */
tutao.rest.RestClient.prototype.getBinary = function(path, headers) {
    var self = this;
    path = this.url + path;
    return new Promise(function(resolve, reject) {
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
                    resolve(this.response ? this.response : this.responseText); // LEGACY variant for IE 8/9 which uses responseBody for base64 string data
                } else {
                    reject(self._errorFactory.handleRestError(this.status, this.statusText));
                }
            }
        };
        xhr.send();
    });
};
