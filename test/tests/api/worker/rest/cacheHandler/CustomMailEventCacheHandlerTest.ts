import o from "@tutao/otest"
import { func, matchers, object, verify, when } from "testdouble"
import { lazy, lazyAsync } from "@tutao/tutanota-utils"
import { MailIndexer } from "../../../../../../src/mail-app/workerUtils/index/MailIndexer"
import { MailFacade } from "../../../../../../src/common/api/worker/facades/lazy/MailFacade"
import { OfflineStoragePersistence } from "../../../../../../src/mail-app/workerUtils/index/OfflineStoragePersistence"
import { CacheStorage } from "../../../../../../src/common/api/worker/rest/DefaultEntityRestCache"
import { CustomMailEventCacheHandler } from "../../../../../../src/common/api/worker/rest/cacheHandler/CustomMailEventCacheHandler"
import { Body, Mail, MailDetails, MailFolderTypeRef, MailSetEntryTypeRef, MailTypeRef } from "../../../../../../src/common/api/entities/tutanota/TypeRefs"
import { MailSetKind } from "../../../../../../src/common/api/common/TutanotaConstants"
import { ClientClassifierType } from "../../../../../../src/common/api/common/ClientClassifierType"
import { EntityUpdateData } from "../../../../../../src/common/api/common/utils/EntityUpdateUtils"
import { SpamTrainMailDatum } from "../../../../../../src/mail-app/workerUtils/spamClassification/SpamClassifier"
import { getMailBodyText } from "../../../../../../src/common/api/common/CommonMailUtils"
import { createTestEntity } from "../../../../TestUtils"

/**
 * These tests should verify that the following are obeyed:
 * - All Mails in Spam have isSpamConfidence of 1 (during create)
 * - Moved Mails have isSpamConfidence of 1 (event update)
 * - Read Mails have isSpamConfidence of  1 (event update)
 * - Mails in Inbox have isSpamConfidence of 0.
 */
o.spec("CustomMailEventCacheHandler", function () {
	let cacheStorageMock: CacheStorage
	let offlineStorageMock: lazy<Promise<OfflineStoragePersistence>>
	let indexerAndMailFacadeMock: lazyAsync<{ mailIndexer: MailIndexer; mailFacade: MailFacade }>

	const inboxFolder = createTestEntity(MailFolderTypeRef, { _id: ["listId", "inbox"], folderType: MailSetKind.INBOX })
	const trashFolder = createTestEntity(MailFolderTypeRef, { _id: ["listId", "trash"], folderType: MailSetKind.TRASH })
	const spamFolder = createTestEntity(MailFolderTypeRef, { _id: ["listId", "spam"], folderType: MailSetKind.SPAM })
	const allFolders = [inboxFolder, trashFolder, spamFolder]

	o.beforeEach(function () {
		cacheStorageMock = object() as CacheStorage
		offlineStorageMock = func() as lazy<Promise<OfflineStoragePersistence>>
		indexerAndMailFacadeMock = func() as lazyAsync<{ mailIndexer: MailIndexer; mailFacade: MailFacade }>

		when(cacheStorageMock.getWholeList(MailFolderTypeRef, matchers.anything())).thenResolve(allFolders)
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
			mail = createTestEntity(MailTypeRef, {
				_id: ["listId", "elementId"],
				sets: [spamFolder._id],
				subject: "subject",
				_ownerGroup: "owner",
				unread: false,
			})
			when(mailIndexer.downloadNewMailData(matchers.anything())).thenResolve({
				mail,
				mailDetails,
			})
		})

		o("does not process spam e-mails when it fails to download new mail", async function () {
			when(mailIndexer.downloadNewMailData(matchers.anything())).thenResolve(null)

			const offlineStorage = object() as OfflineStoragePersistence
			when(offlineStorageMock()).thenResolve(offlineStorage)

			const cacheHandler = new CustomMailEventCacheHandler(indexerAndMailFacadeMock, offlineStorageMock, cacheStorageMock)
			await cacheHandler.onEntityEventCreate(["listId", "elementId"], [])

			verify(cacheStorageMock.getWholeList(MailFolderTypeRef, matchers.anything()), { times: 0 })
		})

		o("processSpam maintains server classification when client classification is not enabled", async function () {
			const offlineStorage = object() as OfflineStoragePersistence
			when(offlineStorageMock()).thenResolve(offlineStorage)
			when(mailFacade.predictSpamResult(mail)).thenResolve(null)

			const cacheHandler = new CustomMailEventCacheHandler(indexerAndMailFacadeMock, offlineStorageMock, cacheStorageMock)
			await cacheHandler.onEntityEventCreate(["listId", "elementId"], [])

			const spamTrainMailDatum: SpamTrainMailDatum = {
				mailId: mail._id,
				subject: mail.subject,
				body: getMailBodyText(body),
				isSpam: true,
				isSpamConfidence: 1,
				ownerGroup: "owner",
			}

			verify(offlineStorage.storeSpamClassification(spamTrainMailDatum), { times: 1 })
		})

		o("processSpam uses client classification when enabled", async function () {
			const offlineStorage = object() as OfflineStoragePersistence
			when(offlineStorageMock()).thenResolve(offlineStorage)
			when(mailFacade.predictSpamResult(mail)).thenResolve(false)

			const cacheHandler = new CustomMailEventCacheHandler(indexerAndMailFacadeMock, offlineStorageMock, cacheStorageMock)
			await cacheHandler.onEntityEventCreate(["listId", "elementId"], [])

			const spamTrainMailDatum: SpamTrainMailDatum = {
				mailId: mail._id,
				subject: mail.subject,
				body: getMailBodyText(body),
				isSpam: false,
				isSpamConfidence: 0,
				ownerGroup: "owner",
			}

			verify(offlineStorage.storeSpamClassification(spamTrainMailDatum), { times: 1 })
		})

		o("processSpam correctly verifies if email is stored in spam folder", async function () {
			mail.sets = [spamFolder._id]
			mail.unread = true

			const offlineStorage = object() as OfflineStoragePersistence
			when(offlineStorageMock()).thenResolve(offlineStorage)
			when(mailFacade.predictSpamResult(mail)).thenResolve(false)

			const cacheHandler = new CustomMailEventCacheHandler(indexerAndMailFacadeMock, offlineStorageMock, cacheStorageMock)
			await cacheHandler.onEntityEventCreate(["listId", "elementId"], [])

			const spamTrainMailDatum: SpamTrainMailDatum = {
				mailId: mail._id,
				subject: mail.subject,
				body: getMailBodyText(body),
				isSpam: false,
				ownerGroup: "owner",
				isSpamConfidence: 0,
			}

			verify(offlineStorage.storeSpamClassification(spamTrainMailDatum), { times: 1 })
		})

		o("getSpamConfidence is 0 for mail in trash folder ", async function () {
			mail.unread = false
			mail.sets = [["listId", "trash"]]

			const cacheHandler = new CustomMailEventCacheHandler(indexerAndMailFacadeMock, offlineStorageMock, cacheStorageMock)
			o(cacheHandler.getSpamConfidence(allFolders, mail).confidence).equals(0)
		})

		o("getSpamConfidence is 1 for mail in spam folder ", async function () {
			mail.unread = true
			mail.sets = [spamFolder._id]

			const cacheHandler = new CustomMailEventCacheHandler(indexerAndMailFacadeMock, offlineStorageMock, cacheStorageMock)
			o(cacheHandler.getSpamConfidence(allFolders, mail).confidence).equals(1)
		})

		o("getSpamConfidence for inbox folder depends on read status", async function () {
			const cacheHandler = new CustomMailEventCacheHandler(indexerAndMailFacadeMock, offlineStorageMock, cacheStorageMock)
			mail.sets = [inboxFolder._id]

			mail.unread = true
			o(cacheHandler.getSpamConfidence(allFolders, mail).confidence).equals(0)
			mail.unread = false
			o(cacheHandler.getSpamConfidence(allFolders, mail).confidence).equals(1)
		})

		o("processSpam moves mail to spam when detected as such and its not already in spam", async function () {
			mail.sets = [inboxFolder._id]
			const offlineStorage = object() as OfflineStoragePersistence
			when(offlineStorageMock()).thenResolve(offlineStorage)
			when(mailFacade.predictSpamResult(mail)).thenResolve(true)
			when(mailFacade.isSpamClassificationEnabled("owner")).thenReturn(true)

			const cacheHandler = new CustomMailEventCacheHandler(indexerAndMailFacadeMock, offlineStorageMock, cacheStorageMock)
			await cacheHandler.onEntityEventCreate(["listId", "elementId"], [])

			const spamTrainMailDatum: SpamTrainMailDatum = {
				mailId: mail._id,
				subject: mail.subject,
				body: getMailBodyText(body),
				isSpam: true,
				isSpamConfidence: 1,
				ownerGroup: "owner",
			}

			verify(offlineStorage.storeSpamClassification(spamTrainMailDatum), { times: 1 })
			verify(mailFacade.simpleMoveMails([["listId", "elementId"]], MailSetKind.SPAM, ClientClassifierType.CLIENT_CLASSIFICATION))
		})

		o("processSpam moves mail to inbox when detected as such and its not already in inbox", async function () {
			const offlineStorage = object() as OfflineStoragePersistence
			when(offlineStorageMock()).thenResolve(offlineStorage)
			mail.sets = [spamFolder._id] // the mail is in spam folder
			when(mailFacade.predictSpamResult(mail)).thenResolve(false)

			const cacheHandler = new CustomMailEventCacheHandler(indexerAndMailFacadeMock, offlineStorageMock, cacheStorageMock)
			await cacheHandler.onEntityEventCreate(["listId", "elementId"], [])

			const spamTrainMailDatum: SpamTrainMailDatum = {
				mailId: mail._id,
				subject: mail.subject,
				body: getMailBodyText(body),
				isSpam: false,
				isSpamConfidence: 0,
				ownerGroup: "owner",
			}

			verify(offlineStorage.storeSpamClassification(spamTrainMailDatum), { times: 1 })
			verify(mailFacade.simpleMoveMails([["listId", "elementId"]], MailSetKind.INBOX, ClientClassifierType.CLIENT_CLASSIFICATION))
		})
	})

	o.spec("onEntityEventUpdate", function () {
		let mailIndexer = object() as MailIndexer
		let mailFacade = object() as MailFacade
		let mail: Mail
		let body: Body
		let mailDetails: MailDetails

		o.beforeEach(function () {
			when(indexerAndMailFacadeMock()).thenResolve({ mailIndexer, mailFacade })

			body = object({ text: "Body Text" }) as Body
			mailDetails = object({ body }) as MailDetails
			mail = createTestEntity(MailTypeRef, {
				_id: ["listId", "elementId"],
				subject: "subject",
				sets: [inboxFolder._id],
				_ownerGroup: "owner",
			})
			when(mailIndexer.downloadNewMailData(matchers.anything())).thenResolve({
				mail,
				mailDetails,
			})
		})

		o("does nothing if mail has not been read and not moved or had label applied.", async function () {
			const offlineStorage = object() as OfflineStoragePersistence
			when(offlineStorageMock()).thenResolve(offlineStorage)
			mail.unread = true
			when(cacheStorageMock.get(MailTypeRef, "listId", "elementId")).thenResolve(mail)

			const cacheHandler = new CustomMailEventCacheHandler(indexerAndMailFacadeMock, offlineStorageMock, cacheStorageMock)
			await cacheHandler.onEntityEventUpdate(["listId", "elementId"], [])

			verify(offlineStorage.updateSpamClassificationData(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
		})

		o("does nothing if we delete a mail from spam folder", async function () {
			const offlineStorage = object() as OfflineStoragePersistence
			when(offlineStorageMock()).thenResolve(offlineStorage)
			when(cacheStorageMock.get(MailTypeRef, "listId", "elementId")).thenResolve(mail)
			const cacheHandler = new CustomMailEventCacheHandler(indexerAndMailFacadeMock, offlineStorageMock, cacheStorageMock)

			mail.sets = [spamFolder._id]
			await cacheHandler.onEntityEventCreate(["listId", "elementId"], [])
			verify(offlineStorage.storeSpamClassification(matchers.anything()), { times: 1 })

			mail.sets = [trashFolder._id]
			await cacheHandler.onEntityEventUpdate(["listId", "elementId"], [])

			verify(offlineStorage.updateSpamClassificationData(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
		})

		o("does update spam classification data if mail has been read in inbox and not moved", async function () {
			mail.sets = [inboxFolder._id]
			const offlineStorage = object() as OfflineStoragePersistence
			when(offlineStorage.getStoredClassification(mail)).thenResolve({ isSpam: false, isSpamConfidence: 0 })
			when(offlineStorageMock()).thenResolve(offlineStorage)
			mail.unread = false
			when(cacheStorageMock.get(MailTypeRef, "listId", "elementId")).thenResolve(mail)

			const cacheHandler = new CustomMailEventCacheHandler(indexerAndMailFacadeMock, offlineStorageMock, cacheStorageMock)
			await cacheHandler.onEntityEventUpdate(["listId", "elementId"], [])

			verify(offlineStorage.updateSpamClassificationData(["listId", "elementId"], false, 1), { times: 1 })
			verify(mailFacade.predictSpamResult(mail), { times: 0 })
		})

		o("does update spam classification data if mail has not been read but moved", async function () {
			mail.sets = [spamFolder._id]
			const offlineStorage = object() as OfflineStoragePersistence
			when(offlineStorage.getStoredClassification(mail)).thenResolve({ isSpam: false, isSpamConfidence: 0 })
			when(offlineStorageMock()).thenResolve(offlineStorage)
			mail.unread = true
			when(cacheStorageMock.get(MailTypeRef, "listId", "elementId")).thenResolve(mail)
			const event = object({ typeRef: MailSetEntryTypeRef }) as unknown as EntityUpdateData

			const cacheHandler = new CustomMailEventCacheHandler(indexerAndMailFacadeMock, offlineStorageMock, cacheStorageMock)
			await cacheHandler.onEntityEventUpdate(["listId", "elementId"], [event])

			verify(offlineStorage.updateSpamClassificationData(["listId", "elementId"], true, 1), { times: 1 })
		})

		o("does update spam classification data if mail was not previously included", async function () {
			mail.sets = [inboxFolder._id]
			const offlineStorage = object() as OfflineStoragePersistence
			when(offlineStorage.getStoredClassification(mail)).thenResolve(null)
			when(offlineStorageMock()).thenResolve(offlineStorage)
			mail.unread = true
			when(cacheStorageMock.get(MailTypeRef, "listId", "elementId")).thenResolve(mail)
			const event = object({ typeRef: MailSetEntryTypeRef }) as unknown as EntityUpdateData

			const cacheHandler = new CustomMailEventCacheHandler(indexerAndMailFacadeMock, offlineStorageMock, cacheStorageMock)
			await cacheHandler.onEntityEventUpdate(["listId", "elementId"], [event])

			const spamTrainMailDatum: SpamTrainMailDatum = {
				mailId: mail._id,
				subject: mail.subject,
				body: getMailBodyText(body),
				isSpam: false,
				isSpamConfidence: 0,
				ownerGroup: "owner",
			}

			verify(offlineStorage.storeSpamClassification(spamTrainMailDatum), { times: 1 })
		})
	})
})
