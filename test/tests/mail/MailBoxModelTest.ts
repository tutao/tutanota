import o from "@tutao/otest"
import { Notifications } from "../../../src/common/gui/Notifications.js"
import type { Spy } from "@tutao/tutanota-test-utils"
import { spy } from "@tutao/tutanota-test-utils"
import { MailFolderType, OperationType } from "../../../src/common/api/common/TutanotaConstants.js"
import { MailFolderTypeRef, MailTypeRef } from "../../../src/common/api/entities/tutanota/TypeRefs.js"
import { EntityClient } from "../../../src/common/api/common/EntityClient.js"
import { EntityRestClientMock } from "../api/worker/rest/EntityRestClientMock.js"
import nodemocker from "../nodemocker.js"
import { downcast } from "@tutao/tutanota-utils"
import { MailFacade } from "../../../src/common/api/worker/facades/lazy/MailFacade.js"
import { LoginController } from "../../../src/common/api/main/LoginController.js"
import { matchers, object, when } from "testdouble"
import { WebsocketConnectivityModel } from "../../../src/common/misc/WebsocketConnectivityModel.js"
import { UserController } from "../../../src/common/api/main/UserController.js"
import { createTestEntity } from "../TestUtils.js"
import { EntityUpdateData } from "../../../src/common/api/common/utils/EntityUpdateUtils.js"
import { MailboxDetail, MailboxModel } from "../../../src/common/mailFunctionality/MailboxModel.js"
import { InboxRuleHandler } from "../../../src/mail-app/mail/model/InboxRuleHandler.js"

o.spec("MailModelTest", function () {
	let notifications: Partial<Notifications>
	let showSpy: Spy
	let model: MailboxModel
	const inboxFolder = createTestEntity(MailFolderTypeRef, { _id: ["folderListId", "inboxId"] })
	inboxFolder.mails = "instanceListId"
	inboxFolder.folderType = MailFolderType.INBOX
	const anotherFolder = createTestEntity(MailFolderTypeRef, { _id: ["folderListId", "archiveId"] })
	anotherFolder.mails = "anotherListId"
	anotherFolder.folderType = MailFolderType.ARCHIVE
	let mailboxDetails: Partial<MailboxDetail>[]
	let logins: LoginController
	let inboxRuleHandler: InboxRuleHandler

	o.beforeEach(function () {
		notifications = {}
		showSpy = notifications.showNotification = spy()
		const restClient = new EntityRestClientMock()
		logins = object()
		let userController = object<UserController>()
		when(userController.isUpdateForLoggedInUserInstance(matchers.anything(), matchers.anything())).thenReturn(false)
		when(logins.getUserController()).thenReturn(userController)

		inboxRuleHandler = object()
		model = new MailboxModel(downcast({}), new EntityClient(restClient), logins)
		// not pretty, but works
		model.mailboxDetails(mailboxDetails as MailboxDetail[])
	})
	o("doesn't send notification for another folder", async function () {
		await model.entityEventsReceived(
			[
				makeUpdate({
					instanceListId: anotherFolder.mails,
					operation: OperationType.CREATE,
				}),
			],
			"userGroupId",
		)
		o(showSpy.invocations.length).equals(0)
	})
	o("doesn't send notification for move operation", async function () {
		await model.entityEventsReceived(
			[
				makeUpdate({
					instanceListId: anotherFolder.mails,
					operation: OperationType.DELETE,
				}),
				makeUpdate({
					instanceListId: inboxFolder.mails,
					operation: OperationType.CREATE,
				}),
			],
			"userGroupId",
		)
		o(showSpy.invocations.length).equals(0)
	})

	function makeUpdate(arg: { instanceListId: string; operation: OperationType }): EntityUpdateData {
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
