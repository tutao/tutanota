import o, { mock, Spy, spy, verify } from "@tutao/otest"
import { Notifications } from "../../../src/ui/Notifications.js"

import { EntityClient } from "../../../src/platform-kits/network/EntityClient.js"
import { EntityRestClientMock } from "../api/worker/rest/EntityRestClientMock.js"
import { downcast } from "../../../src/platform-kits/utils"
import { LoginController } from "../../../src/applications/common/api/main/LoginController.js"
import { instance, matchers, object, when } from "testdouble"
import { UserController } from "../../../src/applications/common/api/main/UserController.js"
import { createTestEntity, makePopulatedClientModelInfo } from "../TestUtils.js"
import { MailboxDetail, MailboxModel } from "../../../src/applications/common/mailFunctionality/MailboxModel.js"
import { MailModel } from "../../../src/applications/mail-app/mail/model/MailModel.js"
import { EventController } from "../../../src/applications/common/api/main/EventController.js"
import { MailFacade } from "../../../src/applications/common/api/worker/facades/lazy/MailFacade.js"
import { InboxRuleHandler } from "../../../src/applications/mail-app/mail/model/InboxRuleHandler"
import { WebsocketConnectivityModel } from "../../../src/applications/common/misc/WebsocketConnectivityModel"
import { FolderSystem } from "../../../src/applications/common/api/common/mail/FolderSystem"
import * as restError from "../../../src/platform-kits/rest-client/error"
import { ProcessInboxHandler } from "../../../src/applications/mail-app/mail/model/ProcessInboxHandler"

import { noPatchesAndInstance } from "../api/worker/EventBusClientTest"
import { MailSetKind, ProcessingState } from "../../../src/entities/tutanota/Utils"
import {
	BodyTypeRef,
	Mail,
	MailAddressTypeRef,
	MailDetails,
	MailDetailsBlob,
	MailDetailsBlobTypeRef,
	MailDetailsTypeRef,
	MailSetTypeRef,
	MailTypeRef,
	RecipientsTypeRef,
} from "@tutao/entities/tutanota"
import { OperationType } from "../../../src/platform-kits/meta"
import { EntityUpdateData } from "../../../src/platform-kits/instance-pipeline/utils/EntityUpdateUtils"

const { anything } = matchers

o.spec("MailModelTest", function () {
	let notifications: Partial<Notifications>
	let showSpy: Spy
	let model: MailModel
	const inboxFolder = createTestEntity(MailSetTypeRef, {
		_id: ["folderListId", "inboxId"],
		folderType: MailSetKind.INBOX,
	})
	const spamFolder = createTestEntity(MailSetTypeRef, {
		_id: ["folderListId", "spamId"],
		folderType: MailSetKind.SPAM,
	})
	const anotherFolder = createTestEntity(MailSetTypeRef, {
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
		when(userController.isInternalUser()).thenReturn(true)
		when(logins.getUserController()).thenReturn(userController)

		connectivityModel = object<WebsocketConnectivityModel>()
		when(connectivityModel.isLeader()).thenReturn(true)

		model = new MailModel(
			downcast({}),
			mailboxModel,
			eventController,
			new EntityClient(restClient, makePopulatedClientModelInfo()),
			logins,
			mailFacade,
			connectivityModel,
			() => object(),
			object(),
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
		let mailboxModel: MailboxModel
		let modelWithSpamAndInboxRule: MailModel
		let mail: Mail
		let mailDetails: MailDetails
		let processInboxHandler: ProcessInboxHandler = object<ProcessInboxHandler>()
		o.beforeEach(async () => {
			const entityClient = new EntityClient(restClient, makePopulatedClientModelInfo())
			mailboxModel = instance(MailboxModel)
			inboxRuleHandler = object<InboxRuleHandler>()

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
					object(),
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

		o("invokes ProcessInboxHandler with sendServerRequest == false when the client is not leader", async function () {
			const notProcessedMail = createTestEntity(MailTypeRef, {
				_id: ["mailListId", "notProcessedMailId"],
				_ownerGroup: "mailGroup",
				mailDetails: ["detailsList", mailDetails._id],
				sets: [inboxFolder._id],
				processNeeded: true,
			})
			restClient.addListInstances(notProcessedMail)
			when(connectivityModel.isLeader()).thenReturn(false)
			when(mailFacade.loadMailDetailsBlob(notProcessedMail)).thenResolve(mailDetails)

			const alreadyClassifiedMailCreateEvent = makeUpdate({
				instanceListId: "mailListId",
				instanceId: "notProcessedMailId",
				operation: OperationType.CREATE,
			})

			await modelWithSpamAndInboxRule.entityEventsReceived([alreadyClassifiedMailCreateEvent])

			verify(processInboxHandler.handleIncomingMail(anything(), anything(), anything(), anything(), false), { times: 1 })
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

			verify(processInboxHandler.handleIncomingMail(anything(), anything(), anything(), anything(), true), { times: 1 })
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

			verify(processInboxHandler.handleIncomingMail(anything(), anything(), anything(), anything(), true), { times: 0 })
		})

		o("does not invoke ProcessInboxHandler when downloading of mail fails on create mail event", async function () {
			when(inboxRuleHandler.findMatchingInboxRule(anything(), anything(), anything())).thenResolve(null)
			const mailCreateEvent = makeUpdate({
				instanceListId: "mailListId",
				instanceId: "mailId",
				operation: OperationType.CREATE,
			})

			// mail not being there
			restClient.setListElementException(mail._id, new restError.NotAuthorizedError("blah"))
			await modelWithSpamAndInboxRule.entityEventsReceived([mailCreateEvent])
			verify(processInboxHandler.handleIncomingMail(anything(), anything(), anything(), anything(), true), { times: 0 })
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
	}): EntityUpdateData {
		return {
			typeRef: MailTypeRef,
			operation,
			instanceListId,
			instanceId,
			...noPatchesAndInstance,
		}
	}
})
