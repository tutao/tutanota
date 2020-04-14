//@flow
import o from "ospec/ospec.js"
import {MailFacade, phishingMarkerValue} from "../../../../src/api/worker/facades/MailFacade"
import {downcast} from "../../../../src/api/common/utils/Utils"
import {createMail} from "../../../../src/api/entities/tutanota/Mail"
import {createMailAddress} from "../../../../src/api/entities/tutanota/MailAddress"
import {MailAuthenticationStatus, ReportedMailFieldType} from "../../../../src/api/common/TutanotaConstants"

o.spec("MailFacade test", function () {
	let facade: MailFacade
	o.beforeEach(function () {
		facade = new MailFacade(downcast({}), downcast({}))
	})

	o.spec("checkMailForPhishing", function () {
		o("not phishing if no markers", async function () {
			const mail = createMail({
				subject: "Test",
				authStatus: MailAuthenticationStatus.AUTHENTICATED,
				sender: createMailAddress({
					name: "a",
					address: "test@example.com",
				})
			})
			o(await facade.checkMailForPhishing(mail, ["https://example.com"], new Set())).equals(false)
		})

		o("not phishing if no matching markers", async function () {
			const mail = createMail({
				subject: "Test",
				authStatus: MailAuthenticationStatus.AUTHENTICATED,
				sender: createMailAddress({
					name: "a",
					address: "test@example.com"
				})
			})
			const markers = new Set()
			markers.add(phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Test 2"))
			markers.add(phishingMarkerValue(ReportedMailFieldType.FROM_DOMAIN, "example2.com"))

			o(await facade.checkMailForPhishing(mail, ["https://example.com"], new Set())).equals(false)
		})

		o("not phishing if only from domain matches", async function () {
			const mail = createMail({
				subject: "Test",
				authStatus: MailAuthenticationStatus.AUTHENTICATED,
				sender: createMailAddress({
					name: "a",
					address: "test@example.com"
				})
			})
			const markers = new Set()
			markers.add(phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Test 2"))
			markers.add(phishingMarkerValue(ReportedMailFieldType.FROM_DOMAIN, "example.com"))

			o(await facade.checkMailForPhishing(mail, ["https://example.com"], new Set())).equals(false)
		})

		o("not phishing if only subject matches", async function () {
			const mail = createMail({
				subject: "Test",
				authStatus: MailAuthenticationStatus.AUTHENTICATED,
				sender: createMailAddress({
					name: "a",
					address: "test@example.com"
				})
			})
			const markers = new Set()
			markers.add(phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Test"))
			markers.add(phishingMarkerValue(ReportedMailFieldType.FROM_DOMAIN, "example2.com"))

			o(await facade.checkMailForPhishing(mail, ["https://example.com"], new Set())).equals(false)
		})

		o("is phishing if subject and sender domain matches", async function () {
			const mail = createMail({
				subject: "Test",
				authStatus: MailAuthenticationStatus.AUTHENTICATED,
				sender: createMailAddress({
					name: "a",
					address: "test@example.com"
				})
			})
			const markers = new Set()
			markers.add(phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Test"))
			markers.add(phishingMarkerValue(ReportedMailFieldType.FROM_DOMAIN, "example.com"))

			o(await facade.checkMailForPhishing(mail, ["https://example.com"], markers)).equals(true)
		})

		o("is phishing if subject with whitespaces and sender domain matches", async function () {
			const mail = createMail({
				subject: "\tTest spaces \n",
				authStatus: MailAuthenticationStatus.AUTHENTICATED,
				sender: createMailAddress({
					name: "a",
					address: "test@example.com"
				})
			})
			const markers = new Set()
			markers.add(phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Testspaces"))
			markers.add(phishingMarkerValue(ReportedMailFieldType.FROM_DOMAIN, "example.com"))

			o(await facade.checkMailForPhishing(mail, ["https://example.com"], markers)).equals(true)
		})

		o("is not phishing if subject and sender domain matches but not authenticated", async function () {
			const mail = createMail({
				subject: "Test",
				authStatus: MailAuthenticationStatus.SOFT_FAIL,
				sender: createMailAddress({
					name: "a",
					address: "test@example.com"
				})
			})
			const markers = new Set()
			markers.add(phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Test"))
			markers.add(phishingMarkerValue(ReportedMailFieldType.FROM_DOMAIN, "example.com"))

			o(await facade.checkMailForPhishing(mail, ["https://example.com"], markers)).equals(false)
		})

		o("is phishing if subject and sender address matches", async function () {
			const mail = createMail({
				subject: "Test",
				authStatus: MailAuthenticationStatus.AUTHENTICATED,
				sender: createMailAddress({
					name: "a",
					address: "test@example.com"
				})
			})
			const markers = new Set()
			markers.add(phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Test"))
			markers.add(phishingMarkerValue(ReportedMailFieldType.FROM_ADDRESS, "test@example.com"))

			o(await facade.checkMailForPhishing(mail, ["https://example.com"], markers)).equals(true)
		})

		o("is not phishing if subject and sender address matches but not authenticated", async function () {
			const mail = createMail({
				subject: "Test",
				authStatus: MailAuthenticationStatus.SOFT_FAIL,
				sender: createMailAddress({
					name: "a",
					address: "test@example.com"
				})
			})
			const markers = new Set()
			markers.add(phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Test"))
			markers.add(phishingMarkerValue(ReportedMailFieldType.FROM_ADDRESS, "test@example.com"))

			o(await facade.checkMailForPhishing(mail, ["https://example.com"], markers)).equals(false)
		})

		o("is phishing if subject and non auth sender domain matches", async function () {
			const mail = createMail({
				subject: "Test",
				authStatus: MailAuthenticationStatus.SOFT_FAIL,
				sender: createMailAddress({
					name: "a",
					address: "test@example.com"
				})
			})
			const markers = new Set()
			markers.add(phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Test"))
			markers.add(phishingMarkerValue(ReportedMailFieldType.FROM_DOMAIN_NON_AUTH, "example.com"))

			o(await facade.checkMailForPhishing(mail, ["https://example.com"], markers)).equals(true)
		})

		o("is phishing if subject and non auth sender address matches", async function () {
			const mail = createMail({
				subject: "Test",
				authStatus: MailAuthenticationStatus.SOFT_FAIL,
				sender: createMailAddress({
					name: "a",
					address: "test@example.com"
				})
			})
			const markers = new Set()
			markers.add(phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Test"))
			markers.add(phishingMarkerValue(ReportedMailFieldType.FROM_ADDRESS_NON_AUTH, "test@example.com"))

			o(await facade.checkMailForPhishing(mail, ["https://example.com"], markers)).equals(true)
		})

		o("is phishing if subject and link matches", async function () {
			const mail = createMail({
				subject: "Test",
				authStatus: MailAuthenticationStatus.AUTHENTICATED,
				sender: createMailAddress({
					name: "a",
					address: "test@example.com"
				})
			})
			const markers = new Set()
			markers.add(phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Test"))
			markers.add(phishingMarkerValue(ReportedMailFieldType.LINK, "https://example.com"))

			o(await facade.checkMailForPhishing(mail, ["https://example.com"], markers)).equals(true)
		})

		o("is not phishing if just two links match", async function () {
			const mail = createMail({
				subject: "Test",
				authStatus: MailAuthenticationStatus.AUTHENTICATED,
				sender: createMailAddress({
					name: "a",
					address: "test@example.com"
				})
			})
			const markers = new Set()
			markers.add(phishingMarkerValue(ReportedMailFieldType.LINK, "https://example.com"))
			markers.add(phishingMarkerValue(ReportedMailFieldType.LINK, "https://example2.com"))

			o(await facade.checkMailForPhishing(mail, ["https://example.com", "https://example2.com"], markers)).equals(false)
		})

		o("is phishing if subject and link domain matches", async function () {
			const mail = createMail({
				subject: "Test",
				authStatus: MailAuthenticationStatus.AUTHENTICATED,
				sender: createMailAddress({
					name: "a",
					address: "test@example.com"
				})
			})
			const markers = new Set()
			markers.add(phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Test"))
			markers.add(phishingMarkerValue(ReportedMailFieldType.LINK_DOMAIN, "example.com"))

			o(await facade.checkMailForPhishing(mail, ["https://example.com"], markers)).equals(true)
		})

		o("does not throw on invalid link", async function () {
			const mail = createMail({
				subject: "Test",
				authStatus: MailAuthenticationStatus.AUTHENTICATED,
				sender: createMailAddress({
					name: "a",
					address: "test@example.com"
				})
			})
			const markers = new Set()
			markers.add(phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Test"))
			markers.add(phishingMarkerValue(ReportedMailFieldType.LINK_DOMAIN, "example.com"))

			o(await facade.checkMailForPhishing(mail, ["/example1", "example2", "http:/"], markers)).equals(false)
		})
	})
})