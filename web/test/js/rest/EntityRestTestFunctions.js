"use strict";

tutao.provide('EntityRestTestFunctions');

var assert = chai.assert;

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
 * @return {Promise.<ListIdAndTwoMails>} Provides the list id and the two mails.
 */
EntityRestTestFunctions.createListAndTwoMails = function () {
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

    var params = EntityRestTestFunctions.getVersionParams(tutao.entity.EntityHelper.createPostListPermissionMap(true));
    return tutao.locator.entityRestClient.postList(tutao.entity.tutanota.Mail.PATH, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function (returnEntity) {
        var listId = returnEntity.getGeneratedId();
        var elementParams = EntityRestTestFunctions.getVersionParams();
        return [listId, elementParams];
    }).spread(function (listId, elementParams) {
        return tutao.locator.entityRestClient.postElement(tutao.entity.tutanota.Mail.PATH, e1, listId, elementParams, tutao.entity.EntityHelper.createAuthHeaders()).then(function (returnEntity) {
            return [listId, elementParams, returnEntity];
        });
    }).spread(function (listId, elementParams, returnEntity) {
        return tutao.locator.entityRestClient.postElement(tutao.entity.tutanota.Mail.PATH, e2, listId, elementParams, tutao.entity.EntityHelper.createAuthHeaders()).then(function (returnEntity) {
            return [listId, e1, e2];
        });
    });
};

/**
 * Adds all entity rest test functions to the test that invokes this method. Call this functions
 * for each test case that tests a class that implements the EntityRestInterface.
 */
EntityRestTestFunctions.addFunctions = function () {

    it("test an empty db should throw an error on requests for an element", function () {
        return tutao.locator.entityRestClient.getElement(tutao.entity.tutanota.MailBody, tutao.entity.tutanota.MailBody.PATH, "-0DGl4rds--F", null, EntityRestTestFunctions.getVersionParams(), tutao.entity.EntityHelper.createAuthHeaders()).then(function () {
            assert.fail("no error occured");
        }).caught(function (exception) {
            assert.instanceOf(exception, tutao.NotFoundError);
        });
    });

    it("test an empty db should return an empty list on requests for elements", function () {
        return tutao.locator.entityRestClient.getElements(tutao.entity.tutanota.MailBody, tutao.entity.tutanota.MailBody.PATH, ["-0DGl4rds--E", "-0DGl4rds--F"], EntityRestTestFunctions.getVersionParams(), tutao.entity.EntityHelper.createAuthHeaders()).then(function (elements) {
            assert.deepEqual([], elements);
        });
    });

    it("test an empty db should return an empty list on requests for list elements", function () {
        var params = EntityRestTestFunctions.getVersionParams(tutao.entity.EntityHelper.createPostListPermissionMap(true));
        return tutao.locator.entityRestClient.postList(tutao.entity.tutanota.Mail.PATH, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function (returnEntity) {
            var listId = returnEntity.getGeneratedId();
            return tutao.locator.entityRestClient.getElementRange(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, listId, tutao.rest.EntityRestInterface.GENERATED_MIN_ID, 10, false, EntityRestTestFunctions.getVersionParams(), tutao.entity.EntityHelper.createAuthHeaders()).then(function (elements) {
                assert.deepEqual([], elements);
            });
        });
    });

    it("test you are able to retrieve an element after adding it", function () {
        var element = new tutao.entity.tutanota.MailBody();
        element.setOwner(tutao.locator.userController.getUserGroupId());
        element.setArea("1");
        element.setText("hello together!");
        var params = EntityRestTestFunctions.getVersionParams();
        return tutao.locator.entityRestClient.postElement(tutao.entity.tutanota.MailBody.PATH, element, null, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function (returnEntity) {
            assert.isTrue(element.getId() !== undefined);
            assert.isTrue(element.getId() !== null);
            assert.isTrue(element.getId() !== "");
            assert.isTrue(element.getPermissions() !== undefined);
            assert.isTrue(element.getPermissions() !== null);
            assert.isTrue(element.getPermissions() !== "");
            return tutao.locator.entityRestClient.getElement(tutao.entity.tutanota.MailBody, tutao.entity.tutanota.MailBody.PATH, element.getId(), null, EntityRestTestFunctions.getVersionParams(), tutao.entity.EntityHelper.createAuthHeaders()).then(function (loadedElement) {
                assert.deepEqual(element.toJsonData(), loadedElement.toJsonData());
            });
        });
    });

    it("test you are able to retrieve multiple elements after adding them", function () {
        var element1 = new tutao.entity.tutanota.MailBody();
        element1.setOwner(tutao.locator.userController.getUserGroupId());
        element1.setArea("1");
        element1.setText("hello together!");
        var params = EntityRestTestFunctions.getVersionParams();
        return tutao.locator.entityRestClient.postElement(tutao.entity.tutanota.MailBody.PATH, element1, null, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function (returnEntity) {
            var element2 = new tutao.entity.tutanota.MailBody();
            element2.setOwner(tutao.locator.userController.getUserGroupId());
            element2.setArea("1");
            element2.setText("hello together now!");
            var params = EntityRestTestFunctions.getVersionParams();
            return tutao.locator.entityRestClient.postElement(tutao.entity.tutanota.MailBody.PATH, element2, null, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function (returnEntity) {
                return tutao.locator.entityRestClient.getElements(tutao.entity.tutanota.MailBody, tutao.entity.tutanota.MailBody.PATH, [element1.getId(), element2.getId()], EntityRestTestFunctions.getVersionParams(), tutao.entity.EntityHelper.createAuthHeaders()).then(function (elements) {
                    assert.equal(2, elements.length);
                    if (element1.getId() == elements[0].getId()) {
                        assert.deepEqual(element1.toJsonData(), elements[0].toJsonData());
                        assert.deepEqual(element2.toJsonData(), elements[1].toJsonData());
                    } else {
                        assert.deepEqual(element1.toJsonData(), elements[1].toJsonData());
                        assert.deepEqual(element2.toJsonData(), elements[0].toJsonData());
                    }
                });
            });
        });
    });

    it("test that a list is created with the first listId", function () {
        var params = EntityRestTestFunctions.getVersionParams(tutao.entity.EntityHelper.createPostListPermissionMap(true));
        return tutao.locator.entityRestClient.postList(tutao.entity.tutanota.Mail.PATH, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function (returnEntity) {
            var listId = returnEntity.getGeneratedId();
            assert.isTrue(listId !== undefined);
            assert.isTrue(listId !== null);
            assert.isTrue(listId !== "");
            return tutao.locator.entityRestClient.getElementRange(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, listId, tutao.rest.EntityRestInterface.GENERATED_MIN_ID, 10, false, EntityRestTestFunctions.getVersionParams(), tutao.entity.EntityHelper.createAuthHeaders()).then(function (elements) {
                assert.deepEqual([], elements);
            });
        });
    });

    it("test that you are able to retrieve a list element after adding it to a list", function () {
        var element = new tutao.entity.tutanota.Mail();
        element.setOwner(tutao.locator.userController.getUserGroupId());
        element.setArea("1");
        element.setSubject("hello together!");
        element.setSentDate(new Date());
        element.setUnread(true);

        var params = EntityRestTestFunctions.getVersionParams(tutao.entity.EntityHelper.createPostListPermissionMap(true));
        return tutao.locator.entityRestClient.postList(tutao.entity.tutanota.Mail.PATH, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function (returnEntity) {
            var listId = returnEntity.getGeneratedId();
            var elementParams = EntityRestTestFunctions.getVersionParams();
            return tutao.locator.entityRestClient.postElement(tutao.entity.tutanota.Mail.PATH, element, listId, elementParams, tutao.entity.EntityHelper.createAuthHeaders()).then(function (returnEntity) {
                assert.equal(listId, element.getId()[0]);
                assert.isTrue(element.getId()[1] !== undefined);
                assert.isTrue(element.getId()[1] !== null);
                assert.isTrue(element.getId()[1] !== "");
                assert.isTrue(element.getPermissions() !== undefined);
                assert.isTrue(element.getPermissions() !== null);
                assert.isTrue(element.getPermissions() !== "");
                return tutao.locator.entityRestClient.getElement(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, element.getId()[1], element.getId()[0], EntityRestTestFunctions.getVersionParams(), tutao.entity.EntityHelper.createAuthHeaders()).then(function (element) {
                    assert.deepEqual(element.toJsonData(), element.toJsonData());
                    assert.equal("hello together!", element.getSubject());
                });
            });
        });
    });

    // not yet implemented
//	it("test that you are able to retrieve multiple list elements after adding them", function(queue) {
//		var e1 = new tutao.entity.tutanota.Mail();
//		var e2 = new tutao.entity.tutanota.Mail();
//		e1.setSubject("1");
//		e1.setDate(new Date());
//		e1.setRead(false);
//		e2.setSubject("2");
//		e2.setDate(new Date());
//		e2.setRead(false);
//		var listId = tutao.locator.entityRestClient.postList(tutao.entity.tutanota.Mail.PATH, tutao.entity.EntityHelper.createPostListPermissionMap(true), tutao.entity.EntityHelper.createAuthHeaders());
//		tutao.locator.entityRestClient.postElement(tutao.entity.tutanota.Mail.PATH, e1, listId, null, tutao.entity.EntityHelper.createAuthHeaders());
//		tutao.locator.entityRestClient.postElement(tutao.entity.tutanota.Mail.PATH, e2, listId, null, tutao.entity.EntityHelper.createAuthHeaders());
//		var loadedElements = tutao.locator.entityRestClient.getElements(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, [e1.getId(), e2.getId()], null, tutao.entity.EntityHelper.createAuthHeaders());
//		assert.equal(2, loadedElements.length);
//		assert.equal(e1.toJsonData(), loadedElements[0].toJsonData());
//		assert.equal(e2.toJsonData(), loadedElements[1].toJsonData());
//	});

    // not yet implemented
//	it("test that you only recieve existing elements", function(queue) {
//		var e1 = new tutao.entity.tutanota.Mail();
//		e1.setSubject("1");
//		e1.setDate(new Date());
//		e1.setRead(false);
//		var listId = tutao.locator.entityRestClient.postList(tutao.entity.tutanota.Mail.PATH, tutao.entity.EntityHelper.createPostListPermissionMap(true), tutao.entity.EntityHelper.createAuthHeaders());
//		tutao.locator.entityRestClient.postElement(tutao.entity.tutanota.Mail.PATH, e1, listId, null, tutao.entity.EntityHelper.createAuthHeaders());
//		var loadedElements = tutao.locator.entityRestClient.getElements(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, [e1.getId(), [e1.getId()[0], tutao.rest.EntityRestInterface.GENERATED_MIN_ID]], null, tutao.entity.EntityHelper.createAuthHeaders());
//		assert.equal(1, loadedElements.length);
//		assert.equal(e1.toJsonData(), loadedElements[0].toJsonData());
//	});

    it("test that you are able to retrieve a set of list elements after adding them", function () {
        var self = this;
        return EntityRestTestFunctions.createListAndTwoMails().spread(function (listId, e1, e2) {
            return tutao.locator.entityRestClient.getElementRange(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, listId, tutao.rest.EntityRestInterface.GENERATED_MIN_ID, 10, false, EntityRestTestFunctions.getVersionParams(), tutao.entity.EntityHelper.createAuthHeaders()).then(function (loadedElements) {
                assert.equal(2, loadedElements.length);
                assert.deepEqual(e1.toJsonData(), loadedElements[0].toJsonData());
                assert.deepEqual(e2.toJsonData(), loadedElements[1].toJsonData());
            });
        });
    });

    it("test that only the specified amount of elements is returned", function () {
        var self = this;
        return EntityRestTestFunctions.createListAndTwoMails().spread(function (listId, e1, e2) {
            return tutao.locator.entityRestClient.getElementRange(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, listId, tutao.rest.EntityRestInterface.GENERATED_MIN_ID, 1, false, EntityRestTestFunctions.getVersionParams(), tutao.entity.EntityHelper.createAuthHeaders()).then(function (loadedElements) {
                assert.equal(1, loadedElements.length);
                assert.deepEqual(e1.toJsonData(), loadedElements[0].toJsonData());
            });
        });
    });

    it("test that the elements are returned in reversed order if specified", function () {
        var self = this;
        return EntityRestTestFunctions.createListAndTwoMails().spread(function (listId, e1, e2) {
            return tutao.locator.entityRestClient.getElementRange(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, listId,
                tutao.rest.EntityRestInterface.GENERATED_MAX_ID, 10, true, EntityRestTestFunctions.getVersionParams(), tutao.entity.EntityHelper.createAuthHeaders()).then(function (loadedElements) {
                    assert.deepEqual(e2.toJsonData(), loadedElements[0].toJsonData());
                    assert.deepEqual(e1.toJsonData(), loadedElements[1].toJsonData());
                });
        });
    });

    it("test that elements are only returned from the specified starting point on", function () {
        var self = this;
        return EntityRestTestFunctions.createListAndTwoMails().spread(function (listId, e1, e2) {
            return tutao.locator.entityRestClient.getElementRange(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, listId, e1.getId()[1], 10, false, EntityRestTestFunctions.getVersionParams(), tutao.entity.EntityHelper.createAuthHeaders()).then(function (loadedElements) {
                assert.equal(1, loadedElements.length);
                assert.deepEqual(e2.toJsonData(), loadedElements[0].toJsonData());
            });
        });
    });

    it("test that elements are only returned from the specified starting point on in reversed order", function () {
        var self = this;
        return EntityRestTestFunctions.createListAndTwoMails().spread(function (listId, e1, e2) {
            return tutao.locator.entityRestClient.getElementRange(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, listId, e2.getId()[1], 10, true, EntityRestTestFunctions.getVersionParams(), tutao.entity.EntityHelper.createAuthHeaders()).then(function (loadedElements) {
                assert.equal(1, loadedElements.length);
                assert.deepEqual(e1.toJsonData(), loadedElements[0].toJsonData());
            });
        });
    });

    it("test that deleted list elements are removed", function () {
        var self = this;
        return EntityRestTestFunctions.createListAndTwoMails().spread(function (listId, e1, e2) {
            var params = EntityRestTestFunctions.getVersionParams();
            return tutao.locator.entityRestClient.deleteElement(tutao.entity.tutanota.Mail.PATH, e1.getId()[1], listId, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function (data) {
                return [params, listId, e1, e2];
            });
        }).spread(function (params, listId, e1, e2) {
            return tutao.locator.entityRestClient.getElementRange(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, listId, e1.getId()[1], 10, false, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function (loadedElements) {
                assert.equal(1, loadedElements.length);
                assert.deepEqual(e2.toJsonData(), loadedElements[0].toJsonData());
            });
        });
    });

    // just for demonstrations purposes, same test without extensive use then clauses
    // outcome: if multiple method calls really depend on each other, it is better not to use too many then clauses
    it("test that deleted list elements are removed2", function () {
        var self = this;
        return EntityRestTestFunctions.createListAndTwoMails().spread(function (listId, e1, e2) {
            var params = EntityRestTestFunctions.getVersionParams();
            return tutao.locator.entityRestClient.deleteElement(tutao.entity.tutanota.Mail.PATH, e1.getId()[1], listId, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function (data) {
                return tutao.locator.entityRestClient.getElementRange(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, listId, e1.getId()[1], 10, false, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function (loadedElements) {
                    assert.equal(1, loadedElements.length);
                    assert.deepEqual(e2.toJsonData(), loadedElements[0].toJsonData());
                });
            });
        });
    });

//	this is not yet implemented on server side
//	it("test that deleted elements are removed", function(queue) {
//		var e1 = new tutao.entity.tutanota.MailBody();
//		e1.setText("hui");
//		assert.isTrue(tutao.locator.entityRestClient.postElement(tutao.entity.tutanota.MailBody.PATH, e1, null, e1._entityHelper.createPostPermissionMap(), tutao.entity.EntityHelper.createAuthHeaders()));
//		assert.isTrue(tutao.locator.entityRestClient.deleteElement(tutao.entity.tutanota.MailBody.PATH, e1.getId(), null, null, tutao.entity.EntityHelper.createAuthHeaders()));
//		assert.equal(undefined, tutao.locator.entityRestClient.getElement(tutao.entity.tutanota.MailBody, tutao.entity.tutanota.MailBody.PATH, e1.getId(), null, null, tutao.entity.EntityHelper.createAuthHeaders()));
//	});

    it("test you are able to retrieve the updated element after updating it", function () {
        var self = this;
        var element = new tutao.entity.tutanota.MailBody();
        element.setOwner(tutao.locator.userController.getUserGroupId());
        element.setArea("1");
        element.setText("hello together!");
        var elementParams = EntityRestTestFunctions.getVersionParams();
        return tutao.locator.entityRestClient.postElement(tutao.entity.tutanota.MailBody.PATH, element, null, elementParams, tutao.entity.EntityHelper.createAuthHeaders()).then(function (returnEntity) {
            element.setText("hello all together!");
            var params = EntityRestTestFunctions.getVersionParams();
            return tutao.locator.entityRestClient.putElement(tutao.entity.tutanota.MailBody.PATH, element, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function () {
                return tutao.locator.entityRestClient.getElement(tutao.entity.tutanota.MailBody, tutao.entity.tutanota.MailBody.PATH, element.getId(), null, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function (loadedElement) {
                    assert.equal(element.getText(), loadedElement.getText());
                });
            });
        });
    });

    it("test that you are able to retrieve an updated list element after updating it", function () {
        var self = this;
        var element = new tutao.entity.tutanota.Mail();
        element.setOwner(tutao.locator.userController.getUserGroupId());
        element.setArea("1");
        element.setSubject("hello together!");
        element.setSentDate(new Date());
        element.setUnread(true);
        var params = EntityRestTestFunctions.getVersionParams(tutao.entity.EntityHelper.createPostListPermissionMap(true));
        return tutao.locator.entityRestClient.postList(tutao.entity.tutanota.Mail.PATH, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function (returnEntity) {
            var listId = returnEntity.getGeneratedId();
            var elementParams = EntityRestTestFunctions.getVersionParams();
            return tutao.locator.entityRestClient.postElement(tutao.entity.tutanota.Mail.PATH, element, listId, elementParams, tutao.entity.EntityHelper.createAuthHeaders()).then(function (returnEntity) {
                element.setSubject("hello all together!");
                return tutao.locator.entityRestClient.putElement(tutao.entity.tutanota.Mail.PATH, element, EntityRestTestFunctions.getVersionParams(), tutao.entity.EntityHelper.createAuthHeaders()).then(function () {
                    return tutao.locator.entityRestClient.getElement(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, element.getId()[1], element.getId()[0], EntityRestTestFunctions.getVersionParams(), tutao.entity.EntityHelper.createAuthHeaders()).then(function (loadedElement) {
                        assert.equal(element.getSubject(), loadedElement.getSubject());
                    });
                });
            });
        });
    });

};

