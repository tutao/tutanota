import { RecipientKeyVerificationRecoveryModel } from "../../../src/common/misc/RecipientKeyVerificationRecoveryModel"
import { KeyVerificationFacade } from "../../../src/common/api/worker/facades/lazy/KeyVerificationFacade"
import { PublicIdentityKeyProvider } from "../../../src/common/api/worker/facades/PublicIdentityKeyProvider"
import { ResolvableRecipient } from "../../../src/common/api/main/RecipientsModel"
import o from "@tutao/otest"
import { matchers, object, verify, when } from "testdouble"
import { TrustDBEntry } from "../../../src/common/api/worker/facades/IdentityKeyTrustDatabase"
import { IdentityKeySourceOfTrust } from "../../../src/common/api/common/TutanotaConstants"
import { ProgrammingError } from "../../../src/common/api/common/error/ProgrammingError"

const RECIPIENT_ADDRESS = "recipient@tuta.com"
const RECIPIENT2_ADDRESS = "recipient2@tuta.com"

o.spec("RecipientKeyVerificationRecoveryModelTest", function () {
	let keyVerificationFacade: KeyVerificationFacade
	let publicIdentityKeyProvider: PublicIdentityKeyProvider
	let recipient: ResolvableRecipient
	let recipient2: ResolvableRecipient

	let keyVerificationErrorModel: RecipientKeyVerificationRecoveryModel

	o.beforeEach(function () {
		keyVerificationFacade = object()
		publicIdentityKeyProvider = object()
		recipient = object()
		recipient2 = object()
		// @ts-ignore
		recipient.address = RECIPIENT_ADDRESS
		// @ts-ignore
		recipient2.address = RECIPIENT2_ADDRESS
		keyVerificationErrorModel = new RecipientKeyVerificationRecoveryModel(keyVerificationFacade, publicIdentityKeyProvider, [recipient, recipient2])
	})

	o.spec("test getSourceOfTrust", function () {
		o("getSourceOfTrust - with identity key", async function () {
			let sourceOfTrust: IdentityKeySourceOfTrust

			const validIdentityKey: TrustDBEntry = object()
			when(publicIdentityKeyProvider.loadPublicIdentityKey(matchers.anything())).thenResolve(validIdentityKey)

			validIdentityKey.sourceOfTrust = IdentityKeySourceOfTrust.Manual
			sourceOfTrust = await keyVerificationErrorModel.getSourceOfTrust()
			o(sourceOfTrust).equals(IdentityKeySourceOfTrust.Manual)

			validIdentityKey.sourceOfTrust = IdentityKeySourceOfTrust.TOFU
			sourceOfTrust = await keyVerificationErrorModel.getSourceOfTrust()
			o(sourceOfTrust).equals(IdentityKeySourceOfTrust.TOFU)
		})

		o("getSourceOfTrust - no identity key", async function () {
			when(publicIdentityKeyProvider.loadPublicIdentityKey(matchers.anything())).thenResolve(null)

			let sourceOfTrust = await keyVerificationErrorModel.getSourceOfTrust()
			o(sourceOfTrust).equals(IdentityKeySourceOfTrust.Not_Supported)
		})
	})

	o.spec("test model initial state", function () {
		o("raises an exception if initialized without recipient", async function () {
			o(() => new RecipientKeyVerificationRecoveryModel(keyVerificationFacade, publicIdentityKeyProvider, [])).throws(ProgrammingError)
		})

		o("it should select the first recipient by default, making sure a recipient is always selected for next step", async function () {
			let recipientRecoveryModel = new RecipientKeyVerificationRecoveryModel(keyVerificationFacade, publicIdentityKeyProvider, [recipient])

			o(keyVerificationErrorModel.getCurrentRecipientAddress()).equals(recipient.address)
		})
	})

	o.spec("test updating the current recipient", function () {
		o("throws if the recipient to be set is not part of the model's list of recipients", async function () {
			o(() => keyVerificationErrorModel.setCurrentRecipientFromAddress("no-entry@tuta.com")).throws(ProgrammingError)
		})

		o("correctly updates internal state", async function () {
			o(keyVerificationErrorModel.getCurrentRecipientAddress()).equals(RECIPIENT_ADDRESS)
			o(keyVerificationErrorModel.getConfirmedRecipientAddress()).equals(RECIPIENT_ADDRESS)

			keyVerificationErrorModel.setCurrentRecipientFromAddress(RECIPIENT2_ADDRESS)

			o(keyVerificationErrorModel.getCurrentRecipientAddress()).equals(RECIPIENT2_ADDRESS)
			o(keyVerificationErrorModel.getConfirmedRecipientAddress()).equals(RECIPIENT2_ADDRESS)
		})
	})

	o.spec("test hasRecipients()", function () {
		o("returns true if recipients are supplied", function () {
			o(keyVerificationErrorModel.hasRecipients()).equals(true)
		})

		o("returns false if no recipients are left", function () {
			keyVerificationErrorModel.removeCurrentlySelectedRecipient()
			keyVerificationErrorModel.removeCurrentlySelectedRecipient()

			o(keyVerificationErrorModel.hasRecipients()).equals(false)
		})
	})

	o.spec("test acceptAndLoadNewKey", function () {
		o("acceptAndLoadNewKey - correct interactions", async function () {
			await keyVerificationErrorModel.acceptAndLoadNewKey()

			verify(keyVerificationFacade.untrust(RECIPIENT_ADDRESS))
			verify(recipient.reset())
			verify(recipient.resolve())
		})

		o("acceptAndLoadNewKey - set confirmed and current recipient after accepting new keys", async function () {
			await keyVerificationErrorModel.acceptAndLoadNewKey()

			// we must make sure that after recovering this recipient if there are still recipient to recover, the model always provide one
			o(keyVerificationErrorModel.getCurrentRecipientAddress()).equals(RECIPIENT2_ADDRESS)
			// we must make sure that after recovering this recipient we keep track of the recipient address for the confirmation page
			o(keyVerificationErrorModel.getConfirmedRecipientAddress()).equals(RECIPIENT_ADDRESS)
		})
	})
})
