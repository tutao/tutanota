import o from "@tutao/otest"
import { matchers, object, verify, when } from "testdouble"
import {
	Body,
	BodyTypeRef,
	ClientSpamClassifierResultTypeRef,
	Mail,
	MailDetails,
	MailDetailsTypeRef,
	MailSetTypeRef,
	MailTypeRef,
} from "../../../src/common/api/entities/tutanota/TypeRefs"
import { FeatureType, MailSetKind, ProcessingState, SpamDecision } from "../../../src/common/api/common/TutanotaConstants"
import { ClientClassifierType } from "../../../src/common/api/common/ClientClassifierType"
import { assertNotNull, delay } from "@tutao/tutanota-utils"
import { MailFacade } from "../../../src/common/api/worker/facades/lazy/MailFacade"
import { createTestEntity } from "../TestUtils"
import { SpamClassificationHandler } from "../../../src/mail-app/mail/model/SpamClassificationHandler"
import { FolderSystem } from "../../../src/common/api/common/mail/FolderSystem"
import { isSameId } from "../../../src/common/api/common/utils/EntityUtils"
import { InboxRuleHandler } from "../../../src/mail-app/mail/model/InboxRuleHandler"
import { ProcessInboxHandler, UnencryptedProcessInboxDatum } from "../../../src/mail-app/mail/model/ProcessInboxHandler"
import { MailboxDetail } from "../../../src/common/mailFunctionality/MailboxModel"
import { LoginController } from "../../../src/common/api/main/LoginController"
import { CryptoFacade } from "../../../src/common/api/worker/crypto/CryptoFacade"
import { BucketKeyTypeRef, InstanceSessionKeyTypeRef, TypeInfoTypeRef } from "../../../src/common/api/entities/sys/TypeRefs"
import { LockedError } from "../../../src/common/api/common/error/RestError"

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
		when(logins.isEnabled(FeatureType.SpamClientClassification)).thenReturn(true)
	})

	o.spec("instanceSessionKeys for mail and it's files are updated using the processInboxHandler", function () {
		o("send instanceSessionKeys with processInboxDatum", async function () {
			mail.sets = [inboxFolder._id]
			const processInboxDatum: UnencryptedProcessInboxDatum = {
				classifierType: ClientClassifierType.CUSTOMER_INBOX_RULES,
				mailId: mail._id,
				targetMoveFolder: trashFolder._id,
				vector: new Uint8Array(),
				ownerEncMailSessionKeys: [],
			}
			when(spamHandler.predictSpamForNewMail(mail, mailDetails, inboxFolder, folderSystem)).thenResolve({
				targetFolder: inboxFolder,
				processInboxDatum: processInboxDatum,
			})
			when(inboxRuleHandler.findAndApplyRulesNotExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder)).thenResolve(null)
			when(inboxRuleHandler.findAndApplyRulesExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder)).thenResolve(null)

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
				resolvedSessionKeyForInstance: [0, 2, 3, 4, 2, 1, 2, 3], // decrypted mailSessionKey
			})

			const _ = await processInboxHandler.handleIncomingMail(mail, inboxFolder, mailboxDetail, folderSystem, true)

			const processInboxDatumCaptor = captor()
			await delay(0)
			verify(mailFacade.processNewMails(assertNotNull(mail._ownerGroup), processInboxDatumCaptor.capture()))
			o(assertNotNull(processInboxDatumCaptor.value)[0].ownerEncMailSessionKeys).deepEquals(mailInstanceSessionKeys)
		})

		o("no instanceSessionKeys sent if isLeaderClient == false", async function () {
			mail.sets = [inboxFolder._id]
			const processInboxDatum: UnencryptedProcessInboxDatum = {
				classifierType: ClientClassifierType.CUSTOMER_INBOX_RULES,
				mailId: mail._id,
				targetMoveFolder: trashFolder._id,
				vector: new Uint8Array(),
				ownerEncMailSessionKeys: [],
			}
			when(spamHandler.predictSpamForNewMail(mail, mailDetails, inboxFolder, folderSystem)).thenResolve({
				targetFolder: inboxFolder,
				processInboxDatum: processInboxDatum,
			})
			when(inboxRuleHandler.findAndApplyRulesNotExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder)).thenResolve(null)
			when(inboxRuleHandler.findAndApplyRulesExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder)).thenResolve(null)

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
				resolvedSessionKeyForInstance: [0, 2, 3, 4, 2, 1, 2, 3], // decrypted mailSessionKey
			})

			const _ = await processInboxHandler.handleIncomingMail(mail, inboxFolder, mailboxDetail, folderSystem, false)

			await delay(0)
			verify(mailFacade.processNewMails(anything(), anything()), { times: 0 })
		})
	})

	o("no instanceSessionKeys sent if no bucketKey on mail", async function () {
		mail.sets = [inboxFolder._id]
		// set the bucketKey to null, as it has already been resolved by e.g. another client
		mail.bucketKey = null

		const processInboxDatum: UnencryptedProcessInboxDatum = {
			classifierType: ClientClassifierType.CUSTOMER_INBOX_RULES,
			mailId: mail._id,
			targetMoveFolder: trashFolder._id,
			vector: new Uint8Array(),
			ownerEncMailSessionKeys: [],
		}
		when(spamHandler.predictSpamForNewMail(mail, mailDetails, inboxFolder, folderSystem)).thenResolve({
			targetFolder: inboxFolder,
			processInboxDatum: processInboxDatum,
		})
		when(inboxRuleHandler.findAndApplyRulesNotExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder)).thenResolve(null)
		when(inboxRuleHandler.findAndApplyRulesExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder)).thenResolve(null)

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

		const _ = await processInboxHandler.handleIncomingMail(mail, inboxFolder, mailboxDetail, folderSystem, true)

		await delay(0)
		const processInboxDatumCaptor = captor()
		await delay(0)
		verify(mailFacade.processNewMails(assertNotNull(mail._ownerGroup), processInboxDatumCaptor.capture()))
		o(assertNotNull(processInboxDatumCaptor.value)[0].ownerEncMailSessionKeys).deepEquals([])
		verify(cryptoFacade.resolveWithBucketKey(mail), { times: 0 })
	})

	o("handleIncomingMail does move mail if it has been processed already", async function () {
		mail.sets = [inboxFolder._id]
		mail.processNeeded = false
		verify(inboxRuleHandler.findAndApplyRulesExcludedFromSpamFilter(anything(), anything(), anything()), { times: 0 })
		verify(inboxRuleHandler.findAndApplyRulesNotExcludedFromSpamFilter(anything(), anything(), anything()), { times: 0 })
		verify(spamHandler.predictSpamForNewMail(anything(), anything(), anything(), anything()), { times: 0 })
		const targetFolder = await processInboxHandler.handleIncomingMail(mail, inboxFolder, mailboxDetail, folderSystem, true)
		o(targetFolder).deepEquals(inboxFolder)
		verify(mailFacade.processNewMails(anything(), anything()), { times: 0 })
	})

	o("handleIncomingMail does NOT send move mail when called with sendServerRequest == false", async function () {
		mail.sets = [inboxFolder._id]
		const processInboxDatum: UnencryptedProcessInboxDatum = {
			classifierType: ClientClassifierType.CUSTOMER_INBOX_RULES,
			mailId: mail._id,
			targetMoveFolder: trashFolder._id,
			vector: new Uint8Array(),
			ownerEncMailSessionKeys: [],
		}
		when(spamHandler.predictSpamForNewMail(mail, mailDetails, inboxFolder, folderSystem)).thenResolve({
			targetFolder: inboxFolder,
			processInboxDatum: processInboxDatum,
		})
		when(inboxRuleHandler.findAndApplyRulesExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder)).thenResolve(null)
		when(inboxRuleHandler.findAndApplyRulesNotExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder)).thenResolve({
			targetFolder: trashFolder,
			processInboxDatum: processInboxDatum,
		})

		const mailInstanceSessionKeys = [createTestEntity(InstanceSessionKeyTypeRef), createTestEntity(InstanceSessionKeyTypeRef)]
		when(cryptoFacade.resolveWithBucketKey(mail)).thenResolve({
			instanceSessionKeys: mailInstanceSessionKeys,
			resolvedSessionKeyForInstance: [0, 2, 3, 4, 2, 1, 2, 3], // decrypted mailSessionKey
		})

		const targetFolder = await processInboxHandler.handleIncomingMail(mail, inboxFolder, mailboxDetail, folderSystem, false)

		verify(spamHandler.predictSpamForNewMail(anything(), anything(), anything(), anything()), { times: 1 })
		verify(inboxRuleHandler.findAndApplyRulesNotExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder), { times: 1 })
		o(targetFolder).deepEquals(trashFolder)
		await delay(0)

		verify(mailFacade.processNewMails(anything(), anything()), { times: 0 })
	})

	o("handleIncomingMail does move mail from inbox to other folder if inbox rules excluded from spam filter applies", async function () {
		mail.sets = [inboxFolder._id]
		const processInboxDatum: UnencryptedProcessInboxDatum = {
			classifierType: ClientClassifierType.CUSTOMER_INBOX_RULES,
			mailId: mail._id,
			targetMoveFolder: trashFolder._id,
			vector: new Uint8Array(),
			ownerEncMailSessionKeys: [],
		}
		when(spamHandler.predictSpamForNewMail(mail, mailDetails, inboxFolder, folderSystem)).thenResolve({
			targetFolder: inboxFolder,
			processInboxDatum: processInboxDatum,
		})
		when(inboxRuleHandler.findAndApplyRulesExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder)).thenResolve({
			targetFolder: trashFolder,
			processInboxDatum: processInboxDatum,
		})
		when(inboxRuleHandler.findAndApplyRulesNotExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder)).thenResolve(null)

		const mailInstanceSessionKeys = [createTestEntity(InstanceSessionKeyTypeRef), createTestEntity(InstanceSessionKeyTypeRef)]
		when(cryptoFacade.resolveWithBucketKey(mail)).thenResolve({
			instanceSessionKeys: mailInstanceSessionKeys,
			resolvedSessionKeyForInstance: [0, 2, 3, 4, 2, 1, 2, 3], // decrypted mailSessionKey
		})

		const targetFolder = await processInboxHandler.handleIncomingMail(mail, inboxFolder, mailboxDetail, folderSystem, true)

		verify(spamHandler.predictSpamForNewMail(anything(), anything(), anything(), anything()), { times: 0 })
		//It checks rules that are excluded from spam classifier and then the rest.
		verify(inboxRuleHandler.findAndApplyRulesExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder), { times: 1 })
		verify(inboxRuleHandler.findAndApplyRulesNotExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder), { times: 0 })
		o(targetFolder).deepEquals(trashFolder)
		await delay(0)

		const expectedProcessInboxDatum: UnencryptedProcessInboxDatum = {
			classifierType: ClientClassifierType.CUSTOMER_INBOX_RULES,
			mailId: mail._id,
			targetMoveFolder: trashFolder._id,
			vector: new Uint8Array(),
			ownerEncMailSessionKeys: mailInstanceSessionKeys,
		}

		verify(mailFacade.processNewMails(assertNotNull(mail._ownerGroup), [expectedProcessInboxDatum]))
	})

	o("handleIncomingMail does move mail from inbox to other folder if inbox rules not excluded from spam filter applies", async function () {
		mail.sets = [inboxFolder._id]
		const processInboxDatum: UnencryptedProcessInboxDatum = {
			classifierType: ClientClassifierType.CUSTOMER_INBOX_RULES,
			mailId: mail._id,
			targetMoveFolder: trashFolder._id,
			vector: new Uint8Array(),
			ownerEncMailSessionKeys: [],
		}
		when(spamHandler.predictSpamForNewMail(mail, mailDetails, inboxFolder, folderSystem)).thenResolve({
			targetFolder: inboxFolder,
			processInboxDatum,
		})
		when(inboxRuleHandler.findAndApplyRulesExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder)).thenResolve(null)
		when(inboxRuleHandler.findAndApplyRulesNotExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder)).thenResolve({
			targetFolder: trashFolder,
			processInboxDatum,
		})

		const mailInstanceSessionKeys = [createTestEntity(InstanceSessionKeyTypeRef), createTestEntity(InstanceSessionKeyTypeRef)]
		when(cryptoFacade.resolveWithBucketKey(mail)).thenResolve({
			instanceSessionKeys: mailInstanceSessionKeys,
			resolvedSessionKeyForInstance: [0, 2, 3, 4, 2, 1, 2, 3], // decrypted mailSessionKey
		})

		const targetFolder = await processInboxHandler.handleIncomingMail(mail, inboxFolder, mailboxDetail, folderSystem, true)

		verify(spamHandler.predictSpamForNewMail(anything(), anything(), anything(), anything()), { times: 1 })
		//It checks rules that are excluded from spam classifier and then the rest.
		verify(inboxRuleHandler.findAndApplyRulesExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder), { times: 1 })
		verify(inboxRuleHandler.findAndApplyRulesNotExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder), { times: 1 })
		o(targetFolder).deepEquals(trashFolder)
		await delay(0)

		const expectedProcessInboxDatum: UnencryptedProcessInboxDatum = {
			classifierType: ClientClassifierType.CUSTOMER_INBOX_RULES,
			mailId: mail._id,
			targetMoveFolder: trashFolder._id,
			vector: new Uint8Array(),
			ownerEncMailSessionKeys: mailInstanceSessionKeys,
		}

		verify(mailFacade.processNewMails(assertNotNull(mail._ownerGroup), [expectedProcessInboxDatum]))
	})

	o("handleIncomingMail applies only inbox rules excluded from spam filter if spam classifier classified mail as spam", async function () {
		mail.sets = [inboxFolder._id]
		const processInboxDatum: UnencryptedProcessInboxDatum = {
			classifierType: ClientClassifierType.CUSTOMER_INBOX_RULES,
			mailId: mail._id,
			targetMoveFolder: trashFolder._id,
			vector: new Uint8Array(),
			ownerEncMailSessionKeys: [],
		}
		when(spamHandler.predictSpamForNewMail(mail, mailDetails, inboxFolder, folderSystem)).thenResolve({
			targetFolder: spamFolder,
			processInboxDatum,
		})
		when(inboxRuleHandler.findAndApplyRulesExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder)).thenResolve(null)
		when(inboxRuleHandler.findAndApplyRulesNotExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder)).thenResolve({
			targetFolder: trashFolder,
			processInboxDatum,
		})

		const mailInstanceSessionKeys = [createTestEntity(InstanceSessionKeyTypeRef), createTestEntity(InstanceSessionKeyTypeRef)]
		when(cryptoFacade.resolveWithBucketKey(mail)).thenResolve({
			instanceSessionKeys: mailInstanceSessionKeys,
			resolvedSessionKeyForInstance: [0, 2, 3, 4, 2, 1, 2, 3], // decrypted mailSessionKey
		})

		const targetFolder = await processInboxHandler.handleIncomingMail(mail, inboxFolder, mailboxDetail, folderSystem, true)

		verify(spamHandler.predictSpamForNewMail(anything(), anything(), anything(), anything()), { times: 1 })
		verify(inboxRuleHandler.findAndApplyRulesNotExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder), { times: 0 })
		verify(inboxRuleHandler.findAndApplyRulesExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder), { times: 1 })
		o(targetFolder).deepEquals(spamFolder)
		await delay(0)

		const expectedProcessInboxDatum: UnencryptedProcessInboxDatum = {
			classifierType: ClientClassifierType.CUSTOMER_INBOX_RULES,
			mailId: mail._id,
			targetMoveFolder: trashFolder._id,
			vector: new Uint8Array(),
			ownerEncMailSessionKeys: mailInstanceSessionKeys,
		}

		verify(mailFacade.processNewMails(assertNotNull(mail._ownerGroup), [expectedProcessInboxDatum]))
	})

	o("processInboxRulesOnly does nothing if mail needs processing", async function () {
		mail.sets = [inboxFolder._id]
		mail.processNeeded = true
		when(inboxRuleHandler.findAndApplyRulesExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder, true)).thenResolve(null)
		when(inboxRuleHandler.findAndApplyRulesNotExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder, true)).thenResolve(null)
		const targetFolder = await processInboxHandler.processInboxRulesOnly(mail, inboxFolder, mailboxDetail)

		o(targetFolder).deepEquals(inboxFolder)
		verify(spamHandler.predictSpamForNewMail(anything(), anything(), anything(), anything()), { times: 0 })
		verify(inboxRuleHandler.findAndApplyRulesNotExcludedFromSpamFilter(anything(), anything(), anything(), anything()), { times: 0 })
		verify(inboxRuleHandler.findAndApplyRulesExcludedFromSpamFilter(anything(), anything(), anything(), anything()), { times: 0 })
	})

	o("processInboxRulesOnly applies only inbox rules, does not interact with classifier", async function () {
		mail.sets = [inboxFolder._id]
		mail.processNeeded = false
		when(inboxRuleHandler.findAndApplyRulesExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder, true)).thenResolve(null)
		when(inboxRuleHandler.findAndApplyRulesNotExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder, true)).thenResolve({
			targetFolder: trashFolder,
		})
		const targetFolder = await processInboxHandler.processInboxRulesOnly(mail, inboxFolder, mailboxDetail)

		verify(spamHandler.predictSpamForNewMail(anything(), anything(), anything(), anything()), { times: 0 })
		verify(inboxRuleHandler.findAndApplyRulesNotExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder, true), { times: 1 })
		verify(inboxRuleHandler.findAndApplyRulesExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder, true), { times: 1 })
		verify(inboxRuleHandler.findAndApplyRulesNotExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder, false), { times: 0 })
		verify(inboxRuleHandler.findAndApplyRulesExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder, false), { times: 0 })
		o(targetFolder).deepEquals(trashFolder)
	})

	o("processInboxRulesOnly applies rules excluded from spamFilter, does not interact with classifier", async function () {
		mail.sets = [inboxFolder._id]
		mail.processNeeded = false
		when(inboxRuleHandler.findAndApplyRulesExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder, true)).thenResolve({
			targetFolder: trashFolder,
		})
		when(inboxRuleHandler.findAndApplyRulesNotExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder, true)).thenResolve(null)
		const targetFolder = await processInboxHandler.processInboxRulesOnly(mail, inboxFolder, mailboxDetail)

		verify(spamHandler.predictSpamForNewMail(anything(), anything(), anything(), anything()), { times: 0 })
		verify(inboxRuleHandler.findAndApplyRulesNotExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder, true), { times: 0 })
		verify(inboxRuleHandler.findAndApplyRulesExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder, true), { times: 1 })
		verify(inboxRuleHandler.findAndApplyRulesNotExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder, false), { times: 0 })
		verify(inboxRuleHandler.findAndApplyRulesExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder, false), { times: 0 })
		o(targetFolder).deepEquals(trashFolder)
	})

	o("processInboxRulesOnly returns inbox if no rule matches", async function () {
		mail.sets = [inboxFolder._id]
		mail.processNeeded = false
		when(inboxRuleHandler.findAndApplyRulesExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder, true)).thenResolve(null)
		when(inboxRuleHandler.findAndApplyRulesNotExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder, true)).thenResolve(null)
		const targetFolder = await processInboxHandler.processInboxRulesOnly(mail, inboxFolder, mailboxDetail)

		verify(spamHandler.predictSpamForNewMail(anything(), anything(), anything(), anything()), { times: 0 })
		verify(inboxRuleHandler.findAndApplyRulesNotExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder, true), { times: 1 })
		verify(inboxRuleHandler.findAndApplyRulesExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder, true), { times: 1 })
		verify(inboxRuleHandler.findAndApplyRulesNotExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder, false), { times: 0 })
		verify(inboxRuleHandler.findAndApplyRulesExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder, false), { times: 0 })

		o(targetFolder).deepEquals(inboxFolder)
	})

	o("handleIncomingMail does move mail from inbox to spam folder if mail is spam", async function () {
		mail.sets = [inboxFolder._id]
		when(inboxRuleHandler.findAndApplyRulesNotExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder)).thenResolve(null)
		when(inboxRuleHandler.findAndApplyRulesExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder)).thenResolve(null)
		const processInboxDatum: UnencryptedProcessInboxDatum = {
			classifierType: ClientClassifierType.CLIENT_CLASSIFICATION,
			mailId: mail._id,
			targetMoveFolder: spamFolder._id,
			vector: new Uint8Array(),
			ownerEncMailSessionKeys: [],
		}
		when(spamHandler.predictSpamForNewMail(mail, mailDetails, inboxFolder, folderSystem)).thenResolve({
			targetFolder: spamFolder,
			processInboxDatum,
		})

		const mailInstanceSessionKeys = [createTestEntity(InstanceSessionKeyTypeRef), createTestEntity(InstanceSessionKeyTypeRef)]
		when(cryptoFacade.resolveWithBucketKey(mail)).thenResolve({
			instanceSessionKeys: mailInstanceSessionKeys,
			resolvedSessionKeyForInstance: [0, 2, 3, 4, 2, 1, 2, 3], // decrypted mailSessionKey
		})

		const targetFolder = await processInboxHandler.handleIncomingMail(mail, inboxFolder, mailboxDetail, folderSystem, true)
		o(targetFolder).deepEquals(spamFolder)
		await delay(0)

		const expectedProcessInboxDatum: UnencryptedProcessInboxDatum = {
			classifierType: ClientClassifierType.CLIENT_CLASSIFICATION,
			mailId: mail._id,
			targetMoveFolder: spamFolder._id,
			vector: new Uint8Array(),
			ownerEncMailSessionKeys: mailInstanceSessionKeys,
		}

		verify(mailFacade.processNewMails(assertNotNull(mail._ownerGroup), [expectedProcessInboxDatum]))
	})

	o("handleIncomingMail does NOT move mail from inbox to spam folder if mail is ham", async function () {
		mail.sets = [inboxFolder._id]
		when(inboxRuleHandler.findAndApplyRulesNotExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder)).thenResolve(null)
		when(inboxRuleHandler.findAndApplyRulesExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder)).thenResolve(null)
		const processInboxDatum: UnencryptedProcessInboxDatum = {
			classifierType: null,
			mailId: mail._id,
			targetMoveFolder: inboxFolder._id,
			vector: new Uint8Array(),
			ownerEncMailSessionKeys: [],
		}

		when(spamHandler.predictSpamForNewMail(mail, mailDetails, inboxFolder, folderSystem)).thenResolve({
			targetFolder: inboxFolder,
			processInboxDatum,
		})

		const mailInstanceSessionKeys = [createTestEntity(InstanceSessionKeyTypeRef), createTestEntity(InstanceSessionKeyTypeRef)]
		when(cryptoFacade.resolveWithBucketKey(mail)).thenResolve({
			instanceSessionKeys: mailInstanceSessionKeys,
			resolvedSessionKeyForInstance: [0, 2, 3, 4, 2, 1, 2, 3], // decrypted mailSessionKey
		})

		const targetFolder = await processInboxHandler.handleIncomingMail(mail, inboxFolder, mailboxDetail, folderSystem, true)
		o(targetFolder).deepEquals(inboxFolder)
		await delay(0)

		const expectedProcessInboxDatum: UnencryptedProcessInboxDatum = {
			classifierType: null,
			mailId: mail._id,
			targetMoveFolder: inboxFolder._id,
			vector: new Uint8Array(),
			ownerEncMailSessionKeys: mailInstanceSessionKeys,
		}

		verify(mailFacade.processNewMails(assertNotNull(mail._ownerGroup), [expectedProcessInboxDatum]))
	})

	o("handleIncomingMail does NOT move mail from spam to inbox folder if mail is spam", async function () {
		mail.sets = [spamFolder._id]
		when(inboxRuleHandler.findAndApplyRulesNotExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder)).thenResolve(null)
		when(inboxRuleHandler.findAndApplyRulesExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder)).thenResolve(null)
		const processInboxDatum: UnencryptedProcessInboxDatum = {
			classifierType: ClientClassifierType.CLIENT_CLASSIFICATION,
			mailId: mail._id,
			targetMoveFolder: spamFolder._id,
			vector: new Uint8Array(),
			ownerEncMailSessionKeys: [],
		}
		when(spamHandler.predictSpamForNewMail(mail, mailDetails, inboxFolder, folderSystem)).thenResolve({
			targetFolder: spamFolder,
			processInboxDatum,
		})

		const mailInstanceSessionKeys = [createTestEntity(InstanceSessionKeyTypeRef), createTestEntity(InstanceSessionKeyTypeRef)]
		when(cryptoFacade.resolveWithBucketKey(mail)).thenResolve({
			instanceSessionKeys: mailInstanceSessionKeys,
			resolvedSessionKeyForInstance: [0, 2, 3, 4, 2, 1, 2, 3], // decrypted mailSessionKey
		})

		const targetFolder = await processInboxHandler.handleIncomingMail(mail, inboxFolder, mailboxDetail, folderSystem, true)
		o(targetFolder).deepEquals(spamFolder)
		await delay(0)

		const expectedProcessInboxDatum: UnencryptedProcessInboxDatum = {
			classifierType: ClientClassifierType.CLIENT_CLASSIFICATION,
			mailId: mail._id,
			targetMoveFolder: spamFolder._id,
			vector: new Uint8Array(),
			ownerEncMailSessionKeys: mailInstanceSessionKeys,
		}

		verify(mailFacade.processNewMails(assertNotNull(mail._ownerGroup), [expectedProcessInboxDatum]))
	})

	o("handleIncomingMail moves mail from spam to inbox folder if mail is ham", async function () {
		mail.sets = [spamFolder._id]
		when(inboxRuleHandler.findAndApplyRulesNotExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder)).thenResolve(null)
		when(inboxRuleHandler.findAndApplyRulesExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder)).thenResolve(null)
		const processInboxDatum: UnencryptedProcessInboxDatum = {
			classifierType: ClientClassifierType.CLIENT_CLASSIFICATION,
			mailId: mail._id,
			targetMoveFolder: inboxFolder._id,
			vector: new Uint8Array(),
			ownerEncMailSessionKeys: [],
		}
		when(spamHandler.predictSpamForNewMail(mail, mailDetails, inboxFolder, folderSystem)).thenResolve({
			targetFolder: inboxFolder,
			processInboxDatum,
		})

		const mailInstanceSessionKeys = [createTestEntity(InstanceSessionKeyTypeRef), createTestEntity(InstanceSessionKeyTypeRef)]
		when(cryptoFacade.resolveWithBucketKey(mail)).thenResolve({
			instanceSessionKeys: mailInstanceSessionKeys,
			resolvedSessionKeyForInstance: [0, 2, 3, 4, 2, 1, 2, 3], // decrypted mailSessionKey
		})

		const targetFolder = await processInboxHandler.handleIncomingMail(mail, inboxFolder, mailboxDetail, folderSystem, true)
		o(targetFolder).deepEquals(inboxFolder)
		await delay(0)

		const expectedProcessInboxDatum: UnencryptedProcessInboxDatum = {
			classifierType: ClientClassifierType.CLIENT_CLASSIFICATION,
			mailId: mail._id,
			targetMoveFolder: inboxFolder._id,
			vector: new Uint8Array(),
			ownerEncMailSessionKeys: mailInstanceSessionKeys,
		}

		verify(mailFacade.processNewMails(assertNotNull(mail._ownerGroup), [expectedProcessInboxDatum]))
	})

	o("handleIncomingMail does NOT move mail from inbox to spam folder if spam classification is disabled", async function () {
		when(logins.isEnabled(FeatureType.SpamClientClassification)).thenReturn(false)

		mail.sets = [inboxFolder._id]
		const compressedVector = new Uint8Array([2, 4, 8, 16])

		when(mailFacade.createModelInputAndUploadVector(anything(), mail, mailDetails, inboxFolder)).thenResolve({
			modelInput: [],
			vectorToUpload: compressedVector,
		})
		processInboxHandler = new ProcessInboxHandler(
			logins,
			mailFacade,
			cryptoFacade,
			() => spamHandler,
			() => inboxRuleHandler,
			new Map(),
			0,
		)
		when(inboxRuleHandler.findAndApplyRulesNotExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder)).thenResolve(null)
		when(inboxRuleHandler.findAndApplyRulesExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder)).thenResolve(null)
		verify(spamHandler.predictSpamForNewMail(anything(), anything(), anything(), anything()), { times: 0 })

		const mailInstanceSessionKeys = [createTestEntity(InstanceSessionKeyTypeRef), createTestEntity(InstanceSessionKeyTypeRef)]
		when(cryptoFacade.resolveWithBucketKey(mail)).thenResolve({
			instanceSessionKeys: mailInstanceSessionKeys,
			resolvedSessionKeyForInstance: [0, 2, 3, 4, 2, 1, 2, 3], // decrypted mailSessionKey
		})

		const targetFolder = await processInboxHandler.handleIncomingMail(mail, inboxFolder, mailboxDetail, folderSystem, true)
		o(targetFolder).deepEquals(inboxFolder)
		await delay(0)

		const expectedProcessInboxDatum: UnencryptedProcessInboxDatum = {
			classifierType: null,
			mailId: mail._id,
			targetMoveFolder: inboxFolder._id,
			vector: compressedVector,
			ownerEncMailSessionKeys: mailInstanceSessionKeys,
		}

		verify(mailFacade.processNewMails(assertNotNull(mail._ownerGroup), [expectedProcessInboxDatum]))
	})

	o("handleIncomingMail retries in case of locked error.", async function () {
		let throwError = true
		when(inboxRuleHandler.findAndApplyRulesNotExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder)).thenResolve(null)
		when(inboxRuleHandler.findAndApplyRulesExcludedFromSpamFilter(mailboxDetail, mail, inboxFolder)).thenResolve(null)
		const processInboxDatum: UnencryptedProcessInboxDatum = {
			classifierType: ClientClassifierType.CLIENT_CLASSIFICATION,
			mailId: mail._id,
			targetMoveFolder: inboxFolder._id,
			vector: new Uint8Array(),
			ownerEncMailSessionKeys: [],
		}

		when(spamHandler.predictSpamForNewMail(mail, mailDetails, inboxFolder, folderSystem)).thenResolve({
			targetFolder: inboxFolder,
			processInboxDatum,
		})

		const mailInstanceSessionKeys = [createTestEntity(InstanceSessionKeyTypeRef), createTestEntity(InstanceSessionKeyTypeRef)]
		when(cryptoFacade.resolveWithBucketKey(mail)).thenResolve({
			instanceSessionKeys: mailInstanceSessionKeys,
			resolvedSessionKeyForInstance: [0, 2, 3, 4, 2, 1, 2, 3], // decrypted mailSessionKey
		})

		when(mailFacade.processNewMails(assertNotNull(mail._ownerGroup), [processInboxDatum])).thenDo(() => {
			if (throwError) {
				return Promise.reject(new LockedError("test lock"))
			} else {
				return undefined
			}
		})

		const targetFolder = await processInboxHandler.handleIncomingMail(mail, inboxFolder, mailboxDetail, folderSystem, true)
		o(targetFolder).deepEquals(inboxFolder)
		await delay(0)
		throwError = false
		await delay(0)

		const expectedProcessInboxDatum: UnencryptedProcessInboxDatum = {
			classifierType: ClientClassifierType.CLIENT_CLASSIFICATION,
			mailId: mail._id,
			targetMoveFolder: inboxFolder._id,
			vector: new Uint8Array(),
			ownerEncMailSessionKeys: mailInstanceSessionKeys,
		}

		verify(mailFacade.processNewMails(assertNotNull(mail._ownerGroup), [expectedProcessInboxDatum]), { times: 2 })
	})
})
