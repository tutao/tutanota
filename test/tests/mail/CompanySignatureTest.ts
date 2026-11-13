import o from "@tutao/otest"
import { downcast } from "../../../src/platform-kit/utils"
import {
	createCompanySignatureHtml,
	fillCompanySignatureTemplate,
	getDefaultCompanySignatureTemplate,
} from "../../../src/applications/mail-app/mail/signature/CompanySignature.js"

o.spec("CompanySignatureTest", function () {
	const data = downcast({ name: "Jane Doe", email: "jane@example.com", phoneNumber: "123", role: "CEO" })

	o("fill - all values", function () {
		o(fillCompanySignatureTemplate(getDefaultCompanySignatureTemplate(), data)).equals(
			"<div>Jane Doe</div><div>CEO</div><div>jane@example.com</div><div>123</div>",
		)
	})
	o("fill - empty values remove their line", function () {
		const partial = downcast({ name: "Jane Doe", email: "jane@example.com", phoneNumber: null, role: "" })
		o(fillCompanySignatureTemplate(getDefaultCompanySignatureTemplate(), partial)).equals("<div>Jane Doe</div><div>jane@example.com</div>")
	})
	o("fill - line is kept if another placeholder in it has a value", function () {
		const partial = downcast({ name: "Jane", email: "jane@example.com", phoneNumber: "", role: "" })
		o(fillCompanySignatureTemplate("<p>Tel: {phone} Mail: {email}</p>", partial)).equals("<p>Tel:  Mail: jane@example.com</p>")
	})
	o("fill - lines separated by br", function () {
		const partial = downcast({ name: "Jane", email: "jane@example.com", phoneNumber: "", role: "" })
		o(fillCompanySignatureTemplate("{name}<br>Tel: {phone}<br>{email}", partial)).equals("Jane<br>{email}".replace("{email}", "jane@example.com"))
	})
	o("fill - values are inserted as text", function () {
		const evil = downcast({ name: "<img src=x onerror=alert(1)>", email: "", phoneNumber: "", role: "" })
		o(fillCompanySignatureTemplate("<div>{name}</div>", evil)).equals("<div>&lt;img src=x onerror=alert(1)&gt;</div>")
	})
	o("fill - attributes", function () {
		o(fillCompanySignatureTemplate('<a href="mailto:{email}">{email}</a>', data)).equals('<a href="mailto:jane@example.com">jane@example.com</a>')
	})
	o("create - empty template gives nothing", function () {
		o(createCompanySignatureHtml("  ", data)).equals(null)
		o(createCompanySignatureHtml(null, data)).equals(null)
	})
	o("create - filled and sanitized", function () {
		o(createCompanySignatureHtml("<div>{name}</div><script>alert(1)</script>", data)).equals("<div>Jane Doe</div>")
	})
})
