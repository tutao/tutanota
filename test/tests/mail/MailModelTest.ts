import o from "@tutao/otest"
import { Notifications } from "../../../src/common/gui/Notifications.js"
import { Spy, spy, verify } from "@tutao/tutanota-test-utils"
import { MailSetKind, OperationType } from "../../../src/common/api/common/TutanotaConstants.js"
import {
	BodyTypeRef,
	Mail,
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
import { MailboxModel } from "../../../src/common/mailFunctionality/MailboxModel.js"
import { getElementId, getListId } from "../../../src/common/api/common/utils/EntityUtils.js"
import { MailModel } from "../../../src/mail-app/mail/model/MailModel.js"
import { EventController } from "../../../src/common/api/main/EventController.js"
import { MailFacade } from "../../../src/common/api/worker/facades/lazy/MailFacade.js"
import { ClientModelInfo } from "../../../src/common/api/common/EntityFunctions"
import { InboxRuleHandler } from "../../../src/mail-app/mail/model/InboxRuleHandler"
import { SpamClassificationHandler } from "../../../src/mail-app/mail/model/SpamClassificationHandler"
import { SpamClassifier } from "../../../src/mail-app/workerUtils/spamClassification/SpamClassifier"
import { WebsocketConnectivityModel } from "../../../src/common/misc/WebsocketConnectivityModel"

const { anything } = matchers

o.spec("MailModelTest", function () {
	let notifications: Partial<Notifications>
	let showSpy: Spy
	let model: MailModel
	const inboxFolder = createTestEntity(MailFolderTypeRef, { _id: ["folderListId", "inboxId"] })
	inboxFolder.folderType = MailSetKind.INBOX
	const anotherFolder = createTestEntity(MailFolderTypeRef, { _id: ["folderListId", "archiveId"] })
	anotherFolder.folderType = MailSetKind.ARCHIVE
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

		o.beforeEach(async () => {
			const entityClient = new EntityClient(restClient, ClientModelInfo.getNewInstanceForTestsOnly())
			mailboxModel = instance(MailboxModel)
			inboxRuleHandler = object<InboxRuleHandler>()
			spamClassifier = object<SpamClassifier>()
			spamClassificationHandler = new SpamClassificationHandler(object(), spamClassifier, entityClient, object(), connectivityModel)

			model = new MailModel(
				downcast({}),
				mailboxModel,
				instance(EventController),
				entityClient,
				logins,
				mailFacade,
				null,
				() => spamClassificationHandler,
				() => inboxRuleHandler,
			)
		})

		o("does not try to apply inbox rule when downloading of mail fails on create mail event", async function () {
			when(spamClassificationHandler.downloadMail(matchers.anything())).thenResolve(null)

			const mailCreateEvent = makeUpdate({ instanceListId: "mailListId", instanceId: "mailId", operation: OperationType.CREATE })
			await model.entityEventsReceived([mailCreateEvent])

			verify(inboxRuleHandler.findAndApplyMatchingRule(anything(), anything(), anything()), { times: 0 })
		})

		o("does not try to do spam classification when downloading of mail fails on create mail event", async function () {
			when(spamClassificationHandler.downloadMail(matchers.anything())).thenResolve(null)

			const mailCreateEvent = makeUpdate({ instanceListId: "mailListId", instanceId: "mailId", operation: OperationType.CREATE })
			await model.entityEventsReceived([mailCreateEvent])

			verify(spamClassificationHandler.predictSpamForNewMail(anything(), anything(), anything()), { times: 0 })
		})

		o("no spam prediction if inbox rule is applied", async () => {
			const mailDetails = createTestEntity(MailDetailsTypeRef, {
				_id: "mailDetail",
				body: createTestEntity(BodyTypeRef, { text: "some text" }),
			})
			const mail = createTestEntity(MailTypeRef, { _id: ["mailListId", "mailId"], mailDetails: ["detailsList", mailDetails._id] })
			when(spamClassificationHandler.downloadMail(matchers.anything())).thenResolve(mail)
			when(spamClassificationHandler.downloadMailDetails(mail)).thenResolve(mailDetails)

			const inboxRuleTargetFolder = createTestEntity(MailFolderTypeRef, { _id: ["folderListId", "inboxRuleTarget"] })
			when(inboxRuleHandler.findAndApplyMatchingRule(anything(), anything(), anything())).thenResolve(inboxRuleTargetFolder)

			const mailCreateEvent = makeUpdate({ instanceListId: "mailListId", instanceId: "mailId", operation: OperationType.CREATE })
			await model.entityEventsReceived([mailCreateEvent])

			verify(spamClassificationHandler.predictSpamForNewMail(anything(), mail, anything()), { times: 1 })
			verify(spamClassifier.predict(anything()), { times: 0 })
		})

		o("Do spam prediction if inbox rule is not applied", async () => {
			const mailDetails = createTestEntity(MailDetailsTypeRef, {
				_id: "mailDetail",
				body: createTestEntity(BodyTypeRef, { text: "some text" }),
			})
			const mail = createTestEntity(MailTypeRef, { _id: ["mailListId", "mailId"], mailDetails: ["detailsList", mailDetails._id] })
			when(spamClassificationHandler.downloadMail(matchers.anything())).thenResolve(mail)
			when(spamClassificationHandler.downloadMailDetails(mail)).thenResolve(mailDetails)

			when(inboxRuleHandler.findAndApplyMatchingRule(anything(), anything(), anything())).thenResolve(null)
			when(spamClassifier.predict(anything())).thenResolve(null)

			const mailCreateEvent = makeUpdate({ instanceListId: "mailListId", instanceId: "mailId", operation: OperationType.CREATE })
			await model.entityEventsReceived([mailCreateEvent])

			verify(spamClassifier.predict(anything()), { times: 1 })
		})

		o("do not do spam prediction for draft mail", async () => {
			const mail = createTestEntity(MailTypeRef, { _id: ["mailListId", "mailId"], mailDetailsDraft: ["draftListId", "draftId"], mailDetails: null })

			const inboxRuleTargetFolder = createTestEntity(MailFolderTypeRef, { _id: ["folderListId", "inboxRuleTarget"] })

			when(spamClassificationHandler.downloadMail(anything())).thenResolve(mail)
			when(inboxRuleHandler.findAndApplyMatchingRule(anything(), mail, anything())).thenResolve(inboxRuleTargetFolder)

			const mailCreateEvent = makeUpdate({ instanceListId: "mailListId", instanceId: "mailId", operation: OperationType.CREATE })
			await model.entityEventsReceived([mailCreateEvent])

			verify(spamClassificationHandler.predictSpamForNewMail(anything(), mail, anything()), { times: 1 })
			verify(spamClassifier.predict(anything()), { times: 0 })
		})

		o("deletes a training datum for deleted mail event", async () => {
			const mail = createTestEntity(MailTypeRef, {
				_id: ["mailListId", "mailId"],
				_ownerGroup: "owner",
				mailDetailsDraft: ["draftListId", "draftId"],
				mailDetails: null,
			})
			when(spamClassificationHandler.downloadMail(anything())).thenResolve(mail)
			when(inboxRuleHandler.findAndApplyMatchingRule(anything(), anything(), anything())).thenResolve(null)

			const mailDeleteEvent = makeUpdate({ instanceListId: "mailListId", instanceId: "mailId", operation: OperationType.DELETE })
			await model.entityEventsReceived([mailDeleteEvent])

			verify(spamClassifier.deleteSpamClassification("owner", mail._id), { times: 0 })
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
