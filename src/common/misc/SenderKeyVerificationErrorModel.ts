import type { KeyVerificationFacade } from "../api/worker/facades/lazy/KeyVerificationFacade"
import { PublicIdentityKeyProvider } from "../api/worker/facades/PublicIdentityKeyProvider"
import { MailAddressAndName } from "../api/common/CommonMailUtils"

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
}
