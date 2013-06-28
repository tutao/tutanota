"use strict";

goog.provide('BaseTest');

var BaseTest = TestCase("BaseTest");

BaseTest.prototype.test = function() {
	goog.provide("test.hello.yuhu");
	assertEquals({}, test.hello.yuhu);
};

//BaseTest.prototype.testGettersAndSetters = function() {
//	function A() {};
//	A.prototype.__defineSetter__('test', function(param) {this._test = param;});
//	A.prototype.__defineGetter__('test',function() {return this._test + 1;});
//	A.prototype.__defineSetter__('that', function(param) {this._that = param;});
//	A.prototype.__defineGetter__('that',function() {return this._that + 1;});
//	var a = new A();
//	a.test = 5;
//	assertEquals(6, a.test);
//	
//	function B() {};
//	tutao.inherit(B, A);
//	// test proxying a setter
//	B.prototype.__defineGetter__('test2',function() {return this.test + 2;});
//	// test overwriting a setter
//	B.prototype.__defineGetter__('that',function() {return this._that + 4;});
//	//B.prototype.__defineSetter__('that',function(param) {this._that = param;});
//	var b = new B();
//	b.test = 5;
//	assertEquals(8, b.test2);
//	// this does not work if no setter is defined on the subclass. why?
//	// b.that = 9;
//	// assertEquals(13, b.that);
//};
