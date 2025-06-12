import { KeyVerificationErrorModel } from "../../../src/common/misc/KeyVerificationErrorModel"
import { KeyVerificationFacade } from "../../../src/common/api/worker/facades/lazy/KeyVerificationFacade"
import { PublicIdentityKeyProvider } from "../../../src/common/api/worker/facades/PublicIdentityKeyProvider"
import { ResolvableRecipient } from "../../../src/common/api/main/RecipientsModel"
import o from "@tutao/otest"
import { matchers, object, verify, when } from "testdouble"
import { TrustDBEntry } from "../../../src/common/api/worker/facades/IdentityKeyTrustDatabase"
import { IdentityKeySourceOfTrust } from "../../../src/common/api/common/TutanotaConstants"

const RECIPIENT_ADDRESS = "recipient@tuta.com"

o.spec("KeyVerificationErrorModelTest", function () {
	let keyVerificationFacade: KeyVerificationFacade
	let publicIdentityKeyProvider: PublicIdentityKeyProvider
	let recipient: ResolvableRecipient

	let keyVerificationErrorModel: KeyVerificationErrorModel

	o.beforeEach(function () {
		keyVerificationFacade = object()
		publicIdentityKeyProvider = object()
		recipient = object()
		// @ts-ignore
		recipient.address = RECIPIENT_ADDRESS
		keyVerificationErrorModel = new KeyVerificationErrorModel(keyVerificationFacade, publicIdentityKeyProvider, recipient)
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

	o.spec("test acceptAndLoadNewKey", function () {
		o("acceptAndLoadNewKey - correct interactions", async function () {
			await keyVerificationErrorModel.acceptAndLoadNewKey()

			verify(keyVerificationFacade.untrust(RECIPIENT_ADDRESS))
			verify(recipient.reset())
			verify(recipient.resolve())
		})
	})
})
