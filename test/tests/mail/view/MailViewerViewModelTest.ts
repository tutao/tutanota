import o from "@tutao/otest"
import { MailViewerViewModel } from "../../../../src/mail-app/mail/view/MailViewerViewModel.js"
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
import { ExternalImageRule, MailState } from "../../../../src/common/api/common/TutanotaConstants.js"
import { GroupInfoTypeRef } from "../../../../src/common/api/entities/sys/TypeRefs.js"
import { CryptoFacade } from "../../../../src/common/api/worker/crypto/CryptoFacade.js"
import { ContactImporter } from "../../../../src/mail-app/contacts/ContactImporter.js"
import { MailboxDetail, MailboxModel } from "../../../../src/common/mailFunctionality/MailboxModel.js"
import { ContactModel } from "../../../../src/common/contactsFunctionality/ContactModel.js"
import { SendMailModel } from "../../../../src/common/mailFunctionality/SendMailModel.js"
import { MailModel } from "../../../../src/mail-app/mail/model/MailModel.js"
import { downcast } from "@tutao/tutanota-utils"

o.spec("MailViewerViewModel", function () {
	let mail: Mail
	let mailDetails: MailDetails
	let showFolder: boolean = false
	let entityClient: EntityClient

	let mailModel: MailModel
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
	let sendMailModelFactory: (mailboxDetails: MailboxDetail) => Promise<SendMailModel> = () => Promise.resolve(sendMailModel)
	let cryptoFacade: CryptoFacade
	let contactImporter: ContactImporter

	function makeViewModelWithHeaders(headers: string) {
		entityClient = object()
		mailModel = object()
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
		prepareMailWithHeaders(mailFacade, headers)

		return new MailViewerViewModel(
			mail,
			showFolder,
			entityClient,
			mailboxModel,
			mailModel,
			contactModel,
			configFacade,
			fileController,
			logins,
			sendMailModelFactory,
			eventController,
			workerFacade,
			searchModel,
			mailFacade,
			cryptoFacade,
			async () => contactImporter,
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
	}

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

		async function testHeaderUnsubscribe(headers: string, expected: Array<string>) {
			const viewModel = initUnsubscribeHeaders(headers)

			const result = await viewModel.unsubscribe()
			verify(mailModel.unsubscribe(mail, "ma@tuta.com", expected), { times: 1 })
			o(result).equals(true)
		}

		o.spec("url", function () {
			o("easy case", async function () {
				const headers = "List-Unsubscribe: <http://unsub.me?id=2134>, <mailto:unsubscribe@newsletter.de>"
				await testHeaderUnsubscribe(headers, [headers])
			})
			o("with POST", async function () {
				const headers = [
					"List-Unsubscribe: <http://unsub.me?id=2134>, <mailto:unsubscribe@newsletter.de>",
					"List-Unsubscribe-Post: List-Unsubscribe=One-Click",
				]
				await testHeaderUnsubscribe(headers.join("\r\n"), headers)
			})
			o("with whitespace", async function () {
				const headers = ["List-Unsubscribe:      <http://unsub.me?id=2134>, <mailto:unsubscribe@newsletter.de>"]
				const expected = ["List-Unsubscribe:      <http://unsub.me?id=2134>, <mailto:unsubscribe@newsletter.de>"]
				await testHeaderUnsubscribe(headers.join("\r\n"), expected)
			})
			o("with tab", async function () {
				const headers = ["List-Unsubscribe:\t <http://unsub.me?id=2134>, <mailto:unsubscribe@newsletter.de>"]
				const expected = ["List-Unsubscribe:\t <http://unsub.me?id=2134>, <mailto:unsubscribe@newsletter.de>"]
				await testHeaderUnsubscribe(headers.join("\r\n"), expected)
			})
			o("with newline whitespace", async function () {
				const headers = ["List-Unsubscribe: \r\n <http://unsub.me?id=2134>, <mailto:unsubscribe@newsletter.de>"]
				const expected = ["List-Unsubscribe: <http://unsub.me?id=2134>, <mailto:unsubscribe@newsletter.de>"]
				await testHeaderUnsubscribe(headers.join("\r\n"), expected)
			})
			o("with newline tab", async function () {
				const headers = ["List-Unsubscribe: \r\n\t<http://unsub.me?id=2134>, <mailto:unsubscribe@newsletter.de>"]
				const expected = ["List-Unsubscribe: <http://unsub.me?id=2134>, <mailto:unsubscribe@newsletter.de>"]
				await testHeaderUnsubscribe(headers.join("\r\n"), expected)
			})
			o("no list unsubscribe header", async function () {
				const headers = "To: InvalidHeader"
				const viewModel = initUnsubscribeHeaders(headers)
				const result = await viewModel.unsubscribe()
				verify(mailModel.unsubscribe(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
				o(result).equals(false)
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
