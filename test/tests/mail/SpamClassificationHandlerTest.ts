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
import { MailSetKind, ProcessingState, SpamDecision } from "../../../src/common/api/common/TutanotaConstants"
import { ClientClassifierType } from "../../../src/common/api/common/ClientClassifierType"
import { assert, assertNotNull } from "@tutao/tutanota-utils"
import { MailFacade } from "../../../src/common/api/worker/facades/lazy/MailFacade"
import { createTestEntity } from "../TestUtils"
import { SpamClassificationHandler } from "../../../src/mail-app/mail/model/SpamClassificationHandler"
import { FolderSystem } from "../../../src/common/api/common/mail/FolderSystem"
import { isSameId } from "../../../src/common/api/common/utils/EntityUtils"
import { any } from "@tensorflow/tfjs-core"

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
			clientSpamClassifierResult: createTestEntity(ClientSpamClassifierResultTypeRef, { spamDecision: SpamDecision.NONE }),
		})
		folderSystem = object<FolderSystem>()

		when(mailFacade.moveMails(anything(), anything(), anything(), ClientClassifierType.CLIENT_CLASSIFICATION)).thenResolve([])
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

	o("predictSpamForNewMail does move mail from inbox to spam folder if mail is spam", async function () {
		mail.sets = [inboxFolder._id]
		when(spamClassifier.predict(anything())).thenResolve(true)

		const finalResult = await spamHandler.predictSpamForNewMail(mail, mailDetails, inboxFolder, folderSystem)
		o(spamHandler.hamMoveMailData).deepEquals(null)
		o(spamHandler.spamMoveMailData?.mails).deepEquals([mail._id])
		o(spamHandler.classifierResultServiceMailIds).deepEquals([])
		o(finalResult).deepEquals(spamFolder)
	})

	o("predictSpamForNewMail does NOT move mail from inbox to spam folder if mail is ham", async function () {
		mail.sets = [inboxFolder._id]
		when(spamClassifier.predict(anything())).thenResolve(false)

		const finalResult = await spamHandler.predictSpamForNewMail(mail, mailDetails, inboxFolder, folderSystem)
		o(spamHandler.hamMoveMailData).deepEquals(null)
		o(spamHandler.spamMoveMailData).deepEquals(null)
		o(spamHandler.classifierResultServiceMailIds).deepEquals([mail._id])
		o(finalResult).deepEquals(inboxFolder)
	})

	o("predictSpamForNewMail does NOT move mail from spam to inbox folder if mail is spam", async function () {
		mail.sets = [spamFolder._id]
		when(spamClassifier.predict(anything())).thenResolve(true)

		const finalResult = await spamHandler.predictSpamForNewMail(mail, mailDetails, spamFolder, folderSystem)
		o(spamHandler.hamMoveMailData).deepEquals(null)
		o(spamHandler.spamMoveMailData).deepEquals(null)
		o(spamHandler.classifierResultServiceMailIds).deepEquals([mail._id])
		o(finalResult).deepEquals(spamFolder)
	})

	o("predictSpamForNewMail moves mail from spam to inbox folder if mail is ham", async function () {
		mail.sets = [spamFolder._id]
		when(spamClassifier.predict(anything())).thenResolve(false)

		const finalResult = await spamHandler.predictSpamForNewMail(mail, mailDetails, spamFolder, folderSystem)
		o(spamHandler.hamMoveMailData?.mails).deepEquals([mail._id])
		o(spamHandler.spamMoveMailData).deepEquals(null)
		o(spamHandler.classifierResultServiceMailIds).deepEquals([])
		o(finalResult).deepEquals(inboxFolder)
	})

	o("predictSpamForNewMail does NOT move mail from spam to spam folder if mail is spam", async function () {
		mail.sets = [spamFolder._id]
		when(spamClassifier.predict(anything())).thenResolve(true)

		const finalResult = await spamHandler.predictSpamForNewMail(mail, mailDetails, spamFolder, folderSystem)
		o(spamHandler.hamMoveMailData).deepEquals(null)
		o(spamHandler.spamMoveMailData).deepEquals(null)
		o(spamHandler.classifierResultServiceMailIds).deepEquals([mail._id])
		o(finalResult).deepEquals(spamFolder)
	})

	o(
		"predictSpamForNewMail does NOT send classifierResultService request if processingState is INBOX_RULE_PROCESSED_AND_SPAM_PREDICTION_MADE",
		async function () {
			mail.sets = [inboxFolder._id]
			mail.processingState = ProcessingState.INBOX_RULE_PROCESSED_AND_SPAM_PREDICTION_MADE
			when(spamClassifier.predict(anything())).thenResolve(false)

			const finalResult = await spamHandler.predictSpamForNewMail(mail, mailDetails, inboxFolder, folderSystem)
			o(spamHandler.hamMoveMailData).deepEquals(null)
			o(spamHandler.spamMoveMailData).deepEquals(null)
			o(spamHandler.classifierResultServiceMailIds).deepEquals([])
			o(finalResult).deepEquals(inboxFolder)
		},
	)

	o("update spam classification data on every mail update", async function () {
		when(spamClassifier.getSpamClassification(anything())).thenResolve({ isSpam: false, isSpamConfidence: 0 })
		mail.clientSpamClassifierResult = createTestEntity(ClientSpamClassifierResultTypeRef, {
			spamDecision: SpamDecision.BLACKLIST,
			confidence: "1",
		})

		await spamHandler.updateSpamClassificationData(mail)
		verify(spamClassifier.updateSpamClassification(["listId", "elementId"], true, 1), { times: 1 })
	})
})
