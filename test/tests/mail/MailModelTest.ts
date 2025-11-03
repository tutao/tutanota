import o from "@tutao/otest"
import { Notifications } from "../../../src/common/gui/Notifications.js"
import { mock, Spy, spy, verify } from "@tutao/tutanota-test-utils"
import { MailSetKind, OperationType, ProcessingState } from "../../../src/common/api/common/TutanotaConstants.js"
import {
	BodyTypeRef,
	Mail,
	MailAddressTypeRef,
	MailDetails,
	MailDetailsBlob,
	MailDetailsBlobTypeRef,
	MailDetailsTypeRef,
	MailFolderTypeRef,
	MailTypeRef,
	RecipientsTypeRef,
} from "../../../src/common/api/entities/tutanota/TypeRefs.js"
import { EntityClient } from "../../../src/common/api/common/EntityClient.js"
import { EntityRestClientMock } from "../api/worker/rest/EntityRestClientMock.js"
import { downcast } from "@tutao/tutanota-utils"
import { LoginController } from "../../../src/common/api/main/LoginController.js"
import { instance, matchers, object, when } from "testdouble"
import { UserController } from "../../../src/common/api/main/UserController.js"
import { createTestEntity } from "../TestUtils.js"
import { EntityUpdateData, PrefetchStatus } from "../../../src/common/api/common/utils/EntityUpdateUtils.js"
import { MailboxDetail, MailboxModel } from "../../../src/common/mailFunctionality/MailboxModel.js"
import { MailModel } from "../../../src/mail-app/mail/model/MailModel.js"
import { EventController } from "../../../src/common/api/main/EventController.js"
import { MailFacade } from "../../../src/common/api/worker/facades/lazy/MailFacade.js"
import { ClientModelInfo } from "../../../src/common/api/common/EntityFunctions"
import { InboxRuleHandler } from "../../../src/mail-app/mail/model/InboxRuleHandler"
import { SpamClassificationHandler } from "../../../src/mail-app/mail/model/SpamClassificationHandler"
import { SpamClassifier } from "../../../src/mail-app/workerUtils/spamClassification/SpamClassifier"
import { WebsocketConnectivityModel } from "../../../src/common/misc/WebsocketConnectivityModel"
import { FolderSystem } from "../../../src/common/api/common/mail/FolderSystem"
import { NotAuthorizedError } from "../../../src/common/api/common/error/RestError"
import { ProcessInboxHandler } from "../../../src/mail-app/mail/model/ProcessInboxHandler"

const { anything } = matchers

o.spec("MailModelTest", function () {
	let notifications: Partial<Notifications>
	let showSpy: Spy
	let model: MailModel
	const inboxFolder = createTestEntity(MailFolderTypeRef, {
		_id: ["folderListId", "inboxId"],
		folderType: MailSetKind.INBOX,
	})
	const spamFolder = createTestEntity(MailFolderTypeRef, {
		_id: ["folderListId", "spamId"],
		folderType: MailSetKind.SPAM,
	})
	const anotherFolder = createTestEntity(MailFolderTypeRef, {
		_id: ["folderListId", "archiveId"],
		folderType: MailSetKind.ARCHIVE,
	})
	let logins: LoginController
	let mailFacade: MailFacade
	let connectivityModel: WebsocketConnectivityModel
	const restClient: EntityRestClientMock = new EntityRestClientMock()

	o.beforeEach(function () {
		notifications = {}
		const mailboxModel = instance(MailboxModel)
		const eventController = instance(EventController)
		mailFacade = instance(MailFacade)
		showSpy = notifications.showNotification = spy()
		logins = object()
		let userController = object<UserController>()
		when(userController.isUpdateForLoggedInUserInstance(matchers.anything(), matchers.anything())).thenReturn(false)
		when(logins.getUserController()).thenReturn(userController)

		connectivityModel = object<WebsocketConnectivityModel>()
		when(connectivityModel.isLeader()).thenReturn(true)

		model = new MailModel(
			downcast({}),
			mailboxModel,
			eventController,
			new EntityClient(restClient, ClientModelInfo.getNewInstanceForTestsOnly()),
			logins,
			mailFacade,
			connectivityModel,
			() => object(),
		)
	})

	o("markMails", async function () {
		const mailId1: IdTuple = ["mailbag id1", "mail id1"]
		const mailId2: IdTuple = ["mailbag id2", "mail id2"]
		const mailId3: IdTuple = ["mailbag id3", "mail id3"]
		await model.markMails([mailId1, mailId2, mailId3], true)
		verify(mailFacade.markMails([mailId1, mailId2, mailId3], true))
	})

	o.spec("Inbox rule processing and spam prediction", () => {
		let inboxRuleHandler: InboxRuleHandler
		let spamClassificationHandler: SpamClassificationHandler
		let spamClassifier: SpamClassifier
		let mailboxModel: MailboxModel
		let modelWithSpamAndInboxRule: MailModel
		let mail: Mail
		let mailDetails: MailDetails
		let processInboxHandler: ProcessInboxHandler = object<ProcessInboxHandler>()
		o.beforeEach(async () => {
			const entityClient = new EntityClient(restClient, ClientModelInfo.getNewInstanceForTestsOnly())
			mailboxModel = instance(MailboxModel)
			inboxRuleHandler = object<InboxRuleHandler>()
			spamClassifier = object<SpamClassifier>()
			spamClassificationHandler = new SpamClassificationHandler(spamClassifier)

			mailDetails = createTestEntity(MailDetailsTypeRef, {
				_id: "mailDetail",
				body: createTestEntity(BodyTypeRef, { text: "some text" }),
				recipients: createTestEntity(RecipientsTypeRef, {
					toRecipients: [
						createTestEntity(MailAddressTypeRef, {
							name: "Recipient",
							address: "recipient@tuta.com",
						}),
					],
				}),
			})
			mail = createTestEntity(MailTypeRef, {
				_id: ["mailListId", "mailId"],
				_ownerGroup: "mailGroup",
				mailDetails: ["detailsList", mailDetails._id],
				subject: "subject",
				sets: [inboxFolder._id],
				sender: createTestEntity(MailAddressTypeRef, { name: "Sender", address: "sender@tuta.com" }),
				processingState: ProcessingState.INBOX_RULE_NOT_PROCESSED,
				processNeeded: true,
				authStatus: "0",
			})
			const mailDetailsBlob: MailDetailsBlob = createTestEntity(MailDetailsBlobTypeRef, {
				_id: mail.mailDetails!,
				details: mailDetails,
			})

			restClient.addListInstances(mail)
			restClient.addBlobInstances(mailDetailsBlob)

			when(mailFacade.loadMailDetailsBlob(mail)).thenResolve(mailDetails)

			modelWithSpamAndInboxRule = mock(
				new MailModel(
					downcast({}),
					mailboxModel,
					instance(EventController),
					entityClient,
					logins,
					mailFacade,
					connectivityModel,
					() => processInboxHandler,
				),
				(m: MailModel) => {
					m.getFolderSystemByGroupId = (groupId) => {
						o(groupId).equals("mailGroup")
						return new FolderSystem([inboxFolder, spamFolder, anotherFolder])
					}
					m.getMailboxDetailsForMail = async (_: Mail) => object<MailboxDetail>()
				},
			)
		})

		o("invokes ProcessInboxHandler if the mail is not processed", async function () {
			const notProcessedMail = createTestEntity(MailTypeRef, {
				_id: ["mailListId", "notProcessedMailId"],
				_ownerGroup: "mailGroup",
				mailDetails: ["detailsList", mailDetails._id],
				sets: [inboxFolder._id],
				processNeeded: true,
			})
			restClient.addListInstances(notProcessedMail)
			when(mailFacade.loadMailDetailsBlob(notProcessedMail)).thenResolve(mailDetails)

			const alreadyClassifiedMailCreateEvent = makeUpdate({
				instanceListId: "mailListId",
				instanceId: "notProcessedMailId",
				operation: OperationType.CREATE,
			})

			await modelWithSpamAndInboxRule.entityEventsReceived([alreadyClassifiedMailCreateEvent])

			verify(processInboxHandler.handleIncomingMail(anything(), anything(), anything(), anything()), { times: 1 })
		})

		o("does not invoke ProcessInboxHandler if the mail is already processed", async function () {
			const alreadyProcessedMail = createTestEntity(MailTypeRef, {
				_id: ["mailListId", "processedMailId"],
				_ownerGroup: "mailGroup",
				mailDetails: ["detailsList", mailDetails._id],
				sets: [inboxFolder._id],
				processNeeded: false,
			})
			restClient.addListInstances(alreadyProcessedMail)
			when(mailFacade.loadMailDetailsBlob(alreadyProcessedMail)).thenResolve(mailDetails)

			const alreadyClassifiedMailCreateEvent = makeUpdate({
				instanceListId: "mailListId",
				instanceId: "processedMailId",
				operation: OperationType.CREATE,
			})

			await modelWithSpamAndInboxRule.entityEventsReceived([alreadyClassifiedMailCreateEvent])

			verify(processInboxHandler.handleIncomingMail(anything(), anything(), anything(), anything()), { times: 0 })
		})

		o("does not invoke ProcessInboxHandler when downloading of mail fails on create mail event", async function () {
			when(inboxRuleHandler.findAndApplyMatchingRule(anything(), anything(), anything())).thenResolve(null)
			const mailCreateEvent = makeUpdate({
				instanceListId: "mailListId",
				instanceId: "mailId",
				operation: OperationType.CREATE,
			})

			// mail not being there
			restClient.setListElementException(mail._id, new NotAuthorizedError("blah"))
			await modelWithSpamAndInboxRule.entityEventsReceived([mailCreateEvent])
			verify(processInboxHandler.handleIncomingMail(anything(), anything(), anything(), anything()), { times: 0 })
		})
	})

	function makeUpdate({
		instanceId,
		instanceListId,
		operation,
	}: {
		instanceListId: NonEmptyString
		instanceId: Id
		operation: OperationType
	}): EntityUpdateData<Mail> {
		return {
			typeRef: MailTypeRef,
			operation,
			instanceListId,
			instanceId,
			instance: null,
			patches: null,
			prefetchStatus: PrefetchStatus.NotPrefetched,
		}
	}
})
