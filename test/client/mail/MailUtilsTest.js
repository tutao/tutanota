//@flow
import o from "ospec/ospec.js"
import {GroupType} from "../../../src/api/common/TutanotaConstants"
import {createRecipientInfo, parseMailtoUrl} from "../../../src/mail/MailUtils"
import {logins} from "../../../src/api/main/LoginController"
import {recipientInfoType} from "../../../src/api/common/RecipientInfo"


o.spec("MailUtils", browser(function () {

	o.before(function () {
		logins._userController = ({
			user: {
				_id: 'userId',
				memberships: [{groupType: GroupType.Contact, group: 'groupId'}]
			},
			isInternalUser: () => true
		}:any)
	})

	o("create contact from recipient info", function () {
		let r1 = createRecipientInfo("schneier@secure.com", "B. Schneier", null, true)
		o(r1.mailAddress).equals("schneier@secure.com")
		o(r1.name).equals("B. Schneier")
		o(r1.type).equals(recipientInfoType.unknown)
		o(r1.contact).equals(null)

		let r2 = createRecipientInfo("schneier@tutanota.com", "B. Schneier", null, true)
		o(r2.mailAddress).equals("schneier@tutanota.com")
		o(r2.name).equals("B. Schneier")
		o(r2.type).equals(recipientInfoType.internal)
		o(r2.contact).equals(null)

		let r3 = createRecipientInfo("schneier@tutanota.com", null, null, true)
		o(r3.mailAddress).equals("schneier@tutanota.com")
		o(r3.name).equals("")
		o(r3.type).equals(recipientInfoType.internal)
		o(r3.contact).equals(null)
	})


	o(" parserMailtoUrl single address", function () {
		let result = parseMailtoUrl("mailto:chris@example.com")
		o(result.to.length).equals(1)
		o(result.to[0].address).equals("chris@example.com")
		o(result.subject).equals("")
		o(result.body).equals("")
	})

	o(" parserMailtoUrl with subject and body", function () {
		let result = parseMailtoUrl("mailto:someone@example.com?subject=This%20is%20the%20subject&cc=someone_else@example.com&body=This%20is%20the%20body%0AKind regards%20someone")
		o(result.to.length).equals(1)
		o(result.to[0].address).equals("someone@example.com")
		o(result.cc.length).equals(1)
		o(result.cc[0].address).equals("someone_else@example.com")
		o(result.subject).equals("This is the subject")
		o(result.body).equals("This is the body<br>Kind regards someone")
	})

	o(" parserMailtoUrl with multiple recipients", function () {
		let result = parseMailtoUrl("mailto:joe1@example.com,joe2@example.com?to=joe3@example.com&cc=bob1@example.com%2C%20bob2@example.com&body=hello&bcc=carol1@example.com%2C%20carol2@example.com")
		o(result.to.length).equals(3)
		o(result.to[0].address).equals("joe1@example.com")
		o(result.to[1].address).equals("joe2@example.com")
		o(result.to[2].address).equals("joe3@example.com")
		o(result.cc.length).equals(2)
		o(result.cc[0].address).equals("bob1@example.com")
		o(result.cc[1].address).equals("bob2@example.com")
		o(result.bcc.length).equals(2)
		o(result.bcc[0].address).equals("carol1@example.com")
		o(result.bcc[1].address).equals("carol2@example.com")
		o(result.body).equals("hello")
	})
	o(" parserMailtoUrl to lower case", function () {
		let result = parseMailtoUrl("	mailto:matthias@test.de?CC=matthias@test.de&BCC=matthias@test.de&Subject=Blah&Body=What%3F%20Everything%20encoded%20in%20mailto%3F")
		o(result.to.length).equals(1)
		o(result.to[0].address).equals("matthias@test.de")
		o(result.cc.length).equals(1)
		o(result.cc[0].address).equals("matthias@test.de")
		o(result.bcc.length).equals(1)
		o(result.bcc[0].address).equals("matthias@test.de")
		o(result.subject).equals("Blah")
		o(result.body).equals("What? Everything encoded in mailto?")
	})


}))