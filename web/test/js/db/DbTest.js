"use strict";

describe("DbTest", function () {

    var assert = chai.assert;

    before(function () {
        this.dbUnderTest = new tutao.db.WebSqlDb();
    })

    it(" that elements with same words are found", function (done) {
        var self = this;
        if (!this.dbUnderTest.isSupported()) {
            return;
        }
        this.dbUnderTest.init("test_db");
        this.dbUnderTest.clear();

        // fill db
        this.dbUnderTest.addIndexEntries(1, [2], "200", ["good", "morning", "what", "a", "nice", "day"]);
        this.dbUnderTest.addIndexEntries(1, [2], "300", ["what", "day", "is", "it", "today"]);
        this.dbUnderTest.addIndexEntries(1, [2], "400", ["it", "should", "rain", "today", "or", "next", "day"], function (status) {
            // query db
            // must be in the callback of the last addIndexEntries, because otherwise the
            // getElementsByValue calls will be executed before the addIndexEntries calls and produce wrong results.
            self.dbUnderTest.getElementsByValue(1, [2], "what", function (status, ids) {
                assert.deepEqual(["200", "300"], ids);
            });
            self.dbUnderTest.getElementsByValue(1, [2], "day", function (status, ids) {
                assert.deepEqual(["200", "300", "400"], ids);
            });
            self.dbUnderTest.getElementsByValue(1, [2], "Day", function (status, ids) {
                assert.deepEqual([], ids);
            });
            self.dbUnderTest.getElementsByValue(1, [2], "", function (status, ids) {
                assert.deepEqual([], ids);
            });
            self.dbUnderTest.getElementsByValue(1, [2], "today", function (status, ids) {
                assert.deepEqual(["300", "400"], ids);
                done();
            });
        });
    });

    it(" that elements of different type or attribute chain are not found", function (done) {
        var self = this;
        if (!this.dbUnderTest.isSupported()) {
            return;
        }
        this.dbUnderTest.init("test_db");
        this.dbUnderTest.clear();

        // fill db
        this.dbUnderTest.addIndexEntries(2, [2], "100", ["day"]);
        this.dbUnderTest.addIndexEntries(1, [2], "200", ["day"]);
        this.dbUnderTest.addIndexEntries(1, [3], "300", ["day"]);
        this.dbUnderTest.addIndexEntries(1, [2, 1], "400", ["day"], function (status) {
            // query db
            self.dbUnderTest.getElementsByValue(2, [2], "day", function (status, ids) {
                assert.deepEqual(["100"], ids);
            });
            self.dbUnderTest.getElementsByValue(1, [2], "day", function (status, ids) {
                assert.deepEqual(["200"], ids);
            });
            self.dbUnderTest.getElementsByValue(1, [3], "day", function (status, ids) {
                assert.deepEqual(["300"], ids);
            });
            self.dbUnderTest.getElementsByValue(1, [2, 1], "day", function (status, ids) {
                assert.deepEqual(["400"], ids);
                done();
            });
        });
    });

    it(" deleting tables", function (done) {
        var self = this;
        if (!this.dbUnderTest.isSupported()) {
            return;
        }
        this.dbUnderTest.init("test_db");
        this.dbUnderTest.clear();

        // check that the db is empty
        self.dbUnderTest.getElementsByValue(1, [2], "what", function (status, ids) {
            assert.deepEqual([], ids);
            // add an entry
            self.dbUnderTest.addIndexEntries(1, [2], "200", ["what"], function () {
                // check that the entry is visible
                self.dbUnderTest.getElementsByValue(1, [2], "what", function (status, ids) {
                    assert.deepEqual(["200"], ids);
                    // clear the database
                    self.dbUnderTest.clear(function () {
                        // check that the db is empty
                        self.dbUnderTest.getElementsByValue(1, [2], "what", function (status, ids) {
                            assert.deepEqual([], ids);
                            done();
                        });
                    });
                });
            });
        });
    });

    it(" setting and getting indexed info", function (done) {
        var self = this;
        if (!this.dbUnderTest.isSupported()) {
            return;
        }

        this.dbUnderTest.init("test_db", function (status) {
            self.dbUnderTest.clear(function (status) {
                // check that no element is indexed
                self.dbUnderTest.getLastIndexed(1, function (status, elementId) {
                    assert.equal(null, elementId);
                    // add an indexed element
                    self.dbUnderTest.setIndexed(1, "100", function (status) {
                        // store another typeId to make sure that it does not interfere
                        self.dbUnderTest.setIndexed(2, "300", function (status) {
                            // check that the last indexed element is correct
                            self.dbUnderTest.getLastIndexed(1, function (status, elementId) {
                                assert.equal("100", elementId);
                                // overwrite the last indexed element
                                self.dbUnderTest.setIndexed(1, "200", function (status) {
                                    // check that overwriting has worked
                                    self.dbUnderTest.getLastIndexed(1, function (status, elementId) {
                                        assert.equal("200", elementId);
                                        done();
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    it(" deleting index entries", function (done) {
        var self = this;
        if (!this.dbUnderTest.isSupported()) {
            return;
        }

        this.dbUnderTest.init("test_db", function (status) {
            self.dbUnderTest.clear(function (status) {
                // add index entries for two elements
                self.dbUnderTest.addIndexEntries(1, [2], "600", ["or", "next", "go"], function (status) {
                    self.dbUnderTest.addIndexEntries(1, [2], "500", ["or", "next", "day"], function (status) {
                        // check that both elements are returned
                        self.dbUnderTest.getElementsByValue(1, [2], "next", function (status, ids) {
                            assert.deepEqual(["500", "600"], ids.sort());
                            // remove the first element
                            self.dbUnderTest.removeIndexEntries(1, [
                                [2]
                            ], "500", function (status) {
                                // check that only the second element is returned
                                self.dbUnderTest.getElementsByValue(1, [2], "next", function (status, ids) {
                                    assert.deepEqual(["600"], ids);
                                    done();
                                });
                            });
                        });
                    });
                });
            });
        });
    });


});