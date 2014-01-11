"use strict";

goog.provide('ClassHierarchiesTest');

var ClassHierarchiesTest = TestCase("ClassHierarchiesTest");

ClassHierarchiesTest.prototype.test = function() {
	// db
	assertTrue(ClassHierarchiesTest.checkInterface(tutao.db.DummyDb, tutao.db.DbInterface));
	assertTrue(ClassHierarchiesTest.checkInterface(tutao.db.WebSqlDb, tutao.db.DbInterface));

	// crypto
	assertTrue(ClassHierarchiesTest.checkInterface(tutao.crypto.SjclAes, tutao.crypto.AesInterface));
	assertTrue(ClassHierarchiesTest.checkInterface(tutao.crypto.AesWorkerProxy, tutao.crypto.AesInterface));
	assertTrue(ClassHierarchiesTest.checkInterface(tutao.crypto.JsbnRsa, tutao.crypto.RsaInterface));
	assertTrue(ClassHierarchiesTest.checkInterface(tutao.crypto.RsaWorkerProxy, tutao.crypto.RsaInterface));
	assertTrue(ClassHierarchiesTest.checkInterface(tutao.crypto.SjclRandomizer, tutao.crypto.RandomizerInterface));
	assertTrue(ClassHierarchiesTest.checkInterface(tutao.crypto.WorkerRandomizer, tutao.crypto.RandomizerInterface));
	assertTrue(ClassHierarchiesTest.checkInterface(tutao.crypto.JBCryptAdapter, tutao.crypto.KdfInterface));
	assertTrue(ClassHierarchiesTest.checkInterface(tutao.crypto.SjclSha256, tutao.crypto.ShaInterface));
	
	// entity rest
	assertTrue(ClassHierarchiesTest.checkInterface(tutao.rest.EntityRestClient, tutao.rest.EntityRestInterface));
	assertTrue(ClassHierarchiesTest.checkInterface(tutao.rest.EntityRestDummy, tutao.rest.EntityRestInterface));
	assertTrue(ClassHierarchiesTest.checkInterface(tutao.rest.EntityRestCache, tutao.rest.EntityRestInterface));
};

/**
 * Checks that theObject implements all functions defined in theInterface.
 * @param {Object} theImplementer The implementing object or class with static function to check.
 * @param {Object} theInterface The interface that provides the functions.
 * @return {Boolean} True if theObject implements all functions in theInterface, false otherwise.
 */
ClassHierarchiesTest.checkInterface = function(theImplementer, theInterface) {
    for (var member in theInterface.prototype) {
    	if (typeof theInterface.prototype[member] == "function") {
    		if (typeof theImplementer.prototype[member] != typeof theInterface.prototype[member]) {
    			console.log("function " + member + " is missing");
    			return false;
    		}
    	}
    }
    return true;
};

/* The following interfaces and classes are used to test the checkInterface() function itself */
ClassHierarchiesTest.Interface = {
	STATIC_VAR: "hello",
	ifFunction1: function() {},
	ifFunction2: function() {}
};

ClassHierarchiesTest.StaticClass = {
	ifFunction1: function() {},
	ifFunction2: function() {},
	otherFunction: function() {}
};

ClassHierarchiesTest.ImplementingClass = function() {

};

/**
 * Implemented function.
 */
ClassHierarchiesTest.ImplementingClass.prototype.ifFunction1 = function() {

};

/**
 * Implemented function.
 */
ClassHierarchiesTest.ImplementingClass.prototype.ifFunction2 = function() {

};

/**
 * Additional function.
 */
ClassHierarchiesTest.ImplementingClass.prototype.classFunction = function() {

};

/**
 * Tests if the interface implementation check works.
 */
ClassHierarchiesTest.prototype.testCheckInterface = function() {
	var object = new ClassHierarchiesTest.ImplementingClass();

	assertTrue(ClassHierarchiesTest.checkInterface(object, ClassHierarchiesTest.Interface));
	assertTrue(ClassHierarchiesTest.checkInterface(ClassHierarchiesTest.StaticClass, ClassHierarchiesTest.Interface));
};
