import { assertWorkerOrNode } from "../../../common/Env"
import { createPublicKeyGetIn, PublicKeyGetOut } from "../../../entities/sys/TypeRefs"
import { PublicKeyIdentifierType } from "../../../common/TutanotaConstants"
import { PublicKeyService } from "../../../entities/sys/Services"
import { assertNotNull, concat, stringToUtf8Uint8Array, uint8ArrayToHex } from "@tutao/tutanota-utils"
import { sha256Hash } from "@tutao/tutanota-crypto"
import { IServiceExecutor } from "../../../common/ServiceRequest"
import { NotFoundError } from "../../../common/error/RestError"
import { SqlCipherFacade } from "../../../../native/common/generatedipc/SqlCipherFacade"
import { SqlType } from "../../offline/SqlValue"

assertWorkerOrNode()

// TODO: does this type exist anywhere else maybe?
export type MailAddress = string

/**
 * Bundles fingerprint and current verification status for presentation.
 */
export interface KeyVerificationDetails {
	fingerprint: string
	verified: boolean
}

export class KeyVerificationFacade {
	serviceExecutor: IServiceExecutor
	sqlCipherFacade: SqlCipherFacade

	constructor(serviceExecutor: IServiceExecutor, sqlCipherFacade: SqlCipherFacade) {
		this.serviceExecutor = serviceExecutor
		this.sqlCipherFacade = sqlCipherFacade
	}

	/**
	 * Determines whether the expected fingerprint matches the fingerprint returned by
	 * the public key service for the given mail address.
	 */
	async confirmFingerprint(mailAddress: string, expectedFingerprint: string): Promise<boolean> {
		try {
			const serverFingerprint = await this.getPublicKeyHashFromServer(mailAddress)
			return Promise.resolve(serverFingerprint === expectedFingerprint)
		} catch (e) {
			if (e instanceof NotFoundError) {
				// TODO: It might be better if NotFoundError resulted in a visible user message.
				return Promise.resolve(false)
			} else {
				throw e
			}
		}
	}

	/**
	 * Returns all pinned/trusted keys, including fresh information if they are still valid.
	 */
	async getPool(): Promise<Map<MailAddress, KeyVerificationDetails>> {
		const result = await this.sqlCipherFacade.all(`SELECT * FROM verification_pool`, [])

		const pool = new Map<MailAddress, KeyVerificationDetails>()
		for (let [_, { mailAddress, fingerprint }] of result.entries()) {
			const mailAddressStr = mailAddress.value as string
			const fingerprintStr = fingerprint.value as string

			pool.set(mailAddressStr, { fingerprint: fingerprintStr, verified: await this.confirmFingerprint(mailAddressStr, fingerprintStr) })
		}

		return Promise.resolve(pool)
	}

	/**
	 * Adds a trusted key to the database.
	 */
	async addToPool(mailAddress: string, fingerprint: string) {
		/* Insert or update mailAddress / fingerprint*/
		await this.sqlCipherFacade.run(
			`INSERT INTO verification_pool (mailAddress, fingerprint) VALUES (?, ?)
			ON CONFLICT(mailAddress) DO UPDATE
				SET mailAddress=excluded.mailAddress, fingerprint=excluded.fingerprint`,
			[
				{ type: SqlType.String, value: mailAddress },
				{ type: SqlType.String, value: fingerprint },
			],
		)

		return Promise.resolve()
	}

	/**
	 * Removes a key from the database.
	 */
	async removeFromPool(mailAddress: string) {
		await this.sqlCipherFacade.run(`DELETE FROM verification_pool WHERE mailAddress = ?`, [{ type: SqlType.String, value: mailAddress }])

		return Promise.resolve()
	}

	/**
	 * Returns the fingerprint stored in the database for a given mail address.
	 */
	async getStoredFingerprint(mailAddress: string): Promise<string | null> {
		const result = await this.sqlCipherFacade.get(`SELECT fingerprint FROM verification_pool WHERE mailAddress = ?`, [
			{ type: SqlType.String, value: mailAddress },
		])

		if (result == null) {
			return Promise.resolve(null)
		} else {
			// TODO: Find a safer way than `result.fingerprint.value as string`
			return Promise.resolve(result.fingerprint.value as string)
		}
	}

	/**
	 * Determines whether the stored fingerprint still matches the one
	 * returned by the public key service for a given mail address.
	 */
	async isVerified(mailAddress: string): Promise<boolean> {
		const storedFingerprint = await this.getStoredFingerprint(mailAddress)
		if (storedFingerprint == null) {
			// address is considered "not verified" when not a member of the pool
			return Promise.resolve(false)
		}

		return Promise.resolve(this.confirmFingerprint(mailAddress, storedFingerprint))
	}

	/**
	 * Determines whether the stored fingerprint of a given mail address matches the one calculated
	 * from a given PublicKeyGetOut structure.
	 */
	async publicKeyMatchesPinnedPublicKey(mailAddress: string, publicKeyGetOut: PublicKeyGetOut): Promise<boolean> {
		// TODO: check if this behaviour really is correct
		return (await this.getPublicKeyHash(publicKeyGetOut)) === (await this.getStoredFingerprint(mailAddress))
	}

	/**
	 * Determines whether the database contains an entry for a given mail address.
	 */
	async poolContains(mailAddress: string): Promise<boolean> {
		const result = await this.sqlCipherFacade.get(`SELECT * FROM verification_pool WHERE mailAddress = ?`, [{ type: SqlType.String, value: mailAddress }])
		return Promise.resolve(result !== null)
	}

	/**
	 * Returns a hashed concatenation of the given public keys.
	 */
	public async getPublicKeyHash(publicKeyGetOut: PublicKeyGetOut): Promise<string> {
		const atLeastOneFilledArray = (...arrays: (Uint8Array | null)[]) => {
			for (let current of arrays) {
				if (current != null) {
					if (current.length > 0) {
						return true
					}
				}
			}

			return false
		}

		// check if the server returns at least one key
		const validKeyExists = atLeastOneFilledArray(publicKeyGetOut.pubRsaKey, publicKeyGetOut.pubEccKey, publicKeyGetOut.pubKyberKey)
		if (!validKeyExists) {
			throw new Error("Server did not return a single valid public key. (tested for RSA, ECC, Kyber)")
		}

		const rsaStartDelimiter = stringToUtf8Uint8Array("RSA")
		const eccStartDelimiter = stringToUtf8Uint8Array("ECC")
		const kybStartDelimiter = stringToUtf8Uint8Array("KYB")

		const rsaEndDelimiter = stringToUtf8Uint8Array("ASR")
		const eccEndDelimiter = stringToUtf8Uint8Array("CCE")
		const kybEndDelimiter = stringToUtf8Uint8Array("BYK")

		const emptyArray = new Uint8Array(0)
		const publicKeysConcatenation = concat(
			// RSA
			rsaStartDelimiter,
			publicKeyGetOut.pubRsaKey != null ? publicKeyGetOut.pubRsaKey : emptyArray,
			rsaEndDelimiter,

			// Ecc
			eccStartDelimiter,
			publicKeyGetOut.pubEccKey != null ? publicKeyGetOut.pubEccKey : emptyArray,
			eccEndDelimiter,

			// Kyber
			kybStartDelimiter,
			publicKeyGetOut.pubKyberKey != null ? publicKeyGetOut.pubKyberKey : emptyArray,
			kybEndDelimiter,
		)

		const hash = uint8ArrayToHex(sha256Hash(assertNotNull(publicKeysConcatenation)))

		return Promise.resolve(hash)
	}

	/**
	 * Returns a hashed concatenation of public keys associated with a given mail address.
	 */
	public async getPublicKeyHashFromServer(mailAddress: string): Promise<string> {
		const keyData = createPublicKeyGetIn({
			identifier: mailAddress,
			identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,

			// Fetch the latest version
			version: null,
		})
		const publicKeyGetOut = await this.serviceExecutor.get(PublicKeyService, keyData)

		return this.getPublicKeyHash(publicKeyGetOut)
	}
}
