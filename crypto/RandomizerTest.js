"use strict";

goog.provide('RandomizerTest');

var RandomizerTest = TestCase("RandomizerTest");

RandomizerTest.prototype.test = function() {
	var r = tutao.locator.randomizer;
	for (var i=1; i<20; i++) {
		assertEquals(i * 2, r.generateRandomData(i).length);
	}
};

RandomizerTest.prototype.testSeeding = function() {
	var r = new tutao.crypto.SjclRandomizer();
	assertFalse(r.isReady());
	try {
		r.generateRandomData(1);
		fail("could generate random data");
	} catch (e) {
		assertInstanceOf(tutao.crypto.CryptoException, e);
	}
	r.addEntropy(10, 255, tutao.crypto.RandomizerInterface.ENTROPY_SRC_MOUSE);
	assertFalse(r.isReady());
	try {
		r.generateRandomData(1);
		fail("could generate random data");
	} catch (e) {
		assertInstanceOf(tutao.crypto.CryptoException, e);
	}
	r.addEntropy(10, 1, tutao.crypto.RandomizerInterface.ENTROPY_SRC_KEY);
	assertTrue(r.isReady());
	assertNotNull(r.generateRandomData(1)); // must work now
};