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
import { MailExportFacade } from "../../../../src/common/api/worker/facades/lazy/MailExportFacade.js"
import { BlobServerUrlTypeRef } from "../../../../src/common/api/entities/storage/TypeRefs"
import { ExportError, ExportErrorReason } from "../../../../src/common/api/common/error/ExportError"
import { MailboxExportState } from "../../../../src/common/desktop/export/MailboxExportPersistence"
import { spy } from "@tutao/tutanota-test-utils"
import { SuspensionError } from "../../../../src/common/api/common/error/SuspensionError"

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
				_id: "mailboxId",
				currentMailBag: createTestEntity(MailBagTypeRef, { _id: "currentMailBagId", mails: "currentMailList" }),
				archivedMailBags: [
					createTestEntity(MailBagTypeRef, { _id: "archivedMailBagId1", mails: "archivedMailList1" }),
					createTestEntity(MailBagTypeRef, { _id: "archivedMailBagId2", mails: "archivedMailList2" }),
				],
			}),
			mailGroup: createTestEntity(GroupTypeRef, {
				_id: "mailGroupId",
			}),
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

	function prepareMailData(mailBag: MailBag, startId: Id, num: number) {
		const mailDetails = createTestEntity(MailDetailsTypeRef, {
			sentDate: new Date(42),
			body: createTestEntity(BodyTypeRef, {
				compressedText: "body! compressed",
			}),
			recipients: createTestEntity(RecipientsTypeRef),
		})
		const attachmentInfo = createTestEntity(FileTypeRef, { _id: ["fileListId", "fileId"] })
		const mail = createTestEntity(MailTypeRef, {
			_id: ["mailListId", startId + `_${num}`],
			attachments: [attachmentInfo._id],
			receivedDate: new Date(43),
			sender: createTestEntity(MailAddressTypeRef, {
				name: "MailSender",
				address: "sender@list.com",
			}),
		})
		const attachmentData = new Uint8Array([1, 2, 3])
		const dataFile = createDataFile("test", "application/octet-stream", attachmentData)
		when(mailExportFacade.loadFixedNumberOfMailsWithCache(mailBag.mails, startId, matchers.anything())).thenResolve([mail])
		when(mailExportFacade.loadMailDetails([mail], matchers.anything())).thenResolve([{ mail, mailDetails }])
		when(mailExportFacade.loadAttachments([mail], matchers.anything())).thenResolve([attachmentInfo])
		when(mailExportFacade.loadAttachmentData(mail, [attachmentInfo])).thenResolve([dataFile])

		const mailBundle = makeMailBundle(sanitizer, mail, mailDetails, [dataFile])
		return { mail, mailBundle, mailDetails }
	}

	o.spec("startExport", function () {
		o.test("it updates the initial state", async function () {
			when(mailExportFacade.getExportServers(mailboxDetail.mailGroup)).thenResolve([createTestEntity(BlobServerUrlTypeRef, { url: "baseUrl" })])
			when(mailExportFacade.loadFixedNumberOfMailsWithCache(matchers.anything(), matchers.anything(), matchers.anything())).thenResolve([])
			await controller.startExport(mailboxDetail)
			verify(
				exportFacade.startMailboxExport(userId, mailboxDetail.mailbox._id, assertNotNull(mailboxDetail.mailbox.currentMailBag)._id, GENERATED_MAX_ID),
			)
		})

		o.test("it runs the export", async function () {
			when(mailExportFacade.getExportServers(mailboxDetail.mailGroup)).thenResolve([createTestEntity(BlobServerUrlTypeRef, { url: "baseUrl" })])

			const mailBag = assertNotNull(mailboxDetail.mailbox.currentMailBag)
			const { mail, mailBundle } = prepareMailData(mailBag, GENERATED_MAX_ID, 1)
			prepareMailData(assertNotNull(mailboxDetail.mailbox.archivedMailBags[0]), GENERATED_MAX_ID, 2)
			prepareMailData(assertNotNull(mailboxDetail.mailbox.archivedMailBags[1]), GENERATED_MAX_ID, 3)
			when(mailExportFacade.loadFixedNumberOfMailsWithCache(matchers.anything(), matchers.not(GENERATED_MAX_ID), matchers.anything())).thenResolve([])

			await controller.startExport(mailboxDetail)

			verify(exportFacade.saveMailboxExport(mailBundle, userId, mailBag._id, getElementId(mail)))
		})

		o.test("it sets state to locked when a LockedForUser ExportError is thrown", async function () {
			when(
				exportFacade.startMailboxExport(userId, mailboxDetail.mailbox._id, assertNotNull(mailboxDetail.mailbox.currentMailBag)._id, GENERATED_MAX_ID),
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
			const { mail, mailBundle } = prepareMailData(mailBag, initialMailId, 1)
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
			when(mailExportFacade.getExportServers(mailboxDetail.mailGroup)).thenResolve([createTestEntity(BlobServerUrlTypeRef, { url: "baseUrl" })])
			when(mailExportFacade.loadFixedNumberOfMailsWithCache(mailBag.mails, matchers.not(initialMailId), matchers.anything())).thenResolve([])
			when(mailExportFacade.loadFixedNumberOfMailsWithCache(matchers.not(mailBag.mails), matchers.anything(), matchers.anything())).thenResolve([])

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
		o.test("canceling resets the state", async function () {
			when(mailExportFacade.getExportServers(mailboxDetail.mailGroup)).thenResolve([createTestEntity(BlobServerUrlTypeRef, { url: "baseUrl" })])
			when(mailExportFacade.loadFixedNumberOfMailsWithCache(matchers.anything(), matchers.anything(), matchers.anything())).thenResolve([])
			const startPromise = controller.startExport(mailboxDetail)
			const cancelPromise = controller.cancelExport()
			o(controller.state().type).equals("idle")

			await Promise.all([startPromise, cancelPromise])
		})
	})

	o.spec("export loop", function () {
		o.test("it continues to load mail list", async function () {
			const mailBag = assertNotNull(mailboxDetail.mailbox.currentMailBag)
			const { mail: mail1 } = prepareMailData(mailBag, GENERATED_MAX_ID, 1)
			const { mail: mail2, mailBundle: mailBundle2 } = prepareMailData(mailBag, getElementId(mail1), 2)
			when(mailExportFacade.loadFixedNumberOfMailsWithCache(mailBag.mails, getElementId(mail2), matchers.anything())).thenResolve([])
			when(mailExportFacade.loadFixedNumberOfMailsWithCache(matchers.not(mailBag.mails), matchers.anything(), matchers.anything())).thenResolve([])
			when(mailExportFacade.getExportServers(mailboxDetail.mailGroup)).thenResolve([createTestEntity(BlobServerUrlTypeRef, { url: "baseUrl" })])

			await controller.startExport(mailboxDetail)

			verify(exportFacade.saveMailboxExport(mailBundle2, userId, mailBag._id, getElementId(mail2)))
			verify(exportFacade.endMailboxExport(userId))
		})

		o.test("it loops over mail bags", async function () {
			const currentMailBag = assertNotNull(mailboxDetail.mailbox.currentMailBag)
			const { mail: mail1, mailBundle: mailBundle1 } = prepareMailData(currentMailBag, GENERATED_MAX_ID, 1)
			when(mailExportFacade.loadFixedNumberOfMailsWithCache(currentMailBag.mails, getElementId(mail1), "baseUrl")).thenResolve([])
			const archivedMailBag1 = mailboxDetail.mailbox.archivedMailBags[0]
			const { mail: mail2, mailBundle: mailBundle2 } = prepareMailData(archivedMailBag1, GENERATED_MAX_ID, 2)
			when(mailExportFacade.loadFixedNumberOfMailsWithCache(archivedMailBag1.mails, getElementId(mail2), "baseUrl")).thenResolve([])
			const archivedMailBag2 = mailboxDetail.mailbox.archivedMailBags[1]
			const { mail: mail3, mailBundle: mailBundle3 } = prepareMailData(archivedMailBag2, GENERATED_MAX_ID, 3)
			when(mailExportFacade.loadFixedNumberOfMailsWithCache(archivedMailBag2.mails, getElementId(mail3), "baseUrl")).thenResolve([])
			when(mailExportFacade.getExportServers(mailboxDetail.mailGroup)).thenResolve([
				{
					_id: "id",
					url: "baseUrl",
					_type: BlobServerUrlTypeRef,
				},
			])

			await controller.startExport(mailboxDetail)

			verify(exportFacade.saveMailboxExport(mailBundle1, userId, currentMailBag._id, getElementId(mail1)))
			verify(exportFacade.saveMailboxExport(mailBundle2, userId, archivedMailBag1._id, getElementId(mail2)))
			verify(exportFacade.saveMailboxExport(mailBundle3, userId, archivedMailBag2._id, getElementId(mail3)))
			verify(exportFacade.endMailboxExport(userId))
		})

		o.test("it loops over servers", async function () {
			when(mailExportFacade.getExportServers(mailboxDetail.mailGroup)).thenResolve([
				{ _id: "id", url: "baseUrl1", _type: BlobServerUrlTypeRef },
				{ _id: "id", url: "baseUrl2", _type: BlobServerUrlTypeRef },
				{ _id: "id", url: "baseUrl3", _type: BlobServerUrlTypeRef },
			])
			const currentMailBag = assertNotNull(mailboxDetail.mailbox.currentMailBag)
			const { mail: mail1, mailBundle: mailBundle1, mailDetails: mailDetails1 } = prepareMailData(currentMailBag, GENERATED_MAX_ID, 1)
			when(mailExportFacade.loadFixedNumberOfMailsWithCache(currentMailBag.mails, getElementId(mail1), matchers.anything())).thenResolve([])
			when(mailExportFacade.loadFixedNumberOfMailsWithCache(matchers.not(currentMailBag.mails), matchers.anything(), matchers.anything())).thenResolve([])

			await controller.startExport(mailboxDetail)

			verify(mailExportFacade.loadFixedNumberOfMailsWithCache(currentMailBag.mails, GENERATED_MAX_ID, "baseUrl2"))
			verify(mailExportFacade.loadMailDetails([mail1], "baseUrl3"))
			verify(mailExportFacade.loadAttachments([mail1], "baseUrl1"))
			verify(mailExportFacade.loadAttachmentData(mail1, matchers.anything()))
		})
	})

	o.spec("handle errors", function () {
		o.test("SuspensionError", async () => {
			when(mailExportFacade.getExportServers(mailboxDetail.mailGroup)).thenResolve([
				{
					_id: "id",
					url: "baseUrl",
					_type: BlobServerUrlTypeRef,
				},
			])
			let wasThrown = false
			when(mailExportFacade.loadFixedNumberOfMailsWithCache(matchers.anything(), matchers.anything(), matchers.anything())).thenDo(() => {
				if (wasThrown) {
					return Promise.resolve([])
				} else {
					wasThrown = true
					return Promise.reject(new SuspensionError(":(", "10"))
				}
			})
			await controller.startExport(mailboxDetail)
			verify(mailExportFacade.loadFixedNumberOfMailsWithCache(matchers.anything(), matchers.anything(), matchers.anything()), { times: 3 + 1 })
			o(wasThrown).equals(true)
		})
	})
})
