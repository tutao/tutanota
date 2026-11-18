import o from "@tutao/otest"
import { downcast } from "../../../src/platform-kit/utils"
import {
	createCompanyEmailSignatureHtml,
	fillCompanyEmailSignatureTemplate,
	getDefaultCompanyEmailSignatureTemplate,
	getUsedCompanyEmailSignatureFields,
} from "../../../src/applications/mail-app/mail/signature/CompanyEmailSignature.js"
import { parseCompanyEmailSignatureUrl } from "../../../src/applications/mail-app/settings/EditCompanyEmailSignatureDialog"

o.spec("CompanyEmailSignatureTest", function () {
	const data = downcast({ name: "Jane Doe", email: "jane@example.com", phoneNumber: "123", role: "CEO" })

	o("fill - all values", function () {
		const all = downcast({
			name: "Jane Doe",
			role: "CEO",
			department: "Management",
			address: "Street 1",
			email: "jane@example.com",
			phoneNumber: "123",
			mobileNumber: "456",
			custom1: "C1",
			custom2: "C2",
		})
		o(fillCompanyEmailSignatureTemplate(getDefaultCompanyEmailSignatureTemplate(), all)).equals(
			"<div>Jane Doe</div><div>CEO</div><div>Management</div><div>Street 1</div><div>jane@example.com</div><div>123</div><div>456</div><div>C1</div><div>C2</div>",
		)
	})
	o("fill - empty and missing values are replaced by an empty string", function () {
		const partial = downcast({ name: "Jane Doe", email: "jane@example.com", phoneNumber: null, role: "" })
		o(fillCompanyEmailSignatureTemplate("<div>{name}</div><div>{role}</div><div>{phoneNumber}</div><div>{email}</div>", partial)).equals(
			"<div>Jane Doe</div><div></div><div></div><div>jane@example.com</div>",
		)
	})
	o("fill - values are trimmed", function () {
		o(fillCompanyEmailSignatureTemplate("{name}", downcast({ name: "  Jane  " }))).equals("Jane")
	})
	o("fill - attributes", function () {
		o(fillCompanyEmailSignatureTemplate('<a href="mailto:{email}">{email}</a>', data)).equals('<a href="mailto:jane@example.com">jane@example.com</a>')
	})
	o("used fields are the ones with a placeholder in the template", function () {
		o(Array.from(getUsedCompanyEmailSignatureFields("<div>{name}</div><p>{mobileNumber} {mobileNumber}</p><i>{custom2}</i>{unknown}")).sort()).deepEquals([
			"custom2",
			"mobileNumber",
			"name",
		])
	})
	o("fill - additional fields", function () {
		const all = downcast({
			name: "N",
			email: "E",
			phoneNumber: "P",
			mobileNumber: "M",
			role: "R",
			department: "D",
			address: "A",
			custom1: "C1",
			custom2: "",
		})
		o(fillCompanyEmailSignatureTemplate("{mobileNumber}|{address}|{custom1}|{custom2}|{department}", all)).equals("M|A|C1||D")
	})
	o("create - empty template gives nothing", function () {
		o(createCompanyEmailSignatureHtml("  ", data)).equals(null)
		o(createCompanyEmailSignatureHtml(null, data)).equals(null)
	})
	o("create - filled and sanitized", function () {
		o(createCompanyEmailSignatureHtml("<div>{name}</div><script>alert(1)</script>", data)).equals("<div>Jane Doe</div>")
	})
	o("links", function () {
		o(parseCompanyEmailSignatureUrl("https://tuta.com")).deepEquals({ linkText: "https://tuta.com", url: "https://tuta.com/" })
		o(parseCompanyEmailSignatureUrl("www.tuta.com")).deepEquals({ linkText: "www.tuta.com", url: "https://www.tuta.com/" })
		o(parseCompanyEmailSignatureUrl("[Our site](https://tuta.com/a)")).deepEquals({ linkText: "Our site", url: "https://tuta.com/a" })
		o(parseCompanyEmailSignatureUrl("[Mail us](mailto:a@b.com)")).deepEquals({ linkText: "Mail us", url: "mailto:a@b.com" })
		o(parseCompanyEmailSignatureUrl("[x](javascript:alert(1))")).equals(null)
		o(parseCompanyEmailSignatureUrl("just text")).equals(null)
	})
})
