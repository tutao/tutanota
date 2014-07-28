"use strict";

goog.provide('StateMachineTest');

TestCase("StateMachineTest", {
	
	setUp: function() {
	},
	
	"testReset": function() {
		var s = new tutao.tutanota.util.StateMachine();
		s.addState("1", {}, null);
		s.addState("2", {}, null);
		s.addTransition("1", "e", "2");
		
		s.event("e");
		s.reset();
		assertEquals("1", s.getState());
	},
	
	"testTransition": function() {
		var s = new tutao.tutanota.util.StateMachine();
		s.addState("1", {}, null);
		s.addState("2", {}, null);
		s.addTransition("1", "e", "2");

		assertEquals("1", s.getState());
		s.event("e");
		assertEquals("2", s.getState());
	},
	
	"testProperty": function() {
		var s = new tutao.tutanota.util.StateMachine();
		s.addState("1", {a: 1, b: 2}, null);
		s.addState("2", {a: 3, b: 4}, null);
		s.addTransition("1", "e", "2");

		assertEquals(1, s.getProperty('a'));
		assertEquals(2, s.getProperty('b'));
		s.event("e");
		assertEquals(3, s.getProperty('a'));
		assertEquals(4, s.getProperty('b'));
	},
	
	"testTrigger": function() {
		var s = new tutao.tutanota.util.StateMachine();
		var trigger = JsMockito.mockFunction();
		s.addState("1", {}, null);
		s.addState("2", {}, trigger);
		s.addTransition("1", "e", "2");

		JsMockito.verifyNoMoreInteractions(trigger);
		s.event("e");
		JsMockito.verify(trigger)();
	},
	
	"testFailStartStateWithTrigger": function() {
		var s = new tutao.tutanota.util.StateMachine();
		assertException(function() { s.addState("1", {}, function() {}); }, "Error");
	},
	
	"testFailInvalidTransitionSource": function() {
		var s = new tutao.tutanota.util.StateMachine();
		s.addState("1", {}, null);
		s.addState("2", {}, null);
		assertException(function() { s.addTransition("3", "e", "2"); }, "Error");
	},
	
	"testFailInvalidTransitionTarget": function() {
		var s = new tutao.tutanota.util.StateMachine();
		s.addState("1", {}, null);
		s.addState("2", {}, null);
		assertException(function() { s.addTransition("1", "e", "3"); }, "Error");
	},

	"testFailInvalidEvent": function() {
		var s = new tutao.tutanota.util.StateMachine();
		s.addState("1", {}, null);
		assertException(function() { s.event("e"); }, "Error");
	},
	
	"testFailDifferentProperties": function() {
		var s = new tutao.tutanota.util.StateMachine();
		s.addState("1", {a: 1, b: 2}, null);
		assertException(function() { s.addState("2", {a: 1, c: 2}, null); }, "Error");
	},
	
	"testFailGetInvalidProperty": function() {
		var s = new tutao.tutanota.util.StateMachine();
		s.addState("1", {a: 1, b: 2}, null);
		assertException(function() { s.getProperty("c"); }, "Error");
	}
});