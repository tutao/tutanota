"use strict";

goog.provide('EntityRestTestFunctions');

/**
 * Adds all entity rest test functions to the prototype of the given test. Call this functions 
 * for each test case that tests a class that implements the EntityRestInterface.
 * @param {TestCase} testCase The test case to add the functions to.
 */
EntityRestTestFunctions.addFunctionsToTestPrototype = function(testCase) {
	(function() {
		var functions = EntityRestTestFunctions.functions;
		for (var name in functions) {
			testCase.prototype[name] = functions[name];
		}
	})();
};

/**
 * @param ?Object.<string, string> params If provided, the version param will be added to this map. 
 */
EntityRestTestFunctions.getVersionParams =  function(params) {
	if (!params) {
		params = {};
	}
	params[tutao.rest.ResourceConstants.SW_VERSION_PARAMETER] = tutao.entity.Constants.Version;
	return params;
};

/**
 * An object containing functions to test the EntityRest* classes or chains of them.
 */
EntityRestTestFunctions.functions = {
		
	"test an empty db should throw an error on requests for an element": function(queue) {
		queue.call('test', function(callbacks) {
			tutao.locator.entityRestClient.getElement(tutao.entity.tutanota.MailBody, tutao.entity.tutanota.MailBody.PATH, "-0DGl4rds--F", null, EntityRestTestFunctions.getVersionParams(), tutao.entity.EntityHelper.createAuthHeaders(), callbacks.add(function(element, exception) {
				assertInstanceOf(tutao.rest.EntityRestException, exception);
				assertEquals("RestException(404)", exception.getOriginal().name);
			}));
		});
	},

	"test an empty db should return an empty list on requests for elements": function(queue) {
		queue.call('test', function(callbacks) {
			tutao.locator.entityRestClient.getElements(tutao.entity.tutanota.MailBody, tutao.entity.tutanota.MailBody.PATH, ["-0DGl4rds--E", "-0DGl4rds--F"], EntityRestTestFunctions.getVersionParams(), tutao.entity.EntityHelper.createAuthHeaders(), callbacks.add(function(elements, exception) {
				assertUndefined(exception);
				assertEquals([], elements);
			}));
		});
	},

	"test an empty db should return an empty list on requests for list elements": function(queue) {
		queue.call('test', function(callbacks) {
			var params = EntityRestTestFunctions.getVersionParams(tutao.entity.EntityHelper.createPostListPermissionMap(BucketTestUtils.createDummyBucketData(), true));
			tutao.locator.entityRestClient.postList(tutao.entity.tutanota.Mail.PATH, params, tutao.entity.EntityHelper.createAuthHeaders(), callbacks.add(function(returnEntity, exception1) {
				assertUndefined(exception1);
				var listId = returnEntity.getGeneratedId();
				tutao.locator.entityRestClient.getElementRange(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, listId,	tutao.rest.EntityRestInterface.GENERATED_MIN_ID, 10, false, EntityRestTestFunctions.getVersionParams(), tutao.entity.EntityHelper.createAuthHeaders(), callbacks.add(function(elements, exception2) {
					assertUndefined(exception2);
					assertEquals([], elements);
				}));
			}));
		});
	},
	
	"test you are able to retrieve an element after adding it": function(queue) {
		queue.call('test', function(callbacks) {
			var element = new tutao.entity.tutanota.MailBody();
			element.setText("hello together!");
			var params = EntityRestTestFunctions.getVersionParams(element._entityHelper.createPostPermissionMap(BucketTestUtils.createDummyBucketData()));
			tutao.locator.entityRestClient.postElement(tutao.entity.tutanota.MailBody.PATH, element, null, params, tutao.entity.EntityHelper.createAuthHeaders(), callbacks.add(function(returnEntity, exception1) {
				assertUndefined(exception1);
				assertTrue(element.getId() !== undefined);
				assertTrue(element.getId() !== null);
				assertTrue(element.getId() !== "");
				assertTrue(element.getPermissions() !== undefined);
				assertTrue(element.getPermissions() !== null);
				assertTrue(element.getPermissions() !== "");
				tutao.locator.entityRestClient.getElement(tutao.entity.tutanota.MailBody, tutao.entity.tutanota.MailBody.PATH, element.getId(), null, EntityRestTestFunctions.getVersionParams(), tutao.entity.EntityHelper.createAuthHeaders(), callbacks.add(function(loadedElement, exception2) {
					assertUndefined(exception2);
					assertEquals(element.toJsonData(), loadedElement.toJsonData());
				}));
			}));
		});
	},

	"test you are able to retrieve multiple elements after adding them": function(queue) {
		queue.call('test', function(callbacks) {
			var element1 = new tutao.entity.tutanota.MailBody();
			element1.setText("hello together!");
			var params = EntityRestTestFunctions.getVersionParams(element1._entityHelper.createPostPermissionMap(BucketTestUtils.createDummyBucketData()));
			tutao.locator.entityRestClient.postElement(tutao.entity.tutanota.MailBody.PATH, element1, null, params, tutao.entity.EntityHelper.createAuthHeaders(), callbacks.add(function(returnEntity, exception1) {
				assertUndefined(exception1);
				var element2 = new tutao.entity.tutanota.MailBody();
				element2.setText("hello together now!");
				var params = EntityRestTestFunctions.getVersionParams(element2._entityHelper.createPostPermissionMap(BucketTestUtils.createDummyBucketData()));
				tutao.locator.entityRestClient.postElement(tutao.entity.tutanota.MailBody.PATH, element2, null, params, tutao.entity.EntityHelper.createAuthHeaders(), callbacks.add(function(returnEntity, exception2) {
					assertUndefined(exception2);
					tutao.locator.entityRestClient.getElements(tutao.entity.tutanota.MailBody, tutao.entity.tutanota.MailBody.PATH, [element1.getId(), element2.getId()], EntityRestTestFunctions.getVersionParams(), tutao.entity.EntityHelper.createAuthHeaders(), callbacks.add(function(elements, exception3) {
						assertUndefined(exception3);
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
			}));
		});
	},

	"test that a list is created with the first listId": function(queue) {
		queue.call('test', function(callbacks) {
			var params = EntityRestTestFunctions.getVersionParams(tutao.entity.EntityHelper.createPostListPermissionMap(BucketTestUtils.createDummyBucketData(), true));
			tutao.locator.entityRestClient.postList(tutao.entity.tutanota.Mail.PATH, params, tutao.entity.EntityHelper.createAuthHeaders(), callbacks.add(function(returnEntity, exception1) {
				assertUndefined(exception1);
				var listId = returnEntity.getGeneratedId();
				assertTrue(listId !== undefined);
				assertTrue(listId !== null);
				assertTrue(listId !== "");
				tutao.locator.entityRestClient.getElementRange(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, listId,	tutao.rest.EntityRestInterface.GENERATED_MIN_ID, 10, false, EntityRestTestFunctions.getVersionParams(), tutao.entity.EntityHelper.createAuthHeaders(), callbacks.add(function(elements, exception2) {
					assertUndefined(exception2);
					assertEquals([], elements);
				}));
			}));
		});
	},

	"test that you are able to retrieve a list element after adding it to a list": function(queue) {
		queue.call('test', function(callbacks) {
			var element = new tutao.entity.tutanota.Mail();
			element.setSubject("hello together!");
			element.setDate(new Date());
			element.setRead(false);
			
			var params = EntityRestTestFunctions.getVersionParams(tutao.entity.EntityHelper.createPostListPermissionMap(BucketTestUtils.createDummyBucketData(), true));
			tutao.locator.entityRestClient.postList(tutao.entity.tutanota.Mail.PATH, params, tutao.entity.EntityHelper.createAuthHeaders(), callbacks.add(function(returnEntity, exception1) {
				assertUndefined(exception1);
				var listId = returnEntity.getGeneratedId();
				var elementParams = EntityRestTestFunctions.getVersionParams(element._entityHelper.createPostPermissionMap(BucketTestUtils.createDummyBucketData()));
				tutao.locator.entityRestClient.postElement(tutao.entity.tutanota.Mail.PATH, element, listId, elementParams, tutao.entity.EntityHelper.createAuthHeaders(), callbacks.add(function(returnEntity, exception2) {
					assertUndefined(exception2);
					assertEquals(listId, element.getId()[0]);
					assertTrue(element.getId()[1] !== undefined);
					assertTrue(element.getId()[1] !== null);
					assertTrue(element.getId()[1] !== "");
					assertTrue(element.getPermissions() !== undefined);
					assertTrue(element.getPermissions() !== null);
					assertTrue(element.getPermissions() !== "");
					tutao.locator.entityRestClient.getElement(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, element.getId()[1], element.getId()[0], EntityRestTestFunctions.getVersionParams(), tutao.entity.EntityHelper.createAuthHeaders(), callbacks.add(function(element, exception3) {
						assertUndefined(exception3);
						assertEquals(element.toJsonData(), element.toJsonData());
						assertEquals("hello together!", element.getSubject());
					}));
				}));
			}));
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

	"test that you are able to retrieve a set of list elements after adding them": function(queue) {
		var self = this;
		queue.call('test', function(callbacks) {
			self.createListAndTwoMails(callbacks, function(listId, e1, e2) {
				tutao.locator.entityRestClient.getElementRange(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, listId, tutao.rest.EntityRestInterface.GENERATED_MIN_ID, 10, false, EntityRestTestFunctions.getVersionParams(), tutao.entity.EntityHelper.createAuthHeaders(), callbacks.add(function(loadedElements, e) {
					assertUndefined(e);	
					assertEquals(2, loadedElements.length);
					assertEquals(e1.toJsonData(), loadedElements[0].toJsonData());
					assertEquals(e2.toJsonData(), loadedElements[1].toJsonData());
				}));				
			});
		});
	},
	
	/**
	 * @param {function(string, tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail)} callback Provides the list id and the two mails.
	 */
	createListAndTwoMails: function(testCallbacks, callback) {
		var self = this;
		var e1 = new tutao.entity.tutanota.Mail();
		var e2 = new tutao.entity.tutanota.Mail();
		e1.setSubject("1");
		e1.setDate(new Date());
		e1.setRead(false);
		e2.setSubject("2");
		e2.setDate(new Date());
		e2.setRead(false);

		var params = EntityRestTestFunctions.getVersionParams(tutao.entity.EntityHelper.createPostListPermissionMap(BucketTestUtils.createDummyBucketData(), true));
		tutao.locator.entityRestClient.postList(tutao.entity.tutanota.Mail.PATH, params, tutao.entity.EntityHelper.createAuthHeaders(), testCallbacks.add(function(returnEntity, exception1) {
			var listId = returnEntity.getGeneratedId();
			assertUndefined(exception1);
			var elementParams = EntityRestTestFunctions.getVersionParams(e1._entityHelper.createPostPermissionMap(BucketTestUtils.createDummyBucketData()));
			tutao.locator.entityRestClient.postElement(tutao.entity.tutanota.Mail.PATH, e1, listId, elementParams, tutao.entity.EntityHelper.createAuthHeaders(), testCallbacks.add(function(returnEntity, exception2) {
				assertUndefined(exception2);
				tutao.locator.entityRestClient.postElement(tutao.entity.tutanota.Mail.PATH, e2, listId, elementParams, tutao.entity.EntityHelper.createAuthHeaders(), testCallbacks.add(function(returnEntity, exception3) {
					assertUndefined(exception3);
					callback(listId, e1, e2);
				}));
			}));
		}));
	},

	"test that only the specified amount of elements is returned": function(queue) {
		var self = this;
		queue.call('test', function(callbacks) {
			self.createListAndTwoMails(callbacks, function(listId, e1, e2) {
				tutao.locator.entityRestClient.getElementRange(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, listId, tutao.rest.EntityRestInterface.GENERATED_MIN_ID, 1, false, EntityRestTestFunctions.getVersionParams(), tutao.entity.EntityHelper.createAuthHeaders(), callbacks.add(function(loadedElements, e4) {
					assertUndefined(e4);					
					assertEquals(1, loadedElements.length);
					assertEquals(e1.toJsonData(), loadedElements[0].toJsonData());
				}));
			});
		});
	},

	"test that the elements are returned in reversed order if specified": function(queue) {
		var self = this;
		queue.call('test', function(callbacks) {
			self.createListAndTwoMails(callbacks, function(listId, e1, e2) {
				tutao.locator.entityRestClient.getElementRange(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, listId,
						tutao.rest.EntityRestInterface.GENERATED_MAX_ID, 10, true, EntityRestTestFunctions.getVersionParams(), tutao.entity.EntityHelper.createAuthHeaders(), callbacks.add(function(loadedElements, e) {
					assertUndefined(e);	
					assertEquals(e2.toJsonData(), loadedElements[0].toJsonData());
					assertEquals(e1.toJsonData(), loadedElements[1].toJsonData());
				}));
			});
		});
	},

	"test that elements are only returned from the specified starting point on": function(queue) {
		var self = this;
		queue.call('test', function(callbacks) {
			self.createListAndTwoMails(callbacks, function(listId, e1, e2) {
				tutao.locator.entityRestClient.getElementRange(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, listId, e1.getId()[1], 10, false, EntityRestTestFunctions.getVersionParams(), tutao.entity.EntityHelper.createAuthHeaders(), callbacks.add(function(loadedElements, e) {
					assertUndefined(e);					
					assertEquals(1, loadedElements.length);
					assertEquals(e2.toJsonData(), loadedElements[0].toJsonData());
				}));
			});
		});
	},

	"test that elements are only returned from the specified starting point on in reversed order": function(queue) {
		var self = this;
		queue.call('test', function(callbacks) {
			self.createListAndTwoMails(callbacks, function(listId, e1, e2) {
				tutao.locator.entityRestClient.getElementRange(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, listId, e2.getId()[1], 10, true, EntityRestTestFunctions.getVersionParams(), tutao.entity.EntityHelper.createAuthHeaders(), callbacks.add(function(loadedElements, exception) {
					assertUndefined(exception);
					assertEquals(1, loadedElements.length);
					assertEquals(e1.toJsonData(), loadedElements[0].toJsonData());
				}));
			});
		});
	},

	"test that deleted list elements are removed": function(queue) {
		var self = this;
		queue.call('test', function(callbacks) {
			self.createListAndTwoMails(callbacks, function(listId, e1, e2) {
				var params = EntityRestTestFunctions.getVersionParams();
				tutao.locator.entityRestClient.deleteElement(tutao.entity.tutanota.Mail.PATH, e1.getId()[1], listId, params, tutao.entity.EntityHelper.createAuthHeaders(), callbacks.add(function(data, exception1) {
					assertUndefined(exception1);
					tutao.locator.entityRestClient.getElementRange(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, listId, e1.getId()[1], 10, false, params, tutao.entity.EntityHelper.createAuthHeaders(), callbacks.add(function(loadedElements, exception2) {
						assertUndefined(exception2);
						assertEquals(1, loadedElements.length);
						assertEquals(e2.toJsonData(), loadedElements[0].toJsonData());
					}));
				}));
			});
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

	"test you are able to retrieve the updated element after updating it": function(queue) {
		var self = this;
		queue.call('test', function(callbacks) {
			var element = new tutao.entity.tutanota.MailBody();
			element.setText("hello together!");
			var elementParams = EntityRestTestFunctions.getVersionParams(element._entityHelper.createPostPermissionMap(BucketTestUtils.createDummyBucketData()));			
			tutao.locator.entityRestClient.postElement(tutao.entity.tutanota.MailBody.PATH, element, null, elementParams, tutao.entity.EntityHelper.createAuthHeaders(), callbacks.add(function(returnEntity, exception1) {
				assertUndefined(exception1);
				element.setText("hello all together!");
				var params = EntityRestTestFunctions.getVersionParams();
				tutao.locator.entityRestClient.putElement(tutao.entity.tutanota.MailBody.PATH, element, params, tutao.entity.EntityHelper.createAuthHeaders(), callbacks.add(function(exception2) {
					assertUndefined(exception2);
					tutao.locator.entityRestClient.getElement(tutao.entity.tutanota.MailBody, tutao.entity.tutanota.MailBody.PATH, element.getId(), null, params, tutao.entity.EntityHelper.createAuthHeaders(), callbacks.add(function(loadedElement, exception3) {
						assertUndefined(exception3);
						assertEquals(element.getText(), loadedElement.getText());
					}));
				}));
			}));
		});
	},

	"test that you are able to retrieve an updated list element after updating it": function(queue) {
		var self = this;
		queue.call('test', function(callbacks) {
			var element = new tutao.entity.tutanota.Mail();
			element.setSubject("hello together!");
			element.setDate(new Date());
			element.setRead(false);
			var params = EntityRestTestFunctions.getVersionParams(tutao.entity.EntityHelper.createPostListPermissionMap(BucketTestUtils.createDummyBucketData(), true));
			tutao.locator.entityRestClient.postList(tutao.entity.tutanota.Mail.PATH, params, tutao.entity.EntityHelper.createAuthHeaders(), callbacks.add(function(returnEntity, exception1) {
				var listId = returnEntity.getGeneratedId();
				assertUndefined(exception1);
				var elementParams = EntityRestTestFunctions.getVersionParams(element._entityHelper.createPostPermissionMap(BucketTestUtils.createDummyBucketData()));
				tutao.locator.entityRestClient.postElement(tutao.entity.tutanota.Mail.PATH, element, listId, elementParams, tutao.entity.EntityHelper.createAuthHeaders(), callbacks.add(function(returnEntity, exception2) {
					assertUndefined(exception2);
					element.setSubject("hello all together!");
					tutao.locator.entityRestClient.putElement(tutao.entity.tutanota.Mail.PATH, element, EntityRestTestFunctions.getVersionParams(), tutao.entity.EntityHelper.createAuthHeaders(), callbacks.add(function(exception3) {
						assertUndefined(exception3);
						tutao.locator.entityRestClient.getElement(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, element.getId()[1], element.getId()[0], EntityRestTestFunctions.getVersionParams(), tutao.entity.EntityHelper.createAuthHeaders(), callbacks.add(function(loadedElement, exception4) {
							assertUndefined(exception4);
							assertEquals(element.getSubject(), loadedElement.getSubject());
						}));
					}));
				}));
			}));
		});
	}
};
