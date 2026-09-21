import o from "@tutao/otest"

import { TutanotaError } from "../../../../../src/platform-kit/app-env"
import { createTestEntity } from "../../../TestUtils.js"
import { BirthdayTypeRef } from "@tutao/entities/tutanota"
import { birthdayToIsoDate, parseContactIsoDate } from "../../../../../src/applications/common/contactsFunctionality/ContactUtils"

o.spec("BirthdayUtils", function () {
	o("birthdayToIsoDate", function () {
		const bday = createTestEntity(BirthdayTypeRef, {
			day: "12",
			month: "10",
			year: null,
		})
		o(birthdayToIsoDate(bday)).equals("--10-12")
		bday.year = "2009"
		o(birthdayToIsoDate(bday)).equals("2009-10-12")
		bday.year = "100"
		o(birthdayToIsoDate(bday)).equals("0100-10-12")
		bday.year = "2019"
		bday.month = "1"
		bday.day = "5"
		o(birthdayToIsoDate(bday)).equals("2019-01-05")
	})
	o.spec("parseBirthdayIsoDate", function () {
		o.test("valid cases", function () {
			o(parseContactIsoDate("--10-12")).deepEquals({
				isValid: true,
				day: 12,
				month: 10,
				year: null,
			})
			o(parseContactIsoDate("2009-10-12")).deepEquals({
				isValid: true,
				day: 12,
				month: 10,
				year: 2009,
			})
			o(parseContactIsoDate("2009-12-31")).deepEquals({
				isValid: true,
				day: 31,
				month: 12,
				year: 2009,
			})
			o(parseContactIsoDate("2009-01-01")).deepEquals({
				isValid: true,
				day: 1,
				month: 1,
				year: 2009,
			})
			o.check(parseContactIsoDate("0099-01-01")).deepEquals({
				isValid: true,
				year: 99,
				month: 1,
				day: 1,
			})
		})
		o.test("invalid cases", function () {
			o.check(parseContactIsoDate("")).deepEquals({ isValid: false, year: null, month: null, day: null })
			o.check(parseContactIsoDate("-")).deepEquals({ isValid: false, year: null, month: null, day: null })
			o.check(parseContactIsoDate("31")).deepEquals({ isValid: false, year: null, month: null, day: null })
			o.check(parseContactIsoDate("31-wq.")).deepEquals({ isValid: false, year: null, month: null, day: null })
			o.check(parseContactIsoDate("--")).deepEquals({ isValid: false, year: null, month: null, day: null })
			o.check(parseContactIsoDate("---10-12")).deepEquals({ isValid: false, year: null, month: null, day: null })
			o.check(parseContactIsoDate("aaaa-bb-cc")).deepEquals({ isValid: false, year: null, month: null, day: null })
			o.check(parseContactIsoDate("aaaa-bb-01")).deepEquals({ isValid: false, year: null, month: null, day: null })
			o.check(parseContactIsoDate("aaaa-01-01")).deepEquals({ isValid: false, year: null, month: null, day: null })
			o.check(parseContactIsoDate("0000-01-01")).deepEquals({ isValid: false, year: null, month: null, day: null })
			o.check(parseContactIsoDate("2019-00-01")).deepEquals({ isValid: false, year: null, month: null, day: null })
			o.check(parseContactIsoDate("2019-01-00")).deepEquals({ isValid: false, year: null, month: null, day: null })
			o.check(parseContactIsoDate("2019-13-31")).deepEquals({ isValid: false, year: null, month: null, day: null })
			o.check(parseContactIsoDate("2019-12-32")).deepEquals({ isValid: false, year: null, month: null, day: null })
		})
	})
})

function assertFail(testFunction: () => any, expectedError: TutanotaError) {
	try {
		testFunction()
		// @ts-ignore
		o(false).equals("exception expected: " + expectedError.message)
	} catch (e) {
		assertTutanotaError(e, expectedError)
	}
}

function assertTutanotaError(actual: any, expectedError: TutanotaError) {
	o(actual.name).equals(expectedError.name)
	o(actual.message).equals(expectedError.message)
}
