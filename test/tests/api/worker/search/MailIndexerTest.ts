import o from "@tutao/otest"
import { EntityRestClientMock } from "../rest/EntityRestClientMock"
import { object, when } from "testdouble"
import { clientInitializedTypeModelResolver, createTestEntity } from "../../../TestUtils"
import { defaultMailIndexerNewMailDownloader, MailIndexerNewMailDownloader } from "../../../../../src/applications/mail-app/workerUtils/index/MailIndexer"
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

// NOTE: Refer to OfflineMailIndexerTest or WebMailIndexerTest for the actual mail indexer implementations.
//
// This just tests the shared mail downloader
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
