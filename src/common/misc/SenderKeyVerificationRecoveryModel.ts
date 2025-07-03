import type { KeyVerificationFacade } from "../api/worker/facades/lazy/KeyVerificationFacade"
import { PublicIdentityKeyProvider } from "../api/worker/facades/PublicIdentityKeyProvider"
import { MailAddressAndName } from "../api/common/CommonMailUtils"
import { IdentityKeySourceOfTrust, PublicKeyIdentifierType } from "../api/common/TutanotaConstants"

/**
 * Handles the high level logic of how to deal with key verification errors for senders.
 */
export class SenderKeyVerificationRecoveryModel {
	constructor(
		private readonly keyVerificationFacade: KeyVerificationFacade,
		private readonly publicIdentityKeyProvider: PublicIdentityKeyProvider,
		private readonly sender: MailAddressAndName,
	) {}

	getSenderAddress() {
		return this.sender.address
	}

	async getSourceOfTrust() {
		const identityKey = await this.publicIdentityKeyProvider.loadPublicIdentityKey({
			identifier: this.sender.address,
			identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
		})
		if (identityKey) {
			return identityKey.sourceOfTrust
		} else {
			return IdentityKeySourceOfTrust.Not_Supported
		}
	}

	async acceptAndLoadNewKey() {
		await this.keyVerificationFacade.untrust(this.sender.address)
		// reload identity public key and store it as TOFU
		const identityKey = await this.publicIdentityKeyProvider.loadPublicIdentityKey({
			identifier: this.sender.address,
			identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
		})
	}
}
