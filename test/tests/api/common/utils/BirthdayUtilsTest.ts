import o from "@tutao/otest"
import { BirthdayTypeRef, createBirthday } from "../../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { birthdayToIsoDate, isoDateToBirthday } from "../../../../../src/common/api/common/utils/BirthdayUtils.js"
import { ParsingError } from "../../../../../src/common/api/common/error/ParsingError.js"
import { TutanotaError } from "@tutao/tutanota-error"
import { createTestEntity } from "../../../TestUtils.js"

o.spec("BirthdayUtilsTest", function () {
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
	o("isoDateToBirthday", function () {
		o(isoDateToBirthday("--10-12")).deepEquals(
			createTestEntity(BirthdayTypeRef, {
				day: "12",
				month: "10",
				year: null,
			}),
		)
		o(isoDateToBirthday("2009-10-12")).deepEquals(
			createTestEntity(BirthdayTypeRef, {
				day: "12",
				month: "10",
				year: "2009",
			}),
		)
		o(isoDateToBirthday("2009-12-31")).deepEquals(
			createTestEntity(BirthdayTypeRef, {
				day: "31",
				month: "12",
				year: "2009",
			}),
		)
		o(isoDateToBirthday("2009-01-01")).deepEquals(
			createTestEntity(BirthdayTypeRef, {
				day: "01",
				month: "01",
				year: "2009",
			}),
		)
	})
	o("parsing error", function () {
		assertFail(() => isoDateToBirthday(""), new ParsingError("invalid birthday: "))
		assertFail(() => isoDateToBirthday("-"), new ParsingError("invalid birthday: -"))
		assertFail(() => isoDateToBirthday("31"), new ParsingError("invalid birthday: 31"))
		assertFail(() => isoDateToBirthday("31-wq."), new ParsingError("invalid birthday: 31-wq."))
		assertFail(() => isoDateToBirthday("--"), new ParsingError("invalid birthday without year: --"))
		assertFail(() => isoDateToBirthday("---10-12"), new ParsingError("invalid birthday without year: ---10-12"))
		assertFail(() => isoDateToBirthday("aaaa-bb-cc"), new ParsingError("Invalid birthday format: aaaa-bb-cc"))
		assertFail(() => isoDateToBirthday("aaaa-bb-01"), new ParsingError("Invalid birthday format: aaaa-bb-01"))
		assertFail(() => isoDateToBirthday("aaaa-01-01"), new ParsingError("Invalid birthday format: aaaa-01-01"))
		assertFail(() => isoDateToBirthday("0000-01-01"), new ParsingError("Invalid birthday format: 0000-01-01"))
		assertFail(() => isoDateToBirthday("2019-00-01"), new ParsingError("Invalid birthday format: 2019-00-01"))
		assertFail(() => isoDateToBirthday("2019-01-00"), new ParsingError("Invalid birthday format: 2019-01-00"))
		assertFail(() => isoDateToBirthday("2019-13-31"), new ParsingError("Invalid birthday format: 2019-13-31"))
		assertFail(() => isoDateToBirthday("2019-12-32"), new ParsingError("Invalid birthday format: 2019-12-32"))
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
