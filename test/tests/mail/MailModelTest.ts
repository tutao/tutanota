import o from "@tutao/otest"
import { Notifications } from "../../../src/common/gui/Notifications.js"
import { Spy, spy, verify } from "@tutao/tutanota-test-utils"
import { MailSetKind, OperationType } from "../../../src/common/api/common/TutanotaConstants.js"
import { MailFolderTypeRef, MailSetEntryTypeRef, MailTypeRef } from "../../../src/common/api/entities/tutanota/TypeRefs.js"
import { EntityClient } from "../../../src/common/api/common/EntityClient.js"
import { EntityRestClientMock } from "../api/worker/rest/EntityRestClientMock.js"
import { downcast } from "@tutao/tutanota-utils"
import { LoginController } from "../../../src/common/api/main/LoginController.js"
import { instance, matchers, object, when } from "testdouble"
import { UserController } from "../../../src/common/api/main/UserController.js"
import { createTestEntity } from "../TestUtils.js"
import { EntityUpdateData } from "../../../src/common/api/common/utils/EntityUpdateUtils.js"
import { MailboxModel } from "../../../src/common/mailFunctionality/MailboxModel.js"
import { getElementId, getListId } from "../../../src/common/api/common/utils/EntityUtils.js"
import { MailModel } from "../../../src/mail-app/mail/model/MailModel.js"
import { EventController } from "../../../src/common/api/main/EventController.js"
import { MailFacade } from "../../../src/common/api/worker/facades/lazy/MailFacade.js"
import { ClientModelInfo } from "../../../src/common/api/common/EntityFunctions"

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

		model = new MailModel(
			downcast({}),
			mailboxModel,
			eventController,
			new EntityClient(restClient, ClientModelInfo.getNewInstanceForTestsOnly()),
			logins,
			mailFacade,
			null,
			() => null,
		)
	})
	o("doesn't send notification for another folder", async function () {
		const mailSetEntry = createTestEntity(MailSetEntryTypeRef, { _id: [anotherFolder.entries, "mailSetEntryId"] })
		restClient.addListInstances(mailSetEntry)
		await model.entityEventsReceived([
			makeUpdate({
				instanceListId: getListId(mailSetEntry),
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
				instanceListId: getListId(mailSetEntry),
				instanceId: getElementId(mailSetEntry),
				operation: OperationType.DELETE,
			}),
			makeUpdate({
				instanceListId: getListId(mailSetEntry),
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

	function makeUpdate({ instanceId, instanceListId, operation }: { instanceListId: string; instanceId: Id; operation: OperationType }): EntityUpdateData {
		return {
			typeRef: MailTypeRef,
			operation,
			instanceListId,
			instanceId,
			instance: null,
			patches: null,
			isPrefetched: false,
		}
	}
})
