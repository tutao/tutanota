import o from "@tutao/otest"
import {
	_BAD_SEQUENCES,
	_getNbrOfSequenceChars,
	getPasswordStrength,
	isSecurePassword,
	scaleToVisualPasswordStrength,
} from "../../../src/common/misc/passwords/PasswordUtils.js"

o.spec("PasswordUtilsTest", function () {
	function checkStrength(pw, min, max) {
		//		console.log(pw, min, max, getPasswordStrength(pw));
		o(min <= getPasswordStrength(pw, [])).equals(true)(
			"Passphrase " + pw + " strength: " + getPasswordStrength(pw, []) + " is smaller than expected " + min,
		)
		o(getPasswordStrength(pw, []) <= max).equals(true)("Passphrase " + pw + " strength: " + getPasswordStrength(pw, []) + " is bigger than expected " + max)
	}

	o("password strength", function () {
		checkStrength("", 0, 0)
		checkStrength("a", 0, 20)
		checkStrength("aX", 0, 30)
		checkStrength("aX%", 10, 35)
		checkStrength("aX%7", 20, 45)
		checkStrength("aX%7#", 30, 60)
		checkStrength("aX%7#+", 40, 70)
		checkStrength("aX%7#+t", 50, 80)
		checkStrength("aX%7#+tO", 80, 100)
		checkStrength("dasisteinpasswort", 50, 70)
		checkStrength("das-ist-ein-passwort", 80, 100)
		checkStrength("helloWorld!", 80, 90)
		checkStrength("testtesttesttest", 0, 20)
		checkStrength("!*$%/()=", 30, 50)
		checkStrength("abcdefgh", 10, 30)
		checkStrength("mjudleugdh", 50, 70)
		checkStrength("12345678", 10, 30)
		checkStrength("abcde1gh", 30, 50)
		checkStrength("ab!de1gh", 60, 79)
		checkStrength("987654321", 10, 30)
		checkStrength("11111111111111111111", 0, 20)
		checkStrength("Aihlod$1", 60, 79)
		checkStrength("ai$hl1oD", 70, 79)
		checkStrength("Ai$h1oDl", 80, 90)
		checkStrength("!i$hL1D", 70, 79)
		checkStrength("Ahagitubitbl", 70, 79)
		checkStrength("Ahagitubitblz", 80, 90)
	})
	o("getNbrOfSequenceChars", function () {
		o(_getNbrOfSequenceChars("qwertz", _BAD_SEQUENCES, true)).equals(6) // german keyboard

		o(_getNbrOfSequenceChars("qwerty", _BAD_SEQUENCES, true)).equals(6) // english keyboard

		o(_getNbrOfSequenceChars("4567890", _BAD_SEQUENCES, true)).equals(7) // number sequence

		o(_getNbrOfSequenceChars("m,.-", _BAD_SEQUENCES, true)).equals(4) // sequence with special characters

		o(_getNbrOfSequenceChars("3kfh5678awf", _BAD_SEQUENCES, true)).equals(4) // sequence in center

		o(_getNbrOfSequenceChars("3kfhkjhgfawf", _BAD_SEQUENCES, true)).equals(5) // backward sequence in center

		o(_getNbrOfSequenceChars("3kfhkjhgfawf", _BAD_SEQUENCES, false)).equals(0) // backward sequence in center no reverse

		o(_getNbrOfSequenceChars("a2345ngb890d", _BAD_SEQUENCES, true)).equals(4) // two separate sequences

		o(_getNbrOfSequenceChars("a2345890d", _BAD_SEQUENCES, true)).equals(4) // two adjoining sequences

		o(_getNbrOfSequenceChars("r56b", _BAD_SEQUENCES, true)).equals(0) // two digit sequence is not found

		o(_getNbrOfSequenceChars("tzuio54", _BAD_SEQUENCES, true)).equals(5) // sequence at the beginning

		o(_getNbrOfSequenceChars("54tzuio", _BAD_SEQUENCES, true)).equals(5) // sequence at the end
	})
	o("scalueToVisualPasswordStrength", function () {
		o(scaleToVisualPasswordStrength(0)).equals(0) // german keyboard

		o(scaleToVisualPasswordStrength(10)).equals(12.5) // german keyboard

		o(scaleToVisualPasswordStrength(79)).equals(98.75) // german keyboard

		o(scaleToVisualPasswordStrength(80)).equals(100) // german keyboard

		o(scaleToVisualPasswordStrength(100)).equals(100) // german keyboard
	})
	o("isSecure", function () {
		o(isSecurePassword(0)).equals(false) // german keyboard
		o(isSecurePassword(10)).equals(false) // german keyboard
		o(isSecurePassword(63)).equals(false) // german keyboard
		o(isSecurePassword(64)).equals(true) // german keyboard
		o(isSecurePassword(79)).equals(true) // german keyboard
		o(isSecurePassword(80)).equals(true) // german keyboard
	})
	o("calculatePasswordStrength -> reserved strings are case insensitive", function () {
		o(getPasswordStrength("7jeGABvliT", ["7jegabvlit"])).equals(54)
		o(getPasswordStrength("7jegabvlit", ["7jegabvlit"])).equals(37)
		o(getPasswordStrength("7jegabvlit", [])).equals(77)
		o(getPasswordStrength("7jegabvlit", [])).equals(getPasswordStrength("7jegabvlit", ["7390535"]))
		o(getPasswordStrength("7jegabvlit", ["7jegabvlit"])).equals(getPasswordStrength("7JEGABVLIT", ["7jegabvlit"]))
		o(getPasswordStrength("7jegabvlit", ["7jeGABvliT"])).equals(getPasswordStrength("7jegabvlit", ["7jegabvlit"]))
	})
})
