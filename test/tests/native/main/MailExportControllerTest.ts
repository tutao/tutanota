import o from "@tutao/otest"
import { MailExportController } from "../../../../src/mail-app/native/main/MailExportController.js"
import { matchers, object, verify, when } from "testdouble"
import { HtmlSanitizer } from "../../../../src/common/misc/HtmlSanitizer.js"
import { ExportFacade } from "../../../../src/common/native/common/generatedipc/ExportFacade.js"
import { LoginController } from "../../../../src/common/api/main/LoginController.js"
import { MailboxDetail, MailboxModel } from "../../../../src/common/mailFunctionality/MailboxModel.js"
import { createTestEntity, SchedulerMock } from "../../TestUtils.js"
import {
	BodyTypeRef,
	FileTypeRef,
	MailAddressTypeRef,
	MailBag,
	MailBagTypeRef,
	MailboxGroupRootTypeRef,
	MailBoxTypeRef,
	MailDetailsTypeRef,
	MailTypeRef,
	RecipientsTypeRef,
} from "../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { GroupInfoTypeRef, GroupTypeRef } from "../../../../src/common/api/entities/sys/TypeRefs.js"
import { UserController } from "../../../../src/common/api/main/UserController.js"
import { GENERATED_MAX_ID, getElementId } from "../../../../src/common/api/common/utils/EntityUtils.js"
import { assertNotNull } from "@tutao/tutanota-utils"
import { createDataFile } from "../../../../src/common/api/common/DataFile.js"
import { makeMailBundle } from "../../../../src/mail-app/mail/export/Bundler.js"
import { MailboxExportState } from "../../../../src/common/desktop/export/MailboxExportPersistence.js"
import { MailExportFacade } from "../../../../src/common/api/worker/facades/lazy/MailExportFacade.js"
import { spy } from "@tutao/tutanota-test-utils"
import { ExportError, ExportErrorReason } from "../../../../src/common/api/common/error/ExportError"

o.spec("MailExportController", function () {
	const userId = "userId"

	let controller: MailExportController
	let mailExportFacade: MailExportFacade
	let exportFacade: ExportFacade
	let logins: LoginController
	let mailboxModel: MailboxModel
	let mailboxDetail: MailboxDetail
	let userController: UserController
	let scheduler: SchedulerMock

	const sanitizer = {
		sanitizeHTML: (text, _) => ({ html: text, blockedExternalContent: 0, inlineImageCids: [], links: [] }),
	} as Partial<HtmlSanitizer> as HtmlSanitizer

	o.beforeEach(function () {
		userController = { userId: userId } as Partial<UserController> as UserController
		mailboxDetail = {
			mailbox: createTestEntity(MailBoxTypeRef, {
				currentMailBag: createTestEntity(MailBagTypeRef),
				archivedMailBags: [createTestEntity(MailBagTypeRef), createTestEntity(MailBagTypeRef)],
			}),
			mailGroup: createTestEntity(GroupTypeRef),
			mailGroupInfo: createTestEntity(GroupInfoTypeRef),
			mailboxGroupRoot: createTestEntity(MailboxGroupRootTypeRef),
		}
		mailExportFacade = object()
		exportFacade = object()
		logins = object()
		when(logins.getUserController()).thenReturn(userController)
		mailboxModel = object()
		when(mailboxModel.getMailboxDetailByMailboxId(mailboxDetail.mailbox._id)).thenResolve(mailboxDetail)
		scheduler = new SchedulerMock()

		controller = new MailExportController(mailExportFacade, sanitizer, exportFacade, logins, mailboxModel, scheduler)
	})

	function prepareMailData(mailBag: MailBag, startId: Id) {
		const mailDetails = createTestEntity(MailDetailsTypeRef, {
			sentDate: new Date(42),
			body: createTestEntity(BodyTypeRef, {
				compressedText: "body! compressed",
			}),
			recipients: createTestEntity(RecipientsTypeRef),
		})
		const attachmentInfo = createTestEntity(FileTypeRef, { _id: ["fileListId", "fileId"] })
		const mail = createTestEntity(MailTypeRef, {
			_id: ["mailListId", startId + "_1"],
			attachments: [attachmentInfo._id],
			receivedDate: new Date(43),
			sender: createTestEntity(MailAddressTypeRef, {
				name: "MailSender",
				address: "sender@list.com",
			}),
		})
		const attachmentData = new Uint8Array([1, 2, 3])
		const dataFile = createDataFile("test", "application/octet-stream", attachmentData)
		when(mailExportFacade.loadFixedNumberOfMailsWithCache(mailBag.mails, startId)).thenResolve([mail])
		when(mailExportFacade.loadMailDetails([mail])).thenResolve([{ mail, mailDetails }])
		when(mailExportFacade.loadAttachments([mail])).thenResolve([attachmentInfo])
		when(mailExportFacade.loadAttachmentData(mail, [attachmentInfo])).thenResolve([dataFile])

		const mailBundle = makeMailBundle(sanitizer, mail, mailDetails, [dataFile])
		return { mail, mailBundle, mailDetails }
	}

	o.spec("startExport", function () {
		o.test("it updates the initial state", function () {
			controller.startExport(mailboxDetail)
			verify(
				exportFacade.startMailboxExport(userId, mailboxDetail.mailbox._id, assertNotNull(mailboxDetail.mailbox.currentMailBag).mails, GENERATED_MAX_ID),
			)
		})

		o.test("it runs the export", async function () {
			const mailBag = assertNotNull(mailboxDetail.mailbox.currentMailBag)
			const { mail, mailBundle } = prepareMailData(mailBag, GENERATED_MAX_ID)
			when(mailExportFacade.loadFixedNumberOfMailsWithCache(mailBag.mails, getElementId(mail))).thenResolve([])

			await controller.startExport(mailboxDetail)

			verify(exportFacade.saveMailboxExport(mailBundle, userId, mailBag._id, getElementId(mail)))
		})

		o.test("it sets state to locked when a LockedForUser ExportError is thrown", async function () {
			when(
				exportFacade.startMailboxExport(userId, mailboxDetail.mailbox._id, assertNotNull(mailboxDetail.mailbox.currentMailBag).mails, GENERATED_MAX_ID),
			).thenReject(new ExportError("message", ExportErrorReason.LockedForUser))
			await controller.startExport(mailboxDetail)
			o(controller.state().type).equals("locked")
		})
	})

	o.spec("resumeIfNeeded", function () {
		o.test("when the persisted state is finished it does not continue with export", function () {
			when(exportFacade.getMailboxExportState(userId)).thenResolve({ type: "finished" })

			verify(exportFacade.saveMailboxExport(matchers.anything(), matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
			o(controller.state().type).equals("idle")
		})

		o.test("when persisted state is running it runs the export", async function () {
			const initialMailId = "initialMailId"
			const mailBag = assertNotNull(mailboxDetail.mailbox.currentMailBag)
			const { mail, mailBundle } = prepareMailData(mailBag, initialMailId)
			const persistedState: MailboxExportState = {
				type: "running",
				mailboxId: mailboxDetail.mailbox._id,
				userId,
				mailId: initialMailId,
				mailBagId: mailBag._id,
				exportedMails: 0,
				exportDirectoryPath: "directory",
			}
			when(exportFacade.getMailboxExportState(userId)).thenResolve(persistedState)
			when(mailExportFacade.loadFixedNumberOfMailsWithCache(mailBag.mails, getElementId(mail))).thenResolve([])

			await controller.resumeIfNeeded()

			verify(exportFacade.saveMailboxExport(mailBundle, userId, mailBag._id, getElementId(mail)))
		})

		o.test("when the exportFacade returns a locked state, the state is set to locked and retry is scheduled", async function () {
			when(exportFacade.getMailboxExportState(userId)).thenResolve({ type: "locked", userId })
			scheduler.scheduleAfter = spy()

			await controller.resumeIfNeeded()

			o(scheduler.scheduleAfter.callCount).equals(1)
			o(scheduler.scheduleAfter.args[1]).equals(1000 * 60 * 5) // 5 min
			o(controller.state().type).equals("locked")
		})
	})

	o.spec("cancelExport", function () {
		o.test("canceling resets the state", function () {
			controller.startExport(mailboxDetail)
			controller.cancelExport()
			o(controller.state().type).equals("idle")
		})
	})

	o.spec("export loop", function () {
		o.test("it continues to load mail list", async function () {
			const mailBag = assertNotNull(mailboxDetail.mailbox.currentMailBag)
			const { mail: mail1 } = prepareMailData(mailBag, GENERATED_MAX_ID)
			const { mail: mail2, mailBundle: mailBundle2 } = prepareMailData(mailBag, getElementId(mail1))
			when(mailExportFacade.loadFixedNumberOfMailsWithCache(mailBag.mails, getElementId(mail2))).thenResolve([])

			await controller.startExport(mailboxDetail)

			verify(exportFacade.saveMailboxExport(mailBundle2, userId, mailBag._id, getElementId(mail2)))
			verify(exportFacade.endMailboxExport(userId))
		})

		o.test("it loops over mail bags", async function () {
			const currentMailBag = assertNotNull(mailboxDetail.mailbox.currentMailBag)
			const { mail: mail1, mailBundle: mailBundle1 } = prepareMailData(currentMailBag, GENERATED_MAX_ID)
			when(mailExportFacade.loadFixedNumberOfMailsWithCache(currentMailBag.mails, getElementId(mail1))).thenResolve([])
			const archivedMailBag1 = mailboxDetail.mailbox.archivedMailBags[0]
			const { mail: mail2, mailBundle: mailBundle2 } = prepareMailData(archivedMailBag1, GENERATED_MAX_ID)
			when(mailExportFacade.loadFixedNumberOfMailsWithCache(archivedMailBag1.mails, getElementId(mail2))).thenResolve([])
			const archivedMailBag2 = mailboxDetail.mailbox.archivedMailBags[1]
			const { mail: mail3, mailBundle: mailBundle3 } = prepareMailData(archivedMailBag2, GENERATED_MAX_ID)
			when(mailExportFacade.loadFixedNumberOfMailsWithCache(archivedMailBag2.mails, getElementId(mail3))).thenResolve([])

			await controller.startExport(mailboxDetail)

			verify(exportFacade.saveMailboxExport(mailBundle1, userId, currentMailBag._id, getElementId(mail1)))
			verify(exportFacade.saveMailboxExport(mailBundle2, userId, archivedMailBag1._id, getElementId(mail2)))
			verify(exportFacade.saveMailboxExport(mailBundle3, userId, archivedMailBag2._id, getElementId(mail3)))
			verify(exportFacade.endMailboxExport(userId))
		})
	})
})
