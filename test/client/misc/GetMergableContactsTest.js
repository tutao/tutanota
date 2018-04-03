// @flow
import o from "ospec/ospec.js"
import {createContact} from "../../../src/api/entities/tutanota/Contact"
import {
	_compareMailAddresses,
	_compareFullName,
	_areResidualContactFieldsEqual,
	_compareContactsForMerge,
	getMergeableContacts,
	_comparePhoneNumbers
} from "../../../src/contacts/ContactMergeView"
import {createContactMailAddress} from "../../../src/api/entities/tutanota/ContactMailAddress"
import {createContactPhoneNumber} from "../../../src/api/entities/tutanota/ContactPhoneNumber"
import {
	ContactAddressType,
	ContactComparisonResult,
	IndifferentContactComparisonResult,
	ContactSocialType
} from "../../../src/api/common/TutanotaConstants"
import {createContactAddress} from "../../../src/api/entities/tutanota/ContactAddress"
import {createContactSocialId} from "../../../src/api/entities/tutanota/ContactSocialId"

o.spec("ContactMergeViewTest", function () {
// tests are made for the validation of the comparison functions to finde mergable contacts

	o("GetMergableContactsTest", function () {
		let c1 = createFilledContact("A", "B", ["a@b.de"])
		let c2 = createFilledContact("A", "B", ["a@b.de"])
		let c3 = createFilledContact("A", "B", ["c@b.de"])
		let c4 = createFilledContact("A", "B", ["c@b.de"])
		let c5 = createFilledContact("A", "B", ["d@b.de"])
		let c6 = createFilledContact("c", "c", ["ADC@b.de"])
		let c7 = createFilledContact("c", "c", ["BDC@b.de"])
		let c8 = createFilledContact("c", "c", ["CDC@b.de"])
		let c9 = createFilledContact("a", "", ["hello@hello.de"], ["123456"])
		let c10 = createFilledContact("a", "", ["hello@hello.de"], ["789456123"])
		c10 = addFilledContactOtherFields(c10, "", "", "Mr.", "")
		let c11 = createFilledContact("", "", ["hello@hello.de"], ["258258"])
		let c12 = createFilledContact("b", "b", ["tuta@hello.de"], ["654321"])
		let c13 = createFilledContact("b", "b", ["bnt@bnt.com"], ["147852369"])
		c13 = addFilledContactOtherFields(c13, "", "tuta", "Mr.Dr.", "")
		let c14 = createFilledContact("b", "b", [], ["1231231258258"])
		let c15 = createFilledContact("a", "", ["hello@hello.de"], ["123456", "789456123", "258258"])
		c15 = addFilledContactOtherFields(c15, "", "", "Mr.", "")
		let c16 = createFilledContact("b", "b", ["tuta@hello.de", "bnt@bnt.com"], ["654321", "147852369", "1231231258258"])
		c16 = addFilledContactOtherFields(c16, "", "tuta", "Mr.Dr.", "")
		o(JSON.stringify(getMergeableContacts([c1, c2, c3]))).deepEquals(JSON.stringify({
			mergeable: [[c1, c3]],
			deletable: [c2]
		}))
		o(JSON.stringify(getMergeableContacts([c1, c3, c2]))).deepEquals(JSON.stringify({
			mergeable: [[c1, c3]],
			deletable: [c2]
		}))
		o(JSON.stringify(getMergeableContacts([c3, c1, c2]))).deepEquals(JSON.stringify({
			mergeable: [[c3, c1]],
			deletable: [c2]
		}))
		o(JSON.stringify(getMergeableContacts([c3, c1, c2, c4]))).deepEquals(JSON.stringify({
			mergeable: [[c3, c1]],
			deletable: [c2, c4]
		}))
		o(JSON.stringify(getMergeableContacts([c1, c2, c3, c4, c5]))).deepEquals(JSON.stringify({
			mergeable: [[c1, c3, c5]],
			deletable: [c2, c4]
		}))
		o(JSON.stringify(getMergeableContacts([c1, c2, c3, c6, c7, c8]))).deepEquals(JSON.stringify({
			mergeable: [[c1, c3], [c6, c7, c8]],
			deletable: [c2]
		}))
		o(JSON.stringify(getMergeableContacts([c15, c16, c9, c10, c11, c12, c13, c14]))).deepEquals(JSON.stringify({
			mergeable: [[c15, c9, c10, c11], [c16, c12, c13, c14]],
			deletable: []
		}))

		o(JSON.stringify(getMergeableContacts([c15, c9, c10, c11, c12, c13, c14, c16]))).deepEquals(JSON.stringify({
			mergeable: [[c15, c9, c10, c11], [c12, c13, c14, c16]],
			deletable: []
		}))

		o(JSON.stringify(getMergeableContacts([c15, c16, c9, c10, c12, c13, c14, c11]))).deepEquals(JSON.stringify({
			mergeable: [[c15, c9, c10, c11], [c16, c12, c13, c14]],
			deletable: []
		}))

		o(getMergeableContacts([c10, c9, c15, c13, c11, c16, c12, c14]).mergeable[0].length).equals(4)
		o(getMergeableContacts([c10, c9, c15, c13, c11, c16, c12, c14]).mergeable[1].length).equals(4)
		// o(getMergeableContacts([c10, c9, c15, c13, c11]).mergeable[0].length).equals(4)
		// console.log(getMergeableContacts([c10, c9, c15, c13, c11]).mergeable[0])


	})

	let idCounter = 0

	function createFilledContact(firstName: string, lastName: string, emailAddresses: ?string[], phoneNumbers: ?string[]): Contact {
		let c = createContact()
		c._id = ["0", String(idCounter++)]
		c.firstName = firstName
		c.lastName = lastName
		if (emailAddresses) {
			emailAddresses.map(m => {
				let a = createContactMailAddress()
				a.address = m
				a.type = ContactAddressType.WORK
				a.customTypeName = ""
				c.mailAddresses.push(a)
			})
		}
		if (phoneNumbers) {
			phoneNumbers.map(m => {
				let a = createContactPhoneNumber()
				a.number = m
				a.type = ContactAddressType.WORK
				a.customTypeName = ""
				c.phoneNumbers.push(a)
			})
		}
		return c
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
		return mailAddresses.map(m => {
			let a = createContactMailAddress()
			a.address = m
			a.type = ContactAddressType.WORK
			a.customTypeName = ""
			return a
		})
	}

	o("testCompareFullNames", function () {
		let c1 = createFilledContact("anton", "schmidt", null)
		let c2 = createFilledContact("bob", "schmidt", null)
		o(_compareFullName(c1, c2)).equals(ContactComparisonResult.Unique)
		o(_compareFullName(c2, c1)).equals(ContactComparisonResult.Unique)

		c1 = createFilledContact("anton", "schmidt", null)
		c2 = createFilledContact("", "schmidt", null)
		o(_compareFullName(c1, c2)).equals(ContactComparisonResult.Similar)
		o(_compareFullName(c2, c1)).equals(ContactComparisonResult.Similar)

		c1 = createFilledContact("", "schmidt", null)
		c2 = createFilledContact("", "schmidt", null)
		o(_compareFullName(c1, c2)).equals(ContactComparisonResult.Equal)

		c1 = createFilledContact("", "", null)
		c2 = createFilledContact("", "", null)
		o(_compareFullName(c1, c2)).equals(IndifferentContactComparisonResult.BothEmpty)

		c1 = createFilledContact("", "", null)
		c2 = createFilledContact("a", "b", null)
		o(_compareFullName(c1, c2)).equals(IndifferentContactComparisonResult.OneEmpty)
		o(_compareFullName(c2, c1)).equals(IndifferentContactComparisonResult.OneEmpty)

		c1 = createFilledContact("anton", "schmidt", null)
		c2 = createFilledContact("anton", "schmidt", null)
		o(_compareFullName(c1, c2)).equals(ContactComparisonResult.Equal)

		c1 = createFilledContact("Anton", "Schmidt", null)
		c2 = createFilledContact("anton", "schmidt", null)
		o(_compareFullName(c1, c2)).equals(ContactComparisonResult.Similar)
		o(_compareFullName(c2, c1)).equals(ContactComparisonResult.Similar)

		c1 = createFilledContact("anton", "schmidt", null)
		c2 = createFilledContact("Anton", "schmidt", null)
		o(_compareFullName(c1, c2)).equals(ContactComparisonResult.Similar)
		o(_compareFullName(c2, c1)).equals(ContactComparisonResult.Similar)

		c1 = createFilledContact("", "Schmidt", null)
		c2 = createFilledContact("", "schmidt", null)
		o(_compareFullName(c1, c2)).equals(ContactComparisonResult.Similar)
		o(_compareFullName(c2, c1)).equals(ContactComparisonResult.Similar)

		c1 = createFilledContact("anton", "", null)
		c2 = createFilledContact("anton", "", null)
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
		return phoneNumbers.map(n => {
			let a = createContactPhoneNumber()
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
		let a = createContact()
		a._id = ["0", String(idCounter++)]
		a.title = title
		a.comment = comment
		a.company = company
		a.nickname = nickname
		return a

	}

	function addFilledContactOtherFields(c: Contact, comment: string, company: string, title: string, nickname: string, socialIds: ?string[], addresses: ?string[]) {
		c.title = title
		c.comment = comment
		c.company = company
		c.nickname = nickname
		if (addresses) {
			addresses.map(m => {
				let a = createContactAddress()
				a.address = m
				a.type = ContactAddressType.WORK
				a.customTypeName = ""
				c.addresses.push(a)
			})
		}
		if (socialIds) {
			socialIds.map(m => {
				let a = createContactSocialId()
				a.socialId = m
				a.type = ContactSocialType.TWITTER
				a.customTypeName = ""
				c.socialIds.push(a)
			})
		}
		return c
	}

	o("testCompareContactsForMerge", function () {

		let c1 = createFilledContact("anton", "schmidt", ["anton@mail.de"], ["123456"])
		let c2 = createFilledContact("anton", "schmidt", ["anton@mail.de"], ["123456"])
		o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Equal)
		o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Equal)

		c1 = createFilledContact("", "", [], [])
		c2 = createFilledContact("", "", [], [])
		o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Equal)
		o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Equal)

		c1 = createFilledContact("anton", "schmidt", ["anton@mail.de", "tuta@io.de"], ["123456"])
		c2 = createFilledContact("anton", "schmidt", ["anton@mail.de"], ["123456"])
		o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
		o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)

		c1 = createFilledContact("anton", "schmidt", ["anton@mail.de", "tuta@io.de"], ["123456"])
		c2 = createFilledContact("anton", "schmidt", ["anton@mail.de", "TUTA@io.de"], ["123456"])
		o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
		o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)

		c1 = createFilledContact("anton", "schmidt", ["anton@mail.de", "tuta@io.de"], ["123456"])
		c2 = createFilledContact("", "schmidt", ["anton@mail.de", "TUTA@io.de"], ["123456"])
		o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
		o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)

		c1 = createFilledContact("anton", "schmidt", ["anton@mail.de", "tuta@io.de"], ["123456"])
		c2 = createFilledContact("anton", "schmidt", ["b@mail.de", "c@io.de"], ["123456"])
		o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
		o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)

		c1 = createFilledContact("anton", "schmidt", ["anton@mail.de", "tuta@io.de"], ["123456"])
		c2 = createFilledContact("anton", "schmidt", ["b@mail.de", "c@io.de"], ["1234567890"])
		o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
		o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)

		c1 = createFilledContact("anton", "Bob", ["anton@mail.de", "tuta@io.de"], ["123456"])
		c2 = createFilledContact("anton", "schmidt", ["b@mail.de", "c@io.de"], ["1234567890"])
		o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Unique)
		o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Unique)

		c1 = createFilledContact("bob", "schmidt", [""], ["123456"])
		c2 = createFilledContact("anton", "schmidt", [""], ["123456"])
		o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Unique)
		o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Unique)

		c1 = createFilledContact("", "schmidt", ["anton@mail.de", "tuta@io.de"], ["123456"])
		c2 = createFilledContact("anton", "schmidt", [""], ["123456"])
		o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
		o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)

		c1 = createFilledContact("", "schmidt", ["anton@mail.de", "tuta@io.de"], ["123456"])
		c2 = createFilledContact("", "schmidt", [""], [""])
		o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
		o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)

		c1 = createFilledContact("Anton", "Schmidt", ["anton@mail.de", "tuta@io.de"], ["123456"])
		c2 = createFilledContact("anton", "schmidt", [""], ["123"])
		o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
		o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)

		c1 = createFilledContact("Anton", "Schmidt", ["anton@mail.de", "tuta@io.de"], ["123456"])
		c2 = createFilledContact("anton", "tom", [""], ["123456"])
		o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Unique)
		o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Unique)

		c1 = createFilledContact("Anton", "Schmidt", ["anton@mail.de", "tuta@io.de"], ["123456"])
		c2 = createFilledContact("anton", "tom", [""], ["123456"])
		o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Unique)
		o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Unique)

		c1 = createFilledContact("Anton", "Schmidt", ["anton@mail.de", "tuta@io.de"], ["123456"])
		c2 = createFilledContact("anton", "tom", ["anton@mail.de"], ["1234567"])
		o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Unique)
		o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Unique)

		c1 = createFilledContact("", "", [], [])
		c2 = createFilledContact("a", "tom", [], [])
		o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Unique)
		o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Unique)

		c1 = createFilledContact("", "", ["a@b.de"], [])
		c2 = createFilledContact("a", "tom", ["a@b.de"], [])
		o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
		o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)

		c1 = createFilledContact("", "", [], ["123456"])
		c2 = createFilledContact("a", "tom", [], ["123456"])
		o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
		o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)

		c1 = createFilledContact("", "", [], ["123456"])
		c2 = createFilledContact("", "", [], ["123456"])
		o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Equal)
		o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Equal)

		c1 = createFilledContact("", "", ["a@b.de"], [])
		c2 = createFilledContact("", "", ["a@b.de"], [])
		o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Equal)
		o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Equal)

//_________________More test cases for full contact simulation here --added other contact fields ___________________
		c1 = createFilledContact("", "", [], [])
		c2 = createFilledContact("", "", [], [])
		c1 = addFilledContactOtherFields(c1, "", "", "", "", [], [])
		c2 = addFilledContactOtherFields(c2, "", "", "", "", [], [])
		o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Equal)
		o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Equal)

		c1 = createFilledContact("anton", "schmidt", ["anton@mail.de", "tuta@io.de"], ["123456"])
		c2 = createFilledContact("anton", "schmidt", ["anton@mail.de"], ["123456"])
		c1 = addFilledContactOtherFields(c1, "", "", "", "", [], [])
		c2 = addFilledContactOtherFields(c2, "", "", "", "", [], [])
		o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
		o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)

		c1 = createFilledContact("anton", "schmidt", ["anton@mail.de", "tuta@io.de"], ["123456"])
		c2 = createFilledContact("anton", "schmidt", ["anton@mail.de", "TUTA@io.de"], ["123456"])
		c1 = addFilledContactOtherFields(c1, "", "", "", "A", [], [])
		c2 = addFilledContactOtherFields(c2, "", "", "b", "", [], [])
		o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
		o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)

		c1 = createFilledContact("anton", "schmidt", ["anton@mail.de", "tuta@io.de"], ["123456"])
		c2 = createFilledContact("", "schmidt", ["anton@mail.de", "TUTA@io.de"], ["123456"])
		c1 = addFilledContactOtherFields(c1, "A", "A", "b", "A", [], [])
		c2 = addFilledContactOtherFields(c2, "A", "A", "b", "A", [], [])
		o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
		o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)

		c1 = createFilledContact("anton", "schmidt", ["anton@mail.de", "tuta@io.de"], ["123456"])
		c2 = createFilledContact("anton", "schmidt", ["b@mail.de", "c@io.de"], ["123456"])
		c1 = addFilledContactOtherFields(c1, "", "", "", "A", ["Facebook sucks in privacy", "Google also does"], ["Address 123", "Berlin 1234", "Hannover"])
		c2 = addFilledContactOtherFields(c2, "", "", "b", "", [], ["Hannover"])
		o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
		o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)

		c1 = createFilledContact("anton", "schmidt", ["anton@mail.de", "tuta@io.de"], ["123456"])
		c2 = createFilledContact("anton", "schmidt", ["b@mail.de", "c@io.de"], ["1234567890"])
		c1 = addFilledContactOtherFields(c1, "A", "A", "A", "A", ["A", "B", "C"], ["A", "B", "C"])
		c2 = addFilledContactOtherFields(c2, "A", "A", "A", "A", ["A", "B", "C"], ["A", "B", "C"])
		o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
		o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)

		c1 = createFilledContact("anton", "Bob", ["anton@mail.de", "tuta@io.de"], ["123456"])
		c2 = createFilledContact("anton", "schmidt", ["b@mail.de", "c@io.de"], ["1234567890"])
		c1 = addFilledContactOtherFields(c1, "A", "A", "A", "A", ["A", "B", "C"], ["A", "B", "C"])
		c2 = addFilledContactOtherFields(c2, "A", "A", "A", "A", ["A", "B", "C"], ["A", "B", "C"])
		o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Unique)
		o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Unique)

		c1 = createFilledContact("bob", "schmidt", [""], ["123456"])
		c2 = createFilledContact("anton", "schmidt", [""], ["123456"])
		c1 = addFilledContactOtherFields(c1, "A", "A", "A", "A", ["A", "B", "C"], ["A", "B", "C"])
		c2 = addFilledContactOtherFields(c2, "", "", "", "", ["", "", ""], ["", "", ""])
		o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Unique)
		o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Unique)

		c1 = createFilledContact("", "schmidt", ["anton@mail.de", "tuta@io.de"], ["123456"])
		c2 = createFilledContact("anton", "schmidt", [""], ["123456"])
		c1 = addFilledContactOtherFields(c1, "A", "A", "A", "A", ["A", "B", "C"], ["A", "B", "C"])
		c2 = addFilledContactOtherFields(c2, "b", "c", "d", "e", ["f", "g", "h"], ["q", "w", "j"])
		o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
		o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)

		c1 = createFilledContact("", "schmidt", ["anton@mail.de", "tuta@io.de"], ["123456"])
		c2 = createFilledContact("", "schmidt", [""], [""])
		c1 = addFilledContactOtherFields(c1, "", "", "", "", ["A", "B", "C"], ["A", "B", "C"])
		c2 = addFilledContactOtherFields(c2, "", "", "", "", [], [])
		o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
		o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)

		c1 = createFilledContact("Anton", "Schmidt", ["anton@mail.de", "tuta@io.de"], ["123456"])
		c2 = createFilledContact("anton", "schmidt", [""], ["123"])
		c1 = addFilledContactOtherFields(c1, "A", "A", "A", "A", ["A"], ["A"])
		c2 = addFilledContactOtherFields(c2, "A", "A", "A", "A", ["A"], ["A"])
		o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
		o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)

		c1 = createFilledContact("Anton", "Schmidt", ["anton@mail.de", "tuta@io.de"], ["123456"])
		c2 = createFilledContact("anton", "tom", [""], ["123456"])
		c1 = addFilledContactOtherFields(c1, "A", "A", "A", "A", ["A"], ["A"])
		c2 = addFilledContactOtherFields(c2, "A", "A", "A", "A", ["A"], ["A"])
		o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Unique)
		o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Unique)

		c1 = createFilledContact("Anton", "Schmidt", ["anton@mail.de", "tuta@io.de"], ["123456"])
		c2 = createFilledContact("anton", "tom", [""], ["123456"])
		c1 = addFilledContactOtherFields(c1, "A", "A", "A", "A", ["A"], ["A"])
		c2 = addFilledContactOtherFields(c2, "A", "A", "A", "A", ["A"], ["B"])
		o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Unique)
		o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Unique)

		c1 = createFilledContact("Anton", "Schmidt", ["anton@mail.de", "tuta@io.de"], ["123456"])
		c2 = createFilledContact("anton", "tom", ["anton@mail.de"], ["1234567"])
		c1 = addFilledContactOtherFields(c1, "", "", "", "", [], [])
		c2 = addFilledContactOtherFields(c2, "", "", "", "", [], [])
		o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Unique)
		o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Unique)

		c1 = createFilledContact("", "", [], [])
		c2 = createFilledContact("a", "tom", [], [])
		c1 = addFilledContactOtherFields(c1, "", "", "", "", [], [])
		c2 = addFilledContactOtherFields(c2, "", "", "", "", [], [])
		o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Unique)
		o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Unique)

		c1 = createFilledContact("", "", ["a@b.de"], [])
		c2 = createFilledContact("a", "tom", ["a@b.de"], [])
		c1 = addFilledContactOtherFields(c1, "A", "", "", "", [], [])
		c2 = addFilledContactOtherFields(c2, "A", "B", "", "", [], [])
		o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
		o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)

		c1 = createFilledContact("", "", [], ["123456"])
		c2 = createFilledContact("a", "tom", [], ["123456"])
		c1 = addFilledContactOtherFields(c1, "", "", "", "", ["Diaspora my be better than Facebook"], ["Hannover"])
		c2 = addFilledContactOtherFields(c2, "", "", "", "", [], ["Hannover"])
		o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
		o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)

		c1 = createFilledContact("", "", [], ["123456"])
		c2 = createFilledContact("", "", [], ["123456"])
		c1 = addFilledContactOtherFields(c1, "A", "", "", "", [], [])
		c2 = addFilledContactOtherFields(c2, "A", "B", "", "", [], [])
		o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
		o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)

		c1 = createFilledContact("", "", ["a@b.de"], [])
		c2 = createFilledContact("", "", ["a@b.de"], [])
		c1 = addFilledContactOtherFields(c1, "A", "", "", "", [], [])
		c2 = addFilledContactOtherFields(c2, "A", "B", "", "", [], [])
		o(_compareContactsForMerge(c1, c2)).equals(ContactComparisonResult.Similar)
		o(_compareContactsForMerge(c2, c1)).equals(ContactComparisonResult.Similar)


	})

	o("testCompareContactsWithPresharedPasswordForMerge", function () {
		let allContacts = []
		allContacts[0] = createContact()
		allContacts[1] = createContact()
		allContacts[0].mailAddresses[0] = createContactMailAddress()
		allContacts[1].mailAddresses[0] = createContactMailAddress()
		allContacts[0].phoneNumbers[0] = createContactPhoneNumber()
		allContacts[1].phoneNumbers[0] = createContactPhoneNumber()
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
		allContacts[0] = createContact()
		allContacts[1] = createContact()
		allContacts[1].presharedPassword = "B"
		o(_compareContactsForMerge(allContacts[0], allContacts[1])).equals(ContactComparisonResult.Unique)
		allContacts[0].presharedPassword = "B"
		o(_compareContactsForMerge(allContacts[0], allContacts[1])).equals(ContactComparisonResult.Equal)


	})
//typeRef should not affect the result of the comparison the value is most important
	o("testContactTypeValuesForUnimportance", function () {
		let allContacts = []
		allContacts[0] = createContact()
		allContacts[1] = createContact()
		allContacts[0].mailAddresses[0] = createContactMailAddress()
		allContacts[1].mailAddresses[0] = createContactMailAddress()
		allContacts[0].phoneNumbers[0] = createContactPhoneNumber()
		allContacts[1].phoneNumbers[0] = createContactPhoneNumber()
		allContacts[0].phoneNumbers[0].number = "017999854654"
		allContacts[1].phoneNumbers[0].number = "017999854654"
		allContacts[0].mailAddresses[0].address = "anton@mail.de"
		allContacts[1].mailAddresses[0].address = "anton@mail.de"
		o(_compareContactsForMerge(allContacts[0], allContacts[1])).equals(ContactComparisonResult.Equal)
		allContacts[0].mailAddresses[0]._type = "0"
		allContacts[1].mailAddresses[0]._type = "1"
		allContacts[0].phoneNumbers[0]._type = "1"
		allContacts[1].phoneNumbers[0]._type = "0"
		o(_compareContactsForMerge(allContacts[0], allContacts[1])).equals(ContactComparisonResult.Equal)
		allContacts[0].mailAddresses[0]._type = "1"
		allContacts[1].mailAddresses[0]._type = "1"
		o(_compareContactsForMerge(allContacts[0], allContacts[1])).equals(ContactComparisonResult.Equal)
		allContacts[1].mailAddresses[0].customTypeName = "FUN"
		o(_compareContactsForMerge(allContacts[0], allContacts[1])).equals(ContactComparisonResult.Equal)
		allContacts[0].phoneNumbers[0]._type = "1"
		allContacts[1].phoneNumbers[0]._type = "1"
		o(_compareContactsForMerge(allContacts[0], allContacts[1])).equals(ContactComparisonResult.Equal)

	})

})