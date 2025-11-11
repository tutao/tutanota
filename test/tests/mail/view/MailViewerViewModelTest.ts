import o from "@tutao/otest"
import {
	FailureBannerType,
	LIST_UNSUBSCRIBE_POST_PAYLOAD,
	MailViewerViewModel,
	UnsubscribeType,
} from "../../../../src/mail-app/mail/view/MailViewerViewModel.js"
import {
	ConversationEntryTypeRef,
	HeaderTypeRef,
	Mail,
	MailAddressTypeRef,
	MailDetails,
	MailDetailsTypeRef,
	MailTypeRef,
	RecipientsTypeRef,
} from "../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { matchers, object, verify, when } from "testdouble"
import { EntityClient } from "../../../../src/common/api/common/EntityClient.js"
import { ConfigurationDatabase } from "../../../../src/common/api/worker/facades/lazy/ConfigurationDatabase.js"
import { LoginController } from "../../../../src/common/api/main/LoginController.js"
import { EventController } from "../../../../src/common/api/main/EventController.js"
import { WorkerFacade } from "../../../../src/common/api/worker/facades/WorkerFacade.js"
import { NotFoundError } from "../../../../src/common/api/common/error/RestError.js"
import { SearchModel } from "../../../../src/mail-app/search/model/SearchModel.js"
import { MailFacade } from "../../../../src/common/api/worker/facades/lazy/MailFacade.js"
import { FileController } from "../../../../src/common/file/FileController.js"
import { createTestEntity } from "../../TestUtils.js"
import {
	EncryptionAuthStatus,
	ExternalImageRule,
	MailAuthenticationStatus,
	MailPhishingStatus,
	MailState,
} from "../../../../src/common/api/common/TutanotaConstants.js"
import { GroupInfoTypeRef } from "../../../../src/common/api/entities/sys/TypeRefs.js"
import { CryptoFacade } from "../../../../src/common/api/worker/crypto/CryptoFacade.js"
import { ContactImporter } from "../../../../src/mail-app/contacts/ContactImporter.js"
import { MailboxDetail, MailboxModel } from "../../../../src/common/mailFunctionality/MailboxModel.js"
import { ContactModel } from "../../../../src/common/contactsFunctionality/ContactModel.js"
import { SendMailModel } from "../../../../src/common/mailFunctionality/SendMailModel.js"
import { MailModel } from "../../../../src/mail-app/mail/model/MailModel.js"
import { downcast } from "@tutao/tutanota-utils"
import { CalendarEventsRepository } from "../../../../src/common/calendar/date/CalendarEventsRepository"
import { UndoModel } from "../../../../src/mail-app/UndoModel"
import { isBrowser } from "../../../../src/common/api/common/Env"
import { CommonSystemFacade } from "../../../../src/common/native/common/generatedipc/CommonSystemFacade"
import { unsubscribe } from "../../../../src/mail-app/mail/view/MailViewerUtils"

o.spec("MailViewerViewModel", function () {
	let mail: Mail
	let mailDetails: MailDetails
	let showFolder: boolean = false
	let entityClient: EntityClient

	let mailModel: MailModel
	let commonSystemFacade: CommonSystemFacade
	let mailboxModel: MailboxModel
	let contactModel: ContactModel
	let configFacade: ConfigurationDatabase
	let fileController: FileController
	let logins: LoginController
	let eventController: EventController
	let workerFacade: WorkerFacade
	let searchModel: SearchModel
	let mailFacade: MailFacade
	let sendMailModel: SendMailModel
	let cryptoFacade: CryptoFacade
	let contactImporter: ContactImporter
	let eventsRepository: CalendarEventsRepository
	let undoModel: UndoModel

	function makeViewModelWithHeaders(headers: string) {
		entityClient = object()
		mailModel = object()
		commonSystemFacade = object()
		mailboxModel = object()
		contactModel = object()
		configFacade = object()
		fileController = object()
		logins = object()
		sendMailModel = object()
		eventController = object()
		workerFacade = object()
		searchModel = object()
		mailFacade = object()
		cryptoFacade = object()
		contactImporter = object()
		eventsRepository = object()
		prepareMailWithHeaders(mailFacade, headers)
		undoModel = object()

		return new MailViewerViewModel(
			mail,
			showFolder,
			entityClient,
			mailboxModel,
			mailModel,
			commonSystemFacade,
			contactModel,
			configFacade,
			fileController,
			logins,
			eventController,
			workerFacade,
			searchModel,
			mailFacade,
			cryptoFacade,
			async () => contactImporter,
			[],
			eventsRepository,
			undoModel,
		)
	}

	function prepareMailWithHeaders(mailFacade: MailFacade, headers: string) {
		const toRecipients = [
			createTestEntity(MailAddressTypeRef, {
				name: "Ma",
				address: "ma@tuta.com",
			}),
		]
		mail = createTestEntity(MailTypeRef, {
			_id: ["mailListId", "mailId"],
			listUnsubscribe: true,
			mailDetails: ["mailDetailsListId", "mailDetailsId"],
			state: MailState.RECEIVED,
			sender: createTestEntity(MailAddressTypeRef, {
				name: "ListSender",
				address: "sender@list.com",
			}),
		})
		mailDetails = createTestEntity(MailDetailsTypeRef, {
			headers: createTestEntity(HeaderTypeRef, {
				headers,
			}),
			recipients: createTestEntity(RecipientsTypeRef, {
				toRecipients,
			}),
			body: object(),
		})
		mailDetails.body.text = "Hello World"
		mailDetails.body.compressedText = null
		downcast(mailDetails.body)._errors = undefined
		when(mailFacade.loadMailDetailsBlob(mail)).thenResolve(mailDetails)
		when(configFacade.getExternalImageRule(mail.sender.address)).thenResolve(ExternalImageRule.None)
		when(mailModel.checkMailForPhishing(matchers.anything(), matchers.anything())).thenResolve(false)
		when(entityClient.load(ConversationEntryTypeRef, mail.conversationEntry)).thenResolve(object())
		when(workerFacade.urlify(matchers.anything())).thenResolve("")
		when(commonSystemFacade.executePostRequest(matchers.anything(), matchers.anything())).thenResolve(true)
	}

	o.spec("renderFailureBanner", function () {
		let viewModel: MailViewerViewModel
		let mailDetails: MailDetails
		o.beforeEach(async function () {
			viewModel = makeViewModelWithHeaders("")
			viewModel.mail.phishingStatus = MailPhishingStatus.UNKNOWN
			viewModel.setWarningDismissed(false)
			viewModel.mail.encryptionAuthStatus = EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_SUCCEEDED
			mailDetails = await mailFacade.loadMailDetailsBlob(viewModel.mail)
			mailDetails.authStatus = MailAuthenticationStatus.AUTHENTICATED
		})

		o.spec("mailDetails not loaded", function () {
			o("no banner and no error when accessing authStatus from unloaded mailDetails", async function () {
				mailDetails.authStatus = MailAuthenticationStatus.HARD_FAIL
				o(FailureBannerType.None).equals(viewModel.mustRenderFailureBanner())
			})
		})

		o.spec("mailDetails loaded", function () {
			o.beforeEach(async function () {
				await viewModel.loadAll(Promise.resolve(), { notify: false })
			})

			o("no banner", async function () {
				o(FailureBannerType.None).equals(viewModel.mustRenderFailureBanner())
			})

			o("is phishing", async function () {
				viewModel.mail.phishingStatus = MailPhishingStatus.SUSPICIOUS
				mailDetails.authStatus = MailAuthenticationStatus.HARD_FAIL
				viewModel.setWarningDismissed(true)
				o(FailureBannerType.Phishing).equals(viewModel.mustRenderFailureBanner())
			})

			o("no banner if warning is dismissed", async function () {
				viewModel.setWarningDismissed(true)
				mailDetails.authStatus = MailAuthenticationStatus.HARD_FAIL
				o(FailureBannerType.None).equals(viewModel.mustRenderFailureBanner())

				mailDetails.authStatus = MailAuthenticationStatus.SOFT_FAIL
				o(FailureBannerType.None).equals(viewModel.mustRenderFailureBanner())

				mailDetails.authStatus = MailAuthenticationStatus.AUTHENTICATED
				viewModel.mail.encryptionAuthStatus = EncryptionAuthStatus.RSA_DESPITE_TUTACRYPT
				o(FailureBannerType.None).equals(viewModel.mustRenderFailureBanner())

				viewModel.mail.encryptionAuthStatus = EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_FAILED
				o(FailureBannerType.None).equals(viewModel.mustRenderFailureBanner())
			})

			o("is hard fail", async function () {
				mailDetails.authStatus = MailAuthenticationStatus.HARD_FAIL
				o(FailureBannerType.MailAuthenticationHardFail).equals(viewModel.mustRenderFailureBanner())

				mailDetails.authStatus = MailAuthenticationStatus.INVALID_MAIL_FROM
				o(FailureBannerType.MailAuthenticationHardFail).equals(viewModel.mustRenderFailureBanner())

				mailDetails.authStatus = MailAuthenticationStatus.MISSING_MAIL_FROM
				o(FailureBannerType.MailAuthenticationHardFail).equals(viewModel.mustRenderFailureBanner())

				mailDetails.authStatus = MailAuthenticationStatus.AUTHENTICATED
				viewModel.mail.encryptionAuthStatus = EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_FAILED
				o(FailureBannerType.MailAuthenticationHardFail).equals(viewModel.mustRenderFailureBanner())
			})

			o("deprecated public key", async function () {
				mailDetails.authStatus = MailAuthenticationStatus.SOFT_FAIL
				viewModel.mail.encryptionAuthStatus = EncryptionAuthStatus.RSA_DESPITE_TUTACRYPT
				o(FailureBannerType.DeprecatedPublicKey).equals(viewModel.mustRenderFailureBanner())
			})

			o("soft fail", async function () {
				mailDetails.authStatus = MailAuthenticationStatus.SOFT_FAIL
				o(FailureBannerType.MailAuthenticationSoftFail).equals(viewModel.mustRenderFailureBanner())
			})
		})
	})

	o.spec("unsubscribe", function () {
		function initUnsubscribeHeaders(headers: string) {
			const viewModel = makeViewModelWithHeaders(headers)
			const mailGroupInfo = createTestEntity(GroupInfoTypeRef, {
				mailAddressAliases: [],
				mailAddress: "ma@tuta.com",
			})
			const mailboxDetail = { mailGroupInfo: mailGroupInfo } as MailboxDetail
			when(mailModel.getMailboxDetailsForMail(matchers.anything())).thenResolve(mailboxDetail)
			when(logins.getUserController()).thenReturn({ userGroupInfo: mailGroupInfo })
			return viewModel
		}

		async function testHeaderUnsubscribePost(headers: string, expectedUrl: string, expectedPostResult: boolean) {
			const viewModel = initUnsubscribeHeaders(headers)
			const unsubscribeActions = await viewModel.determineUnsubscribeOrder()

			const unsubscribeAction = unsubscribeActions.shift()!
			const postResult = await viewModel.unsubscribePost(unsubscribeAction)

			if (!isBrowser()) {
				verify(commonSystemFacade.executePostRequest(unsubscribeAction.requestUrl, LIST_UNSUBSCRIBE_POST_PAYLOAD), {
					times: expectedPostResult ? 1 : 0,
				})
			} else {
				verify(mailModel.serverUnsubscribe(mail, unsubscribeAction.requestUrl))
			}
			o(unsubscribeAction.requestUrl).equals(expectedUrl)
			o(postResult).equals(expectedPostResult)
		}

		o.spec("list-unsubscribe http url", function () {
			o("with GET unsubscribe url", async function () {
				const headers = ["List-Unsubscribe: <http://unsub.me?id=2134>, <mailto:unsubscribe@newsletter.de>"]
				const expectedGetUrl = "http://unsub.me?id=2134"
				await testHeaderUnsubscribePost(headers.join("\r\n"), expectedGetUrl, false)
			})
			o("with POST", async function () {
				const headers = [
					"List-Unsubscribe: <http://unsub.me?id=2134>, <mailto:unsubscribe@newsletter.de>",
					"List-Unsubscribe-Post: List-Unsubscribe=One-Click",
				]
				const expectedPostUrl = "http://unsub.me?id=2134"
				await testHeaderUnsubscribePost(headers.join("\r\n"), expectedPostUrl, true)
			})
			o("with POST whitespace", async function () {
				const headers = [
					"List-Unsubscribe:      <http://unsub.me?id=2134>, <mailto:unsubscribe@newsletter.de>",
					"List-Unsubscribe-Post: List-Unsubscribe=One-Click",
				]
				const expectedPostUrl = "http://unsub.me?id=2134"
				await testHeaderUnsubscribePost(headers.join("\r\n"), expectedPostUrl, true)
			})
			o("with POST tab", async function () {
				const headers = [
					"List-Unsubscribe:\t <http://unsub.me?id=2134>, <mailto:unsubscribe@newsletter.de>",
					"List-Unsubscribe-Post: List-Unsubscribe=One-Click",
				]
				const expectedPostUrl = "http://unsub.me?id=2134"
				await testHeaderUnsubscribePost(headers.join("\r\n"), expectedPostUrl, true)
			})
			o("with POST newline whitespace", async function () {
				const headers = [
					"List-Unsubscribe: \r\n <http://unsub.me?id=2134>, <mailto:unsubscribe@newsletter.de>",
					"List-Unsubscribe-Post: List-Unsubscribe=One-Click",
				]
				const expectedPostUrl = "http://unsub.me?id=2134"
				await testHeaderUnsubscribePost(headers.join("\r\n"), expectedPostUrl, true)
			})
			o("with POST newline tab", async function () {
				const headers = [
					"List-Unsubscribe: \r\n\t<http://unsub.me?id=2134>, <mailto:unsubscribe@newsletter.de>",
					"List-Unsubscribe-Post: List-Unsubscribe=One-Click",
				]
				const expectedPostUrl = "http://unsub.me?id=2134"
				await testHeaderUnsubscribePost(headers.join("\r\n"), expectedPostUrl, true)
			})
			o("with Q encoded header", async function () {
				const headers = [
					"List-Unsubscribe: ",
					" =?us-ascii?Q?=3Chttps=3A=2F=2Fnewsletter=2Eexample=2Ecom=2Funsubscribe=2Fabcd1234efgh?=",
					" =?us-ascii?Q?5678ijkl91011mnopqr=3E?=",
					"List-Unsubscribe-Post: List-Unsubscribe=One-Click",
				]

				const expectedPostUrl = "https://newsletter.example.com/unsubscribe/abcd1234efgh5678ijkl91011mnopqr"

				await testHeaderUnsubscribePost(headers.join("\r\n"), expectedPostUrl, true)
			})
			o("no list unsubscribe header", async function () {
				const headers = "To: InvalidHeader"
				const viewModel = initUnsubscribeHeaders(headers)
				const unsubscribeActions = await viewModel.determineUnsubscribeOrder()
				o(unsubscribeActions.length).equals(0)
				verify(mailModel.serverUnsubscribe(matchers.anything(), matchers.anything()), { times: 0 })
				verify(commonSystemFacade.executePostRequest(matchers.anything(), matchers.anything()), { times: 0 })
			})
			o("determineUnsubscribeOrder with mailto", async function () {
				const headers = ["List-Unsubscribe: \t<mailto:unsubscribe@newsletter.de>"]
				const viewModel = initUnsubscribeHeaders(headers.join("\r\n"))
				const unsubOrder = await viewModel.determineUnsubscribeOrder()
				o(unsubOrder.length).equals(1)
				o(unsubOrder[0].requestUrl).equals("mailto:unsubscribe@newsletter.de")
				o(unsubOrder[0].type).equals(UnsubscribeType.MAILTO_UNSUBSCRIBE)
			})
			o("determineUnsubscribeOrder with post", async function () {
				const headers = ["List-Unsubscribe: \t<http://unsub.me?id=2134>", "List-Unsubscribe-Post: One-Click"]
				const viewModel = initUnsubscribeHeaders(headers.join("\r\n"))
				const unsubOrder = await viewModel.determineUnsubscribeOrder()
				o(unsubOrder.length).equals(1)
				o(unsubOrder[0].requestUrl).equals("http://unsub.me?id=2134")
				o(unsubOrder[0].type).equals(UnsubscribeType.HTTP_POST_UNSUBSCRIBE)
			})
			o("determineUnsubscribeOrder with get", async function () {
				const headers = ["List-Unsubscribe: \t<http://unsub.me?id=2134>"]
				const viewModel = initUnsubscribeHeaders(headers.join("\r\n"))
				const unsubOrder = await viewModel.determineUnsubscribeOrder()
				o(unsubOrder.length).equals(1)
				o(unsubOrder[0].requestUrl).equals("http://unsub.me?id=2134")
				o(unsubOrder[0].type).equals(UnsubscribeType.HTTP_GET_UNSUBSCRIBE)
			})
			o("determineUnsubscribeOrder with get + mailto", async function () {
				const headers = ["List-Unsubscribe: \t<http://unsub.me?id=2134>, <mailto:unsubscribe@newsletter.de>"]
				const viewModel = initUnsubscribeHeaders(headers.join("\r\n"))
				const unsubOrder = await viewModel.determineUnsubscribeOrder()
				o(unsubOrder.length).equals(2)
				o(unsubOrder[0].requestUrl).equals("http://unsub.me?id=2134")
				o(unsubOrder[0].type).equals(UnsubscribeType.HTTP_GET_UNSUBSCRIBE)
				o(unsubOrder[1].requestUrl).equals("mailto:unsubscribe@newsletter.de")
				o(unsubOrder[1].type).equals(UnsubscribeType.MAILTO_UNSUBSCRIBE)
			})
			o("determineUnsubscribeOrder with post + mailto", async function () {
				const headers = ["List-Unsubscribe: \t<http://unsub.me?id=2134>, <mailto:unsubscribe@newsletter.de>", "List-Unsubscribe-Post: One-Click"]
				const viewModel = initUnsubscribeHeaders(headers.join("\r\n"))
				const unsubOrder = await viewModel.determineUnsubscribeOrder()
				o(unsubOrder.length).equals(2)
				o(unsubOrder[0].requestUrl).equals("http://unsub.me?id=2134")
				o(unsubOrder[0].type).equals(UnsubscribeType.HTTP_POST_UNSUBSCRIBE)
				o(unsubOrder[1].requestUrl).equals("mailto:unsubscribe@newsletter.de")
				o(unsubOrder[1].type).equals(UnsubscribeType.MAILTO_UNSUBSCRIBE)
			})
			o("determineUnsubscribeOrder with invalid prefixes are not parsed", async function () {
				const headers = ["List-Unsubscribe: \t<invalid-http-postUrl>, <invalid-mailto-postUrl>", "List-Unsubscribe-Post: One-Click"]
				const viewModel = initUnsubscribeHeaders(headers.join("\r\n"))
				const unsubOrder = await viewModel.determineUnsubscribeOrder()
				o(unsubOrder.length).equals(0)
			})
		})
	})

	o.spec("load mail details", function () {
		o("load mail details successfully", async function () {
			const viewModel = makeViewModelWithHeaders("")
			when(mailFacade.loadMailDetailsBlob(mail)).thenResolve(mailDetails)

			await viewModel.loadAll(Promise.resolve())

			o(viewModel.isLoading()).deepEquals(false)
			o(viewModel.getMailBody()).deepEquals("Hello World")
			o(viewModel.didErrorsOccur()).deepEquals(false)
		})

		o("mail details NotFoundError", async function () {
			const viewModel = makeViewModelWithHeaders("")
			when(mailFacade.loadMailDetailsBlob(mail)).thenReject(new NotFoundError("mail details not found"))

			await viewModel.loadAll(Promise.resolve())

			o(viewModel.isLoading()).deepEquals(false)
			o(viewModel.getMailBody()).deepEquals("")
			o(viewModel.didErrorsOccur()).deepEquals(true)
		})

		o("changind sent mail from mail details draft to mail details blob", async function () {
			const viewModel = makeViewModelWithHeaders("")
			mail.mailDetailsDraft = ["draftListId", "draftId"]

			const mailDetailsBlob = mail.mailDetails
			mail.mailDetails = null

			when(mailFacade.loadMailDetailsDraft(mail)).thenReject(new NotFoundError("mail details draft not found"))
			await viewModel.loadAll(Promise.resolve())
			o(viewModel.isLoading()).deepEquals(false)
			o(viewModel.getMailBody()).deepEquals("")
			o(viewModel.didErrorsOccur()).deepEquals(true)

			mail.mailDetailsDraft = null
			mail.mailDetails = mailDetailsBlob
			await viewModel.loadAll(Promise.resolve())

			o(viewModel.isLoading()).deepEquals(false)
			o(viewModel.getMailBody()).deepEquals("Hello World")
			o(viewModel.didErrorsOccur()).deepEquals(false)
		})
	})
})
