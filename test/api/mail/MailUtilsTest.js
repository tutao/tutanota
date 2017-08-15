//@flow
import o from "ospec/ospec.js"
import {ContactAddressType, GroupType} from "../../../src/api/common/TutanotaConstants"
import {createRecipientInfo} from "../../../src/mail/MailUtils"
import {logins} from "../../../src/api/main/LoginController"
import {neverNull} from "../../../src/api/common/utils/Utils"


o.spec("MailUtils", function () {

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

})