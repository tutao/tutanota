import o from "@tutao/otest"
import { matchers, object, verify, when } from "testdouble"
import { OfflineStoragePersistence } from "../../../src/mail-app/workerUtils/index/OfflineStoragePersistence"
import { CustomMailEventCacheHandler } from "../../../src/common/api/worker/rest/cacheHandler/CustomMailEventCacheHandler"
import { Body, BodyTypeRef, Mail, MailFolder, MailFolderTypeRef, MailSetEntryTypeRef, MailTypeRef } from "../../../src/common/api/entities/tutanota/TypeRefs"
import { SpamClassifier, SpamTrainMailDatum } from "../../../src/mail-app/workerUtils/spamClassification/SpamClassifier"
import { getMailBodyText } from "../../../src/common/api/common/CommonMailUtils"
import { getMailSetKind, MailSetKind } from "../../../src/common/api/common/TutanotaConstants"
import { ClientClassifierType } from "../../../src/common/api/common/ClientClassifierType"
import { EntityUpdateData } from "../../../src/common/api/common/utils/EntityUpdateUtils"
import { defer, lazyAsync, Nullable } from "@tutao/tutanota-utils"
import { MailIndexer } from "../../../src/mail-app/workerUtils/index/MailIndexer"
import { MailFacade } from "../../../src/common/api/worker/facades/lazy/MailFacade"
import { createTestEntity } from "../TestUtils"
import { SpamClassificationHandler } from "../../../src/mail-app/mail/model/SpamClassificationHandler"
import { EntityClient } from "../../../src/common/api/common/EntityClient"
import { ClientModelInfo } from "../../../src/common/api/common/EntityFunctions"
import { BulkMailLoader } from "../../../src/mail-app/workerUtils/index/BulkMailLoader"
import { EntityRestInterface } from "../../../src/common/api/worker/rest/EntityRestClient"
import { FolderSystem } from "../../../src/common/api/common/mail/FolderSystem"

const { anything } = matchers

o.spec("SpamClassificationHandlerTest", function () {
	let indexerAndMailFacadeMock: lazyAsync<{ mailIndexer: MailIndexer; mailFacade: MailFacade }>
	let mailFacade = object<MailFacade>()
	let body: Body
	let mail: Mail
	let spamClassifier: SpamClassifier
	let spamHandler: SpamClassificationHandler
	let restClient: EntityRestInterface
	let bulkMailLoader: BulkMailLoader
	const inboxRuleOutcome = defer<Nullable<MailFolder>>()
	let folderSystem: FolderSystem

	const inboxFolder = createTestEntity(MailFolderTypeRef, { _id: ["listId", "inbox"], folderType: MailSetKind.INBOX })
	const trashFolder = createTestEntity(MailFolderTypeRef, { _id: ["listId", "trash"], folderType: MailSetKind.TRASH })
	const spamFolder = createTestEntity(MailFolderTypeRef, { _id: ["listId", "spam"], folderType: MailSetKind.SPAM })
	const allFolders = [inboxFolder, trashFolder, spamFolder]

	o.beforeEach(function () {
		spamClassifier = object<SpamClassifier>()
		restClient = object<EntityRestInterface>()
		body = createTestEntity(BodyTypeRef, { text: "Body Text" })
		mail = createTestEntity(MailTypeRef, {
			_id: ["listId", "elementId"],
			sets: [spamFolder._id],
			subject: "subject",
			_ownerGroup: "owner",
			unread: false,
		})
		bulkMailLoader = object<BulkMailLoader>()
		folderSystem = object<FolderSystem>()

		when(folderSystem.getSystemFolderByType(MailSetKind.SPAM)).thenReturn(spamFolder)
		when(folderSystem.getSystemFolderByType(MailSetKind.INBOX)).thenReturn(inboxFolder)
		when(folderSystem.getSystemFolderByType(MailSetKind.TRASH)).thenReturn(trashFolder)

		const entityClient = new EntityClient(restClient, ClientModelInfo.getNewInstanceForTestsOnly())
		spamHandler = new SpamClassificationHandler(mailFacade, spamClassifier, entityClient, bulkMailLoader)
	})

	o("processSpam correctly verifies if email is stored in spam folder", async function () {
		inboxRuleOutcome.resolve(null)

		when(spamClassifier.predict(anything())).thenResolve(false)
		mail.sets = [spamFolder._id]
		const expectedTrainingData: SpamTrainMailDatum = {
			mailId: mail._id,
			subject: mail.subject,
			body: getMailBodyText(body),
			isSpam: false,
			ownerGroup: "owner",
			isSpamConfidence: 0,
		}

		const finalResult = await spamHandler.predictSpamForNewMail(inboxRuleOutcome.promise, mail, folderSystem)
		verify(spamClassifier.storeSpamClassification(expectedTrainingData), { times: 1 })
		verify(mailFacade.simpleMoveMails([mail._id], MailSetKind.INBOX, ClientClassifierType.CLIENT_CLASSIFICATION))
		o(finalResult).deepEquals(inboxFolder)
	})

	o("getSpamConfidence is 0 for mail in trash folder ", async function () {
		inboxRuleOutcome.resolve(null)
		mail.sets = [trashFolder._id]

		when(spamClassifier.predict(anything())).thenResolve(true)
		mail.sets = [spamFolder._id]
		const expectedTrainingData: SpamTrainMailDatum = {
			mailId: mail._id,
			subject: mail.subject,
			body: getMailBodyText(body),
			isSpam: false,
			ownerGroup: "owner",
			isSpamConfidence: 0,
		}

		const finalResult = await spamHandler.predictSpamForNewMail(inboxRuleOutcome.promise, mail, folderSystem)
		verify(spamClassifier.storeSpamClassification(expectedTrainingData), { times: 1 })
		o(finalResult).deepEquals(inboxFolder)
	})

	o("getSpamConfidence is 1 for mail in spam folder ", async function () {
		o(spamHandler.getSpamConfidence(mail, getMailSetKind(spamFolder))).equals(1)
	})

	// TODO: read status does not matter any more write test for new aggregated type
	o("getSpamConfidence for inbox folder depends on read status", async function () {})

	o("processSpam moves mail to spam when detected as such and its not already in spam", async function () {
		inboxRuleOutcome.resolve(null)

		mail.sets = [inboxFolder._id]
		when(spamClassifier.predict(anything())).thenResolve(true)
		const expectedDatum: SpamTrainMailDatum = {
			mailId: mail._id,
			subject: mail.subject,
			body: getMailBodyText(body),
			isSpam: true,
			isSpamConfidence: 1,
			ownerGroup: "owner",
		}

		const finalResult = await spamHandler.predictSpamForNewMail(inboxRuleOutcome.promise, mail, folderSystem)
		verify(spamClassifier.storeSpamClassification(expectedDatum), { times: 1 })
		verify(mailFacade.simpleMoveMails([["listId", "elementId"]], MailSetKind.SPAM, ClientClassifierType.CLIENT_CLASSIFICATION))
		o(finalResult).deepEquals(spamFolder)
	})

	o("processSpam moves mail to inbox when detected as such and its not already in inbox", async function () {
		inboxRuleOutcome.resolve(null)

		mail.sets = [inboxFolder._id]
		when(spamClassifier.predict(anything())).thenResolve(true)
		const expectedDatum: SpamTrainMailDatum = {
			mailId: mail._id,
			subject: mail.subject,
			body: getMailBodyText(body),
			isSpam: false,
			isSpamConfidence: 0,
			ownerGroup: "owner",
		}

		const finalResult = await spamHandler.predictSpamForNewMail(inboxRuleOutcome.promise, mail, folderSystem)
		verify(spamClassifier.storeSpamClassification(expectedDatum), { times: 1 })
		verify(mailFacade.simpleMoveMails([["listId", "elementId"]], MailSetKind.SPAM, ClientClassifierType.CLIENT_CLASSIFICATION))
		o(finalResult).deepEquals(spamFolder)
	})

	o("does nothing if mail has not been read and not moved or had label applied.", async function () {
		mail.unread = true

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
