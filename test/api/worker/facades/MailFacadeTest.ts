import o from "ospec"
import {MailFacade, phishingMarkerValue} from "../../../../src/api/worker/facades/MailFacade"
import {downcast} from "@tutao/tutanota-utils"
import {createMail} from "../../../../src/api/entities/tutanota/TypeRefs.js"
import {createMailAddress} from "../../../../src/api/entities/tutanota/TypeRefs.js"
import {MailAuthenticationStatus, ReportedMailFieldType} from "../../../../src/api/common/TutanotaConstants"
import {createPhishingMarker} from "../../../../src/api/entities/tutanota/TypeRefs.js"
import {object} from "testdouble"
import {CryptoFacade} from "../../../../src/api/worker/crypto/CryptoFacade"
import {IServiceExecutor} from "../../../../src/api/common/ServiceRequest"
import {LoginFacade, LoginFacadeImpl} from "../../../../src/api/worker/facades/LoginFacade"
import {FileFacade} from "../../../../src/api/worker/facades/FileFacade"
import {EntityClient} from "../../../../src/api/common/EntityClient"
import {BlobFacade} from "../../../../src/api/worker/facades/BlobFacade"

o.spec("MailFacade test", function () {
	let facade: MailFacade
	let loginFacade: LoginFacadeImpl
	let cryptoFacade: CryptoFacade
	let serviceExecutor: IServiceExecutor
	let fileFacade: FileFacade
	let entity: EntityClient
	let blobFacade: BlobFacade

	o.beforeEach(function () {
		loginFacade = object()
		blobFacade = object()
		fileFacade = object()
		entity = object()
		cryptoFacade = object()
		serviceExecutor = object()
		facade = new MailFacade(loginFacade, fileFacade, blobFacade, entity, cryptoFacade, serviceExecutor)
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
			o(await facade.checkMailForPhishing(mail, [{href: "https://example.com", innerHTML: "link"}])).equals(false)
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
			facade.phishingMarkersUpdateReceived([
				createPhishingMarker({
					marker: phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Test 2"),
				}),
				createPhishingMarker({
					marker: phishingMarkerValue(ReportedMailFieldType.FROM_DOMAIN, "example2.com")
				})
			])

			o(await facade.checkMailForPhishing(mail, [{href: "https://example.com", innerHTML: "link"}])).equals(false)
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
			facade.phishingMarkersUpdateReceived([
				createPhishingMarker({
					marker: phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Test 2"),
				}),
				createPhishingMarker({
					marker: phishingMarkerValue(ReportedMailFieldType.FROM_DOMAIN, "example.com")
				})
			])

			o(await facade.checkMailForPhishing(mail, [{href: "https://example.com", innerHTML: "link"}])).equals(false)
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
			facade.phishingMarkersUpdateReceived([
				createPhishingMarker({
					marker: phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Test"),
				}),
				createPhishingMarker({
					marker: phishingMarkerValue(ReportedMailFieldType.FROM_DOMAIN, "example2.com")
				})
			])

			o(await facade.checkMailForPhishing(mail, [{href: "https://example.com", innerHTML: "link"}])).equals(false)
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
			facade.phishingMarkersUpdateReceived([
				createPhishingMarker({
					marker: phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Test"),
				}),
				createPhishingMarker({
					marker: phishingMarkerValue(ReportedMailFieldType.FROM_DOMAIN, "example.com")
				})
			])

			o(await facade.checkMailForPhishing(mail, [{href: "https://example.com", innerHTML: "link"}])).equals(true)
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
			facade.phishingMarkersUpdateReceived([
				createPhishingMarker({
					marker: phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Testspaces"),
				}),
				createPhishingMarker({
					marker: phishingMarkerValue(ReportedMailFieldType.FROM_DOMAIN, "example.com")
				})
			])

			o(await facade.checkMailForPhishing(mail, [{href: "https://example.com", innerHTML: "link"}])).equals(true)
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
			facade.phishingMarkersUpdateReceived([
				createPhishingMarker({
					marker: phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Test"),
				}),
				createPhishingMarker({
					marker: phishingMarkerValue(ReportedMailFieldType.FROM_DOMAIN, "example.com")
				})
			])

			o(await facade.checkMailForPhishing(mail, [{href: "https://example.com", innerHTML: "link"}])).equals(false)
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
			facade.phishingMarkersUpdateReceived([
				createPhishingMarker({
					marker: phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Test"),
				}),
				createPhishingMarker({
					marker: phishingMarkerValue(ReportedMailFieldType.FROM_ADDRESS, "test@example.com")
				})
			])

			o(await facade.checkMailForPhishing(mail, [{href: "https://example.com", innerHTML: "link"}])).equals(true)
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
			facade.phishingMarkersUpdateReceived([
				createPhishingMarker({
					marker: phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Test"),
				}),
				createPhishingMarker({
					marker: phishingMarkerValue(ReportedMailFieldType.FROM_ADDRESS, "test@example.com")
				})
			])

			o(await facade.checkMailForPhishing(mail, [{href: "https://example.com", innerHTML: "link"}])).equals(false)
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
			facade.phishingMarkersUpdateReceived([
				createPhishingMarker({
					marker: phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Test"),
				}),
				createPhishingMarker({
					marker: phishingMarkerValue(ReportedMailFieldType.FROM_DOMAIN_NON_AUTH, "example.com")
				})
			])

			o(await facade.checkMailForPhishing(mail, [{href: "https://example.com", innerHTML: "link"}])).equals(true)
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
			facade.phishingMarkersUpdateReceived([
				createPhishingMarker({
					marker: phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Test"),
				}),
				createPhishingMarker({
					marker: phishingMarkerValue(ReportedMailFieldType.FROM_ADDRESS_NON_AUTH, "test@example.com")
				})
			])

			o(await facade.checkMailForPhishing(mail, [{href: "https://example.com", innerHTML: "link"}])).equals(true)
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
			facade.phishingMarkersUpdateReceived([
				createPhishingMarker({
					marker: phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Test"),
				}),
				createPhishingMarker({
					marker: phishingMarkerValue(ReportedMailFieldType.LINK, "https://example.com")
				})
			])

			o(await facade.checkMailForPhishing(mail, [{href: "https://example.com", innerHTML: "link"}])).equals(true)
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
			facade.phishingMarkersUpdateReceived([
				createPhishingMarker({
					marker: phishingMarkerValue(ReportedMailFieldType.LINK, "https://example.com"),
				}),
				createPhishingMarker({
					marker: phishingMarkerValue(ReportedMailFieldType.LINK, "https://example2.com")
				})
			])

			o(await facade.checkMailForPhishing(
				mail, [
					{href: "https://example.com", innerHTML: "link1"},
					{href: "https://example2.com", innerHTML: "link2"}
				]
			)).equals(false)
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
			facade.phishingMarkersUpdateReceived([
				createPhishingMarker({
					marker: phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Test"),
				}),
				createPhishingMarker({
					marker: phishingMarkerValue(ReportedMailFieldType.LINK_DOMAIN, "example.com")
				})
			])

			o(await facade.checkMailForPhishing(mail, [{href: "https://example.com", innerHTML: "link"}])).equals(true)
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
			facade.phishingMarkersUpdateReceived([
				createPhishingMarker({
					marker: phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Test"),
				}),
				createPhishingMarker({
					marker: phishingMarkerValue(ReportedMailFieldType.LINK_DOMAIN, "example.com")
				})
			])

			o(await facade.checkMailForPhishing(mail, [
				{href: "/example1", innerHTML: "link1"},
				{href: "example2", innerHTML: "link2"},
				{href: "http:/", innerHTML: "link3"}
			])).equals(false)
		})

		o("is phishing if subject and suspicious link", async function () {
			const mail = createMail({
				subject: "Test",
				authStatus: MailAuthenticationStatus.AUTHENTICATED,
				sender: createMailAddress({
					name: "a",
					address: "test@example.com"
				})
			})
			facade.phishingMarkersUpdateReceived([
				createPhishingMarker({
					marker: phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Test"),
				}),
			])

			o(await facade.checkMailForPhishing(mail, [{href: "https://example.com", innerHTML: "https://evil-domain.com"}])).equals(true)
		})

		o("link is not suspicious if on the same domain", async function () {
			const mail = createMail({
				subject: "Test",
				authStatus: MailAuthenticationStatus.AUTHENTICATED,
				sender: createMailAddress({
					name: "a",
					address: "test@example.com"
				})
			})
			facade.phishingMarkersUpdateReceived([
				createPhishingMarker({
					marker: phishingMarkerValue(ReportedMailFieldType.SUBJECT, "Test"),
				}),
			])

			o(await facade.checkMailForPhishing(mail, [{href: "https://example.com", innerHTML: "https://example.com/test"}])).equals(false)
		})
	})
})