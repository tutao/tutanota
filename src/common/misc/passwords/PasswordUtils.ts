import type { MailboxDetail } from "../../mailFunctionality/MailboxModel.js"
import type { LoginController } from "../../api/main/LoginController"
import { assertMainOrNode } from "../../api/common/Env"
import { PartialRecipient } from "../../api/common/recipients/Recipient"
import { getEnabledMailAddressesWithUser, getMailboxName } from "../../mailFunctionality/SharedMailUtils.js"

assertMainOrNode()
/** password strength resulting in a full bar */
export const PASSWORD_MAX_VALUE = 80
export const PASSWORD_MIN_VALUE = 0
/** the minimum password strength we accept, but the user can choose a stronger password */
export const PASSWORD_MIN_SECURE_VALUE = 64
export const _BAD_SEQUENCES = [
	"^1234567890ß´",
	'°!"§$%&/()=?`',
	"qwertzuiopü+",
	"asdfghjklöä#",
	"<yxcvbnm,.-",
	"`1234567890-=",
	"~!@#$%^&*()_+",
	"qwertyuiop[]",
	"asdfghjkl'\\",
	"\\zxcvbnm,./",
	"abcdefghijklmnopqrstuvwxyz",
]
const _BAD_STRINGS = ["passwort", "password", "tutanota", "free", "test", "keemail", "tutamail"]

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
 * @return A number from 0 to PASSWORD_MAX_VALUE.
 */
export function getPasswordStrength(password: string, badStrings: string[]): number {
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

	let nbrOfSequenceDigits = _getNbrOfSequenceChars(password.toLowerCase(), _BAD_SEQUENCES, true)

	let nbrOfBadStringDigits = _getNbrOfSequenceChars(password.toLowerCase(), badStrings.map((s) => s.toLowerCase()).concat(_BAD_STRINGS), false)

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
	return Math.min(PASSWORD_MAX_VALUE, Math.max(PASSWORD_MIN_VALUE, Math.round(strength)))
}

export function getPasswordStrengthForUser(password: string, recipientInfo: PartialRecipient, mailboxDetails: MailboxDetail, logins: LoginController): number {
	let reserved = getEnabledMailAddressesWithUser(mailboxDetails, logins.getUserController().userGroupInfo).concat(
		getMailboxName(logins, mailboxDetails),
		recipientInfo.address,
		recipientInfo.name ?? "",
	)
	return Math.min(PASSWORD_MAX_VALUE, getPasswordStrength(password, reserved))
}

/**
 * Maps the password strength from the range 0 to PASSWORD_MAX_VALUE to the range 0% to 100%. Therefore, if a password reaches the PASSWORD_MIN_SECURE_VALUE it is not at 100% yet.
 * @return A value indicating the password strength between 0 and 100.
 */
export function scaleToVisualPasswordStrength(passwordStrength: number): number {
	return Math.min(100, (passwordStrength / PASSWORD_MAX_VALUE) * 100)
}

export function isSecurePassword(passwordStrength: number): boolean {
	return passwordStrength >= PASSWORD_MIN_SECURE_VALUE
}

/**
 * Provides the number of repetitions of any characters in the given password at any position.
 * @param password The password to check.
 * @returns The number of same characters.
 */
function _getNbrOfSameChars(password: string): number {
	const characterObject = new Set<string>()

	for (const c of password) {
		characterObject.add(c)
	}

	return password.length - characterObject.size
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
		s = sequences.concat(sequences.map((s1) => s1.split("").reverse().join("")))
	}

	let MIN_SEQUENCE_LEN = 4
	let nbrOfSequenceDigits = 0

	// check the part of the password (substringToCheck) from i to i+sequenceLen in a loop
	for (let i = 0; i <= password.length - MIN_SEQUENCE_LEN; i++) {
		let maxFoundLen = 0

		for (let sequenceLen = MIN_SEQUENCE_LEN; i + sequenceLen <= password.length; sequenceLen++) {
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
			i += maxFoundLen - 1 // skip the found sequence. -1 because the for loop also decreases by 1
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
	let result = string.match(regexp)
	return result ? result.reduce((max, val) => Math.max(max, val.length), 0) : 0
}
