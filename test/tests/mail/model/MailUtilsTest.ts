import o from "ospec"
import { normalizeSubject } from "../../../../src/mail/model/MailUtils.js"

o.spec("MailUtils", function () {
	o.spec("normalizeSubject", function () {
		o("removes newlines", function () {
			o(normalizeSubject("blah\nblorp\nquack")).equals("blahblorpquack")
		})

		o("removes carriage returns", function () {
			o(normalizeSubject("Re: [tutao/tutanota] Remove or change single event of recurring\r\n events. (#1475)")).equals(
				"[tutao/tutanota] Remove or change single event of recurring events. (#1475)",
			)
		})

		o("removes re:", function () {
			o(normalizeSubject("re: my topic")).equals("my topic")
			o(normalizeSubject("Re: my topic")).equals("my topic")
			o(normalizeSubject("RE: my topic")).equals("my topic")
		})

		o("removes fwd:", function () {
			o(normalizeSubject("fwd: my topic")).equals("my topic")
			o(normalizeSubject("Fwd: my topic")).equals("my topic")
			o(normalizeSubject("FWD: my topic")).equals("my topic")
		})

		o("does not mangle subjects starting with re", function () {
			o(normalizeSubject("reconnect")).equals("reconnect")
		})
	})
})
