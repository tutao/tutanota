import o from "@tutao/otest"
import { MAIL_EXPORT_TOKEN_HEADER, MailExportFacade } from "../../../../../src/common/api/worker/facades/lazy/MailExportFacade.js"
import { MailExportTokenFacade } from "../../../../../src/common/api/worker/facades/lazy/MailExportTokenFacade.js"
import { BulkMailLoader } from "../../../../../src/mail-app/workerUtils/index/BulkMailLoader.js"
import { BlobFacade } from "../../../../../src/common/api/worker/facades/lazy/BlobFacade.js"
import { CryptoFacade } from "../../../../../src/common/api/worker/crypto/CryptoFacade.js"
import { object, when } from "testdouble"
import { createTestEntity } from "../../../TestUtils.js"
import { FileTypeRef, MailDetailsTypeRef, MailTypeRef } from "../../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { ArchiveDataType } from "../../../../../src/common/api/common/TutanotaConstants"
import { createReferencingInstance } from "../../../../../src/common/api/common/utils/BlobUtils"

o.spec("MailExportFacade", () => {
	const token = "my token"
	const tokenHeaders = { [MAIL_EXPORT_TOKEN_HEADER]: token }
	const mail1 = createTestEntity(MailTypeRef)
	const mail2 = createTestEntity(MailTypeRef)
	const details1 = createTestEntity(MailDetailsTypeRef)
	const details2 = createTestEntity(MailDetailsTypeRef)

	let facade!: MailExportFacade
	let tokenFacade!: MailExportTokenFacade
	let bulkMailLoader!: BulkMailLoader
	let blobFacade!: BlobFacade
	let cryptoFacade!: CryptoFacade

	o.beforeEach(() => {
		tokenFacade = {
			loadWithToken: (req) => req(token),
		} as Partial<MailExportTokenFacade> as MailExportTokenFacade
		bulkMailLoader = object()
		blobFacade = object()
		cryptoFacade = object()
		facade = new MailExportFacade(tokenFacade, bulkMailLoader, blobFacade, cryptoFacade)
	})

	o.test("loadFixedNumberOfMailsWithCache", async () => {
		when(bulkMailLoader.loadFixedNumberOfMailsWithCache("mailListId", "startId", { extraHeaders: tokenHeaders })).thenResolve([mail1, mail2])

		const result = await facade.loadFixedNumberOfMailsWithCache("mailListId", "startId")

		o(result).deepEquals([mail1, mail2])
	})

	o.test("loadMailDetails", async () => {
		const expected = [
			{ mail: mail1, mailDetails: details1 },
			{ mail: mail2, mailDetails: details2 },
		]
		when(bulkMailLoader.loadMailDetails([mail1, mail2], { extraHeaders: tokenHeaders })).thenResolve(expected)

		const result = await facade.loadMailDetails([mail1, mail2])

		o(result).deepEquals(expected)
	})

	o.test("loadAttachments", async () => {
		const expected = [createTestEntity(FileTypeRef), createTestEntity(FileTypeRef)]
		when(bulkMailLoader.loadAttachments([mail1, mail2], { extraHeaders: tokenHeaders })).thenResolve(expected)

		const result = await facade.loadAttachments([mail1, mail2])

		o(result).deepEquals(expected)
	})

	o.test("loadAttachmentData", async () => {
		const dataByteMail1 = new Uint8Array([1, 2, 3])
		const dataByteMail2 = new Uint8Array([4, 5, 6])
		const mailAttachments = [
			createTestEntity(FileTypeRef, { name: "mail1", mimeType: "img/png", cid: "12345", _id: ["attachment", "id1"] }),
			createTestEntity(FileTypeRef, { name: "mail2", mimeType: "pdf", cid: "12345", _id: ["attachment", "id2"] }),
		]

		when(cryptoFacade.enforceSessionKeyUpdateIfNeeded(mail1, mailAttachments)).thenResolve(mailAttachments)
		when(
			blobFacade.downloadAndDecryptMultipleInstances(
				ArchiveDataType.Attachments,
				[createReferencingInstance(mailAttachments[0]), createReferencingInstance(mailAttachments[1])],
				{
					extraHeaders: tokenHeaders,
				},
			),
		).thenResolve(
			new Map([
				["id1", Promise.resolve(dataByteMail1)],
				["id2", Promise.resolve(dataByteMail2)],
			]),
		)

		const result = await facade.loadAttachmentData(mail1, mailAttachments)

		o(result).deepEquals([
			{ _type: "DataFile", name: "mail1", mimeType: "img/png", data: dataByteMail1, cid: "12345", size: 3, id: ["attachment", "id1"] },
			{ _type: "DataFile", name: "mail2", mimeType: "pdf", data: dataByteMail2, cid: "12345", size: 3, id: ["attachment", "id2"] },
		])
	})
})
