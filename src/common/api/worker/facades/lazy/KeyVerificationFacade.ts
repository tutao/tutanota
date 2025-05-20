import { assertWorkerOrNode, isBrowser } from "../../../common/Env"
import { KeyVerificationSourceOfTrust, KeyVerificationState } from "../../../common/TutanotaConstants"
import { concat, Hex, uint8ArrayToHex, Versioned } from "@tutao/tutanota-utils"
import { bytesToEd25519PublicKey, ed25519PublicKeyToBytes, PublicKey, sha256Hash } from "@tutao/tutanota-crypto"
import { SqlCipherFacade } from "../../../../native/common/generatedipc/SqlCipherFacade"
import { sql } from "../../offline/Sql"
import { TaggedSqlValue } from "../../offline/SqlValue"
import { ProgrammingError } from "../../../common/error/ProgrammingError"
import { Ed25519Facade, EncodedEd25519Signature, SigningKeyPairType, SigningPublicKey } from "../Ed25519Facade"
import { checkKeyVersionConstraints } from "../KeyLoaderFacade"

assertWorkerOrNode()

export interface TrustedIdentity {
	publicIdentityKey: Versioned<SigningPublicKey>
	fingerprint: Hex
	sourceOfTrust: KeyVerificationSourceOfTrust
}

export class KeyVerificationFacade {
	constructor(private readonly sqlCipherFacade: SqlCipherFacade, private readonly ed25519Facade: Ed25519Facade) {}

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
		const sourceOfTrust = entry.sourceOfTrust.value as KeyVerificationSourceOfTrust

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
	async getTrustedIdentities(): Promise<Map<string, TrustedIdentity>> {
		// @formatter:off
		const result = await this.sqlCipherFacade.all(`SELECT * FROM identity_store`, [])
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
	async trust(mailAddress: string, identityKey: Versioned<SigningPublicKey>, sourceOfTrust: KeyVerificationSourceOfTrust) {
		if (sourceOfTrust === KeyVerificationSourceOfTrust.Manual && (await this.isTrusted(mailAddress))) {
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

	async verify(
		identityKey: Versioned<SigningPublicKey>,
		encryptionKey: Versioned<PublicKey>,
		signature: EncodedEd25519Signature,
	): Promise<KeyVerificationState> {
		const isSupported = await this.isSupported()
		if (!isSupported) {
			return KeyVerificationState.NO_ENTRY
		}
		// FIXME create message from encryption key and verify key
		const verifySignatureMessage: Uint8Array = new Uint8Array()
		const verificationResult = await this.ed25519Facade.verifySignature(identityKey.object.key, verifySignatureMessage, signature)
		if (verificationResult) {
			return KeyVerificationState.VERIFIED
		} else {
			return KeyVerificationState.MISMATCH
		}
	}
}
