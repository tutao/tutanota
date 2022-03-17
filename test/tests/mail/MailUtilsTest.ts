import o from "ospec"
import {createRecipientInfo} from "../../../src/mail/model/MailUtils"
import {RecipientType} from "../../../src/api/common/recipients/Recipient.js"

o.spec("MailUtils", function () {
		o.spec("createRecipientInfo", function () {
			o("unknown", function () {
				const r1 = createRecipientInfo("schneier@secure.com", "B. Schneier", null)
				o(r1.mailAddress).equals("schneier@secure.com")
				o(r1.name).equals("B. Schneier")
				o(r1.type).equals(RecipientType.UNKNOWN)
				o(r1.contact).equals(null)
			})
			o("internal w/ name", function () {
				const r2 = createRecipientInfo("schneier@tutanota.com", "B. Schneier", null)
				o(r2.mailAddress).equals("schneier@tutanota.com")
				o(r2.name).equals("B. Schneier")
				o(r2.type).equals(RecipientType.INTERNAL)
				o(r2.contact).equals(null)
			})
			o("internal w/o name", function () {
				const r3 = createRecipientInfo("schneier@tutanota.com", null, null)
				o(r3.mailAddress).equals("schneier@tutanota.com")
				o(r3.name).equals("")
				o(r3.type).equals(RecipientType.INTERNAL)
				o(r3.contact).equals(null)
			})
		})
	}
)