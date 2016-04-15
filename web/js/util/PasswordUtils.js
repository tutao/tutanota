"use strict";

tutao.provide('tutao.tutanota.util.PasswordUtils');

/**
 * Generates a password that can be used to derive a key and encrypt a message to an external recipient.
 * @return {string} The password.
 */
tutao.tutanota.util.PasswordUtils.generateMessagePassword = function() {
	return tutao.tutanota.util.PasswordUtils.generatePassword(tutao.tutanota.util.PasswordUtils.MESSAGE_PASSWORD_LENGTH);
};

/**
 * Generates a password that can be used for a newly created account.
 * @param {number} length The length of the new password
 * @return {string} The password.
 */
tutao.tutanota.util.PasswordUtils.generatePassword = function(length) {
	var password = "";
	for (var i = 0; i < length; i++) {
		while (true) {
			var index = tutao.locator.randomizer.generateRandomData(1)[0];
			// the random value must be within the character set range, otherwise try the next one
			if (index < tutao.tutanota.util.PasswordUtils.MESSAGE_PASSWORD_CHAR_SET.length) {
				password += tutao.tutanota.util.PasswordUtils.MESSAGE_PASSWORD_CHAR_SET[index];
				break;
			}
		}
	}
	return password;
};

tutao.tutanota.util.PasswordUtils.MESSAGE_PASSWORD_CHAR_SET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnopqrstuvwxyz123456789";
tutao.tutanota.util.PasswordUtils.MESSAGE_PASSWORD_LENGTH = 8;

// contains german and english keyboard sequences
tutao.tutanota.util.PasswordUtils._BAD_SEQUENCES = [ "^1234567890ß´", "°!\"§$%&/()=?`", "qwertzuiopü+", "QWERTZUIOPÜ*", "asdfghjklöä#",  "ASDFGHJKLÖÄ'",  "<yxcvbnm,.-",  ">YXCVBNM;:_",
    "`1234567890-=", "~!@#$%^&*()_+",  "qwertyuiop[]", "QWERTYUIOP{}", "asdfghjkl;'\\" ,"ASDFGHJKL:\"|", "\\zxcvbnm,./", "|ZXCVBNM<>?",
    "abcdefghijklmnopqrstuvwxyz", "ABCDEFGHIJKLMNOPQRSTUVWXYZ" ];

// contains strings that reducece the strenght of a password
tutao.tutanota.util.PasswordUtils._BAD_STRINGS = [ "passwort", "Passwort", "password", "Password", "tutanota", "Tutanota", "free", "Free", "starter", "Starter", "Test", "test" ];

/**
 * Checks how secure the given password is. The following password characteristics decrease the password strength:
 * - irregular distribution of characters across the character classes lower case, upper case, digit, other
 * - consecutive characters of the same class
 * - same chars
 * - same consecutive chars
 * - keyboard (german/english) or alphabet sequences
 * - bad strings (statically defined and passed to function in badStrings)
 * @param {string} password The password to check.
 * @param {Array.<string>} badStrings Strings that reduce the strength of the password.
 * @return {number} A number from 0 to 100.
 */
tutao.tutanota.util.PasswordUtils.getPasswordStrength = function(password, badStrings) {
    if (password.length == 0) {
        return 0;
    }

    // calculate the characteristics of the password
    var nbrOfLowerChars = tutao.tutanota.util.PasswordUtils._getNbrOfOccurrences(password, /[a-z ]/g);
    var nbrOfConsecutiveLowerChars = Math.max(0, tutao.tutanota.util.PasswordUtils._getLongestResult(password, /[a-z ]*/g) - 2); // consecutive chars > 2
    var nbrOfUpperChars = tutao.tutanota.util.PasswordUtils._getNbrOfOccurrences(password, /[A-Z]/g);
    var nbrOfConsecutiveUpperChars = Math.max(0, tutao.tutanota.util.PasswordUtils._getLongestResult(password, /[A-Z]*/g) - 2);
    var nbrOfDigits = tutao.tutanota.util.PasswordUtils._getNbrOfOccurrences(password, /[0-9]/g);
    var nbrOfConsecutiveDigits = Math.max(0, tutao.tutanota.util.PasswordUtils._getLongestResult(password, /[0-9]*/g) - 2);
    var nbrOfOtherChars = password.length - nbrOfDigits - nbrOfLowerChars - nbrOfUpperChars;
    var nbrOfConsecutiveOtherChars = Math.max(0, tutao.tutanota.util.PasswordUtils._getLongestResult(password, /[^a-z A-Z0-9]*/g) - 2);
    var nbrOfConsecutiveSame = Math.max(0, tutao.tutanota.util.PasswordUtils._getLongestResult(password, /(.)\1+/g) - 2);
    var minNbrOfCharsPerType = password.length / 4; // best is 1/4 lower case, 1/4 upper case, 1/4 digits, 1/4 other chars

    // all these values decrease the strength
    var nbrOfMissingLowerChars = Math.max(0, minNbrOfCharsPerType - nbrOfLowerChars);
    var nbrOfMissingUpperChars = Math.max(0, minNbrOfCharsPerType - nbrOfUpperChars);
    var nbrOfMissingDigits = Math.max(0, minNbrOfCharsPerType - nbrOfDigits);
    var nbrOfMissingOtherChars = Math.max(0, minNbrOfCharsPerType - nbrOfOtherChars);
    var nbrOfSameChars = tutao.tutanota.util.PasswordUtils._getNbrOfSameChars(password);
    var nbrOfSequenceDigits = tutao.tutanota.util.PasswordUtils._getNbrOfSequenceChars(password, tutao.tutanota.util.PasswordUtils._BAD_SEQUENCES, true);
    var nbrOfBadStringDigits = tutao.tutanota.util.PasswordUtils._getNbrOfSequenceChars(password, badStrings.concat(tutao.tutanota.util.PasswordUtils._BAD_STRINGS), false);

    var strength = password.length * 11; // 11 = strength per character without reduction
    strength -= nbrOfMissingLowerChars * 3;
    strength -= nbrOfMissingUpperChars * 3;
    strength -= nbrOfMissingDigits * 3;
    strength -= nbrOfMissingOtherChars * 3;
    strength -= nbrOfConsecutiveLowerChars * 2;
    strength -= nbrOfConsecutiveUpperChars * 2;
    strength -= nbrOfConsecutiveDigits * 2;
    strength -= nbrOfConsecutiveOtherChars * 2;
    strength -= nbrOfConsecutiveSame * 2;
    strength -= nbrOfSameChars * 5;
    strength -= nbrOfSequenceDigits * 4;
    strength -= nbrOfBadStringDigits * 4;

    return Math.min(100, Math.max(0, Math.round(strength)));
};

/**
 * Provides the number of repetitions of any characters in the given password at any position.
 * @param password {string} The password to check.
 * @returns {number} The number of same characters.
 * @private
 */
tutao.tutanota.util.PasswordUtils._getNbrOfSameChars = function(password) {
    var characterObject = {};
    for (var i = 0; i < password.length; i++) {
        characterObject[password[i]] = true;
    }
    return password.length - Object.keys(characterObject).length;
};


/**
 * Provides the number of chars in the given password that contains parts (> 2 characters) of the given sequences.
 * @param {string} password The password to check.
 * @param  {Array.<string>} sequences The sequences to check.
 * @param {bool} reverseToo If true, also all reverse sequences are checked.
 * @returns {number} The number of chars that match any sequences.
 * @private
 */
tutao.tutanota.util.PasswordUtils._getNbrOfSequenceChars = function(password, sequences, reverseToo) {
    // all sequences to the list of checked sequences s. also add all reverse sequences if requested
    var s = sequences.slice();
    if (reverseToo) {
        for (var l = 0; l < sequences.length; l++) {
            s.push(sequences[l].split("").reverse().join(""));
        }
    }

    var MIN_SEQUENCE_LEN = 3;
    var nbrOfSequenceDigits = 0;
    // check the part of the password (substringToCheck) from i to i+sequenceLen in a loop
    for (var i = 0; i < (password.length - MIN_SEQUENCE_LEN); i++) {
        var maxFoundLen = 0;
        for (var sequenceLen = MIN_SEQUENCE_LEN; (i + sequenceLen) <= password.length; sequenceLen++) {
            var substringToCheck = password.substring(i, i + sequenceLen);
            for (var a = 0; a < s.length; a++) {
                if (s[a].indexOf(substringToCheck) != -1) {
                    maxFoundLen = sequenceLen;
                    break;
                }
            }
        }
        if (maxFoundLen > 0) {
            nbrOfSequenceDigits += maxFoundLen;
            i += (maxFoundLen - 1); // skip the found sequence. -1 because the for loop also decreases by 1
        }
    }
    return nbrOfSequenceDigits;
};

/**
 * Gets the number of occurrences of the given regular expression in the given string.
 * @param {string} string The string to check.
 * @param {RegExp} regexp The reqular expression to check against.
 * @return {number} The number of occurrences.
 * @private
 */
tutao.tutanota.util.PasswordUtils._getNbrOfOccurrences = function(string, regexp) {
    var result = string.match(regexp);
    if (!result) {
        return 0;
    } else {
        return result.length;
    }
};

/**
 * Gets the number of characters in the longest result when checking the given string against the given regular expression.
 * @param {string} string The string to check.
 * @param {RegExp} regexp The reqular expression to check against.
 * @returns {number} The number of characters of the longest result.
 * @private
 */
tutao.tutanota.util.PasswordUtils._getLongestResult = function(string, regexp) {
    var result = string.match(regexp);
    if (!result) {
        return 0;
    } else {
        var maxLen = 0;
        for (var i=0; i<result.length; i++) {
            maxLen = Math.max(maxLen, result[i].length);
        }
        return maxLen;
    }
};