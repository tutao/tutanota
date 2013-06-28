"use strict";

goog.provide('DbTest');
//import('tutao.db.WebSqlDb');

AsyncTestCase("DbTest", {
	dbUnderTest: new tutao.db.WebSqlDb(),

	"test that elements with same words are found": function(queue) {
		if (!this.dbUnderTest.isSupported()) {
			return;
		}
		this.dbUnderTest.init("test_db");
		this.dbUnderTest.clear();
		var self = this;

		queue.call('test same words', function(callbacks) {
			// first we need to create a final callback that is called after the last assert. otherwise junit does not
			// show failures (it probably returns too early because the tests are run async)
			var finalCallback = callbacks.add(function() {});

			// fill db
			this.dbUnderTest.addIndexEntries(1, [2], "200", ["good", "morning", "what", "a", "nice", "day"]);
			this.dbUnderTest.addIndexEntries(1, [2], "300", ["what", "day", "is", "it", "today"]);
			this.dbUnderTest.addIndexEntries(1, [2], "400", ["it", "should", "rain", "today", "or", "next", "day"], function(status) {
				// query db
				// this must be in the callback of the last addIndexEntries, because otherwise the
				// getElementsByValue calls will be executed before the addIndexEntries calls and produce wrong results.
				self.dbUnderTest.getElementsByValue(1, [2], "what", callbacks.add(function(status, ids) {
					assertEquals(["200", "300"], ids);
				}));
				self.dbUnderTest.getElementsByValue(1, [2], "day", callbacks.add(function(status, ids) {
					assertEquals(["200", "300", "400"], ids);
				}));
				self.dbUnderTest.getElementsByValue(1, [2], "Day", callbacks.add(function(status, ids) {
					assertEquals([], ids);
				}));
				self.dbUnderTest.getElementsByValue(1, [2], "", callbacks.add(function(status, ids) {
					assertEquals([], ids);
				}));
				self.dbUnderTest.getElementsByValue(1, [2], "today", callbacks.add(function(status, ids) {
					assertEquals(["300", "400"], ids);
					finalCallback();
				}));
			});
		});
	},
	
	"test that elements of different type or attribute chain are not found": function(queue) {
		if (!this.dbUnderTest.isSupported()) {
			return;
		}
		this.dbUnderTest.init("test_db");
		this.dbUnderTest.clear();
		var self = this;

		queue.call('test different types', function(callbacks) {
			// first we need to create a final callback that is called after the last assert. otherwise junit does not
			// show failures (it probably returns too early because the tests are run async)
			var finalCallback = callbacks.add(function() {});

			// fill db
			this.dbUnderTest.addIndexEntries(2, [2], "100", ["day"]);
			this.dbUnderTest.addIndexEntries(1, [2], "200", ["day"]);
			this.dbUnderTest.addIndexEntries(1, [3], "300", ["day"]);
			this.dbUnderTest.addIndexEntries(1, [2, 1], "400", ["day"], function(status) {
				// query db
				self.dbUnderTest.getElementsByValue(2, [2], "day", callbacks.add(function(status, ids) {
					assertEquals(["100"], ids);
				}));
				self.dbUnderTest.getElementsByValue(1, [2], "day", callbacks.add(function(status, ids) {
					assertEquals(["200"], ids);
				}));
				self.dbUnderTest.getElementsByValue(1, [3], "day", callbacks.add(function(status, ids) {
					assertEquals(["300"], ids);
				}));
				self.dbUnderTest.getElementsByValue(1, [2, 1], "day", callbacks.add(function(status, ids) {
					assertEquals(["400"], ids);
					finalCallback();
				}));
			});
		});
	},
	
	"test deleting tables": function(queue) {
		if (!this.dbUnderTest.isSupported()) {
			return;
		}
		this.dbUnderTest.init("test_db");
		this.dbUnderTest.clear();
		var self = this;

		queue.call('test delete', function(callbacks) {
			// first we need to create a final callback that is called after the last assert. otherwise junit does not
			// show failures (it probably returns too early because the tests are run async)
			var finalCallback = callbacks.add(function() {});
			// check that the db is empty
			self.dbUnderTest.getElementsByValue(1, [2], "what", callbacks.add(function(status, ids) {
				assertEquals([], ids);
				// add an entry
				this.dbUnderTest.addIndexEntries(1, [2], "200", ["what"], function() {
					// check that the entry is visible
					self.dbUnderTest.getElementsByValue(1, [2], "what", callbacks.add(function(status, ids) {
						assertEquals(["200"], ids);
						// clear the database
						this.dbUnderTest.clear(function() {
							// check that the db is empty
							self.dbUnderTest.getElementsByValue(1, [2], "what", callbacks.add(function(status, ids) {
								assertEquals([], ids);
								finalCallback();
							}));
						});
					}));
				});
			}));
		});
	},
	
	"test setting and getting indexed info": function(queue) {
		if (!this.dbUnderTest.isSupported()) {
			return;
		}
		var self = this;
		
		queue.call('test indexed info', function(callbacks) {
			// first we need to create a final callback that is called after the last assert. otherwise junit does not
			// show failures (it probably returns too early because the tests are run async)
			var finalCallback = callbacks.add(function() {});

			this.dbUnderTest.init("test_db", callbacks.add(function(status) {
				this.dbUnderTest.clear(callbacks.add(function(status) {
					// check that no element is indexed
					self.dbUnderTest.getLastIndexed(1, callbacks.add(function(status, elementId) {
						assertEquals(null, elementId);
						// add an indexed element
						self.dbUnderTest.setIndexed(1, "100", callbacks.add(function(status) {
							// store another typeId to make sure that it does not interfere
							self.dbUnderTest.setIndexed(2, "300", callbacks.add(function(status) {
								// check that the last indexed element is correct
								self.dbUnderTest.getLastIndexed(1, callbacks.add(function(status, elementId) {
									assertEquals("100", elementId);
									// overwrite the last indexed element
									self.dbUnderTest.setIndexed(1, "200", callbacks.add(function(status) {
										// check that overwriting has worked
										self.dbUnderTest.getLastIndexed(1, callbacks.add(function(status, elementId) {
											assertEquals("200", elementId);
											finalCallback();
										}));
									}));
								}));
							}));
						}));
					}));
				}));
			}));
		});
	},
	
	"test deleting index entries": function(queue) {
		if (!this.dbUnderTest.isSupported()) {
			return;
		}
		var self = this;
		
		queue.call('test delete', function(callbacks) {
			// first we need to create a final callback that is called after the last assert. otherwise junit does not
			// show failures (it probably returns too early because the tests are run async)
			var finalCallback = callbacks.add(function() {});

			self.dbUnderTest.init("test_db", callbacks.add(function(status) {
				self.dbUnderTest.clear(callbacks.add(function(status) {
					// add index entries for two elements
					self.dbUnderTest.addIndexEntries(1, [2], "600", ["or", "next", "go"], callbacks.add(function(status) {
						self.dbUnderTest.addIndexEntries(1, [2], "500", ["or", "next", "day"], callbacks.add(function(status) {
							// check that both elements are returned
							self.dbUnderTest.getElementsByValue(1, [2], "next", callbacks.add(function(status, ids) {
								assertEquals(["500", "600"], ids.sort());
								// remove the first element
								self.dbUnderTest.removeIndexEntries(1, [[2]], "500", callbacks.add(function(status) {
									// check that only the second element is returned
									self.dbUnderTest.getElementsByValue(1, [2], "next", callbacks.add(function(status, ids) {
										assertEquals(["600"], ids);
										finalCallback();
									}));
								}));
							}));
						}));
					}));
				}));
			}));
		});
	}
});
