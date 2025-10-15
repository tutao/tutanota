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
	MailTypeRef,
} from "../../../src/common/api/entities/tutanota/TypeRefs"
import { SpamClassifier, SpamTrainMailDatum } from "../../../src/mail-app/workerUtils/spamClassification/SpamClassifier"
import { getMailBodyText } from "../../../src/common/api/common/CommonMailUtils"
import { MailSetKind } from "../../../src/common/api/common/TutanotaConstants"
import { ClientClassifierType } from "../../../src/common/api/common/ClientClassifierType"
import { assert, assertNotNull, defer, Nullable } from "@tutao/tutanota-utils"
import { MailFacade } from "../../../src/common/api/worker/facades/lazy/MailFacade"
import { createTestEntity } from "../TestUtils"
import { SpamClassificationHandler } from "../../../src/mail-app/mail/model/SpamClassificationHandler"
import { EntityClient } from "../../../src/common/api/common/EntityClient"
import { ClientModelInfo } from "../../../src/common/api/common/EntityFunctions"
import { BulkMailLoader } from "../../../src/mail-app/workerUtils/index/BulkMailLoader"
import { EntityRestInterface } from "../../../src/common/api/worker/rest/EntityRestClient"
import { FolderSystem } from "../../../src/common/api/common/mail/FolderSystem"
import { isSameId } from "../../../src/common/api/common/utils/EntityUtils"
import { WebsocketConnectivityModel } from "../../../src/common/misc/WebsocketConnectivityModel"

const { anything } = matchers

o.spec("SpamClassificationHandlerTest", function () {
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
	let connectivityModel: WebsocketConnectivityModel

	const inboxFolder = createTestEntity(MailFolderTypeRef, { _id: ["listId", "inbox"], folderType: MailSetKind.INBOX })
	const trashFolder = createTestEntity(MailFolderTypeRef, { _id: ["listId", "trash"], folderType: MailSetKind.TRASH })
	const spamFolder = createTestEntity(MailFolderTypeRef, { _id: ["listId", "spam"], folderType: MailSetKind.SPAM })

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
			unread: true,
			isInboxRuleApplied: false,
			clientSpamClassifierResult: null,
		})
		bulkMailLoader = object<BulkMailLoader>()
		folderSystem = object<FolderSystem>()

		connectivityModel = object<WebsocketConnectivityModel>()
		when(connectivityModel.isLeader()).thenReturn(true)

		when(mailFacade.simpleMoveMails(anything(), anything(), ClientClassifierType.CLIENT_CLASSIFICATION)).thenResolve([])
		when(folderSystem.getSystemFolderByType(MailSetKind.SPAM)).thenReturn(spamFolder)
		when(folderSystem.getSystemFolderByType(MailSetKind.INBOX)).thenReturn(inboxFolder)
		when(folderSystem.getSystemFolderByType(MailSetKind.TRASH)).thenReturn(trashFolder)
		when(folderSystem.getFolderByMail(anything())).thenDo((mail: Mail) => {
			assert(mail.sets.length === 1, "Expected exactly one mail set")
			const mailFolderId = assertNotNull(mail.sets[0])
			if (isSameId(mailFolderId, trashFolder._id)) return trashFolder
			else if (isSameId(mailFolderId, spamFolder._id)) return spamFolder
			else if (isSameId(mailFolderId, inboxFolder._id)) return inboxFolder
			else throw new Error("Unknown mail Folder")
		})
		when(
			bulkMailLoader.loadMailDetails(
				matchers.argThat((requestedMails: Array<Mail>) => {
					assert(requestedMails.length === 1, "exactly one mail is requested at a time")
					return isSameId(requestedMails[0]._id, mail._id)
				}),
			),
			anything(),
		).thenDo(async () => [{ mail, mailDetails }])

		const entityClient = new EntityClient(restClient, ClientModelInfo.getNewInstanceForTestsOnly())
		spamHandler = new SpamClassificationHandler(mailFacade, spamClassifier, entityClient, bulkMailLoader, connectivityModel)
	})

	o("processSpam correctly verifies if email is stored in spam folder", async function () {
		inboxRuleOutcome.resolve(null)

		mail.sets = [spamFolder._id]
		when(spamClassifier.predict(anything())).thenResolve(false)
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
		verify(mailFacade.simpleMoveMails(anything(), anything(), anything()), { times: 0 })
		verify(spamClassifier.predict(anything()), { times: 0 })
		verify(spamClassifier.storeSpamClassification(expectedTrainingData), { times: 1 })
	})

	o("mail in spam folder is not classified but stored with confidence 0", async function () {
		inboxRuleOutcome.resolve(null)
		mail.sets = [trashFolder._id]

		const expectedTrainingData: SpamTrainMailDatum = {
			mailId: mail._id,
			subject: mail.subject,
			body: getMailBodyText(body),
			isSpam: false,
			ownerGroup: "owner",
			isSpamConfidence: 0,
		}

		const finalResult = await spamHandler.predictSpamForNewMail(inboxRuleOutcome.promise, mail, folderSystem)
		o(finalResult).deepEquals(null)
		verify(mailFacade.simpleMoveMails(anything(), anything(), anything()), { times: 0 })
		verify(spamClassifier.storeSpamClassification(expectedTrainingData), { times: 1 })
	})

	o("getSpamConfidence is 1 for mail in spam folder ", async function () {
		let locatedMailset: MailSetKind

		// when a mail is unread in spam or ham folder
		{
			mail.unread = true
			mail.isInboxRuleApplied = false
			mail.clientSpamClassifierResult = null

			locatedMailset = MailSetKind.SPAM
			o(spamHandler.getSpamConfidence(mail, locatedMailset)).equals(1)
			locatedMailset = MailSetKind.INBOX
			o(spamHandler.getSpamConfidence(mail, locatedMailset)).equals(0)
		}

		// when a spam or ham mail have isInboxRuleApplied true
		{
			mail.unread = true
			mail.isInboxRuleApplied = true
			mail.clientSpamClassifierResult = null

			locatedMailset = MailSetKind.SPAM
			o(spamHandler.getSpamConfidence(mail, locatedMailset)).equals(1)

			locatedMailset = MailSetKind.INBOX
			o(spamHandler.getSpamConfidence(mail, locatedMailset)).equals(1)
		}

		// when a spam or ham mail have clientSpamClassifierResult
		{
			mail.unread = true
			mail.isInboxRuleApplied = false
			mail.clientSpamClassifierResult = createTestEntity(ClientSpamClassifierResultTypeRef, { confidence: "3" })

			locatedMailset = MailSetKind.SPAM
			o(spamHandler.getSpamConfidence(mail, locatedMailset)).equals(3)
			locatedMailset = MailSetKind.INBOX
			o(spamHandler.getSpamConfidence(mail, locatedMailset)).equals(3)
		}
	})

	o("processSpam moves mail to inbox when detected as such and its not already in inbox", async function () {
		inboxRuleOutcome.resolve(null)
		when(spamClassifier.predict(anything())).thenResolve(false)

		mail.sets = [spamFolder._id]
		mail.unread = false
		const expectedDatum: SpamTrainMailDatum = {
			mailId: mail._id,
			subject: mail.subject,
			body: getMailBodyText(body),
			isSpam: false,
			isSpamConfidence: 1,
			ownerGroup: "owner",
		}

		const finalResult = await spamHandler.predictSpamForNewMail(inboxRuleOutcome.promise, mail, folderSystem)
		o(finalResult).deepEquals(inboxFolder)
		verify(spamClassifier.storeSpamClassification(expectedDatum), { times: 1 })
		verify(mailFacade.simpleMoveMails([["listId", "elementId"]], MailSetKind.INBOX, ClientClassifierType.CLIENT_CLASSIFICATION), { times: 1 })
	})

	o("processSpam moves mail to spam when detected as such and its not already in spam", async function () {
		inboxRuleOutcome.resolve(null)
		when(spamClassifier.predict(anything())).thenResolve(true)

		mail.sets = [inboxFolder._id]
		const expectedDatum: SpamTrainMailDatum = {
			mailId: mail._id,
			subject: mail.subject,
			body: getMailBodyText(body),
			isSpam: true,
			isSpamConfidence: 1,
			ownerGroup: "owner",
		}

		const finalResult = await spamHandler.predictSpamForNewMail(inboxRuleOutcome.promise, mail, folderSystem)
		o(finalResult).deepEquals(spamFolder)
		verify(spamClassifier.storeSpamClassification(expectedDatum), { times: 1 })
		verify(mailFacade.simpleMoveMails([["listId", "elementId"]], MailSetKind.SPAM, ClientClassifierType.CLIENT_CLASSIFICATION), { times: 1 })
	})

	o("does nothing if mail has not been read and not moved or had label applied", async function () {
		mail.unread = true

		await spamHandler.updateSpamClassificationData(mail, folderSystem)
		verify(spamClassifier.updateSpamClassification(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
	})

	o("update spam classification data on every mail update", async function () {
		when(spamClassifier.getSpamClassification(anything())).thenResolve({ isSpam: false, isSpamConfidence: 0 })
		mail.sets = [spamFolder._id]

		await spamHandler.updateSpamClassificationData(mail, folderSystem)
		verify(spamClassifier.updateSpamClassificationData(["listId", "elementId"], true, 1), { times: 1 })
	})

	o("does update spam classification data if mail was not previously included", async function () {
		mail.sets = [inboxFolder._id]
		when(spamClassifier.getSpamClassification(mail._id)).thenResolve(null)

		const spamTrainMailDatum: SpamTrainMailDatum = {
			mailId: mail._id,
			subject: mail.subject,
			body: getMailBodyText(body),
			isSpam: false,
			isSpamConfidence: 0,
			ownerGroup: "owner",
		}

		await spamHandler.updateSpamClassificationData(mail, folderSystem)
		verify(spamClassifier.storeSpamClassification(spamTrainMailDatum), { times: 1 })
	})
})
