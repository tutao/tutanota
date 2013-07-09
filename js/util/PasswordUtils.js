"use strict";

goog.provide('tutao.tutanota.util.PasswordUtils');

/**
 * Generates a password that can be used to derive a key and encrypt a message to an external recipient.
 * @return {string} The password.
 */
tutao.tutanota.util.PasswordUtils.generateMessagePassword = function() {
	var password = "";
	for (var i = 0; i < tutao.tutanota.util.PasswordUtils.MESSAGE_PASSWORD_LENGTH; i++) {
		while (true) {
			var index = tutao.util.EncodingConverter.hexToBytes(tutao.locator.randomizer.generateRandomData(1))[0];
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

/**
 * Checks how secure the given password is.
 * @param {string} password The password to check.
 * @return {number} A number from 0 to 100.
 */
tutao.tutanota.util.PasswordUtils.getPasswordStrength = function(password) {
	if (password.length == 0) {
		return 0;
	}
	// calculate the characteristics of the password
	var nbrOfDigits = tutao.tutanota.util.PasswordUtils._getNbrOfOccurrences(password, /[0-9]/g);
	var nbrOfUpperChars = tutao.tutanota.util.PasswordUtils._getNbrOfOccurrences(password, /[A-Z]/g);
	var nbrOfLowerCaseChars = tutao.tutanota.util.PasswordUtils._getNbrOfOccurrences(password, /[a-z]/g);
	var nbrOfOtherChars = password.length - nbrOfDigits - nbrOfLowerCaseChars - nbrOfUpperChars;
	var characterObject = {};
	for (var i = 0; i < password.length; i++) {
		characterObject[password[i]] = true;
	}
	var nbrOfDifferentChars = Object.keys(characterObject).length;

	// use a combination of nbr of characters and variation in the characters as basis
	var strength = (nbrOfDifferentChars + password.length) * 4;
	// if over half of the characters are of one type reduce the nbr because the password becomes more insecure
	nbrOfOtherChars = (nbrOfOtherChars > password.length / 2) ? (password.length - nbrOfOtherChars) : nbrOfOtherChars;
	nbrOfDigits = (nbrOfDigits > password.length / 2) ? (password.length - nbrOfDigits) : nbrOfDigits;
	nbrOfUpperChars = (nbrOfUpperChars > password.length / 2) ? (password.length - nbrOfUpperChars) : nbrOfUpperChars;
	// add strength for special characters (much), digits (medium) and uppercase characters (less)
	// do not add strength for lowercase characters because they are common
	var otherBonus = strength / 100 * nbrOfOtherChars / password.length * 60;
	var digitBonus = strength / 100 * nbrOfDigits / password.length * 40;
	var upperBonus = strength / 100 * nbrOfUpperChars / password.length * 20;

	strength += otherBonus + digitBonus + upperBonus;

	return Math.min(100, Math.round(strength));
};

/**
 * Gets the number of occurrences of the given regular expression in the given string.
 * @param {string} string The string to check.
 * @param {RegExp} regexp The regular expression.
 */
tutao.tutanota.util.PasswordUtils._getNbrOfOccurrences = function(string, regexp) {
	var result = string.match(regexp);
	if (!result) {
		return 0;
	} else {
		return result.length;
	}
};
