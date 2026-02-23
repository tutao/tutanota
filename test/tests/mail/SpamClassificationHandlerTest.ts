import o from "@tutao/otest"
import { matchers, object, verify, when } from "testdouble"
import {
	Body,
	BodyTypeRef,
	ClientSpamClassifierResultTypeRef,
	ContactMailAddressTypeRef,
	ContactTypeRef,
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
import { MailSetKind, ProcessingState, SpamDecision } from "../../../src/common/api/common/TutanotaConstants"
import { ClientClassifierType } from "../../../src/common/api/common/ClientClassifierType"
import { assert, assertNotNull } from "@tutao/tutanota-utils"
import { createTestEntity } from "../TestUtils"
import { SERVER_CLASSIFIERS_TO_TRUST, SpamClassificationHandler } from "../../../src/mail-app/mail/model/SpamClassificationHandler"
import { FolderSystem } from "../../../src/common/api/common/mail/FolderSystem"
import { isSameId } from "../../../src/common/api/common/utils/EntityUtils"
import { UnencryptedProcessInboxDatum } from "../../../src/mail-app/mail/model/ProcessInboxHandler"
import { UserController } from "../../../src/common/api/main/UserController"
import { UserTypeRef } from "../../../src/common/api/entities/sys/TypeRefs"
import { ContactModel } from "../../../src/common/contactsFunctionality/ContactModel"

const { anything } = matchers

o.spec("SpamClassificationHandlerTest", function () {
	const userController = object<UserController>()
	let body: Body
	let recipients: Recipients
	let mail: Mail
	let spamClassifier: SpamClassifier
	let spamHandler: SpamClassificationHandler
	let folderSystem: FolderSystem
	let mailDetails: MailDetails
	let contactModel: ContactModel

	const inboxFolder = createTestEntity(MailSetTypeRef, { _id: ["listId", "inbox"], folderType: MailSetKind.INBOX })
	const trashFolder = createTestEntity(MailSetTypeRef, { _id: ["listId", "trash"], folderType: MailSetKind.TRASH })
	const spamFolder = createTestEntity(MailSetTypeRef, { _id: ["listId", "spam"], folderType: MailSetKind.SPAM })

	const compressedUnencryptedTestVector = new Uint8Array([23, 3, 21, 12, 14, 2, 23, 3, 30, 3, 4, 3, 2, 31, 23, 22, 30])

	o.beforeEach(async function () {
		spamClassifier = object<SpamClassifier>()
		contactModel = object<ContactModel>()

		body = createTestEntity(BodyTypeRef, { text: "Body Text" })
		recipients = createTestEntity(RecipientsTypeRef)
		mailDetails = createTestEntity(MailDetailsTypeRef, { _id: "mailDetail", body, recipients })
		mail = createTestEntity(MailTypeRef, {
			_id: ["listId", "elementId"],
			sets: [spamFolder._id],
			subject: "subject",
			sender: createTestEntity(MailAddressTypeRef, { address: "someExternal@gmail.com", name: "SomeExternal" }),
			_ownerGroup: "owner",
			mailDetails: ["detailsList", mailDetails._id],
			unread: true,
			processingState: ProcessingState.INBOX_RULE_NOT_PROCESSED,
			clientSpamClassifierResult: createTestEntity(ClientSpamClassifierResultTypeRef, { spamDecision: SpamDecision.NONE }),
			serverClassificationData: "0,10",
		})

		folderSystem = object<FolderSystem>()

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

			userController.user = createTestEntity(UserTypeRef)

			when(spamClassifier.createModelInputAndUploadVector(anything(), anything())).thenResolve({
				modelInput: [],
				uploadableVector: compressedUnencryptedTestVector,
			})
			spamHandler = new SpamClassificationHandler(spamClassifier, contactModel)
		})

		o("predictSpamForNewMail does move mail from inbox to spam folder if mail is spam", async function () {
			mail.sets = [inboxFolder._id]
			when(spamClassifier.predict(anything(), anything())).thenResolve(true)
			const finalResult = await spamHandler.predictSpamForNewMail(mail, mailDetails, inboxFolder, folderSystem)

			const expectedProcessInboxDatum: UnencryptedProcessInboxDatum = {
				mailId: mail._id,
				targetMoveFolder: spamFolder._id,
				classifierType: ClientClassifierType.CLIENT_CLASSIFICATION,
				vectorLegacy: compressedUnencryptedTestVector,
				vectorWithServerClassifiers: compressedUnencryptedTestVector,
				ownerEncMailSessionKeys: [],
			}

			verify(spamClassifier.predict(anything(), anything()), { times: 1 })
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
				vectorLegacy: compressedUnencryptedTestVector,
				vectorWithServerClassifiers: compressedUnencryptedTestVector,
				ownerEncMailSessionKeys: [],
			}

			verify(spamClassifier.predict(anything(), anything()), { times: 1 })
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
				vectorLegacy: compressedUnencryptedTestVector,
				vectorWithServerClassifiers: compressedUnencryptedTestVector,
				ownerEncMailSessionKeys: [],
			}

			verify(spamClassifier.predict(anything(), anything()), { times: 1 })
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
				vectorLegacy: compressedUnencryptedTestVector,
				vectorWithServerClassifiers: compressedUnencryptedTestVector,
				ownerEncMailSessionKeys: [],
			}

			verify(spamClassifier.predict(anything(), anything()), { times: 1 })
			o(finalResult.targetFolder).deepEquals(inboxFolder)
			o(finalResult.processInboxDatum).deepEquals(expectedProcessInboxDatum)
		})

		o("predictSpamForNewMail doesn't call classifier when mail is from user themselves", async function () {
			mail.sets = [inboxFolder._id]
			mail.sender = createTestEntity(MailAddressTypeRef, { address: "user@tuta.com", name: "Tuta User" })
			mailDetails.recipients.toRecipients.push(mail.sender)
			const finalResult = await spamHandler.predictSpamForNewMail(mail, mailDetails, inboxFolder, folderSystem)

			const expectedProcessInboxDatum: UnencryptedProcessInboxDatum = {
				mailId: mail._id,
				targetMoveFolder: inboxFolder._id,
				classifierType: ClientClassifierType.CLIENT_CLASSIFICATION,
				vectorLegacy: compressedUnencryptedTestVector,
				vectorWithServerClassifiers: compressedUnencryptedTestVector,
				ownerEncMailSessionKeys: [],
			}

			o(finalResult.targetFolder).deepEquals(inboxFolder)
			o(finalResult.processInboxDatum).deepEquals(expectedProcessInboxDatum)
			verify(spamClassifier.predict(anything(), anything()), { times: 0 })
		})

		o("predictSpamForNewMail doesn't call classifier when mail is from Tuta Team", async function () {
			mail.sets = [inboxFolder._id]

			mail.confidential = true
			mail.state = MailState.RECEIVED
			mail.encryptionAuthStatus = EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_SUCCEEDED
			mailDetails.recipients.toRecipients.push(mail.sender)
			mail.sender = createTestEntity(MailAddressTypeRef, { address: "user@tutao.de", name: "Tuta Team" })

			const finalResult = await spamHandler.predictSpamForNewMail(mail, mailDetails, inboxFolder, folderSystem)

			const expectedProcessInboxDatum: UnencryptedProcessInboxDatum = {
				mailId: mail._id,
				targetMoveFolder: inboxFolder._id,
				classifierType: ClientClassifierType.CLIENT_CLASSIFICATION,
				vectorLegacy: compressedUnencryptedTestVector,
				vectorWithServerClassifiers: compressedUnencryptedTestVector,
				ownerEncMailSessionKeys: [],
			}

			o(finalResult.targetFolder).deepEquals(inboxFolder)
			o(finalResult.processInboxDatum).deepEquals(expectedProcessInboxDatum)
			verify(spamClassifier.predict(anything(), anything()), { times: 0 })
		})

		o("predictSpamForNewMail calls classifier when self mail is from user themselves, BUT NOT Authenticated", async function () {
			mail.sets = [inboxFolder._id]
			mail.state = MailState.RECEIVED
			mail.sender = createTestEntity(MailAddressTypeRef, { address: "user@tuta.com", name: "Tuta User" })
			mailDetails.authStatus = MailAuthenticationStatus.INVALID_MAIL_FROM
			mailDetails.recipients.toRecipients.push(mail.sender)
			const finalResult = await spamHandler.predictSpamForNewMail(mail, mailDetails, inboxFolder, folderSystem)

			const expectedProcessInboxDatum: UnencryptedProcessInboxDatum = {
				mailId: mail._id,
				targetMoveFolder: inboxFolder._id,
				classifierType: ClientClassifierType.CLIENT_CLASSIFICATION,
				vectorLegacy: compressedUnencryptedTestVector,
				vectorWithServerClassifiers: compressedUnencryptedTestVector,
				ownerEncMailSessionKeys: [],
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
				vectorLegacy: compressedUnencryptedTestVector,
				vectorWithServerClassifiers: compressedUnencryptedTestVector,
				ownerEncMailSessionKeys: [],
			}

			o(finalResult.targetFolder).deepEquals(spamFolder)
			o(finalResult.processInboxDatum).deepEquals(expectedProcessInboxDatum)
			verify(spamClassifier.predict(anything(), anything()), { times: 0 })
		})

		o("mail is not predicted if classified by trusted serverClassifier", async function () {
			mail.sets = [spamFolder._id]
			mail.serverClassificationData = "0,10"
			SERVER_CLASSIFIERS_TO_TRUST.add(10)

			const finalResult = await spamHandler.predictSpamForNewMail(mail, mailDetails, spamFolder, folderSystem)

			const expectedProcessInboxDatum: UnencryptedProcessInboxDatum = {
				mailId: mail._id,
				targetMoveFolder: spamFolder._id,
				classifierType: ClientClassifierType.CLIENT_CLASSIFICATION,
				vectorLegacy: compressedUnencryptedTestVector,
				vectorWithServerClassifiers: compressedUnencryptedTestVector,
				ownerEncMailSessionKeys: [],
			}

			o(finalResult.targetFolder).deepEquals(spamFolder)
			o(finalResult.processInboxDatum).deepEquals(expectedProcessInboxDatum)
			verify(spamClassifier.predict(anything(), anything()), { times: 0 })
		})

		o("predictSpamForNewMail doesn't call classifier when mail is from a contact", async function () {
			mail.sets = [inboxFolder._id]
			mail.sender = createTestEntity(MailAddressTypeRef, { address: "user@tuta.com", name: "Tuta User" })
			when(contactModel.searchForContact(mail.sender.address)).thenResolve(
				createTestEntity(ContactTypeRef, { mailAddresses: [createTestEntity(ContactMailAddressTypeRef, { address: mail.sender.address })] }),
			)
			mailDetails.recipients.toRecipients.push(mail.sender)
			const finalResult = await spamHandler.predictSpamForNewMail(mail, mailDetails, inboxFolder, folderSystem)

			const expectedProcessInboxDatum: UnencryptedProcessInboxDatum = {
				mailId: mail._id,
				targetMoveFolder: inboxFolder._id,
				classifierType: ClientClassifierType.CLIENT_CLASSIFICATION,
				vectorLegacy: compressedUnencryptedTestVector,
				vectorWithServerClassifiers: compressedUnencryptedTestVector,
				ownerEncMailSessionKeys: [],
			}

			o(finalResult.targetFolder).deepEquals(inboxFolder)
			o(finalResult.processInboxDatum).deepEquals(expectedProcessInboxDatum)
			verify(spamClassifier.predict(anything(), anything()), { times: 0 })
		})
	})
})
