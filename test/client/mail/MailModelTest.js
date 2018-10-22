//@flow
import o from "ospec/ospec.js"
import {Notifications} from "../../../src/gui/Notifications"
import type {Spy} from "../../api/TestUtils"
import {spy} from "../../api/TestUtils"
import type {MailboxDetail} from "../../../src/mail/MailModel"
import {MailModel} from "../../../src/mail/MailModel"
import {downcast} from "../../../src/api/common/utils/Utils"
import type {OperationTypeEnum} from "../../../src/api/common/TutanotaConstants"
import {MailFolderType, OperationType} from "../../../src/api/common/TutanotaConstants"
import {MailTypeRef} from "../../../src/api/entities/tutanota/Mail"
import {createMailFolder} from "../../../src/api/entities/tutanota/MailFolder"
import type {EntityUpdateData} from "../../../src/api/main/EntityEventController"

o.spec("MailModelTest", function () {
	let notifications: $Shape<Notifications>
	let showSpy: Spy
	let model: MailModel

	const inboxFolder = createMailFolder()
	inboxFolder.mails = "instanceListId"
	inboxFolder.folderType = MailFolderType.INBOX

	const anotherFolder = createMailFolder()
	anotherFolder.mails = "anotherListId"
	anotherFolder.folderType = MailFolderType.ARCHIVE

	const mailboxDetails: $Shape<MailboxDetail>[] = [
		{
			folders: [inboxFolder]
		}
	]

	o.beforeEach(function () {
		notifications = {}
		showSpy = notifications.showNotification = spy()
		model = new MailModel(downcast(notifications))
		// not pretty, but works
		model.mailboxDetails(mailboxDetails)
	})

	o("sends notification on new email in inbox", function () {
		model.entityEventsReceived([
			makeUpdate({
				instanceListId: inboxFolder.mails,
				operation: OperationType.CREATE
			})
		])
		o(showSpy.invocations.length).equals(1)
	})

	o("doesn't send notification for another folder", function () {
		model.entityEventsReceived([
			makeUpdate({
				instanceListId: anotherFolder.mails,
				operation: OperationType.CREATE
			})
		])
		o(showSpy.invocations.length).equals(0)
	})

	o("doesn't send notification for move operation", function () {
		model.entityEventsReceived([
			makeUpdate({
				instanceListId: anotherFolder.mails,
				operation: OperationType.DELETE
			}),
			makeUpdate({
				instanceListId: inboxFolder.mails,
				operation: OperationType.CREATE
			})
		])
		o(showSpy.invocations.length).equals(0)
	})

	function makeUpdate(arg: {instanceListId: string, operation: OperationTypeEnum}): EntityUpdateData {
		return Object.assign({}, {
			type: MailTypeRef.type,
			application: MailTypeRef.app,
			instanceId: "instanceId",
		}, arg)
	}
})