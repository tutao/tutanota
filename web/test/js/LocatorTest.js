"use strict";

describe("LocatorTest", function () {

    var assert = chai.assert;


    beforeEach(function () {
    });


    it(" if getters are defined for all provided classes", function () {
        var Mail = function () {
        };
        var locator = new tutao.Locator({'mail': Mail});
        assert.isTrue(locator.mail instanceof Mail);
    });

    it(" that only one instance is created and cached for later user", function () {
        var Mail = function () {
        };
        var locator = new tutao.Locator({'mail': Mail});
        var mail1 = locator.mail;
        var mail2 = locator.mail;
        assert.isTrue(mail1 === mail2, "not the same");
    });

    it(" that new instances are created after invoking reset", function () {
        var Mail = JsMockito.mockFunction();
        var locator = new tutao.Locator({'mail': Mail});
        var mail1 = locator.mail;
        locator.reset();
        var mail2 = locator.mail;
        assert.isFalse(mail1 === mail2, "should not be the same");
        assert.deepEqual(mail1, mail2);
    });

    it(" that it works with multiple instances", function () {
        var Mail = function () {
        };
        var Body = function () {
        };
        var locator = new tutao.Locator({'mail': Mail, 'body': Body});
        var mail = locator.mail;
        var body = locator.body;
        assert.isTrue(mail instanceof Mail);
        assert.isTrue(body instanceof Body);
    });

    it(" that a another instance is server after replacing", function () {
        var Mail = function () {
        };
        var Mock = function () {
        };
        var locator = new tutao.Locator({'mail': Mail});
        var mock = new Mock();
        locator.replace('mail', mock);
        var mail = locator.mail;
        assert.isTrue(mail === mock, "not the same");
    });


});