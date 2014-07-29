"use strict";

describe("ObservableTest", function () {

    var assert = chai.assert;


    beforeEach(function () {
        this.observable = new tutao.event.Observable();
    });

    it(" that observers are added and removed", function () {
        var o = JsMockito.mockFunction();
        assert.deepEqual([], this.observable._observers);
        this.observable.addObserver(o);
        assert.deepEqual([o], this.observable._observers);
        this.observable.removeObserver(o);
        assert.deepEqual([], this.observable._observers);
    });

    it(" that observers are notified", function () {
        var o = JsMockito.mockFunction();
        this.observable.addObserver(o);
        this.observable.notifyObservers("testdata");
        JsMockito.verify(o)("testdata");
        assert.isTrue(true); // dummy assertion as buster needs each test to contain of at least one assertion
    });


});