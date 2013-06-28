goog.provide('tutao');

/**
 * A reference to the global object.
 */
tutao.global = this;

/**
 * Creates the namespace for the given name in namespace notation.
 * @param {string} name The namespace name.
 */
tutao.namespace = function(name) {
	var names = name.split(".");
	var current = tutao.global;
    for (var i = 0; i < names.length; i++) {
    	if (!current[names[i]]) {
    		current[names[i]] = {};
    	}
    	current = current[names[i]];
    }
};

/**
 * Helper function for inheritance. <b>Attention:</b> This method replaces the prototype of the
 * child class. Therefore, all methods that are to be defined on the prototype of the child class
 * must be defined after invoking this method!
 * @param {Object} subClass The inheriting class.
 * @param {Object} superClass The super class.
 */
tutao.inherit = function(subClass, superClass) {
	/**
	 * @constructor
	 */
	function Prototype() {};
	Prototype.prototype = superClass.prototype;
	subClass._super_ = superClass.prototype;
	subClass.prototype = new Prototype();
	subClass.prototype.constructor = subClass;
};

/**
 * An method that throws an exception. This is useful if subclasses fail to override it.
 */
tutao.abstractMethod = function() {
	throw Error('unimplemented abstract method');
};
