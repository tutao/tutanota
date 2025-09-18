import o from "@tutao/otest"
import { func, matchers, object, verify, when } from "testdouble"
import { lazy, lazyAsync } from "@tutao/tutanota-utils"
import { MailIndexer } from "../../../../../../src/mail-app/workerUtils/index/MailIndexer"
import { MailFacade } from "../../../../../../src/common/api/worker/facades/lazy/MailFacade"
import { OfflineStoragePersistence } from "../../../../../../src/mail-app/workerUtils/index/OfflineStoragePersistence"
import { CacheStorage } from "../../../../../../src/common/api/worker/rest/DefaultEntityRestCache"
import { CustomMailEventCacheHandler } from "../../../../../../src/common/api/worker/rest/cacheHandler/CustomMailEventCacheHandler"
import {
	Body,
	Mail,
	MailDetails,
	MailFolder,
	MailFolderTypeRef,
	MailSetEntryTypeRef,
	MailTypeRef,
} from "../../../../../../src/common/api/entities/tutanota/TypeRefs"
import { GENERATED_MAX_ID, GENERATED_MIN_ID } from "../../../../../../src/common/api/common/utils/EntityUtils"
import { MailSetKind } from "../../../../../../src/common/api/common/TutanotaConstants"
import { ClientClassifierType } from "../../../../../../src/mail-app/workerUtils/spamClassification/ClientClassifierType"
import { EntityUpdateData } from "../../../../../../src/common/api/common/utils/EntityUpdateUtils"

/**
 * These tests should verify that the following are obeyed:
 * - All Mails in Spam are certain (during create)
 * - Moved Mails are Certain (event update)
 * - Read Mails are Certain (event update)
 * - Inbox is not certain.
 */
o.spec("CustomMailEventCacheHandler", function () {
	let cacheStorageMock: CacheStorage
	let offlineStorageMock: lazy<Promise<OfflineStoragePersistence>>
	let indexerAndMailFacadeMock: lazyAsync<{ mailIndexer: MailIndexer; mailFacade: MailFacade }>

	o.beforeEach(function () {
		cacheStorageMock = object() as CacheStorage
		offlineStorageMock = func() as lazy<Promise<OfflineStoragePersistence>>
		indexerAndMailFacadeMock = func() as lazyAsync<{ mailIndexer: MailIndexer; mailFacade: MailFacade }>
	})

	o.spec("onEntityEventCreate", function () {
		let mailIndexer = object() as MailIndexer
		let mailFacade = object() as MailFacade
		let body: Body
		let mailDetails: MailDetails
		let mail: Mail

		o.beforeEach(function () {
			when(indexerAndMailFacadeMock()).thenResolve({ mailIndexer, mailFacade })

			body = object({ text: "Body Text" }) as Body
			mailDetails = object({ body }) as MailDetails
			mail = object({ sets: [[GENERATED_MIN_ID, GENERATED_MIN_ID]] }) as unknown as Mail
			when(mailIndexer.downloadNewMailData(matchers.anything())).thenResolve({
				mail,
				mailDetails,
			})
		})

		o("does not process spam e-mails when it fails to download new mail", async function () {
			when(mailIndexer.downloadNewMailData(matchers.anything())).thenResolve(null)
			when(cacheStorageMock.getWholeList(MailFolderTypeRef, matchers.anything())).thenResolve([])

			const offlineStorage = object() as OfflineStoragePersistence
			when(offlineStorageMock()).thenResolve(offlineStorage)

			const cacheHandler = new CustomMailEventCacheHandler(indexerAndMailFacadeMock, offlineStorageMock, cacheStorageMock)
			await cacheHandler.onEntityEventCreate(["listId", "elementId"], [])

			verify(cacheStorageMock.getWholeList(MailFolderTypeRef, matchers.anything()), { times: 0 })
		})

		o("processSpam maintains server classification when client classification is not enabled", async function () {
			const mailFolder = object({
				folderType: MailSetKind.SPAM,
				_id: [GENERATED_MIN_ID, GENERATED_MIN_ID],
			}) as unknown as MailFolder
			when(cacheStorageMock.getWholeList(MailFolderTypeRef, matchers.anything())).thenResolve([mailFolder])

			const offlineStorage = object() as OfflineStoragePersistence
			when(offlineStorageMock()).thenResolve(offlineStorage)
			when(mailFacade.predictSpamResult(mail)).thenResolve(false)
			when(mailFacade.isSpamClassificationEnabled()).thenReturn(false)

			const cacheHandler = new CustomMailEventCacheHandler(indexerAndMailFacadeMock, offlineStorageMock, cacheStorageMock)
			await cacheHandler.onEntityEventCreate(["listId", "elementId"], [])

			verify(offlineStorage.storeSpamClassification(mail, body, true, true), { times: 1 })
		})

		o("processSpam uses client classification when enabled", async function () {
			const mailFolder = object({
				folderType: MailSetKind.SPAM,
				_id: [GENERATED_MIN_ID, GENERATED_MIN_ID],
			}) as unknown as MailFolder
			when(cacheStorageMock.getWholeList(MailFolderTypeRef, matchers.anything())).thenResolve([mailFolder])

			const offlineStorage = object() as OfflineStoragePersistence
			when(offlineStorageMock()).thenResolve(offlineStorage)
			when(mailFacade.predictSpamResult(mail)).thenResolve(false)
			when(mailFacade.isSpamClassificationEnabled()).thenReturn(true)

			const cacheHandler = new CustomMailEventCacheHandler(indexerAndMailFacadeMock, offlineStorageMock, cacheStorageMock)
			await cacheHandler.onEntityEventCreate(["listId", "elementId"], [])

			verify(offlineStorage.storeSpamClassification(mail, body, false, false), { times: 1 })
		})

		o("processSpam correctly verifies if email is stored in spam folder", async function () {
			const mailFolder = object({
				folderType: MailSetKind.SPAM,
				_id: [GENERATED_MIN_ID, GENERATED_MAX_ID],
			}) as unknown as MailFolder
			when(cacheStorageMock.getWholeList(MailFolderTypeRef, matchers.anything())).thenResolve([mailFolder])

			const offlineStorage = object() as OfflineStoragePersistence
			when(offlineStorageMock()).thenResolve(offlineStorage)
			when(mailFacade.predictSpamResult(mail)).thenResolve(false)
			when(mailFacade.isSpamClassificationEnabled()).thenReturn(true)

			const cacheHandler = new CustomMailEventCacheHandler(indexerAndMailFacadeMock, offlineStorageMock, cacheStorageMock)
			await cacheHandler.onEntityEventCreate(["listId", "elementId"], [])

			verify(offlineStorage.storeSpamClassification(mail, body, false, false), { times: 1 })
		})

		o("processSpam moves mail to spam when detected as such and its not already in spam", async function () {
			const mailFolders = [
				object({
					folderType: MailSetKind.INBOX,
					_id: [GENERATED_MIN_ID, GENERATED_MIN_ID],
				}) as unknown as MailFolder,
				object({
					folderType: MailSetKind.SPAM,
					_id: [GENERATED_MIN_ID, GENERATED_MAX_ID],
				}) as unknown as MailFolder,
			]
			when(cacheStorageMock.getWholeList(MailFolderTypeRef, matchers.anything())).thenResolve(mailFolders)

			const offlineStorage = object() as OfflineStoragePersistence
			when(offlineStorageMock()).thenResolve(offlineStorage)
			when(mailFacade.predictSpamResult(mail)).thenResolve(true)
			when(mailFacade.isSpamClassificationEnabled()).thenReturn(true)

			const cacheHandler = new CustomMailEventCacheHandler(indexerAndMailFacadeMock, offlineStorageMock, cacheStorageMock)
			await cacheHandler.onEntityEventCreate(["listId", "elementId"], [])

			verify(offlineStorage.storeSpamClassification(mail, body, true, true), { times: 1 })
			verify(mailFacade.simpleMoveMails([["listId", "elementId"]], MailSetKind.SPAM, ClientClassifierType.CLIENT_CLASSIFICATION))
		})

		o("processSpam moves mail to inbox when detected as such and its not already in inbox", async function () {
			const mailFolders = [
				object({
					folderType: MailSetKind.INBOX,
					_id: [GENERATED_MIN_ID, GENERATED_MAX_ID],
				}) as unknown as MailFolder,
				object({
					folderType: MailSetKind.SPAM,
					_id: [GENERATED_MIN_ID, GENERATED_MIN_ID],
				}) as unknown as MailFolder,
			]
			when(cacheStorageMock.getWholeList(MailFolderTypeRef, matchers.anything())).thenResolve(mailFolders)

			const offlineStorage = object() as OfflineStoragePersistence
			when(offlineStorageMock()).thenResolve(offlineStorage)
			when(mailFacade.predictSpamResult(mail)).thenResolve(false)
			when(mailFacade.isSpamClassificationEnabled()).thenReturn(true)

			const cacheHandler = new CustomMailEventCacheHandler(indexerAndMailFacadeMock, offlineStorageMock, cacheStorageMock)
			await cacheHandler.onEntityEventCreate(["listId", "elementId"], [])

			verify(offlineStorage.storeSpamClassification(mail, body, false, false), { times: 1 })
			verify(mailFacade.simpleMoveMails([["listId", "elementId"]], MailSetKind.INBOX, ClientClassifierType.CLIENT_CLASSIFICATION))
		})
	})

	o.spec("onEntityEventUpdate", function () {
		let mailIndexer = object() as MailIndexer
		let mailFacade = object() as MailFacade
		let mail: Mail

		o.beforeEach(function () {
			when(indexerAndMailFacadeMock()).thenResolve({ mailIndexer, mailFacade })
			mail = object({ sets: [[GENERATED_MIN_ID, GENERATED_MIN_ID]] }) as unknown as Mail
		})

		o("does nothing if mail has not been read and not moved or had label applied.", async function () {
			const offlineStorage = object() as OfflineStoragePersistence
			when(offlineStorageMock()).thenResolve(offlineStorage)
			mail.unread = true
			when(cacheStorageMock.get(MailTypeRef, "listId", "elementId")).thenResolve(mail)

			const cacheHandler = new CustomMailEventCacheHandler(indexerAndMailFacadeMock, offlineStorageMock, cacheStorageMock)
			await cacheHandler.onEntityEventUpdate(["listId", "elementId"], [])

			verify(offlineStorage.updateSpamClassificationData(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
			verify(mailFacade.updateClassifier(), { times: 0 })
		})

		o("does update spam classification data if mail has been read in inbox and not moved", async function () {
			const mailFolders = [
				object({
					folderType: MailSetKind.INBOX,
					_id: [GENERATED_MIN_ID, GENERATED_MIN_ID],
				}) as unknown as MailFolder,
				object({
					folderType: MailSetKind.SPAM,
					_id: [GENERATED_MIN_ID, GENERATED_MAX_ID],
				}) as unknown as MailFolder,
			]
			when(cacheStorageMock.getWholeList(MailFolderTypeRef, matchers.anything())).thenResolve(mailFolders)

			const offlineStorage = object() as OfflineStoragePersistence
			when(offlineStorage.getStoredClassification(mail)).thenResolve(false)
			when(offlineStorageMock()).thenResolve(offlineStorage)
			mail.unread = false
			when(cacheStorageMock.get(MailTypeRef, "listId", "elementId")).thenResolve(mail)

			const cacheHandler = new CustomMailEventCacheHandler(indexerAndMailFacadeMock, offlineStorageMock, cacheStorageMock)
			await cacheHandler.onEntityEventUpdate(["listId", "elementId"], [])

			verify(offlineStorage.updateSpamClassificationData(["listId", "elementId"], false, true), { times: 1 })
			verify(mailFacade.updateClassifier(), { times: 0 })
		})

		o("does update spam classification data if mail has not been read but moved", async function () {
			const mailFolders = [
				object({
					folderType: MailSetKind.INBOX,
					_id: [GENERATED_MIN_ID, GENERATED_MAX_ID],
				}) as unknown as MailFolder,
				object({
					folderType: MailSetKind.SPAM,
					_id: [GENERATED_MIN_ID, GENERATED_MIN_ID],
				}) as unknown as MailFolder,
			]
			when(cacheStorageMock.getWholeList(MailFolderTypeRef, matchers.anything())).thenResolve(mailFolders)

			const offlineStorage = object() as OfflineStoragePersistence
			when(offlineStorage.getStoredClassification(mail)).thenResolve(false)
			when(offlineStorageMock()).thenResolve(offlineStorage)
			mail.unread = true
			when(cacheStorageMock.get(MailTypeRef, "listId", "elementId")).thenResolve(mail)
			const event = object({ typeRef: MailSetEntryTypeRef }) as unknown as EntityUpdateData

			const cacheHandler = new CustomMailEventCacheHandler(indexerAndMailFacadeMock, offlineStorageMock, cacheStorageMock)
			await cacheHandler.onEntityEventUpdate(["listId", "elementId"], [event])

			verify(offlineStorage.updateSpamClassificationData(["listId", "elementId"], true, true), { times: 1 })
			verify(mailFacade.updateClassifier())
		})
	})
})
