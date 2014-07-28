"use strict";

JsHamcrest.Integration.JsTestDriver();
//JsMockito.Integration.JsTestDriver();

TestCase("ObservableTest", {
	setUp: function() {
		this.observable = new tutao.event.Observable();
	},
	"test that observers are added and removed": function() {
		var o = JsMockito.mockFunction();
		assertEquals([], this.observable._observers);
		this.observable.addObserver(o);
		assertEquals([o], this.observable._observers);
		this.observable.removeObserver(o);
		assertEquals([], this.observable._observers);
	},
	"test that observers are notified": function() {
		var o = JsMockito.mockFunction();
		this.observable.addObserver(o);
		this.observable.notifyObservers("testdata");
		JsMockito.verify(o)("testdata");
		assertTrue(true); // dummy assertion as buster needs each test to contain of at least one assertion
	}
});