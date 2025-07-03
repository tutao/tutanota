import type { KeyVerificationFacade } from "../api/worker/facades/lazy/KeyVerificationFacade"
import { PublicIdentityKeyProvider } from "../api/worker/facades/PublicIdentityKeyProvider"
import { IdentityKeySourceOfTrust, PublicKeyIdentifierType } from "../api/common/TutanotaConstants"
import { ResolvableRecipient } from "../api/main/RecipientsModel"

/**
 * Handles the high level logic of how to deal with key verification errors for recipients.
 */
export class RecipientKeyVerificationRecoveryModel {
	constructor(
		private readonly keyVerificationFacade: KeyVerificationFacade,
		private readonly publicIdentityKeyProvider: PublicIdentityKeyProvider,
		private readonly recipient: ResolvableRecipient,
	) {}

	async getSourceOfTrust(): Promise<IdentityKeySourceOfTrust> {
		const identityKey = await this.publicIdentityKeyProvider.loadPublicIdentityKey({
			identifier: this.recipient.address,
			identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
		})
		if (identityKey) {
			return identityKey.sourceOfTrust
		} else {
			return IdentityKeySourceOfTrust.Not_Supported
		}
	}

	async acceptAndLoadNewKey() {
		await this.keyVerificationFacade.untrust(this.recipient.address)
		this.recipient.reset()
		await this.recipient.resolve()
	}
}
