import o from "@tutao/otest"
import { Notifications } from "../../../src/common/gui/Notifications.js"
import { mock, Spy, spy, verify } from "@tutao/tutanota-test-utils"
import { MailSetKind, OperationType } from "../../../src/common/api/common/TutanotaConstants.js"
import {
	BodyTypeRef,
	Mail,
	MailDetails,
	MailDetailsBlobTypeRef,
	MailDetailsTypeRef,
	MailFolderTypeRef,
	MailSetEntryTypeRef,
	MailTypeRef,
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
import { getElementId, getListId } from "../../../src/common/api/common/utils/EntityUtils.js"
import { MailModel } from "../../../src/mail-app/mail/model/MailModel.js"
import { EventController } from "../../../src/common/api/main/EventController.js"
import { MailFacade } from "../../../src/common/api/worker/facades/lazy/MailFacade.js"
import { ClientModelInfo } from "../../../src/common/api/common/EntityFunctions"
import { InboxRuleHandler } from "../../../src/mail-app/mail/model/InboxRuleHandler"
import { SpamClassificationHandler } from "../../../src/mail-app/mail/model/SpamClassificationHandler"
import { SpamClassifier } from "../../../src/mail-app/workerUtils/spamClassification/SpamClassifier"
import { WebsocketConnectivityModel } from "../../../src/common/misc/WebsocketConnectivityModel"
import { BulkMailLoader } from "../../../src/mail-app/workerUtils/index/BulkMailLoader"
import { FolderSystem } from "../../../src/common/api/common/mail/FolderSystem"
import { NotAuthorizedError, NotFoundError } from "../../../src/common/api/common/error/RestError"

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
			() => null,
		)
	})

	o("doesn't send notification for another folder", async function () {
		const mailSetEntry = createTestEntity(MailSetEntryTypeRef, { _id: [anotherFolder.entries, "mailSetEntryId"] })
		restClient.addListInstances(mailSetEntry)
		await model.entityEventsReceived([
			makeUpdate({
				instanceListId: getListId(mailSetEntry) as NonEmptyString,
				instanceId: getElementId(mailSetEntry),
				operation: OperationType.CREATE,
			}),
		])
		o(showSpy.invocations.length).equals(0)
	})
	o("doesn't send notification for move operation", async function () {
		const mailSetEntry = createTestEntity(MailSetEntryTypeRef, { _id: [inboxFolder.entries, "mailSetEntryId"] })
		restClient.addListInstances(mailSetEntry)
		await model.entityEventsReceived([
			makeUpdate({
				instanceListId: getListId(mailSetEntry) as NonEmptyString,
				instanceId: getElementId(mailSetEntry),
				operation: OperationType.DELETE,
			}),
			makeUpdate({
				instanceListId: getListId(mailSetEntry) as NonEmptyString,
				instanceId: getElementId(mailSetEntry),
				operation: OperationType.CREATE,
			}),
		])
		o(showSpy.invocations.length).equals(0)
	})
	o("markMails", async function () {
		const mailId1: IdTuple = ["mailbag id1", "mail id1"]
		const mailId2: IdTuple = ["mailbag id2", "mail id2"]
		const mailId3: IdTuple = ["mailbag id3", "mail id3"]
		await model.markMails([mailId1, mailId2, mailId3], true)
		verify(mailFacade.markMails([mailId1, mailId2, mailId3], true))
	})

	o.spec("Inbox rule and spam prediction", () => {
		let inboxRuleHandler: InboxRuleHandler
		let spamClassificationHandler: SpamClassificationHandler
		let spamClassifier: SpamClassifier
		let mailboxModel: MailboxModel
		let modelWithSpamAndInboxRule: MailModel
		let mail: Mail
		let mailDetails: MailDetails

		o.beforeEach(async () => {
			const entityClient = new EntityClient(restClient, ClientModelInfo.getNewInstanceForTestsOnly())
			const bulkMailLoader = new BulkMailLoader(entityClient, entityClient, mailFacade)
			mailboxModel = instance(MailboxModel)
			inboxRuleHandler = object<InboxRuleHandler>()
			spamClassifier = object<SpamClassifier>()
			spamClassificationHandler = new SpamClassificationHandler(mailFacade, spamClassifier, entityClient, connectivityModel)

			mailDetails = createTestEntity(MailDetailsTypeRef, {
				_id: "mailDetail",
				body: createTestEntity(BodyTypeRef, { text: "some text" }),
			})
			mail = createTestEntity(MailTypeRef, {
				_id: ["mailListId", "mailId"],
				_ownerGroup: "mailGroup",
				mailDetails: ["detailsList", mailDetails._id],
				sets: [inboxFolder._id],
			})
			const mailDetailsBlob = createTestEntity(MailDetailsBlobTypeRef, {
				_id: mail.mailDetails!,
				details: mailDetails,
			})
			restClient.addListInstances(mail)
			restClient.addBlobInstances(mailDetailsBlob)

			modelWithSpamAndInboxRule = mock(
				new MailModel(
					downcast({}),
					mailboxModel,
					instance(EventController),
					entityClient,
					logins,
					mailFacade,
					connectivityModel,
					() => spamClassificationHandler,
					() => inboxRuleHandler,
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

		o("does not try to apply inbox rule when downloading of mail fails on create mail event", async function () {
			restClient.setListElementException(mail._id, new NotFoundError("Mail not found"))

			const mailCreateEvent = makeUpdate({
				instanceListId: getListId(mail) as NonEmptyString,
				instanceId: getElementId(mail),
				operation: OperationType.CREATE,
			})
			await modelWithSpamAndInboxRule.entityEventsReceived([mailCreateEvent])

			verify(inboxRuleHandler.findAndApplyMatchingRule(anything(), anything(), anything()), { times: 0 })
		})

		o("spam prediction does not happen when inbox rule is applied", async () => {
			when(spamClassifier.predict(anything())).thenResolve(false)

			const mailCreateEvent = makeUpdate({
				instanceListId: "mailListId",
				instanceId: "mailId",
				operation: OperationType.CREATE,
			})

			// when inbox rule is applied
			when(inboxRuleHandler.findAndApplyMatchingRule(anything(), anything(), anything())).thenResolve(inboxFolder)
			const { inboxRuleProcessed } = await modelWithSpamAndInboxRule.entityEventsReceived([mailCreateEvent])
			await inboxRuleProcessed
			verify(spamClassifier.predict(anything()), { times: 0 })
		})
		o("spam prediction happens when inbox rule is not applied", async () => {
			when(spamClassifier.predict(anything())).thenResolve(false)

			const mailCreateEvent = makeUpdate({
				instanceListId: "mailListId",
				instanceId: "mailId",
				operation: OperationType.CREATE,
			})
			when(inboxRuleHandler.findAndApplyMatchingRule(anything(), anything(), anything())).thenResolve(null)
			const { inboxRuleProcessed } = await modelWithSpamAndInboxRule.entityEventsReceived([mailCreateEvent])
			await inboxRuleProcessed
			verify(spamClassifier.predict(anything()), { times: 1 })
		})
		o("spam prediction happens when inbox rule throws", async () => {
			when(spamClassifier.predict(anything())).thenResolve(false)

			const mailCreateEvent = makeUpdate({
				instanceListId: "mailListId",
				instanceId: "mailId",
				operation: OperationType.CREATE,
			})
			when(inboxRuleHandler.findAndApplyMatchingRule(anything(), anything(), anything())).thenReject(new Error("Some error for inbox rule"))
			const { inboxRuleProcessed } = await modelWithSpamAndInboxRule.entityEventsReceived([mailCreateEvent])
			await inboxRuleProcessed
			verify(spamClassifier.predict(anything()), { times: 1 })
		})

		o("does not try to do spam classification when downloading of mail fails on create mail event", async function () {
			when(inboxRuleHandler.findAndApplyMatchingRule(anything(), anything(), anything())).thenResolve(null)
			const mailCreateEvent = makeUpdate({
				instanceListId: "mailListId",
				instanceId: "mailId",
				operation: OperationType.CREATE,
			})

			// mail not being there
			restClient.setListElementException(mail._id, new NotAuthorizedError("blah"))
			const { inboxRuleProcessed: inboxRuleProcessedMailNotThere } = await modelWithSpamAndInboxRule.entityEventsReceived([mailCreateEvent])
			await inboxRuleProcessedMailNotThere
			verify(spamClassifier.predict(anything()), { times: 0 })

			// mail being there
			restClient.addListInstances(mail)
			const { inboxRuleProcessed: inboxRuleProcessedMailIsThere } = await modelWithSpamAndInboxRule.entityEventsReceived([mailCreateEvent])
			await inboxRuleProcessedMailIsThere
			verify(spamClassifier.predict(anything()), { times: 1 })
		})

		o("no spam prediction for draft mails", async () => {
			mail.mailDetails = null
			mail.mailDetailsDraft = ["draftListId", "draftId"]
			restClient.addListInstances(mail)

			when(inboxRuleHandler.findAndApplyMatchingRule(anything(), mail, anything())).thenResolve(inboxFolder)

			const mailCreateEvent = makeUpdate({
				instanceListId: "mailListId",
				instanceId: "mailId",
				operation: OperationType.CREATE,
			})
			const { inboxRuleProcessed } = await modelWithSpamAndInboxRule.entityEventsReceived([mailCreateEvent])
			await inboxRuleProcessed

			verify(spamClassificationHandler.predictSpamForNewMail(mail, anything()), { times: 1 })
			verify(spamClassifier.predict(anything()), { times: 0 })
		})

		o("deletes a training datum for deleted mail event", async () => {
			const mailDeleteEvent = makeUpdate({
				instanceListId: "mailListId",
				instanceId: "mailId",
				operation: OperationType.DELETE,
			})
			const { inboxRuleProcessed } = await modelWithSpamAndInboxRule.entityEventsReceived([mailDeleteEvent])
			await inboxRuleProcessed

			verify(spamClassifier.deleteSpamClassification(mail._id), { times: 1 })
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
