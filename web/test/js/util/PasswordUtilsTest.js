"use strict";

describe("PasswordUtilsTest", function () {

    var assert = chai.assert;

    var checkStrength = function (pw, min, max) {
//		console.log(pw, min, max, tutao.tutanota.util.PasswordUtils.getPasswordStrength(pw));
        assert.isTrue(min <= tutao.tutanota.util.PasswordUtils.getPasswordStrength(pw, []), "Passphrase " + pw + " strength: " + tutao.tutanota.util.PasswordUtils.getPasswordStrength(pw, []) + " is smaller than expected " + min);
        assert.isTrue(tutao.tutanota.util.PasswordUtils.getPasswordStrength(pw, []) <= max, "Passphrase " + pw + " strength: " + tutao.tutanota.util.PasswordUtils.getPasswordStrength(pw, []) + " is bigger than expected " + max);
    };

    it(" that generated message passwords contain random characters by checking the first and last of the character set", function () {
        var firstChar = tutao.tutanota.util.PasswordUtils.MESSAGE_PASSWORD_CHAR_SET[0];
        var lastChar = tutao.tutanota.util.PasswordUtils.MESSAGE_PASSWORD_CHAR_SET[tutao.tutanota.util.PasswordUtils.MESSAGE_PASSWORD_CHAR_SET.length - 1];
        var firstCharFound = false;
        var lastCharFound = false;
        for (var i = 0; i < 1000; i++) {
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
            assert.fail("not all characters are covered");
        }
    });

    it(" message password length", function () {
        assert.equal(tutao.tutanota.util.PasswordUtils.MESSAGE_PASSWORD_LENGTH, tutao.tutanota.util.PasswordUtils.generateMessagePassword().length);
    });

    it(" password strength", function () {
        checkStrength("", 0, 0);
        checkStrength("a", 0, 20);
        checkStrength("aX", 0, 30);
        checkStrength("aX%", 10, 35);
        checkStrength("aX%7", 20, 45);
        checkStrength("aX%7#", 30, 60);
        checkStrength("aX%7#+", 40, 70);
        checkStrength("aX%7#+t", 50, 80);
        checkStrength("aX%7#+tO", 80, 100);
        checkStrength("dasisteinpasswort", 50, 70);
        checkStrength("das-ist-ein-passwort", 80, 100);
        checkStrength("helloWorld!", 80, 90);
        checkStrength("testtesttesttest", 0, 20);
        checkStrength("!*$%/()=", 30, 50);
        checkStrength("abcdefgh", 10, 30);
        checkStrength("mjudleugdh", 50, 70);
        checkStrength("12345678", 10, 30);
        checkStrength("abcde1gh", 30, 50);
        checkStrength("ab!de1gh", 60, 79);
        checkStrength("987654321", 10, 30);
        checkStrength("11111111111111111111", 0, 20);
        checkStrength("Aihlod$1", 60, 79);
        checkStrength("ai$hl1oD", 70, 79);
        checkStrength("Ai$h1oDl", 80, 90);
        checkStrength("!i$hL1D", 70, 79);
        checkStrength("Ahagitubitbl", 70, 79);
        checkStrength("Ahagitubitblz", 80, 90);
    });

    it(" getNbrOfSequenceChars", function () {
        assert.equal(6, tutao.tutanota.util.PasswordUtils._getNbrOfSequenceChars("qwertz", tutao.tutanota.util.PasswordUtils._BAD_SEQUENCES, true)); // german keyboard
        assert.equal(6, tutao.tutanota.util.PasswordUtils._getNbrOfSequenceChars("qwerty", tutao.tutanota.util.PasswordUtils._BAD_SEQUENCES, true)); // english keyboard
        assert.equal(7, tutao.tutanota.util.PasswordUtils._getNbrOfSequenceChars("4567890", tutao.tutanota.util.PasswordUtils._BAD_SEQUENCES, true)); // number sequence
        assert.equal(4, tutao.tutanota.util.PasswordUtils._getNbrOfSequenceChars("m,.-", tutao.tutanota.util.PasswordUtils._BAD_SEQUENCES, true)); // sequence with special characters
        assert.equal(4, tutao.tutanota.util.PasswordUtils._getNbrOfSequenceChars("3kfh5678awf", tutao.tutanota.util.PasswordUtils._BAD_SEQUENCES, true)); // sequence in center
        assert.equal(5, tutao.tutanota.util.PasswordUtils._getNbrOfSequenceChars("3kfhkjhgfawf", tutao.tutanota.util.PasswordUtils._BAD_SEQUENCES, true)); // backward sequence in center
        assert.equal(0, tutao.tutanota.util.PasswordUtils._getNbrOfSequenceChars("3kfhkjhgfawf", tutao.tutanota.util.PasswordUtils._BAD_SEQUENCES, false)); // backward sequence in center no reverse
        assert.equal(7, tutao.tutanota.util.PasswordUtils._getNbrOfSequenceChars("a2345ngb890d", tutao.tutanota.util.PasswordUtils._BAD_SEQUENCES, true)); // two separate sequences
        assert.equal(7, tutao.tutanota.util.PasswordUtils._getNbrOfSequenceChars("a2345890d", tutao.tutanota.util.PasswordUtils._BAD_SEQUENCES, true)); // two adjoining sequences
        assert.equal(0, tutao.tutanota.util.PasswordUtils._getNbrOfSequenceChars("r56b", tutao.tutanota.util.PasswordUtils._BAD_SEQUENCES, true)); // two digit sequence is not found
        assert.equal(5, tutao.tutanota.util.PasswordUtils._getNbrOfSequenceChars("tzuio54", tutao.tutanota.util.PasswordUtils._BAD_SEQUENCES, true)); // sequence at the beginning
        assert.equal(5, tutao.tutanota.util.PasswordUtils._getNbrOfSequenceChars("54tzuio", tutao.tutanota.util.PasswordUtils._BAD_SEQUENCES, true)); // sequence at the end
    });


});