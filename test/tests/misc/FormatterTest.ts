import o from "@tutao/otest"
import { lang, languageCodeToTag, languages } from "../../../src/common/misc/LanguageViewModel.js"
import { formatDate } from "../../../src/common/misc/Formatter.js"
import { BirthdayTypeRef } from "../../../src/common/api/entities/tutanota/TypeRefs.js"
import { _getNumDaysInMonth, parseBirthday, parseDate } from "../../../src/common/misc/DateParser.js"
import { createTestEntity } from "../TestUtils.js"

const parseDateWithFormatter = (text: string) => parseDate(text, (refdate) => formatDate(refdate))
const parseBirthdayWithFormatter = (text: string) => parseBirthday(text, (refdate) => formatDate(refdate))

o.spec("FormatterTest", function () {
	o(
		"Intl and parse support for all supported locales",
		browser(function () {
			let referenceDate = new Date(2017, 5, 23)

			for (let l of [...languages, { code: "en_gb", textId: "" }]) {
				lang._setLanguageTag(languageCodeToTag(l.code))

				let formattedDate = formatDate(referenceDate)

				// exception case for lang code farsi and arabic because parse date can't handle persian or hindi numerals
				if (l.code.startsWith("fa") || l.code.startsWith("ar")) {
					console.log("Skipping parse ", l.code)
				} else {
					let parsed = parseDateWithFormatter(formattedDate)
					o(formatDate(parsed)).equals(formattedDate)(`invalid date parsing for lang ${l.code}: ${formatDate(parsed)}`)
				}
			}
		}),
	)

	o(
		"parse nice dates de",
		browser(function () {
			lang._setLanguageTag("de")

			o(parseDateWithFormatter("29.02.2020")).deepEquals(new Date(2020, 1, 29))
			o(parseDateWithFormatter("03.05.2015")).deepEquals(new Date(2015, 4, 3))
			o(parseDateWithFormatter("1/4/21")).deepEquals(new Date(2021, 3, 1))
			o(parseDateWithFormatter("01-02")).deepEquals(new Date(new Date().getFullYear(), 1, 1))
		}),
	)

	o(
		"parse nice dates en",
		browser(function () {
			lang._setLanguageTag("en")

			o(parseDateWithFormatter("02.29.2020")).deepEquals(new Date(2020, 1, 29))
			o(parseDateWithFormatter("03.05.2015")).deepEquals(new Date(2015, 2, 5))
			o(parseDateWithFormatter("1/4/21")).deepEquals(new Date(2021, 0, 4))
			o(parseDateWithFormatter("01-02")).deepEquals(new Date(new Date().getFullYear(), 0, 2))
		}),
	)

	o(
		"parse nice dates hu",
		browser(function () {
			lang._setLanguageTag("hu")

			o(parseDateWithFormatter("2020.02.29")).deepEquals(new Date(2020, 1, 29))
			o(parseDateWithFormatter("2015.05.03")).deepEquals(new Date(2015, 4, 3))
			o(parseDateWithFormatter("21/4/15")).deepEquals(new Date(2021, 3, 15))
			o(parseDateWithFormatter("01-22")).deepEquals(new Date(new Date().getFullYear(), 0, 22))
		}),
	)

	o(
		"parse date edge case :-)",
		browser(function () {
			lang._setLanguageTag("de")

			o(parseDateWithFormatter("‎03/‎05/‎2015")).deepEquals(new Date(2015, 4, 3)) // contains invisible left-to-right characters
		}),
	)

	o(
		"parse bad dates de",
		browser(function () {
			lang._setLanguageTag("de")

			o(() => parseDateWithFormatter("31/06/2020")).throws(Error)
			o(() => parseDateWithFormatter("32/01/2020")).throws(Error)
			o(() => parseDateWithFormatter("29/02/2021")).throws(Error)
			o(() => parseDateWithFormatter("01.2015")).throws(Error)
			o(() => parseDateWithFormatter("05.2015")).throws(Error)
			o(() => parseDateWithFormatter("2015")).throws(Error)
			o(() => parseDateWithFormatter("2020.09.12")).throws(Error)
			o(() => parseDateWithFormatter("2020/12/19")).throws(Error)
			o(() => parseDateWithFormatter("05.2015.01")).throws(Error)
		}),
	)

	o(
		"parse bad dates en",
		browser(function () {
			lang._setLanguageTag("en")

			o(() => parseDateWithFormatter("06/31/2020")).throws(Error)
			o(() => parseDateWithFormatter("01/32/2020")).throws(Error)
			o(() => parseDateWithFormatter("02/29/2021")).throws(Error)
			o(() => parseDateWithFormatter("2015/01")).throws(Error)
			o(() => parseDateWithFormatter("2015/05/")).throws(Error)
			o(() => parseDateWithFormatter("2015")).throws(Error)
			o(() => parseDateWithFormatter("2020/09/12")).throws(Error)
			o(() => parseDateWithFormatter("2020.12.19")).throws(Error)
			o(() => parseDateWithFormatter("05/2015/01")).throws(Error)
		}),
	)

	o(
		"parse bad dates hu",
		browser(function () {
			lang._setLanguageTag("hu")

			o(() => parseDateWithFormatter("2020/06/31")).throws(Error)
			o(() => parseDateWithFormatter("2020/01/32")).throws(Error)
			o(() => parseDateWithFormatter("2021/02/29")).throws(Error)
			o(() => parseDateWithFormatter("2015/01")).throws(Error)
			o(() => parseDateWithFormatter("2015/05/")).throws(Error)
			o(() => parseDateWithFormatter("01.2015")).throws(Error)
			o(() => parseDateWithFormatter("05/2015")).throws(Error)
		}),
	)

	o(
		"parseBirthdayGermanLocale",
		browser(function () {
			lang._setLanguageTag("de-DE")

			o(parseBirthdayWithFormatter("")).equals(null)("empty string")
			o(parseBirthdayWithFormatter("a")).equals(null)("a")
			o(parseBirthdayWithFormatter("1.13.1950")).equals(null)("1.13.1950")
			o(parseBirthdayWithFormatter("a.4.12")).equals(null)("a.4.12")

			_checkparseBirthdayWithFormatter("1a.1.2001", 1, 1, 2001)

			_checkparseBirthdayWithFormatter("1.1.2001", 1, 1, 2001)

			_checkparseBirthdayWithFormatter("1.12.2001", 1, 12, 2001)

			_checkparseBirthdayWithFormatter("01.01.2001", 1, 1, 2001)

			_checkparseBirthdayWithFormatter("01.12.2001", 1, 12, 2001)

			_checkparseBirthdayWithFormatter("1.1.", 1, 1, null)

			_checkparseBirthdayWithFormatter("1.1.2001", 1, 1, 2001)

			_checkparseBirthdayWithFormatter("1.1.18", 1, 1, 2018)

			_checkparseBirthdayWithFormatter("1.1.50", 1, 1, 1950)
		}),
	)

	o(
		"parseWithFormatterUsLocale",
		browser(function () {
			lang._setLanguageTag("en-US")

			o(parseBirthdayWithFormatter("")).equals(null)
			o(parseBirthdayWithFormatter("a")).equals(null)
			o(parseBirthdayWithFormatter("13/1/1950")).equals(null)("13/1/1950")
			o(parseBirthdayWithFormatter("a/4/12")).equals(null)("a/4/12")

			_checkparseBirthdayWithFormatter("1a/1/2001", 1, 1, 2001)

			_checkparseBirthdayWithFormatter("1/1/2001", 1, 1, 2001)

			_checkparseBirthdayWithFormatter("12/1/2001", 1, 12, 2001)

			_checkparseBirthdayWithFormatter("01/01/2001", 1, 1, 2001)

			_checkparseBirthdayWithFormatter("12/01/2001", 1, 12, 2001)

			_checkparseBirthdayWithFormatter("1/1", 1, 1, null)

			_checkparseBirthdayWithFormatter("1/1/2001", 1, 1, 2001)

			_checkparseBirthdayWithFormatter("1/1/18", 1, 1, 2018)

			// It will fail in 2050. Hello from 2019!
			_checkparseBirthdayWithFormatter("1/1/50", 1, 1, 1950)
		}),
	)

	o("days of month", function () {
		o(_getNumDaysInMonth(1, 2021)).equals(31)
		o(_getNumDaysInMonth(1, 2020)).equals(31)
		o(_getNumDaysInMonth(2, 2021)).equals(28)
		o(_getNumDaysInMonth(2, 2020)).equals(29)
		o(_getNumDaysInMonth(3, 2021)).equals(31)
		o(_getNumDaysInMonth(3, 2020)).equals(31)
		o(_getNumDaysInMonth(4, 2021)).equals(30)
		o(_getNumDaysInMonth(4, 2020)).equals(30)
		o(_getNumDaysInMonth(5, 2021)).equals(31)
		o(_getNumDaysInMonth(5, 2020)).equals(31)
		o(_getNumDaysInMonth(6, 2021)).equals(30)
		o(_getNumDaysInMonth(6, 2020)).equals(30)
		o(_getNumDaysInMonth(7, 2021)).equals(31)
		o(_getNumDaysInMonth(7, 2020)).equals(31)
		o(_getNumDaysInMonth(8, 2021)).equals(31)
		o(_getNumDaysInMonth(8, 2020)).equals(31)
		o(_getNumDaysInMonth(9, 2021)).equals(30)
		o(_getNumDaysInMonth(9, 2020)).equals(30)
		o(_getNumDaysInMonth(10, 2021)).equals(31)
		o(_getNumDaysInMonth(10, 2020)).equals(31)
		o(_getNumDaysInMonth(11, 2021)).equals(30)
		o(_getNumDaysInMonth(11, 2020)).equals(30)
		o(_getNumDaysInMonth(12, 2021)).equals(31)
		o(_getNumDaysInMonth(12, 2020)).equals(31)
	})

	function _checkparseBirthdayWithFormatter(text: string, expectedDay: number, expectedMonth: number, expectedYear: number | null | undefined) {
		let expected = createTestEntity(BirthdayTypeRef)
		expected._id = ""
		expected.day = String(expectedDay)
		expected.month = String(expectedMonth)
		expected.year = expectedYear ? String(expectedYear) : null
		let result = parseBirthdayWithFormatter(text)

		if (result) {
			result._id = ""
			result._type = expected._type
		}

		o(result!).deepEquals(expected)
	}
})
