"use strict";

var EntityRestCacheTest = AsyncTestCase("EntityRestCacheTest");

JsHamcrest.Integration.JsTestDriver();
//JsMockito.Integration.JsTestDriver();

EntityRestCacheTest.prototype.setUp = function(queue) {
	var cache = new tutao.rest.EntityRestCache();
    this.entityRestSpy = JsMockito.spy(new tutao.rest.EntityRestDummy());
	cache.setTarget(this.entityRestSpy);
	tutao.locator.replace('entityRestClient', cache);

	var key = tutao.locator.aesCrypter.generateRandomKey();
	tutao.locator.userController.getUserId = JsMockito.mockFunction();
	tutao.locator.userController.getUserGroupId = JsMockito.mockFunction();
	tutao.locator.userController.getUserGroupKey = JsMockito.mockFunction();
	JsMockito.when(tutao.locator.userController.getUserId)().thenReturn("-34---------");
	JsMockito.when(tutao.locator.userController.getUserGroupId)().thenReturn("-35---------");
	JsMockito.when(tutao.locator.userController.getUserGroupKey)().thenReturn(key);
};

EntityRestCacheTest.prototype.tearDown = function() {
	tutao.locator.reset();
};


EntityRestTestFunctions.addFunctionsToTestPrototype(EntityRestCacheTest);

EntityRestCacheTest.prototype.testLoadRangeFromMin = function(queue) {
    var self = this;
    var localListId = "";
    var localMailElements = [];
    queue.call('Step 1: load range from min expecting to get elements from target', function(callbacks) {
        return self.initMailElements(callbacks).then(callbacks.add(function(testSetup) {
            localListId = testSetup.mailListId;
            localMailElements = testSetup.mailList;
            var startElementId = tutao.rest.EntityRestInterface.GENERATED_MIN_ID;
            var expectedTargetStartElementId = tutao.rest.EntityRestInterface.GENERATED_MIN_ID;
            return self.getElementRange( localListId,startElementId, 10, false).then(callbacks.add(function(loadedElements) {
                assertEquals(10, loadedElements.length);
                self.verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 10, false);
                self.checkEntityRestCache(localListId, 10, startElementId,  self.getElementId(localMailElements[9]));
                assertEquals(self.getElementId(localMailElements[0]), self.getFirstCachedElementRangeId(localListId));
                assertEquals(self.getElementId(localMailElements[9]), self.getLastCachedElementRangeId(localListId));
            }));
        }))
    });

    queue.call('Step 2: load range from min expecting to get elements from cache - all requested elements are stored in cache', function(callbacks) {
        var startElementId = tutao.rest.EntityRestInterface.GENERATED_MIN_ID;
        var expectedTargetStartElementId = tutao.rest.EntityRestInterface.GENERATED_MIN_ID;
        return self.getElementRange( localListId, startElementId, 10, false).then(callbacks.add(function(loadedElements) {
            assertEquals(10, loadedElements.length);
            JsMockito.verifyNoMoreInteractions(self.entityRestSpy);// No calls to target expected
            self.checkEntityRestCache(localListId, 10, startElementId,  self.getElementId(localMailElements[9]));
            assertEquals(self.getElementId(localMailElements[0]), self.getFirstCachedElementRangeId(localListId));
            assertEquals(self.getElementId(localMailElements[9]), self.getLastCachedElementRangeId(localListId));
        }));
    });

    queue.call('Step 3: load range from min expecting to get elements from cache - request more elements than available in cache', function(callbacks) {
        var startElementId = tutao.rest.EntityRestInterface.GENERATED_MIN_ID;
        var expectedTargetStartElementId = self.getLastCachedElementRangeId(localListId); // Expected start element is the last element of the cached mail elements.
        return self.getElementRange(localListId, startElementId, 11, false).then(callbacks.add(function(loadedElements) {
            assertEquals(10, loadedElements.length);
            self.verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 1, false );
            JsMockito.verifyNoMoreInteractions(self.entityRestSpy);
            self.checkEntityRestCache(localListId, 10, startElementId,  self.getElementId(localMailElements[9]));
            assertEquals(self.getElementId(localMailElements[0]), self.getFirstCachedElementRangeId(localListId));
            assertEquals(self.getElementId(localMailElements[9]), self.getLastCachedElementRangeId(localListId));
        }));
    });
};


EntityRestCacheTest.prototype.testLoadRangeFromMax = function(queue) {
    var self = this;
    var localListId = "";
    var localMailElements = [];
    queue.call('Step 1: load range from max expecting to get elements from target', function(callbacks) {
        return self.initMailElements(callbacks).then(callbacks.add(function(testSetup) {
            localListId = testSetup.mailListId;
            localMailElements = testSetup.mailList;
            var startElementId = tutao.rest.EntityRestInterface.GENERATED_MAX_ID;
            var expectedTargetStartElementId = tutao.rest.EntityRestInterface.GENERATED_MAX_ID;
            return self.getElementRange( localListId, startElementId, 10, true).then(callbacks.add(function(loadedElements) {
                assertEquals(10, loadedElements.length);
                self.verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 10, true);
                self.checkEntityRestCache(localListId, 10, self.getElementId(localMailElements[0]), startElementId);
                assertEquals(self.getElementId(localMailElements[0]), self.getFirstCachedElementRangeId(localListId));
                assertEquals(self.getElementId(localMailElements[9]), self.getLastCachedElementRangeId(localListId));
            }));
        }))
    });

    queue.call('Step 2: load range from max expecting to get elements from cache - all requested elements are stored in cache', function(callbacks) {
        var startElementId = tutao.rest.EntityRestInterface.GENERATED_MAX_ID;
        var expectedTargetStartElementId = self.getFirstCachedElementRangeId(localListId); // Expected start element is the last element of the cached mail elements.
        return self.getElementRange( localListId, startElementId, 10, true).then( callbacks.add(function(loadedElements) {
            assertEquals(10, loadedElements.length);
            JsMockito.verifyNoMoreInteractions(self.entityRestSpy); // No calls to target expected
            self.checkEntityRestCache(localListId, 10, self.getElementId(localMailElements[0]), startElementId);
            assertEquals(self.getElementId(localMailElements[0]), self.getFirstCachedElementRangeId(localListId));
            assertEquals(self.getElementId(localMailElements[9]), self.getLastCachedElementRangeId(localListId));
        }));
    });

    queue.call('Step 3: load range from may expecting to get elements from cache - request more elements than available in cache', function(callbacks) {
        var startElementId = tutao.rest.EntityRestInterface.GENERATED_MAX_ID;
        var expectedTargetStartElementId = self.getFirstCachedElementRangeId(localListId); // Expected start element is the last element of the cached mail elements.
        return self.getElementRange(localListId, startElementId, 11, true).then(callbacks.add(function(loadedElements) {
            assertEquals(10, loadedElements.length);
            self.verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 1, true );
            JsMockito.verifyNoMoreInteractions(self.entityRestSpy);
            self.checkEntityRestCache(localListId, 10, self.getElementId(localMailElements[0]), startElementId);
            assertEquals(self.getElementId(localMailElements[0]), self.getFirstCachedElementRangeId(localListId));
            assertEquals(self.getElementId(localMailElements[9]), self.getLastCachedElementRangeId(localListId));
        }));
    });
};




EntityRestCacheTest.prototype.testExtendRangeFromMin = function(queue) {
    var self = this;
    var localListId = "";
    var localMailElements = [];
    queue.call('Step 1: load range from min - expecting to get elements from target', function(callbacks) {
        return self.initMailElements(callbacks).then(callbacks.add(function(testSetup) {
            localListId = testSetup.mailListId;
            localMailElements = testSetup.mailList;
            var startElementId = tutao.rest.EntityRestInterface.GENERATED_MIN_ID;
            var expectedTargetStartElementId = tutao.rest.EntityRestInterface.GENERATED_MIN_ID;
            return self.getElementRange( localListId, startElementId, 2, false).then(callbacks.add(function(loadedElements) {
                assertEquals(2, loadedElements.length);
                self.checkEntityRestCache(localListId, 2, startElementId,  self.getElementId(localMailElements[1]));
                assertEquals(self.getElementId(localMailElements[0]), self.getFirstCachedElementRangeId(localListId));
                assertEquals(self.getElementId(localMailElements[1]), self.getLastCachedElementRangeId(localListId));
                self.verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 2, false);
            }));
        }))
    });

    queue.call('Step 2: load range from min - expecting to get elements from cache and target - extend the range', function(callbacks) {
        var startElementId = tutao.rest.EntityRestInterface.GENERATED_MIN_ID;
        var expectedTargetStartElementId = self.getLastCachedElementRangeId(localListId);
        return self.getElementRange( localListId , startElementId, 3, false).then(callbacks.add(function(loadedElements) {
            assertEquals(3, loadedElements.length);
            self.checkEntityRestCache(localListId, 3, startElementId,  self.getElementId(localMailElements[2]));
            assertEquals(self.getElementId(localMailElements[0]), self.getFirstCachedElementRangeId(localListId));
            assertEquals(self.getElementId(localMailElements[2]), self.getLastCachedElementRangeId(localListId));
            self.verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 1, false);
            JsMockito.verifyNoMoreInteractions(self.entityRestSpy);
        }));
    });

    queue.call('Step 3: load range from min - expecting to get elements from cache and target - extend the range', function(callbacks) {
        var startElementId = tutao.rest.EntityRestInterface.GENERATED_MIN_ID;
        var expectedTargetStartElementId = self.getLastCachedElementRangeId(localListId);
        return self.getElementRange(localListId, startElementId, 8, false).then(callbacks.add(function(loadedElements) {
            assertEquals(8, loadedElements.length);
            self.checkEntityRestCache(localListId, 8, startElementId,  self.getElementId(localMailElements[7]));
            assertEquals(self.getElementId(localMailElements[0]), self.getFirstCachedElementRangeId(localListId));
            assertEquals(self.getElementId(localMailElements[7]), self.getLastCachedElementRangeId(localListId));
            self.verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 5, false );
            JsMockito.verifyNoMoreInteractions(self.entityRestSpy);
        }));
    });

    queue.call('Step 4: load range from min - request more elements than available - expecting to get elements from cache and target - extend the range', function(callbacks) {
        var startElementId = tutao.rest.EntityRestInterface.GENERATED_MIN_ID;
        var expectedTargetStartElementId = self.getLastCachedElementRangeId(localListId);
        return self.getElementRange(localListId, startElementId, 11, false).then(callbacks.add(function(loadedElements) {
            assertEquals(10, loadedElements.length);
            self.checkEntityRestCache(localListId, 10, startElementId,  self.getElementId(localMailElements[9]));
            assertEquals(self.getElementId(localMailElements[0]), self.getFirstCachedElementRangeId(localListId));
            assertEquals(self.getElementId(localMailElements[9]), self.getLastCachedElementRangeId(localListId));
            self.verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 3 , false );
            JsMockito.verifyNoMoreInteractions(self.entityRestSpy);
        }));
    });

    queue.call('Step 5: load range from min - request more elements than available - expecting to request target', function(callbacks) {
        var startElementId = tutao.rest.EntityRestInterface.GENERATED_MIN_ID;
        var expectedTargetStartElementId = self.getLastCachedElementRangeId(localListId);
        return self.getElementRange(localListId, startElementId, 11, false).then(callbacks.add(function(loadedElements) {
            assertEquals(10, loadedElements.length);
            self.checkEntityRestCache(localListId, 10, startElementId,  self.getElementId(localMailElements[9]));
            assertEquals(self.getElementId(localMailElements[0]), self.getFirstCachedElementRangeId(localListId));
            assertEquals(self.getElementId(localMailElements[9]), self.getLastCachedElementRangeId(localListId));
            self.verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 1, false );
            JsMockito.verifyNoMoreInteractions(self.entityRestSpy);
        }));
    });
};



EntityRestCacheTest.prototype.testExtendRangeFromFirstElement = function(queue) {
    var self = this;
    var localListId = "";
    var localMailElements = [];
    queue.call('Step 1: load range from first element - expecting to get elements from target', function(callbacks) {
        return self.initMailElements(callbacks).then(callbacks.add(function(testSetup) {
            localListId = testSetup.mailListId;
            localMailElements = testSetup.mailList;
            var startElementId = self.getElementId(localMailElements[0]) ;
            var expectedTargetStartElementId = self.getElementId(localMailElements[0]) ;
            return self.getElementRange( localListId, startElementId, 2, false).then(callbacks.add(function(loadedElements) {
                assertEquals(2, loadedElements.length);
                self.verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 2, false);
                self.checkEntityRestCache(localListId, 2, startElementId, self.getElementId(localMailElements[2]) );
                // Requested start element id is not in range and not in cache
                assertEquals(self.getElementId(localMailElements[1]), self.getFirstCachedElementRangeId(localListId));
                assertEquals(self.getElementId(localMailElements[2]), self.getLastCachedElementRangeId(localListId));
            }));
        }))
    });

    queue.call('Step 2: load range from first cached element - expecting to get elements from cache and target - extend the range', function(callbacks) {
        var startElementId = self.getFirstCachedElementRangeId(localListId) ;
        var expectedTargetStartElementId = self.getLastCachedElementRangeId(localListId);
        return self.getElementRange( localListId, startElementId, 3, false).then(callbacks.add(function(loadedElements) {
            assertEquals(3, loadedElements.length);
            self.verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 2, false);
            self.checkEntityRestCache(localListId, 4, self.getElementId(localMailElements[0]), self.getElementId(localMailElements[4]) );  // Requested start element is the first element from cache therefore cache is increased by two values
            assertEquals(self.getElementId(localMailElements[1]), self.getFirstCachedElementRangeId(localListId));
            assertEquals(self.getElementId(localMailElements[4]), self.getLastCachedElementRangeId(localListId));
            JsMockito.verifyNoMoreInteractions(self.entityRestSpy);
        }));
    });

    queue.call('Step 3: load range from first cached element - expecting to get elements from cache and target - extend the range', function(callbacks) {
        var startElementId = self.getFirstCachedElementRangeId(localListId) ;
        var expectedTargetStartElementId = self.getLastCachedElementRangeId(localListId);
        return self.getElementRange(localListId, startElementId, 8, false).then(callbacks.add(function(loadedElements) {
            assertEquals(8, loadedElements.length);
            self.verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 5, false );
            self.checkEntityRestCache(localListId, 9, self.getElementId(localMailElements[0]), self.getElementId(localMailElements[9]) );  // Requested start element is the first element from cache therefore range size differ from loaded element size (see step 1)
            assertEquals(self.getElementId(localMailElements[1]), self.getFirstCachedElementRangeId(localListId));
            assertEquals(self.getElementId(localMailElements[9]), self.getLastCachedElementRangeId(localListId));
            JsMockito.verifyNoMoreInteractions(self.entityRestSpy);
        }));
    });

    queue.call('Step 4: load range from first cached element - request more elements than available - expecting to get elements from cache and target - extend the range', function(callbacks) {
        var startElementId = self.getFirstCachedElementRangeId(localListId) ;
        var expectedTargetStartElementId = self.getLastCachedElementRangeId(localListId);
        return self.getElementRange(localListId, startElementId, 11, false).then(callbacks.add(function(loadedElements) {
            assertEquals(8, loadedElements.length); // only 8 elements are loaded because start element is not returned
            self.verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 3 , false );
            self.checkEntityRestCache(localListId, 9, self.getElementId(localMailElements[0]), self.getElementId(localMailElements[9]) );  // Requested start element is the first element from cache therefore range size differ from loaded element size (see step 1)
            assertEquals(self.getElementId(localMailElements[1]), self.getFirstCachedElementRangeId(localListId));
            assertEquals(self.getElementId(localMailElements[9]), self.getLastCachedElementRangeId(localListId));
            JsMockito.verifyNoMoreInteractions(self.entityRestSpy);
        }));
    });

    queue.call('Step 5: load range from first - request more elements than available - expecting to request target', function(callbacks) {
        var startElementId = self.getElementId(localMailElements[0]); // Change the start element id
        var expectedTargetStartElementId = self.getLastCachedElementRangeId(localListId);
        return self.getElementRange(localListId, startElementId, 11, false).then(callbacks.add(function(loadedElements) {
            assertEquals(9, loadedElements.length);
            self.verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 2, false );
            self.checkEntityRestCache(localListId, 9, self.getElementId(localMailElements[0]), self.getElementId(localMailElements[9]) );  // Requested start element is the first element from cache therefore range size differ from loaded element size (see step 1)
            assertEquals(self.getElementId(localMailElements[1]), self.getFirstCachedElementRangeId(localListId));
            assertEquals(self.getElementId(localMailElements[9]), self.getLastCachedElementRangeId(localListId));
            JsMockito.verifyNoMoreInteractions(self.entityRestSpy);
        }));
    });
};



EntityRestCacheTest.prototype.testExtendRangeFromLastElement = function(queue) {
    var self = this;
    var localListId = "";
    var localMailElements = [];
    queue.call('Step 1: load range from last element - expecting to get elements from target', function(callbacks) {
        return self.initMailElements(callbacks).then(callbacks.add(function(testSetup) {
            localListId = testSetup.mailListId;
            localMailElements = testSetup.mailList;
            var startElementId = self.getElementId(localMailElements[9]); // last element in mail list
            var expectedTargetStartElementId = self.getElementId(localMailElements[9]) ;
            return self.getElementRange( localListId, startElementId, 2, true).then(callbacks.add(function(loadedElements, e) {
                assertEquals(2, loadedElements.length);
                self.verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 2, true);
                self.checkEntityRestCache(localListId, 2, self.getElementId(localMailElements[7]), self.getElementId(localMailElements[9]));
                // Requested start element id is not in range and not in cache
                assertEquals(self.getElementId(localMailElements[7]), self.getFirstCachedElementRangeId(localListId));
                assertEquals(self.getElementId(localMailElements[8]), self.getLastCachedElementRangeId(localListId));
            }));
        }))
    });

    queue.call('Step 2: load range from last cached element - expecting to get elements from cache and target - extend the range', function(callbacks) {
        var startElementId = self.getLastCachedElementRangeId(localListId) ;
        var expectedTargetStartElementId = self.getFirstCachedElementRangeId(localListId);
        return self.getElementRange( localListId, startElementId, 3, true).then(callbacks.add(function(loadedElements, e) {
            assertEquals(3, loadedElements.length);
            self.verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 2, true);
            self.checkEntityRestCache(localListId, 4, self.getElementId(localMailElements[5]), self.getElementId(localMailElements[9]) );  // Requested start element is the last element from cache therefore cache is increased by two values
            assertEquals(self.getElementId(localMailElements[5]), self.getFirstCachedElementRangeId(localListId));
            assertEquals(self.getElementId(localMailElements[8]), self.getLastCachedElementRangeId(localListId));
            JsMockito.verifyNoMoreInteractions(self.entityRestSpy);
        }));
    });

    queue.call('Step 3: load range from last cached element - expecting to get elements from cache and target - extend the range', function(callbacks) {
        var startElementId = self.getLastCachedElementRangeId(localListId) ;
        var expectedTargetStartElementId = self.getFirstCachedElementRangeId(localListId);
        return self.getElementRange(localListId, startElementId, 8, true).then(callbacks.add(function(loadedElements, e) {
            assertEquals(8, loadedElements.length);
            self.verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 5, true );
            self.checkEntityRestCache(localListId, 9, self.getElementId(localMailElements[0]), self.getElementId(localMailElements[9]) );
            assertEquals(self.getElementId(localMailElements[0]), self.getFirstCachedElementRangeId(localListId));
            assertEquals(self.getElementId(localMailElements[8]), self.getLastCachedElementRangeId(localListId));
            JsMockito.verifyNoMoreInteractions(self.entityRestSpy);
        }));
    });

    queue.call('Step 4: load range from last cached element - request more elements than available - expecting to get elements from cache and target - extend the range', function(callbacks) {
        var startElementId = self.getLastCachedElementRangeId(localListId) ;
        var expectedTargetStartElementId = self.getFirstCachedElementRangeId(localListId);
        return self.getElementRange(localListId, startElementId, 11, true).then(callbacks.add(function(loadedElements, e) {
            assertEquals(8, loadedElements.length); // only 8 elements are available because start element does not return
            self.verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 3, true );
            self.checkEntityRestCache(localListId, 9, self.getElementId(localMailElements[0]), self.getElementId(localMailElements[9]) );
            assertEquals(self.getElementId(localMailElements[0]), self.getFirstCachedElementRangeId(localListId));
            assertEquals(self.getElementId(localMailElements[8]), self.getLastCachedElementRangeId(localListId));
            JsMockito.verifyNoMoreInteractions(self.entityRestSpy);
        }));
    });

    queue.call('Step 5: load range from last element - request more elements than available - expecting to request target', function(callbacks) {
        var startElementId = self.getElementId(localMailElements[9]); // last element in mail list
        var expectedTargetStartElementId = self.getFirstCachedElementRangeId(localListId);
        return self.getElementRange(localListId, startElementId, 11, true).then(callbacks.add(function(loadedElements, e) {
            assertEquals(9, loadedElements.length);
            self.verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 2, true);
            self.checkEntityRestCache(localListId, 9, self.getElementId(localMailElements[0]), self.getElementId(localMailElements[9]) );
            assertEquals(self.getElementId(localMailElements[0]), self.getFirstCachedElementRangeId(localListId));
            assertEquals(self.getElementId(localMailElements[8]), self.getLastCachedElementRangeId(localListId));
            JsMockito.verifyNoMoreInteractions(self.entityRestSpy);
        }));
    });
};



EntityRestCacheTest.prototype.testExtendRangeFromOutsideElementMaxId = function(queue) {
    var self = this;
    var localListId = "";
    var localMailElements = [];
    queue.call('Step 1: load range from min expecting to get elements from target', function(callbacks) {
        return self.initMailElements(callbacks).then(callbacks.add(function(testSetup) {
            localListId = testSetup.mailListId;
            localMailElements = testSetup.mailList;
            return self.getElementRange( localListId,tutao.rest.EntityRestInterface.GENERATED_MIN_ID, 10, false).then(callbacks.add(function(loadedElements, e) {
                assertEquals(10, loadedElements.length);
                self.verifyGetElementRange(JsMockito.Verifiers.once(), localListId, tutao.rest.EntityRestInterface.GENERATED_MIN_ID, 10, false);
            }));
        }))
    });

    queue.call('Step 2: load range from max - not allowed', function(callbacks) {
        var startElementId = tutao.rest.EntityRestInterface.GENERATED_MAX_ID;
        return self.getElementRange( localListId, startElementId, 5, true).caught(callbacks.add(function(e) {
            assertNotUndefined(e);
            JsMockito.verifyNoMoreInteractions(self.entityRestSpy);// No calls to target expected
        }));
    });
};

EntityRestCacheTest.prototype.testExtendRangeFromOutsideElementMinId = function(queue) {
    var self = this;
    var localListId = "";
    var localMailElements = [];
    queue.call('Step 1: load range from max expecting to get elements from target', function(callbacks) {
        return self.initMailElements(callbacks).then(callbacks.add(function(testSetup) {
            localListId = testSetup.mailListId;
            localMailElements = testSetup.mailList;
            var startElementId = tutao.rest.EntityRestInterface.GENERATED_MAX_ID;
            return self.getElementRange( localListId, startElementId, 10, true).then(callbacks.add(function(loadedElements) {
                assertEquals(10, loadedElements.length);
                self.verifyGetElementRange(JsMockito.Verifiers.once(), localListId, startElementId, 10, true);
            }));
        }))
    });

    queue.call('Step 2: load range from min - not allowed', function(callbacks) {
        var startElementId = tutao.rest.EntityRestInterface.GENERATED_MIN_ID;
        return self.getElementRange( localListId, startElementId, 5, false).caught(callbacks.add(function(e) {
            assertNotUndefined(e);
            JsMockito.verifyNoMoreInteractions(self.entityRestSpy);// No calls to target expected
        }));
    });
};



EntityRestCacheTest.prototype.testExtendRangeFromOutsideElementId = function(queue) {
    var self = this;
    var localListId = "";
    var localMailElements = [];
    queue.call('Step 1: load range from element expecting to get elements from target', function(callbacks) {
        return self.initMailElements(callbacks).then(callbacks.add(function(testSetup) {
            localListId = testSetup.mailListId;
            localMailElements = testSetup.mailList;
            var startElementId = tutao.rest.EntityRestInterface.getElementId(localMailElements[2]);
            return self.getElementRange( localListId, startElementId, 5, false).then(callbacks.add(function(loadedElements) {
                assertEquals(5, loadedElements.length);
                self.verifyGetElementRange(JsMockito.Verifiers.once(), localListId, startElementId, 5, false);
            }));
        }))
    });

    queue.call('Step 2: load range from outer range element - not allowed', function(callbacks) {
        var startElementId = tutao.rest.EntityRestInterface.getElementId(localMailElements[8]);
        return self.getElementRange( localListId, startElementId, 5, true).caught(callbacks.add(function(e) {
            assertNotUndefined(e);
            JsMockito.verifyNoMoreInteractions(self.entityRestSpy);// No calls to target expected
        }));
    });
};




EntityRestCacheTest.prototype.testExtendRangeFromMax = function(queue) {
    var self = this;
    var localListId = "";
    var localMailElements = [];


    queue.call('Step 1: load range from max - expecting to get elements from target', function(callbacks) {
        return self.initMailElements(callbacks).then(callbacks.add(function(testSetup) {
            localListId = testSetup.mailListId;
            localMailElements = testSetup.mailList;
            var startElementId = tutao.rest.EntityRestInterface.GENERATED_MAX_ID;
            var expectedTargetStartElementId = tutao.rest.EntityRestInterface.GENERATED_MAX_ID;
            return self.getElementRange( localListId, startElementId, 2, true).then(callbacks.add(function(loadedElements) {
                assertEquals(2, loadedElements.length);
                self.checkEntityRestCache(localListId, 2, self.getElementId(localMailElements[8]), startElementId);
                assertEquals(self.getElementId(localMailElements[8]), self.getFirstCachedElementRangeId(localListId));
                assertEquals(self.getElementId(localMailElements[9]), self.getLastCachedElementRangeId(localListId));
                self.verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 2, true);
            }));
        }))
    });

    queue.call('Step 2: load range from max - expecting to get elements from cache and target - extend the range', function(callbacks) {
        var startElementId = tutao.rest.EntityRestInterface.GENERATED_MAX_ID;
        var expectedTargetStartElementId = self.getFirstCachedElementRangeId(localListId);
        return self.getElementRange( localListId , startElementId, 3, true).then(callbacks.add(function(loadedElements) {
            assertEquals(3, loadedElements.length);
            self.checkEntityRestCache(localListId, 3, self.getElementId(localMailElements[7]), startElementId);
            assertEquals(self.getElementId(localMailElements[7]), self.getFirstCachedElementRangeId(localListId));
            assertEquals(self.getElementId(localMailElements[9]), self.getLastCachedElementRangeId(localListId));
            self.verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 1, true);
            JsMockito.verifyNoMoreInteractions(self.entityRestSpy);
        }));
    });

    queue.call('Step 3: load range from max - expecting to get elements from cache and target - extend the range', function(callbacks) {
        var startElementId = tutao.rest.EntityRestInterface.GENERATED_MAX_ID;
        var expectedTargetStartElementId = self.getFirstCachedElementRangeId(localListId);
        return self.getElementRange(localListId, startElementId, 8, true).then(callbacks.add(function(loadedElements) {
            assertEquals(8, loadedElements.length);
            self.checkEntityRestCache(localListId, 8, self.getElementId(localMailElements[2]), startElementId);
            assertEquals(self.getElementId(localMailElements[2]), self.getFirstCachedElementRangeId(localListId));
            assertEquals(self.getElementId(localMailElements[9]), self.getLastCachedElementRangeId(localListId));
            self.verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 5, true );
            JsMockito.verifyNoMoreInteractions(self.entityRestSpy);
        }));
    });

    queue.call('Step 4: load range from min - request more elements than available - expecting to get elements from cache and target - extend the range', function(callbacks) {
        var startElementId = tutao.rest.EntityRestInterface.GENERATED_MAX_ID;
        var expectedTargetStartElementId = self.getFirstCachedElementRangeId(localListId);
        return self.getElementRange(localListId, startElementId, 11, true).then(callbacks.add(function(loadedElements) {
            assertEquals(10, loadedElements.length);
            self.checkEntityRestCache(localListId, 10, self.getElementId(localMailElements[0]), startElementId);
            assertEquals(self.getElementId(localMailElements[0]), self.getFirstCachedElementRangeId(localListId));
            assertEquals(self.getElementId(localMailElements[9]), self.getLastCachedElementRangeId(localListId));
            self.verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 3 , true );
            JsMockito.verifyNoMoreInteractions(self.entityRestSpy);
        }));
    });

    queue.call('Step 5: load range from min - request more elements than available - expecting to request target', function(callbacks) {
        var startElementId = tutao.rest.EntityRestInterface.GENERATED_MAX_ID;
        var expectedTargetStartElementId = self.getFirstCachedElementRangeId(localListId);
        return self.getElementRange(localListId, startElementId, 11, true).then(callbacks.add(function(loadedElements) {
            assertEquals(10, loadedElements.length);
            self.checkEntityRestCache(localListId, 10, self.getElementId(localMailElements[0]), startElementId);
            assertEquals(self.getElementId(localMailElements[0]), self.getFirstCachedElementRangeId(localListId));
            assertEquals(self.getElementId(localMailElements[9]), self.getLastCachedElementRangeId(localListId));
            self.verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 1, true );
            JsMockito.verifyNoMoreInteractions(self.entityRestSpy);
        }));
    });
};





EntityRestCacheTest.prototype.getLastCachedElementRangeId = function(listId) {
    var listData = tutao.locator.entityRestClient._db[tutao.entity.tutanota.Mail.PATH][listId];
    return listData['allRange'][listData['allRange'].length -1];
};

EntityRestCacheTest.prototype.getFirstCachedElementRangeId = function(listId) {
    return this.getCachedElementRangeId(listId,0);
};

EntityRestCacheTest.prototype.getCachedElementRangeId = function(listId, index) {
    var listData = tutao.locator.entityRestClient._db[tutao.entity.tutanota.Mail.PATH][listId];
    return listData['allRange'][index];
};

EntityRestCacheTest.prototype.checkEntityRestCache = function(listId, countRange, lowerRangeId, upperRangeId){
    var listData = tutao.locator.entityRestClient._db[tutao.entity.tutanota.Mail.PATH][listId];
    assertEquals(countRange, listData['allRange'].length);
    assertEquals(lowerRangeId, listData['lowerRangeId']);
    assertEquals(upperRangeId, listData['upperRangeId']);
};


EntityRestCacheTest.prototype.getElementId = function (element){
    return tutao.rest.EntityRestInterface.getElementId(element);
};

/**
 * Helper function ot execute getElementRange on the object under test.
 *
 * @param {string} listId The id of the list that contains the elements.
 * @param {string} start The id from where to start to get elements.
 * @param {number} count The maximum number of elements to load.
 * @param {boolean} reverse If true, the elements are loaded from the start backwards in the list, forwards otherwise.
 * @param {Promise.<Array.<Object>>} Resolves to the loaded elements.
 */

EntityRestCacheTest.prototype.getElementRange = function ( listId, start, count, reverse ){
    return tutao.locator.entityRestClient.getElementRange( tutao.entity.tutanota.Mail,tutao.entity.tutanota.Mail.PATH, listId,start, count,reverse,{},tutao.entity.EntityHelper.createAuthHeaders());
};


/**
 * Verifies the getElementRange call for the entity rest spy.
 * @param verifier JsMockito.Verifier instance (eg: JsMockito.Verifiers.once())
 * @param listId The list id which has been requested
 * @param start The start id
 * @param count The number of elements reguest.
 * @param reverse The requested reverse flag.
 */
EntityRestCacheTest.prototype.verifyGetElementRange = function (verifier, listId, start, count, reverse){
    JsMockito.verify(this.entityRestSpy, verifier).getElementRange(tutao.entity.tutanota.Mail,tutao.entity.tutanota.Mail.PATH, listId,start, count,reverse);
};




EntityRestCacheTest.prototype.initMailElements = function(testCallbacks) {
    var self = this;
    var mailList = EntityRestCacheTest.createMailElements(10);
    var params = EntityRestTestFunctions.getVersionParams(tutao.entity.EntityHelper.createPostListPermissionMap(BucketTestUtils.createDummyBucketData(), true));

    return tutao.locator.entityRestClient.postList(tutao.entity.tutanota.Mail.PATH, params, tutao.entity.EntityHelper.createAuthHeaders()).then(testCallbacks.add(function(returnEntity) {
        var listId = returnEntity.getGeneratedId();
        return Promise.each(mailList, function(mailElement){
            var elementParams = EntityRestTestFunctions.getVersionParams(mailElement._entityHelper.createPostPermissionMap(BucketTestUtils.createDummyBucketData()));
            return tutao.locator.entityRestClient.postElement(tutao.entity.tutanota.Mail.PATH, mailElement, listId, elementParams, tutao.entity.EntityHelper.createAuthHeaders()).then(testCallbacks.add(function(returnEntity) {
            }));
        }).then(testCallbacks.add(function() {
            JsMockito.verify(self.entityRestSpy, JsMockito.Verifiers.once()).postList();
            JsMockito.verify(self.entityRestSpy, JsMockito.Verifiers.times(mailList.length)).postElement();
            return {mailListId: listId, mailList: mailList};
        }));
    }));
};


/**
 * Creates the specified number of mail objects and returns them as list.
 * @param count The number of mail objects to create.
 * @returns {Array<tutao.entity.tutanota.Mail>} The mail list.
 */
EntityRestCacheTest.createMailElements = function(count) {
    var mails = [];
    for( var i = 1; i <= count; i++) {
        var mail = new tutao.entity.tutanota.Mail();
        mail.setOwner(tutao.locator.userController.getUserGroupId());
        mail.setArea("" + i);
        mail.setSubject("" + i);
        mail.setDate(new Date());
        mail.setRead(false);
        mails.push(mail);
    }
    return mails;
};





