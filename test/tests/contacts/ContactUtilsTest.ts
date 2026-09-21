import o from "@tutao/otest"
import { lang } from "../../../src/ui/utils/LanguageViewModel.js"
import { createTestEntity } from "../TestUtils.js"
import {
	extractStructuredAddresses,
	extractStructuredMailAddresses,
	extractStructuredPhoneNumbers,
	formatContactDate,
} from "../../../src/applications/common/contactsFunctionality/ContactUtils.js"

import { ContactAddressType, ContactPhoneNumberType } from "../../../src/entities/tutanota/Utils"
import { ContactAddressTypeRef, ContactMailAddressTypeRef, ContactPhoneNumberTypeRef, ContactTypeRef } from "@tutao/entities/tutanota"
import { compareContacts } from "../../../src/applications/mail-app/contacts/ContactUtils"

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
		if (result !== expectedResult) {
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

	o("formatContactDate", function () {
		lang.setLanguage({
			code: "en",
			languageTag: "en",
		})
		lang.updateFormats({})

		o.check(formatContactDate("2009-10-12")).equals("10/12/2009")
		o.check(formatContactDate("2009-10-12")).equals("10/12/2009")
		o.check(formatContactDate("--07-09")).equals("7/9")
		o.check(formatContactDate("--07-09")).equals("7/9")

		// Chrome date bug issue: https://github.com/tutao/tutanota/issues/414
		lang._setLanguageTag("en")
		o.check(formatContactDate("--02-29")).equals("2/29")
		o.check(formatContactDate("2016-02-29")).equals("2/29/2016")
		o.check(formatContactDate("1911-08-15")).equals("8/15/1911")
		o.check(formatContactDate("0099-01-01")).equals("8/15/99")

		lang._setLanguageTag("de")
		o.check(formatContactDate("2016-02-29")).equals("29.2.2016")
		o.check(formatContactDate("--02-29")).equals("29.2.")
		o.check(formatContactDate("1911-08-15")).equals("15.8.1911")

		lang._setLanguageTag("ja")
		o.check(formatContactDate("2016-02-29")).equals("2016/2/29")
		o.check(formatContactDate("--02-29")).equals("2/29")
		o.check(formatContactDate("1911-08-15")).equals("1911/8/15")

		lang._setLanguageTag("pt")
		o.check(formatContactDate("2016-02-29")).equals("29/02/2016")
		o.check(formatContactDate("--02-29")).equals("29/02")
		o.check(formatContactDate("1911-08-15")).equals("15/08/1911")
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
