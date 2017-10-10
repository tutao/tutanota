//@flow
import o from "ospec/ospec.js"
import {ContactAddressType, GroupType} from "../../../src/api/common/TutanotaConstants"
import {createRecipientInfo, parseMailtoUrl} from "../../../src/mail/MailUtils"
import {logins} from "../../../src/api/main/LoginController"
import {neverNull} from "../../../src/api/common/utils/Utils"


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
		let r1 = neverNull(createRecipientInfo("schneier@secure.com", "B. Schneier", null))
		o(neverNull(r1.contact)).notEquals(null)
		o(neverNull(r1.contact)._owner).equals('userId')
		o(neverNull(r1.contact)._ownerGroup).equals('groupId')
		o(neverNull(r1.contact).mailAddresses.length).equals(1)
		o(neverNull(r1.contact).mailAddresses[0].address).equals("schneier@secure.com")
		o(neverNull(r1.contact).mailAddresses[0].type).equals(ContactAddressType.OTHER)
		o(neverNull(r1.contact).firstName).equals("B.")
		o(neverNull(r1.contact).lastName).equals("Schneier")

		let r2 = createRecipientInfo("schneier@secure.com", "Bruce", null)
		o(neverNull(r2.contact).firstName).equals("Bruce")
		o(neverNull(r2.contact).lastName).equals("")

		var r3 = createRecipientInfo("schneier@secure.com", "B M A", null)
		o(neverNull(r3.contact).firstName).equals("B")
		o(neverNull(r3.contact).lastName).equals("M A")

		var r4 = createRecipientInfo("schneier@secure.com", "", null)
		o(neverNull(r4.contact).firstName).equals("Schneier")
		o(neverNull(r4.contact).lastName).equals("")

		var r5 = createRecipientInfo("bruce.schneier@secure.com", "", null)
		o(neverNull(r5.contact).firstName).equals("Bruce")
		o(neverNull(r5.contact).lastName).equals("Schneier")

		var r6 = createRecipientInfo("bruce_schneier_schneier@secure.com", "", null)
		o(neverNull(r6.contact).firstName).equals("Bruce")
		o(neverNull(r6.contact).lastName).equals("Schneier Schneier")

		var r7 = createRecipientInfo("bruce-schneier@secure.com", "", null)
		o(neverNull(r7.contact).firstName).equals("Bruce")
		o(neverNull(r7.contact).lastName).equals("Schneier")
	})


	o(" parserMailtoUrl single address", function () {
		let result = parseMailtoUrl("mailto:chris@example.com")
		o(result.to.length).equals(1)
		o(result.to[0].address).equals("chris@example.com")
		o(result.subject).equals("")
		o(result.body).equals("")
	})

	o(" parserMailtoUrl with subject and body", function () {
		let result = parseMailtoUrl("mailto:someone@example.com?subject=This%20is%20the%20subject&cc=someone_else@example.com&body=This%20is%20the%20body%0D%0AKind regards%20someone")
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

}))