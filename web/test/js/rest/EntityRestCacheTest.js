"use strict";

// TODO skipped, as chrome chrashes if all testcases including the EntityRestCacheTest is executed (which is no prob for firefox)
describe.skip("EntityRestCacheTest", function () {

    var assert = chai.assert;

    EntityRestTestFunctions.addFunctions();

    var entityRestSpy = null;

    var getLastCachedElementRangeId = function (listId) {
        var listData = tutao.locator.entityRestClient._db[tutao.entity.tutanota.Mail.PATH][listId];
        return listData['allRange'][listData['allRange'].length - 1];
    };

    var getFirstCachedElementRangeId = function (listId) {
        return getCachedElementRangeId(listId, 0);
    };

    var getCachedElementRangeId = function (listId, index) {
        var listData = tutao.locator.entityRestClient._db[tutao.entity.tutanota.Mail.PATH][listId];
        return listData['allRange'][index];
    };

    var checkEntityRestCache = function (listId, countRange, lowerRangeId, upperRangeId) {
        var listData = tutao.locator.entityRestClient._db[tutao.entity.tutanota.Mail.PATH][listId];
        assert.equal(countRange, listData['allRange'].length);
        assert.equal(lowerRangeId, listData['lowerRangeId']);
        assert.equal(upperRangeId, listData['upperRangeId']);
    };

    var getElementId = function (element) {
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
    var getElementRange = function (listId, start, count, reverse) {
        return tutao.locator.entityRestClient.getElementRange(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, listId, start, count, reverse, {}, tutao.entity.EntityHelper.createAuthHeaders());
    };


    /**
     * Verifies the getElementRange call for the entity rest spy.
     * @param verifier JsMockito.Verifier instance (eg: JsMockito.Verifiers.once())
     * @param listId The list id which has been requested
     * @param start The start id
     * @param count The number of elements reguest.
     * @param reverse The requested reverse flag.
     */
    var verifyGetElementRange = function (verifier, listId, start, count, reverse) {
        JsMockito.verify(entityRestSpy, verifier).getElementRange(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, listId, start, count, reverse);
    };

    var initMailElements = function () {
        var self = this;
        var mailList = createMailElements(10);
        var params = EntityRestTestFunctions.getVersionParams(tutao.entity.EntityHelper.createPostListPermissionMap(BucketTestUtils.createDummyBucketData(), true));

        return tutao.locator.entityRestClient.postList(tutao.entity.tutanota.Mail.PATH, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function (returnEntity) {
            var listId = returnEntity.getGeneratedId();
            return Promise.each(mailList, function (mailElement) {
                var elementParams = EntityRestTestFunctions.getVersionParams(mailElement._entityHelper.createPostPermissionMap(BucketTestUtils.createDummyBucketData()));
                return tutao.locator.entityRestClient.postElement(tutao.entity.tutanota.Mail.PATH, mailElement, listId, elementParams, tutao.entity.EntityHelper.createAuthHeaders()).then(function (returnEntity) {
                });
            }).then(function () {
                JsMockito.verify(entityRestSpy, JsMockito.Verifiers.once()).postList();
                JsMockito.verify(entityRestSpy, JsMockito.Verifiers.times(mailList.length)).postElement();
                return {mailListId: listId, mailList: mailList};
            });
        });
    };


    /**
     * Creates the specified number of mail objects and returns them as list.
     * @param count The number of mail objects to create.
     * @returns {Array<tutao.entity.tutanota.Mail>} The mail list.
     */
    var createMailElements = function (count) {
        var mails = [];
        for (var i = 1; i <= count; i++) {
            var mail = new tutao.entity.tutanota.Mail();
            mail.setOwner(tutao.locator.userController.getUserGroupId());
            mail.setArea("" + i);
            mail.setSubject("" + i);
            mail.setSentDate(new Date());
            mail.setUnread(false);
            mails.push(mail);
        }
        return mails;
    };

    beforeEach(function () {
        var cache = new tutao.rest.EntityRestCache();
        entityRestSpy = JsMockito.spy(new tutao.rest.EntityRestDummy());
        cache.setTarget(entityRestSpy);
        tutao.locator.replace('entityRestClient', cache);

        var key = tutao.locator.aesCrypter.generateRandomKey();
        tutao.locator.userController.getUserId = JsMockito.mockFunction();
        tutao.locator.userController.getUserGroupId = JsMockito.mockFunction();
        tutao.locator.userController.getUserGroupKey = JsMockito.mockFunction();
        JsMockito.when(tutao.locator.userController.getUserId)().thenReturn("-34---------");
        JsMockito.when(tutao.locator.userController.getUserGroupId)().thenReturn("-35---------");
        JsMockito.when(tutao.locator.userController.getUserGroupKey)().thenReturn(key);
    });


    afterEach(function () {
        tutao.locator.reset();
    });


    it("LoadRangeFromMin ", function () {
        var localListId = "";
        var localMailElements = [];
        // Step 1: load range from min expecting to get elements from target
        return initMailElements().then(function (testSetup) {
            localListId = testSetup.mailListId;
            localMailElements = testSetup.mailList;
            var startElementId = tutao.rest.EntityRestInterface.GENERATED_MIN_ID;
            var expectedTargetStartElementId = tutao.rest.EntityRestInterface.GENERATED_MIN_ID;
            return getElementRange(localListId, startElementId, 10, false).then(function (loadedElements) {
                assert.equal(10, loadedElements.length);
                verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 10, false);
                checkEntityRestCache(localListId, 10, startElementId, getElementId(localMailElements[9]));
                assert.equal(getElementId(localMailElements[0]), getFirstCachedElementRangeId(localListId));
                assert.equal(getElementId(localMailElements[9]), getLastCachedElementRangeId(localListId));
            });
        }).then(function () {
            // Step 2: load range from min expecting to get elements from cache - all requested elements are stored in cache
            var startElementId = tutao.rest.EntityRestInterface.GENERATED_MIN_ID;
            var expectedTargetStartElementId = tutao.rest.EntityRestInterface.GENERATED_MIN_ID;
            return getElementRange(localListId, startElementId, 10, false).then(function (loadedElements) {
                assert.equal(10, loadedElements.length);
                JsMockito.verifyNoMoreInteractions(entityRestSpy);// No calls to target expected
                checkEntityRestCache(localListId, 10, startElementId, getElementId(localMailElements[9]));
                assert.equal(getElementId(localMailElements[0]), getFirstCachedElementRangeId(localListId));
                assert.equal(getElementId(localMailElements[9]), getLastCachedElementRangeId(localListId));
            });
        }).then(function () {
            // Step 3: load range from min expecting to get elements from cache - request more elements than available in cache
            var startElementId = tutao.rest.EntityRestInterface.GENERATED_MIN_ID;
            var expectedTargetStartElementId = getLastCachedElementRangeId(localListId); // Expected start element is the last element of the cached mail elements.
            return getElementRange(localListId, startElementId, 11, false).then(function (loadedElements) {
                assert.equal(10, loadedElements.length);
                verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 1, false);
                JsMockito.verifyNoMoreInteractions(entityRestSpy);
                checkEntityRestCache(localListId, 10, startElementId, tutao.rest.EntityRestInterface.GENERATED_MAX_ID);
                assert.equal(getElementId(localMailElements[0]), getFirstCachedElementRangeId(localListId));
                assert.equal(getElementId(localMailElements[9]), getLastCachedElementRangeId(localListId));
            });
        });
    });

    it("LoadRangeFromMax ", function () {
        var localListId = "";
        var localMailElements = [];
        // Step 1: load range from max expecting to get elements from target
        return initMailElements().then(function (testSetup) {
            localListId = testSetup.mailListId;
            localMailElements = testSetup.mailList;
            var startElementId = tutao.rest.EntityRestInterface.GENERATED_MAX_ID;
            var expectedTargetStartElementId = tutao.rest.EntityRestInterface.GENERATED_MAX_ID;
            return getElementRange(localListId, startElementId, 10, true).then(function (loadedElements) {
                assert.equal(10, loadedElements.length);
                verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 10, true);
                checkEntityRestCache(localListId, 10, getElementId(localMailElements[0]), startElementId);
                assert.equal(getElementId(localMailElements[0]), getFirstCachedElementRangeId(localListId));
                assert.equal(getElementId(localMailElements[9]), getLastCachedElementRangeId(localListId));
            });
        }).then(function () {
            // Step 2: load range from max expecting to get elements from cache - all requested elements are stored in cache
            var startElementId = tutao.rest.EntityRestInterface.GENERATED_MAX_ID;
            var expectedTargetStartElementId = getFirstCachedElementRangeId(localListId); // Expected start element is the last element of the cached mail elements.
            return getElementRange(localListId, startElementId, 10, true).then(function (loadedElements) {
                assert.equal(10, loadedElements.length);
                JsMockito.verifyNoMoreInteractions(entityRestSpy); // No calls to target expected
                checkEntityRestCache(localListId, 10, getElementId(localMailElements[0]), startElementId);
                assert.equal(getElementId(localMailElements[0]), getFirstCachedElementRangeId(localListId));
                assert.equal(getElementId(localMailElements[9]), getLastCachedElementRangeId(localListId));
            });
        }).then(function () {
            // Step 3: load range from may expecting to get elements from cache - request more elements than available in cache
            var startElementId = tutao.rest.EntityRestInterface.GENERATED_MAX_ID;
            var expectedTargetStartElementId = getFirstCachedElementRangeId(localListId); // Expected start element is the last element of the cached mail elements.
            return getElementRange(localListId, startElementId, 11, true).then(function (loadedElements) {
                assert.equal(10, loadedElements.length);
                verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 1, true);
                JsMockito.verifyNoMoreInteractions(entityRestSpy);
                checkEntityRestCache(localListId, 10, tutao.rest.EntityRestInterface.GENERATED_MIN_ID, startElementId);
                assert.equal(getElementId(localMailElements[0]), getFirstCachedElementRangeId(localListId));
                assert.equal(getElementId(localMailElements[9]), getLastCachedElementRangeId(localListId));
            });
        });
    });

    it("ExtendRangeFromMin ", function () {
        var localListId = "";
        var localMailElements = [];
        // Step 1: load range from min - expecting to get elements from target
        return initMailElements().then(function (testSetup) {
            localListId = testSetup.mailListId;
            localMailElements = testSetup.mailList;
            var startElementId = tutao.rest.EntityRestInterface.GENERATED_MIN_ID;
            var expectedTargetStartElementId = tutao.rest.EntityRestInterface.GENERATED_MIN_ID;
            return getElementRange(localListId, startElementId, 2, false).then(function (loadedElements) {
                assert.equal(2, loadedElements.length);
                checkEntityRestCache(localListId, 2, startElementId, getElementId(localMailElements[1]));
                assert.equal(getElementId(localMailElements[0]), getFirstCachedElementRangeId(localListId));
                assert.equal(getElementId(localMailElements[1]), getLastCachedElementRangeId(localListId));
                verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 2, false);
            });
        }).then(function () {
            // Step 2: load range from min - expecting to get elements from cache and target - extend the range
            var startElementId = tutao.rest.EntityRestInterface.GENERATED_MIN_ID;
            var expectedTargetStartElementId = getLastCachedElementRangeId(localListId);
            return getElementRange(localListId, startElementId, 3, false).then(function (loadedElements) {
                assert.equal(3, loadedElements.length);
                checkEntityRestCache(localListId, 3, startElementId, getElementId(localMailElements[2]));
                assert.equal(getElementId(localMailElements[0]), getFirstCachedElementRangeId(localListId));
                assert.equal(getElementId(localMailElements[2]), getLastCachedElementRangeId(localListId));
                verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 1, false);
                JsMockito.verifyNoMoreInteractions(entityRestSpy);
            });
        }).then(function () {
            // Step 3: load range from min - expecting to get elements from cache and target - extend the range
            var startElementId = tutao.rest.EntityRestInterface.GENERATED_MIN_ID;
            var expectedTargetStartElementId = getLastCachedElementRangeId(localListId);
            return getElementRange(localListId, startElementId, 8, false).then(function (loadedElements) {
                assert.equal(8, loadedElements.length);
                checkEntityRestCache(localListId, 8, startElementId, getElementId(localMailElements[7]));
                assert.equal(getElementId(localMailElements[0]), getFirstCachedElementRangeId(localListId));
                assert.equal(getElementId(localMailElements[7]), getLastCachedElementRangeId(localListId));
                verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 5, false);
                JsMockito.verifyNoMoreInteractions(entityRestSpy);
            });
        }).then(function () {
            // Step 4: load range from min - request more elements than available - expecting to get elements from cache and target - extend the range
            var startElementId = tutao.rest.EntityRestInterface.GENERATED_MIN_ID;
            var expectedTargetStartElementId = getLastCachedElementRangeId(localListId);
            return getElementRange(localListId, startElementId, 11, false).then(function (loadedElements) {
                assert.equal(10, loadedElements.length);
                checkEntityRestCache(localListId, 10, startElementId, tutao.rest.EntityRestInterface.GENERATED_MAX_ID);
                assert.equal(getElementId(localMailElements[0]), getFirstCachedElementRangeId(localListId));
                assert.equal(getElementId(localMailElements[9]), getLastCachedElementRangeId(localListId));
                verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 3, false);
                JsMockito.verifyNoMoreInteractions(entityRestSpy);
            });
        }).then(function () {
            // Step 5: load range from min - request more elements than available - expecting to request target
            var startElementId = tutao.rest.EntityRestInterface.GENERATED_MIN_ID;
            var expectedTargetStartElementId = getLastCachedElementRangeId(localListId);
            return getElementRange(localListId, startElementId, 11, false).then(function (loadedElements) {
                assert.equal(10, loadedElements.length);
                checkEntityRestCache(localListId, 10, startElementId, tutao.rest.EntityRestInterface.GENERATED_MAX_ID);
                assert.equal(getElementId(localMailElements[0]), getFirstCachedElementRangeId(localListId));
                assert.equal(getElementId(localMailElements[9]), getLastCachedElementRangeId(localListId));
                verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 1, false);
                JsMockito.verifyNoMoreInteractions(entityRestSpy);
            });
        });

    });

    it("ExtendRangeFromFirstElement ", function () {
        var localListId = "";
        var localMailElements = [];
        // Step 1: load range from first element - expecting to get elements from target
        return initMailElements().then(function (testSetup) {
            localListId = testSetup.mailListId;
            localMailElements = testSetup.mailList;
            var startElementId = getElementId(localMailElements[0]);
            var expectedTargetStartElementId = getElementId(localMailElements[0]);
            return getElementRange(localListId, startElementId, 2, false).then(function (loadedElements) {
                assert.equal(2, loadedElements.length);
                verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 2, false);
                checkEntityRestCache(localListId, 2, startElementId, getElementId(localMailElements[2]));
                // Requested start element id is not in range and not in cache
                assert.equal(getElementId(localMailElements[1]), getFirstCachedElementRangeId(localListId));
                assert.equal(getElementId(localMailElements[2]), getLastCachedElementRangeId(localListId));
            });
        }).then(function () {
            // Step 2: load range from first cached element - expecting to get elements from cache and target - extend the range
            var startElementId = getFirstCachedElementRangeId(localListId);
            var expectedTargetStartElementId = getLastCachedElementRangeId(localListId);
            return getElementRange(localListId, startElementId, 3, false).then(function (loadedElements) {
                assert.equal(3, loadedElements.length);
                verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 2, false);
                checkEntityRestCache(localListId, 4, getElementId(localMailElements[0]), getElementId(localMailElements[4]));  // Requested start element is the first element from cache therefore cache is increased by two values
                assert.equal(getElementId(localMailElements[1]), getFirstCachedElementRangeId(localListId));
                assert.equal(getElementId(localMailElements[4]), getLastCachedElementRangeId(localListId));
                JsMockito.verifyNoMoreInteractions(entityRestSpy);
            });
        }).then(function () {
            // Step 3: load range from first cached element - expecting to get elements from cache and target - extend the range
            var startElementId = getFirstCachedElementRangeId(localListId);
            var expectedTargetStartElementId = getLastCachedElementRangeId(localListId);
            return getElementRange(localListId, startElementId, 8, false).then(function (loadedElements) {
                assert.equal(8, loadedElements.length);
                verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 5, false);
                checkEntityRestCache(localListId, 9, getElementId(localMailElements[0]), getElementId(localMailElements[9]));  // Requested start element is the first element from cache therefore range size differ from loaded element size (see step 1)
                assert.equal(getElementId(localMailElements[1]), getFirstCachedElementRangeId(localListId));
                assert.equal(getElementId(localMailElements[9]), getLastCachedElementRangeId(localListId));
                JsMockito.verifyNoMoreInteractions(entityRestSpy);
            });
        }).then(function () {
            // Step 4: load range from first cached element - request more elements than available - expecting to get elements from cache and target - extend the range
            var startElementId = getFirstCachedElementRangeId(localListId);
            var expectedTargetStartElementId = getLastCachedElementRangeId(localListId);
            return getElementRange(localListId, startElementId, 11, false).then(function (loadedElements) {
                assert.equal(8, loadedElements.length); // only 8 elements are loaded because start element is not returned
                verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 3, false);
                checkEntityRestCache(localListId, 9, getElementId(localMailElements[0]), tutao.rest.EntityRestInterface.GENERATED_MAX_ID);  // Requested start element is the first element from cache therefore range size differ from loaded element size (see step 1)
                assert.equal(getElementId(localMailElements[1]), getFirstCachedElementRangeId(localListId));
                assert.equal(getElementId(localMailElements[9]), getLastCachedElementRangeId(localListId));
                JsMockito.verifyNoMoreInteractions(entityRestSpy);
            });
        }).then(function () {
            // Step 5: load range from first - request more elements than available - expecting to request target
            var startElementId = getElementId(localMailElements[0]); // Change the start element id
            var expectedTargetStartElementId = getLastCachedElementRangeId(localListId);
            return getElementRange(localListId, startElementId, 11, false).then(function (loadedElements) {
                assert.equal(9, loadedElements.length);
                verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 2, false);
                checkEntityRestCache(localListId, 9, getElementId(localMailElements[0]), tutao.rest.EntityRestInterface.GENERATED_MAX_ID);  // Requested start element is the first element from cache therefore range size differ from loaded element size (see step 1)
                assert.equal(getElementId(localMailElements[1]), getFirstCachedElementRangeId(localListId));
                assert.equal(getElementId(localMailElements[9]), getLastCachedElementRangeId(localListId));
                JsMockito.verifyNoMoreInteractions(entityRestSpy);
            });
        });

    });

    it("ExtendRangeFromLastElement ", function () {
        var localListId = "";
        var localMailElements = [];
        // Step 1: load range from last element - expecting to get elements from target
        return initMailElements().then(function (testSetup) {
            localListId = testSetup.mailListId;
            localMailElements = testSetup.mailList;
            var startElementId = getElementId(localMailElements[9]); // last element in mail list
            var expectedTargetStartElementId = getElementId(localMailElements[9]);
            return getElementRange(localListId, startElementId, 2, true).then(function (loadedElements, e) {
                assert.equal(2, loadedElements.length);
                verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 2, true);
                checkEntityRestCache(localListId, 2, getElementId(localMailElements[7]), getElementId(localMailElements[9]));
                // Requested start element id is not in range and not in cache
                assert.equal(getElementId(localMailElements[7]), getFirstCachedElementRangeId(localListId));
                assert.equal(getElementId(localMailElements[8]), getLastCachedElementRangeId(localListId));
            });
        }).then(function () {
            // Step 2: load range from last cached element - expecting to get elements from cache and target - extend the range
            var startElementId = getLastCachedElementRangeId(localListId);
            var expectedTargetStartElementId = getFirstCachedElementRangeId(localListId);
            return getElementRange(localListId, startElementId, 3, true).then(function (loadedElements, e) {
                assert.equal(3, loadedElements.length);
                verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 2, true);
                checkEntityRestCache(localListId, 4, getElementId(localMailElements[5]), getElementId(localMailElements[9]));  // Requested start element is the last element from cache therefore cache is increased by two values
                assert.equal(getElementId(localMailElements[5]), getFirstCachedElementRangeId(localListId));
                assert.equal(getElementId(localMailElements[8]), getLastCachedElementRangeId(localListId));
                JsMockito.verifyNoMoreInteractions(entityRestSpy);
            });
        }).then(function () {
            // Step 3: load range from last cached element - expecting to get elements from cache and target - extend the range
            var startElementId = getLastCachedElementRangeId(localListId);
            var expectedTargetStartElementId = getFirstCachedElementRangeId(localListId);
            return getElementRange(localListId, startElementId, 8, true).then(function (loadedElements, e) {
                assert.equal(8, loadedElements.length);
                verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 5, true);
                checkEntityRestCache(localListId, 9, getElementId(localMailElements[0]), getElementId(localMailElements[9]));
                assert.equal(getElementId(localMailElements[0]), getFirstCachedElementRangeId(localListId));
                assert.equal(getElementId(localMailElements[8]), getLastCachedElementRangeId(localListId));
                JsMockito.verifyNoMoreInteractions(entityRestSpy);
            });
        }).then(function () {
            // Step 4: load range from last cached element - request more elements than available - expecting to get elements from cache and target - extend the range
            var startElementId = getLastCachedElementRangeId(localListId);
            var expectedTargetStartElementId = getFirstCachedElementRangeId(localListId);
            return getElementRange(localListId, startElementId, 11, true).then(function (loadedElements, e) {
                assert.equal(8, loadedElements.length); // only 8 elements are available because start element does not return
                verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 3, true);
                checkEntityRestCache(localListId, 9, tutao.rest.EntityRestInterface.GENERATED_MIN_ID, getElementId(localMailElements[9]));
                assert.equal(getElementId(localMailElements[0]), getFirstCachedElementRangeId(localListId));
                assert.equal(getElementId(localMailElements[8]), getLastCachedElementRangeId(localListId));
                JsMockito.verifyNoMoreInteractions(entityRestSpy);
            });
        }).then(function () {
            // Step 5: load range from last element - request more elements than available - expecting to request target
            var startElementId = getElementId(localMailElements[9]); // last element in mail list
            var expectedTargetStartElementId = getFirstCachedElementRangeId(localListId);
            return getElementRange(localListId, startElementId, 11, true).then(function (loadedElements, e) {
                assert.equal(9, loadedElements.length);
                verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 2, true);
                checkEntityRestCache(localListId, 9, tutao.rest.EntityRestInterface.GENERATED_MIN_ID, getElementId(localMailElements[9]));
                assert.equal(getElementId(localMailElements[0]), getFirstCachedElementRangeId(localListId));
                assert.equal(getElementId(localMailElements[8]), getLastCachedElementRangeId(localListId));
                JsMockito.verifyNoMoreInteractions(entityRestSpy);
            });
        });

    });

    it("ExtendRangeFromOutsideElementMaxId ", function () {
        var localListId = "";
        var localMailElements = [];
        // Step 1: load range from min expecting to get elements from target
        return initMailElements().then(function (testSetup) {
            localListId = testSetup.mailListId;
            localMailElements = testSetup.mailList;
            return getElementRange(localListId, tutao.rest.EntityRestInterface.GENERATED_MIN_ID, 10, false).then(function (loadedElements, e) {
                assert.equal(10, loadedElements.length);
                verifyGetElementRange(JsMockito.Verifiers.once(), localListId, tutao.rest.EntityRestInterface.GENERATED_MIN_ID, 10, false);
            });
        }).then(function () {
            // Step 2: load range from max - not allowed
            var startElementId = tutao.rest.EntityRestInterface.GENERATED_MAX_ID;
            return getElementRange(localListId, startElementId, 5, true).caught(function (e) {
                assert.isDefined(e);
                JsMockito.verifyNoMoreInteractions(entityRestSpy);// No calls to target expected
            });
        });

    });

    it("ExtendRangeFromOutsideElementMinId ", function () {
        var localListId = "";
        var localMailElements = [];
        // Step 1: load range from max expecting to get elements from target
        return initMailElements().then(function (testSetup) {
            localListId = testSetup.mailListId;
            localMailElements = testSetup.mailList;
            var startElementId = tutao.rest.EntityRestInterface.GENERATED_MAX_ID;
            return getElementRange(localListId, startElementId, 10, true).then(function (loadedElements) {
                assert.equal(10, loadedElements.length);
                verifyGetElementRange(JsMockito.Verifiers.once(), localListId, startElementId, 10, true);
            });
        }).then(function () {
            // Step 2: load range from min - not allowed
            var startElementId = tutao.rest.EntityRestInterface.GENERATED_MIN_ID;
            return getElementRange(localListId, startElementId, 5, false).caught(function (e) {
                assert.isDefined(e);
                JsMockito.verifyNoMoreInteractions(entityRestSpy);// No calls to target expected
            });
        });

    });

    it("ExtendRangeFromOutsideElementId ", function () {
        var localListId = "";
        var localMailElements = [];
        // Step 1: load range from element expecting to get elements from target
        return initMailElements().then(function (testSetup) {
            localListId = testSetup.mailListId;
            localMailElements = testSetup.mailList;
            var startElementId = tutao.rest.EntityRestInterface.getElementId(localMailElements[2]);
            return getElementRange(localListId, startElementId, 5, false).then(function (loadedElements) {
                assert.equal(5, loadedElements.length);
                verifyGetElementRange(JsMockito.Verifiers.once(), localListId, startElementId, 5, false);
            });
        }).then(function () {
            // Step 2: load range from outer range element - not allowed
            var startElementId = tutao.rest.EntityRestInterface.getElementId(localMailElements[8]);
            return getElementRange(localListId, startElementId, 5, true).caught(function (e) {
                assert.isDefined(e);
                JsMockito.verifyNoMoreInteractions(entityRestSpy);// No calls to target expected
            });
        });

    });

    it("ExtendRangeFromMax ", function () {
        var localListId = "";
        var localMailElements = [];

        // Step 1: load range from max - expecting to get elements from target
        return initMailElements().then(function (testSetup) {
            localListId = testSetup.mailListId;
            localMailElements = testSetup.mailList;
            var startElementId = tutao.rest.EntityRestInterface.GENERATED_MAX_ID;
            var expectedTargetStartElementId = tutao.rest.EntityRestInterface.GENERATED_MAX_ID;
            return getElementRange(localListId, startElementId, 2, true).then(function (loadedElements) {
                assert.equal(2, loadedElements.length);
                checkEntityRestCache(localListId, 2, getElementId(localMailElements[8]), startElementId);
                assert.equal(getElementId(localMailElements[8]), getFirstCachedElementRangeId(localListId));
                assert.equal(getElementId(localMailElements[9]), getLastCachedElementRangeId(localListId));
                verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 2, true);
            });
        }).then(function () {
            // Step 2: load range from max - expecting to get elements from cache and target - extend the range
            var startElementId = tutao.rest.EntityRestInterface.GENERATED_MAX_ID;
            var expectedTargetStartElementId = getFirstCachedElementRangeId(localListId);
            return getElementRange(localListId, startElementId, 3, true).then(function (loadedElements) {
                assert.equal(3, loadedElements.length);
                checkEntityRestCache(localListId, 3, getElementId(localMailElements[7]), startElementId);
                assert.equal(getElementId(localMailElements[7]), getFirstCachedElementRangeId(localListId));
                assert.equal(getElementId(localMailElements[9]), getLastCachedElementRangeId(localListId));
                verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 1, true);
                JsMockito.verifyNoMoreInteractions(entityRestSpy);
            });
        }).then(function () {
            // Step 3: load range from max - expecting to get elements from cache and target - extend the range
            var startElementId = tutao.rest.EntityRestInterface.GENERATED_MAX_ID;
            var expectedTargetStartElementId = getFirstCachedElementRangeId(localListId);
            return getElementRange(localListId, startElementId, 8, true).then(function (loadedElements) {
                assert.equal(8, loadedElements.length);
                checkEntityRestCache(localListId, 8, getElementId(localMailElements[2]), startElementId);
                assert.equal(getElementId(localMailElements[2]), getFirstCachedElementRangeId(localListId));
                assert.equal(getElementId(localMailElements[9]), getLastCachedElementRangeId(localListId));
                verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 5, true);
                JsMockito.verifyNoMoreInteractions(entityRestSpy);
            });
        }).then(function () {
            // Step 4: load range from min - request more elements than available - expecting to get elements from cache and target - extend the range
            var startElementId = tutao.rest.EntityRestInterface.GENERATED_MAX_ID;
            var expectedTargetStartElementId = getFirstCachedElementRangeId(localListId);
            return getElementRange(localListId, startElementId, 11, true).then(function (loadedElements) {
                assert.equal(10, loadedElements.length);
                checkEntityRestCache(localListId, 10, tutao.rest.EntityRestInterface.GENERATED_MIN_ID, startElementId);
                assert.equal(getElementId(localMailElements[0]), getFirstCachedElementRangeId(localListId));
                assert.equal(getElementId(localMailElements[9]), getLastCachedElementRangeId(localListId));
                verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 3, true);
                JsMockito.verifyNoMoreInteractions(entityRestSpy);
            });
        }).then(function () {
            // Step 5: load range from min - request more elements than available - expecting to request target
            var startElementId = tutao.rest.EntityRestInterface.GENERATED_MAX_ID;
            var expectedTargetStartElementId = getFirstCachedElementRangeId(localListId);
            return getElementRange(localListId, startElementId, 11, true).then(function (loadedElements) {
                assert.equal(10, loadedElements.length);
                checkEntityRestCache(localListId, 10, tutao.rest.EntityRestInterface.GENERATED_MIN_ID, startElementId);
                assert.equal(getElementId(localMailElements[0]), getFirstCachedElementRangeId(localListId));
                assert.equal(getElementId(localMailElements[9]), getLastCachedElementRangeId(localListId));
                verifyGetElementRange(JsMockito.Verifiers.once(), localListId, expectedTargetStartElementId, 1, true);
                JsMockito.verifyNoMoreInteractions(entityRestSpy);
            });
        });


    });

});