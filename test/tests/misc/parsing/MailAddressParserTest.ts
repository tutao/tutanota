import o from "@tutao/otest"
import {
	fullNameToFirstAndLastName,
	getCleanedMailAddress,
	mailAddressToFirstAndLastName,
	parseMailtoUrl,
	stringToNameAndMailAddress,
} from "../../../../src/common/misc/parsing/MailAddressParser.js"
import { isMailAddress } from "../../../../src/common/misc/FormatValidator.js"

o.spec("MailAddressParser", function () {
	o("parseMailtoUrl single address", function () {
		let { recipients, subject, body } = parseMailtoUrl("mailto:chris@example.com")
		o(recipients.to!).deepEquals([{ name: "", address: "chris@example.com" }])
		o(subject).equals(null)
		o(body).equals(null)
	})

	o("parseMailtoUrl with subject and body", function () {
		let { recipients, subject, body, attach } = parseMailtoUrl(
			"mailto:someone@example.com?subject=This%20is%20the%20subject&cc=someone_else@example.com&body=This%20is%20the%20body%0AKind regards%20someone",
		)
		o(recipients.to!).deepEquals([{ name: "", address: "someone@example.com" }])
		o(recipients.cc!).deepEquals([{ name: "", address: "someone_else@example.com" }])
		o(subject).equals("This is the subject")
		o(attach).equals(null)
		o(body).equals("This is the body<br>Kind regards someone")
	})

	o("parseMailtoUrl with multiple recipients", function () {
		let { recipients, body } = parseMailtoUrl(
			"mailto:joe1@example.com,joe2@example.com?to=joe3@example.com&cc=bob1@example.com%2C%20bob2@example.com&body=hello&bcc=carol1@example.com%2C%20carol2@example.com",
		)
		o((recipients.to || []).map((to) => to.address)).deepEquals(["joe1@example.com", "joe2@example.com", "joe3@example.com"])
		o((recipients.cc || []).map((cc) => cc.address)).deepEquals(["bob1@example.com", "bob2@example.com"])
		o((recipients.bcc || []).map((bcc) => bcc.address)).deepEquals(["carol1@example.com", "carol2@example.com"])
		o(body).equals("hello")
	})

	o("parseMailtoUrl to lower case", function () {
		let { recipients, subject, body } = parseMailtoUrl(
			"	mailto:matthias@test.de?CC=matthias@test.de&BCC=matthias@test.de&Subject=Blah&Body=What%3F%20Everything%20encoded%20in%20mailto%3F",
		)
		o((recipients.to || []).map((to) => to.address)).deepEquals(["matthias@test.de"])
		o((recipients.cc || []).map((cc) => cc.address)).deepEquals(["matthias@test.de"])
		o((recipients.bcc || []).map((bcc) => bcc.address)).deepEquals(["matthias@test.de"])
		o(subject).equals("Blah")
		o(body).equals("What? Everything encoded in mailto?")
	})

	o("parseMailtoUrl with full addressing scheme", function () {
		let { recipients } = parseMailtoUrl("mailto:Fritz%20Eierschale%20%3Ceierschale@irgend.wo%3E")
		o(recipients.to!).deepEquals([
			{
				address: "eierschale@irgend.wo",
				name: "Fritz Eierschale",
			},
		])
	})

	o("parseMailtoUrl with attachments", function () {
		let { attach, body } = parseMailtoUrl(
			"mailto:a@b.c?attach=file:///home/user/cat.jpg&body=hello%20world&attach=file:///home/user/dog%20man.jpg&attach=/home/user/pig.jpg",
		)
		o(attach!).deepEquals(["file:///home/user/cat.jpg", "file:///home/user/dog man.jpg", "/home/user/pig.jpg"])
		o(body).equals("hello world")
	})

	o("parseMailtoUrl with empty params", function () {
		let { attach, body, recipients } = parseMailtoUrl("mailto:?attach=&body=&bcc=")
		o(attach!).deepEquals([""])
		o(recipients).deepEquals({
			to: undefined,
			cc: undefined,
			bcc: [],
		})
		o(body).equals("")
	})

	o("parseMailtoUrl without params", function () {
		let { attach, body, subject, recipients } = parseMailtoUrl("mailto:")
		o(attach).equals(null)
		o(body).equals(null)
		o(subject).equals(null)
		o(recipients).deepEquals({
			to: undefined,
			cc: undefined,
			bcc: undefined,
		})
	})

	o("parseMailtoUrl with bogus params", function () {
		let { bogus } = parseMailtoUrl("mailto:?bogus=hello") as any
		o(bogus).equals(undefined)
	})

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

	o("cleanedMailAddress", function () {
		o(getCleanedMailAddress("   a@b.de   ")).equals("a@b.de")
		o(getCleanedMailAddress("xxxx")).equals(null)
	})

	o("stringToNameAndMailAddress", function () {
		// test valid strings
		o(stringToNameAndMailAddress(" a@b.de ")!).deepEquals({ name: "", mailAddress: "a@b.de" })
		o(stringToNameAndMailAddress(" <a@b.de > ")!).deepEquals({ name: "", mailAddress: "a@b.de" })
		o(stringToNameAndMailAddress(" Aas Bos a@b.de")!).deepEquals({ name: "Aas Bos", mailAddress: "a@b.de" })
		o(stringToNameAndMailAddress(" Aas Bos  <a@b.de>")!).deepEquals({ name: "Aas Bos", mailAddress: "a@b.de" })
		o(stringToNameAndMailAddress(" Aas Bos<a@b.de>")!).deepEquals({ name: "Aas Bos", mailAddress: "a@b.de" })
		// test invalid strings
		o(stringToNameAndMailAddress(" Aas Bos  <a@de>")).equals(null)
		o(stringToNameAndMailAddress(" Aas Bos ")).equals(null)
		o(stringToNameAndMailAddress(" Aas Bos  a@de")).equals(null)
	})

	o("fullNameToNameAndMailAddress", function () {
		o(fullNameToFirstAndLastName("Peter Pan")).deepEquals({ firstName: "Peter", lastName: "Pan" })
		o(fullNameToFirstAndLastName("peter pan")).deepEquals({ firstName: "peter", lastName: "pan" })
		o(fullNameToFirstAndLastName("Peter Pater Pan")).deepEquals({ firstName: "Peter", lastName: "Pater Pan" })
		o(fullNameToFirstAndLastName(" Peter ")).deepEquals({ firstName: "Peter", lastName: "" })
	})

	o("mailAddressToFirstAndLastName", function () {
		o(mailAddressToFirstAndLastName("Peter.Pan@x.de")).deepEquals({ firstName: "Peter", lastName: "Pan" })
		o(mailAddressToFirstAndLastName("peter.pan@x.de")).deepEquals({ firstName: "Peter", lastName: "Pan" })
		o(mailAddressToFirstAndLastName("peter_pan@x.de")).deepEquals({ firstName: "Peter", lastName: "Pan" })
		o(mailAddressToFirstAndLastName("peter-pan@x.de")).deepEquals({ firstName: "Peter", lastName: "Pan" })
		o(mailAddressToFirstAndLastName("peter_pan@x.de")).deepEquals({ firstName: "Peter", lastName: "Pan" })
		o(mailAddressToFirstAndLastName("peter.pater.pan@x.de")).deepEquals({ firstName: "Peter", lastName: "Pater Pan" })
		o(mailAddressToFirstAndLastName("peter@x.de")).deepEquals({ firstName: "Peter", lastName: "" })
	})
})
