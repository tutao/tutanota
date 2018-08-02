import o from "ospec/ospec.js"
import {createContact} from "../../../src/api/entities/tutanota/Contact"
import {compareContacts, formatBirthdayNumeric} from "../../../src/contacts/ContactUtils"
import {createContactMailAddress} from "../../../src/api/entities/tutanota/ContactMailAddress"
import {createBirthday} from "../../../src/api/entities/tutanota/Birthday"

o.spec("ContactUtilsTest", function () {
	let compare = function (c1Firstname, c1Lastname, c1MailAddress, c2Firstname, c2Lastname, c2MailAddress, expectedResult) {
		let c1 = createContact()
		let c2 = createContact()
		c1._id = ["a", "1"]
		c2._id = ["a", "2"]
		c1.firstName = c1Firstname
		c2.firstName = c2Firstname
		c1.lastName = c1Lastname
		c2.lastName = c2Lastname
		if (c1MailAddress) {
			let m = createContactMailAddress()
			m.address = c1MailAddress
			c1.mailAddresses.push(m)
		}
		if (c2MailAddress) {
			let m = createContactMailAddress()
			m.address = c2MailAddress
			c2.mailAddresses.push(m)
		}
		let result = compareContacts(c1, c2)
		if (result != expectedResult) {
			console.log("error >>>>>>>", "'" + c1Firstname + "'", "'" + c1Lastname + "'", c1MailAddress, "'" + c2Firstname + "'", "'" + c2Lastname + "'", c2MailAddress, "expected:", expectedResult, "result", result)
		}
		o(result).equals(expectedResult)
	}

	o("compareContacts", () => {
		// only first name
		compare("Alf", "", null, "", "", null, -1)
		compare("Alf", "", null, "Bob", "", null, -1)
		compare("", "", null, "Bob", "", null, 1)
		compare("Bob", "", null, "Alf", "", null, 1)

		// only last name
		compare("", "Alf", null, "", "", null, -1)
		compare("", "Alf", null, "", "Bob", null, -1)
		compare("", "", null, "", "Bob", null, 1)
		compare("", "Bob", null, "", "Alf", null, 1)

		// only mail address
		compare("", "", "Alf", "", "", null, -1)
		compare("", "", "Alf", "", "", "Bob", -1)
		compare("", "", null, "", "", "Bob", 1)
		compare("", "", "Bob", "", "", "Alf", 1)

		// first and last name
		compare("", "Alf", null, "Alf", "Bob", null, 1)
		compare("Alf", "Bob", null, "Bob", "Alf", null, -1)
		compare("Alf", "Bob", null, "", "Bob", null, -1)
		compare("Alf", "", null, "Alf", "Bob", null, 1)

		// mixed
		compare("", "Bob", null, "", "", "Alf", -1)
		compare("Bob", "", null, "", "", "Alf", -1)
		compare("Alf", "Bob", "Bob", "Alf", "Bob", "Alf", 1)
		compare("Alf", "Bob", null, "", "", "Alf", -1)

		// none or same
		compare("", "", null, "", "", null, 1) // reverse id
		compare("Alf", "Bob", "Bob", "Alf", "Bob", "Bob", 1) // reverse id

		compare("ma", "p", "aa", "Gump", "Forrest", "aa", 1) // reverse id
	})

	o("formatNewBirthdayTest", function () {
		let bday = createBirthday()
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
	})

})

