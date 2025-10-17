import o from "@tutao/otest"
import { matchers, object, verify, when } from "testdouble"
import {
	Body,
	BodyTypeRef,
	ClientSpamClassifierResultTypeRef,
	Mail,
	MailDetails,
	MailDetailsTypeRef,
	MailFolderTypeRef,
	MailTypeRef,
} from "../../../src/common/api/entities/tutanota/TypeRefs"
import { SpamClassifier, SpamTrainMailDatum } from "../../../src/mail-app/workerUtils/spamClassification/SpamClassifier"
import { getMailBodyText } from "../../../src/common/api/common/CommonMailUtils"
import { MailSetKind, ProcessingState } from "../../../src/common/api/common/TutanotaConstants"
import { ClientClassifierType } from "../../../src/common/api/common/ClientClassifierType"
import { assert, assertNotNull } from "@tutao/tutanota-utils"
import { MailFacade } from "../../../src/common/api/worker/facades/lazy/MailFacade"
import { createTestEntity } from "../TestUtils"
import { SpamClassificationHandler } from "../../../src/mail-app/mail/model/SpamClassificationHandler"
import { FolderSystem } from "../../../src/common/api/common/mail/FolderSystem"
import { isSameId } from "../../../src/common/api/common/utils/EntityUtils"

const { anything } = matchers

o.spec("SpamClassificationHandlerTest", function () {
	let mailFacade = object<MailFacade>()
	let body: Body
	let mail: Mail
	let spamClassifier: SpamClassifier
	let spamHandler: SpamClassificationHandler
	let folderSystem: FolderSystem
	let mailDetails: MailDetails

	const inboxFolder = createTestEntity(MailFolderTypeRef, { _id: ["listId", "inbox"], folderType: MailSetKind.INBOX })
	const trashFolder = createTestEntity(MailFolderTypeRef, { _id: ["listId", "trash"], folderType: MailSetKind.TRASH })
	const spamFolder = createTestEntity(MailFolderTypeRef, { _id: ["listId", "spam"], folderType: MailSetKind.SPAM })

	o.beforeEach(function () {
		spamClassifier = object<SpamClassifier>()

		body = createTestEntity(BodyTypeRef, { text: "Body Text" })
		mailDetails = createTestEntity(MailDetailsTypeRef, { _id: "mailDetail", body })
		mail = createTestEntity(MailTypeRef, {
			_id: ["listId", "elementId"],
			sets: [spamFolder._id],
			subject: "subject",
			_ownerGroup: "owner",
			mailDetails: ["detailsList", mailDetails._id],
			unread: true,
			processingState: ProcessingState.INBOX_RULE_NOT_PROCESSED,
			clientSpamClassifierResult: null,
		})
		folderSystem = object<FolderSystem>()

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
			mailFacade.loadMailDetailsBlob(
				matchers.argThat((requestedMails: Array<Mail>) => {
					assert(requestedMails.length === 1, "exactly one mail is requested at a time")
					return isSameId(requestedMails[0]._id, mail._id)
				}),
			),
			anything(),
		).thenDo(async () => [{ mail, mailDetails }])
		spamHandler = new SpamClassificationHandler(mailFacade, spamClassifier)
	})

	o("processSpam correctly verifies if email is stored in spam folder", async function () {
		mail.sets = [spamFolder._id]
		when(spamClassifier.predict(anything())).thenResolve(false)
		const expectedTrainingData: SpamTrainMailDatum = {
			mailId: mail._id,
			subject: mail.subject,
			body: getMailBodyText(body),
			isSpam: false,
			ownerGroup: "owner",
			isSpamConfidence: 1,
		}

		const finalResult = await spamHandler.predictSpamForNewMail(mail, mailDetails, spamFolder, folderSystem)
		verify(spamClassifier.storeSpamClassification(expectedTrainingData), { times: 1 })
		verify(mailFacade.simpleMoveMails([mail._id], MailSetKind.INBOX, ClientClassifierType.CLIENT_CLASSIFICATION))
		o(finalResult).deepEquals(inboxFolder)
	})

	o("does not classify mail if the mail has non null client classification result", async function () {
		mail.sets = [inboxFolder._id]
		mail.processingState = ProcessingState.INBOX_RULE_NOT_PROCESSED
		mail.clientSpamClassifierResult = createTestEntity(ClientSpamClassifierResultTypeRef)

		const expectedTrainingData: SpamTrainMailDatum = {
			mailId: mail._id,
			subject: mail.subject,
			body: getMailBodyText(body),
			isSpam: false,
			ownerGroup: "owner",
			isSpamConfidence: 0,
		}

		const finalResult = await spamHandler.predictSpamForNewMail(mail, mailDetails, inboxFolder, folderSystem)
		o(finalResult).equals(null)
		verify(mailFacade.simpleMoveMails(anything(), anything(), anything()), { times: 0 })
		verify(spamClassifier.predict(anything()), { times: 0 })
		verify(spamClassifier.storeSpamClassification(expectedTrainingData), { times: 1 })
	})

	o("processSpam moves mail to inbox when detected as such and its not already in inbox", async function () {
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

		const finalResult = await spamHandler.predictSpamForNewMail(mail, mailDetails, spamFolder, folderSystem)
		o(finalResult).deepEquals(inboxFolder)
		verify(spamClassifier.storeSpamClassification(expectedDatum), { times: 1 })
		verify(mailFacade.simpleMoveMails([["listId", "elementId"]], MailSetKind.INBOX, ClientClassifierType.CLIENT_CLASSIFICATION), { times: 1 })
	})

	o("processSpam moves mail to spam when detected as such and its not already in spam", async function () {
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

		const finalResult = await spamHandler.predictSpamForNewMail(mail, mailDetails, inboxFolder, folderSystem)
		o(finalResult).deepEquals(spamFolder)
		verify(spamClassifier.storeSpamClassification(expectedDatum), { times: 1 })
		verify(mailFacade.simpleMoveMails([["listId", "elementId"]], MailSetKind.SPAM, ClientClassifierType.CLIENT_CLASSIFICATION), { times: 1 })
	})

	o("does nothing if mail has not been read and not moved or had label applied", async function () {
		mail.unread = true

		await spamHandler.updateSpamClassificationData(mail)
		verify(spamClassifier.updateSpamClassification(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
	})

	o("update spam classification data on every mail update", async function () {
		when(spamClassifier.getSpamClassification(anything())).thenResolve({ isSpam: false, isSpamConfidence: 0 })
		mail.sets = [spamFolder._id]

		await spamHandler.updateSpamClassificationData(mail)
		verify(spamClassifier.updateSpamClassification(["listId", "elementId"], true, 1), { times: 1 })
	})

	o("does update spam classification data if mail was not previously included", async function () {
		mail.sets = [inboxFolder._id]
		when(spamClassifier.getSpamClassification(mail._id)).thenResolve(null)

		const spamTrainMailDatum: SpamTrainMailDatum = {
			mailId: mail._id,
			subject: mail.subject,
			body: getMailBodyText(body),
			isSpam: false,
			isSpamConfidence: 1,
			ownerGroup: "owner",
		}

		await spamHandler.updateSpamClassificationData(mail)
		verify(spamClassifier.storeSpamClassification(spamTrainMailDatum), { times: 1 })
	})
})
