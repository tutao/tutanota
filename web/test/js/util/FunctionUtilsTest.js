"use strict";

goog.provide('FunctionUtilsTest');

var FunctionUtilsTest = TestCase("FunctionUtilsTest");

FunctionUtilsTest.prototype.testBindPrototypeMethodsToThis = function() {
	var A = function() {
		tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	};
	A.prototype.method = function() { 
		return this;
	};
	
	var a = new A();
	assertEquals(a, a.method.call("this is not <this>"));
};
