import o from "@tutao/otest"
import { Notifications } from "../../../src/common/gui/Notifications.js"
import type { Spy } from "@tutao/tutanota-test-utils"
import { spy } from "@tutao/tutanota-test-utils"
import { MailSetKind, OperationType } from "../../../src/common/api/common/TutanotaConstants.js"
import { MailFolderTypeRef, MailTypeRef } from "../../../src/common/api/entities/tutanota/TypeRefs.js"
import { EntityClient } from "../../../src/common/api/common/EntityClient.js"
import { EntityRestClientMock } from "../api/worker/rest/EntityRestClientMock.js"
import { downcast } from "@tutao/tutanota-utils"
import { LoginController } from "../../../src/common/api/main/LoginController.js"
import { instance, matchers, object, when } from "testdouble"
import { UserController } from "../../../src/common/api/main/UserController.js"
import { createTestEntity } from "../TestUtils.js"
import { EntityUpdateData } from "../../../src/common/api/common/utils/EntityUpdateUtils.js"
import { MailboxDetail, MailboxModel } from "../../../src/common/mailFunctionality/MailboxModel.js"
import { InboxRuleHandler } from "../../../src/mail-app/mail/model/InboxRuleHandler.js"
import { getElementId, getListId } from "../../../src/common/api/common/utils/EntityUtils.js"
import { MailModel } from "../../../src/mail-app/mail/model/MailModel.js"
import { EventController } from "../../../src/common/api/main/EventController.js"
import { MailFacade } from "../../../src/common/api/worker/facades/lazy/MailFacade.js"

o.spec("MailModelTest", function () {
	let notifications: Partial<Notifications>
	let showSpy: Spy
	let model: MailModel
	const inboxFolder = createTestEntity(MailFolderTypeRef, { _id: ["folderListId", "inboxId"], isMailSet: false })
	inboxFolder.mails = "instanceListId"
	inboxFolder.folderType = MailSetKind.INBOX
	const anotherFolder = createTestEntity(MailFolderTypeRef, { _id: ["folderListId", "archiveId"], isMailSet: false })
	anotherFolder.mails = "anotherListId"
	anotherFolder.folderType = MailSetKind.ARCHIVE
	let mailboxDetails: Partial<MailboxDetail>[]
	let logins: LoginController
	let inboxRuleHandler: InboxRuleHandler
	const restClient: EntityRestClientMock = new EntityRestClientMock()

	o.beforeEach(function () {
		notifications = {}
		const mailboxModel = instance(MailboxModel)
		const eventController = instance(EventController)
		const mailFacade = instance(MailFacade)
		showSpy = notifications.showNotification = spy()
		logins = object()
		let userController = object<UserController>()
		when(userController.isUpdateForLoggedInUserInstance(matchers.anything(), matchers.anything())).thenReturn(false)
		when(logins.getUserController()).thenReturn(userController)

		inboxRuleHandler = object()
		model = new MailModel(downcast({}), mailboxModel, eventController, new EntityClient(restClient), logins, mailFacade, null, null)
		// not pretty, but works
		// model.mailboxDetails(mailboxDetails as MailboxDetail[])
	})
	o("doesn't send notification for another folder", async function () {
		const mail = createTestEntity(MailTypeRef, { _id: [anotherFolder.mails, "mailId"], sets: [] })
		restClient.addListInstances(mail)
		await model.entityEventsReceived([
			makeUpdate({
				instanceListId: getListId(mail),
				instanceId: getElementId(mail),
				operation: OperationType.CREATE,
			}),
		])
		o(showSpy.invocations.length).equals(0)
	})
	o("doesn't send notification for move operation", async function () {
		const mail = createTestEntity(MailTypeRef, { _id: [inboxFolder.mails, "mailId"], sets: [] })
		restClient.addListInstances(mail)
		await model.entityEventsReceived([
			makeUpdate({
				instanceListId: getListId(mail),
				instanceId: getElementId(mail),
				operation: OperationType.DELETE,
			}),
			makeUpdate({
				instanceListId: getListId(mail),
				instanceId: getElementId(mail),
				operation: OperationType.CREATE,
			}),
		])
		o(showSpy.invocations.length).equals(0)
	})

	function makeUpdate(arg: { instanceListId: string; instanceId: Id; operation: OperationType }): EntityUpdateData {
		return Object.assign(
			{},
			{
				type: MailTypeRef.type,
				application: MailTypeRef.app,
				instanceId: "instanceId",
			},
			arg,
		)
	}
})
