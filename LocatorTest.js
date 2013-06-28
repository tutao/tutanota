"use strict";

JsHamcrest.Integration.JsTestDriver();
//JsMockito.Integration.JsTestDriver();


TestCase("LocatorTest", {
	locator: null,
	setUp: function() {
		
	},
	"test if getters are defined for all provided classes": function() {
		var Mail = function() {};
		var locator = new tutao.Locator({'mail': Mail} );
		assertTrue(locator.mail instanceof Mail);
	},
	"test that only one instance is created and cached for later user": function() {
		var Mail = function() {};
		var locator = new tutao.Locator({'mail': Mail} );
		var mail1 = locator.mail;
		var mail2 = locator.mail;
		assertSame(mail1, mail2);
	},
	"test that new instances are created after invoking reset": function() {
		var Mail = JsMockito.mockFunction();
		var locator = new tutao.Locator({'mail': Mail} );
		var mail1 = locator.mail;
		locator.reset();
		var mail2 = locator.mail;
		assertNotSame(mail1, mail2);
		assertEquals(mail1, mail2);
	},
	"test that it works with multiple instances": function() {
		var Mail = function() {};
		var Body = function() {};
		var locator = new tutao.Locator({'mail': Mail, 'body': Body} );
		var mail = locator.mail;
		var body = locator.body;
		assertTrue(mail instanceof Mail);
		assertTrue(body instanceof Body);
	},
	"test that a another instance is server after replacing": function() {
		var Mail = function() {};
		var Mock = function() {};
		var locator = new tutao.Locator({'mail': Mail} );
		var mock = new Mock();
		locator.replace('mail', mock);
		var mail = locator.mail;
		assertSame(mail, mock);
	}
});
