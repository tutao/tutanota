"use strict";

goog.provide('tutao.Locator');

/**
 * The Locator is our central instance cache. It is a "singleton store"
 * that is used to retrieve instances.
 * The Locator is used instead of dependency injection.
 * @constructor
 * @param {Object.<string, Object>} services A map of service names and constructors or constructor/argument pairs.
 * @param {function()} initializer The initializer sets up the locator and is used on each reset
 * The constructors are used to create the services. Getters are defined for every service.
 */
tutao.Locator = function(services, initializer) {
	/**
	 * @type {Object.<string, Object>} the mapping from service names to cached instances
	 */
	this._services = services;
	this._initializer = initializer ? initializer : function() {};
	this._replacedStaticMethods = [];
	this.reset();
};

/**
 * the locator instance
 */
tutao.locator = undefined;

/**
 * Only for Testing: sets an instance to be returned on requests for a specific serviceName
 * @param {string} serviceName Service name.
 * @param {Object} instance Instance to return.
 */
tutao.Locator.prototype.replace = function(serviceName, instance) {
	var self = this;
	self[serviceName] = instance;
};

/**
 * Only for Testing: overrides a static method and saves it's original behavior.
 * @param {Object} clazz The class where the function should be replaced.
 * @param {function(...[Object])} original The original function defined on class.
 * @param {function(...[Object])} replacement The replacement function to define on class.
 */
tutao.Locator.prototype.replaceStatic = function(clazz, original, replacement) {
	for (var attributeName in clazz) {
		if (clazz[attributeName] === original) {
			clazz[attributeName] = replacement;
			this._replacedStaticMethods.push({clazz: clazz, attributeName: attributeName, original: original});
			return;
		}
	}
	throw new Error("did not find function in clazz");
};

/**
 * removes all cached instances
 */
tutao.Locator.prototype.reset = function() {
	var self = this;
	for (var serviceName in this._services) {
		var Constructor = this._services[serviceName];
		self[serviceName] = new Constructor();
	}

	for (var i = 0; i < this._replacedStaticMethods.length; i++) {
		var a = this._replacedStaticMethods[i];
		a.clazz[a.attributeName] = a.original;
	}
	this._replacedStaticMethods = [];
	this._initializer();
};
