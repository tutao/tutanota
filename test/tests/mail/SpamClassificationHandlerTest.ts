import o from "@tutao/otest"
import { matchers, object, verify, when } from "testdouble"
import { SpamClassifier } from "../../../src/applications/mail-app/workerUtils/spamClassification/SpamClassifier"
import { EncryptionAuthStatus, MailAuthenticationStatus } from "../../../src/platform-kit/app-env"
import { createTestEntity } from "../TestUtils"
import {
	SERVER_CLASSIFIERS_TO_TRUST,
	SkipClientSpamClassificationReason,
	SpamClassificationHandler,
} from "../../../src/applications/mail-app/mail/model/SpamClassificationHandler"
import { UserController } from "../../../src/applications/common/api/main/UserController"
import { ContactModel } from "../../../src/applications/common/contactsFunctionality/ContactModel"
import { MailFacade } from "../../../src/applications/common/api/worker/facades/lazy/MailFacade"
import { LoginController } from "../../../src/applications/common/api/main/LoginController"

import { MailPhishingStatus, MailState, ProcessingState, SpamDecision } from "../../../src/entities/tutanota/Utils"
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
	MailTypeRef,
	Recipients,
	RecipientsTypeRef,
} from "@tutao/entities/tutanota"

import { UserTypeRef } from "@tutao/entities/sys"

const { anything } = matchers

o.spec("SpamClassificationHandler", function () {
	const mailFacade = object<MailFacade>()
	const logins = object<LoginController>()
	const userController = object<UserController>()

	let spamClassifier: SpamClassifier
	let contactModel: ContactModel
	let spamHandler: SpamClassificationHandler

	o.beforeEach(async function () {
		spamClassifier = object<SpamClassifier>()
		contactModel = object<ContactModel>()
		spamHandler = new SpamClassificationHandler(spamClassifier, contactModel, mailFacade, logins)
	})

	o.spec("predictSpamForNewMail", () => {
		const modelInput = [0, 1]
		const ownerGroupId = "ownerGroup"

		o.test("return false (HAM) when no prediction is returned by SpamClassifier", async () => {
			when(spamClassifier.predict(anything(), anything())).thenResolve(null)
			o.check(await spamHandler.predictSpamForNewMail(modelInput, ownerGroupId)).equals(false)
			verify(spamClassifier.predict(modelInput, ownerGroupId))
		})

		o.test("return false (HAM) when HAM prediction is returned by SpamClassifier", async () => {
			when(spamClassifier.predict(anything(), anything())).thenResolve(false)
			o.check(await spamHandler.predictSpamForNewMail(modelInput, ownerGroupId)).equals(false)
			verify(spamClassifier.predict(modelInput, ownerGroupId))
		})

		o.test("return true (SPAM) when SPAM prediction is returned by SpamClassifier", async () => {
			when(spamClassifier.predict(anything(), anything())).thenResolve(true)
			o.check(await spamHandler.predictSpamForNewMail(modelInput, ownerGroupId)).equals(true)
			verify(spamClassifier.predict(modelInput, ownerGroupId))
		})
	})

	o.spec("preparePredictSpamForNewMail", () => {
		let body: Body
		let recipients: Recipients
		let mail: Mail
		let mailDetails: MailDetails

		const compressedUnencryptedTestVector = new Uint8Array([23, 3, 21, 12, 14, 2, 23, 3, 30, 3, 4, 3, 2, 31, 23, 22, 30])

		o.beforeEach(() => {
			body = createTestEntity(BodyTypeRef, { text: "Body Text" })
			recipients = createTestEntity(RecipientsTypeRef)
			mailDetails = createTestEntity(MailDetailsTypeRef, { _id: "mailDetail", body, recipients })
			mail = createTestEntity(MailTypeRef, {
				_id: ["listId", "elementId"],
				subject: "subject",
				sender: createTestEntity(MailAddressTypeRef, { address: "someExternal@gmail.com", name: "SomeExternal" }),
				_ownerGroup: "owner",
				mailDetails: ["detailsList", mailDetails._id],
				unread: true,
				processingState: ProcessingState.INBOX_RULE_NOT_PROCESSED,
				clientSpamClassifierResult: createTestEntity(ClientSpamClassifierResultTypeRef, { spamDecision: SpamDecision.NONE }),
				serverClassificationData: "0,10",
			})

			userController.user = createTestEntity(UserTypeRef)
			when(logins.getUserController()).thenReturn(userController)
			when(mailFacade.getAllMailAddressesForUser(userController.user)).thenResolve(["user@tuta.com"])

			when(spamClassifier.createModelInputAndUploadVector(anything(), anything())).thenResolve({
				modelInput: [0, 1],
				uploadableVector: compressedUnencryptedTestVector,
				uploadableVectorLegacy: compressedUnencryptedTestVector,
			})
		})

		o.test("skip spam classification when mail is from Tuta Team", async function () {
			mail.confidential = true
			mail.state = MailState.RECEIVED
			mail.encryptionAuthStatus = EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_SUCCEEDED
			mailDetails.recipients.toRecipients.push(mail.sender)
			mail.sender = createTestEntity(MailAddressTypeRef, { address: "user@tutao.de", name: "Tuta Team" })

			const { modelInput, uploadableVectorLegacy, uploadableVector, skipPredictionReason } = await spamHandler.preparePredictSpamForNewMail(
				mail,
				mailDetails,
			)

			o.check(modelInput).deepEquals([0, 1])
			o.check(uploadableVectorLegacy).deepEquals(compressedUnencryptedTestVector)
			o.check(uploadableVector).deepEquals(compressedUnencryptedTestVector)
			o.check(skipPredictionReason).equals(SkipClientSpamClassificationReason.FromTrustedSender)
		})

		o.test("skip spam classification when mail is from user themselves", async function () {
			mail.sender = createTestEntity(MailAddressTypeRef, { address: "user@tuta.com", name: "Tuta User" })
			mailDetails.recipients.toRecipients.push(mail.sender)

			const { modelInput, uploadableVectorLegacy, uploadableVector, skipPredictionReason } = await spamHandler.preparePredictSpamForNewMail(
				mail,
				mailDetails,
			)

			o.check(modelInput).deepEquals([0, 1])
			o.check(uploadableVectorLegacy).deepEquals(compressedUnencryptedTestVector)
			o.check(uploadableVector).deepEquals(compressedUnencryptedTestVector)
			o.check(skipPredictionReason).equals(SkipClientSpamClassificationReason.FromTrustedSender)
		})

		o.test("don't skip spam classification when mail is from user themselves, BUT NOT Authenticated", async function () {
			mail.state = MailState.RECEIVED
			mail.sender = createTestEntity(MailAddressTypeRef, { address: "user@tuta.com", name: "Tuta User" })
			mailDetails.authStatus = MailAuthenticationStatus.INVALID_MAIL_FROM
			mailDetails.recipients.toRecipients.push(mail.sender)

			const { modelInput, uploadableVectorLegacy, uploadableVector, skipPredictionReason } = await spamHandler.preparePredictSpamForNewMail(
				mail,
				mailDetails,
			)

			o.check(modelInput).deepEquals([0, 1])
			o.check(uploadableVectorLegacy).deepEquals(compressedUnencryptedTestVector)
			o.check(uploadableVector).deepEquals(compressedUnencryptedTestVector)
			o.check(skipPredictionReason).equals(SkipClientSpamClassificationReason.None)
		})

		o.test("skip spam classification when sender is one of the aliases of the user", async function () {
			mail.sender = createTestEntity(MailAddressTypeRef, { address: "alias@tuta.com", name: "Name" })
			mailDetails.recipients.toRecipients.push(
				createTestEntity(MailAddressTypeRef, {
					address: "user@tuta.com",
					name: "Name",
				}),
			)
			when(mailFacade.getAllMailAddressesForUser(userController.user)).thenResolve(["alias@tuta.com", "user@tuta.com"])

			const { modelInput, uploadableVectorLegacy, uploadableVector, skipPredictionReason } = await spamHandler.preparePredictSpamForNewMail(
				mail,
				mailDetails,
			)

			o.check(modelInput).deepEquals([0, 1])
			o.check(uploadableVectorLegacy).deepEquals(compressedUnencryptedTestVector)
			o.check(uploadableVector).deepEquals(compressedUnencryptedTestVector)
			o.check(skipPredictionReason).equals(SkipClientSpamClassificationReason.FromTrustedSender)
		})

		o.test("skip spam classification when mail is from a contact", async function () {
			mail.sender = createTestEntity(MailAddressTypeRef, { address: "user@tuta.com", name: "Tuta User" })
			when(contactModel.searchForContact(mail.sender.address)).thenResolve(
				createTestEntity(ContactTypeRef, {
					mailAddresses: [createTestEntity(ContactMailAddressTypeRef, { address: mail.sender.address })],
				}),
			)
			mailDetails.recipients.toRecipients.push(mail.sender)

			const { modelInput, uploadableVectorLegacy, uploadableVector, skipPredictionReason } = await spamHandler.preparePredictSpamForNewMail(
				mail,
				mailDetails,
			)

			o.check(modelInput).deepEquals([0, 1])
			o.check(uploadableVectorLegacy).deepEquals(compressedUnencryptedTestVector)
			o.check(uploadableVector).deepEquals(compressedUnencryptedTestVector)
			o.check(skipPredictionReason).equals(SkipClientSpamClassificationReason.FromTrustedSender)
		})

		o.test("skip spam classification when mail is suspected of phishing", async function () {
			mail.sender = createTestEntity(MailAddressTypeRef, { address: "phisher@email.com", name: "Mr Phish" })
			mail.phishingStatus = MailPhishingStatus.SUSPICIOUS
			mailDetails.recipients.toRecipients.push(mail.sender)

			const { modelInput, uploadableVectorLegacy, uploadableVector, skipPredictionReason } = await spamHandler.preparePredictSpamForNewMail(
				mail,
				mailDetails,
			)

			o.check(modelInput).deepEquals([0, 1])
			o.check(uploadableVectorLegacy).deepEquals(compressedUnencryptedTestVector)
			o.check(uploadableVector).deepEquals(compressedUnencryptedTestVector)
			o.check(skipPredictionReason).equals(SkipClientSpamClassificationReason.MarkedAsPhishing)
		})

		o.test("skip spam classification when mail is classified by trusted serverClassifier", async function () {
			mail.serverClassificationData = "0,10"
			SERVER_CLASSIFIERS_TO_TRUST.add(10)

			const { modelInput, uploadableVectorLegacy, uploadableVector, skipPredictionReason } = await spamHandler.preparePredictSpamForNewMail(
				mail,
				mailDetails,
			)

			o.check(modelInput).deepEquals([0, 1])
			o.check(uploadableVectorLegacy).deepEquals(compressedUnencryptedTestVector)
			o.check(uploadableVector).deepEquals(compressedUnencryptedTestVector)
			o.check(skipPredictionReason).equals(SkipClientSpamClassificationReason.ClassifiedByTrustedServerClassifier)
		})
	})
})
