import o from "@tutao/otest"
import { clientInitializedTypeModelResolver, createTestEntity, instancePipelineFromTypeModelResolver, removeOriginals } from "../../../TestUtils"
import { MailFacade } from "../../../../../src/applications/common/api/worker/facades/lazy/MailFacade"
import { OfflineMailIndexer } from "../../../../../src/applications/mail-app/workerUtils/index/OfflineMailIndexer"
import { OfflineStoragePersistence } from "../../../../../src/applications/mail-app/workerUtils/index/OfflineStoragePersistence"
import { BlobFacade } from "../../../../../src/applications/common/api/worker/facades/lazy/BlobFacade"
import { EntityRestClientMock } from "../rest/EntityRestClientMock"
import { InstancePipeline, TypeModelResolver } from "../../../../../src/platform-kit/instance-pipeline"
import { InfoMessageHandler } from "../../../../../src/applications/common/gui/InfoMessageHandler"
import { MailIndexerNewMailDownloader } from "../../../../../src/applications/mail-app/workerUtils/index/MailIndexer"
import { GroupMembershipTypeRef, User, UserTypeRef } from "@tutao/entities/sys"
import {
	compareOldestFirst,
	elementIdPart,
	EntityIdEncoding,
	GENERATED_MAX_ID,
	GENERATED_MIN_ID,
	getElementId,
	getListId,
	idToElementId,
	isSameTypeRef,
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
import { assert, assertNotNull, collectToMap, deepEqual } from "../../../../../src/platform-kit/utils"
import { CryptoFacade } from "../../../../../src/platform-kit/base/base-crypto/CryptoFacade"
import { aes256RandomKey } from "@tutao/crypto/symmetric-cipher-utils"
import { IncomingServerJson } from "../../../../../src/platform-kit/instance-pipeline/TypeMapper"
import { MailImportType } from "../../../../../src/entities/tutanota/Utils"

o.spec("OfflineMailIndexer", () => {
	let mailIndexer: OfflineMailIndexer
	let persistence: OfflineStoragePersistence
	let blobs: BlobFacade
	let mailFacade: MailFacade
	let entityRestClientMock: EntityRestClientMock
	let typeModelResolver: TypeModelResolver
	let realInstancePipeline: InstancePipeline
	let infoMessageHandler: InfoMessageHandler
	let crypto: CryptoFacade
	let newMailDownloader: MailIndexerNewMailDownloader
	let user: User

	const userId = "userId"
	const mailGroupId = "I'm a mail group!"

	let mail: Mail
	let mailSetEntry: MailSetEntry
	let mailDetailsBlobModel: ServerTypeModel

	o.beforeEach(async () => {
		typeModelResolver = clientInitializedTypeModelResolver()
		realInstancePipeline = instancePipelineFromTypeModelResolver(typeModelResolver)
		persistence = object()
		blobs = object()
		entityRestClientMock = new EntityRestClientMock()
		mailFacade = object()
		crypto = object()
		infoMessageHandler = object()
		newMailDownloader = func<MailIndexerNewMailDownloader>()
		mailDetailsBlobModel = await typeModelResolver.resolveServerTypeReference(MailDetailsBlobTypeRef)

		mailIndexer = new OfflineMailIndexer(
			persistence,
			blobs,
			new EntityClient(entityRestClientMock, typeModelResolver),
			mailFacade,
			crypto,
			typeModelResolver,
			infoMessageHandler,
			newMailDownloader,
			realInstancePipeline,
		)
		user = createTestEntity(UserTypeRef, {
			_id: idToElementId(userId),
		})
		mail = createTestEntity(
			MailTypeRef,
			{
				_id: ["---------z-z", "---------zzz"],
				_ownerGroup: mailGroupId,
			},
			{ populateAggregates: true },
		)

		mailSetEntry = createTestEntity(MailSetEntryTypeRef, {
			_id: ["mailSetEntryList", "mailSetEntryElement"],
			mail: mail._id,
			_ownerGroup: mailGroupId,
		})

		const storedBlobs: Map<Id, IncomingServerJson> = new Map()

		when(persistence.retrieveEncryptedMailDetailsBlob(matchers.anything(), matchers.anything())).thenDo(
			async (_, blobId) => storedBlobs.get(blobId) ?? null,
		)

		when(persistence.storeEncryptedMailDetailsBlobs(matchers.anything(), matchers.anything())).thenDo(async (_, blobs: readonly IncomingServerJson[]) => {
			for (const b of blobs) {
				assert(isSameTypeRef(b.getTypeRef(), MailDetailsBlobTypeRef), "wrong object passed into storeEncryptedMailDetailsBlobs")
				storedBlobs.set(elementIdPart(b.getValueByName("_id").asIdTuple()), b)
			}
		})

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
			details: createTestEntity(MailDetailsTypeRef, {}, { populateAggregates: true }),
		})

		const sk = aes256RandomKey()
		when(blobs.downloadFullEncryptedBlobElementEntityArchive(MailDetailsBlobTypeRef, listIdPart(mail.mailDetails))).thenDo(async () => {
			return [
				IncomingServerJson.expectSingleMailDetailsBlob(
					(await realInstancePipeline.mapAndEncrypt(MailDetailsBlobTypeRef, mailDetails, sk)).getInnerJson(),
					mailDetailsBlobModel,
				),
			]
		})

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

		const storedMailData = matchers.captor()

		verify(persistence.storeMailData(storedMailData.capture()))

		const storedMails: Array<MailWithDetailsAndAttachments> = storedMailData.values![0]
		o(storedMails.length).equals(1)
		o(removeOriginals(storedMails[0].mail)).deepEquals(mail)
		o(removeOriginals(storedMails[0].mailDetails)).deepEquals(removeOriginals(mailDetails.details))
		o(storedMails[0].attachments.map(removeOriginals)).deepEquals(attachments)

		verify(persistence.updateIndexingTimestamp(mailGroupId, FULL_INDEXED_TIMESTAMP))
		verify(persistence.clearEncryptedMailDetailsBlobs())
	})

	o.test("index 2000 mails", async () => {
		// two pages
		const mailCount = 1000 * 2

		const mails: MailWithDetailsAndAttachments[] = []
		const detailBlobs: MailDetailsBlob[] = []

		const archiveId = "WHOA, I store LOTS of cool stuff!"
		const mailListId = getListId(mail)

		for (let i = 0; i < mailCount; i++) {
			const mailDetails = createTestEntity(
				MailDetailsBlobTypeRef,
				{
					_id: [archiveId, `I am blob #${i}. FEAR ME!`],
					details: createTestEntity(
						MailDetailsTypeRef,
						{
							body: createTestEntity(BodyTypeRef, {
								compressedText: `I am smol compressed text #${i}. You will INDEX me and you will LIKE it.`,
							}),
						},
						{ populateAggregates: true },
					),
				},
				{ populateAggregates: true },
			)
			const mailMail = createTestEntity(
				MailTypeRef,
				{
					_id: [mailListId, `${i}`.padStart(GENERATED_MIN_ID.length, "0")],
					mailDetails: mailDetails._id,
				},
				{ populateAggregates: true },
			)
			const mailAttachments = [
				createTestEntity(
					FileTypeRef,
					{
						name: `mail_${i}.jxl`,
					},
					{ populateAggregates: true },
				),
			]
			mails.push({
				mailDetails: mailDetails.details,
				mail: mailMail,
				attachments: mailAttachments,
			})
			detailBlobs.push(mailDetails)
			entityRestClientMock.addListInstances(mailMail)
		}

		// adding a stub for every single mail is slow
		const mailsMap = collectToMap(mails, (m) => getElementId(m.mail))
		when(mailFacade.loadAttachments(matchers.anything())).thenDo((mailToFind: Mail) => {
			return Promise.resolve(assertNotNull(mailsMap.get(getElementId(mailToFind)), `no ${getElementId(mailToFind)}`).attachments)
		})

		const sk = aes256RandomKey()
		when(crypto.resolveSessionKey(matchers.anything())).thenResolve(sk)
		when(blobs.downloadFullEncryptedBlobElementEntityArchive(MailDetailsBlobTypeRef, archiveId)).thenResolve(
			await Promise.all(
				detailBlobs.map(async (db) =>
					IncomingServerJson.expectSingleMailDetailsBlob(
						(await realInstancePipeline.mapAndEncrypt(MailDetailsBlobTypeRef, db, sk)).getInnerJson(),
						mailDetailsBlobModel,
					),
				),
			),
		)

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
					for (const m of mails) {
						removeOriginals(m.mail)
						removeOriginals(m.mailDetails)
					}
					for (const s of sorted) {
						removeOriginals(s.mail)
						removeOriginals(s.mailDetails)
					}
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

			importedMail = createTestEntity(
				ImportedFileMailTypeRef,
				{
					_id: ["imported mails list", "an imported mail"],
					mailSetEntry: mailSetEntry._id,
					_ownerGroup: mailGroupId,
				},
				{ populateAggregates: true },
			)

			mailDetails = createTestEntity(MailDetailsBlobTypeRef, {
				_id: mail.mailDetails,
				details: createTestEntity(MailDetailsTypeRef, {}, { populateAggregates: true }),
			})
			attachments = []

			when(mailFacade.loadAttachments(mail)).thenResolve(attachments)
			entityRestClientMock.addListInstances(importedMail)

			const sk = aes256RandomKey()
			when(persistence.getImportQueueProgress(listIdPart(importedMail._id))).thenResolve(GENERATED_MAX_ID)
			when(crypto.resolveSessionKey(matchers.anything())).thenResolve(sk)

			when(blobs.downloadFullEncryptedBlobElementEntityArchive(MailDetailsBlobTypeRef, listIdPart(mail.mailDetails))).thenDo(async () => {
				return [
					IncomingServerJson.expectSingleMailDetailsBlob(
						(await realInstancePipeline.mapAndEncrypt(MailDetailsBlobTypeRef, mailDetails, sk)).getInnerJson(),
						mailDetailsBlobModel,
					),
				]
			})

			addTestMail()
		})

		function do_verify() {
			const storeMailData = matchers.captor()
			verify(persistence.storeMailData(storeMailData.capture()))
			const storedMails: Array<MailWithDetailsAndAttachments> = storeMailData.values![0]

			o(storedMails.length).equals(1)
			o(removeOriginals(storedMails[0].mail)).deepEquals(mail)
			o(removeOriginals(storedMails[0].mailDetails)).deepEquals(removeOriginals(mailDetails.details))
			o(storedMails[0].attachments.map(removeOriginals)).deepEquals(attachments)

			verify(persistence.removeImportQueueEntry(listIdPart(importedMail._id)))
			verify(persistence.clearEncryptedMailDetailsBlobs())
			verify(persistence.updateImportQueueProgress(listIdPart(importedMail._id), elementIdPart(mail._id), MailImportType.FileImport))
		}

		o.test("beforeImportedMailFinished", async () => {
			await mailIndexer.beforeImportedMailFinished(listIdPart(importedMail._id), MailImportType.FileImport)
			await mailIndexer.waitForIndex()
			do_verify()
		})

		o.test("resume", async () => {
			when(persistence.getIndexedGroups()).thenResolve([])
			when(persistence.getImportQueueEntries()).thenResolve([{ listId: listIdPart(importedMail._id), mailImportType: MailImportType.FileImport }])

			await mailIndexer.extendMailIndex(user)
			await mailIndexer.waitForIndex()
			do_verify()
		})
	})
})
