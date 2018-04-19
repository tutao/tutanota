// @flow
import o from "ospec/ospec.js"
import {languages, lang} from "../../../src/misc/LanguageViewModel"
import en from "../../../src/translations/en"
import {
	formatDate,
	parseDate,
	isMailAddress,
	getCleanedMailAddress,
	stringToNameAndMailAddress,
	fullNameToFirstAndLastName,
	mailAddressToFirstAndLastName,
	isRegularExpression,
	formatNameAndAddress
} from "../../../src/misc/Formatter"

o.spec("FormatterTest", function () {

	o("Intl and parse support for all supported locales", browser(function () {
		let referenceDate = new Date(2017, 5, 23)
		languages.concat([{code: 'en_gb', textId: ''}]).forEach(l => {
			let code = l.code.replace("_", "-")
			lang._setLanguageTag(code)
			let formattedDate = formatDate(referenceDate)
			let parsedTimestamp = parseDate(formattedDate)
			o(formatDate(new Date(parsedTimestamp))).equals(formattedDate)(`invalid date parsing for lang ${code}: ${formatDate(new Date(parsedTimestamp))}`)
		})
	}))

	o("parse date edge case :-)", browser(function () {
		lang._setLanguageTag("de")
		o(parseDate("‎03/‎05/‎2015")).equals(1430604000000) // contains left-to-right characters
	}))

	o("parse date edge cases", browser(function () {
		lang._setLanguageTag("de")
		try {
			formatDate(new Date(parseDate("01.2015")))
			o(false).equals(true)("should have thrown an exception")
		} catch (e) {
			o(e.message.indexOf("could not parse date")).equals(0)
		}
		try {
			formatDate(new Date(parseDate("05.2015")))
			o(false).equals(true)("should have thrown an exception")
		} catch (e) {
			o(e.message.indexOf("could not parse date")).equals(0)
		}
		try {
			o(formatDate(new Date(parseDate("2015"))))
			o(false).equals(true)("should have thrown an exception")
		} catch (e) {
			o(e.message.indexOf("could not parse date")).equals(0)
		}
		try {
			o(formatDate(new Date(parseDate("05.05."))))
			o(false).equals(true)("should have thrown an exception")
		} catch (e) {
			o(e.message.indexOf("could not parse date")).equals(0)
		}

		lang._setLanguageTag("en")
		try {
			o(formatDate(new Date(parseDate("2015/01"))))
			o(false).equals(true)("should have thrown an exception")
		} catch (e) {
			o(e.message.indexOf("could not parse date")).equals(0)
		}
		try {
			o(formatDate(new Date(parseDate("2015/05/"))))
			o(false).equals(true)("should have thrown an exception")
		} catch (e) {
			o(e.message.indexOf("could not parse date")).equals(0)
		}
		try {
			o(formatDate(new Date(parseDate("2015"))))
			o(false).equals(true)("should have thrown an exception")
		} catch (e) {
			o(e.message.indexOf("could not parse date")).equals(0)
		}
		try {
			o(formatDate(new Date(parseDate("05/05/"))))
			o(false).equals(true)("should have thrown an exception")
		} catch (e) {
			o(e.message.indexOf("could not parse date")).equals(0)
		}
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
		//escaped characters
		o(isRegularExpression("/\./")).equals(true)
		o(isRegularExpression("/\\/")).equals(true)
		o(isRegularExpression("/\$/")).equals(true)
	})


	o("formatNameAndAddress", function () {
		o(formatNameAndAddress("", "")).equals("")
		o(formatNameAndAddress("Bernd", "")).equals("Bernd")
		o(formatNameAndAddress("Bernd", "")).equals("Bernd")
		o(formatNameAndAddress("", "Hanomaghof")).equals("Hanomaghof")
		o(formatNameAndAddress("Bernd", "Hanomaghof 2\n30449 Hannover")).equals("Bernd\nHanomaghof 2\n30449 Hannover")
	})

})

