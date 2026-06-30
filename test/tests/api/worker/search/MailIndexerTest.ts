import o, { assertThrows } from "@tutao/otest"
import { EntityRestClientMock } from "../rest/EntityRestClientMock"
import { object, when } from "testdouble"
import { clientInitializedTypeModelResolver, createTestEntity } from "../../../TestUtils"
import {
	abortAware,
	defaultMailIndexerNewMailDownloader,
	MailIndexerNewMailDownloader,
} from "../../../../../src/applications/mail-app/workerUtils/index/MailIndexer"
import { MailFacade } from "../../../../../src/applications/common/api/worker/facades/lazy/MailFacade"
import {
	BodyTypeRef,
	FileTypeRef,
	Mail,
	MailDetails,
	MailDetailsBlobTypeRef,
	MailDetailsDraftTypeRef,
	MailDetailsTypeRef,
	MailTypeRef,
} from "@tutao/entities/tutanota"
import { EntityClient } from "../../../../../src/platform-kit/network/EntityClient"
import { assertNotNull } from "../../../../../src/platform-kit/utils"
import { CancelledError } from "../../../../../src/platform-kit/app-env"

// NOTE: Refer to OfflineMailIndexerTest or WebMailIndexerTest for the actual mail indexer implementations.
//
// This just tests some shared functionality
o.spec("MailIndexer", () => {
	o.spec("MailIndexerNewMailDownloader", () => {
		let downloader: MailIndexerNewMailDownloader
		let entityClient: EntityRestClientMock
		let mailFacade: MailFacade
		let mailDetails: MailDetails

		let mail: Mail
		const mailId: IdTuple = ["mail list", "mail element"]
		const attachments = [
			createTestEntity(FileTypeRef, {
				name: "a file!",
			}),
		]

		o.beforeEach(() => {
			const typeModelResolver = clientInitializedTypeModelResolver()
			mailFacade = object()
			entityClient = new EntityRestClientMock()
			downloader = defaultMailIndexerNewMailDownloader(new EntityClient(entityClient, typeModelResolver), mailFacade)

			mailDetails = createTestEntity(MailDetailsTypeRef, {
				body: createTestEntity(BodyTypeRef, {
					compressedText: "It's a mail body!",
				}),
			})

			mail = createTestEntity(MailTypeRef, {
				_id: mailId,
				_ownerEncSessionKey: new Uint8Array(),
			})

			entityClient.addListInstances(mail, ...attachments)

			when(mailFacade.loadAttachments(mail)).thenResolve(attachments)
		})

		o.test("draft", async () => {
			mail.mailDetailsDraft = ["draft list", "draft element"]

			entityClient.addListInstances(
				createTestEntity(MailDetailsDraftTypeRef, {
					_id: mail.mailDetailsDraft,
					details: mailDetails,
				}),
			)

			const download = assertNotNull(await downloader(mailId))
			o.check(download.mail).deepEquals(mail)
			o.check(download.attachments).deepEquals(attachments)
			o.check(download.mailDetails).deepEquals(mailDetails)
		})

		o.test("non-draft", async () => {
			mail.mailDetails = ["blob archive", "blob element"]

			entityClient.addBlobInstances(
				createTestEntity(MailDetailsBlobTypeRef, {
					_id: mail.mailDetails,
					details: mailDetails,
				}),
			)

			const download = assertNotNull(await downloader(mailId))
			o.check(download.mail).deepEquals(mail)
			o.check(download.attachments).deepEquals(attachments)
			o.check(download.mailDetails).deepEquals(mailDetails)
		})
	})

	o.spec("abortAware", () => {
		let abortController: AbortController
		o.beforeEach(() => {
			abortController = new AbortController()
		})

		o.test("aborting", async () => {
			// this promise never resolves; it's a lie!
			const cake = new Promise(() => {})
			const promise = abortAware(abortController, () => cake)

			// abortAware races with the abort event, thus we shouldn't actually wait for the lie
			abortController.abort("the cake is a lie")
			await assertThrows(CancelledError, () => promise)
		})
		o.test("success", async () => {
			// pie is never a lie
			const pie = Promise.resolve(3.14)
			const promise = await abortAware(abortController, () => pie)
			o.check(promise).equals(3.14)
		})
	})
})
