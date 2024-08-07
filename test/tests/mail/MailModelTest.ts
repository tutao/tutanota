import o from "@tutao/otest"
import { Notifications } from "../../../src/common/gui/Notifications.js"
import type { Spy } from "@tutao/tutanota-test-utils"
import { spy } from "@tutao/tutanota-test-utils"
import { MailSetKind, OperationType } from "../../../src/common/api/common/TutanotaConstants.js"
import { MailFolderTypeRef, MailTypeRef } from "../../../src/common/api/entities/tutanota/TypeRefs.js"
import { EntityClient } from "../../../src/common/api/common/EntityClient.js"
import { EntityRestClientMock } from "../api/worker/rest/EntityRestClientMock.js"
import nodemocker from "../nodemocker.js"
import { downcast } from "@tutao/tutanota-utils"
import { MailFacade } from "../../../src/common/api/worker/facades/lazy/MailFacade.js"
import { LoginController } from "../../../src/common/api/main/LoginController.js"
import { matchers, object, when } from "testdouble"
import { FolderSystem } from "../../../src/common/api/common/mail/FolderSystem.js"
import { WebsocketConnectivityModel } from "../../../src/common/misc/WebsocketConnectivityModel.js"
import { UserController } from "../../../src/common/api/main/UserController.js"
import { createTestEntity } from "../TestUtils.js"
import { EntityUpdateData } from "../../../src/common/api/common/utils/EntityUpdateUtils.js"
import { MailboxDetail, MailModel } from "../../../src/common/mailFunctionality/MailModel.js"
import { InboxRuleHandler } from "../../../src/mail-app/mail/model/InboxRuleHandler.js"
import { getElementId, getListId } from "../../../src/common/api/common/utils/EntityUtils.js"

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
		mailboxDetails = [
			{
				folders: new FolderSystem([inboxFolder, anotherFolder]),
			},
		]
		notifications = {}
		showSpy = notifications.showNotification = spy()
		const connectivityModel = object<WebsocketConnectivityModel>()
		const mailFacade = nodemocker.mock<MailFacade>("mailFacade", {}).set()
		logins = object()
		let userController = object<UserController>()
		when(userController.isUpdateForLoggedInUserInstance(matchers.anything(), matchers.anything())).thenReturn(false)
		when(logins.getUserController()).thenReturn(userController)

		inboxRuleHandler = object()
		model = new MailModel(downcast(notifications), downcast({}), mailFacade, new EntityClient(restClient), logins, connectivityModel, inboxRuleHandler)
		// not pretty, but works
		model.mailboxDetails(mailboxDetails as MailboxDetail[])
	})
	o("doesn't send notification for another folder", async function () {
		const mail = createTestEntity(MailTypeRef, { _id: [anotherFolder.mails, "mailId"], sets: [] })
		restClient.addListInstances(mail)
		await model.entityEventsReceived(
			[
				makeUpdate({
					instanceListId: getListId(mail),
					instanceId: getElementId(mail),
					operation: OperationType.CREATE,
				}),
			],
			"userGroupId",
		)
		o(showSpy.invocations.length).equals(0)
	})
	o("doesn't send notification for move operation", async function () {
		const mail = createTestEntity(MailTypeRef, { _id: [inboxFolder.mails, "mailId"], sets: [] })
		restClient.addListInstances(mail)
		await model.entityEventsReceived(
			[
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
			],
			"userGroupId",
		)
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
