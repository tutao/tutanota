import o from "ospec"
import {lang, languageCodeToTag, languages} from "../../../src/misc/LanguageViewModel"
// @ts-ignore[untyped-import]
import en from "../../../src/translations/en"
import {formatDate, formatNameAndAddress} from "../../../src/misc/Formatter"
import {createBirthday} from "../../../src/api/entities/tutanota/TypeRefs.js"
import {_getNumDaysInMonth, parseBirthday, parseDate} from "../../../src/misc/DateParser"

o.spec("FormatterTest", function () {
	o("Intl and parse support for all supported locales", browser(function () {
		let referenceDate = new Date(2017, 5, 23)

		for (let l of [...languages, {code: "en_gb", textId: "",}]) {
			lang._setLanguageTag(languageCodeToTag(l.code))

			let formattedDate = formatDate(referenceDate)

			// exception case for lang code farsi and arabic because parse date can't handle persian or hindi numerals
			if (l.code.startsWith("fa") || l.code.startsWith("ar")) {
				console.log("Skipping parse ", l.code)
			} else {
				let parsed = parseDate(formattedDate)
				o(formatDate(parsed)).equals(formattedDate)(
					`invalid date parsing for lang ${l.code}: ${formatDate(parsed)}`,
				)
			}
		}
	}))

	o("parse nice dates de", browser(function () {
		lang._setLanguageTag("de")

		o(parseDate("29.02.2020")).deepEquals(new Date(2020, 1, 29))
		o(parseDate("03.05.2015")).deepEquals(new Date(2015, 4, 3))
		o(parseDate("1/4/21")).deepEquals(new Date(2021, 3, 1))
		o(parseDate("01-02")).deepEquals(new Date(new Date().getFullYear(), 1, 1))
	}))

	o("parse nice dates en", browser(function () {
		lang._setLanguageTag("en")

		o(parseDate("02.29.2020")).deepEquals(new Date(2020, 1, 29))
		o(parseDate("03.05.2015")).deepEquals(new Date(2015, 2, 5))
		o(parseDate("1/4/21")).deepEquals(new Date(2021, 0, 4))
		o(parseDate("01-02")).deepEquals(new Date(new Date().getFullYear(), 0, 2))
	}))

	o("parse nice dates hu", browser(function () {
		lang._setLanguageTag("hu")

		o(parseDate("2020.02.29")).deepEquals(new Date(2020, 1, 29))
		o(parseDate("2015.05.03")).deepEquals(new Date(2015, 4, 3))
		o(parseDate("21/4/15")).deepEquals(new Date(2021, 3, 15))
		o(parseDate("01-22")).deepEquals(new Date(new Date().getFullYear(), 0, 22))
	}))

	o("parse date edge case :-)", browser(function () {
		lang._setLanguageTag("de")

		o(parseDate("‎03/‎05/‎2015")).deepEquals(new Date(2015, 4, 3)) // contains invisible left-to-right characters
	}))

	o("parse bad dates de", browser(function () {
		lang._setLanguageTag("de")

		o(() => parseDate("31/06/2020")).throws(Error)
		o(() => parseDate("32/01/2020")).throws(Error)
		o(() => parseDate("29/02/2021")).throws(Error)
		o(() => parseDate("01.2015")).throws(Error)
		o(() => parseDate("05.2015")).throws(Error)
		o(() => parseDate("2015")).throws(Error)
		o(() => parseDate("2020.09.12")).throws(Error)
		o(() => parseDate("2020/12/19")).throws(Error)
		o(() => parseDate("05.2015.01")).throws(Error)
	}))

	o("parse bad dates en", browser(function () {
		lang._setLanguageTag("en")

		o(() => parseDate("06/31/2020")).throws(Error)
		o(() => parseDate("01/32/2020")).throws(Error)
		o(() => parseDate("02/29/2021")).throws(Error)
		o(() => parseDate("2015/01")).throws(Error)
		o(() => parseDate("2015/05/")).throws(Error)
		o(() => parseDate("2015")).throws(Error)
		o(() => parseDate("2020/09/12")).throws(Error)
		o(() => parseDate("2020.12.19")).throws(Error)
		o(() => parseDate("05/2015/01")).throws(Error)
	}))

	o("parse bad dates hu", browser(function () {
		lang._setLanguageTag("hu")

		o(() => parseDate("2020/06/31")).throws(Error)
		o(() => parseDate("2020/01/32")).throws(Error)
		o(() => parseDate("2021/02/29")).throws(Error)
		o(() => parseDate("2015/01")).throws(Error)
		o(() => parseDate("2015/05/")).throws(Error)
		o(() => parseDate("01.2015")).throws(Error)
		o(() => parseDate("05/2015")).throws(Error)
	}))

	o("formatNameAndAddress", function () {
		o(formatNameAndAddress("", "")).equals("")
		o(formatNameAndAddress("Bernd", "")).equals("Bernd")
		o(formatNameAndAddress("Bernd", "")).equals("Bernd")
		o(formatNameAndAddress("", "Hanomaghof")).equals("Hanomaghof")
		o(formatNameAndAddress("Bernd", "Hanomaghof 2\n30449 Hannover")).equals(
			"Bernd\nHanomaghof 2\n30449 Hannover",
		)
		o(formatNameAndAddress("Bernd", "Hanomaghof 2\n30449 Hannover", "FR")).equals(
			"Bernd\nHanomaghof 2\n30449 Hannover\nFrance",
		)
		o(formatNameAndAddress("", "", "DE")).equals("Deutschland")
		o(formatNameAndAddress("a", "", "DE")).equals("a\nDeutschland")
	})

	o("parseBirthdayGermanLocale", browser(function () {
		lang._setLanguageTag("de-DE")

		o(parseBirthday("")).equals(null)("empty string")
		o(parseBirthday("a")).equals(null)("a")
		o(parseBirthday("1.13.1950")).equals(null)("1.13.1950")
		o(parseBirthday("a.4.12")).equals(null)("a.4.12")

		_checkParseBirthday("1a.1.2001", 1, 1, 2001)

		_checkParseBirthday("1.1.2001", 1, 1, 2001)

		_checkParseBirthday("1.12.2001", 1, 12, 2001)

		_checkParseBirthday("01.01.2001", 1, 1, 2001)

		_checkParseBirthday("01.12.2001", 1, 12, 2001)

		_checkParseBirthday("1.1.", 1, 1, null)

		_checkParseBirthday("1.1.2001", 1, 1, 2001)

		_checkParseBirthday("1.1.18", 1, 1, 2018)

		_checkParseBirthday("1.1.50", 1, 1, 1950)
	}))

	o("parseBirthdayUsLocale", browser(function () {
		lang._setLanguageTag("en-US")

		o(parseBirthday("")).equals(null)
		o(parseBirthday("a")).equals(null)
		o(parseBirthday("13/1/1950")).equals(null)("13/1/1950")
		o(parseBirthday("a/4/12")).equals(null)("a/4/12")

		_checkParseBirthday("1a/1/2001", 1, 1, 2001)

		_checkParseBirthday("1/1/2001", 1, 1, 2001)

		_checkParseBirthday("12/1/2001", 1, 12, 2001)

		_checkParseBirthday("01/01/2001", 1, 1, 2001)

		_checkParseBirthday("12/01/2001", 1, 12, 2001)

		_checkParseBirthday("1/1", 1, 1, null)

		_checkParseBirthday("1/1/2001", 1, 1, 2001)

		_checkParseBirthday("1/1/18", 1, 1, 2018)

		// It will fail in 2050. Hello from 2019!
		_checkParseBirthday("1/1/50", 1, 1, 1950)
	}))

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

	function _checkParseBirthday(
		text: string,
		expectedDay: number,
		expectedMonth: number,
		expectedYear: number | null | undefined,
	) {
		let expected = createBirthday()
		expected._id = ""
		expected.day = String(expectedDay)
		expected.month = String(expectedMonth)
		expected.year = expectedYear ? String(expectedYear) : null
		let result = parseBirthday(text)

		if (result) {
			result._id = ""
			result._type = expected._type
		}

		o(result!).deepEquals(expected)
	}
})