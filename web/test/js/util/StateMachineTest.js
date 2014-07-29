"use strict";

describe("StateMachineTest", function () {

    var assert = chai.assert;


    beforeEach(function () {
    });


    it("Reset", function () {
        var s = new tutao.tutanota.util.StateMachine();
        s.addState("1", {}, null);
        s.addState("2", {}, null);
        s.addTransition("1", "e", "2");

        s.event("e");
        s.reset();
        assert.equal("1", s.getState());
    });

    it("Transition", function () {
        var s = new tutao.tutanota.util.StateMachine();
        s.addState("1", {}, null);
        s.addState("2", {}, null);
        s.addTransition("1", "e", "2");

        assert.equal("1", s.getState());
        s.event("e");
        assert.equal("2", s.getState());
    });

    it("Property", function () {
        var s = new tutao.tutanota.util.StateMachine();
        s.addState("1", {a: 1, b: 2}, null);
        s.addState("2", {a: 3, b: 4}, null);
        s.addTransition("1", "e", "2");

        assert.equal(1, s.getProperty('a'));
        assert.equal(2, s.getProperty('b'));
        s.event("e");
        assert.equal(3, s.getProperty('a'));
        assert.equal(4, s.getProperty('b'));
    });

    it("Trigger", function () {
        var s = new tutao.tutanota.util.StateMachine();
        var trigger = JsMockito.mockFunction();
        s.addState("1", {}, null);
        s.addState("2", {}, trigger);
        s.addTransition("1", "e", "2");

        JsMockito.verifyNoMoreInteractions(trigger);
        s.event("e");
        JsMockito.verify(trigger)();
    });

    it("FailStartStateWithTrigger", function () {
        var s = new tutao.tutanota.util.StateMachine();
        assert.throws(function () {
            s.addState("1", {}, function () {
            });
        }, Error);
    });

    it("FailInvalidTransitionSource", function () {
        var s = new tutao.tutanota.util.StateMachine();
        s.addState("1", {}, null);
        s.addState("2", {}, null);
        assert.throws(function () {
            s.addTransition("3", "e", "2");
        }, Error);
    });

    it("FailInvalidTransitionTarget", function () {
        var s = new tutao.tutanota.util.StateMachine();
        s.addState("1", {}, null);
        s.addState("2", {}, null);
        assert.throws(function () {
            s.addTransition("1", "e", "3");
        }, Error);
    });

    it("FailInvalidEvent", function () {
        var s = new tutao.tutanota.util.StateMachine();
        s.addState("1", {}, null);
        assert.throws(function () {
            s.event("e");
        }, Error);
    });

    it("FailDifferentProperties", function () {
        var s = new tutao.tutanota.util.StateMachine();
        s.addState("1", {a: 1, b: 2}, null);
        assert.throws(function () {
            s.addState("2", {a: 1, c: 2}, null);
        }, Error);
    });

    it("FailGetInvalidProperty", function () {
        var s = new tutao.tutanota.util.StateMachine();
        s.addState("1", {a: 1, b: 2}, null);
        assert.throws(function () {
            s.getProperty("c");
        }, Error);
    });

});