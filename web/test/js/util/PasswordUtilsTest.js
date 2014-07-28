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
        this.checkStrength("a", 0, 20);
        this.checkStrength("aX", 0, 30);
        this.checkStrength("aX%", 10, 35);
        this.checkStrength("aX%7", 20, 45);
        this.checkStrength("aX%7#", 30, 60);
        this.checkStrength("aX%7#+", 40, 70);
        this.checkStrength("aX%7#+t", 50, 80);
        this.checkStrength("aX%7#+tO", 80, 100);
        this.checkStrength("dasisteinpasswort", 50, 70);
        this.checkStrength("das-ist-ein-passwort", 80, 100);
        this.checkStrength("helloWorld!", 80, 90);
        this.checkStrength("testtesttesttest", 0, 20);
        this.checkStrength("!*$%/()=", 30, 50);
        this.checkStrength("abcdefgh", 10, 30);
        this.checkStrength("mjudleugdh", 50, 70);
        this.checkStrength("12345678", 10, 30);
        this.checkStrength("abcde1gh", 30, 50);
        this.checkStrength("ab!de1gh", 60, 79);
        this.checkStrength("987654321", 10, 30);
        this.checkStrength("11111111111111111111", 0, 20);
        this.checkStrength("Aihlod$1", 60, 79);
        this.checkStrength("ai$hl1oD", 70, 79);
        this.checkStrength("Ai$h1oDl", 80, 90);
        this.checkStrength("!i$hL1D", 70, 79);
        this.checkStrength("Ahagitubitbl", 70, 79);
        this.checkStrength("Ahagitubitblz", 80, 90);
	},
	
	checkStrength : function(pw, min, max) {
//		console.log(pw, min, max, tutao.tutanota.util.PasswordUtils.getPasswordStrength(pw));
		assertTrue("Passphrase " + pw + " strength: " + tutao.tutanota.util.PasswordUtils.getPasswordStrength(pw, []) + " is smaller than expected " + min, min <= tutao.tutanota.util.PasswordUtils.getPasswordStrength(pw, []));
		assertTrue("Passphrase " + pw + " strength: " + tutao.tutanota.util.PasswordUtils.getPasswordStrength(pw, []) + " is bigger than expected " + max, tutao.tutanota.util.PasswordUtils.getPasswordStrength(pw, []) <= max);
	},

    "test getNbrOfSequenceChars" : function() {
        assertEquals(6, tutao.tutanota.util.PasswordUtils._getNbrOfSequenceChars("qwertz", tutao.tutanota.util.PasswordUtils._BAD_SEQUENCES, true)); // german keyboard
        assertEquals(6, tutao.tutanota.util.PasswordUtils._getNbrOfSequenceChars("qwerty", tutao.tutanota.util.PasswordUtils._BAD_SEQUENCES, true)); // english keyboard
        assertEquals(7, tutao.tutanota.util.PasswordUtils._getNbrOfSequenceChars("4567890", tutao.tutanota.util.PasswordUtils._BAD_SEQUENCES, true)); // number sequence
        assertEquals(4, tutao.tutanota.util.PasswordUtils._getNbrOfSequenceChars("m,.-", tutao.tutanota.util.PasswordUtils._BAD_SEQUENCES, true)); // sequence with special characters
        assertEquals(4, tutao.tutanota.util.PasswordUtils._getNbrOfSequenceChars("3kfh5678awf", tutao.tutanota.util.PasswordUtils._BAD_SEQUENCES, true)); // sequence in center
        assertEquals(5, tutao.tutanota.util.PasswordUtils._getNbrOfSequenceChars("3kfhkjhgfawf", tutao.tutanota.util.PasswordUtils._BAD_SEQUENCES, true)); // backward sequence in center
        assertEquals(0, tutao.tutanota.util.PasswordUtils._getNbrOfSequenceChars("3kfhkjhgfawf", tutao.tutanota.util.PasswordUtils._BAD_SEQUENCES, false)); // backward sequence in center no reverse
        assertEquals(7, tutao.tutanota.util.PasswordUtils._getNbrOfSequenceChars("a2345ngb890d", tutao.tutanota.util.PasswordUtils._BAD_SEQUENCES, true)); // two separate sequences
        assertEquals(7, tutao.tutanota.util.PasswordUtils._getNbrOfSequenceChars("a2345890d", tutao.tutanota.util.PasswordUtils._BAD_SEQUENCES, true)); // two adjoining sequences
        assertEquals(0, tutao.tutanota.util.PasswordUtils._getNbrOfSequenceChars("r56b", tutao.tutanota.util.PasswordUtils._BAD_SEQUENCES, true)); // two digit sequence is not found
        assertEquals(5, tutao.tutanota.util.PasswordUtils._getNbrOfSequenceChars("tzuio54", tutao.tutanota.util.PasswordUtils._BAD_SEQUENCES, true)); // sequence at the beginning
        assertEquals(5, tutao.tutanota.util.PasswordUtils._getNbrOfSequenceChars("54tzuio", tutao.tutanota.util.PasswordUtils._BAD_SEQUENCES, true)); // sequence at the end
    }
});
