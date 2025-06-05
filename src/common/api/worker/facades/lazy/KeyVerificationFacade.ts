import { assertWorkerOrNode } from "../../../common/Env"
import { EncryptionKeyVerificationState, IdentityKeySourceOfTrust, PublicKeyIdentifierType } from "../../../common/TutanotaConstants"
import { concat, Hex, uint8ArrayToHex, Versioned } from "@tutao/tutanota-utils"
import { ed25519PublicKeyToBytes, PublicKey, sha256Hash } from "@tutao/tutanota-crypto"
import { ProgrammingError } from "../../../common/error/ProgrammingError"
import { SigningKeyPairType, SigningPublicKey } from "../Ed25519Facade"
import { PublicKeySignatureFacade } from "../PublicKeySignatureFacade"
import { KeyVerificationMismatchError } from "../../../common/error/KeyVerificationMismatchError"
import { MaybeSignedPublicKey, PublicKeyIdentifier } from "../PublicEncryptionKeyProvider"
import { PublicIdentityKeyProvider } from "../PublicIdentityKeyProvider"
import { IdentityKeyTrustDatabase, TrustDBEntry } from "../IdentityKeyTrustDatabase"

assertWorkerOrNode()

export type TrustedIdentity = TrustDBEntry & { fingerprint: Hex }

export type VerifiedPublicEncryptionKey = {
	publicEncryptionKey: Versioned<PublicKey>
	verificationState: EncryptionKeyVerificationState
}

/**
 * Facade to verify public encryption keys, that are signed with identity keys.
 *
 * Handles error and corner (such as missing identity keys for old accounts) cases and returns the verification state with the public encryption key.
 * Calculates fingerprints for public identity keys for manual key verification.
 * Forwards requests to the trust database when performing a manual key verification.
 * Gets identity keys from the PublicIdentityKeyProvider which handles the trust state for identity keys.
 */
export class KeyVerificationFacade {
	constructor(
		private readonly publicKeySignatureFacade: PublicKeySignatureFacade,
		private readonly publicIdentityKeyProvider: PublicIdentityKeyProvider,
		private readonly identityKeyTrustDatabase: IdentityKeyTrustDatabase,
	) {}

	//visible for testing
	concatenateFingerprint(publicKey: Versioned<SigningPublicKey>): Uint8Array {
		let keyMetadata = concat(new Uint8Array([publicKey.version, publicKey.object.type]))
		return concat(keyMetadata, ed25519PublicKeyToBytes(publicKey.object.key))
	}

	/**
	 * Returns a hashed concatenation of the given public keys.
	 */
	public calculateFingerprint(publicKey: Versioned<SigningPublicKey>): Hex {
		return uint8ArrayToHex(sha256Hash(this.concatenateFingerprint(publicKey)))
	}

	/**
	 * Verifies the given public encryption key signature by using a trusted identity key.
	 * @return EncryptionKeyVerificationState The verification state whether it is Manual or Tofu trusted key. Returns No_Entry if there is no trusted identity.
	 * @param publicKeyIdentifier the mailAddress/ group the signing identity key belongs to
	 * @param maybeSignedPublicEncryptionKey the public encryption key and maybe a signature to verify it
	 */
	async verify(publicKeyIdentifier: PublicKeyIdentifier, maybeSignedPublicEncryptionKey: MaybeSignedPublicKey): Promise<VerifiedPublicEncryptionKey> {
		const publicEncryptionKey = maybeSignedPublicEncryptionKey.publicKey
		if (publicKeyIdentifier.identifierType !== PublicKeyIdentifierType.MAIL_ADDRESS) {
			// currently we do not support verification of keys via group id
			return { verificationState: EncryptionKeyVerificationState.NOT_SUPPORTED, publicEncryptionKey }
		}

		const publicKeySignature = maybeSignedPublicEncryptionKey.signature
		const mailAddress = publicKeyIdentifier.identifier
		const trustedIdentity = await this.publicIdentityKeyProvider.loadPublicIdentityKey(publicKeyIdentifier)

		// there is no identity key for the mailAddress (a legitimate case for now)
		if (trustedIdentity == null) {
			if (publicKeySignature) {
				throw new KeyVerificationMismatchError("signature but no identity key for: " + mailAddress)
			}
			return {
				verificationState: EncryptionKeyVerificationState.NO_ENTRY,
				publicEncryptionKey,
			}
		}
		// there is an identity key for the mail address

		// Raise an error if an identity key exists but no signature has been loaded from the public key service.
		if (publicKeySignature == null) {
			throw new KeyVerificationMismatchError("missing signature for identity: " + mailAddress)
		}

		const identityKey = trustedIdentity.publicIdentityKey

		if (identityKey.object.type !== SigningKeyPairType.Ed25519) {
			throw new ProgrammingError("expected identity public key of type Ed25519")
		}

		const validSignature = await this.publicKeySignatureFacade.verifyPublicKeySignature(
			publicEncryptionKey,
			identityKey.object.key,
			publicKeySignature.signature,
		)

		if (validSignature) {
			switch (trustedIdentity.sourceOfTrust) {
				case IdentityKeySourceOfTrust.Manual:
					return { verificationState: EncryptionKeyVerificationState.VERIFIED_MANUAL, publicEncryptionKey }
				case IdentityKeySourceOfTrust.TOFU:
					return { verificationState: EncryptionKeyVerificationState.VERIFIED_TOFU, publicEncryptionKey }
				case IdentityKeySourceOfTrust.Not_Supported:
					return { verificationState: EncryptionKeyVerificationState.NOT_SUPPORTED, publicEncryptionKey }
				default:
					throw new ProgrammingError("source of trust not implemented: " + trustedIdentity.sourceOfTrust)
			}
		} else {
			throw new KeyVerificationMismatchError("encryption key signed with an invalid signature")
		}
	}

	/**
	 * Returns all trusted identities.
	 */
	async getManuallyVerifiedIdentities(): Promise<Map<string, TrustedIdentity>> {
		const trustDbEntries = await this.identityKeyTrustDatabase.getManuallyVerifiedEntries()
		const identities = new Map<string, TrustedIdentity>()
		for (const [mailAddress, trustDbEntry] of trustDbEntries) {
			identities.set(mailAddress, this.convertToTrustedIdentity(trustDbEntry))
		}
		return identities
	}

	async untrust(mailAddress: string) {
		return this.identityKeyTrustDatabase.untrust(mailAddress)
	}

	async trust(mailAddress: string, identityKey: Versioned<SigningPublicKey>, sourceOfTrust: IdentityKeySourceOfTrust) {
		return this.identityKeyTrustDatabase.trust(mailAddress, identityKey, sourceOfTrust)
	}

	private convertToTrustedIdentity(trustDBEntry: TrustDBEntry): TrustedIdentity {
		return { ...trustDBEntry, fingerprint: this.calculateFingerprint(trustDBEntry.publicIdentityKey) }
	}
}
