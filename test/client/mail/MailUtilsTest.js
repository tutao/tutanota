//@flow
import o from "ospec"
import {GroupType} from "../../../src/api/common/TutanotaConstants"
import {createRecipientInfo} from "../../../src/mail/model/MailUtils"
import {LoginControllerImpl, logins} from "../../../src/api/main/LoginController"
import {downcast} from "@tutao/tutanota-utils"
import {RecipientInfoType} from "../../../src/api/common/RecipientInfo"


o.spec("MailUtils", browser(function () {

	o.before(function () {
		const loginController: LoginControllerImpl = downcast(logins)
		loginController._userController = ({
			user: {
				_id: 'userId',
				memberships: [{groupType: GroupType.Contact, group: 'groupId'}]
			},
			isInternalUser: () => true
		}: any)
	})

	o("create contact from recipient info", function () {
		let r1 = createRecipientInfo("schneier@secure.com", "B. Schneier", null)
		o(r1.mailAddress).equals("schneier@secure.com")
		o(r1.name).equals("B. Schneier")
		o(r1.type).equals(RecipientInfoType.UNKNOWN)
		o(r1.contact).equals(null)

		let r2 = createRecipientInfo("schneier@tutanota.com", "B. Schneier", null)
		o(r2.mailAddress).equals("schneier@tutanota.com")
		o(r2.name).equals("B. Schneier")
		o(r2.type).equals(RecipientInfoType.INTERNAL)
		o(r2.contact).equals(null)

		let r3 = createRecipientInfo("schneier@tutanota.com", null, null)
		o(r3.mailAddress).equals("schneier@tutanota.com")
		o(r3.name).equals("")
		o(r3.type).equals(RecipientInfoType.INTERNAL)
		o(r3.contact).equals(null)
	})

}))