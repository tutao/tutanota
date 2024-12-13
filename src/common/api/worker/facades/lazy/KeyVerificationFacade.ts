import { assertWorkerOrNode } from "../../../common/Env"
import { createPublicKeyGetIn, PublicKeyGetOut } from "../../../entities/sys/TypeRefs"
import { KeyVerificationSourceOfTruth, PublicKeyIdentifierType } from "../../../common/TutanotaConstants"
import { PublicKeyService } from "../../../entities/sys/Services"
import { assertNotNull, concat, stringToUtf8Uint8Array, uint8ArrayToHex } from "@tutao/tutanota-utils"
import { sha256Hash } from "@tutao/tutanota-crypto"
import { IServiceExecutor } from "../../../common/ServiceRequest"
import { NotFoundError } from "../../../common/error/RestError"
import { SqlCipherFacade } from "../../../../native/common/generatedipc/SqlCipherFacade"
import { sql } from "../../offline/Sql"

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
	 * Returns all trusted identities, including fresh information if they are still valid.
	 * TODO: Does this scale?
	 */
	async getTrustedIdentities(): Promise<Map<MailAddress, KeyVerificationDetails>> {
		const result = await this.sqlCipherFacade.all(`SELECT * FROM trusted_identities`, [])

		const identities = new Map<MailAddress, KeyVerificationDetails>()
		for (let [_, { mailAddress, fingerprint }] of result.entries()) {
			const mailAddressStr = mailAddress.value as string
			const fingerprintStr = fingerprint.value as string

			identities.set(mailAddressStr, {
				fingerprint: fingerprintStr,
				verified: await this.confirmFingerprint(mailAddressStr, fingerprintStr, KeyVerificationSourceOfTruth.PublicKeyService),
			})
		}

		return identities
	}

	/**
	 * Adds an identity to the trust database.
	 */
	async trust(mailAddress: string, fingerprint: string) {
		/* Insert or update mailAddress / fingerprint */
		const { query, params } = sql`
			INSERT INTO trusted_identities (mailAddress, fingerprint)
			VALUES (${mailAddress}, ${fingerprint})
			ON CONFLICT(mailAddress) DO UPDATE SET mailAddress=excluded.mailAddress, fingerprint=excluded.fingerprint`
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
	async getFingerprint(mailAddress: string, sourceOfTruth: KeyVerificationSourceOfTruth): Promise<string | null> {
		if (sourceOfTruth === KeyVerificationSourceOfTruth.LocalTrusted) {
			const { query, params } = sql`SELECT fingerprint FROM trusted_identities WHERE mailAddress = ${mailAddress}`
			const result = await this.sqlCipherFacade.get(query, params)

			if (result == null) {
				return null
			} else {
				// TODO: Find a safer way than `result.fingerprint.value as string`
				return result.fingerprint.value as string
			}
		} else if (sourceOfTruth === KeyVerificationSourceOfTruth.PublicKeyService) {
			const keyData = createPublicKeyGetIn({
				identifier: mailAddress,
				identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,

				// Fetch the latest version
				version: null,
			})

			const publicKeyGetOut = await this.serviceExecutor.get(PublicKeyService, keyData)
			return this.calculateFingerprint(publicKeyGetOut)
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
	async confirmFingerprint(mailAddress: string, expectedFingerprint: string, sourceOfTruth: KeyVerificationSourceOfTruth): Promise<boolean> {
		if (sourceOfTruth === KeyVerificationSourceOfTruth.LocalTrusted) {
			const trustedFingerprint = await this.getFingerprint(mailAddress, KeyVerificationSourceOfTruth.LocalTrusted)
			return trustedFingerprint === expectedFingerprint
		} else if (sourceOfTruth === KeyVerificationSourceOfTruth.PublicKeyService) {
			try {
				const serverFingerprint = await this.getFingerprint(mailAddress, KeyVerificationSourceOfTruth.PublicKeyService)
				return serverFingerprint === expectedFingerprint
			} catch (e) {
				if (e instanceof NotFoundError) {
					// TODO: It might be better if NotFoundError resulted in a visible user message.
					return false
				} else {
					throw e
				}
			}

			// TODO: differentiate return value by
			// - Identity IS trusted AND verified
			// - Identity IS trusted BUT NOT verified
			// - Identity IS NOT trusted
		} else {
			// We should never run into this condition.
			assertNotNull(null)

			// make TypeScript happy
			return false
		}
	}

	/**
	 * Returns a hashed concatenation of the given public keys.
	 */
	public calculateFingerprint(publicKeyGetOut: PublicKeyGetOut): string {
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
		return hash
	}
}
