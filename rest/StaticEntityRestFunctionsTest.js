"use strict";

var StaticEntityRestFunctionsTest = TestCase("StaticEntityRestFunctionsTest");

/**
 * Tests the id comparison with firstBiggerThanSecond().
 */
StaticEntityRestFunctionsTest.prototype.testIdComparison = function() {
	var EntityRestInterface = tutao.rest.EntityRestInterface;
	assertTrue(EntityRestInterface.firstBiggerThanSecond("200", "100"));
	assertFalse(EntityRestInterface.firstBiggerThanSecond("100", "200"));
	assertFalse(EntityRestInterface.firstBiggerThanSecond("100", "100"));
	assertTrue(EntityRestInterface.firstBiggerThanSecond("1", "0"));
	assertTrue(EntityRestInterface.firstBiggerThanSecond("1000", "200"));
	assertFalse(EntityRestInterface.firstBiggerThanSecond("666666666666666666666666666666", "777777777777777777777777777777"));
	assertTrue(EntityRestInterface.firstBiggerThanSecond("1666666666666666666666666666666", "777777777777777777777777777777"));
	assertTrue(EntityRestInterface.firstBiggerThanSecond("------200000", "------100000"));
};