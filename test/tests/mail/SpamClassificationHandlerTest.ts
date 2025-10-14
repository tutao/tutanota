import o from "@tutao/otest"
import { matchers, object, verify, when } from "testdouble"
import {
	Body,
	BodyTypeRef,
	ClientSpamClassifierResultTypeRef,
	Mail,
	MailDetails,
	MailDetailsTypeRef,
	MailFolder,
	MailFolderTypeRef,
	MailSetEntryTypeRef,
	MailTypeRef,
} from "../../../src/common/api/entities/tutanota/TypeRefs"
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
import { BulkMailLoader, MailWithMailDetails } from "../../../src/mail-app/workerUtils/index/BulkMailLoader"
import { EntityRestInterface } from "../../../src/common/api/worker/rest/EntityRestClient"
import { FolderSystem } from "../../../src/common/api/common/mail/FolderSystem"
import { isSameId } from "../../../src/common/api/common/utils/EntityUtils"

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
	let mailDetails: MailDetails

	const inboxFolder = createTestEntity(MailFolderTypeRef, { _id: ["listId", "inbox"], folderType: MailSetKind.INBOX })
	const trashFolder = createTestEntity(MailFolderTypeRef, { _id: ["listId", "trash"], folderType: MailSetKind.TRASH })
	const spamFolder = createTestEntity(MailFolderTypeRef, { _id: ["listId", "spam"], folderType: MailSetKind.SPAM })
	const allFolders = [inboxFolder, trashFolder, spamFolder]

	o.beforeEach(function () {
		spamClassifier = object<SpamClassifier>()
		restClient = object<EntityRestInterface>()

		body = createTestEntity(BodyTypeRef, { text: "Body Text" })
		mailDetails = createTestEntity(MailDetailsTypeRef, { _id: "mailDetail", body })
		mail = createTestEntity(MailTypeRef, {
			_id: ["listId", "elementId"],
			sets: [spamFolder._id],
			subject: "subject",
			_ownerGroup: "owner",
			mailDetails: ["detailsList", mailDetails._id],
			unread: false,
		})
		bulkMailLoader = object<BulkMailLoader>()
		folderSystem = object<FolderSystem>()

		when(folderSystem.getSystemFolderByType(MailSetKind.SPAM)).thenReturn(spamFolder)
		when(folderSystem.getSystemFolderByType(MailSetKind.INBOX)).thenReturn(inboxFolder)
		when(folderSystem.getSystemFolderByType(MailSetKind.TRASH)).thenReturn(trashFolder)
		when(bulkMailLoader.loadMailDetails(matchers.argThat((m: Mail) => isSameId(m._id, mail._id))), anything()).thenResolve([
			{ mail, mailDetails } satisfies MailWithMailDetails,
		])

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

	o("does not classify mail if the mail has non null client classification result", async function () {
		mail.sets = [inboxFolder._id]
		mail.isInboxRuleApplied = false
		mail.clientSpamClassifierResult = createTestEntity(ClientSpamClassifierResultTypeRef)
		inboxRuleOutcome.resolve(null)

		const expectedTrainingData: SpamTrainMailDatum = {
			mailId: mail._id,
			subject: mail.subject,
			body: getMailBodyText(body),
			isSpam: false,
			ownerGroup: "owner",
			isSpamConfidence: 0,
		}

		const finalResult = await spamHandler.predictSpamForNewMail(inboxRuleOutcome.promise, mail, folderSystem)
		o(finalResult).equals(null)
		verify(spamClassifier.predict(anything()), { times: 0 })
		verify(spamClassifier.storeSpamClassification(expectedTrainingData), { times: 1 })
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

	o("does nothing if mail has not been read and not moved or had label applied", async function () {
		mail.unread = true

		await spamHandler.updateSpamClassificationData([], mail, folderSystem)
		verify(spamClassifier.updateSpamClassificationData(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
	})

	// TODO:
	// this should change as we want to keep training datum,
	// we can still retain the model tho
	o("does nothing if we delete a mail from spam folder", async function () {})

	o("does update spam classification data if mail has been read in inbox and not moved", async function () {
		mail.sets = [inboxFolder._id]
		mail.unread = false

		when(spamClassifier.getStoredClassification(anything())).thenResolve({ isSpam: false, isSpamConfidence: 0 })

		await spamHandler.updateSpamClassificationData([], mail, folderSystem)
		verify(spamClassifier.updateSpamClassificationData(["listId", "elementId"], false, 1), { times: 1 })
	})

	o("does update spam classification data if mail has not been read but moved", async function () {
		mail.sets = [spamFolder._id]

		when(spamClassifier.getStoredClassification(anything())).thenResolve({ isSpam: false, isSpamConfidence: 0 })

		const moveEvent = object({ typeRef: MailSetEntryTypeRef }) as unknown as EntityUpdateData
		await spamHandler.updateSpamClassificationData([moveEvent], mail, folderSystem)
		verify(spamClassifier.updateSpamClassificationData(["listId", "elementId"], true, 1), { times: 1 })
	})

	o("does update spam classification data if mail was not previously included", async function () {
		mail.sets = [inboxFolder._id]
		when(spamClassifier.getStoredClassification(mail)).thenResolve(null)

		const spamTrainMailDatum: SpamTrainMailDatum = {
			mailId: mail._id,
			subject: mail.subject,
			body: getMailBodyText(body),
			isSpam: false,
			isSpamConfidence: 0,
			ownerGroup: "owner",
		}

		await spamHandler.updateSpamClassificationData([], mail, folderSystem)
		verify(spamClassifier.storeSpamClassification(spamTrainMailDatum), { times: 1 })
	})
})
