//@flow
import {assertMainOrNode} from "../api/Env"

assertMainOrNode()

export const _BAD_SEQUENCES = [
	"^1234567890ß´", "°!\"§$%&/()=?`", "qwertzuiopü+", "QWERTZUIOPÜ*", "asdfghjklöä#", "ASDFGHJKLÖÄ'", "<yxcvbnm,.-",
	">YXCVBNM:_",
	"`1234567890-=", "~!@#$%^&*()_+", "qwertyuiop[]", "QWERTYUIOP{}", "asdfghjkl'\\", "ASDFGHJKL:\"|", "\\zxcvbnm,./",
	"|ZXCVBNM<>?",
	"abcdefghijklmnopqrstuvwxyz", "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
]

const _BAD_STRINGS = [
	"passwort", "Passwort", "password", "Password", "tutanota", "Tutanota", "free", "Free", "starter", "Starter",
	"Test", "test"
]

/**
 * Checks how secure the given password is. The following password characteristics decrease the password strength:
 * - irregular distribution of characters across the character classes lower case, upper case, digit, other
 * - consecutive characters of the same class
 * - same chars
 * - same consecutive chars
 * - keyboard (german/english) or alphabet sequences
 * - bad strings (statically defined and passed to function in badStrings)
 * @param password The password to check.
 * @param badStrings Strings that reduce the strength of the password.
 * @return A number from 0 to 100.
 */
export function getPasswordStrength(password: string, badStrings: string[]) {
	if (password.length === 0) return 0

	// calculate the characteristics of the password
	let nbrOfLowerChars = _getNbrOfOccurrences(password, /[a-z ]/g)
	let nbrOfConsecutiveLowerChars = Math.max(0, _getLongestResult(password, /[a-z ]*/g) - 2) // consecutive chars > 2
	let nbrOfUpperChars = _getNbrOfOccurrences(password, /[A-Z]/g)
	let nbrOfConsecutiveUpperChars = Math.max(0, _getLongestResult(password, /[A-Z]*/g) - 2)
	let nbrOfDigits = _getNbrOfOccurrences(password, /[0-9]/g)
	let nbrOfConsecutiveDigits = Math.max(0, _getLongestResult(password, /[0-9]*/g) - 2)
	let nbrOfOtherChars = password.length - nbrOfDigits - nbrOfLowerChars - nbrOfUpperChars
	let nbrOfConsecutiveOtherChars = Math.max(0, _getLongestResult(password, /[^a-z A-Z0-9]*/g) - 2)
	let nbrOfConsecutiveSame = Math.max(0, _getLongestResult(password, /(.)\1+/g) - 2)
	let minNbrOfCharsPerType = password.length / 4 // best is 1/4 lower case, 1/4 upper case, 1/4 digits, 1/4 other chars

	// all these values decrease the strength
	let nbrOfMissingLowerChars = Math.max(0, minNbrOfCharsPerType - nbrOfLowerChars)
	let nbrOfMissingUpperChars = Math.max(0, minNbrOfCharsPerType - nbrOfUpperChars)
	let nbrOfMissingDigits = Math.max(0, minNbrOfCharsPerType - nbrOfDigits)
	let nbrOfMissingOtherChars = Math.max(0, minNbrOfCharsPerType - nbrOfOtherChars)
	let nbrOfSameChars = _getNbrOfSameChars(password)
	let nbrOfSequenceDigits = _getNbrOfSequenceChars(password, _BAD_SEQUENCES, true)
	let nbrOfBadStringDigits = _getNbrOfSequenceChars(password, badStrings.concat(_BAD_STRINGS), false)

	let strength = password.length * 11 // 11 = strength per character without reduction
	strength -= nbrOfMissingLowerChars * 3
	strength -= nbrOfMissingUpperChars * 3
	strength -= nbrOfMissingDigits * 3
	strength -= nbrOfMissingOtherChars * 3
	strength -= nbrOfConsecutiveLowerChars * 2
	strength -= nbrOfConsecutiveUpperChars * 2
	strength -= nbrOfConsecutiveDigits * 2
	strength -= nbrOfConsecutiveOtherChars * 2
	strength -= nbrOfConsecutiveSame * 2
	strength -= nbrOfSameChars * 5
	strength -= nbrOfSequenceDigits * 4
	strength -= nbrOfBadStringDigits * 4

	return Math.min(100, Math.max(0, Math.round(strength)))
}

/**
 * Provides the number of repetitions of any characters in the given password at any position.
 * @param password The password to check.
 * @returns The number of same characters.
 */
function _getNbrOfSameChars(password: string): number {
	var characterObject = {};
	for (var i = 0; i < password.length; i++) {
		characterObject[password[i]] = true;
	}
	return password.length - Object.keys(characterObject).length;
}

/**
 * Provides the number of chars in the given password that contains parts (> 2 characters) of the given sequences.
 * @param password The password to check.
 * @param sequences The sequences to check.
 * @param reverseToo If true, also all reverse sequences are checked.
 * @returns The number of chars that match any sequences.
 */
export function _getNbrOfSequenceChars(password: string, sequences: string[], reverseToo: boolean): number {
	// all sequences to the list of checked sequences s. also add all reverse sequences if requested
	let s = sequences
	if (reverseToo) {
		s = sequences.concat(sequences.map(s1 => s1.split("").reverse().join("")))
	}

	let MIN_SEQUENCE_LEN = 3
	let nbrOfSequenceDigits = 0
	// check the part of the password (substringToCheck) from i to i+sequenceLen in a loop
	for (let i = 0; i < (password.length - MIN_SEQUENCE_LEN); i++) {
		let maxFoundLen = 0
		for (let sequenceLen = MIN_SEQUENCE_LEN; (i + sequenceLen) <= password.length; sequenceLen++) {
			let substringToCheck = password.substring(i, i + sequenceLen)
			for (let a = 0; a < s.length; a++) {
				if (s[a].indexOf(substringToCheck) !== -1) {
					maxFoundLen = sequenceLen
					break
				}
			}
		}
		if (maxFoundLen > 0) {
			nbrOfSequenceDigits += maxFoundLen
			i += (maxFoundLen - 1) // skip the found sequence. -1 because the for loop also decreases by 1
		}
	}
	return nbrOfSequenceDigits
}

/**
 * Gets the number of occurrences of the given regular expression in the given string.
 * @param string The string to check.
 * @param regexp The reqular expression to check against.
 * @return The number of occurrences.
 */
function _getNbrOfOccurrences(string: string, regexp: RegExp): number {
	let result = string.match(regexp)
	return result ? result.length : 0
}

/**
 * Gets the number of characters in the longest result when checking the given string against the given regular expression.
 * @param string The string to check.
 * @param regexp The reqular expression to check against.
 * @returns The number of characters of the longest result.
 */
function _getLongestResult(string: string, regexp: RegExp): number {
	let result = string.match(regexp);
	return result ? result.reduce((max, val) => Math.max(max, val.length), 0) : 0
}