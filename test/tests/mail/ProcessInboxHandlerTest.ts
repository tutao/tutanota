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
import { FeatureType, MailSetKind, ProcessingState, SpamDecision } from "../../../src/common/api/common/TutanotaConstants"
import { ClientClassifierType } from "../../../src/common/api/common/ClientClassifierType"
import { assertNotNull, delay } from "@tutao/tutanota-utils"
import { MailFacade } from "../../../src/common/api/worker/facades/lazy/MailFacade"
import { createTestEntity } from "../TestUtils"
import { createSpamMailDatum, SpamClassificationHandler } from "../../../src/mail-app/mail/model/SpamClassificationHandler"
import { FolderSystem } from "../../../src/common/api/common/mail/FolderSystem"
import { isSameId } from "../../../src/common/api/common/utils/EntityUtils"
import { InboxRuleHandler } from "../../../src/mail-app/mail/model/InboxRuleHandler"
import { ProcessInboxHandler, UnencryptedProcessInboxDatum } from "../../../src/mail-app/mail/model/ProcessInboxHandler"
import { MailboxDetail } from "../../../src/common/mailFunctionality/MailboxModel"
import { SpamMailProcessor } from "../../../src/mail-app/workerUtils/spamClassification/SpamMailProcessor"
import { LoginController } from "../../../src/common/api/main/LoginController"

const { anything } = matchers

o.spec("ProcessInboxHandlerTest", function () {
	let mailFacade = object<MailFacade>()
	let logins = object<LoginController>()
	let body: Body
	let mail: Mail
	let spamHandler: SpamClassificationHandler
	let folderSystem: FolderSystem
	let mailboxDetail: MailboxDetail
	let mailDetails: MailDetails
	let inboxRuleHandler: InboxRuleHandler = object<InboxRuleHandler>()
	let spamMailProcessor: SpamMailProcessor = object<SpamMailProcessor>()
	let processInboxHandler: ProcessInboxHandler

	const inboxFolder = createTestEntity(MailFolderTypeRef, { _id: ["listId", "inbox"], folderType: MailSetKind.INBOX })
	const trashFolder = createTestEntity(MailFolderTypeRef, { _id: ["listId", "trash"], folderType: MailSetKind.TRASH })
	const spamFolder = createTestEntity(MailFolderTypeRef, { _id: ["listId", "spam"], folderType: MailSetKind.SPAM })

	o.beforeEach(function () {
		spamHandler = object<SpamClassificationHandler>()
		inboxRuleHandler = object<InboxRuleHandler>()

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
			processNeeded: true,
		})
		folderSystem = object<FolderSystem>()
		mailboxDetail = object()

		when(mailFacade.moveMails(anything(), anything(), anything(), ClientClassifierType.CLIENT_CLASSIFICATION)).thenResolve([])
		when(
			mailFacade.loadMailDetailsBlob(
				matchers.argThat((requestedMails: Mail) => {
					return isSameId(requestedMails._id, mail._id)
				}),
			),
		).thenDo(async () => mailDetails)
		processInboxHandler = new ProcessInboxHandler(
			logins,
			mailFacade,
			() => spamHandler,
			() => inboxRuleHandler,
			new Map(),
			new SpamMailProcessor(),
			0,
		)
		when(logins.isEnabled(FeatureType.SpamClientClassification)).thenReturn(true)
	})

	o("handleIncomingMail does move mail if it has been processed already", async function () {
		mail.sets = [inboxFolder._id]
		mail.processNeeded = false
		verify(inboxRuleHandler.findAndApplyMatchingRule(anything(), anything(), anything()), { times: 0 })
		verify(spamHandler.predictSpamForNewMail(anything(), anything(), anything(), anything()), { times: 0 })
		const targetFolder = await processInboxHandler.handleIncomingMail(mail, inboxFolder, mailboxDetail, folderSystem)
		o(targetFolder).deepEquals(inboxFolder)
		verify(mailFacade.processNewMails(anything(), anything()), { times: 0 })
	})

	o("handleIncomingMail does move mail from inbox to other folder if inbox rule applies", async function () {
		mail.sets = [inboxFolder._id]
		const processInboxDatum: UnencryptedProcessInboxDatum = {
			byInboxRule: true,
			mailId: mail._id,
			targetMoveFolder: trashFolder._id,
			vector: new Uint8Array(),
		}
		when(inboxRuleHandler.findAndApplyMatchingRule(mailboxDetail, mail, true)).thenResolve({
			targetFolder: trashFolder,
			processInboxDatum,
		})
		verify(spamHandler.predictSpamForNewMail(anything(), anything(), anything(), anything()), { times: 0 })

		const targetFolder = await processInboxHandler.handleIncomingMail(mail, inboxFolder, mailboxDetail, folderSystem)
		o(targetFolder).deepEquals(trashFolder)
		await delay(0)
		verify(mailFacade.processNewMails(assertNotNull(mail._ownerGroup), [processInboxDatum]))
	})

	o("handleIncomingMail does move mail from inbox to spam folder if mail is spam", async function () {
		mail.sets = [inboxFolder._id]
		when(inboxRuleHandler.findAndApplyMatchingRule(mailboxDetail, mail, true)).thenResolve(null)
		const processInboxDatum: UnencryptedProcessInboxDatum = {
			byInboxRule: false,
			mailId: mail._id,
			targetMoveFolder: spamFolder._id,
			vector: new Uint8Array(),
		}
		when(spamHandler.predictSpamForNewMail(mail, mailDetails, inboxFolder, folderSystem)).thenResolve({
			targetFolder: spamFolder,
			processInboxDatum,
		})

		const targetFolder = await processInboxHandler.handleIncomingMail(mail, inboxFolder, mailboxDetail, folderSystem)
		o(targetFolder).deepEquals(spamFolder)
		await delay(0)
		verify(mailFacade.processNewMails(assertNotNull(mail._ownerGroup), [processInboxDatum]))
	})

	o("handleIncomingMail does NOT move mail from inbox to spam folder if mail is ham", async function () {
		mail.sets = [inboxFolder._id]
		when(inboxRuleHandler.findAndApplyMatchingRule(mailboxDetail, mail, true)).thenResolve(null)
		const processInboxDatum: UnencryptedProcessInboxDatum = {
			byInboxRule: false,
			mailId: mail._id,
			targetMoveFolder: inboxFolder._id,
			vector: new Uint8Array(),
		}
		when(spamHandler.predictSpamForNewMail(mail, mailDetails, inboxFolder, folderSystem)).thenResolve({
			targetFolder: inboxFolder,
			processInboxDatum,
		})

		const targetFolder = await processInboxHandler.handleIncomingMail(mail, inboxFolder, mailboxDetail, folderSystem)
		o(targetFolder).deepEquals(inboxFolder)
		await delay(0)
		verify(mailFacade.processNewMails(assertNotNull(mail._ownerGroup), [processInboxDatum]))
	})

	o("handleIncomingMail does NOT move mail from spam to inbox folder if mail is spam", async function () {
		mail.sets = [spamFolder._id]
		when(inboxRuleHandler.findAndApplyMatchingRule(mailboxDetail, mail, true)).thenResolve(null)
		const processInboxDatum: UnencryptedProcessInboxDatum = {
			byInboxRule: false,
			mailId: mail._id,
			targetMoveFolder: spamFolder._id,
			vector: new Uint8Array(),
		}
		when(spamHandler.predictSpamForNewMail(mail, mailDetails, inboxFolder, folderSystem)).thenResolve({
			targetFolder: spamFolder,
			processInboxDatum,
		})

		const targetFolder = await processInboxHandler.handleIncomingMail(mail, inboxFolder, mailboxDetail, folderSystem)
		o(targetFolder).deepEquals(spamFolder)
		await delay(0)
		verify(mailFacade.processNewMails(assertNotNull(mail._ownerGroup), [processInboxDatum]))
	})

	o("handleIncomingMail moves mail from spam to inbox folder if mail is ham", async function () {
		mail.sets = [spamFolder._id]
		when(inboxRuleHandler.findAndApplyMatchingRule(mailboxDetail, mail, true)).thenResolve(null)
		const processInboxDatum: UnencryptedProcessInboxDatum = {
			byInboxRule: false,
			mailId: mail._id,
			targetMoveFolder: inboxFolder._id,
			vector: new Uint8Array(),
		}
		when(spamHandler.predictSpamForNewMail(mail, mailDetails, inboxFolder, folderSystem)).thenResolve({
			targetFolder: inboxFolder,
			processInboxDatum,
		})

		const targetFolder = await processInboxHandler.handleIncomingMail(mail, inboxFolder, mailboxDetail, folderSystem)
		o(targetFolder).deepEquals(inboxFolder)
		await delay(0)
		verify(mailFacade.processNewMails(assertNotNull(mail._ownerGroup), [processInboxDatum]))
	})

	o("handleIncomingMail does NOT move mail from inbox to spam folder if spam classification is disabled", async function () {
		when(logins.isEnabled(FeatureType.SpamClientClassification)).thenReturn(false)

		mail.sets = [inboxFolder._id]
		const compressedVector = new Uint8Array([2, 4, 8, 16])

		const datum = createSpamMailDatum(mail, mailDetails)
		when(spamMailProcessor.vectorizeAndCompress(datum)).thenResolve(compressedVector)
		processInboxHandler = new ProcessInboxHandler(
			logins,
			mailFacade,
			() => spamHandler,
			() => inboxRuleHandler,
			new Map(),
			spamMailProcessor,
			0,
		)
		when(inboxRuleHandler.findAndApplyMatchingRule(mailboxDetail, mail, true)).thenResolve(null)
		const processedMail: UnencryptedProcessInboxDatum = {
			byInboxRule: false,
			mailId: mail._id,
			targetMoveFolder: inboxFolder._id,
			vector: compressedVector,
		}
		verify(spamHandler.predictSpamForNewMail(anything(), anything(), anything(), anything()), { times: 0 })

		const targetFolder = await processInboxHandler.handleIncomingMail(mail, inboxFolder, mailboxDetail, folderSystem)
		o(targetFolder).deepEquals(inboxFolder)
		await delay(0)
		verify(mailFacade.processNewMails(assertNotNull(mail._ownerGroup), [processedMail]))
	})
})
