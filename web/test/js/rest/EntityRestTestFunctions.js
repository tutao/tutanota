"use strict";

goog.provide('EntityRestTestFunctions');

/**
 * Adds all entity rest test functions to the prototype of the given test. Call this functions
 * for each test case that tests a class that implements the EntityRestInterface.
 * @param {TestCase} testCase The test case to add the functions to.
 */
EntityRestTestFunctions.addFunctionsToTestPrototype = function (testCase) {
    (function () {
        var functions = EntityRestTestFunctions.functions;
        for (var name in functions) {
            testCase.prototype[name] = functions[name];
        }
    })();
};

/**
 * @param ?Object.<string, string> params If provided, the version param will be added to this map.
 */
EntityRestTestFunctions.getVersionParams = function (params) {
    if (!params) {
        params = {};
    }
    // we use the model version of MailBody, because it is the same for all types used in this test
    params[tutao.rest.ResourceConstants.SW_VERSION_PARAMETER] = tutao.entity.tutanota.MailBody.MODEL_VERSION;
    return params;
};

/**
 * An object containing functions to test the EntityRest* classes or chains of them.
 */
EntityRestTestFunctions.functions = {

    "test an empty db should throw an error on requests for an element": function (queue) {
        queue.call('test', function (callbacks) {
            tutao.locator.entityRestClient.getElement(tutao.entity.tutanota.MailBody, tutao.entity.tutanota.MailBody.PATH, "-0DGl4rds--F", null, EntityRestTestFunctions.getVersionParams(), tutao.entity.EntityHelper.createAuthHeaders()).catch(function (exception) {
                assertInstanceOf(tutao.NotFoundError, exception);
            }).done(callbacks.noop());
        });
    },

    "test an empty db should return an empty list on requests for elements": function (queue) {
        queue.call('test', function (callbacks) {
            tutao.locator.entityRestClient.getElements(tutao.entity.tutanota.MailBody, tutao.entity.tutanota.MailBody.PATH, ["-0DGl4rds--E", "-0DGl4rds--F"], EntityRestTestFunctions.getVersionParams(), tutao.entity.EntityHelper.createAuthHeaders()).then(function (elements) {
                assertEquals([], elements);
            }).done(callbacks.noop());
        });
    },

    "test an empty db should return an empty list on requests for list elements": function (queue) {
        queue.call('test', function (callbacks) {
            var params = EntityRestTestFunctions.getVersionParams(tutao.entity.EntityHelper.createPostListPermissionMap(BucketTestUtils.createDummyBucketData(), true));
            tutao.locator.entityRestClient.postList(tutao.entity.tutanota.Mail.PATH, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function (returnEntity) {
                var listId = returnEntity.getGeneratedId();
                return tutao.locator.entityRestClient.getElementRange(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, listId, tutao.rest.EntityRestInterface.GENERATED_MIN_ID, 10, false, EntityRestTestFunctions.getVersionParams(), tutao.entity.EntityHelper.createAuthHeaders()).then(callbacks.add(function (elements) {
                    assertEquals([], elements);
                }));
            }).done(callbacks.noop());
        });
    },

    "test you are able to retrieve an element after adding it": function (queue) {
        queue.call('test', function (callbacks) {
            var element = new tutao.entity.tutanota.MailBody();
            element.setOwner(tutao.locator.userController.getUserGroupId());
            element.setArea("1");
            element.setText("hello together!");
            var params = EntityRestTestFunctions.getVersionParams(element._entityHelper.createPostPermissionMap(BucketTestUtils.createDummyBucketData()));
            tutao.locator.entityRestClient.postElement(tutao.entity.tutanota.MailBody.PATH, element, null, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function (returnEntity) {
                assertTrue(element.getId() !== undefined);
                assertTrue(element.getId() !== null);
                assertTrue(element.getId() !== "");
                assertTrue(element.getPermissions() !== undefined);
                assertTrue(element.getPermissions() !== null);
                assertTrue(element.getPermissions() !== "");
                return tutao.locator.entityRestClient.getElement(tutao.entity.tutanota.MailBody, tutao.entity.tutanota.MailBody.PATH, element.getId(), null, EntityRestTestFunctions.getVersionParams(), tutao.entity.EntityHelper.createAuthHeaders()).then(callbacks.add(function (loadedElement) {
                    assertEquals(element.toJsonData(), loadedElement.toJsonData());
                }));
            }).done(callbacks.noop());
        });
    },

    "test you are able to retrieve multiple elements after adding them": function (queue) {
        queue.call('test', function (callbacks) {
            var element1 = new tutao.entity.tutanota.MailBody();
            element1.setOwner(tutao.locator.userController.getUserGroupId());
            element1.setArea("1");
            element1.setText("hello together!");
            var params = EntityRestTestFunctions.getVersionParams(element1._entityHelper.createPostPermissionMap(BucketTestUtils.createDummyBucketData()));
            tutao.locator.entityRestClient.postElement(tutao.entity.tutanota.MailBody.PATH, element1, null, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function (returnEntity) {
                var element2 = new tutao.entity.tutanota.MailBody();
                element2.setOwner(tutao.locator.userController.getUserGroupId());
                element2.setArea("1");
                element2.setText("hello together now!");
                var params = EntityRestTestFunctions.getVersionParams(element2._entityHelper.createPostPermissionMap(BucketTestUtils.createDummyBucketData()));
                return tutao.locator.entityRestClient.postElement(tutao.entity.tutanota.MailBody.PATH, element2, null, params, tutao.entity.EntityHelper.createAuthHeaders()).then(callbacks.add(function (returnEntity) {
                    return tutao.locator.entityRestClient.getElements(tutao.entity.tutanota.MailBody, tutao.entity.tutanota.MailBody.PATH, [element1.getId(), element2.getId()], EntityRestTestFunctions.getVersionParams(), tutao.entity.EntityHelper.createAuthHeaders()).then(callbacks.add(function (elements) {
                        assertEquals(2, elements.length);
                        if (element1.getId() == elements[0].getId()) {
                            assertEquals(element1.toJsonData(), elements[0].toJsonData());
                            assertEquals(element2.toJsonData(), elements[1].toJsonData());
                        } else {
                            assertEquals(element1.toJsonData(), elements[1].toJsonData());
                            assertEquals(element2.toJsonData(), elements[0].toJsonData());
                        }
                    }));
                }));
            }).done(callbacks.noop());
        });
    },

    "test that a list is created with the first listId": function (queue) {
        queue.call('test', function (callbacks) {
            var params = EntityRestTestFunctions.getVersionParams(tutao.entity.EntityHelper.createPostListPermissionMap(BucketTestUtils.createDummyBucketData(), true));
            tutao.locator.entityRestClient.postList(tutao.entity.tutanota.Mail.PATH, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function (returnEntity) {
                var listId = returnEntity.getGeneratedId();
                assertTrue(listId !== undefined);
                assertTrue(listId !== null);
                assertTrue(listId !== "");
                return tutao.locator.entityRestClient.getElementRange(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, listId, tutao.rest.EntityRestInterface.GENERATED_MIN_ID, 10, false, EntityRestTestFunctions.getVersionParams(), tutao.entity.EntityHelper.createAuthHeaders()).then(function (elements) {
                    assertEquals([], elements);
                });
            }).done(callbacks.noop());
        });
    },

    "test that you are able to retrieve a list element after adding it to a list": function (queue) {
        queue.call('test', function (callbacks) {
            var element = new tutao.entity.tutanota.Mail();
            element.setOwner(tutao.locator.userController.getUserGroupId());
            element.setArea("1");
            element.setSubject("hello together!");
            element.setSentDate(new Date());
            element.setUnread(true);

            var params = EntityRestTestFunctions.getVersionParams(tutao.entity.EntityHelper.createPostListPermissionMap(BucketTestUtils.createDummyBucketData(), true));
            tutao.locator.entityRestClient.postList(tutao.entity.tutanota.Mail.PATH, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function (returnEntity) {
                var listId = returnEntity.getGeneratedId();
                var elementParams = EntityRestTestFunctions.getVersionParams(element._entityHelper.createPostPermissionMap(BucketTestUtils.createDummyBucketData()));
                return tutao.locator.entityRestClient.postElement(tutao.entity.tutanota.Mail.PATH, element, listId, elementParams, tutao.entity.EntityHelper.createAuthHeaders()).then(function (returnEntity) {
                    assertEquals(listId, element.getId()[0]);
                    assertTrue(element.getId()[1] !== undefined);
                    assertTrue(element.getId()[1] !== null);
                    assertTrue(element.getId()[1] !== "");
                    assertTrue(element.getPermissions() !== undefined);
                    assertTrue(element.getPermissions() !== null);
                    assertTrue(element.getPermissions() !== "");
                    return tutao.locator.entityRestClient.getElement(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, element.getId()[1], element.getId()[0], EntityRestTestFunctions.getVersionParams(), tutao.entity.EntityHelper.createAuthHeaders()).then(function (element) {
                        assertEquals(element.toJsonData(), element.toJsonData());
                        assertEquals("hello together!", element.getSubject());
                    });
                });
            }).done(callbacks.noop());
        });
    },

    // not yet implemented
//	"test that you are able to retrieve multiple list elements after adding them": function(queue) {
//		var e1 = new tutao.entity.tutanota.Mail();
//		var e2 = new tutao.entity.tutanota.Mail();
//		e1.setSubject("1");
//		e1.setDate(new Date());
//		e1.setRead(false);
//		e2.setSubject("2");
//		e2.setDate(new Date());
//		e2.setRead(false);
//		var listId = tutao.locator.entityRestClient.postList(tutao.entity.tutanota.Mail.PATH, tutao.entity.EntityHelper.createPostListPermissionMap(BucketTestUtils.createDummyBucketData(), true), tutao.entity.EntityHelper.createAuthHeaders());
//		tutao.locator.entityRestClient.postElement(tutao.entity.tutanota.Mail.PATH, e1, listId, null, tutao.entity.EntityHelper.createAuthHeaders());
//		tutao.locator.entityRestClient.postElement(tutao.entity.tutanota.Mail.PATH, e2, listId, null, tutao.entity.EntityHelper.createAuthHeaders());
//		var loadedElements = tutao.locator.entityRestClient.getElements(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, [e1.getId(), e2.getId()], null, tutao.entity.EntityHelper.createAuthHeaders());
//		assertEquals(2, loadedElements.length);
//		assertEquals(e1.toJsonData(), loadedElements[0].toJsonData());
//		assertEquals(e2.toJsonData(), loadedElements[1].toJsonData());
//	},

    // not yet implemented
//	"test that you only recieve existing elements": function(queue) {
//		var e1 = new tutao.entity.tutanota.Mail();
//		e1.setSubject("1");
//		e1.setDate(new Date());
//		e1.setRead(false);
//		var listId = tutao.locator.entityRestClient.postList(tutao.entity.tutanota.Mail.PATH, tutao.entity.EntityHelper.createPostListPermissionMap(BucketTestUtils.createDummyBucketData(), true), tutao.entity.EntityHelper.createAuthHeaders());
//		tutao.locator.entityRestClient.postElement(tutao.entity.tutanota.Mail.PATH, e1, listId, null, tutao.entity.EntityHelper.createAuthHeaders());
//		var loadedElements = tutao.locator.entityRestClient.getElements(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, [e1.getId(), [e1.getId()[0], tutao.rest.EntityRestInterface.GENERATED_MIN_ID]], null, tutao.entity.EntityHelper.createAuthHeaders());
//		assertEquals(1, loadedElements.length);
//		assertEquals(e1.toJsonData(), loadedElements[0].toJsonData());
//	},

    "test that you are able to retrieve a set of list elements after adding them": function (queue) {
        var self = this;
        queue.call('test', function (callbacks) {
            self.createListAndTwoMails().spread(function (listId, e1, e2) {
                return tutao.locator.entityRestClient.getElementRange(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, listId, tutao.rest.EntityRestInterface.GENERATED_MIN_ID, 10, false, EntityRestTestFunctions.getVersionParams(), tutao.entity.EntityHelper.createAuthHeaders()).then(function (loadedElements) {
                    assertEquals(2, loadedElements.length);
                    assertEquals(e1.toJsonData(), loadedElements[0].toJsonData());
                    assertEquals(e2.toJsonData(), loadedElements[1].toJsonData());
                });
            }).done(callbacks.noop());
        });
    },

    /**
     * @return {Promise.<ListIdAndTwoMails>} Provides the list id and the two mails.
     */
    createListAndTwoMails: function () {
        var e1 = new tutao.entity.tutanota.Mail();
        var e2 = new tutao.entity.tutanota.Mail();
        e1.setOwner(tutao.locator.userController.getUserGroupId());
        e1.setArea("1");
        e1.setSubject("1");
        e1.setSentDate(new Date());
        e1.setUnread(true);
        e2.setSubject("2");
        e2.setSentDate(new Date());
        e2.setUnread(true);
        e2.setOwner(tutao.locator.userController.getUserGroupId());
        e2.setArea("1");

        var params = EntityRestTestFunctions.getVersionParams(tutao.entity.EntityHelper.createPostListPermissionMap(BucketTestUtils.createDummyBucketData(), true));
        return tutao.locator.entityRestClient.postList(tutao.entity.tutanota.Mail.PATH, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function (returnEntity) {
            var listId = returnEntity.getGeneratedId();
            var elementParams = EntityRestTestFunctions.getVersionParams(e1._entityHelper.createPostPermissionMap(BucketTestUtils.createDummyBucketData()));
            return [listId, elementParams];
        }).spread(function (listId, elementParams) {
            return tutao.locator.entityRestClient.postElement(tutao.entity.tutanota.Mail.PATH, e1, listId, elementParams, tutao.entity.EntityHelper.createAuthHeaders()).then(function (returnEntity) {
                return [listId, elementParams, returnEntity];
            });
        }).spread(function(listId, elementParams, returnEntity) {
            return tutao.locator.entityRestClient.postElement(tutao.entity.tutanota.Mail.PATH, e2, listId, elementParams, tutao.entity.EntityHelper.createAuthHeaders()).then(function(returnEntity) {
                return [listId, e1, e2];
            });
        });
    },

    "test that only the specified amount of elements is returned": function (queue) {
        var self = this;
        queue.call('test', function (callbacks) {
            self.createListAndTwoMails().spread(function (listId, e1, e2) {
                return tutao.locator.entityRestClient.getElementRange(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, listId, tutao.rest.EntityRestInterface.GENERATED_MIN_ID, 1, false, EntityRestTestFunctions.getVersionParams(), tutao.entity.EntityHelper.createAuthHeaders()).then(function (loadedElements) {
                    assertEquals(1, loadedElements.length);
                    assertEquals(e1.toJsonData(), loadedElements[0].toJsonData());
                });
            }).done(callbacks.noop());
        });
    },

    "test that the elements are returned in reversed order if specified": function (queue) {
        var self = this;
        queue.call('test', function (callbacks) {
            self.createListAndTwoMails().spread(function (listId, e1, e2) {
                return tutao.locator.entityRestClient.getElementRange(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, listId,
                    tutao.rest.EntityRestInterface.GENERATED_MAX_ID, 10, true, EntityRestTestFunctions.getVersionParams(), tutao.entity.EntityHelper.createAuthHeaders()).then(function (loadedElements) {
                        assertEquals(e2.toJsonData(), loadedElements[0].toJsonData());
                        assertEquals(e1.toJsonData(), loadedElements[1].toJsonData());
                    });
            }).done(callbacks.noop());
        });
    },

    "test that elements are only returned from the specified starting point on": function (queue) {
        var self = this;
        queue.call('test', function (callbacks) {
            self.createListAndTwoMails().spread(function (listId, e1, e2) {
                return tutao.locator.entityRestClient.getElementRange(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, listId, e1.getId()[1], 10, false, EntityRestTestFunctions.getVersionParams(), tutao.entity.EntityHelper.createAuthHeaders()).then(function (loadedElements) {
                    assertEquals(1, loadedElements.length);
                    assertEquals(e2.toJsonData(), loadedElements[0].toJsonData());
                });
            }).done(callbacks.noop());
        });
    },

    "test that elements are only returned from the specified starting point on in reversed order": function (queue) {
        var self = this;
        queue.call('test', function (callbacks) {
            self.createListAndTwoMails().spread(function (listId, e1, e2) {
                return tutao.locator.entityRestClient.getElementRange(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, listId, e2.getId()[1], 10, true, EntityRestTestFunctions.getVersionParams(), tutao.entity.EntityHelper.createAuthHeaders()).then(function (loadedElements) {
                    assertEquals(1, loadedElements.length);
                    assertEquals(e1.toJsonData(), loadedElements[0].toJsonData());
                });
            }).done(callbacks.noop());
        });
    },

    "test that deleted list elements are removed": function (queue) {
        var self = this;
        queue.call('test', function (callbacks) {
            self.createListAndTwoMails().spread(function (listId, e1, e2) {
                var params = EntityRestTestFunctions.getVersionParams();
                return tutao.locator.entityRestClient.deleteElement(tutao.entity.tutanota.Mail.PATH, e1.getId()[1], listId, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function (data) {
                    return [params, listId, e1, e2];
                });
            }).spread(function(params, listId, e1, e2) {
                return tutao.locator.entityRestClient.getElementRange(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, listId, e1.getId()[1], 10, false, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function (loadedElements) {
                    assertEquals(1, loadedElements.length);
                    assertEquals(e2.toJsonData(), loadedElements[0].toJsonData());
                });
            }).done(callbacks.noop());
        });
    },

    // just for demonstrations purposes, same test without extensive use then clauses
    // outcome: if multiple method calls really depend on each other, it is better not to use too many then clauses
    "test that deleted list elements are removed2": function (queue) {
        var self = this;
        queue.call('test', function (callbacks) {
            self.createListAndTwoMails().spread(function (listId, e1, e2) {
                var params = EntityRestTestFunctions.getVersionParams();
                return tutao.locator.entityRestClient.deleteElement(tutao.entity.tutanota.Mail.PATH, e1.getId()[1], listId, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function (data) {
                    return tutao.locator.entityRestClient.getElementRange(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, listId, e1.getId()[1], 10, false, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function (loadedElements) {
                        assertEquals(1, loadedElements.length);
                        assertEquals(e2.toJsonData(), loadedElements[0].toJsonData());
                    });
                });
            }).done(callbacks.noop());
        });
    },

//	this is not yet implemented on server side
//	"test that deleted elements are removed": function(queue) {
//		var e1 = new tutao.entity.tutanota.MailBody();
//		e1.setText("hui");
//		assertTrue(tutao.locator.entityRestClient.postElement(tutao.entity.tutanota.MailBody.PATH, e1, null, e1._entityHelper.createPostPermissionMap(BucketTestUtils.createDummyBucketData()), tutao.entity.EntityHelper.createAuthHeaders()));
//		assertTrue(tutao.locator.entityRestClient.deleteElement(tutao.entity.tutanota.MailBody.PATH, e1.getId(), null, null, tutao.entity.EntityHelper.createAuthHeaders()));
//		assertEquals(undefined, tutao.locator.entityRestClient.getElement(tutao.entity.tutanota.MailBody, tutao.entity.tutanota.MailBody.PATH, e1.getId(), null, null, tutao.entity.EntityHelper.createAuthHeaders()));
//	},

    "test you are able to retrieve the updated element after updating it": function (queue) {
        var self = this;
        queue.call('test', function (callbacks) {
            var element = new tutao.entity.tutanota.MailBody();
            element.setOwner(tutao.locator.userController.getUserGroupId());
            element.setArea("1");
            element.setText("hello together!");
            var elementParams = EntityRestTestFunctions.getVersionParams(element._entityHelper.createPostPermissionMap(BucketTestUtils.createDummyBucketData()));
            tutao.locator.entityRestClient.postElement(tutao.entity.tutanota.MailBody.PATH, element, null, elementParams, tutao.entity.EntityHelper.createAuthHeaders()).then(function (returnEntity) {
                element.setText("hello all together!");
                var params = EntityRestTestFunctions.getVersionParams();
                return tutao.locator.entityRestClient.putElement(tutao.entity.tutanota.MailBody.PATH, element, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function () {
                    return tutao.locator.entityRestClient.getElement(tutao.entity.tutanota.MailBody, tutao.entity.tutanota.MailBody.PATH, element.getId(), null, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function (loadedElement) {
                        assertEquals(element.getText(), loadedElement.getText());
                    });
                });
            }).done(callbacks.noop());
        });
    },

    "test that you are able to retrieve an updated list element after updating it": function (queue) {
        var self = this;
        queue.call('test', function (callbacks) {
            var element = new tutao.entity.tutanota.Mail();
            element.setOwner(tutao.locator.userController.getUserGroupId());
            element.setArea("1");
            element.setSubject("hello together!");
            element.setSentDate(new Date());
            element.setUnread(true);
            var params = EntityRestTestFunctions.getVersionParams(tutao.entity.EntityHelper.createPostListPermissionMap(BucketTestUtils.createDummyBucketData(), true));
            tutao.locator.entityRestClient.postList(tutao.entity.tutanota.Mail.PATH, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function (returnEntity) {
                var listId = returnEntity.getGeneratedId();
                var elementParams = EntityRestTestFunctions.getVersionParams(element._entityHelper.createPostPermissionMap(BucketTestUtils.createDummyBucketData()));
                return tutao.locator.entityRestClient.postElement(tutao.entity.tutanota.Mail.PATH, element, listId, elementParams, tutao.entity.EntityHelper.createAuthHeaders()).then(function (returnEntity) {
                    element.setSubject("hello all together!");
                    return tutao.locator.entityRestClient.putElement(tutao.entity.tutanota.Mail.PATH, element, EntityRestTestFunctions.getVersionParams(), tutao.entity.EntityHelper.createAuthHeaders()).then(function () {
                        return tutao.locator.entityRestClient.getElement(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, element.getId()[1], element.getId()[0], EntityRestTestFunctions.getVersionParams(), tutao.entity.EntityHelper.createAuthHeaders()).then(function (loadedElement) {
                            assertEquals(element.getSubject(), loadedElement.getSubject());
                        });
                    });
                });
            }).done(callbacks.noop());
        });
    }
};