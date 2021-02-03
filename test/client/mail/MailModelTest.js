//@flow
import o from "ospec"
import {Notifications} from "../../../src/gui/Notifications"
import type {Spy} from "../../api/TestUtils"
import {spy} from "../../api/TestUtils"
import type {MailboxDetail} from "../../../src/mail/model/MailModel"
import {MailModel} from "../../../src/mail/model/MailModel"
import {downcast} from "../../../src/api/common/utils/Utils"
import type {OperationTypeEnum} from "../../../src/api/common/TutanotaConstants"
import {MailFolderType, OperationType} from "../../../src/api/common/TutanotaConstants"
import {MailTypeRef} from "../../../src/api/entities/tutanota/Mail"
import {createMailFolder} from "../../../src/api/entities/tutanota/MailFolder"
import type {EntityUpdateData} from "../../../src/api/main/EventController"
import {worker} from "../../../src/api/main/WorkerClient"
import {EntityClient} from "../../../src/api/common/EntityClient"

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
		model = new MailModel(downcast(notifications), downcast({}), worker, new EntityClient(worker))
		// not pretty, but works
		model.mailboxDetails(mailboxDetails)
	})

	// FIXME No way to inject entityRestClient for now
	// o("sends notification on new email in inbox", function () {
	// 	model.entityEventsReceived([
	// 		makeUpdate({
	// 			instanceListId: inboxFolder.mails,
	// 			operation: OperationType.CREATE
	// 		})
	// 	])
	// 	o(showSpy.invocations.length).equals(1)
	// })

	o("doesn't send notification for another folder", async function () {
		await model.entityEventsReceived([
			makeUpdate({
				instanceListId: anotherFolder.mails,
				operation: OperationType.CREATE
			})
		])
		o(showSpy.invocations.length).equals(0)
	})

	o("doesn't send notification for move operation", async function () {
		await model.entityEventsReceived([
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
