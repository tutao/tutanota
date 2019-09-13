// @flow
import o from "ospec"
import {lang, languageCodeToTag, languages} from "../../../src/misc/LanguageViewModel"
// $FlowIgnore[untyped-import]
import en from "../../../src/translations/en"
import {
	_getNumDaysInMonth,
	formatDate,
	formatNameAndAddress,
	fullNameToFirstAndLastName,
	getCleanedMailAddress,
	mailAddressToFirstAndLastName,
	parseBirthday,
	parseDate,
	stringToNameAndMailAddress
} from "../../../src/misc/Formatter"
import {isMailAddress, isRegularExpression} from "../../../src/misc/FormatValidator"
import {createBirthday} from "../../../src/api/entities/tutanota/Birthday"

o.spec("FormatterTest", function () {

	o("Intl and parse support for all supported locales", browser(function () {
		let referenceDate = new Date(2017, 5, 23)
		languages.concat([{code: 'en_gb', textId: ''}]).forEach(l => {
			lang._setLanguageTag(languageCodeToTag(l.code))
			let formattedDate = formatDate(referenceDate)
			// exception case for lang code fa_ir because parse date can't handle persian numerals
			if (l.code.startsWith("fa")) {
				o(() => parseDate(formattedDate)).throws(Error)
			} else {
				let parsed = parseDate(formattedDate)
				o(formatDate(parsed)).equals(formattedDate)(`invalid date parsing for lang ${l.code}: ${formatDate(parsed)}`)
			}
		})
	}))

	o("parse nice dates de", browser(function () {
		lang._setLanguageTag("de")
		o(parseDate("29.02.2020")).deepEquals(new Date(2020, 1, 29))
		o(parseDate("03.05.2015")).deepEquals(new Date(2015, 4, 3))
		o(parseDate("1/4/21")).deepEquals(new Date(1921, 3, 1))
		o(parseDate("01-02")).deepEquals(new Date(new Date().getFullYear(), 1, 1))
	}))

	o("parse nice dates en", browser(function () {
		lang._setLanguageTag("en")
		o(parseDate("02.29.2020")).deepEquals(new Date(2020, 1, 29))
		o(parseDate("03.05.2015")).deepEquals(new Date(2015, 2, 5))
		o(parseDate("1/4/21")).deepEquals(new Date(1921, 0, 4))
		o(parseDate("01-02")).deepEquals(new Date(new Date().getFullYear(), 0, 2))
	}))

	o("parse nice dates hu", browser(function () {

		lang._setLanguageTag("hu")
		o(parseDate("2020.02.29")).deepEquals(new Date(2020, 1, 29))
		o(parseDate("2015.05.03")).deepEquals(new Date(2015, 4, 3))
		o(parseDate("21/4/15")).deepEquals(new Date(1921, 3, 15))
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

	o("isStrictMailAddress", function () {
		// test valid adresses
		o(isMailAddress("a@b.de", true)).equals(true)
		o(isMailAddress("a@hello.c", true)).equals(true)
		o(isMailAddress("a.b@hello.de", true)).equals(true)
		// test uppercase
		o(isMailAddress("A@b.hello.de", true)).equals(true)
		// test missing parts
		o(isMailAddress("@b.hello.de", true)).equals(false)
		o(isMailAddress("batello.de", true)).equals(false)
		o(isMailAddress("ba@tello", true)).equals(false)
		o(isMailAddress("@hello.de", true)).equals(false)
		o(isMailAddress("a@@hello.de", true)).equals(false)
		o(isMailAddress("a@h@hello.de", true)).equals(false)
		o(isMailAddress("aa@.de", true)).equals(false)
		o(isMailAddress("aa@", true)).equals(false)
		o(isMailAddress("aa@.", true)).equals(false)
		// test empty adresses
		o(isMailAddress("", true)).equals(false)
		o(isMailAddress(" ", true)).equals(false)
		// test space at any place
		o(isMailAddress(" ab@cd.de", true)).equals(false)
		o(isMailAddress("a b@cb.de", true)).equals(false)
		o(isMailAddress("ab @cb.de", true)).equals(false)
		o(isMailAddress("ab@ cd.de", true)).equals(false)
		o(isMailAddress("ab@c b.de", true)).equals(false)
		o(isMailAddress("ab@cd .de", true)).equals(false)
		o(isMailAddress("ab@cd. de", true)).equals(false)
		o(isMailAddress("ab@cd.d e", true)).equals(false)
		o(isMailAddress("ab@cd.de ", true)).equals(false)

		// long local part
		o(isMailAddress(new Array(64 + 1).join("a") + "@tutanota.de", true)).equals(true)
		o(isMailAddress(new Array(65 + 1).join("a") + "@tutanota.de", true)).equals(false)
		// long mail address
		o(isMailAddress("aaaaaaaaaa@" + new Array(240 + 1).join("a") + ".de", true)).equals(true)
		o(isMailAddress("aaaaaaaaaa@" + new Array(241 + 1).join("a") + ".de", true)).equals(false)

		o(isMailAddress("abcefghijklmnopqrstuvwxyzabcefghijklmnopqrstuvwxyzabcefghijklmno@cd.de", true)).equals(true)
		o(isMailAddress("abcefghijklmnopqrstuvwxyzabcefghijklmnopqrstuvwxyzabcefghijklmnop@cd.de", true)).equals(false)
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

	o("cleanedMailAddress", function () {
		o(getCleanedMailAddress("   a@b.de   ")).equals("a@b.de")
		o(getCleanedMailAddress("xxxx")).equals(null)
	})

	o("stringToNameAndMailAddress", function () {
		// test valid strings
		o(stringToNameAndMailAddress(" a@b.de ")).deepEquals({name: "", mailAddress: "a@b.de"})
		o(stringToNameAndMailAddress(" <a@b.de > ")).deepEquals({name: "", mailAddress: "a@b.de"})
		o(stringToNameAndMailAddress(" Aas Bos a@b.de")).deepEquals({name: "Aas Bos", mailAddress: "a@b.de"})
		o(stringToNameAndMailAddress(" Aas Bos  <a@b.de>")).deepEquals({name: "Aas Bos", mailAddress: "a@b.de"})
		o(stringToNameAndMailAddress(" Aas Bos<a@b.de>")).deepEquals({name: "Aas Bos", mailAddress: "a@b.de"})
		// test invalid strings
		o(stringToNameAndMailAddress(" Aas Bos  <a@de>")).equals(null)
		o(stringToNameAndMailAddress(" Aas Bos ")).equals(null)
		o(stringToNameAndMailAddress(" Aas Bos  a@de")).equals(null)
	})

	o(" fullNameToNameAndMailAddress", function () {
		o(fullNameToFirstAndLastName("Peter Pan")).deepEquals({firstName: "Peter", lastName: "Pan"})
		o(fullNameToFirstAndLastName("peter pan")).deepEquals({firstName: "peter", lastName: "pan"})
		o(fullNameToFirstAndLastName("Peter Pater Pan")).deepEquals({firstName: "Peter", lastName: "Pater Pan"})
		o(fullNameToFirstAndLastName(" Peter ")).deepEquals({firstName: "Peter", lastName: ""})
	});

	o(" mailAddressToFirstAndLastName", function () {
		o(mailAddressToFirstAndLastName("Peter.Pan@x.de")).deepEquals({firstName: "Peter", lastName: "Pan"})
		o(mailAddressToFirstAndLastName("peter.pan@x.de")).deepEquals({firstName: "Peter", lastName: "Pan"})
		o(mailAddressToFirstAndLastName("peter_pan@x.de")).deepEquals({firstName: "Peter", lastName: "Pan"})
		o(mailAddressToFirstAndLastName("peter-pan@x.de")).deepEquals({firstName: "Peter", lastName: "Pan"})
		o(mailAddressToFirstAndLastName("peter_pan@x.de")).deepEquals({firstName: "Peter", lastName: "Pan"})
		o(mailAddressToFirstAndLastName("peter.pater.pan@x.de")).deepEquals({firstName: "Peter", lastName: "Pater Pan"})
		o(mailAddressToFirstAndLastName("peter@x.de")).deepEquals({firstName: "Peter", lastName: ""})
	})

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
		o(isRegularExpression("/\./")).equals(true)
		o(isRegularExpression("/\\/")).equals(true)
		o(isRegularExpression("/\$/")).equals(true)

		// with flags
		o(isRegularExpression("/hey/i")).equals(true)
		o(isRegularExpression("//muy")).equals(true)
		o(isRegularExpression("/hey/x")).equals(false)
	})


	o("formatNameAndAddress", function () {
		o(formatNameAndAddress("", "", null)).equals("")
		o(formatNameAndAddress("Bernd", "", null)).equals("Bernd")
		o(formatNameAndAddress("Bernd", "", null)).equals("Bernd")
		o(formatNameAndAddress("", "Hanomaghof", null)).equals("Hanomaghof")
		o(formatNameAndAddress("Bernd", "Hanomaghof 2\n30449 Hannover", null)).equals("Bernd\nHanomaghof 2\n30449 Hannover")
		o(formatNameAndAddress("Bernd", "Hanomaghof 2\n30449 Hannover", "FR")).equals("Bernd\nHanomaghof 2\n30449 Hannover\nFrance")
		o(formatNameAndAddress("", "", "DE")).equals("Deutschland")
		o(formatNameAndAddress("a", "", "DE")).equals("a\nDeutschland")
	})

	o("parseBirthdayGermanLocale", browser(function () {
		lang._setLanguageTag("de-DE")
		o(parseBirthday("")).equals(null)
		o(parseBirthday("a")).equals(null)
		o(parseBirthday("1.13.1950")).equals(null)
		o(parseBirthday("a.4.12")).equals(null)
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
		o(parseBirthday("13/1/1950")).equals(null)
		o(parseBirthday("a/4/12")).equals(null)
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

	function _checkParseBirthday(text: string, expectedDay: number, expectedMonth: number, expectedYear: ?number) {
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
		o(result).deepEquals(expected)
	}

})

