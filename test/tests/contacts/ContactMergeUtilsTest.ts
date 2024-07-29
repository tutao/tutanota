import o from "@tutao/otest"
import type { Contact } from "../../../src/common/api/entities/tutanota/TypeRefs.js"
import {
	BirthdayTypeRef,
	ContactAddressTypeRef,
	ContactMailAddressTypeRef,
	ContactPhoneNumberTypeRef,
	ContactSocialIdTypeRef,
	ContactTypeRef,
} from "../../../src/common/api/entities/tutanota/TypeRefs.js"
import {
	_areResidualContactFieldsEqual,
	_compareBirthdays,
	_compareContactsForMerge,
	_compareFullName,
	_compareMailAddresses,
	_comparePhoneNumbers,
	_getMergedAddresses,
	_getMergedEmailAddresses,
	_getMergedNameField,
	_getMergedOtherField,
	_getMergedPhoneNumbers,
	_getMergedSocialIds,
	getMergeableContacts,
	mergeContacts,
} from "../../../src/mail-app/contacts/ContactMergeUtils.js"
import {
	ContactAddressType,
	ContactComparisonResult,
	ContactPhoneNumberType,
	ContactSocialType,
	IndifferentContactComparisonResult,
} from "../../../src/common/api/common/TutanotaConstants.js"
import { createFilledContact } from "./VCardExporterTest.js"
import { downcast, neverNull } from "@tutao/tutanota-utils"
import { _contactToVCard } from "../../../src/mail-app/contacts/VCardExporter.js"
import { birthdayToIsoDate } from "../../../src/common/api/common/utils/BirthdayUtils.js"
import { createTestEntity } from "../TestUtils.js"

o.spec("ContactMergeUtilsTest", function () {
	// tests are made for the validation of the comparison functions to find mergable contacts
	// tests all ContactMergeUtils functions
	o("GetMergableContactsTest", function () {
		let c1 = createEmailPhoneContact("A", "B", ["a@b.de"])
		let c2 = createEmailPhoneContact("A", "B", ["a@b.de"])
		let c3 = createEmailPhoneContact("A", "B", ["c@b.de"])
		let c4 = createEmailPhoneContact("A", "B", ["c@b.de"])
		let c5 = createEmailPhoneContact("A", "B", ["d@b.de"])
		let c6 = createEmailPhoneContact("c", "c", ["ADC@b.de"])
		let c7 = createEmailPhoneContact("c", "c", ["BDC@b.de"])
		let c8 = createEmailPhoneContact("c", "c", ["CDC@b.de"])
		let c9 = createEmailPhoneContact("a", "", ["hello@hello.de"], ["123456"])
		let c10 = createEmailPhoneContact("a", "", ["hello@hello.de"], ["789456123"])
		c10 = addFilledContactOtherFields(c10, "", "", "Mr.", "")
		let c11 = createEmailPhoneContact("", "", ["hello@hello.de"], ["258258"])
		let c12 = createEmailPhoneContact("b", "b", ["tuta@hello.de"], ["654321"])
		let c13 = createEmailPhoneContact("b", "b", ["bnt@bnt.com"], ["147852369"])
		c13 = addFilledContactOtherFields(c13, "", "tuta", "Mr.Dr.", "")
		let c14 = createEmailPhoneContact("b", "b", [], ["1231231258258"])
		let c15 = createEmailPhoneContact("a", "", ["hello@hello.de"], ["123456", "789456123", "258258"])
		c15 = addFilledContactOtherFields(c15, "", "", "Mr.", "")
		let c16 = createEmailPhoneContact("b", "b", ["tuta@hello.de", "bnt@bnt.com"], ["654321", "147852369", "1231231258258"])
		c16 = addFilledContactOtherFields(c16, "", "tuta", "Mr.Dr.", "")
		o(JSON.stringify(getMergeableContacts([c1, c2, c3]))).equals(
			JSON.stringify({
				mergeable: [[c1, c3]],
				deletable: [c2],
			}),
		)
		o(JSON.stringify(getMergeableContacts([c1, c3, c2]))).equals(
			JSON.stringify({
				mergeable: [[c1, c3]],
				deletable: [c2],
			}),
		)
		o(JSON.stringify(getMergeableContacts([c3, c1, c2]))).equals(
			JSON.stringify({
				mergeable: [[c3, c1]],
				deletable: [c2],
			}),
		)
		o(JSON.stringify(getMergeableContacts([c3, c1, c2, c4]))).equals(
			JSON.stringify({
				mergeable: [[c3, c1]],
				deletable: [c2, c4],
			}),
		)
		o(JSON.stringify(getMergeableContacts([c1, c2, c3, c4, c5]))).equals(
			JSON.stringify({
				mergeable: [[c1, c3, c5]],
				deletable: [c2, c4],
			}),
		)
		o(JSON.stringify(getMergeableContacts([c1, c2, c3, c6, c7, c8]))).equals(
			JSON.stringify({
				mergeable: [
					[c1, c3],
					[c6, c7, c8],
				],
				deletable: [c2],
			}),
		)
		o(JSON.stringify(getMergeableContacts([c15, c16, c9, c10, c11, c12, c13, c14]))).equals(
			JSON.stringify({
				mergeable: [
					[c15, c9, c10, c11],
					[c16, c12, c13, c14],
				],
				deletable: [],
			}),
		)
		o(JSON.stringify(getMergeableContacts([c15, c9, c10, c11, c12, c13, c14, c16]))).equals(
			JSON.stringify({
				mergeable: [
					[c15, c9, c10, c11],
					[c12, c13, c14, c16],
				],
				deletable: [],
			}),
		)
		o(JSON.stringify(getMergeableContacts([c15, c16, c9, c10, c12, c13, c14, c11]))).equals(
			JSON.stringify({
				mergeable: [
					[c15, c9, c10, c11],
					[c16, c12, c13, c14],
				],
				deletable: [],
			}),
		)
		o(getMergeableContacts([c10, c9, c15, c13, c11, c16, c12, c14]).mergeable[0].length).equals(4)
		o(getMergeableContacts([c10, c9, c15, c13, c11, c16, c12, c14]).mergeable[1].length).equals(4) // o(getMergeableContacts([c10, c9, c15, c13, c11]).mergeable[0].length).equals(4)
		// console.log(getMergeableContacts([c10, c9, c15, c13, c11]).mergeable[0])
	})

	function createEmailPhoneContact(
		firstName: string,
		lastName: string,
		emailAddresses?: string[] | null | undefined,
		phoneNumbers?: string[] | null | undefined,
	): Contact {
		return createFilledContact(firstName, lastName, "", "", "", "", "", "", "", emailAddresses, phoneNumbers)
	}

	o("testCompareMailaddresses", function () {
		let c1 = createFilledContactMailAddresses([])
		let c2 = createFilledContactMailAddresses([])
		o(_compareMailAddresses(c1, c2)).equals(IndifferentContactComparisonResult.BothEmpty)
		c1 = createFilledContactMailAddresses(["anton@mail.de"])
		c2 = createFilledContactMailAddresses(["anton@mail.de"])
		o(_compareMailAddresses(c1, c2)).equals(ContactComparisonResult.Equal)
		c1 = createFilledContactMailAddresses([" anton@mail.de"])
		c2 = createFilledContactMailAddresses(["anton@mail.de"])
		o(_compareMailAddresses(c1, c2)).equals(ContactComparisonResult.Equal)
		o(_compareMailAddresses(c2, c1)).equals(ContactComparisonResult.Equal)
		c1 = createFilledContactMailAddresses(["TOM@mail.de"])
		c2 = createFilledContactMailAddresses(["anton@mail.de"])
		o(_compareMailAddresses(c1, c2)).equals(ContactComparisonResult.Unique)
		o(_compareMailAddresses(c2, c1)).equals(ContactComparisonResult.Unique)
		c1 = createFilledContactMailAddresses(["TOM@mail.de", "anton@mail.de"])
		c2 = createFilledContactMailAddresses(["anton@mail.de"])
		o(_compareMailAddresses(c1, c2)).equals(ContactComparisonResult.Similar)
		o(_compareMailAddresses(c2, c1)).equals(ContactComparisonResult.Similar)
		c1 = createFilledContactMailAddresses(["TOM@mail.de"])
		c2 = createFilledContactMailAddresses(["tom@mail.de"])
		o(_compareMailAddresses(c1, c2)).equals(ContactComparisonResult.Similar)
		o(_compareMailAddresses(c2, c1)).equals(ContactComparisonResult.Similar)
		c1 = createFilledContactMailAddresses(["tom@mail.de", "tom@mail.de"])
		c2 = createFilledContactMailAddresses(["tom@mail.de"])
		o(_compareMailAddresses(c1, c2)).equals(ContactComparisonResult.Similar)
		o(_compareMailAddresses(c2, c1)).equals(ContactComparisonResult.Similar)
		c1 = createFilledContactMailAddresses([])
		c2 = createFilledContactMailAddresses(["tom@mail.de"])
		o(_compareMailAddresses(c1, c2)).equals(IndifferentContactComparisonResult.OneEmpty)
		o(_compareMailAddresses(c2, c1)).equals(IndifferentContactComparisonResult.OneEmpty)
	})

	function createFilledContactMailAddresses(mailAddresses: string[]) {
		return mailAddresses.map((m) => {
			let a = createTestEntity(ContactMailAddressTypeRef)
			a.address = m
			a.type = ContactAddressType.WORK
			a.customTypeName = ""
			return a
		})
	}

	o("testCompareFullNames", function () {
		let c1 = createEmailPhoneContact("anton", "schmidt", null)
		let c2 = createEmailPhoneContact("bob", "schmidt", null)
		o(_compareFullName(c1, c2)).equals(ContactComparisonResult.Unique)
		o(_compareFullName(c2, c1)).equals(ContactComparisonResult.Unique)
		c1 = createEmailPhoneContact("anton", "schmidt", null)
		c2 = createEmailPhoneContact("", "schmidt", null)
		o(_compareFullName(c1, c2)).equals(ContactComparisonResult.Similar)
		o(_compareFullName(c2, c1)).equals(ContactComparisonResult.Similar)
		c1 = createEmailPhoneContact("", "schmidt", null)
		c2 = createEmailPhoneContact("", "schmidt", null)
		o(_compareFullName(c1, c2)).equals(ContactComparisonResult.Equal)
		c1 = createEmailPhoneContact("", "", null)
		c2 = createEmailPhoneContact("", "", null)
		o(_compareFullName(c1, c2)).equals(IndifferentContactComparisonResult.BothEmpty)
		c1 = createEmailPhoneContact("", "", null)
		c2 = createEmailPhoneContact("a", "b", null)
		o(_compareFullName(c1, c2)).equals(IndifferentContactComparisonResult.OneEmpty)
		o(_compareFullName(c2, c1)).equals(IndifferentContactComparisonResult.OneEmpty)
		c1 = createEmailPhoneContact("anton", "schmidt", null)
		c2 = createEmailPhoneContact("anton", "schmidt", null)
		o(_compareFullName(c1, c2)).equals(ContactComparisonResult.Equal)
		c1 = createEmailPhoneContact("Anton", "Schmidt", null)
		c2 = createEmailPhoneContact("anton", "schmidt", null)
		o(_compareFullName(c1, c2)).equals(ContactComparisonResult.Similar)
		o(_compareFullName(c2, c1)).equals(ContactComparisonResult.Similar)
		c1 = createEmailPhoneContact("anton", "schmidt", null)
		c2 = createEmailPhoneContact("Anton", "schmidt", null)
		o(_compareFullName(c1, c2)).equals(ContactComparisonResult.Similar)
		o(_compareFullName(c2, c1)).equals(ContactComparisonResult.Similar)
		c1 = createEmailPhoneContact("", "Schmidt", null)
		c2 = createEmailPhoneContact("", "schmidt", null)
		o(_compareFullName(c1, c2)).equals(ContactComparisonResult.Similar)
		o(_compareFullName(c2, c1)).equals(ContactComparisonResult.Similar)
		c1 = createEmailPhoneContact("anton", "", null)
		c2 = createEmailPhoneContact("anton", "", null)
		o(_compareFullName(c1, c2)).equals(ContactComparisonResult.Equal)
	})
	o("testComparePhonenumbers", function () {
		let c1 = createFilledContactPhoneNumbers([])
		let c2 = createFilledContactPhoneNumbers([])
		o(_comparePhoneNumbers(c1, c2)).equals(IndifferentContactComparisonResult.BothEmpty)
		c1 = createFilledContactPhoneNumbers(["017999854654"])
		c2 = createFilledContactPhoneNumbers(["017999854654"])
		o(_comparePhoneNumbers(c1, c2)).equals(ContactComparisonResult.Equal)
		c1 = createFilledContactPhoneNumbers(["017999854654"])
		c2 = createFilledContactPhoneNumbers(["099999999999"])
		o(_comparePhoneNumbers(c1, c2)).equals(ContactComparisonResult.Unique)
		o(_comparePhoneNumbers(c2, c1)).equals(ContactComparisonResult.Unique)
		c1 = createFilledContactPhoneNumbers(["017999854654"])
		c2 = createFilledContactPhoneNumbers(["099999999999", "017999854654"])
		o(_comparePhoneNumbers(c2, c1)).equals(ContactComparisonResult.Similar)
		o(_comparePhoneNumbers(c1, c2)).equals(ContactComparisonResult.Similar)
	})

	function createFilledContactPhoneNumbers(phoneNumbers: string[]) {
		return phoneNumbers.map((n) => {
			let a = createTestEntity(ContactPhoneNumberTypeRef)
			a.number = n
			a.type = ContactAddressType.WORK
			a.customTypeName = ""
			return a
		})
	}

	o("testCompareResidualContact", function () {
		let c1 = createFilledContactOtherFields("", "", "", "")
		let c2 = createFilledContactOtherFields("", "", "", "")
		o(_areResidualContactFieldsEqual(c1, c2)).equals(true)
		c1 = createFilledContactOtherFields("", "Tutao GmbH", "", "")
		c2 = createFilledContactOtherFields("", "Tutao GmbH", "", "")
		o(_areResidualContactFieldsEqual(c1, c2)).equals(true)
		c1 = createFilledContactOtherFields("Tutao GmbH", "", "", "")
		c2 = createFilledContactOtherFields("Hallo", "Tutao GmbH", "", "")
		o(_areResidualContactFieldsEqual(c1, c2)).equals(false)
		c1 = createFilledContactOtherFields("Tutao GmbH", "Tutao GmbH", "", "")
		c2 = createFilledContactOtherFields("Hallo", "Tutao GmbH", "", "")
		o(_areResidualContactFieldsEqual(c1, c2)).equals(false)
	})

	function createFilledContactOtherFields(comment: string, company: string, title: string, nickname: string) {
		return createFilledContact("", "", "", "", "", comment, company, title, nickname)
	}

	function addFilledContactOtherFields(
		c: Contact,
		comment: string,
		company: string,
		title: string,
		nickname: string,
		socialIds?: string[] | null | undefined,
		addresses?: string[] | null | undefined,
	) {
		c.title = title
		c.comment = comment
		c.company = company
		c.nickname = nickname

		if (addresses) {
			addresses.map((m) => {
				let a = createTestEntity(ContactAddressTypeRef)
				a.address = m
				a.type = ContactAddressType.WORK
				a.customTypeName = ""
				c.addresses.push(a)
			})
		}

		if (socialIds) {
			socialIds.map((m) => {
				let a = createTestEntity(ContactSocialIdTypeRef)
				a.socialId = m
				a.type = ContactSocialType.TWITTER
				a.customTypeName = ""
				c.socialIds.push(a)
			})
		}

		return c
	}

	o.spec("testCompareContactsForMerge", function () {
		o("contacts are equal 1", function () {
			const c1 = createEmailPhoneContact("anton", "schmidt", ["anton@mail.de"], ["123456"])
			const c2 = createEmailPhoneContact("anton", "schmidt", ["anton@mail.de"], ["123456"])
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Equal)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Equal)
		})
		o("empty contacts", function () {
			const c1 = createEmailPhoneContact("", "", [], [])
			const c2 = createEmailPhoneContact("", "", [], [])
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Equal)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Equal)
		})
		o("contacts are equal - phone numer matches", function () {
			const c1 = createEmailPhoneContact("", "", [], ["123456"])
			const c2 = createEmailPhoneContact("", "", [], ["123456"])
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Equal)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Equal)
		})
		o("contacts are equal - mail address matches", function () {
			const c1 = createEmailPhoneContact("", "", ["a@b.de"], [])
			const c2 = createEmailPhoneContact("", "", ["a@b.de"], [])
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Equal)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Equal)
		})
		o("contacts are equal 2", function () {
			const c1 = createEmailPhoneContact("anton", "schmidt", [], [])
			const c2 = createEmailPhoneContact("anton", "schmidt", [], [])
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Equal)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Equal)
		})
		o("contacts are similar - additional email addresses", function () {
			const c1 = createEmailPhoneContact("anton", "schmidt", ["anton@mail.de", "tuta@io.de"], ["123456"])
			const c2 = createEmailPhoneContact("anton", "schmidt", ["anton@mail.de"], ["123456"])
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)
		})
		o("contacts are similar - case insensitive email addresses", function () {
			const c1 = createEmailPhoneContact("anton", "schmidt", ["anton@mail.de", "tuta@io.de"], ["123456"])
			const c2 = createEmailPhoneContact("anton", "schmidt", ["anton@mail.de", "TUTA@io.de"], ["123456"])
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)
		})
		o("contacts are similar - name different", function () {
			const c1 = createEmailPhoneContact("anton", "schmidt", [], [])
			const c2 = createEmailPhoneContact("", "schmidt", [], [])
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)
		})
		o("contacts are similar - different email addresses", function () {
			const c1 = createEmailPhoneContact("anton", "schmidt", ["anton@mail.de", "tuta@io.de"], [])
			const c2 = createEmailPhoneContact("anton", "schmidt", ["b@mail.de", "c@io.de"], [])
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)
		})
		o("contacts are similar - different phone numbers ", function () {
			const c1 = createEmailPhoneContact("anton", "schmidt", [], ["123456"])
			const c2 = createEmailPhoneContact("anton", "schmidt", [], ["1234567890"])
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)
		})
		o("contacts are similar - last name matches 1", function () {
			const c1 = createEmailPhoneContact("", "schmidt", ["anton@mail.de", "tuta@io.de"], ["123456"])
			const c2 = createEmailPhoneContact("anton", "schmidt", [""], ["123456"])
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)
		})
		o("contacts are similar - last name matches 2", function () {
			const c1 = createEmailPhoneContact("", "schmidt", ["anton@mail.de", "tuta@io.de"], ["123456"])
			const c2 = createEmailPhoneContact("", "schmidt", [""], [""])
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)
		})
		o("contacts are similar - case insensitive name check", function () {
			const c1 = createEmailPhoneContact("Anton", "Schmidt", ["anton@mail.de", "tuta@io.de"], ["123456"])
			const c2 = createEmailPhoneContact("anton", "schmidt", [""], ["123"])
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)
		})
		o("contacts are similar - mail addess matches, name is empty", function () {
			const c1 = createEmailPhoneContact("", "", ["a@b.de"], [])
			const c2 = createEmailPhoneContact("a", "tom", ["a@b.de"], [])
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)
		})
		o("contacts are similar - phone number matches, name and email empty", function () {
			const c1 = createEmailPhoneContact("", "", [], ["123456"])
			const c2 = createEmailPhoneContact("a", "tom", [], ["123456"])
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)
		})
		o("contacts are unique - firstname matches", function () {
			const c1 = createEmailPhoneContact("anton", "Bob", ["anton@mail.de", "tuta@io.de"], ["123456"])
			const c2 = createEmailPhoneContact("anton", "schmidt", ["b@mail.de", "c@io.de"], ["1234567890"])
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Unique)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Unique)
		})
		o("contacts are unique - last name matches, first name is different but no email addresses", function () {
			const c1 = createEmailPhoneContact("bob", "schmidt", [], ["123456"])
			const c2 = createEmailPhoneContact("anton", "schmidt", [], ["123456"])
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Unique)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Unique)
		})
		o("contacts are unique - mail address matches but last name is different", function () {
			const c1 = createEmailPhoneContact("Anton", "Schmidt", ["anton@mail.de", "tuta@io.de"], ["123456"])
			const c2 = createEmailPhoneContact("anton", "tom", ["anton@mail.de"], ["1234567"])
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Unique)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Unique)
		})
		o("contacts are unique - one contact is empty", function () {
			const c1 = createEmailPhoneContact("", "", [], [])
			const c2 = createEmailPhoneContact("a", "tom", [], [])
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Unique)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Unique)
		})
		//________________________________Birthday test cases for merge________________________________________<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
		o("contacts are equal - all is equal", function () {
			const c1 = createFilledContact("ant", "bent", "hello", "tuta", "Mr.", "Bob", "", "", "", [], [], [], [], [], "1991-12-8")
			const c2 = createFilledContact("ant", "bent", "hello", "tuta", "Mr.", "Bob", "", "", "", [], [], [], [], [], "1991-12-8")
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Equal)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Equal)
		})
		o("contacts are equal - all is equal birthday without year", function () {
			const c1 = createFilledContact("ant", "bent", "hello", "tuta", "Mr.", "Bob", "", "", "", [], [], [], [], [], "--12-8")
			const c2 = createFilledContact("ant", "bent", "hello", "tuta", "Mr.", "Bob", "", "", "", [], [], [], [], [], "--12-8")
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Equal)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Equal)
		})
		o("contacts are similar - birthday with and without year", function () {
			const c1 = createFilledContact("ant", "bent", "hello", "tuta", "Mr.", "Bob", "", "", "", ["ant@ant.de"], [], [], [], [], "--08-12")
			const c2 = createFilledContact("ant", "bent", "hello", "tuta", "Mr.", "Bob", "", "", "", ["ant@ant.de"], [], [], [], [], "1991-08-12")
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)
		})
		o("contacts are similar - on birthday without year", function () {
			const c1 = createFilledContact("ant", "bent", "hello", "tuta", "Mr.", "Bob", "", "", "", [], [], [], [], [], "--08-12")
			const c2 = createFilledContact("ant", "bent", "hello", "tuta", "Mr.", "Bob", "", "", "", [], [], [], [], [], null)
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)
		})
		o("contacts are similar - one birthday with year", function () {
			const c1 = createFilledContact("ant", "bent", "hello", "tuta", "Mr.", "Bob", "", "", "", [], [], [], [], [], null)
			const c2 = createFilledContact("ant", "bent", "hello", "tuta", "Mr.", "Bob", "", "", "", [], [], [], [], [], "--08-12")
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)
		})
		o("contacts are unique - different birthdays", function () {
			const c1 = createFilledContact("ant", "bent", "hello", "tuta", "Mr.", "Bob", "", "", "", [], [], [], [], [], "1992-08-12")
			const c2 = createFilledContact("ant", "bent", "hello", "tuta", "Mr.", "Bob", "", "", "", [], [], [], [], [], "1991-09-13")
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Unique)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Unique)
		})
		//_________________More test cases for full contact simulation here --added other contact fields ___________________
		o("contacts are equal - other contact fields", function () {
			let c1 = createEmailPhoneContact("anton", "schmidt", [], [])
			let c2 = createEmailPhoneContact("anton", "schmidt", [], [])
			c1 = addFilledContactOtherFields(c1, "A", "B", "C", "D", ["E"], ["F"])
			c2 = addFilledContactOtherFields(c2, "A", "B", "C", "D", ["E"], ["F"])
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Equal)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Equal)
		})
		o("contacts are similar 1", function () {
			let c1 = createEmailPhoneContact("anton", "schmidt", [], [])
			let c2 = createEmailPhoneContact("anton", "schmidt", [], [])
			c1 = addFilledContactOtherFields(c1, "", "", "", "A", [], [])
			c2 = addFilledContactOtherFields(c2, "", "", "b", "", [], [])
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)
		})
		o("contacts are similar 2", function () {
			let c1 = createEmailPhoneContact("anton", "schmidt", ["anton@mail.de", "tuta@io.de"], ["123456"])
			let c2 = createEmailPhoneContact("", "schmidt", ["anton@mail.de", "TUTA@io.de"], ["123456"])
			c1 = addFilledContactOtherFields(c1, "A", "A", "b", "A", [], [])
			c2 = addFilledContactOtherFields(c2, "A", "A", "b", "A", [], [])
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)
		})
		o("contacts are similar 3", function () {
			let c1 = createEmailPhoneContact("anton", "schmidt", ["anton@mail.de", "tuta@io.de"], ["123456"])
			let c2 = createEmailPhoneContact("anton", "schmidt", ["b@mail.de", "c@io.de"], ["123456"])
			c1 = addFilledContactOtherFields(c1, "", "", "", "A", ["Facebook sucks in privacy", "Google also does"], ["Address 123", "Berlin 1234", "Hannover"])
			c2 = addFilledContactOtherFields(c2, "", "", "b", "", [], ["Hannover"])
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)
		})
		o("contacts are similar 4", function () {
			let c1 = createEmailPhoneContact("anton", "schmidt", ["anton@mail.de", "tuta@io.de"], ["123456"])
			let c2 = createEmailPhoneContact("anton", "schmidt", ["b@mail.de", "c@io.de"], ["1234567890"])
			c1 = addFilledContactOtherFields(c1, "A", "A", "A", "A", ["A", "B", "C"], ["A", "B", "C"])
			c2 = addFilledContactOtherFields(c2, "A", "A", "A", "A", ["A", "B", "C"], ["A", "B", "C"])
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)
		})
		o("contacts are similar 5", function () {
			let c1 = createEmailPhoneContact("anton", "Bob", ["anton@mail.de", "tuta@io.de"], ["123456"])
			let c2 = createEmailPhoneContact("anton", "schmidt", ["b@mail.de", "c@io.de"], ["1234567890"])
			c1 = addFilledContactOtherFields(c1, "A", "A", "A", "A", ["A", "B", "C"], ["A", "B", "C"])
			c2 = addFilledContactOtherFields(c2, "A", "A", "A", "A", ["A", "B", "C"], ["A", "B", "C"])
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Unique)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Unique)
		})
		o("contacts are similar 6", function () {
			let c1 = createEmailPhoneContact("bob", "schmidt", [""], ["123456"])
			let c2 = createEmailPhoneContact("anton", "schmidt", [""], ["123456"])
			c1 = addFilledContactOtherFields(c1, "A", "A", "A", "A", ["A", "B", "C"], ["A", "B", "C"])
			c2 = addFilledContactOtherFields(c2, "", "", "", "", ["", "", ""], ["", "", ""])
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Unique)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Unique)
		})
		o("contacts are similar 7", function () {
			let c1 = createEmailPhoneContact("", "schmidt", ["anton@mail.de", "tuta@io.de"], ["123456"])
			let c2 = createEmailPhoneContact("anton", "schmidt", [""], ["123456"])
			c1 = addFilledContactOtherFields(c1, "A", "A", "A", "A", ["A", "B", "C"], ["A", "B", "C"])
			c2 = addFilledContactOtherFields(c2, "b", "c", "d", "e", ["f", "g", "h"], ["q", "w", "j"])
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)
		})
		o("contacts are similar 8", function () {
			let c1 = createEmailPhoneContact("", "schmidt", ["anton@mail.de", "tuta@io.de"], ["123456"])
			let c2 = createEmailPhoneContact("", "schmidt", [""], [""])
			c1 = addFilledContactOtherFields(c1, "", "", "", "", ["A", "B", "C"], ["A", "B", "C"])
			c2 = addFilledContactOtherFields(c2, "", "", "", "", [], [])
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)
		})
		o("contacts are similar 9", function () {
			let c1 = createEmailPhoneContact("Anton", "Schmidt", ["anton@mail.de", "tuta@io.de"], ["123456"])
			let c2 = createEmailPhoneContact("anton", "schmidt", [""], ["123"])
			c1 = addFilledContactOtherFields(c1, "A", "A", "A", "A", ["A"], ["A"])
			c2 = addFilledContactOtherFields(c2, "A", "A", "A", "A", ["A"], ["A"])
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)
		})
		o("contacts are similar 10", function () {
			let c1 = createEmailPhoneContact("Anton", "Schmidt", ["anton@mail.de", "tuta@io.de"], ["123456"])
			let c2 = createEmailPhoneContact("anton", "tom", [""], ["123456"])
			c1 = addFilledContactOtherFields(c1, "A", "A", "A", "A", ["A"], ["A"])
			c2 = addFilledContactOtherFields(c2, "A", "A", "A", "A", ["A"], ["A"])
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Unique)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Unique)
		})
		o("contacts are similar 11", function () {
			let c1 = createEmailPhoneContact("Anton", "Schmidt", ["anton@mail.de", "tuta@io.de"], ["123456"])
			let c2 = createEmailPhoneContact("anton", "tom", [""], ["123456"])
			c1 = addFilledContactOtherFields(c1, "A", "A", "A", "A", ["A"], ["A"])
			c2 = addFilledContactOtherFields(c2, "A", "A", "A", "A", ["A"], ["B"])
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Unique)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Unique)
		})
		o("contacts are similar 12", function () {
			let c1 = createEmailPhoneContact("Anton", "Schmidt", ["anton@mail.de", "tuta@io.de"], ["123456"])
			let c2 = createEmailPhoneContact("anton", "tom", ["anton@mail.de"], ["1234567"])
			c1 = addFilledContactOtherFields(c1, "", "", "", "", [], [])
			c2 = addFilledContactOtherFields(c2, "", "", "", "", [], [])
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Unique)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Unique)
		})
		o("contacts are similar 13", function () {
			let c1 = createEmailPhoneContact("", "", [], [])
			let c2 = createEmailPhoneContact("a", "tom", [], [])
			c1 = addFilledContactOtherFields(c1, "", "", "", "", [], [])
			c2 = addFilledContactOtherFields(c2, "", "", "", "", [], [])
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Unique)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Unique)
		})
		o("contacts are similar 14", function () {
			let c1 = createEmailPhoneContact("", "", ["a@b.de"], [])
			let c2 = createEmailPhoneContact("a", "tom", ["a@b.de"], [])
			c1 = addFilledContactOtherFields(c1, "A", "", "", "", [], [])
			c2 = addFilledContactOtherFields(c2, "A", "B", "", "", [], [])
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)
		})
		o("contacts are similar 15", function () {
			let c1 = createEmailPhoneContact("", "", [], ["123456"])
			let c2 = createEmailPhoneContact("a", "tom", [], ["123456"])
			c1 = addFilledContactOtherFields(c1, "", "", "", "", ["Diaspora my be better than Facebook"], ["Hannover"])
			c2 = addFilledContactOtherFields(c2, "", "", "", "", [], ["Hannover"])
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)
		})
		o("contacts are similar 16", function () {
			let c1 = createEmailPhoneContact("", "", [], ["123456"])
			let c2 = createEmailPhoneContact("", "", [], ["123456"])
			c1 = addFilledContactOtherFields(c1, "A", "", "", "", [], [])
			c2 = addFilledContactOtherFields(c2, "A", "B", "", "", [], [])
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)
		})
		o("contacts are similar 17", function () {
			let c1 = createEmailPhoneContact("", "", ["a@b.de"], [])
			let c2 = createEmailPhoneContact("", "", ["a@b.de"], [])
			c1 = addFilledContactOtherFields(c1, "A", "", "", "", [], [])
			c2 = addFilledContactOtherFields(c2, "A", "B", "", "", [], [])
			o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
			o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)
		})
	})
	o("testCompareContactsWithPresharedPasswordForMerge", function () {
		let allContacts: Contact[] = []
		allContacts[0] = createTestEntity(ContactTypeRef)
		allContacts[1] = createTestEntity(ContactTypeRef)
		allContacts[0].mailAddresses[0] = createTestEntity(ContactMailAddressTypeRef)
		allContacts[1].mailAddresses[0] = createTestEntity(ContactMailAddressTypeRef)
		allContacts[0].phoneNumbers[0] = createTestEntity(ContactPhoneNumberTypeRef)
		allContacts[1].phoneNumbers[0] = createTestEntity(ContactPhoneNumberTypeRef)
		allContacts[0].phoneNumbers[0].number = "017999854654"
		allContacts[1].phoneNumbers[0].number = "017999854654"
		allContacts[0].mailAddresses[0].address = "anton@mail.de"
		allContacts[1].mailAddresses[0].address = "anton@mail.de"
		allContacts[0].comment = "A"
		allContacts[1].comment = "A"
		o(_compareContactsForMerge(allContacts[0], allContacts[1])).equals(ContactComparisonResult.Equal)
		allContacts[1].presharedPassword = "B"
		o(_compareContactsForMerge(allContacts[0], allContacts[1])).equals(ContactComparisonResult.Similar)
		allContacts[0].presharedPassword = "A"
		allContacts[1].presharedPassword = null
		o(_compareContactsForMerge(allContacts[0], allContacts[1])).equals(ContactComparisonResult.Similar)
		allContacts[1].presharedPassword = "B"
		o(_compareContactsForMerge(allContacts[0], allContacts[1])).equals(ContactComparisonResult.Unique)
		allContacts[0] = createTestEntity(ContactTypeRef)
		allContacts[1] = createTestEntity(ContactTypeRef)
		allContacts[1].presharedPassword = "B"
		o(_compareContactsForMerge(allContacts[0], allContacts[1])).equals(ContactComparisonResult.Unique)
		allContacts[0].presharedPassword = "B"
		o(_compareContactsForMerge(allContacts[0], allContacts[1])).equals(ContactComparisonResult.Equal)
	})
	//typeRef should not affect the result of the comparison the value is most important
	o("testContactTypeValuesForUnimportance", function () {
		let allContacts: Contact[] = []
		allContacts[0] = createTestEntity(ContactTypeRef)
		allContacts[1] = createTestEntity(ContactTypeRef)
		allContacts[0].mailAddresses[0] = createTestEntity(ContactMailAddressTypeRef)
		allContacts[1].mailAddresses[0] = createTestEntity(ContactMailAddressTypeRef)
		allContacts[0].phoneNumbers[0] = createTestEntity(ContactPhoneNumberTypeRef)
		allContacts[1].phoneNumbers[0] = createTestEntity(ContactPhoneNumberTypeRef)
		allContacts[0].phoneNumbers[0].number = "017999854654"
		allContacts[1].phoneNumbers[0].number = "017999854654"
		allContacts[0].mailAddresses[0].address = "anton@mail.de"
		allContacts[1].mailAddresses[0].address = "anton@mail.de"
		o(_compareContactsForMerge(allContacts[0], allContacts[1])).equals(ContactComparisonResult.Equal)
		allContacts[0].mailAddresses[0].type = "0"
		allContacts[1].mailAddresses[0].type = "1"
		allContacts[0].phoneNumbers[0].type = "1"
		allContacts[1].phoneNumbers[0].type = "0"
		o(_compareContactsForMerge(allContacts[0], allContacts[1])).equals(ContactComparisonResult.Equal)
		allContacts[0].mailAddresses[0].type = "1"
		allContacts[1].mailAddresses[0].type = "1"
		o(_compareContactsForMerge(allContacts[0], allContacts[1])).equals(ContactComparisonResult.Equal)
		allContacts[1].mailAddresses[0].customTypeName = "FUN"
		o(_compareContactsForMerge(allContacts[0], allContacts[1])).equals(ContactComparisonResult.Equal)
		allContacts[0].phoneNumbers[0].type = "1"
		allContacts[1].phoneNumbers[0].type = "1"
		o(_compareContactsForMerge(allContacts[0], allContacts[1])).equals(ContactComparisonResult.Equal)
	})
	o("getMergedBirthdaysTest", function () {
		_testMerge(_createBirthdayContact("2000-01-01"), _createBirthdayContact("2000-01-02"), _createBirthdayContact("2000-01-01"))

		_testMerge(_createBirthdayContact(null), _createBirthdayContact("2000-01-02"), _createBirthdayContact("2000-01-02"))

		_testMerge(_createBirthdayContact("2000-01-01"), _createBirthdayContact(null), _createBirthdayContact("2000-01-01"))

		_testMerge(_createBirthdayContact(null), _createBirthdayContact("--01-02"), _createBirthdayContact("--01-02"))

		_testMerge(_createBirthdayContact("2000-01-01"), _createBirthdayContact("--01-02"), _createBirthdayContact("2000-01-01")) // more specific bday

		_testMerge(_createBirthdayContact("--01-01"), _createBirthdayContact("2000-01-02"), _createBirthdayContact("2000-01-02")) // more specific bday
	})

	function _createBirthdayContact(birthdayIso: string | null | undefined): Contact {
		return createFilledContact("A", "B", "", "", "", "", "", "", "", null, null, null, null, [], birthdayIso)
	}

	function _testMerge(c1: Contact, c2: Contact, merged: Contact) {
		mergeContacts(c1, c2)
		delete downcast(c1)._id
		delete downcast(merged)._id
		o(c1).deepEquals(merged)
	}

	o("getMergedNameFieldTest", function () {
		let c1 = createTestEntity(ContactTypeRef)
		let c2 = createTestEntity(ContactTypeRef)
		c1.firstName = _getMergedNameField(c1.firstName, c2.firstName)
		o(c1.firstName).equals(c1.firstName)
		c1.firstName = "bob"
		c1.firstName = _getMergedNameField(c1.firstName, c2.firstName)
		o(c1.firstName).equals("bob")
		c1.lastName = "mob"
		c1.lastName = _getMergedNameField(c1.lastName, c2.lastName)
		o(c1.lastName).equals("mob")
		c2.firstName = "flop"
		c1.firstName = _getMergedNameField(c1.firstName, c2.firstName)
		o(c1.firstName).equals("bob")
		c2.lastName = "Top"
		c1.lastName = _getMergedNameField(c1.lastName, c2.lastName)
		o(c1.lastName).equals("mob")
		c1.firstName = ""
		c1.firstName = _getMergedNameField(c1.firstName, c2.firstName)
		o(c1.firstName).equals("flop")
		c1.lastName = "qop"
		c1.lastName = _getMergedNameField(c1.lastName, c2.lastName)
		o(c1.lastName).equals("qop")
	})
	o("getMergedOtherFieldTitleTest", function () {
		let c1 = createTestEntity(ContactTypeRef)
		let c2 = createTestEntity(ContactTypeRef)
		c1.title = _getMergedOtherField(c1.title, c2.title, ", ")
		o(c1.title).equals(null)
		c1.title = "bob"
		c1.title = _getMergedOtherField(c1.title, c2.title, ", ")
		o(c1.title).equals("bob")
		c2.title = "flop"
		c1.title = _getMergedOtherField(c1.title, c2.title, ", ")
		o(c1.title).equals("bob, flop")
		c1.title = ""
		c1.title = _getMergedOtherField(c1.title, c2.title, ", ")
		o(c1.title).equals("flop")
	})
	o("getMergedOtherFieldCommentTest", function () {
		let c1 = createTestEntity(ContactTypeRef)
		let c2 = createTestEntity(ContactTypeRef)
		c1.comment = neverNull(_getMergedOtherField(c1.comment, c2.comment, "\n\n"))
		o(c1.comment).equals("")
		c1.comment = "bob"
		c1.comment = neverNull(_getMergedOtherField(c1.comment, c2.comment, "\n\n"))
		o(c1.comment).equals("bob")
		c2.comment = "flop"
		c1.comment = neverNull(_getMergedOtherField(c1.comment, c2.comment, "\n\n"))
		o(c1.comment).equals("bob\n\nflop")
		c1.comment = ""
		c1.comment = neverNull(_getMergedOtherField(c1.comment, c2.comment, "\n\n"))
		o(c1.comment).equals("flop")
	})
	o("getMergedOtherFieldCompanyTest", function () {
		let c1 = createTestEntity(ContactTypeRef)
		let c2 = createTestEntity(ContactTypeRef)
		c1.company = neverNull(_getMergedOtherField(c1.company, c2.company, ", "))
		o(c1.company).equals("")
		c1.company = "bob"
		c1.company = neverNull(_getMergedOtherField(c1.company, c2.company, ", "))
		o(c1.company).equals("bob")
		c2.company = "flop"
		c1.company = neverNull(_getMergedOtherField(c1.company, c2.company, ", "))
		o(c1.company).equals("bob, flop")
		c1.company = ""
		c1.company = neverNull(_getMergedOtherField(c1.company, c2.company, ", "))
		o(c1.company).equals("flop")
	})
	o("getMergedOtherFieldNicknameTest", function () {
		let c1 = createTestEntity(ContactTypeRef)
		let c2 = createTestEntity(ContactTypeRef)
		c1.nickname = _getMergedOtherField(c1.nickname, c2.nickname, ", ")
		o(c1.nickname).equals(null)
		c1.nickname = "bob"
		c1.nickname = neverNull(_getMergedOtherField(c1.nickname, c2.nickname, ", "))
		o(c1.nickname).equals("bob")
		c2.nickname = "flop"
		c1.nickname = neverNull(_getMergedOtherField(c1.nickname, c2.nickname, ", "))
		o(c1.nickname).equals("bob, flop")
		c1.nickname = ""
		c1.nickname = neverNull(_getMergedOtherField(c1.nickname, c2.nickname, ", "))
		o(c1.nickname).equals("flop")
	})
	o("getMergedOtherFieldRoleTest", function () {
		let c1 = createTestEntity(ContactTypeRef)
		let c2 = createTestEntity(ContactTypeRef)
		c1.role = neverNull(_getMergedOtherField(c1.role, c2.role, ", "))
		o(c1.role).equals("")
		c1.role = "bob"
		c1.role = neverNull(_getMergedOtherField(c1.role, c2.role, ", "))
		o(c1.role).equals("bob")
		c2.role = "flop"
		c1.role = neverNull(_getMergedOtherField(c1.role, c2.role, ", "))
		o(c1.role).equals("bob, flop")
		c1.role = ""
		c1.role = neverNull(_getMergedOtherField(c1.role, c2.role, ", "))
		o(c1.role).equals("flop")
	})
	o("getMergedOtherFieldPresharedPasswordTest", function () {
		let c1 = createTestEntity(ContactTypeRef)
		let c2 = createTestEntity(ContactTypeRef)
		c1.presharedPassword = _getMergedOtherField(c1.presharedPassword, c2.presharedPassword, "")
		o(c1.presharedPassword).equals(null)
		c1.presharedPassword = "bob"
		c1.presharedPassword = neverNull(_getMergedOtherField(c1.presharedPassword, c2.presharedPassword, ""))
		o(c1.presharedPassword).equals("bob")
		//this case should never happen only possible through manual merge -> restricted in function call of mergeSelected()
		//todo test in mergeContacts function
		c2.presharedPassword = "flop"
		c1.presharedPassword = neverNull(_getMergedOtherField(c1.presharedPassword, c2.presharedPassword, ""))
		o(c1.presharedPassword).equals("bobflop")
		c1.presharedPassword = ""
		c1.presharedPassword = neverNull(_getMergedOtherField(c1.presharedPassword, c2.presharedPassword, ""))
		o(c1.presharedPassword).equals("flop")
	})
	o("getMergedEmailAddressesTest", function () {
		let keptContact = createFilledContact("", "", "", "", "", "", "", "", "", ["antste@antste.de", "bentste@bentste.de"], [], [], [])
		let eliminatedContact = createFilledContact("", "", "", "", "", "", "", "", "", ["antste@antste.de", "bentste@bentste.de"], [], [], [])
		keptContact.mailAddresses = _getMergedEmailAddresses(keptContact.mailAddresses, eliminatedContact.mailAddresses)
		o(keptContact.mailAddresses[0].address).equals("antste@antste.de")
		//type is also merged
		o(keptContact.mailAddresses[0].type).equals(ContactAddressType.WORK)
		o(keptContact.mailAddresses[1].address).equals("bentste@bentste.de")
		o(keptContact.mailAddresses[1].type).equals(ContactAddressType.WORK)
		o(keptContact.mailAddresses.length).equals(2)
		keptContact = createFilledContact("", "", "", "", "", "", "", "", "", ["antste@antste.de"], [], [], [])
		keptContact.mailAddresses[0].type = ContactAddressType.OTHER
		eliminatedContact = createFilledContact("", "", "", "", "", "", "", "", "", ["antste@antste.de", "bentste@bentste.de"], [], [], [])
		eliminatedContact.mailAddresses[0].type = ContactAddressType.WORK
		eliminatedContact.mailAddresses[1].type = ContactAddressType.OTHER
		keptContact.mailAddresses = _getMergedEmailAddresses(keptContact.mailAddresses, eliminatedContact.mailAddresses)
		o(keptContact.mailAddresses[0].address).equals("antste@antste.de")
		o(keptContact.mailAddresses[0].type).equals(ContactAddressType.OTHER)
		o(keptContact.mailAddresses[1].address).equals("bentste@bentste.de")
		o(keptContact.mailAddresses[1].type).equals(ContactAddressType.OTHER)
		o(keptContact.mailAddresses.length).equals(2)
		keptContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], [], [])
		eliminatedContact = createFilledContact("", "", "", "", "", "", "", "", "", ["antste@antste.de", "bentste@bentste.de"], [], [], [])
		keptContact.mailAddresses = _getMergedEmailAddresses(keptContact.mailAddresses, eliminatedContact.mailAddresses)
		o(keptContact.mailAddresses[0].address).equals("antste@antste.de")
		o(keptContact.mailAddresses[0].type).equals(ContactAddressType.WORK)
		o(keptContact.mailAddresses[1].address).equals("bentste@bentste.de")
		o(keptContact.mailAddresses[0].type).equals(ContactAddressType.WORK)
		o(keptContact.mailAddresses.length).equals(2)
		keptContact = createFilledContact("", "", "", "", "", "", "", "", "", ["antste@antste.de", "bentste@bentste.de"], [], [], [])
		eliminatedContact = createFilledContact("", "", "", "", "", "", "", "", "", ["bentste@bentste.de"], [], [], [])
		keptContact.mailAddresses = _getMergedEmailAddresses(keptContact.mailAddresses, eliminatedContact.mailAddresses)
		o(keptContact.mailAddresses[0].address).equals("antste@antste.de")
		o(keptContact.mailAddresses[1].address).equals("bentste@bentste.de")
		o(keptContact.mailAddresses.length).equals(2)
		keptContact = createFilledContact("", "", "", "", "", "", "", "", "", ["antste@antste.de", "bentste@bentste.de"], [], [], [])
		eliminatedContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], [], [])
		keptContact.mailAddresses = _getMergedEmailAddresses(keptContact.mailAddresses, eliminatedContact.mailAddresses)
		o(keptContact.mailAddresses[0].address).equals("antste@antste.de")
		o(keptContact.mailAddresses[1].address).equals("bentste@bentste.de")
		o(keptContact.mailAddresses.length).equals(2)
		keptContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], [], [])
		eliminatedContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], [], [])
		keptContact.mailAddresses = _getMergedEmailAddresses(keptContact.mailAddresses, eliminatedContact.mailAddresses)
		o(keptContact.mailAddresses.length).equals(0)
		keptContact = createFilledContact("", "", "", "", "", "", "", "", "", ["antste@antste.de", "bentste@bentste.de", "bent@bent.de"], [], [], [])
		eliminatedContact = createFilledContact("", "", "", "", "", "", "", "", "", ["antste@antste.de", "bentste@bentste.de"], [], [], [])
		keptContact.mailAddresses = _getMergedEmailAddresses(keptContact.mailAddresses, eliminatedContact.mailAddresses)
		o(keptContact.mailAddresses[0].address).equals("antste@antste.de")
		o(keptContact.mailAddresses[1].address).equals("bentste@bentste.de")
		o(keptContact.mailAddresses[2].address).equals("bent@bent.de")
		o(keptContact.mailAddresses.length).equals(3)
	})
	o("getMergedPhoneNumbersTest", function () {
		let keptContact = createFilledContact("", "", "", "", "", "", "", "", "", [], ["789654123", "963258741"], [], [])
		let eliminatedContact = createFilledContact("", "", "", "", "", "", "", "", "", [], ["789654123", "963258741"], [], [])
		keptContact.phoneNumbers = _getMergedPhoneNumbers(keptContact.phoneNumbers, eliminatedContact.phoneNumbers)
		o(keptContact.phoneNumbers[0].number).equals("789654123")
		//type is also merged
		o(keptContact.phoneNumbers[0].type).equals(ContactPhoneNumberType.WORK)
		o(keptContact.phoneNumbers[1].number).equals("963258741")
		o(keptContact.phoneNumbers[1].type).equals(ContactPhoneNumberType.WORK)
		o(keptContact.phoneNumbers.length).equals(2)
		keptContact = createFilledContact("", "", "", "", "", "", "", "", "", [], ["789654123"], [], [])
		keptContact.phoneNumbers[0].type = ContactPhoneNumberType.OTHER
		eliminatedContact = createFilledContact("", "", "", "", "", "", "", "", "", [], ["789654123", "963258741"], [], [])
		eliminatedContact.phoneNumbers[0].type = ContactPhoneNumberType.WORK
		eliminatedContact.phoneNumbers[1].type = ContactPhoneNumberType.OTHER
		keptContact.phoneNumbers = _getMergedPhoneNumbers(keptContact.phoneNumbers, eliminatedContact.phoneNumbers)
		o(keptContact.phoneNumbers[0].number).equals("789654123")
		o(keptContact.phoneNumbers[0].type).equals(ContactPhoneNumberType.OTHER)
		o(keptContact.phoneNumbers[1].number).equals("963258741")
		o(keptContact.phoneNumbers[1].type).equals(ContactPhoneNumberType.OTHER)
		o(keptContact.phoneNumbers.length).equals(2)
		keptContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], [], [])
		eliminatedContact = createFilledContact("", "", "", "", "", "", "", "", "", [], ["789654123", "963258741"], [], [])
		keptContact.phoneNumbers = _getMergedPhoneNumbers(keptContact.phoneNumbers, eliminatedContact.phoneNumbers)
		o(keptContact.phoneNumbers[0].number).equals("789654123")
		o(keptContact.phoneNumbers[0].type).equals(ContactPhoneNumberType.WORK)
		o(keptContact.phoneNumbers[1].number).equals("963258741")
		o(keptContact.phoneNumbers[0].type).equals(ContactPhoneNumberType.WORK)
		o(keptContact.phoneNumbers.length).equals(2)
		keptContact = createFilledContact("", "", "", "", "", "", "", "", "", [], ["789654123", "963258741"], [], [])
		eliminatedContact = createFilledContact("", "", "", "", "", "", "", "", "", [], ["963258741"], [], [])
		keptContact.phoneNumbers = _getMergedPhoneNumbers(keptContact.phoneNumbers, eliminatedContact.phoneNumbers)
		o(keptContact.phoneNumbers[0].number).equals("789654123")
		o(keptContact.phoneNumbers[1].number).equals("963258741")
		o(keptContact.phoneNumbers.length).equals(2)
		keptContact = createFilledContact("", "", "", "", "", "", "", "", "", [], ["789654123", "963258741"], [], [])
		eliminatedContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], [], [])
		keptContact.phoneNumbers = _getMergedPhoneNumbers(keptContact.phoneNumbers, eliminatedContact.phoneNumbers)
		o(keptContact.phoneNumbers[0].number).equals("789654123")
		o(keptContact.phoneNumbers[1].number).equals("963258741")
		o(keptContact.phoneNumbers.length).equals(2)
		keptContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], [], [])
		eliminatedContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], [], [])
		keptContact.phoneNumbers = _getMergedPhoneNumbers(keptContact.phoneNumbers, eliminatedContact.phoneNumbers)
		o(keptContact.phoneNumbers.length).equals(0)
		keptContact = createFilledContact("", "", "", "", "", "", "", "", "", [], ["789654123", "963258741", "789852"], [], [])
		eliminatedContact = createFilledContact("", "", "", "", "", "", "", "", "", [], ["789654123", "963258741"], [], [])
		keptContact.phoneNumbers = _getMergedPhoneNumbers(keptContact.phoneNumbers, eliminatedContact.phoneNumbers)
		o(keptContact.phoneNumbers[0].number).equals("789654123")
		o(keptContact.phoneNumbers[1].number).equals("963258741")
		o(keptContact.phoneNumbers[2].number).equals("789852")
		o(keptContact.phoneNumbers.length).equals(3)
	})
	o("getMergedPhoneNumber should ignore whitespace", function () {
		const numberWithoutWhitespace = createTestEntity(ContactPhoneNumberTypeRef, {
			number: "789654123",
		})
		const numberWithWhitespace = createTestEntity(ContactPhoneNumberTypeRef, {
			number: " 789 654123 ",
		})

		const mergedPhoneNumbers = _getMergedPhoneNumbers([numberWithoutWhitespace], [numberWithWhitespace])

		o(mergedPhoneNumbers).deepEquals([
			createTestEntity(ContactPhoneNumberTypeRef, {
				number: "789654123",
			}),
		])
	})
	o("getMergedAddressesTest", function () {
		let keptContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], [], ["antste@antste.de", "bentste@bentste.de"])
		let eliminatedContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], [], ["antste@antste.de", "bentste@bentste.de"])
		keptContact.addresses = _getMergedAddresses(keptContact.addresses, eliminatedContact.addresses)
		o(keptContact.addresses[0].address).equals("antste@antste.de")
		//type is also merged
		o(keptContact.addresses[0].type).equals(ContactAddressType.WORK)
		o(keptContact.addresses[1].address).equals("bentste@bentste.de")
		o(keptContact.addresses[1].type).equals(ContactAddressType.WORK)
		o(keptContact.addresses.length).equals(2)
		keptContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], [], ["antste@antste.de"])
		keptContact.addresses[0].type = ContactAddressType.OTHER
		eliminatedContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], [], ["antste@antste.de", "bentste@bentste.de"])
		eliminatedContact.addresses[0].type = ContactAddressType.WORK
		eliminatedContact.addresses[1].type = ContactAddressType.OTHER
		keptContact.addresses = _getMergedAddresses(keptContact.addresses, eliminatedContact.addresses)
		o(keptContact.addresses[0].address).equals("antste@antste.de")
		o(keptContact.addresses[0].type).equals(ContactAddressType.OTHER)
		o(keptContact.addresses[1].address).equals("bentste@bentste.de")
		o(keptContact.addresses[1].type).equals(ContactAddressType.OTHER)
		o(keptContact.addresses.length).equals(2)
		keptContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], [], [])
		eliminatedContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], [], ["antste@antste.de", "bentste@bentste.de"])
		keptContact.addresses = _getMergedAddresses(keptContact.addresses, eliminatedContact.addresses)
		o(keptContact.addresses[0].address).equals("antste@antste.de")
		o(keptContact.addresses[0].type).equals(ContactAddressType.WORK)
		o(keptContact.addresses[1].address).equals("bentste@bentste.de")
		o(keptContact.addresses[0].type).equals(ContactAddressType.WORK)
		o(keptContact.addresses.length).equals(2)
		keptContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], [], ["antste@antste.de", "bentste@bentste.de"])
		eliminatedContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], [], ["bentste@bentste.de"])
		keptContact.addresses = _getMergedAddresses(keptContact.addresses, eliminatedContact.addresses)
		o(keptContact.addresses[0].address).equals("antste@antste.de")
		o(keptContact.addresses[1].address).equals("bentste@bentste.de")
		o(keptContact.addresses.length).equals(2)
		keptContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], [], ["antste@antste.de", "bentste@bentste.de"])
		eliminatedContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], [], [])
		keptContact.addresses = _getMergedAddresses(keptContact.addresses, eliminatedContact.addresses)
		o(keptContact.addresses[0].address).equals("antste@antste.de")
		o(keptContact.addresses[1].address).equals("bentste@bentste.de")
		o(keptContact.addresses.length).equals(2)
		keptContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], [], [])
		eliminatedContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], [], [])
		keptContact.addresses = _getMergedAddresses(keptContact.addresses, eliminatedContact.addresses)
		o(keptContact.addresses.length).equals(0)
		keptContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], [], ["antste@antste.de", "bentste@bentste.de", "bent@bent.de"])
		eliminatedContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], [], ["antste@antste.de", "bentste@bentste.de"])
		keptContact.addresses = _getMergedAddresses(keptContact.addresses, eliminatedContact.addresses)
		o(keptContact.addresses[0].address).equals("antste@antste.de")
		o(keptContact.addresses[1].address).equals("bentste@bentste.de")
		o(keptContact.addresses[2].address).equals("bent@bent.de")
		o(keptContact.addresses.length).equals(3)
	})
	o("getMergedSocialIdsTest", function () {
		let keptContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], ["antste@antste.de", "bentste@bentste.de"], [])
		let eliminatedContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], ["antste@antste.de", "bentste@bentste.de"], [])
		keptContact.socialIds = _getMergedSocialIds(keptContact.socialIds, eliminatedContact.socialIds)
		o(keptContact.socialIds[0].socialId).equals("antste@antste.de")
		//type is also merged
		o(keptContact.socialIds[0].type).equals(ContactSocialType.OTHER)
		o(keptContact.socialIds[1].socialId).equals("bentste@bentste.de")
		o(keptContact.socialIds[1].type).equals(ContactSocialType.OTHER)
		o(keptContact.socialIds.length).equals(2)
		keptContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], ["antste@antste.de"], [])
		keptContact.socialIds[0].type = ContactSocialType.OTHER
		eliminatedContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], ["antste@antste.de", "bentste@bentste.de"], [])
		eliminatedContact.socialIds[0].type = ContactSocialType.OTHER
		eliminatedContact.socialIds[1].type = ContactSocialType.OTHER
		keptContact.socialIds = _getMergedSocialIds(keptContact.socialIds, eliminatedContact.socialIds)
		o(keptContact.socialIds[0].socialId).equals("antste@antste.de")
		o(keptContact.socialIds[0].type).equals(ContactSocialType.OTHER)
		o(keptContact.socialIds[1].socialId).equals("bentste@bentste.de")
		o(keptContact.socialIds[1].type).equals(ContactSocialType.OTHER)
		o(keptContact.socialIds.length).equals(2)
		keptContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], [], [])
		eliminatedContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], ["antste@antste.de", "bentste@bentste.de"], [])
		keptContact.socialIds = _getMergedSocialIds(keptContact.socialIds, eliminatedContact.socialIds)
		o(keptContact.socialIds[0].socialId).equals("antste@antste.de")
		o(keptContact.socialIds[0].type).equals(ContactSocialType.OTHER)
		o(keptContact.socialIds[1].socialId).equals("bentste@bentste.de")
		o(keptContact.socialIds[0].type).equals(ContactSocialType.OTHER)
		o(keptContact.socialIds.length).equals(2)
		keptContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], ["antste@antste.de", "bentste@bentste.de"], [])
		eliminatedContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], ["bentste@bentste.de"], [])
		keptContact.socialIds = _getMergedSocialIds(keptContact.socialIds, eliminatedContact.socialIds)
		o(keptContact.socialIds[0].socialId).equals("antste@antste.de")
		o(keptContact.socialIds[1].socialId).equals("bentste@bentste.de")
		o(keptContact.socialIds.length).equals(2)
		keptContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], ["antste@antste.de", "bentste@bentste.de"], [])
		eliminatedContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], [], [])
		keptContact.socialIds = _getMergedSocialIds(keptContact.socialIds, eliminatedContact.socialIds)
		o(keptContact.socialIds[0].socialId).equals("antste@antste.de")
		o(keptContact.socialIds[1].socialId).equals("bentste@bentste.de")
		o(keptContact.socialIds.length).equals(2)
		keptContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], [], [])
		eliminatedContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], [], [])
		keptContact.socialIds = _getMergedSocialIds(keptContact.socialIds, eliminatedContact.socialIds)
		o(keptContact.socialIds.length).equals(0)
		keptContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], ["antste@antste.de", "bentste@bentste.de", "bent@bent.de"], [])
		eliminatedContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], ["antste@antste.de", "bentste@bentste.de"], [])
		keptContact.socialIds = _getMergedSocialIds(keptContact.socialIds, eliminatedContact.socialIds)
		o(keptContact.socialIds[0].socialId).equals("antste@antste.de")
		o(keptContact.socialIds[1].socialId).equals("bentste@bentste.de")
		o(keptContact.socialIds[2].socialId).equals("bent@bent.de")
		o(keptContact.socialIds.length).equals(3)
	})
	o("mergeContactsTest", function () {
		let keptContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], ["antste@antste.de", "bentste@bentste.de"], [])
		let eliminatedContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], ["antste@antste.de", "bentste@bentste.de"], [])
		let compareContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], ["antste@antste.de", "bentste@bentste.de"], [])
		mergeContacts(keptContact, eliminatedContact)
		o(_contactToVCard(keptContact)).equals(_contactToVCard(compareContact))
		keptContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], ["antste@antste.de"], [])
		eliminatedContact = createFilledContact("", "", "", "", "", "", "", "", "", [], ["0989089"], ["antste@antste.de", "bentste@bentste.de"], [])
		compareContact = createFilledContact("", "", "", "", "", "", "", "", "", [], ["0989089"], ["antste@antste.de", "bentste@bentste.de"], [])
		mergeContacts(keptContact, eliminatedContact)
		o(_contactToVCard(keptContact)).equals(_contactToVCard(compareContact))
		keptContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], [], [])
		eliminatedContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], [], [])
		compareContact = createFilledContact("", "", "", "", "", "", "", "", "", [], [], [], [])
		mergeContacts(keptContact, eliminatedContact)
		o(_contactToVCard(keptContact)).equals(_contactToVCard(compareContact))
		keptContact = createFilledContact("", "", "Tests are great ... noooot", "", "", "", "", "", "", [], [], [], [])
		eliminatedContact = createFilledContact(
			"Ant",
			"Ste",
			"Hello World!",
			"Tutao",
			"Mr.",
			"Buffalo",
			"",
			"",
			"",
			["antste@antste.de", "bentste@bentste.de"],
			["123123123", "321321321"],
			["diaspora.de"],
			["Housestreet 123\nTown 123\nState 123\nCountry 123"],
		)
		compareContact = createFilledContact(
			"Ant",
			"Ste",
			"Tests are great ... noooot\n\nHello World!",
			"Tutao",
			"Mr.",
			"Buffalo",
			"",
			"",
			"",
			["antste@antste.de", "bentste@bentste.de"],
			["123123123", "321321321"],
			["diaspora.de"],
			["Housestreet 123\nTown 123\nState 123\nCountry 123"],
		)
		mergeContacts(keptContact, eliminatedContact)
		o(_contactToVCard(keptContact)).equals(_contactToVCard(compareContact))
	})
	o("_compareBirthdaysForComparisonResultTest", function () {
		let c1 = createTestEntity(ContactTypeRef)
		let c2 = createTestEntity(ContactTypeRef)
		c1.birthdayIso = fillBirthday("14", "11", "1999")
		c2.birthdayIso = fillBirthday("14", "11", "1999")
		o(_compareBirthdays(c1, c2)).equals(ContactComparisonResult.Equal)
		c1.birthdayIso = fillBirthday("14", "11", null)
		c2.birthdayIso = fillBirthday("14", "11", null)
		o(_compareBirthdays(c1, c2)).equals(ContactComparisonResult.Equal)
		c1.birthdayIso = null
		c2.birthdayIso = null
		o(_compareBirthdays(c1, c2)).equals(IndifferentContactComparisonResult.BothEmpty)
		c1.birthdayIso = fillBirthday("14", "11", "1999")
		c2.birthdayIso = null
		o(_compareBirthdays(c1, c2)).equals(IndifferentContactComparisonResult.OneEmpty)
		c1 = createTestEntity(ContactTypeRef)
		c2.birthdayIso = fillBirthday("14", "11", "1999")
		o(_compareBirthdays(c1, c2)).equals(IndifferentContactComparisonResult.OneEmpty)
		c1 = createTestEntity(ContactTypeRef)
		c2 = createTestEntity(ContactTypeRef)
		c2.birthdayIso = fillBirthday("14", "11", null)
		o(_compareBirthdays(c1, c2)).equals(IndifferentContactComparisonResult.OneEmpty)
		c1.birthdayIso = fillBirthday("14", "11", "2000")
		c2.birthdayIso = fillBirthday("14", "11", null)
		o(_compareBirthdays(c1, c2)).equals(ContactComparisonResult.Similar)
		c1 = createTestEntity(ContactTypeRef)
		c2 = createTestEntity(ContactTypeRef)
		c1.birthdayIso = fillBirthday("12", "8", null)
		c2.birthdayIso = fillBirthday("12", "8", "1999")
		o(_compareBirthdays(c1, c2)).equals(ContactComparisonResult.Similar)
		c1.birthdayIso = fillBirthday("14", "11", "1999")
		c2.birthdayIso = fillBirthday("14", "11", "2000")
		o(_compareBirthdays(c1, c2)).equals(ContactComparisonResult.Unique)
	})
})

function fillBirthday(day: NumberString, month: NumberString, year: NumberString | null | undefined): string | null {
	let bday = createTestEntity(BirthdayTypeRef)
	bday.day = day
	bday.month = month
	bday.year = year ?? null
	return birthdayToIsoDate(bday)
}
