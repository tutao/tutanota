import { assertWorkerOrNode, isBrowser } from "../../../common/Env"
import { EncryptionKeyVerificationState, IdentityKeySourceOfTrust } from "../../../common/TutanotaConstants"
import { concat, Hex, uint8ArrayToHex, Versioned } from "@tutao/tutanota-utils"
import { bytesToEd25519PublicKey, ed25519PublicKeyToBytes, PublicKey, sha256Hash } from "@tutao/tutanota-crypto"
import { SqlCipherFacade } from "../../../../native/common/generatedipc/SqlCipherFacade"
import { sql } from "../../offline/Sql"
import { TaggedSqlValue } from "../../offline/SqlValue"
import { ProgrammingError } from "../../../common/error/ProgrammingError"
import { EncodedEd25519Signature, SigningKeyPairType, SigningPublicKey } from "../Ed25519Facade"
import { checkKeyVersionConstraints } from "../KeyLoaderFacade"
import { PublicKeySignatureFacade } from "../PublicKeySignatureFacade"
import { KeyVerificationMismatchError } from "../../../common/error/KeyVerificationMismatchError"

assertWorkerOrNode()

export interface TrustedIdentity {
	publicIdentityKey: Versioned<SigningPublicKey>
	fingerprint: Hex
	sourceOfTrust: IdentityKeySourceOfTrust
}

/**
 * Facade for managing trust state of identity keys by adding or removing identity keys per email address into the trust store.
 * It also provides a method to verify public encryption key signatures with trusted identity keys.
 */
export class KeyVerificationFacade {
	constructor(private readonly sqlCipherFacade: SqlCipherFacade, private readonly publicKeySignatureFacade: PublicKeySignatureFacade) {}

	async isSupported(): Promise<boolean> {
		// SQLite database is unavailable in a browser environment
		return !isBrowser()
	}

	async deserializeDatabaseEntry(entry: Record<string, TaggedSqlValue>): Promise<[string, TrustedIdentity]> {
		const mailAddress = entry.mailAddress.value as string

		const keyType = entry.identityKeyType.value as SigningKeyPairType
		const keyVersion = checkKeyVersionConstraints(entry.identityKeyVersion.value as number)
		if (keyType !== SigningKeyPairType.Ed25519) {
			throw new ProgrammingError("unexpected signing key pair type, " + keyType)
		}
		const ed25519PublicKey = bytesToEd25519PublicKey(entry.publicIdentityKey.value as Uint8Array)
		const sourceOfTrust = entry.sourceOfTrust.value as IdentityKeySourceOfTrust

		const versionedSigningKey: Versioned<SigningPublicKey> = {
			object: {
				type: SigningKeyPairType.Ed25519,
				key: ed25519PublicKey,
			},
			version: keyVersion,
		}
		const publicKeyFingerprint: TrustedIdentity = {
			publicIdentityKey: versionedSigningKey,
			fingerprint: await this.calculateFingerprint(versionedSigningKey),
			sourceOfTrust: sourceOfTrust,
		}
		return [mailAddress, publicKeyFingerprint]
	}

	/**
	 * Returns all trusted identities.
	 */
	async getManuallyVerifiedIdentities(): Promise<Map<string, TrustedIdentity>> {
		// @formatter:off
		const result = await this.sqlCipherFacade.all(`SELECT * FROM identity_store WHERE sourceOfTrust = ${IdentityKeySourceOfTrust.Manual.valueOf()}`, [])
		// @formatter:on

		const identities = new Map<string, TrustedIdentity>()
		for (let [_, row] of result.entries()) {
			const [mailAddress, publicKeyFingerprint] = await this.deserializeDatabaseEntry(row)
			identities.set(mailAddress, publicKeyFingerprint)
		}

		return identities
	}

	/**
	 * Adds an identity to the trust database.
	 */
	async trust(mailAddress: string, identityKey: Versioned<SigningPublicKey>, sourceOfTrust: IdentityKeySourceOfTrust) {
		if (sourceOfTrust === IdentityKeySourceOfTrust.Manual && (await this.isTrusted(mailAddress))) {
			// we allow overwriting an existing trusted entry when the user manual verified a key.
			await this.untrust(mailAddress)
		}

		const identityKeyBytes = ed25519PublicKeyToBytes(identityKey.object.key)
		const identityKeyType = SigningKeyPairType.Ed25519

		/* Insert or update mailAddress / fingerprint */
		// @formatter:off
		const { query, params } = sql`
			INSERT INTO identity_store (mailAddress, publicIdentityKey, identityKeyVersion, identityKeyType, sourceOfTrust)
			VALUES (${mailAddress}, ${identityKeyBytes}, ${identityKey.version}, ${identityKeyType}, ${sourceOfTrust.valueOf()})`
		// @formatter:on
		await this.sqlCipherFacade.run(query, params)
	}

	/**
	 * Removes an identity from the trust database.
	 */
	async untrust(mailAddress: string) {
		// @formatter:off
		const { query, params } = sql`DELETE FROM identity_store WHERE mailAddress = ${mailAddress}`
		// @formatter:on
		await this.sqlCipherFacade.run(query, params)
	}

	/**
	 * Determines whether the trust database contains an entry for a given mail address.
	 */
	async isTrusted(mailAddress: string): Promise<boolean> {
		const isSupported = await this.isSupported()
		if (!isSupported) {
			return false
		}

		// @formatter:off
		const { query, params } = sql`SELECT * FROM identity_store WHERE mailAddress = ${mailAddress}`
		// @formatter:on
		const result = await this.sqlCipherFacade.get(query, params)
		return result !== null
	}

	/**
	 * Returns the fingerprint for a given mail address.
	 *
	 * @param mailAddress
	 */
	async getTrustedIdentity(mailAddress: string): Promise<TrustedIdentity | null> {
		// @formatter:off
		const { query, params } = sql`SELECT * FROM identity_store WHERE mailAddress = ${mailAddress}`
		// @formatter:on
		const result = await this.sqlCipherFacade.get(query, params)

		if (result == null) {
			return null
		} else {
			const [_, publicKeyFingerprint] = await this.deserializeDatabaseEntry(result)
			return publicKeyFingerprint
		}
	}

	public concatenateFingerprint(publicKey: Versioned<SigningPublicKey>): Uint8Array {
		let keyMetadata = concat(new Uint8Array([publicKey.version, publicKey.object.type]))
		return concat(keyMetadata, ed25519PublicKeyToBytes(publicKey.object.key))
	}

	/**
	 * Returns a hashed concatenation of the given public keys.
	 */
	public async calculateFingerprint(publicKey: Versioned<SigningPublicKey>): Promise<Hex> {
		return uint8ArrayToHex(sha256Hash(this.concatenateFingerprint(publicKey)))
	}

	/**
	 * Verifies the given public encryption key signature by using a trusted identity key.
	 * @param mailAddress Mail address of the the the public key was retrieved from
	 * @param encryptionKey The public encryption key to check.
	 * @param signature The existing signature of the public encryption key.
	 * @return EncryptionKeyVerificationState The verification state whether it is Manual or Tofu trusted key. Returns No_Entry if there is no trusted identity.
	 * @throws KeyVerificationMismatchError in case the signature is not valid
	 */
	async verify(mailAddress: string, encryptionKey: Versioned<PublicKey>, signature: EncodedEd25519Signature | null): Promise<EncryptionKeyVerificationState> {
		const isSupported = await this.isSupported()
		if (!isSupported) {
			throw new ProgrammingError("key verification is not supported in this environment")
		}

		// Load identity key from trust database
		const trustedIdentity = await this.getTrustedIdentity(mailAddress)

		if (trustedIdentity == null) {
			return EncryptionKeyVerificationState.NO_ENTRY
		}

		// Raise an error if an identity key exists but no signature has been loaded from the public key service.
		if (signature == null) {
			throw new KeyVerificationMismatchError("missing signature for identity: " + mailAddress)
		}

		const identityKey = trustedIdentity.publicIdentityKey

		if (identityKey.object.type !== SigningKeyPairType.Ed25519) {
			throw new ProgrammingError("expected identity public key of type Ed25519")
		}

		const validSignature = await this.publicKeySignatureFacade.verifyPublicKeySignature(encryptionKey, identityKey.object.key, signature)

		if (validSignature) {
			if (trustedIdentity.sourceOfTrust === IdentityKeySourceOfTrust.Manual) {
				return EncryptionKeyVerificationState.VERIFIED_MANUAL
			} else if (trustedIdentity.sourceOfTrust === IdentityKeySourceOfTrust.TOFU) {
				return EncryptionKeyVerificationState.VERIFIED_TOFU
			} else {
				throw new ProgrammingError("source of trust not implemented: " + trustedIdentity.sourceOfTrust)
			}
		} else {
			throw new KeyVerificationMismatchError("encryption key not signed with a valid signature")
		}
	}
}
