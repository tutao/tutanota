import { isBrowser } from "../../common/Env"
import { TaggedSqlValue } from "../offline/SqlValue"
import { SigningKeyPairType, SigningPublicKey } from "./Ed25519Facade"
import { checkKeyVersionConstraints } from "./KeyLoaderFacade"
import { ProgrammingError } from "../../common/error/ProgrammingError"
import { bytesToEd25519PublicKey, ed25519PublicKeyToBytes } from "@tutao/tutanota-crypto"
import { IdentityKeySourceOfTrust } from "../../common/TutanotaConstants"
import { Versioned } from "@tutao/tutanota-utils"
import { sql } from "../offline/Sql"
import { SqlCipherFacade } from "../../../native/common/generatedipc/SqlCipherFacade"
import type { OfflineStorageTable } from "../offline/OfflineStorage"

/**
 * Defines tables created for this interface
 */
export const KeyVerificationTableDefinitions: Record<string, OfflineStorageTable> = Object.freeze({
	trusted_identities: {
		definition:
			"CREATE TABLE IF NOT EXISTS trusted_identities (mailAddress TEXT NOT NULL, fingerprint TEXT NOT NULL, keyVersion INTEGER NOT NULL, keyType INTEGER NOT NULL, PRIMARY KEY (mailAddress, keyVersion))",
		purgedWithCache: false,
	},
})

export type TrustDBEntry = {
	publicIdentityKey: Versioned<SigningPublicKey>
	sourceOfTrust: IdentityKeySourceOfTrust
}

/**
 * This class handles the interactions with the underlying SQL database to store and retrieve identity keys.
 *
 * The mail address is the primary key and the following values are stored as a record:
 * mailAddress, publicIdentityKey, identityKeyVersion, identityKeyType, sourceOfTrust (TOFU/MANUALLY_VERIFIED)
 *
 */
export class IdentityKeyTrustDatabase {
	constructor(private readonly sqlCipherFacade: SqlCipherFacade) {}

	isSupported(): boolean {
		// SQLite database is unavailable in a browser environment
		return !isBrowser()
	}

	/**
	 * Returns all trusted identities.
	 */
	async getManuallyVerifiedEntries(): Promise<Map<string, TrustDBEntry>> {
		// @formatter:off
		const result = await this.sqlCipherFacade.all(`SELECT * FROM identity_store WHERE sourceOfTrust = ${IdentityKeySourceOfTrust.Manual.valueOf()}`, [])
		// @formatter:on

		const identities = new Map<string, TrustDBEntry>()
		for (let [_, row] of result.entries()) {
			const [mailAddress, trustDBEntry] = await this.deserializeDatabaseEntry(row)
			identities.set(mailAddress, trustDBEntry)
		}

		return identities
	}

	/**
	 * Adds an identity to the trust database.
	 */
	async trust(mailAddress: string, identityKey: Versioned<SigningPublicKey>, sourceOfTrust: IdentityKeySourceOfTrust): Promise<TrustDBEntry> {
		if (sourceOfTrust === IdentityKeySourceOfTrust.Manual && (await this.isTrusted(mailAddress))) {
			// we allow overwriting an existing trusted entry when the user manual verified a key.
			await this.untrust(mailAddress)
		}

		const identityKeyBytes = ed25519PublicKeyToBytes(identityKey.object.key)
		const identityKeyType = SigningKeyPairType.Ed25519

		// @formatter:off
		const { query, params } = sql`
			INSERT INTO identity_store (mailAddress, publicIdentityKey, identityKeyVersion, identityKeyType, sourceOfTrust)
			VALUES (${mailAddress}, ${identityKeyBytes}, ${identityKey.version}, ${identityKeyType}, ${sourceOfTrust.valueOf()})`
		// @formatter:on
		await this.sqlCipherFacade.run(query, params)
		return { sourceOfTrust, publicIdentityKey: identityKey }
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
	 * @VisibleForTesting
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
	 * Returns the trusted identity key entry for a given mail address.
	 *
	 * @param mailAddress
	 */
	async getTrustedEntry(mailAddress: string): Promise<TrustDBEntry | null> {
		// @formatter:off
		const { query, params } = sql`SELECT * FROM identity_store WHERE mailAddress = ${mailAddress}`
		// @formatter:on
		const result = await this.sqlCipherFacade.get(query, params)

		if (result == null) {
			return null
		} else {
			const [_, trustDBEntry] = await this.deserializeDatabaseEntry(result)
			return trustDBEntry
		}
	}

	private async deserializeDatabaseEntry(entry: Record<string, TaggedSqlValue>): Promise<[string, TrustDBEntry]> {
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
		const trustDBEntry: TrustDBEntry = {
			publicIdentityKey: versionedSigningKey,
			sourceOfTrust: sourceOfTrust,
		}
		return [mailAddress, trustDBEntry]
	}
}
