import o from "@tutao/otest"
import {
	BirthdayTypeRef,
	ContactAddressTypeRef,
	ContactMailAddressTypeRef,
	ContactPhoneNumberTypeRef,
	ContactTypeRef,
} from "../../../src/common/api/entities/tutanota/TypeRefs.js"
import { lang } from "../../../src/common/misc/LanguageViewModel.js"
import { compareContacts } from "../../../src/mail-app/contacts/view/ContactGuiUtils.js"
import { createTestEntity } from "../TestUtils.js"
import { ContactAddressType, ContactPhoneNumberType } from "../../../src/common/api/common/TutanotaConstants.js"
import {
	extractStructuredAddresses,
	extractStructuredMailAddresses,
	extractStructuredPhoneNumbers,
	formatBirthdayNumeric,
} from "../../../src/common/contactsFunctionality/ContactUtils.js"

o.spec("ContactUtilsTest", function () {
	let compare = function (c1Firstname, c1Lastname, c1MailAddress, c2Firstname, c2Lastname, c2MailAddress, byFirstName, expectedResult) {
		let c1 = createTestEntity(ContactTypeRef)
		let c2 = createTestEntity(ContactTypeRef)
		c1._id = ["a", "1"]
		c2._id = ["a", "2"]
		c1.firstName = c1Firstname
		c2.firstName = c2Firstname
		c1.lastName = c1Lastname
		c2.lastName = c2Lastname

		if (c1MailAddress) {
			let m = createTestEntity(ContactMailAddressTypeRef)
			m.address = c1MailAddress
			c1.mailAddresses.push(m)
		}

		if (c2MailAddress) {
			let m = createTestEntity(ContactMailAddressTypeRef)
			m.address = c2MailAddress
			c2.mailAddresses.push(m)
		}

		let result = compareContacts(c1, c2, byFirstName)

		// We should use Mithril's ability to print messages instead of this log when it will work again (and the moment of writing it's
		// fixed but not released: https://github.com/MithrilJS/mithril.js/issues/2391
		if (result != expectedResult) {
			console.log(
				"error >>>>>>>",
				"'" + c1Firstname + "'",
				"'" + c1Lastname + "'",
				c1MailAddress,
				"'" + c2Firstname + "'",
				"'" + c2Lastname + "'",
				c2MailAddress,
				"expected:",
				expectedResult,
				"result",
				result,
			)
		}

		o(result).equals(expectedResult)
	}

	o("compareContacts by first name", function () {
		// only first name
		compare("Alf", "", null, "", "", null, true, -1)
		compare("Alf", "", null, "Bob", "", null, true, -1)
		compare("", "", null, "Bob", "", null, true, 1)
		compare("Bob", "", null, "Alf", "", null, true, 1)
		// only last name
		compare("", "Alf", null, "", "", null, true, -1)
		compare("", "Alf", null, "", "Bob", null, true, -1)
		compare("", "", null, "", "Bob", null, true, 1)
		compare("", "Bob", null, "", "Alf", null, true, 1)
		// only mail address
		compare("", "", "Alf", "", "", null, true, -1)
		compare("", "", "Alf", "", "", "Bob", true, -1)
		compare("", "", null, "", "", "Bob", true, 1)
		compare("", "", "Bob", "", "", "Alf", true, 1)
		// first and last name
		compare("", "Alf", null, "Alf", "Bob", null, true, 1)
		compare("Alf", "Bob", null, "Bob", "Alf", null, true, -1)
		compare("Alf", "Bob", null, "", "Bob", null, true, -1)
		compare("Alf", "", null, "Alf", "Bob", null, true, 1)
		// mixed
		compare("", "Bob", null, "", "", "Alf", true, -1)
		compare("Bob", "", null, "", "", "Alf", true, -1)
		compare("Alf", "Bob", "Bob", "Alf", "Bob", "Alf", true, 1)
		compare("Alf", "Bob", null, "", "", "Alf", true, -1)
		// none or same
		compare("", "", null, "", "", null, true, 1) // reverse id

		compare("Alf", "Bob", "Bob", "Alf", "Bob", "Bob", true, 1) // reverse id

		compare("ma", "p", "aa", "Gump", "Forrest", "aa", true, 1) // reverse id
	})
	o("compareContacts by last name", function () {
		// only first name
		compare("Alf", "", null, "", "", null, false, -1)
		compare("Alf", "", null, "Bob", "", null, false, -1)
		compare("", "", null, "Bob", "", null, false, 1)
		compare("Bob", "", null, "Alf", "", null, false, 1)
		// only last name
		compare("", "Alf", null, "", "", null, false, -1)
		compare("", "Alf", null, "", "Bob", null, false, -1)
		compare("", "", null, "", "Bob", null, false, 1)
		compare("", "Bob", null, "", "Alf", null, false, 1)
		// only mail address
		compare("", "", "Alf", "", "", null, false, -1)
		compare("", "", "Alf", "", "", "Bob", false, -1)
		compare("", "", null, "", "", "Bob", false, 1)
		compare("", "", "Bob", "", "", "Alf", false, 1)
		// first and last name
		compare("", "Alf", null, "Alf", "Bob", null, false, -1)
		compare("Alf", "Bob", null, "Bob", "Alf", null, false, 1)
		compare("Alf", "Bob", null, "", "Bob", null, false, -1)
		compare("Alf", "", null, "Alf", "Bob", null, false, 1)
		// mixed
		compare("", "Bob", null, "", "", "Alf", false, -1)
		compare("Bob", "", null, "", "", "Alf", false, -1)
		compare("Alf", "Bob", "Bob", "Alf", "Bob", "Alf", false, 1)
		compare("Alf", "Bob", null, "", "", "Alf", false, -1)
		// none or same
		compare("", "", null, "", "", null, false, 1) // reverse id

		compare("Alf", "Bob", "Bob", "Alf", "Bob", "Bob", false, 1) // reverse id

		compare("ma", "p", "aa", "Gump", "Forrest", "aa", false, 1) // reverse id
	})
	o("formatNewBirthdayTest", function () {
		lang.setLanguage({
			code: "en",
			languageTag: "en",
		})
		lang.updateFormats({})
		let bday = createTestEntity(BirthdayTypeRef)
		bday.day = "12"
		bday.month = "10"
		bday.year = "2009"
		o(formatBirthdayNumeric(bday)).equals("10/12/2009")
		bday.day = "9"
		bday.month = "07"
		bday.year = null
		o(formatBirthdayNumeric(bday)).equals("7/9")
		bday.day = "09"
		bday.month = "7"
		bday.year = null
		o(formatBirthdayNumeric(bday)).equals("7/9")
		bday = createTestEntity(BirthdayTypeRef)
		bday.day = "12"
		bday.month = "10"
		bday.year = "2009"
	})

	o("formatBirthdayNumeric", function () {
		const leapYearBirthday = createTestEntity(BirthdayTypeRef)
		leapYearBirthday.year = "2016"
		leapYearBirthday.month = "2"
		leapYearBirthday.day = "29"

		const leapYearBirthdayNoYear = createTestEntity(BirthdayTypeRef)
		leapYearBirthdayNoYear.month = "2"
		leapYearBirthdayNoYear.day = "29"

		// Chrome date bug issue: https://github.com/tutao/tutanota/issues/414
		const chromeBugBirthday = createTestEntity(BirthdayTypeRef)
		chromeBugBirthday.year = "1911"
		chromeBugBirthday.month = "8"
		chromeBugBirthday.day = "15"

		lang._setLanguageTag("en")
		o(formatBirthdayNumeric(leapYearBirthday)).equals("2/29/2016")
		o(formatBirthdayNumeric(leapYearBirthdayNoYear)).equals("2/29")
		o(formatBirthdayNumeric(chromeBugBirthday)).equals("8/15/1911")

		lang._setLanguageTag("de")
		o(formatBirthdayNumeric(leapYearBirthday)).equals("29.2.2016")
		o(formatBirthdayNumeric(chromeBugBirthday)).equals("15.8.1911")

		lang._setLanguageTag("ja")
		o(formatBirthdayNumeric(leapYearBirthday)).equals("2016/2/29")
		o(formatBirthdayNumeric(chromeBugBirthday)).equals("1911/8/15")

		lang._setLanguageTag("pt")
		o(formatBirthdayNumeric(leapYearBirthday)).equals("29/02/2016")
		o(formatBirthdayNumeric(chromeBugBirthday)).equals("15/08/1911")
	})

	o("extractStructuredEmailAddress", function () {
		const contact = createTestEntity(ContactTypeRef)

		contact.mailAddresses.push(createTestEntity(ContactMailAddressTypeRef))
		contact.mailAddresses.push(createTestEntity(ContactMailAddressTypeRef))

		o(extractStructuredMailAddresses(contact.mailAddresses)).deepEquals(
			contact.mailAddresses.map((address) => ({
				address: address.address,
				type: address.type as ContactAddressType,
				customTypeName: address.customTypeName,
			})),
		)
	})

	o("extractStructuredAddress", function () {
		const contact = createTestEntity(ContactTypeRef)

		contact.addresses.push(createTestEntity(ContactAddressTypeRef))
		contact.addresses.push(createTestEntity(ContactAddressTypeRef))

		o(extractStructuredAddresses(contact.addresses)).deepEquals(
			contact.addresses.map((address) => ({
				address: address.address,
				type: address.type as ContactAddressType,
				customTypeName: address.customTypeName,
			})),
		)
	})

	o("extractStructuredPhoneNumber", function () {
		const contact = createTestEntity(ContactTypeRef)

		contact.phoneNumbers.push(createTestEntity(ContactPhoneNumberTypeRef))
		contact.phoneNumbers.push(createTestEntity(ContactPhoneNumberTypeRef))

		o(extractStructuredPhoneNumbers(contact.phoneNumbers)).deepEquals(
			contact.phoneNumbers.map((phone) => ({
				number: phone.number,
				type: phone.type as ContactPhoneNumberType,
				customTypeName: phone.customTypeName,
			})),
		)
	})
})
