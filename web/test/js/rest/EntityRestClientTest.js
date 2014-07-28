"use strict";

goog.provide('EntityRestClientTest');

// we do not need to use an AsyncTestCase because all EntityRest calls are synchronous because the RestClient is mocked.
var EntityRestClientTest = TestCase("EntityRestClientTest");


/**
 * Tests the get functionality for element types.
 */
EntityRestClientTest.prototype.testGetElementWithoutListId = function() {
	var RestClient = new tutao.rest.RestClient();
	tutao.locator.replace('restClient', RestClient);
	var EntityRestClient = new tutao.rest.EntityRestClient();

	// mock RestClient.getElement()
	RestClient.getElement = function(path, headers, json) {
		assertEquals("/rest/tutanota/mailbody/100", path);
        return Promise.resolve({ _id: "100", text: "hello"});
	};
	EntityRestClient.getElement(tutao.entity.tutanota.MailBody, tutao.entity.tutanota.MailBody.PATH, "100", null, null, null).then(function(mailBody) {
		assertEquals("hello", mailBody.getText());
	});
};

/**
 * Tests the get functionality for list element types.
 */
EntityRestClientTest.prototype.testGetElementWithListId = function() {
	var RestClient = new tutao.rest.RestClient();
	tutao.locator.replace('restClient', RestClient);
	var EntityRestClient = new tutao.rest.EntityRestClient();

	RestClient.getElement = function(path, headers, json) {
		assertEquals("/rest/tutanota/mail/300/100", path);
        return Promise.resolve({ _id: ["300","100"], subject: "hello2", recipients: []});
	};
	EntityRestClient.getElement(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, "100", "300", null, null, function(mail, exception) {
		assertUndefined(exception);
		assertEquals("hello2", mail.getSubject());
	});
};

/**
 * Tests the post functionality for element types.
 */
EntityRestClientTest.prototype.testPostElementWithoutListId = function() {
	var RestClient = new tutao.rest.RestClient();
	tutao.locator.replace('restClient', RestClient);
	var EntityRestClient = new tutao.rest.EntityRestClient();

	var body = new tutao.entity.tutanota.MailBody();

	// mock away the rest client
	RestClient.postElement = function(path, headers, json, callback) {
		assertEquals("/rest/tutanota/mailbody", path);
		assertEquals(body.toJsonData(), JSON.parse(json));
        return Promise.resolve({generatedId: "400", permissionListId: "564" });
	};
	EntityRestClient.postElement(tutao.entity.tutanota.MailBody.PATH, body, null, null, null, function(returnEntity, exception) {
		assertUndefined(exception);
		assertEquals("400", body.getId());
		assertEquals("564", body.getPermissions());
	});
};

/**
 * Tests the post functionality for list element types.
 */
EntityRestClientTest.prototype.testPostElementWithListId = function() {
	var RestClient = new tutao.rest.RestClient();
	tutao.locator.replace('restClient', RestClient);
	var EntityRestClient = new tutao.rest.EntityRestClient();

	var mail = new tutao.entity.tutanota.Mail();

	// mock away the rest client
	RestClient.postElement = function(path, headers, json, callback) {
		assertEquals("/rest/tutanota/mail/500", path);
		assertEquals(mail.toJsonData(), JSON.parse(json));
        return Promise.resolve({generatedId: "500", permissionListId: "564"});
	};
	EntityRestClient.postElement(tutao.entity.tutanota.Mail.PATH, mail, "500", null, null, function(returnEntity, exception) {
		assertUndefined(exception);
		assertEquals("500", mail.getId()[1]);
		assertEquals("564", mail.getPermissions());
	});
};

/**
 * Tests the post functionality on lists.
 */
EntityRestClientTest.prototype.testPostList = function() {
	var RestClient = new tutao.rest.RestClient();
	tutao.locator.replace('restClient', RestClient);
	var EntityRestClient = new tutao.rest.EntityRestClient();

	RestClient.postElement = function(path, headers, json, callback) {
		assertEquals("/rest/tutanota/mail", path);
		assertEquals("", json);
        return Promise.resolve({generatedId: "600"});
	};
	EntityRestClient.postList(tutao.entity.tutanota.Mail.PATH, null, null, function(returnEntity, exception) {
		assertUndefined(exception);
		var listId = returnEntity.getGeneratedId();
		assertEquals("600", listId);
	});
};

/**
 * Tests the put functionality for element types.
 */
EntityRestClientTest.prototype.testPutElementWithoutListId = function() {
	var RestClient = new tutao.rest.RestClient();
	tutao.locator.replace('restClient', RestClient);
	var EntityRestClient = new tutao.rest.EntityRestClient();

	var body = new tutao.entity.tutanota.MailBody({_id: '600', _permissions: "564"});

	RestClient.putElement = function(path, headers, json, callback) {
		assertEquals("/rest/tutanota/mailbody/600", path);
		assertEquals(JSON.stringify(body.toJsonData()), json);
        return Promise.resolve();
	};
	EntityRestClient.putElement(tutao.entity.tutanota.MailBody.PATH, body, null, null, function(exception) {
		assertUndefined(exception);
	});
};

/**
 * Tests the put functionality for list element types.
 */
EntityRestClientTest.prototype.testPutElementWithListId = function() {
	var RestClient = new tutao.rest.RestClient();
	tutao.locator.replace('restClient', RestClient);
	var EntityRestClient = new tutao.rest.EntityRestClient();

	var mail = new tutao.entity.tutanota.Mail({_id: ["600", "5"], _permissions: "564", toRecipients: [], ccRecipients: [], bccRecipients: []});

	RestClient.putElement = function(path, headers, json, callback) {
		assertEquals("/rest/tutanota/mail/600/5", path);
		assertEquals(JSON.stringify(mail.toJsonData()), json);
        return Promise.resolve();
	};
	EntityRestClient.putElement(tutao.entity.tutanota.Mail.PATH, mail, null, null, function(exception) {
		assertUndefined(exception);
	});
};


/**
 * Tests the get functionality a range of list elements.
 */
EntityRestClientTest.prototype.testGetElementRange = function() {
	var RestClient = new tutao.rest.RestClient();
	tutao.locator.replace('restClient', RestClient);
	var EntityRestClient = new tutao.rest.EntityRestClient();

	// mock RestClient.getElement()
	RestClient.getElement = function(path, headers, json) {
		assertEquals("/rest/tutanota/mail/700?start=800&count=2&reverse=false", path);
        return Promise.resolve([]);// just return an empty list for testing
	};
	EntityRestClient.getElementRange(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, "700", "800", 2, false, null, null, function(dummies, exception) {
		assertUndefined(exception);
		assertEquals([], dummies);
	});
};

/**
 * Tests the delete functionality for a ETs.
 */
EntityRestClientTest.prototype.testDeleteElementsWithoutListId = function() {
	var RestClient = new tutao.rest.RestClient();
	tutao.locator.replace('restClient', RestClient);
	var EntityRestClient = new tutao.rest.EntityRestClient();

	// mock RestClient.deleteElement()
	RestClient.deleteElement = function(path, headers, json, callback) {
		assertEquals("/rest/tutanota/mailbody/1", path);
        return Promise.resolve();
	};
	var id = 1;
	EntityRestClient.deleteElement(tutao.entity.tutanota.MailBody.PATH, id, null, null, null, function(exception) {
		assertUndefined(exception);
	});
};

/**
 * Tests the delete functionality for a LETs.
 */
EntityRestClientTest.prototype.testDeleteElementsWithListId = function() {
	var RestClient = new tutao.rest.RestClient();
	tutao.locator.replace('restClient', RestClient);
	var EntityRestClient = new tutao.rest.EntityRestClient();

	// mock RestClient.deleteElement()
	RestClient.deleteElement = function(path, headers, json, callback) {
		assertEquals("/rest/tutanota/mail/100/1", path);
        return Promise.resolve();
	};
	var id = 1;
	EntityRestClient.deleteElement(tutao.entity.tutanota.Mail.PATH, id, "100", null, null, function(exception) {
		assertUndefined(exception);
	});
};
