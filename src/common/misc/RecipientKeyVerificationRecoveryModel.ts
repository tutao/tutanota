import type { KeyVerificationFacade } from "../api/worker/facades/lazy/KeyVerificationFacade"
import { PublicIdentityKeyProvider } from "../api/worker/facades/PublicIdentityKeyProvider"
import { IdentityKeySourceOfTrust, PublicKeyIdentifierType } from "../api/common/TutanotaConstants"
import { ResolvableRecipient } from "../api/main/RecipientsModel"
import { ProgrammingError } from "../api/common/error/ProgrammingError"

/**
 * Handles the high level logic of how to deal with key verification errors for recipients.
 */
export class RecipientKeyVerificationRecoveryModel {
	// @ts-ignore we set it in the constructor, and it is always defined, but ts complains
	private currentRecipient: ResolvableRecipient
	private savedRecipientForConfirmation: string = ""

	constructor(
		private readonly keyVerificationFacade: KeyVerificationFacade,
		private readonly publicIdentityKeyProvider: PublicIdentityKeyProvider,
		private unverifiedRecipients: ResolvableRecipient[],
	) {
		if (this.unverifiedRecipients.length == 0) {
			throw new ProgrammingError("unverifiedRecipients must not be empty")
		}

		this.setCurrentRecipientFromAddress(this.unverifiedRecipients[0].address)
	}

	setCurrentRecipientFromAddress(address: string) {
		for (const recipient of this.unverifiedRecipients) {
			if (recipient.address === address) {
				this.currentRecipient = recipient

				// also save it for confirmation/reject page
				this.savedRecipientForConfirmation = this.currentRecipient.address
				return
			}
		}

		throw new ProgrammingError(`cannot select recipient with address "${address}" -- not present in model`)
	}

	getCurrentRecipientAddress(): string {
		return this.currentRecipient.address
	}

	getUnverifiedRecipients(): ResolvableRecipient[] {
		return this.unverifiedRecipients
	}

	getConfirmedRecipientAddress(): string {
		return this.savedRecipientForConfirmation
	}

	hasRecipients(): boolean {
		return this.unverifiedRecipients.length > 0
	}

	async getSourceOfTrust(): Promise<IdentityKeySourceOfTrust> {
		const identityKey = await this.publicIdentityKeyProvider.loadPublicIdentityKey({
			identifier: this.currentRecipient.address,
			identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
		})
		if (identityKey) {
			return identityKey.sourceOfTrust
		} else {
			return IdentityKeySourceOfTrust.Not_Supported
		}
	}

	removeCurrentlySelectedRecipient() {
		this.unverifiedRecipients = this.unverifiedRecipients.filter((r) => r.address !== this.currentRecipient.address)

		if (this.unverifiedRecipients.length > 0) {
			this.currentRecipient = this.unverifiedRecipients[0]
		}
	}

	async acceptAndLoadNewKey() {
		await this.keyVerificationFacade.untrust(this.currentRecipient.address)
		this.currentRecipient.reset()
		await this.currentRecipient.resolve()
		this.removeCurrentlySelectedRecipient() // we don´t want to keep this unverified recipient around !
	}
}
