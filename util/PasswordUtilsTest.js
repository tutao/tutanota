"use strict";

goog.provide('PasswordUtilsTest');

TestCase("PasswordUtilsTest", {
	
	"test that generated message passwords contain random characters by checking the first and last of the character set": function() {
		var firstChar = tutao.tutanota.util.PasswordUtils.MESSAGE_PASSWORD_CHAR_SET[0];
		var lastChar = tutao.tutanota.util.PasswordUtils.MESSAGE_PASSWORD_CHAR_SET[tutao.tutanota.util.PasswordUtils.MESSAGE_PASSWORD_CHAR_SET.length - 1];
		var firstCharFound = false;
		var lastCharFound = false;
		for (var i=0; i<1000; i++) {
			var password = tutao.tutanota.util.PasswordUtils.generateMessagePassword();
			if (!firstCharFound && password.indexOf(firstChar) != -1) {
				firstCharFound = true;
			}
			if (!lastCharFound && password.indexOf(lastChar) != -1) {
				lastCharFound = true;
			}
			if (firstCharFound && lastCharFound) {
				break;
			}
		}
		if (!firstCharFound || !lastCharFound) {
			fail("not all characters are covered");
		}
	},
	
	"test message password length": function() {
		assertEquals(tutao.tutanota.util.PasswordUtils.MESSAGE_PASSWORD_LENGTH, tutao.tutanota.util.PasswordUtils.generateMessagePassword().length);
	},
	
	"test password strength": function() {
		this.checkStrength("", 0, 0);
		this.checkStrength("a", 0, 15);
		this.checkStrength("aX", 0, 25);
		this.checkStrength("aX%", 10, 35);
		this.checkStrength("aX%7", 20, 45);
		this.checkStrength("aX%7#", 30, 60);
		this.checkStrength("aX%7#+", 40, 70);
		this.checkStrength("aX%7#+t", 50, 80);
		this.checkStrength("aX%7#+tO", 70, 90);
		this.checkStrength("dasistjaeinganztollespasswort", 80, 100);
		this.checkStrength("das-ist-ja-ein-ganz-tolles-passwort", 90, 100);
		this.checkStrength("helloWorld!", 70, 90);
		this.checkStrength("testtesttesttest", 60, 80);
		this.checkStrength("!*$%/()=", 50, 70);
		this.checkStrength("abcdefgh", 50, 70);
		this.checkStrength("12345678", 50, 70);
		this.checkStrength("abcde1gh", 60, 80);
		this.checkStrength("ab!de1gh", 70, 90);
	},
	
	checkStrength : function(pw, min, max) {
//		console.log(pw, min, max, tutao.tutanota.util.PasswordUtils.getPasswordStrength(pw));
		assertTrue("Passphrase " + pw + " strength: " + tutao.tutanota.util.PasswordUtils.getPasswordStrength(pw) + " is smaller than expected " + min, min <= tutao.tutanota.util.PasswordUtils.getPasswordStrength(pw));
		assertTrue("Passphrase " + pw + " strength: " + tutao.tutanota.util.PasswordUtils.getPasswordStrength(pw) + " is bigger than expected " + max, tutao.tutanota.util.PasswordUtils.getPasswordStrength(pw) <= max);
	}
});
