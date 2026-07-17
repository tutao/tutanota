import o from "@tutao/otest"
import { clientInitializedTypeModelResolver, createTestEntity } from "../../../TestUtils"
import { MailFacade } from "../../../../../src/applications/common/api/worker/facades/lazy/MailFacade"
import { OfflineMailIndexer } from "../../../../../src/applications/mail-app/workerUtils/index/OfflineMailIndexer"
import { OfflineStoragePersistence } from "../../../../../src/applications/mail-app/workerUtils/index/OfflineStoragePersistence"
import { BlobFacade } from "../../../../../src/applications/common/api/worker/facades/lazy/BlobFacade"
import { EntityRestClientMock } from "../rest/EntityRestClientMock"
import { CryptoMapper, EncryptedParsedInstance, EntityAdapter, ModelMapper, ServerTypeModelResolver } from "../../../../../src/platform-kit/instance-pipeline"
import { InfoMessageHandler } from "../../../../../src/applications/common/gui/InfoMessageHandler"
import { MailIndexerNewMailDownloader } from "../../../../../src/applications/mail-app/workerUtils/index/MailIndexer"
import { GroupMembershipTypeRef, User, UserTypeRef } from "@tutao/entities/sys"
import {
	BlobElementEntity,
	compareOldestFirst,
	elementIdPart,
	EntityIdEncoding,
	GENERATED_MAX_ID,
	GENERATED_MIN_ID,
	getElementId,
	getListId,
	idToElementId,
	listIdPart,
	ServerTypeModel,
} from "../../../../../src/platform-kit/meta"
import {
	BodyTypeRef,
	File,
	FileTypeRef,
	ImportedFileMail,
	ImportedFileMailTypeRef,
	Mail,
	MailBagTypeRef,
	MailboxGroupRootTypeRef,
	MailBoxTypeRef,
	MailDetailsBlob,
	MailDetailsBlobTypeRef,
	MailDetailsTypeRef,
	MailSetEntry,
	MailSetEntryTypeRef,
	MailTypeRef,
} from "@tutao/entities/tutanota"
import { func, matchers, object, verify, when } from "testdouble"
import { EntityClient } from "../../../../../src/platform-kit/network/EntityClient"
import { GroupType } from "../../../../../src/entities/sys/Utils"
import { FULL_INDEXED_TIMESTAMP, NOTHING_INDEXED_TIMESTAMP } from "../../../../../src/platform-kit/app-env"
import { MailWithDetailsAndAttachments } from "../../../../../src/applications/mail-app/workerUtils/index/MailIndexerBackend"
import { assertNotNull, collectToMap, deepEqual } from "../../../../../src/platform-kit/utils"
import { CryptoFacade } from "../../../../../src/platform-kit/base/base-crypto/CryptoFacade"
import { aes256RandomKey } from "@tutao/crypto/symmetric-cipher-utils"

o.spec("OfflineMailIndexer", () => {
	let mailIndexer: OfflineMailIndexer
	let persistence: OfflineStoragePersistence
	let blobs: BlobFacade
	let mailFacade: MailFacade
	let entityRestClientMock: EntityRestClientMock
	let serverTypeModelResolver: ServerTypeModelResolver
	let modelMapper: ModelMapper
	let infoMessageHandler: InfoMessageHandler
	let crypto: CryptoFacade
	let newMailDownloader: MailIndexerNewMailDownloader
	let cryptoMapper: CryptoMapper
	let user: User
	let entityAdapterFactory: (model: ServerTypeModel, blob: EncryptedParsedInstance) => Promise<EntityAdapter>

	const userId = "userId"
	const mailGroupId = "I'm a mail group!"

	let mail: Mail
	let mailSetEntry: MailSetEntry

	o.beforeEach(() => {
		const typeModelResolver = clientInitializedTypeModelResolver()
		modelMapper = object()
		persistence = object()
		blobs = object()
		entityRestClientMock = new EntityRestClientMock()
		mailFacade = object()
		crypto = object()
		serverTypeModelResolver = object()
		infoMessageHandler = object()
		newMailDownloader = func<MailIndexerNewMailDownloader>()
		cryptoMapper = object()

		entityAdapterFactory = () => {
			throw new Error("no entity adapter factory defined")
		}

		mailIndexer = new OfflineMailIndexer(
			persistence,
			blobs,
			new EntityClient(entityRestClientMock, typeModelResolver),
			mailFacade,
			crypto,
			serverTypeModelResolver,
			modelMapper,
			infoMessageHandler,
			newMailDownloader,
			cryptoMapper,
			(model, blob) => entityAdapterFactory(model, blob),
		)
		user = createTestEntity(UserTypeRef, {
			_id: idToElementId(userId),
		})
		mail = createTestEntity(MailTypeRef, {
			_id: ["---------z-z", "---------zzz"],
			_ownerGroup: mailGroupId,
		})

		mailSetEntry = createTestEntity(MailSetEntryTypeRef, {
			_id: ["mailSetEntryList", "mailSetEntryElement"],
			mail: mail._id,
			_ownerGroup: mailGroupId,
		})

		const storedBlobs: Map<Id, FakeServerEntity<any>> = new Map()

		when(persistence.retrieveEncryptedMailDetailsBlob(matchers.anything(), matchers.anything())).thenDo(
			async (_, blobId) => storedBlobs.get(blobId) ?? null,
		)

		when(persistence.storeEncryptedMailDetailsBlobs(matchers.anything(), matchers.anything())).thenDo(async (_, blobs: readonly any[]) => {
			for (const b of blobs) {
				if (!(b instanceof FakeServerEntity)) {
					throw new Error("wrong object passed into storeEncryptedMailDetailsBlobs")
				}
				storedBlobs.set(elementIdPart(b.entity._id), b)
			}
		})

		when(
			cryptoMapper.decryptParsedInstance(matchers.anything(), matchers.anything(), matchers.anything(), matchers.anything(), matchers.anything()),
		).thenDo(async (_, instance: any) => {
			if (!(instance instanceof FakeServerEntity)) {
				throw new Error("wrong object passed into decryptParsedInstance")
			}
			return instance.entity
		})

		when(modelMapper.mapToInstance(matchers.anything())).thenDo(async (_, i) => i)
		when(persistence.getImportQueueEntries()).thenResolve([])
	})

	function addTestMail() {
		entityRestClientMock.addListInstances(mail, mailSetEntry)
	}

	o.spec("afterMailUpdated", () => {
		o.test("non-draft", async () => {
			addTestMail()
			mail.mailDetails = ["whooooa", "i'm a blob :D"]
			await mailIndexer.afterMailUpdated(mail._id)
			verify(persistence.updateMailLocation(mail))
		})

		o.test("draft", async () => {
			addTestMail()
			const mailData = { mail } as any
			when(newMailDownloader(mail._id)).thenResolve(mailData)

			mail.mailDetailsDraft = ["whooooa", "i'm NOT a blob :D"]
			await mailIndexer.afterMailUpdated(mail._id)
			verify(persistence.storeMailData([mailData]))
		})
	})

	o.test("afterMailCreated", async () => {
		addTestMail()
		const mailData = { mail } as any
		when(newMailDownloader(mail._id)).thenResolve(mailData)
		await mailIndexer.afterMailCreated(mail._id)
		verify(persistence.storeMailData([mailData]))
	})

	o.test("beforeMailDeleted", async () => {
		addTestMail()
		await mailIndexer.beforeMailDeleted(mail._id)
		verify(persistence.deleteMailData(mail._id))
	})

	o.test("index one mail", async () => {
		mail.mailDetails = ["whooooa", "i'm a blob :D"]

		when(crypto.resolveSessionKey(matchers.anything())).thenResolve(aes256RandomKey())

		const mailDetails = createTestEntity(MailDetailsBlobTypeRef, {
			_id: mail.mailDetails,
			details: createTestEntity(MailDetailsTypeRef),
		})

		when(blobs.downloadFullEncryptedBlobElementEntityArchive(MailDetailsBlobTypeRef, listIdPart(mail.mailDetails))).thenResolve([
			new FakeServerEntity(mailDetails) as any,
		])

		entityAdapterFactory = (_, b) => {
			return { encryptedParsedInstance: b as any as FakeServerEntity<BlobElementEntity>, _kdfNonce: null } as any
		}

		addTestMail()

		const mailboxId = "I'm a mailbox!"

		entityRestClientMock.addElementInstances(
			createTestEntity(MailboxGroupRootTypeRef, {
				_id: idToElementId(mailGroupId),
				mailbox: mailboxId,
			}),
			createTestEntity(MailBoxTypeRef, {
				_id: idToElementId(mailboxId),
				_ownerGroup: mailGroupId,
				currentMailBag: createTestEntity(MailBagTypeRef, {
					mails: listIdPart(mail._id),
				}),
			}),
		)

		const attachments = [
			createTestEntity(FileTypeRef, {
				name: `this is a file.txt`,
			}),
		]
		when(mailFacade.loadAttachments(mail)).thenResolve(attachments)
		when(persistence.getIndexedGroups()).thenResolve([
			{
				groupId: mailGroupId,
				type: GroupType.Mail,
				indexedTimestamp: NOTHING_INDEXED_TIMESTAMP,
				lastIndexedEntityListId: GENERATED_MAX_ID,
				lastIndexedEntityElementId: GENERATED_MAX_ID,
			},
		])

		user.memberships = [
			createTestEntity(GroupMembershipTypeRef, {
				group: mailGroupId,
				groupType: GroupType.Mail,
			}),
		]

		await mailIndexer.extendMailIndex(user)

		verify(
			persistence.storeMailData([
				{
					mail,
					mailDetails: mailDetails.details,
					attachments,
				},
			]),
		)

		verify(persistence.updateIndexingTimestamp(mailGroupId, FULL_INDEXED_TIMESTAMP))
		verify(persistence.clearEncryptedMailDetailsBlobs())
	})

	o.test("index 2000 mails", async () => {
		// two pages
		const mailCount = 1000 * 2

		const mails: MailWithDetailsAndAttachments[] = []
		const detailBlobs: FakeServerEntity<MailDetailsBlob>[] = []

		const archiveId = "WHOA, I store LOTS of cool stuff!"
		const mailListId = getListId(mail)

		for (let i = 0; i < mailCount; i++) {
			const mailDetails = createTestEntity(MailDetailsBlobTypeRef, {
				_id: [archiveId, `I am blob #${i}. FEAR ME!`],
				details: createTestEntity(MailDetailsTypeRef, {
					body: createTestEntity(BodyTypeRef, {
						compressedText: `I am smol compressed text #${i}. You will INDEX me and you will LIKE it.`,
					}),
				}),
			})
			const mailMail = createTestEntity(MailTypeRef, {
				_id: [mailListId, `${i}`.padStart(GENERATED_MIN_ID.length, "0")],
				mailDetails: mailDetails._id,
			})
			const mailAttachments = [
				createTestEntity(FileTypeRef, {
					name: `mail_${i}.jxl`,
				}),
			]
			mails.push({
				mailDetails: mailDetails.details,
				mail: mailMail,
				attachments: mailAttachments,
			})
			detailBlobs.push(new FakeServerEntity(mailDetails))
			entityRestClientMock.addListInstances(mailMail)
		}

		// adding a stub for every single mail is slow
		const mailsMap = collectToMap(mails, (m) => getElementId(m.mail))
		when(mailFacade.loadAttachments(matchers.anything())).thenDo((mailToFind: Mail) => {
			return Promise.resolve(assertNotNull(mailsMap.get(getElementId(mailToFind)), `no ${getElementId(mailToFind)}`).attachments)
		})

		when(crypto.resolveSessionKey(matchers.anything())).thenResolve(aes256RandomKey())
		when(blobs.downloadFullEncryptedBlobElementEntityArchive(MailDetailsBlobTypeRef, archiveId)).thenResolve(detailBlobs as any)

		entityAdapterFactory = (_, b) => {
			return { encryptedParsedInstance: b as any as FakeServerEntity<BlobElementEntity>, _kdfNonce: null } as any
		}

		const mailboxId = "I'm a mailbox!"

		entityRestClientMock.addElementInstances(
			createTestEntity(MailboxGroupRootTypeRef, {
				_id: idToElementId(mailGroupId),
				mailbox: mailboxId,
			}),
			createTestEntity(MailBoxTypeRef, {
				_id: idToElementId(mailboxId),
				_ownerGroup: mailGroupId,
				currentMailBag: createTestEntity(MailBagTypeRef, {
					mails: mailListId,
				}),
			}),
		)

		when(persistence.getIndexedGroups()).thenResolve([
			{
				groupId: mailGroupId,
				type: GroupType.Mail,
				indexedTimestamp: NOTHING_INDEXED_TIMESTAMP,
				lastIndexedEntityListId: GENERATED_MAX_ID,
				lastIndexedEntityElementId: GENERATED_MAX_ID,
			},
		])

		user.memberships = [
			createTestEntity(GroupMembershipTypeRef, {
				group: mailGroupId,
				groupType: GroupType.Mail,
			}),
		]

		await mailIndexer.extendMailIndex(user)

		// note: getRange just gets everything with the mock, and we're not guaranteed (or likely) to store in order, so
		// we need to compare sorted
		verify(
			persistence.storeMailData(
				matchers.argThat((arr: readonly MailWithDetailsAndAttachments[]) => {
					const sorted = arr.toSorted((a, b) => compareOldestFirst(getElementId(a.mail), getElementId(b.mail), EntityIdEncoding.Base64Ext))
					return deepEqual(sorted, mails)
				}),
			),
		)

		verify(persistence.updateIndexingTimestamp(mailGroupId, FULL_INDEXED_TIMESTAMP))
		verify(persistence.clearEncryptedMailDetailsBlobs())
	})

	o.spec("import mails", () => {
		let importedMail: ImportedFileMail
		let mailDetails: MailDetailsBlob
		let attachments: File[]

		o.beforeEach(async () => {
			mail.mailDetails = ["whooooa", "i'm a blob :D"]

			importedMail = createTestEntity(ImportedFileMailTypeRef, {
				_id: ["imported mails list", "an imported mail"],
				mailSetEntry: mailSetEntry._id,
				_ownerGroup: mailGroupId,
			})

			mailDetails = createTestEntity(MailDetailsBlobTypeRef, {
				_id: mail.mailDetails,
				details: createTestEntity(MailDetailsTypeRef),
			})
			attachments = []

			when(mailFacade.loadAttachments(mail)).thenResolve(attachments)
			entityRestClientMock.addListInstances(importedMail)

			when(persistence.getImportQueueProgress(listIdPart(importedMail._id))).thenResolve(GENERATED_MAX_ID)
			when(crypto.resolveSessionKey(matchers.anything())).thenResolve(aes256RandomKey())

			when(blobs.downloadFullEncryptedBlobElementEntityArchive(MailDetailsBlobTypeRef, listIdPart(mail.mailDetails))).thenResolve([
				new FakeServerEntity(mailDetails) as any,
			])

			entityAdapterFactory = (_, b) => {
				return { encryptedParsedInstance: b as any as FakeServerEntity<BlobElementEntity>, _kdfNonce: null } as any
			}

			addTestMail()
		})

		function do_verify() {
			verify(
				persistence.storeMailData([
					{
						mail,
						mailDetails: mailDetails.details,
						attachments,
					},
				]),
			)
			verify(persistence.removeImportQueueEntry(listIdPart(importedMail._id)))
			verify(persistence.clearEncryptedMailDetailsBlobs())
			verify(persistence.updateImportQueueProgress(listIdPart(importedMail._id), elementIdPart(mail._id)))
		}

		o.test("beforeImportedMailFinished", async () => {
			await mailIndexer.beforeImportedMailFinished(listIdPart(importedMail._id))
			await mailIndexer.waitForIndex()
			do_verify()
		})

		o.test("resume", async () => {
			when(persistence.getIndexedGroups()).thenResolve([])
			when(persistence.getImportQueueEntries()).thenResolve([listIdPart(importedMail._id)])

			await mailIndexer.extendMailIndex(user)
			await mailIndexer.waitForIndex()
			do_verify()
		})
	})
})

class FakeServerEntity<T extends BlobElementEntity> {
	constructor(readonly entity: T) {}
}
