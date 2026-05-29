import { Versioned } from "@tutao/utils"
import { SigningPublicKey } from "../../../crypto/encryption/Ed25519"
import { IdentityKeySourceOfTrust } from "@tutao/app-env"

export type TrustDBEntry = {
	publicIdentityKey: Versioned<SigningPublicKey>
	sourceOfTrust: IdentityKeySourceOfTrust
}

export interface IdentityKeyTrustDatabase {
	isIdentityKeyTrustDatabaseSupported(): Promise<boolean>

	/**
	 * Returns all trusted identities.
	 */
	getManuallyVerifiedEntries(): Promise<Map<string, TrustDBEntry>>

	/**
	 * Adds an identity to the trust database.
	 */
	trust(mailAddress: string, identityKey: Versioned<SigningPublicKey>, sourceOfTrust: IdentityKeySourceOfTrust): Promise<TrustDBEntry>

	/**
	 * Removes an identity from the trust database.
	 */
	untrust(mailAddress: string): Promise<void>

	/**
	 * Returns the trusted identity key entry for a given mail address.
	 *
	 * @param mailAddress
	 */
	getTrustedEntry(mailAddress: string): Promise<TrustDBEntry | null>
}
