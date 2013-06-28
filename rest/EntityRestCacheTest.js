"use strict";

var EntityRestCacheTest = AsyncTestCase("EntityRestCacheTest");

JsHamcrest.Integration.JsTestDriver();
//JsMockito.Integration.JsTestDriver();

EntityRestCacheTest.prototype.setUp = function(queue) {
	var cache = new tutao.rest.EntityRestCache();
	cache.setTarget(new tutao.rest.EntityRestDummy());
	tutao.locator.replace('entityRestClient', cache);

	var key = tutao.locator.aesCrypter.generateRandomKey();
	tutao.locator.userController.getUserId = JsMockito.mockFunction();
	tutao.locator.userController.getUserGroupId = JsMockito.mockFunction();
	tutao.locator.userController.getUserGroupKey = JsMockito.mockFunction();
	JsMockito.when(tutao.locator.userController.getUserId)().thenReturn("---34---------");
	JsMockito.when(tutao.locator.userController.getUserGroupId)().thenReturn("---35---------");
	JsMockito.when(tutao.locator.userController.getUserGroupKey)().thenReturn(key);
};

EntityRestCacheTest.prototype.tearDown = function() {
	tutao.locator.reset();
};

EntityRestTestFunctions.addFunctionsToTestPrototype(EntityRestCacheTest);
