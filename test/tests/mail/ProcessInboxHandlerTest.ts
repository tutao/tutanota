import o from "@tutao/otest"
import { matchers, object, verify, when } from "testdouble"
import { assertNotNull, delay } from "../../../src/platform-kit/utils"
import { MailFacade } from "../../../src/applications/common/api/worker/facades/lazy/MailFacade"
import { createTestEntity } from "../TestUtils"
import { SkipClientSpamClassificationReason, SpamClassificationHandler } from "../../../src/applications/mail-app/mail/model/SpamClassificationHandler"
import { FolderSystem } from "../../../src/applications/common/api/common/mail/FolderSystem"
import { InboxRuleHandler, SomeInboxRule } from "../../../src/applications/mail-app/mail/model/InboxRuleHandler"
import { ProcessInboxHandler, UnencryptedProcessInboxDatum } from "../../../src/applications/mail-app/mail/model/ProcessInboxHandler"
import { MailboxDetail } from "../../../src/applications/common/mailFunctionality/MailboxModel"
import { LoginController } from "../../../src/applications/common/api/main/LoginController"
import { CryptoFacade } from "../../../src/platform-kit/base/base-crypto/CryptoFacade"
import { MailSetKind, ProcessingState, SpamDecision } from "../../../src/entities/tutanota/Utils"
import {
	Body,
	BodyTypeRef,
	ClientSpamClassifierResultTypeRef,
	Mail,
	MailDetails,
	MailDetailsTypeRef,
	MailSetTypeRef,
	MailTypeRef,
} from "@tutao/entities/tutanota"
import { isSameId } from "../../../src/platform-kit/meta"

import { BucketKeyTypeRef, InstanceSessionKeyTypeRef, TypeInfoTypeRef } from "@tutao/entities/sys"
import { Aes256Key } from "@tutao/crypto/symmetric-cipher-utils"
import { ClientClassifierType } from "../../../src/applications/common/api/common/ClientClassifierType"
import { restError } from "../../../src/platform-kit/rest-client"

const { captor, anything } = matchers

o.spec("ProcessInboxHandlerTest", function () {
	let mailFacade = object<MailFacade>()
	let cryptoFacade = object<CryptoFacade>()
	let logins = object<LoginController>()
	let body: Body
	let mail: Mail
	let spamHandler: SpamClassificationHandler
	let folderSystem: FolderSystem
	let mailboxDetail: MailboxDetail
	let mailDetails: MailDetails
	let inboxRuleHandler: InboxRuleHandler = object<InboxRuleHandler>()
	let processInboxHandler: ProcessInboxHandler

	const inboxFolder = createTestEntity(MailSetTypeRef, { _id: ["listId", "inbox"], folderType: MailSetKind.INBOX })
	const trashFolder = createTestEntity(MailSetTypeRef, { _id: ["listId", "trash"], folderType: MailSetKind.TRASH })
	const spamFolder = createTestEntity(MailSetTypeRef, { _id: ["listId", "spam"], folderType: MailSetKind.SPAM })

	const modelInput = [0, 1]
	const uploadableVectorLegacy = new Uint8Array()
	const uploadableVector = new Uint8Array()

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
			bucketKey: createTestEntity(BucketKeyTypeRef),
		})
		folderSystem = object<FolderSystem>()
		mailboxDetail = object()

		when(folderSystem.getSystemFolderByType(MailSetKind.INBOX)).thenReturn(inboxFolder)
		when(folderSystem.getSystemFolderByType(MailSetKind.SPAM)).thenReturn(spamFolder)
		when(mailFacade.moveMails(anything(), anything(), anything())).thenResolve([])
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
			cryptoFacade,
			() => spamHandler,
			() => inboxRuleHandler,
			new Map(),
			0,
		)
	})

	o.spec("instanceSessionKeys for mail and it's files are updated using the processInboxHandler", function () {
		o("send instanceSessionKeys with processInboxDatum", async function () {
			mail.sets = [inboxFolder._id]

			when(spamHandler.preparePredictSpamForNewMail(mail, mailDetails)).thenResolve({
				modelInput,
				uploadableVectorLegacy,
				uploadableVector,
				skipPredictionReason: SkipClientSpamClassificationReason.None,
			})
			when(spamHandler.predictSpamForNewMail(modelInput, assertNotNull(mail._ownerGroup))).thenResolve(false)
			when(inboxRuleHandler.findMatchingInboxRule(mail, inboxFolder)).thenResolve(null)

			const mailInstanceSessionKeys = [
				createTestEntity(InstanceSessionKeyTypeRef, {
					instanceId: "mailInstanceId",
					instanceList: "mailInstanceList",
					typeInfo: createTestEntity(TypeInfoTypeRef),
					symEncSessionKey: new Uint8Array([1, 2, 3]),
				}),
				createTestEntity(InstanceSessionKeyTypeRef, {
					instanceId: "fileInstanceId",
					instanceList: "fileInstanceList",
					typeInfo: createTestEntity(TypeInfoTypeRef),
					symEncSessionKey: new Uint8Array([4, 5, 6]),
				}),
			]

			when(cryptoFacade.resolveWithBucketKey(mail)).thenResolve({
				instanceSessionKeys: mailInstanceSessionKeys,
				resolvedSessionKeyForInstance: new Aes256Key([0, 2, 3, 4, 2, 1, 2, 3]), // decrypted mailSessionKey
			})

			await processInboxHandler.handleIncomingMail(mail, inboxFolder, mailboxDetail, folderSystem, true)

			const processInboxDatumCaptor = captor()

			await delay(0)
			verify(mailFacade.processNewMails(assertNotNull(mail._ownerGroup), processInboxDatumCaptor.capture()))
			o(assertNotNull(processInboxDatumCaptor.value)[0].ownerEncMailSessionKeys).deepEquals(mailInstanceSessionKeys)
		})

		o("no instanceSessionKeys sent if isLeaderClient == false", async function () {
			mail.sets = [inboxFolder._id]

			when(spamHandler.preparePredictSpamForNewMail(mail, mailDetails)).thenResolve({
				modelInput,
				uploadableVectorLegacy,
				uploadableVector,
				skipPredictionReason: SkipClientSpamClassificationReason.None,
			})
			when(spamHandler.predictSpamForNewMail(modelInput, assertNotNull(mail._ownerGroup))).thenResolve(false)
			when(inboxRuleHandler.findMatchingInboxRule(mail, inboxFolder)).thenResolve(null)

			const mailInstanceSessionKeys = [
				createTestEntity(InstanceSessionKeyTypeRef, {
					instanceId: "mailInstanceId",
					instanceList: "mailInstanceList",
					typeInfo: createTestEntity(TypeInfoTypeRef),
					symEncSessionKey: new Uint8Array([1, 2, 3]),
				}),
				createTestEntity(InstanceSessionKeyTypeRef, {
					instanceId: "fileInstanceId",
					instanceList: "fileInstanceList",
					typeInfo: createTestEntity(TypeInfoTypeRef),
					symEncSessionKey: new Uint8Array([4, 5, 6]),
				}),
			]

			when(cryptoFacade.resolveWithBucketKey(mail)).thenResolve({
				instanceSessionKeys: mailInstanceSessionKeys,
				resolvedSessionKeyForInstance: new Aes256Key([0, 2, 3, 4, 2, 1, 2, 3]), // decrypted mailSessionKey
			})

			await processInboxHandler.handleIncomingMail(mail, inboxFolder, mailboxDetail, folderSystem, false)

			await delay(0)
			verify(mailFacade.processNewMails(anything(), anything()), { times: 0 })
		})
	})

	o("no instanceSessionKeys sent if no bucketKey on mail", async function () {
		mail.sets = [inboxFolder._id]
		// set the bucketKey to null, as it has already been resolved by e.g. another client
		mail.bucketKey = null

		when(spamHandler.preparePredictSpamForNewMail(mail, mailDetails)).thenResolve({
			modelInput,
			uploadableVectorLegacy,
			uploadableVector,
			skipPredictionReason: SkipClientSpamClassificationReason.None,
		})
		when(spamHandler.predictSpamForNewMail(modelInput, assertNotNull(mail._ownerGroup))).thenResolve(false)
		when(inboxRuleHandler.findMatchingInboxRule(mail, inboxFolder)).thenResolve(null)

		await processInboxHandler.handleIncomingMail(mail, inboxFolder, mailboxDetail, folderSystem, true)

		await delay(0)
		const processInboxDatumCaptor = captor()
		verify(mailFacade.processNewMails(assertNotNull(mail._ownerGroup), processInboxDatumCaptor.capture()))
		o.check(assertNotNull(processInboxDatumCaptor.value)[0].ownerEncMailSessionKeys).deepEquals([])
		verify(cryptoFacade.resolveWithBucketKey(mail), { times: 0 })
	})

	o.spec("handleIncomingMail", () => {
		const mailInstanceSessionKeys = [createTestEntity(InstanceSessionKeyTypeRef), createTestEntity(InstanceSessionKeyTypeRef)]

		o.beforeEach(() => {
			when(cryptoFacade.resolveWithBucketKey(mail)).thenResolve({
				instanceSessionKeys: mailInstanceSessionKeys,
				resolvedSessionKeyForInstance: new Aes256Key([0, 2, 3, 4, 2, 1, 2, 3]), // decrypted mailSessionKey
			})
		})
		o.test("do not process mail if it has been processed already", async function () {
			mail.sets = [inboxFolder._id]
			mail.processNeeded = false
			const targetFolder = await processInboxHandler.handleIncomingMail(mail, inboxFolder, mailboxDetail, folderSystem, true)

			o.check(targetFolder).deepEquals(inboxFolder)
			verify(mailFacade.loadMailDetailsBlob(anything()), { times: 0 })
			verify(spamHandler.preparePredictSpamForNewMail(anything(), anything()), { times: 0 })
			verify(spamHandler.predictSpamForNewMail(anything(), anything()), { times: 0 })
			verify(inboxRuleHandler.findMatchingInboxRule(anything(), anything(), anything()), { times: 0 })

			await delay(0)
			verify(mailFacade.processNewMails(anything(), anything()), { times: 0 })
		})

		o.test("when isLeaderClient is false, process mail but do NOT sent result", async function () {
			mail.sets = [inboxFolder._id]
			const matchingInboxRule = object<SomeInboxRule>()

			when(spamHandler.preparePredictSpamForNewMail(mail, mailDetails)).thenResolve({
				modelInput,
				uploadableVectorLegacy,
				uploadableVector,
				skipPredictionReason: SkipClientSpamClassificationReason.None,
			})
			when(spamHandler.predictSpamForNewMail(modelInput, assertNotNull(mail._ownerGroup))).thenResolve(false)
			when(inboxRuleHandler.getMoveResultValue(matchingInboxRule, mailboxDetail)).thenResolve(trashFolder)
			when(inboxRuleHandler.findMatchingInboxRule(mail, inboxFolder)).thenResolve(matchingInboxRule)

			const targetFolder = await processInboxHandler.handleIncomingMail(mail, inboxFolder, mailboxDetail, folderSystem, false)

			o.check(targetFolder).deepEquals(trashFolder)
			verify(spamHandler.predictSpamForNewMail(modelInput, assertNotNull(mail._ownerGroup)), { times: 1 })
			verify(inboxRuleHandler.findMatchingInboxRule(mail, inboxFolder), { times: 1 })

			await delay(0)
			verify(mailFacade.processNewMails(anything(), anything()), { times: 0 })
		})

		o.test("when mail is marked as phishing, skip spam classification and inbox rules", async () => {
			mail.sets = [spamFolder._id]
			mail.serverClassificationData = "1,2"

			when(spamHandler.preparePredictSpamForNewMail(mail, mailDetails)).thenResolve({
				modelInput,
				uploadableVectorLegacy,
				uploadableVector,
				skipPredictionReason: SkipClientSpamClassificationReason.MarkedAsPhishing,
			})

			const targetFolder = await processInboxHandler.handleIncomingMail(mail, spamFolder, mailboxDetail, folderSystem, true)

			o.check(targetFolder).deepEquals(spamFolder)
			verify(spamHandler.predictSpamForNewMail(anything(), anything()), { times: 0 })
			verify(inboxRuleHandler.findMatchingInboxRule(anything(), anything()), { times: 0 })

			const processInboxDatum: UnencryptedProcessInboxDatum = {
				classifierType: null,
				mailId: mail._id,
				targetMoveFolder: spamFolder._id,
				vectorLegacy: uploadableVectorLegacy,
				vectorWithServerClassifiers: uploadableVector,
				ownerEncMailSessionKeys: mailInstanceSessionKeys,
			}

			await delay(0)
			verify(mailFacade.processNewMails(assertNotNull(mail._ownerGroup), [processInboxDatum]), { times: 1 })
		})

		o.test("when mail is classified as SPAM by trusted server classifier, skip spam classification and inbox rules", async () => {
			mail.sets = [spamFolder._id]
			mail.serverClassificationData = "1,2"

			when(spamHandler.preparePredictSpamForNewMail(mail, mailDetails)).thenResolve({
				modelInput,
				uploadableVectorLegacy,
				uploadableVector,
				skipPredictionReason: SkipClientSpamClassificationReason.ClassifiedByTrustedServerClassifier,
			})

			const targetFolder = await processInboxHandler.handleIncomingMail(mail, spamFolder, mailboxDetail, folderSystem, true)

			o.check(targetFolder).deepEquals(spamFolder)
			verify(spamHandler.predictSpamForNewMail(anything(), anything()), { times: 0 })
			verify(inboxRuleHandler.findMatchingInboxRule(anything(), anything()), { times: 0 })

			const processInboxDatum: UnencryptedProcessInboxDatum = {
				classifierType: null,
				mailId: mail._id,
				targetMoveFolder: spamFolder._id,
				vectorLegacy: uploadableVectorLegacy,
				vectorWithServerClassifiers: uploadableVector,
				ownerEncMailSessionKeys: mailInstanceSessionKeys,
			}

			await delay(0)
			verify(mailFacade.processNewMails(assertNotNull(mail._ownerGroup), [processInboxDatum]), { times: 1 })
		})
		o.test("when mail is classified as HAM by trusted server classifier, skip spam classification but apply inbox rules", async () => {
			mail.sets = [inboxFolder._id]
			const matchingInboxRule = object<SomeInboxRule>()
			mail.serverClassificationData = "1,2"

			when(spamHandler.preparePredictSpamForNewMail(mail, mailDetails)).thenResolve({
				modelInput,
				uploadableVectorLegacy,
				uploadableVector,
				skipPredictionReason: SkipClientSpamClassificationReason.ClassifiedByTrustedServerClassifier,
			})
			when(inboxRuleHandler.getMoveResultValue(matchingInboxRule, mailboxDetail)).thenResolve(trashFolder)
			when(inboxRuleHandler.findMatchingInboxRule(mail, inboxFolder)).thenResolve(matchingInboxRule)

			const targetFolder = await processInboxHandler.handleIncomingMail(mail, inboxFolder, mailboxDetail, folderSystem, true)

			o.check(targetFolder).deepEquals(trashFolder)
			verify(spamHandler.predictSpamForNewMail(anything(), anything()), { times: 0 })
			verify(inboxRuleHandler.findMatchingInboxRule(mail, inboxFolder), { times: 1 })

			const processInboxDatum: UnencryptedProcessInboxDatum = {
				classifierType: ClientClassifierType.CUSTOMER_INBOX_RULES,
				mailId: mail._id,
				targetMoveFolder: trashFolder._id,
				vectorLegacy: uploadableVectorLegacy,
				vectorWithServerClassifiers: uploadableVector,
				ownerEncMailSessionKeys: mailInstanceSessionKeys,
			}

			await delay(0)
			verify(mailFacade.processNewMails(assertNotNull(mail._ownerGroup), [processInboxDatum]), { times: 1 })
		})
		o.test("when mail is classified as SPAM by the server, but as HAM by the client, move mail to Inbox", async () => {
			mail.sets = [spamFolder._id]

			when(spamHandler.preparePredictSpamForNewMail(mail, mailDetails)).thenResolve({
				modelInput,
				uploadableVectorLegacy,
				uploadableVector,
				skipPredictionReason: SkipClientSpamClassificationReason.None,
			})
			when(spamHandler.predictSpamForNewMail(modelInput, assertNotNull(mail._ownerGroup))).thenResolve(false)
			when(inboxRuleHandler.findMatchingInboxRule(mail, inboxFolder)).thenResolve(null)

			const targetFolder = await processInboxHandler.handleIncomingMail(mail, spamFolder, mailboxDetail, folderSystem, true)

			o.check(targetFolder).deepEquals(inboxFolder)
			verify(spamHandler.predictSpamForNewMail(modelInput, assertNotNull(mail._ownerGroup)), { times: 1 })
			verify(inboxRuleHandler.findMatchingInboxRule(mail, inboxFolder), { times: 1 })
			verify(inboxRuleHandler.getMoveResultValue(anything(), anything()), { times: 0 })

			const processInboxDatum: UnencryptedProcessInboxDatum = {
				classifierType: ClientClassifierType.CLIENT_CLASSIFICATION,
				mailId: mail._id,
				targetMoveFolder: inboxFolder._id,
				vectorLegacy: uploadableVectorLegacy,
				vectorWithServerClassifiers: uploadableVector,
				ownerEncMailSessionKeys: mailInstanceSessionKeys,
			}

			await delay(0)
			verify(mailFacade.processNewMails(assertNotNull(mail._ownerGroup), [processInboxDatum]), { times: 1 })
		})
		o.test("when mail is classified as SPAM by the server, but as HAM by the client, apply inbox rules", async () => {
			mail.sets = [spamFolder._id]
			const matchingInboxRule = object<SomeInboxRule>()

			when(spamHandler.preparePredictSpamForNewMail(mail, mailDetails)).thenResolve({
				modelInput,
				uploadableVectorLegacy,
				uploadableVector,
				skipPredictionReason: SkipClientSpamClassificationReason.None,
			})
			when(spamHandler.predictSpamForNewMail(modelInput, assertNotNull(mail._ownerGroup))).thenResolve(false)
			when(inboxRuleHandler.getMoveResultValue(matchingInboxRule, mailboxDetail)).thenResolve(trashFolder)
			when(inboxRuleHandler.findMatchingInboxRule(mail, inboxFolder)).thenResolve(matchingInboxRule)

			const targetFolder = await processInboxHandler.handleIncomingMail(mail, spamFolder, mailboxDetail, folderSystem, true)

			o.check(targetFolder).deepEquals(trashFolder)
			verify(spamHandler.predictSpamForNewMail(modelInput, assertNotNull(mail._ownerGroup)), { times: 1 })
			verify(inboxRuleHandler.findMatchingInboxRule(mail, inboxFolder), { times: 1 })
			verify(inboxRuleHandler.getMoveResultValue(matchingInboxRule, mailboxDetail), { times: 1 })

			const processInboxDatum: UnencryptedProcessInboxDatum = {
				classifierType: ClientClassifierType.CUSTOMER_INBOX_RULES,
				mailId: mail._id,
				targetMoveFolder: trashFolder._id,
				vectorLegacy: uploadableVectorLegacy,
				vectorWithServerClassifiers: uploadableVector,
				ownerEncMailSessionKeys: mailInstanceSessionKeys,
			}

			await delay(0)
			verify(mailFacade.processNewMails(assertNotNull(mail._ownerGroup), [processInboxDatum]), { times: 1 })
		})
		o.test("when mail is classified as HAM by the server and client, keep mail in inbox and apply Inbox rules", async () => {
			mail.sets = [inboxFolder._id]
			const matchingInboxRule = object<SomeInboxRule>()

			when(spamHandler.preparePredictSpamForNewMail(mail, mailDetails)).thenResolve({
				modelInput,
				uploadableVectorLegacy,
				uploadableVector,
				skipPredictionReason: SkipClientSpamClassificationReason.None,
			})
			when(spamHandler.predictSpamForNewMail(modelInput, assertNotNull(mail._ownerGroup))).thenResolve(false)
			when(inboxRuleHandler.getMoveResultValue(matchingInboxRule, mailboxDetail)).thenResolve(trashFolder)
			when(inboxRuleHandler.findMatchingInboxRule(mail, inboxFolder)).thenResolve(matchingInboxRule)

			const targetFolder = await processInboxHandler.handleIncomingMail(mail, inboxFolder, mailboxDetail, folderSystem, true)

			o.check(targetFolder).deepEquals(trashFolder)
			verify(spamHandler.predictSpamForNewMail(modelInput, assertNotNull(mail._ownerGroup)), { times: 1 })
			verify(inboxRuleHandler.findMatchingInboxRule(mail, inboxFolder), { times: 1 })
			verify(inboxRuleHandler.getMoveResultValue(matchingInboxRule, mailboxDetail), { times: 1 })

			const processInboxDatum: UnencryptedProcessInboxDatum = {
				classifierType: ClientClassifierType.CUSTOMER_INBOX_RULES,
				mailId: mail._id,
				targetMoveFolder: trashFolder._id,
				vectorLegacy: uploadableVectorLegacy,
				vectorWithServerClassifiers: uploadableVector,
				ownerEncMailSessionKeys: mailInstanceSessionKeys,
			}

			await delay(0)
			verify(mailFacade.processNewMails(assertNotNull(mail._ownerGroup), [processInboxDatum]), { times: 1 })
		})
		o.spec("when mail is classified as HAM by the server, but as SPAM by the client, move mail to Spam and apply inbox rules", () => {
			o.test("when the inbox rule moves to Spam, keep mail in Spam and apply other result actions", async () => {})
			o.test("when the inbox rule moves to a folder and doesn't have an ExcludeSpam result, don't apply inbox rule", async () => {})
			o.test("when the inbox rule doesn't have a Move result nor an ExcludeSpam result, don't apply inbox rule", async () => {})
			o.test("when the inbox rule moves to a folder and has an ExcludeSpam result, apply inbox rule", async () => {})
			o.test("when the inbox rule doesn't have a Move result but has an ExcludeSpam result, apply inbox rule", async () => {})
		})

		o("retry in case of locked error", async function () {
			let throwError = true
			when(inboxRuleHandler.findMatchingInboxRule(mail, inboxFolder)).thenResolve(null)
			when(spamHandler.preparePredictSpamForNewMail(mail, mailDetails)).thenResolve({
				modelInput,
				uploadableVectorLegacy,
				uploadableVector,
				skipPredictionReason: SkipClientSpamClassificationReason.None,
			})
			when(spamHandler.predictSpamForNewMail(modelInput, assertNotNull(mail._ownerGroup))).thenResolve(false)

			const processInboxDatum: UnencryptedProcessInboxDatum = {
				classifierType: ClientClassifierType.CLIENT_CLASSIFICATION,
				mailId: mail._id,
				targetMoveFolder: inboxFolder._id,
				vectorLegacy: uploadableVectorLegacy,
				vectorWithServerClassifiers: uploadableVector,
				ownerEncMailSessionKeys: mailInstanceSessionKeys,
			}
			when(mailFacade.processNewMails(assertNotNull(mail._ownerGroup), [processInboxDatum])).thenDo(() => {
				if (throwError) {
					return Promise.reject(new restError.LockedError("test lock"))
				} else {
					return undefined
				}
			})

			const targetFolder = await processInboxHandler.handleIncomingMail(mail, inboxFolder, mailboxDetail, folderSystem, true)

			o.check(targetFolder).deepEquals(inboxFolder)
			await delay(0)
			throwError = false
			await delay(0)
			verify(mailFacade.processNewMails(assertNotNull(mail._ownerGroup), [processInboxDatum]), { times: 2 })
		})
	})

	o.spec("getInboxRuleMoveTarget", () => {
		o("does nothing if mail needs processing", async function () {
			mail.sets = [inboxFolder._id]
			mail.processNeeded = true
			when(inboxRuleHandler.findMatchingInboxRule(mail, inboxFolder, true)).thenResolve(null)
			const targetFolder = await processInboxHandler.getInboxRuleMoveTarget(mail, inboxFolder, mailboxDetail)

			o.check(targetFolder).deepEquals(inboxFolder)
			verify(inboxRuleHandler.findMatchingInboxRule(anything(), anything(), anything()), { times: 0 })
			verify(inboxRuleHandler.getMoveResultValue(anything(), anything()), { times: 0 })
		})

		o("when there's a matching rule with a MOVE result, return the rule's move target", async function () {
			mail.sets = [inboxFolder._id]
			mail.processNeeded = false

			const matchingRule = object<SomeInboxRule>()
			when(inboxRuleHandler.getMoveResultValue(matchingRule, mailboxDetail)).thenResolve(trashFolder)
			when(inboxRuleHandler.findMatchingInboxRule(mail, inboxFolder, true)).thenResolve(matchingRule)

			const targetFolder = await processInboxHandler.getInboxRuleMoveTarget(mail, inboxFolder, mailboxDetail)

			verify(inboxRuleHandler.findMatchingInboxRule(mail, inboxFolder, true), { times: 1 })
			verify(inboxRuleHandler.getMoveResultValue(matchingRule, mailboxDetail), { times: 1 })
			o.check(targetFolder).deepEquals(trashFolder)
		})

		o("when there's a matching rule without a MOVE result, return the source folder", async function () {
			mail.sets = [inboxFolder._id]
			mail.processNeeded = false

			const matchingRule = object<SomeInboxRule>()
			when(inboxRuleHandler.getMoveResultValue(matchingRule, mailboxDetail)).thenResolve(null)
			when(inboxRuleHandler.findMatchingInboxRule(mail, inboxFolder, true)).thenResolve(matchingRule)

			const targetFolder = await processInboxHandler.getInboxRuleMoveTarget(mail, inboxFolder, mailboxDetail)

			verify(inboxRuleHandler.findMatchingInboxRule(mail, inboxFolder, true), { times: 1 })
			verify(inboxRuleHandler.getMoveResultValue(matchingRule, mailboxDetail), { times: 1 })
			o.check(targetFolder).deepEquals(inboxFolder)
		})

		o("when there's no matching rule, return the source folder", async function () {
			mail.sets = [inboxFolder._id]
			mail.processNeeded = false

			when(inboxRuleHandler.findMatchingInboxRule(mail, inboxFolder, true)).thenResolve(null)

			const targetFolder = await processInboxHandler.getInboxRuleMoveTarget(mail, inboxFolder, mailboxDetail)

			verify(inboxRuleHandler.findMatchingInboxRule(mail, inboxFolder, true), { times: 1 })
			verify(inboxRuleHandler.getMoveResultValue(anything(), anything()), { times: 0 })
			o.check(targetFolder).deepEquals(inboxFolder)
		})
	})
})
