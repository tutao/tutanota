import { assertWorkerOrNode, isBrowser } from "../../../common/Env"
import { FeatureType, KeyVerificationSourceOfTruth, PublicKeyIdentifierType } from "../../../common/TutanotaConstants"
import { assertNotNull, base64ToUint8Array, concat, Hex, lazyAsync, stringToUtf8Uint8Array, uint8ArrayToHex, Versioned } from "@tutao/tutanota-utils"
import { isVersionedPqPublicKey, isVersionedRsaEccPublicKey, isVersionedRsaPublicKey, KeyPairType, PublicKey, sha256Hash } from "@tutao/tutanota-crypto"
import { NotFoundError } from "../../../common/error/RestError"
import { SqlCipherFacade } from "../../../../native/common/generatedipc/SqlCipherFacade"
import { sql } from "../../offline/Sql"
import { TaggedSqlValue } from "../../offline/SqlValue"
import { ProgrammingError } from "../../../common/error/ProgrammingError"
import { PublicKeyProvider } from "../PublicKeyProvider"
import { CustomerFacade } from "./CustomerFacade"

assertWorkerOrNode()

export enum KeyVerificationState {
	NO_ENTRY, // Identity is not trusted by user
	VERIFIED, // Identity is trusted and verified
	MISMATCH, // Identity is trusted but not verified
}

export interface PublicKeyFingerprint {
	fingerprint: Hex
	keyPairType: KeyPairType
	keyVersion: number
}

/**
 * Bundles fingerprint and current verification status for presentation.
 */
export interface KeyVerificationDetails {
	publicKeyFingerprint: PublicKeyFingerprint
}

export class KeyVerificationFacade {
	constructor(
		private readonly lazyCustomerFacade: lazyAsync<CustomerFacade>,
		private readonly sqlCipherFacade: SqlCipherFacade,
		private readonly publicKeyProvider: PublicKeyProvider,
	) {}

	async isSupported(): Promise<boolean> {
		const customerFacade = await this.lazyCustomerFacade()

		// SQLite database is unavailable in a browser environment
		const isNative = !isBrowser()
		const isEnabledForCustomer = await customerFacade.isEnabled(FeatureType.KeyVerification)

		return isNative && isEnabledForCustomer
	}

	deserializeDatabaseEntry(entry: Record<string, TaggedSqlValue>): [string, PublicKeyFingerprint] {
		const mailAddress = entry.mailAddress.value as string

		// remove this after resetting the DB
		if (entry.keyType === undefined) {
			console.warn(`keyType is undefined for identity ${mailAddress}, skipping this one`)
			throw new ProgrammingError()
		}

		const keyType = entry.keyType.value as KeyPairType

		const publicKeyFingerprint: PublicKeyFingerprint = {
			fingerprint: entry.fingerprint.value as string,
			keyVersion: entry.keyVersion.value as number,
			keyPairType: keyType,
		}

		return [mailAddress, publicKeyFingerprint]
	}

	/**
	 * Returns all trusted identities.
	 */
	async getTrustedIdentities(): Promise<Map<string, PublicKeyFingerprint>> {
		const result = await this.sqlCipherFacade.all(`SELECT * FROM trusted_identities`, [])

		const identities = new Map<string, PublicKeyFingerprint>()
		for (let [_, row] of result.entries()) {
			const [mailAddress, publicKeyFingerprint] = this.deserializeDatabaseEntry(row)
			identities.set(mailAddress, publicKeyFingerprint)
		}

		return identities
	}

	/**
	 * Adds an identity to the trust database.
	 */
	async trust(mailAddress: string, fingerprint: string, keyVersion: number, keyType: KeyPairType) {
		if (await this.isTrusted(mailAddress)) {
			await this.untrust(mailAddress)
		}

		/* Insert or update mailAddress / fingerprint */
		const { query, params } = sql`
			INSERT INTO trusted_identities (mailAddress, fingerprint, keyVersion, keyType)
			VALUES (${mailAddress}, ${fingerprint}, ${keyVersion}, ${keyType.valueOf()})`
		await this.sqlCipherFacade.run(query, params)
	}

	/**
	 * Removes an identity from the trust database.
	 */
	async untrust(mailAddress: string) {
		const { query, params } = sql`DELETE FROM trusted_identities WHERE mailAddress = ${mailAddress}`
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

		const { query, params } = sql`SELECT * FROM trusted_identities WHERE mailAddress = ${mailAddress}`
		const result = await this.sqlCipherFacade.get(query, params)
		return result !== null
	}

	/**
	 * Returns the fingerprint for a given mail address.
	 *
	 * @param mailAddress
	 * @param sourceOfTruth whether to retrieve the fingerprint from local/trusted storage or the public key service
	 */
	async getFingerprint(mailAddress: string, sourceOfTruth: KeyVerificationSourceOfTruth): Promise<PublicKeyFingerprint | null> {
		if (sourceOfTruth === KeyVerificationSourceOfTruth.LocalTrusted) {
			const { query, params } = sql`SELECT * FROM trusted_identities WHERE mailAddress = ${mailAddress}`
			const result = await this.sqlCipherFacade.get(query, params)

			if (result == null) {
				return null
			} else {
				const [_, publicKeyFingerprint] = this.deserializeDatabaseEntry(result)
				return publicKeyFingerprint
			}
		} else if (sourceOfTruth === KeyVerificationSourceOfTruth.PublicKeyService) {
			try {
				const publicKey = await this.publicKeyProvider.loadCurrentPubKey({
					identifier: mailAddress,
					identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
				})
				return this.calculateFingerprint(publicKey)
			} catch (e) {
				if (e instanceof NotFoundError) {
					return null
				} else {
					throw e
				}
			}
		} else {
			// We should never run into this condition.
			assertNotNull(null)

			// make TypeScript happy
			return null
		}
	}

	/**
	 * Determines whether the expected fingerprint matches the one returned by a source.
	 *
	 * @param mailAddress
	 * @param expectedFingerprint
	 * @param sourceOfTruth whether to confirm the fingerprint with local/trusted storage or the public key service
	 */
	private async confirmFingerprint(mailAddress: string, expectedFingerprint: string, sourceOfTruth: KeyVerificationSourceOfTruth): Promise<boolean> {
		const receivedFingerprint = await this.getFingerprint(mailAddress, sourceOfTruth)
		return receivedFingerprint?.fingerprint === expectedFingerprint
	}

	public concatenateFingerprint(publicKey: Versioned<PublicKey>): Uint8Array {
		let keyMetadata = concat(stringToUtf8Uint8Array(String(publicKey.version)), stringToUtf8Uint8Array(String(publicKey.object.keyPairType)))

		if (isVersionedRsaPublicKey(publicKey)) {
			return concat(keyMetadata, base64ToUint8Array(publicKey.object.modulus))
		} else if (isVersionedRsaEccPublicKey(publicKey)) {
			return concat(keyMetadata, base64ToUint8Array(publicKey.object.modulus), publicKey.object.publicEccKey)
		} else if (isVersionedPqPublicKey(publicKey)) {
			return concat(keyMetadata, publicKey.object.kyberPublicKey.raw, publicKey.object.eccPublicKey)
		}

		throw new ProgrammingError("invalid key type")
	}

	/**
	 * Returns a hashed concatenation of the given public keys.
	 */
	public calculateFingerprint(publicKey: Versioned<PublicKey>): PublicKeyFingerprint {
		const publicKeysConcatenation = this.concatenateFingerprint(publicKey)
		const hash = uint8ArrayToHex(sha256Hash(publicKeysConcatenation))
		const publicKeyFingerprint: PublicKeyFingerprint = {
			fingerprint: hash,
			keyVersion: publicKey.version,
			keyPairType: publicKey.object.keyPairType,
		}

		return publicKeyFingerprint
	}

	async resolveVerificationState(mailAddress: string, publicKey: Versioned<PublicKey> | null): Promise<KeyVerificationState> {
		const isSupported = await this.isSupported()
		if (!isSupported) {
			return KeyVerificationState.NO_ENTRY
		}

		const trusted = await this.isTrusted(mailAddress)
		if (!trusted) {
			return KeyVerificationState.NO_ENTRY
		}

		let untrustedFingerprint: PublicKeyFingerprint
		if (publicKey == null) {
			const fingerprintFromPublicKeySource = await this.getFingerprint(mailAddress, KeyVerificationSourceOfTruth.PublicKeyService)

			// If the fingerprint received from the public key service is null, we return MISMATCH, as the fingerprint belongs to an identity that has been
			// trusted and that we therefore expect to be returned by the public key service.
			if (fingerprintFromPublicKeySource == null) {
				return KeyVerificationState.MISMATCH
			} else {
				untrustedFingerprint = fingerprintFromPublicKeySource
			}
		} else {
			untrustedFingerprint = this.calculateFingerprint(publicKey)
		}

		if (await this.confirmFingerprint(mailAddress, untrustedFingerprint.fingerprint, KeyVerificationSourceOfTruth.LocalTrusted)) {
			return KeyVerificationState.VERIFIED
		} else {
			return KeyVerificationState.MISMATCH
		}
	}
}
