"use strict";

describe("ClassHierarchiesTest", function () {

    var assert = chai.assert;

    it("should confirm that interfaces are implemented correctly", function () {
        // db
        assert.isTrue(ClassHierarchiesTest.checkInterface(tutao.db.DummyDb, tutao.db.DbInterface));
        assert.isTrue(ClassHierarchiesTest.checkInterface(tutao.db.WebSqlDb, tutao.db.DbInterface));

        // crypto
        assert.isTrue(ClassHierarchiesTest.checkInterface(tutao.crypto.SjclAes, tutao.crypto.AesInterface));
        assert.isTrue(ClassHierarchiesTest.checkInterface(tutao.crypto.SjclAes256Gcm, tutao.crypto.AesInterface));
        assert.isTrue(ClassHierarchiesTest.checkInterface(tutao.crypto.AesSelector, tutao.crypto.AesInterface));
        assert.isTrue(ClassHierarchiesTest.checkInterface(tutao.crypto.SjclRandomizer, tutao.crypto.RandomizerInterface));
        assert.isTrue(ClassHierarchiesTest.checkInterface(tutao.crypto.JBCryptAdapter, tutao.crypto.KdfInterface));
        assert.isTrue(ClassHierarchiesTest.checkInterface(tutao.crypto.SjclSha256, tutao.crypto.ShaInterface));
        assert.isTrue(ClassHierarchiesTest.checkInterface(tutao.crypto.SjclAes256GcmAsync, tutao.crypto.AesInterfaceAsync));
        assert.isTrue(ClassHierarchiesTest.checkInterface(tutao.crypto.SjclAes128CbcAsync, tutao.crypto.AesInterfaceAsync));
        assert.isTrue(ClassHierarchiesTest.checkInterface(tutao.crypto.WebCryptoAes256GcmAsync, tutao.crypto.AesInterfaceAsync));

        // native
        assert.isTrue(ClassHierarchiesTest.checkInterface(tutao.native.ContactApp, tutao.native.ContactInterface));
        assert.isTrue(ClassHierarchiesTest.checkInterface(tutao.native.ContactBrowser, tutao.native.ContactInterface));

        assert.isTrue(ClassHierarchiesTest.checkInterface(tutao.native.CryptoBrowser, tutao.native.CryptoInterface));

        assert.isTrue(ClassHierarchiesTest.checkInterface(tutao.native.FileFacadeApp, tutao.native.FileFacade));
        assert.isTrue(ClassHierarchiesTest.checkInterface(tutao.native.FileFacadeBrowser, tutao.native.FileFacade));

        assert.isTrue(ClassHierarchiesTest.checkInterface(tutao.native.NotificationApp, tutao.native.NotificationInterface));
        assert.isTrue(ClassHierarchiesTest.checkInterface(tutao.native.NotificationBrowser, tutao.native.NotificationInterface));

        // entity rest
        assert.isTrue(ClassHierarchiesTest.checkInterface(tutao.rest.EntityRestClient, tutao.rest.EntityRestInterface));
        assert.isTrue(ClassHierarchiesTest.checkInterface(tutao.rest.EntityRestDummy, tutao.rest.EntityRestInterface));
        assert.isTrue(ClassHierarchiesTest.checkInterface(tutao.rest.EntityRestCache, tutao.rest.EntityRestInterface));

        assert.isTrue(ClassHierarchiesTest.checkInterface(tutao.tutanota.ctrl.AdminBuyAliasViewModel, tutao.tutanota.ctrl.BuyFeatureViewModel));
        assert.isTrue(ClassHierarchiesTest.checkInterface(tutao.tutanota.ctrl.AdminBuyStorageViewModel, tutao.tutanota.ctrl.BuyFeatureViewModel));
    });

    it("CheckInterface ", function () {
        var object = new ClassHierarchiesTest.ImplementingClass();

        assert.isTrue(ClassHierarchiesTest.checkInterface(object, ClassHierarchiesTest.Interface));
        assert.isTrue(ClassHierarchiesTest.checkInterface(ClassHierarchiesTest.StaticClass, ClassHierarchiesTest.Interface));
    });

});

tutao.provide('ClassHierarchiesTest');

/**
 * Checks that theObject implements all functions defined in theInterface.
 * @param {Object} theImplementer The implementing object or class with static function to check.
 * @param {Object} theInterface The interface that provides the functions.
 * @return {Boolean} True if theObject implements all functions in theInterface, false otherwise.
 */
ClassHierarchiesTest.checkInterface = function(theImplementer, theInterface) {
    for (var member in theInterface.prototype) {
        if (typeof theInterface.prototype[member] == "function") {
            if (typeof theImplementer.prototype[member] != typeof theInterface.prototype[member]) {
                console.log("function " + member + " is missing");
                return false;
            }
        }
    }
    return true;
};

/* The following interfaces and classes are used to test the checkInterface() function itself */
ClassHierarchiesTest.Interface = {
    STATIC_VAR: "hello",
    ifFunction1: function() {},
    ifFunction2: function() {}
};

ClassHierarchiesTest.StaticClass = {
    ifFunction1: function() {},
    ifFunction2: function() {},
    otherFunction: function() {}
};

ClassHierarchiesTest.ImplementingClass = function() {

};

/**
 * Implemented function.
 */
ClassHierarchiesTest.ImplementingClass.prototype.ifFunction1 = function() {

};

/**
 * Implemented function.
 */
ClassHierarchiesTest.ImplementingClass.prototype.ifFunction2 = function() {

};

/**
 * Additional function.
 */
ClassHierarchiesTest.ImplementingClass.prototype.classFunction = function() {

};
