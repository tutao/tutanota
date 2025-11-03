import o from "@tutao/otest"
import { matchers, object, when } from "testdouble"
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
import { SpamClassifier } from "../../../src/mail-app/workerUtils/spamClassification/SpamClassifier"
import { MailSetKind, ProcessingState, SpamDecision } from "../../../src/common/api/common/TutanotaConstants"
import { ClientClassifierType } from "../../../src/common/api/common/ClientClassifierType"
import { assert, assertNotNull } from "@tutao/tutanota-utils"
import { MailFacade } from "../../../src/common/api/worker/facades/lazy/MailFacade"
import { createTestEntity } from "../TestUtils"
import { createSpamMailDatum, SpamClassificationHandler } from "../../../src/mail-app/mail/model/SpamClassificationHandler"
import { FolderSystem } from "../../../src/common/api/common/mail/FolderSystem"
import { isSameId } from "../../../src/common/api/common/utils/EntityUtils"
import { UnencryptedProcessInboxDatum } from "../../../src/mail-app/mail/model/ProcessInboxHandler"
import { SpamMailProcessor } from "../../../src/mail-app/workerUtils/spamClassification/SpamMailProcessor"
import { hammingWindow } from "@tensorflow/tfjs-core/dist/ops/signal/hamming_window"

const { anything } = matchers

o.spec("SpamClassificationHandlerTest", function () {
	let mailFacade = object<MailFacade>()
	let body: Body
	let mail: Mail
	let spamClassifier: SpamClassifier
	let spamHandler: SpamClassificationHandler
	let spamMailProcessor: SpamMailProcessor = new SpamMailProcessor()
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
		spamHandler = new SpamClassificationHandler(spamClassifier, spamMailProcessor)
	})

	o("predictSpamForNewMail does move mail from inbox to spam folder if mail is spam", async function () {
		mail.sets = [inboxFolder._id]
		when(spamClassifier.predict(anything(), anything())).thenResolve(true)

		const finalResult = await spamHandler.predictSpamForNewMail(mail, mailDetails, inboxFolder, folderSystem)

		const expectedProcessInboxDatum: UnencryptedProcessInboxDatum = {
			mailId: mail._id,
			targetMoveFolder: spamFolder._id,
			byInboxRule: false,
			vector: await spamMailProcessor.vectorizeAndCompress(createSpamMailDatum(mail, mailDetails)),
		}

		o(finalResult.targetFolder).deepEquals(spamFolder)
		o(finalResult.processInboxDatum).deepEquals(expectedProcessInboxDatum)
	})

	o("predictSpamForNewMail does NOT move mail from inbox to spam folder if mail is ham", async function () {
		mail.sets = [inboxFolder._id]
		when(spamClassifier.predict(anything(), anything())).thenResolve(false)

		const finalResult = await spamHandler.predictSpamForNewMail(mail, mailDetails, inboxFolder, folderSystem)

		const expectedProcessInboxDatum: UnencryptedProcessInboxDatum = {
			mailId: mail._id,
			targetMoveFolder: inboxFolder._id,
			byInboxRule: false,
			vector: await spamMailProcessor.vectorizeAndCompress(createSpamMailDatum(mail, mailDetails)),
		}

		o(finalResult.targetFolder).deepEquals(inboxFolder)
		o(finalResult.processInboxDatum).deepEquals(expectedProcessInboxDatum)
	})

	o("predictSpamForNewMail does NOT move mail from spam to inbox folder if mail is spam", async function () {
		mail.sets = [spamFolder._id]
		when(spamClassifier.predict(anything(), anything())).thenResolve(true)

		const finalResult = await spamHandler.predictSpamForNewMail(mail, mailDetails, spamFolder, folderSystem)

		const expectedProcessInboxDatum: UnencryptedProcessInboxDatum = {
			mailId: mail._id,
			targetMoveFolder: spamFolder._id,
			byInboxRule: false,
			vector: await spamMailProcessor.vectorizeAndCompress(createSpamMailDatum(mail, mailDetails)),
		}

		o(finalResult.targetFolder).deepEquals(spamFolder)
		o(finalResult.processInboxDatum).deepEquals(expectedProcessInboxDatum)
	})

	o("predictSpamForNewMail moves mail from spam to inbox folder if mail is ham", async function () {
		mail.sets = [spamFolder._id]
		when(spamClassifier.predict(anything(), anything())).thenResolve(false)

		const finalResult = await spamHandler.predictSpamForNewMail(mail, mailDetails, spamFolder, folderSystem)

		const expectedProcessInboxDatum: UnencryptedProcessInboxDatum = {
			mailId: mail._id,
			targetMoveFolder: inboxFolder._id,
			byInboxRule: false,
			vector: await spamMailProcessor.vectorizeAndCompress(createSpamMailDatum(mail, mailDetails)),
		}

		o(finalResult.targetFolder).deepEquals(inboxFolder)
		o(finalResult.processInboxDatum).deepEquals(expectedProcessInboxDatum)
	})
})
