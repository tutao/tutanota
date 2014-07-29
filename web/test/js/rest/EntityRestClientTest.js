"use strict";

describe("EntityRestClientTest", function () {

    var assert = chai.assert;


    it("GetElementWithoutListId ", function () {
        var RestClient = new tutao.rest.RestClient();
        tutao.locator.replace('restClient', RestClient);
        var EntityRestClient = new tutao.rest.EntityRestClient();

        // mock RestClient.getElement()
        RestClient.getElement = function (path, headers, json) {
            assert.equal("/rest/tutanotaunencrypted/mailbody/100", path);
            return Promise.resolve({ _id: "100", text: "hello"});
        };
        return EntityRestClient.getElement(tutao.entity.tutanotaunencrypted.MailBody, tutao.entity.tutanotaunencrypted.MailBody.PATH, "100", null, null, null).then(function (mailBody) {
            assert.equal("hello", mailBody.getText());
        });
    });

    /**
     * Tests the get functionality for list element types.
     */
    it("GetElementWithListId ", function () {
        var RestClient = new tutao.rest.RestClient();
        tutao.locator.replace('restClient', RestClient);
        var EntityRestClient = new tutao.rest.EntityRestClient();

        RestClient.getElement = function (path, headers, json) {
            assert.equal("/rest/tutanotaunencrypted/mail/300/100", path);
            return Promise.resolve({ _id: ["300", "100"], subject: "hello2", recipients: []});
        };
        return EntityRestClient.getElement(tutao.entity.tutanotaunencrypted.Mail, tutao.entity.tutanotaunencrypted.Mail.PATH, "100", "300", null, null).then(function (mail) {
            assert.equal("hello2", mail.getSubject());
        });
    });

    /**
     * Tests the post functionality for element types.
     */
    it("PostElementWithoutListId ", function () {
        var RestClient = new tutao.rest.RestClient();
        tutao.locator.replace('restClient', RestClient);
        var EntityRestClient = new tutao.rest.EntityRestClient();

        var body = new tutao.entity.tutanotaunencrypted.MailBody();

        // mock away the rest client
        RestClient.postElement = function (path, headers, json, callback) {
            assert.equal("/rest/tutanotaunencrypted/mailbody", path);
            assert.deepEqual(body.toJsonData(), JSON.parse(json));
            return Promise.resolve({generatedId: "400", permissionListId: "564" });
        };
        return EntityRestClient.postElement(tutao.entity.tutanotaunencrypted.MailBody.PATH, body, null, null, null).then(function (returnEntity) {
            assert.equal("400", body.getId());
            assert.equal("564", body.getPermissions());
        });
    });

    /**
     * Tests the post functionality for list element types.
     */
    it("PostElementWithListId ", function () {
        var RestClient = new tutao.rest.RestClient();
        tutao.locator.replace('restClient', RestClient);
        var EntityRestClient = new tutao.rest.EntityRestClient();

        var mail = new tutao.entity.tutanotaunencrypted.Mail();

        // mock away the rest client
        RestClient.postElement = function (path, headers, json, callback) {
            assert.equal("/rest/tutanotaunencrypted/mail/500", path);
            assert.deepEqual(mail.toJsonData(), JSON.parse(json));
            return Promise.resolve({generatedId: "500", permissionListId: "564"});
        };
        return EntityRestClient.postElement(tutao.entity.tutanotaunencrypted.Mail.PATH, mail, "500", null, null).then(function (returnEntity) {
            assert.equal("500", mail.getId()[1]);
            assert.equal("564", mail.getPermissions());
        });
    });

    /**
     * Tests the post functionality on lists.
     */
    it("PostList ", function () {
        var RestClient = new tutao.rest.RestClient();
        tutao.locator.replace('restClient', RestClient);
        var EntityRestClient = new tutao.rest.EntityRestClient();

        RestClient.postElement = function (path, headers, json, callback) {
            assert.equal("/rest/tutanotaunencrypted/mail", path);
            assert.equal("", json);
            return Promise.resolve({generatedId: "600"});
        };
        return EntityRestClient.postList(tutao.entity.tutanotaunencrypted.Mail.PATH, null, null).then(function (returnEntity) {
            var listId = returnEntity.getGeneratedId();
            assert.equal("600", listId);
        });
    });

    /**
     * Tests the put functionality for element types.
     */
    it("PutElementWithoutListId ", function () {
        var RestClient = new tutao.rest.RestClient();
        tutao.locator.replace('restClient', RestClient);
        var EntityRestClient = new tutao.rest.EntityRestClient();

        var body = new tutao.entity.tutanotaunencrypted.MailBody({_id: '600', _permissions: "564"});

        RestClient.putElement = function (path, headers, json, callback) {
            assert.equal("/rest/tutanotaunencrypted/mailbody/600", path);
            assert.equal(JSON.stringify(body.toJsonData()), json);
            return Promise.resolve();
        };
        return EntityRestClient.putElement(tutao.entity.tutanotaunencrypted.MailBody.PATH, body, null, null);
    });

    /**
     * Tests the put functionality for list element types.
     */
    it("PutElementWithListId ", function () {
        var RestClient = new tutao.rest.RestClient();
        tutao.locator.replace('restClient', RestClient);
        var EntityRestClient = new tutao.rest.EntityRestClient();

        var mail = new tutao.entity.tutanotaunencrypted.Mail({_id: ["600", "5"], _permissions: "564", recipients: []});

        RestClient.putElement = function (path, headers, json, callback) {
            assert.equal("/rest/tutanotaunencrypted/mail/600/5", path);
            assert.equal(JSON.stringify(mail.toJsonData()), json);
            return Promise.resolve();
        };
        return EntityRestClient.putElement(tutao.entity.tutanotaunencrypted.Mail.PATH, mail, null, null);
    });

    /**
     * Tests the get functionality a range of list elements.
     */
    it("GetElementRange ", function () {
        var RestClient = new tutao.rest.RestClient();
        tutao.locator.replace('restClient', RestClient);
        var EntityRestClient = new tutao.rest.EntityRestClient();

        // mock RestClient.getElement()
        RestClient.getElement = function (path, headers, json) {
            assert.equal("/rest/tutanotaunencrypted/mail/700?start=800&count=2&reverse=false", path);
            return Promise.resolve([]);// just return an empty list for testing
        };
        return EntityRestClient.getElementRange(tutao.entity.tutanotaunencrypted.Mail, tutao.entity.tutanotaunencrypted.Mail.PATH, "700", "800", 2, false, null, null).then(function (dummies) {
            assert.deepEqual([], dummies);
        });
    });

    /**
     * Tests the delete functionality for a ETs.
     */
    it("DeleteElementsWithoutListId ", function () {
        var RestClient = new tutao.rest.RestClient();
        tutao.locator.replace('restClient', RestClient);
        var EntityRestClient = new tutao.rest.EntityRestClient();

        // mock RestClient.deleteElement()
        RestClient.deleteElement = function (path, headers, json, callback) {
            assert.equal("/rest/tutanotaunencrypted/mailbody/1", path);
            return Promise.resolve();
        };
        var id = 1;
        return EntityRestClient.deleteElement(tutao.entity.tutanotaunencrypted.MailBody.PATH, id, null, null, null);
    });

    /**
     * Tests the delete functionality for a LETs.
     */
    it("DeleteElementsWithListId ", function () {
        var RestClient = new tutao.rest.RestClient();
        tutao.locator.replace('restClient', RestClient);
        var EntityRestClient = new tutao.rest.EntityRestClient();

        // mock RestClient.deleteElement()
        RestClient.deleteElement = function (path, headers, json, callback) {
            assert.equal("/rest/tutanotaunencrypted/mail/100/1", path);
            return Promise.resolve();
        };
        var id = 1;
        return EntityRestClient.deleteElement(tutao.entity.tutanotaunencrypted.Mail.PATH, id, "100", null, null);
    });


});