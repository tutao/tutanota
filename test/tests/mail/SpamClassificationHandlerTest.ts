import o from "@tutao/otest"
import { matchers, object, verify, when } from "testdouble"
import {
	Body,
	BodyTypeRef,
	ClientSpamClassifierResultTypeRef,
	Mail,
	MailAddressTypeRef,
	MailDetails,
	MailDetailsTypeRef,
	MailSetTypeRef,
	MailTypeRef,
	Recipients,
	RecipientsTypeRef,
} from "../../../src/common/api/entities/tutanota/TypeRefs"
import { SpamClassifier } from "../../../src/mail-app/workerUtils/spamClassification/SpamClassifier"
import {
	MailAuthenticationStatus,
	MailPhishingStatus,
	MailSetKind,
	MailState,
	ProcessingState,
	SpamDecision,
} from "../../../src/common/api/common/TutanotaConstants"
import { ClientClassifierType } from "../../../src/common/api/common/ClientClassifierType"
import { assert, assertNotNull } from "@tutao/tutanota-utils"
import { MailFacade } from "../../../src/common/api/worker/facades/lazy/MailFacade"
import { createTestEntity } from "../TestUtils"
import { SpamClassificationHandler } from "../../../src/mail-app/mail/model/SpamClassificationHandler"
import { FolderSystem } from "../../../src/common/api/common/mail/FolderSystem"
import { isSameId } from "../../../src/common/api/common/utils/EntityUtils"
import { UnencryptedProcessInboxDatum } from "../../../src/mail-app/mail/model/ProcessInboxHandler"
import { createSpamMailDatum, SpamMailProcessor } from "../../../src/common/api/common/utils/spamClassificationUtils/SpamMailProcessor"
import { UserController } from "../../../src/common/api/main/UserController"
import { UserTypeRef } from "../../../src/common/api/entities/sys/TypeRefs"
import { LoginController } from "../../../src/common/api/main/LoginController"

const { anything } = matchers

o.spec("SpamClassificationHandlerTest", function () {
	const mailFacade = object<MailFacade>()
	const userController = object<UserController>()
	const logins = object<LoginController>()
	let body: Body
	let recipients: Recipients
	let mail: Mail
	let spamClassifier: SpamClassifier
	let spamHandler: SpamClassificationHandler
	let spamMailProcessor: SpamMailProcessor
	let folderSystem: FolderSystem
	let mailDetails: MailDetails

	const inboxFolder = createTestEntity(MailSetTypeRef, { _id: ["listId", "inbox"], folderType: MailSetKind.INBOX })
	const trashFolder = createTestEntity(MailSetTypeRef, { _id: ["listId", "trash"], folderType: MailSetKind.TRASH })
	const spamFolder = createTestEntity(MailSetTypeRef, { _id: ["listId", "spam"], folderType: MailSetKind.SPAM })

	const compressedUnencryptedTestVector = new Uint8Array([23, 3, 21, 12, 14, 2, 23, 3, 30, 3, 4, 3, 2, 31, 23, 22, 30])

	o.beforeEach(async function () {
		spamClassifier = object<SpamClassifier>()
		spamMailProcessor = object<SpamMailProcessor>()

		body = createTestEntity(BodyTypeRef, { text: "Body Text" })
		recipients = createTestEntity(RecipientsTypeRef)
		mailDetails = createTestEntity(MailDetailsTypeRef, { _id: "mailDetail", body, recipients })
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

		when(mailFacade.moveMails(anything(), anything(), anything())).thenResolve([])
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
		when(spamMailProcessor.vectorizeAndCompress(createSpamMailDatum(mail, mailDetails))).thenResolve(compressedUnencryptedTestVector)
		when(spamClassifier.compress(matchers.anything())).thenResolve(compressedUnencryptedTestVector)
		userController.user = createTestEntity(UserTypeRef)
		when(logins.getUserController()).thenReturn(userController)
		spamHandler = new SpamClassificationHandler(spamClassifier, mailFacade, logins)
	})

	o("predictSpamForNewMail does move mail from inbox to spam folder if mail is spam", async function () {
		mail.sets = [inboxFolder._id]
		when(spamClassifier.predict(anything(), anything())).thenResolve(true)

		const finalResult = await spamHandler.predictSpamForNewMail(mail, mailDetails, inboxFolder, folderSystem)

		const expectedProcessInboxDatum: UnencryptedProcessInboxDatum = {
			mailId: mail._id,
			targetMoveFolder: spamFolder._id,
			classifierType: ClientClassifierType.CLIENT_CLASSIFICATION,
			vector: compressedUnencryptedTestVector,
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
			classifierType: ClientClassifierType.CLIENT_CLASSIFICATION,
			vector: compressedUnencryptedTestVector,
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
			classifierType: ClientClassifierType.CLIENT_CLASSIFICATION,
			vector: compressedUnencryptedTestVector,
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
			classifierType: ClientClassifierType.CLIENT_CLASSIFICATION,
			vector: compressedUnencryptedTestVector,
		}

		o(finalResult.targetFolder).deepEquals(inboxFolder)
		o(finalResult.processInboxDatum).deepEquals(expectedProcessInboxDatum)
	})

	o("predictSpamForNewMail doesn't call classifier when sender is in recipients", async function () {
		mail.sets = [inboxFolder._id]
		mail.sender = createTestEntity(MailAddressTypeRef, { address: "sender@email.com", name: "Sender" })
		mailDetails.recipients.toRecipients.push(mail.sender)
		when(mailFacade.getAllMailAliasesForUser(userController.user)).thenResolve(["sender@email.com"])
		const finalResult = await spamHandler.predictSpamForNewMail(mail, mailDetails, inboxFolder, folderSystem)

		const expectedProcessInboxDatum: UnencryptedProcessInboxDatum = {
			mailId: mail._id,
			targetMoveFolder: inboxFolder._id,
			classifierType: ClientClassifierType.CLIENT_CLASSIFICATION,
			vector: compressedUnencryptedTestVector,
		}

		o(finalResult.targetFolder).deepEquals(inboxFolder)
		o(finalResult.processInboxDatum).deepEquals(expectedProcessInboxDatum)
		verify(spamClassifier.predict(anything(), anything()), { times: 0 })
	})

	o("predictSpamForNewMail doesn't call classifier when sender is in cc recipients", async function () {
		mail.sets = [inboxFolder._id]
		mail.sender = createTestEntity(MailAddressTypeRef, { address: "sender@email.com", name: "Sender" })
		when(mailFacade.getAllMailAliasesForUser(userController.user)).thenResolve(["sender@email.com"])
		mailDetails.recipients.toRecipients.push(createTestEntity(MailAddressTypeRef, { address: "othermail@email.com", name: "Sender Two" }))
		mailDetails.recipients.ccRecipients.push(mail.sender)
		const finalResult = await spamHandler.predictSpamForNewMail(mail, mailDetails, inboxFolder, folderSystem)

		const expectedProcessInboxDatum: UnencryptedProcessInboxDatum = {
			mailId: mail._id,
			targetMoveFolder: inboxFolder._id,
			classifierType: ClientClassifierType.CLIENT_CLASSIFICATION,
			vector: compressedUnencryptedTestVector,
		}

		o(finalResult.targetFolder).deepEquals(inboxFolder)
		o(finalResult.processInboxDatum).deepEquals(expectedProcessInboxDatum)
		verify(spamClassifier.predict(anything(), anything()), { times: 0 })
	})

	o("predictSpamForNewMail doesn't call classifier when sender is in bcc recipients", async function () {
		mail.sets = [inboxFolder._id]
		mail.sender = createTestEntity(MailAddressTypeRef, { address: "sender@email.com", name: "Sender" })
		when(mailFacade.getAllMailAliasesForUser(userController.user)).thenResolve(["sender@email.com"])
		mailDetails.recipients.bccRecipients.push(mail.sender)
		const finalResult = await spamHandler.predictSpamForNewMail(mail, mailDetails, inboxFolder, folderSystem)

		const expectedProcessInboxDatum: UnencryptedProcessInboxDatum = {
			mailId: mail._id,
			targetMoveFolder: inboxFolder._id,
			classifierType: ClientClassifierType.CLIENT_CLASSIFICATION,
			vector: compressedUnencryptedTestVector,
		}

		o(finalResult.targetFolder).deepEquals(inboxFolder)
		o(finalResult.processInboxDatum).deepEquals(expectedProcessInboxDatum)
		verify(spamClassifier.predict(anything(), anything()), { times: 0 })
	})

	o("predictSpamForNewMail calls classifier when self mail is not Authenticated", async function () {
		mail.sets = [inboxFolder._id]
		mail.state = MailState.RECEIVED
		mailDetails.authStatus = MailAuthenticationStatus.INVALID_MAIL_FROM
		mail.sender = createTestEntity(MailAddressTypeRef, { address: "sender@email.com", name: "Sender" })
		const finalResult = await spamHandler.predictSpamForNewMail(mail, mailDetails, inboxFolder, folderSystem)

		const expectedProcessInboxDatum: UnencryptedProcessInboxDatum = {
			mailId: mail._id,
			targetMoveFolder: inboxFolder._id,
			classifierType: ClientClassifierType.CLIENT_CLASSIFICATION,
			vector: compressedUnencryptedTestVector,
		}

		o(finalResult.targetFolder).deepEquals(inboxFolder)
		o(finalResult.processInboxDatum).deepEquals(expectedProcessInboxDatum)
		verify(spamClassifier.predict(anything(), anything()), { times: 1 })
	})

	o("predictSpamForNewMail doesn't call classifier when mail is suspected of phishing", async function () {
		mail.sets = [spamFolder._id]
		mail.sender = createTestEntity(MailAddressTypeRef, { address: "phisher@email.com", name: "Mr Phish" })
		mail.phishingStatus = MailPhishingStatus.SUSPICIOUS
		mailDetails.recipients.toRecipients.push(mail.sender)
		const finalResult = await spamHandler.predictSpamForNewMail(mail, mailDetails, spamFolder, folderSystem)

		const expectedProcessInboxDatum: UnencryptedProcessInboxDatum = {
			mailId: mail._id,
			targetMoveFolder: spamFolder._id,
			classifierType: ClientClassifierType.CLIENT_CLASSIFICATION,
			vector: compressedUnencryptedTestVector,
		}

		o(finalResult.targetFolder).deepEquals(spamFolder)
		o(finalResult.processInboxDatum).deepEquals(expectedProcessInboxDatum)
		verify(spamClassifier.predict(anything(), anything()), { times: 0 })
	})

	o("predictSpamForNewMail doesn't call classifier when sender is one of the aliases of the user", async function () {
		mail.sets = [inboxFolder._id]
		mail.sender = createTestEntity(MailAddressTypeRef, { address: "alias@email.com", name: "Name" })
		mailDetails.recipients.toRecipients.push(createTestEntity(MailAddressTypeRef, { address: "mainaddress@email.com", name: "Name" }))
		when(mailFacade.getAllMailAliasesForUser(userController.user)).thenResolve(["alias@email.com", "mainaddress@email.com"])
		const finalResult = await spamHandler.predictSpamForNewMail(mail, mailDetails, inboxFolder, folderSystem)

		const expectedProcessInboxDatum: UnencryptedProcessInboxDatum = {
			mailId: mail._id,
			targetMoveFolder: inboxFolder._id,
			classifierType: ClientClassifierType.CLIENT_CLASSIFICATION,
			vector: compressedUnencryptedTestVector,
		}

		o(finalResult.targetFolder).deepEquals(inboxFolder)
		o(finalResult.processInboxDatum).deepEquals(expectedProcessInboxDatum)
		verify(spamClassifier.predict(anything(), anything()), { times: 0 })
	})
})
