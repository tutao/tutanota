import o from "@tutao/otest"
import { matchers, object, verify, when } from "testdouble"
import { MailFacade } from "../../../../../src/applications/common/api/worker/facades/lazy/MailFacade"
import { IServiceExecutor } from "../../../../../src/platform-kit/network/ServiceRequest"
import { EntityClient } from "../../../../../src/platform-kit/network/EntityClient"
import { BlobFacade } from "../../../../../src/applications/common/api/worker/facades/lazy/BlobFacade"
import { InstancePipeline } from "../../../../../src/platform-kit/instance-pipeline"
import { aes256RandomKey, CryptoWrapper, VersionedKey } from "../../../../../src/platform-kit/crypto"
import {
	ImapImportAttachment,
	ImapImportDataFile,
	ImapImportTutaFileId,
	ImportMailFacade,
	ImportMailParams,
} from "../../../../../src/applications/common/api/worker/facades/lazy/ImportMailFacade"
import { clientInitializedTypeModelResolver, createTestEntity } from "../../../TestUtils"
import { ArchiveDataType } from "../../../../../src/entities/sys/Utils"
import {
	FileTypeRef,
	ImportMailDataTypeRef,
	ImportMailPostIn,
	ImportMailPostOutTypeRef,
	ImportMailService,
	MailAddress,
	MailAddressTypeRef,
} from "@tutao/entities/tutanota"
import { BlobReferenceTokenWrapperTypeRef } from "@tutao/entities/sys"
import { MailMethod, MailState, RecipientList, ReplyType } from "../../../../../src/entities/tutanota/Utils"
import { SuspensionBehavior } from "../../../../../src/platform-kit/rest-client/types"
import { IMPORT_MAIL_SERVICE_SIZE_LIMIT } from "../../../../../src/platform-kit/rest-client"
import { CryptoFacade } from "../../../../../src/platform-kit/base/base-crypto/CryptoFacade"
import { KeyLoaderFacade } from "../../../../../src/platform-kit/base/base-crypto/KeyLoaderFacade"
import { DEFAULT_EXTRA_SERVICE_PARAMS } from "../../../../../src/platform-kit/instance-pipeline/RestClientOptions"
import { OutgoingServerJson } from "../../../../../src/platform-kit/instance-pipeline/TypeMapper"

const { anything } = matchers

o.spec("ImportMailFacade", () => {
	let mailFacadeMock: MailFacade
	let serviceExecutorMock: IServiceExecutor
	let entityClientMock: EntityClient
	let blobFacadeMock: BlobFacade
	let cryptoMock: CryptoFacade
	let keyLoaderMock: KeyLoaderFacade
	let instancePipelineMock: InstancePipeline
	let cryptoWrapperMock: CryptoWrapper
	let facade: ImportMailFacade
	let mailGroupKeyMock: VersionedKey

	const mailGroupId = "mailGroup123"

	const imapFolderSyncStateIdMock: IdTuple = ["folderSyncStateListId", "folderSyncStateElementId"]
	const fileIdMock: IdTuple = ["fileListId", "fileElementId"]
	const transferIdMock = "transferId123"

	const sampleRecipientMock: MailAddress = createTestEntity(MailAddressTypeRef, {
		address: "test@example.com",
		name: "Test User",
	})
	const sampleRecipientListMock: RecipientList = [sampleRecipientMock]

	const sampleImportMailParamsMock: ImportMailParams = {
		subject: "Test Subject",
		bodyText: "Compressed body",
		sentDate: new Date(2025, 0, 1),
		receivedDate: new Date(2025, 0, 1),
		state: MailState.RECEIVED,
		unread: false,
		messageId: "msg123",
		inReplyTo: null,
		references: [],
		senderMailAddress: "sender@example.com",
		senderName: "Sender",
		method: MailMethod.NONE,
		replyType: ReplyType.NONE,
		differentEnvelopeSender: null,
		headers: "Header: value",
		replyTos: sampleRecipientListMock,
		toRecipients: sampleRecipientListMock,
		ccRecipients: [],
		bccRecipients: [],
		attachments: null,
		imapUid: 42,
		imapModSeq: 12345n,
		imapFolderSyncState: imapFolderSyncStateIdMock,
	}

	o.beforeEach(async () => {
		mailFacadeMock = object<MailFacade>()
		serviceExecutorMock = object<IServiceExecutor>()
		entityClientMock = object<EntityClient>()
		blobFacadeMock = object<BlobFacade>()
		cryptoMock = object<CryptoFacade>()
		keyLoaderMock = object<KeyLoaderFacade>()
		instancePipelineMock = object<InstancePipeline>()
		cryptoWrapperMock = object<CryptoWrapper>()
		mailGroupKeyMock = { object: object(), version: 1 }
		facade = new ImportMailFacade(
			mailFacadeMock,
			serviceExecutorMock,
			entityClientMock,
			blobFacadeMock,
			cryptoMock,
			keyLoaderMock,
			instancePipelineMock,
			cryptoWrapperMock,
		)
		const typeModelResolver = clientInitializedTypeModelResolver()
		const typeModel = await typeModelResolver.resolveClientTypeReference(ImportMailDataTypeRef)
		const serverJson = OutgoingServerJson.newFromRecord({ subject: "encypted subject" }, typeModel)

		when(keyLoaderMock.getCurrentSymGroupKey(mailGroupId)).thenResolve(mailGroupKeyMock)
		when(cryptoWrapperMock.encryptKeyWithVersionedKey(anything(), anything())).thenReturn({ key: new Uint8Array([1, 2, 3]), encryptingKeyVersion: 0 })
		when(instancePipelineMock.mapAndEncrypt(anything(), anything(), anything())).thenResolve(serverJson)
	})

	o.test("importMails - successfully imports a single mail without attachments", async () => {
		const paramsList = [sampleImportMailParamsMock]

		const postInCaptor = matchers.captor()
		when(
			serviceExecutorMock.post(ImportMailService, postInCaptor.capture(), {
				...DEFAULT_EXTRA_SERVICE_PARAMS,
				suspensionBehavior: SuspensionBehavior.Throw,
			}),
		).thenDo(() => Promise.resolve(createTestEntity(ImportMailPostOutTypeRef)))

		await facade.importMails(paramsList, mailGroupId)
		verify(instancePipelineMock.mapAndEncrypt(ImportMailDataTypeRef, anything(), anything()), { times: 1 })

		verify(
			serviceExecutorMock.post(ImportMailService, postInCaptor.capture(), {
				...DEFAULT_EXTRA_SERVICE_PARAMS,
				suspensionBehavior: SuspensionBehavior.Throw,
			}),
			{
				times: 1,
			},
		)
		const importMailPostIn: ImportMailPostIn = postInCaptor.value
		o.check(importMailPostIn!.encImports.length).equals(1)
		o.check(importMailPostIn!.imapFolderSyncState).equals(imapFolderSyncStateIdMock)
	})

	o.test("importMails - chunks multiple mails when size limit is reached", async () => {
		const largeBody = "x".repeat(IMPORT_MAIL_SERVICE_SIZE_LIMIT / 2)
		const params1 = { ...sampleImportMailParamsMock, imapUid: 1, bodyText: largeBody, attachments: null }
		const params2 = { ...sampleImportMailParamsMock, imapUid: 2, bodyText: largeBody, attachments: null }
		const paramsList = [params1, params2]

		let callCount = 0
		when(instancePipelineMock.mapAndEncrypt(ImportMailDataTypeRef, anything(), anything())).thenDo(async () => {
			callCount++
			return { data: "x".repeat(IMPORT_MAIL_SERVICE_SIZE_LIMIT / 2) }
		})

		let postCalls: any[] = []
		when(serviceExecutorMock.post(ImportMailService, anything(), { ...DEFAULT_EXTRA_SERVICE_PARAMS, suspensionBehavior: SuspensionBehavior.Throw })).thenDo(
			async (_, postIn) => {
				postCalls.push(postIn)
				return {}
			},
		)

		await facade.importMails(paramsList, mailGroupId)

		o.check(postCalls.length).equals(2)
		o.check(postCalls[0].encImports.length).equals(1)
		o.check(postCalls[1].encImports.length).equals(1)
	})

	o.test("importMails - handles attachments via _createAddedImportAttachments", async () => {
		const dataFileMock: ImapImportDataFile = {
			_type: "DataFile",
			data: new Uint8Array([1, 2, 3]),
			name: "test.txt",
			mimeType: "text/plain",
			size: 3,
			fileHash: "abc123",
		}
		const params = { ...sampleImportMailParamsMock, attachments: [dataFileMock], imapUid: 99 }
		const paramsList = [params]

		when(blobFacadeMock.generateTransferId()).thenResolve(transferIdMock)
		const referenceTokensMock = [createTestEntity(BlobReferenceTokenWrapperTypeRef, { blobReferenceToken: "token1" })]
		when(blobFacadeMock.encryptAndUploadMultiple(ArchiveDataType.Attachments, mailGroupId, anything(), anything())).thenResolve([referenceTokensMock])
		when(cryptoWrapperMock.encryptString(anything(), dataFileMock.fileHash!)).thenReturn(new Uint8Array([4, 5, 6]))
		when(cryptoWrapperMock.encryptString(anything(), dataFileMock.name!)).thenReturn(new Uint8Array([7, 8, 9]))
		when(cryptoWrapperMock.encryptString(anything(), dataFileMock.mimeType!)).thenReturn(new Uint8Array([10, 11, 12]))

		let capturedImportMailData: any = null
		when(instancePipelineMock.mapAndEncrypt(ImportMailDataTypeRef, anything(), anything())).thenDo(async (_, data) => {
			capturedImportMailData = data
			return { enc: "data" }
		})

		await facade.importMails(paramsList, mailGroupId)

		const attachments = capturedImportMailData.importedAttachments
		o.check(attachments.length).equals(1)

		const attachment = attachments[0]
		o.check(attachment.existingAttachmentFile === null).equals(true)
		o.check(attachment.ownerEncFileSessionKey).deepEquals(new Uint8Array([1, 2, 3]))
		o.check(attachment.ownerFileKeyVersion).equals("0")

		const newAttachment = attachment.newAttachment
		o.check(newAttachment.encFileName).deepEquals(new Uint8Array([7, 8, 9]))
		o.check(newAttachment.encMimeType).deepEquals(new Uint8Array([10, 11, 12]))
		o.check(newAttachment.referenceTokens).deepEquals(referenceTokensMock)

		o.check(newAttachment.encFileHash !== null).equals(true)
		o.check(newAttachment.ownerEncFileHashSessionKey !== null).equals(true)
	})

	o.test("_createAddedImportAttachments - handles already existing files (ImapImportTutaFileId)", async () => {
		const existingFileIdMock: ImapImportTutaFileId = {
			_type: "ImapImportTutaFileId",
			_id: fileIdMock,
		}
		const imapMailUid = 10
		const providedFiles = new Map<number, ImapImportAttachment[]>([[imapMailUid, [existingFileIdMock]]])

		const existingFileMock = createTestEntity(FileTypeRef, { _id: fileIdMock, _ownerGroup: mailGroupId })
		const fileSessionKeyMock = aes256RandomKey()
		when(entityClientMock.load(FileTypeRef, fileIdMock)).thenResolve(existingFileMock)
		when(cryptoMock.resolveSessionKey(existingFileMock)).thenResolve(fileSessionKeyMock)

		const result = await facade._createAddedImportAttachments(providedFiles, mailGroupId, mailGroupKeyMock)

		o.check(result.size).equals(1)
		const attachments = result.get(imapMailUid)
		o.check(attachments!.length).equals(1)
		o.check(attachments![0].existingAttachmentFile).equals(fileIdMock)
		verify(entityClientMock.load(FileTypeRef, fileIdMock), { times: 1 })
		verify(cryptoMock.resolveSessionKey(existingFileMock), { times: 1 })
	})

	o.test("_createAddedImportAttachments - uploads new files (ImapImportDataFile)", async () => {
		const dataFileMock: ImapImportDataFile = {
			_type: "DataFile",
			data: new Uint8Array([10, 20, 30]),
			name: "attachment.bin",
			mimeType: "application/octet-stream",
			size: 3,
			fileHash: "def456",
		}
		const imapMailUid = 20
		const providedFiles = new Map<number, ImapImportAttachment[]>([[imapMailUid, [dataFileMock]]])

		const referenceTokensMock = [createTestEntity(BlobReferenceTokenWrapperTypeRef, { blobReferenceToken: "token1" })]
		when(blobFacadeMock.generateTransferId()).thenResolve(transferIdMock)
		when(blobFacadeMock.encryptAndUploadMultiple(ArchiveDataType.Attachments, mailGroupId, anything(), anything())).thenResolve([referenceTokensMock])
		when(cryptoWrapperMock.encryptString(anything(), dataFileMock.fileHash!)).thenReturn(new Uint8Array([4, 5, 6]))

		const result = await facade._createAddedImportAttachments(providedFiles, mailGroupId, mailGroupKeyMock)

		o.check(result.size).equals(1)
		const attachments = result.get(imapMailUid)
		o.check(attachments!.length).equals(1)
		const importAttachment = attachments![0]
		o.check(importAttachment.newAttachment!.referenceTokens).equals(referenceTokensMock)
		verify(blobFacadeMock.encryptAndUploadMultiple(ArchiveDataType.Attachments, mailGroupId, anything(), anything()), { times: 1 })
	})

	o.test("_createAddedImportAttachments - returns empty map when no files provided", async () => {
		const result = await facade._createAddedImportAttachments(new Map(), mailGroupId, mailGroupKeyMock)
		o.check(result.size).equals(0)
		verify(entityClientMock.load(anything(), anything()), { times: 0 })
		verify(blobFacadeMock.encryptAndUploadMultiple(anything(), anything(), anything(), anything()), { times: 0 })
	})

	o.test("_createAddedImportAttachments - handles mix of existing and new files for same imapUid", async () => {
		const existingFileIdMock: ImapImportTutaFileId = {
			_type: "ImapImportTutaFileId",
			_id: fileIdMock,
		}
		const dataFileMock: ImapImportDataFile = {
			_type: "DataFile",
			data: new Uint8Array([1]),
			name: "new.txt",
			mimeType: "text/plain",
			size: 1,
			fileHash: "hash123",
		}
		const providedFiles = new Map<number, ImapImportAttachment[]>([[30, [existingFileIdMock, dataFileMock]]])

		const existingFileMock = createTestEntity(FileTypeRef, { _id: fileIdMock })
		const fileSessionKeyMock = aes256RandomKey()
		when(entityClientMock.load(FileTypeRef, fileIdMock)).thenResolve(existingFileMock)
		when(cryptoMock.resolveSessionKey(existingFileMock)).thenResolve(fileSessionKeyMock)

		const referenceTokensMock = [createTestEntity(BlobReferenceTokenWrapperTypeRef, { blobReferenceToken: "ref" })]
		when(blobFacadeMock.generateTransferId()).thenResolve(transferIdMock)
		when(blobFacadeMock.encryptAndUploadMultiple(ArchiveDataType.Attachments, mailGroupId, anything(), anything())).thenResolve([referenceTokensMock])

		when(cryptoWrapperMock.encryptString(anything(), dataFileMock.fileHash!)).thenReturn(new Uint8Array([1, 2, 3]))

		const result = await facade._createAddedImportAttachments(providedFiles, mailGroupId, mailGroupKeyMock)

		o.check(result.size).equals(1)
		const attachments = result.get(30)
		o.check(attachments!.length).equals(2)
		o.check(attachments![0].existingAttachmentFile).equals(fileIdMock)
		o.check(attachments![1].newAttachment !== undefined).equals(true)
	})
})
