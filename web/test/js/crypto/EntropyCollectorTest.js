"use strict";

describe("EntropyCollectorTest", function () {

    var assert = chai.assert;

    beforeEach(function () {
        this.collector = new tutao.crypto.EntropyCollector();
    });


    afterEach(function () {
        this.collector.stop();
        tutao.locator.reset();
    });


    it("MouseclickNotStarted ", function () {
        tutao.locator.randomizer.addEntropy = function() {
            assert.fail("not started but listened to mouse events");
        };

        var e = $.extend($.Event("mouseclick"), {pageX: 888, pageY: 777});
        $("body").trigger(e);
    });

    it("Mouseclick ", function (done) {
        this.collector.start();
        tutao.locator.randomizer.addEntropy = function (number, entropy, source) {
            assert.equal(888 ^ 777, number);
            assert.equal(2, entropy);
            assert.equal("mouse", source);
            done();
        };

        var e = $.extend($.Event("mouseclick"), {pageX: 888, pageY: 777});
        $("body").trigger(e);
    });

    it("MousemoveNotStarted ", function () {
        tutao.locator.randomizer.addEntropy = function() {
            assert.fail("not started but listened to mouse events");
        };

        var e = $.extend($.Event("mousemove"), {pageX: 888, pageY: 777});
        $("body").trigger(e);
    });

    it("Mousemove ", function (done) {
        this.collector.start();
        tutao.locator.randomizer.addEntropy = function (number, entropy, source) {
            assert.equal(123 ^ 456, number);
            assert.equal(2, entropy);
            assert.equal("mouse", source);
            done();
        };

        var e = $.extend($.Event("mousemove"), {pageX: 123, pageY: 456});
        $("body").trigger(e);
    });

    it("KeydownNotStarted ", function () {
        tutao.locator.randomizer.addEntropy = function() {
            assert.fail("not started but listened to key events");
        };

        var e = $.extend($.Event("keydown"), {keyCode: '48'});
        $("body").trigger(e);
    });

    it("Mousemove2 ", function (done) {
        this.collector.start();
        tutao.locator.randomizer.addEntropy = function (number, entropy, source) {
            assert.equal(48, number);
            assert.equal(2, entropy);
            assert.equal("key", source);
            done();
        };

        var e = $.extend($.Event("keydown"), {keyCode: '48'});
        $("body").trigger(e);
    });

    it("FetchMissingUrlsAddEntropy ", function (done) {
        this.timeout(4000);

        var alreadyInvoked = false;
        tutao.locator.randomizer.isReady = function () {
            if (alreadyInvoked) {
                return true;
            } else {
                alreadyInvoked = true;
                return false;
            }
        };

        tutao.locator.randomizer.addEntropy = function (number, entropy, source) {
            assert.isTrue(number > 10);
            assert.equal(4, entropy);
            assert.equal("ping", source);
            done();
        };

        this.collector.fetchMissingEntropy(function () {
        });
    });


});