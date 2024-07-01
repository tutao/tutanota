import o from "@tutao/otest"
import { isMailAddress, isRegularExpression, isValidCreditCardNumber } from "../../../src/common/misc/FormatValidator.js"
o.spec("FormatValidatorTest", function () {
	o(" isRegularExpression", function () {
		// no regular expressions
		o(isRegularExpression("")).equals(false)
		o(isRegularExpression("1")).equals(false)
		o(isRegularExpression("$")).equals(false)
		o(isRegularExpression("//")).equals(true)
		o(isRegularExpression("/123/")).equals(true)
		o(isRegularExpression("/[1]*/")).equals(true)
		o(isRegularExpression("/$/")).equals(true)
		// escaped characters
		o(isRegularExpression("/./")).equals(true)
		o(isRegularExpression("/\\/")).equals(true)
		o(isRegularExpression("/$/")).equals(true)
		// with flags
		o(isRegularExpression("/hey/i")).equals(true)
		o(isRegularExpression("//muy")).equals(true)
		o(isRegularExpression("/hey/x")).equals(false)
	})
	o("credit card validation", function () {
		// taken from https://developers.braintreepayments.com/guides/credit-cards/testing-go-live/php
		const goodValues = [
			"378282246310005",
			"371449635398431",
			"36259600000004",
			"6011 0009 9130 0009",
			"3530 1113 3330 0000",
			"6304000000000000",
			"55555555 55554444",
			"2223000048400011",
			"4111111111111111",
			"4005519200000004",
			"400 934 888 888 188 1",
			"4012000033330026",
			"4012000077777777",
			"4012888888881881",
			"4217651111111119",
			" 4500600000000061",
		]
		const badValues = [
			"79927398710",
			"79927398711",
			"79 9273 98712",
			"7992 7398 714",
			"7992 7398715",
			"79927398716",
			"7992 7398 717",
			"79927398718",
			"79927398719",
			"128937asd",
			"i am not a credit card number",
			"601100099a1300009",
			"353011asd1333300000",
			"630400000!000&0000",
			"55555555d5555s 4444",
			"a4111111111111111",
		]

		// not sure why ospec doesn't print a context message when a test fails but this is my workaround
		function testCreditCardNumberValidation(val: string, isValid: boolean) {
			o(isValidCreditCardNumber(val)).equals(isValid)(`${val} is ${isValid ? "valid" : "invalid"}`)
		}

		for (let good of goodValues) testCreditCardNumberValidation(good, true)

		for (let bad of badValues) testCreditCardNumberValidation(bad, false)
	})
	o("isMailAddress", function () {
		o(isMailAddress("abcefghijklmnopqrstuvwxyzabcefghijklmnopqrstuvwxyzabcefghijklmnopqrstuvwxyz@cd.de", false)).equals(true)
		o(isMailAddress("a@d.de", false)).equals(true)
		o(isMailAddress("*@d.de", false)).equals(true)
		o(isMailAddress("asfldawef+@d.de", false)).equals(true)
		o(isMailAddress("asfldawef=@d.de", false)).equals(true)
		o(isMailAddress("+@d.de", false)).equals(true)
		o(isMailAddress("=@d.de", false)).equals(true)
		o(isMailAddress("@d.de", false)).equals(false)
		o(isMailAddress(" @d.de", false)).equals(false)
		o(isMailAddress("\t@d.de", false)).equals(false)
		o(isMailAddress("asdf asdf@d.de", false)).equals(false)
		o(isMailAddress("@@d.de", false)).equals(false)
		o(isMailAddress("a@b@d.de", false)).equals(false)
		o(isMailAddress("abc@döh.de", false)).equals(false) // no IDNA support

		o(isMailAddress("a,b@d.de", false)).equals(false)
		o(isMailAddress("a)b@d.de", false)).equals(false)
	})
})
