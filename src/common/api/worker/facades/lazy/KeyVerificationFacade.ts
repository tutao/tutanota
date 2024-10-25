import { assertWorkerOrNode } from "../../../common/Env"
import { createPublicKeyGetIn } from "../../../entities/sys/TypeRefs"
import { PublicKeyIdentifierType } from "../../../common/TutanotaConstants"
import { PublicKeyService } from "../../../entities/sys/Services"
import { assertNotNull, concat, stringToUtf8Uint8Array, uint8ArrayToHex } from "@tutao/tutanota-utils"
import { sha256Hash } from "@tutao/tutanota-crypto"
import { IServiceExecutor } from "../../../common/ServiceRequest"

assertWorkerOrNode()

// TODO: does this type exist anywhere else maybe?
export type MailAddress = string

export interface KeyVerificationDetails {
	fingerprint: string
	verified: boolean
}

export class KeyVerificationFacade {
	/**
	 * Mail addresses in this pool are eligible for key verification.
	 * For each address, this pool keeps track of its fingerprint and
	 * verification status (the "details").
	 */
	verificationPool = new Map<MailAddress, KeyVerificationDetails>()

	serviceExecutor: IServiceExecutor

	constructor(serviceExecutor: IServiceExecutor) {
		this.serviceExecutor = serviceExecutor

		// TODO: this should not be hardcoded
		this.verificationPool.set("freepancakes@tutanota.com", {
			fingerprint: "a69589448040836f526eb01263605b2c2d58b849f796ab1ee96e4bd87010e849",
			verified: false,
		})
	}

	async recheckPoolEntries(): Promise<void> {
		console.log("recheckPoolEntries: Heads-up! This method might make lots of requests, depending on pool size.")
		console.log("recheckPoolEntries: Do you really need to call this method or would recheckPoolEntry() be sufficient?")

		const addresses = this.verificationPool.keys()
		for (let address of addresses) {
			await this.recheckPoolEntry(address)
		}
	}

	async recheckPoolEntry(mailAddress: string): Promise<void> {
		const details = this.verificationPool.get(mailAddress)
		if (details === undefined) {
			return
		}

		const verified = await this.confirmFingerprint(mailAddress, details.fingerprint)
		details.verified = verified

		this.verificationPool.set(mailAddress, details)
	}

	async confirmFingerprint(mailAddress: string, expectedFingerprint: string): Promise<boolean> {
		const serverFingerprint = await this.getPublicKeyHash(mailAddress)
		return Promise.resolve(serverFingerprint === expectedFingerprint)
	}

	async getPool(): Promise<Map<MailAddress, KeyVerificationDetails>> {
		await this.recheckPoolEntries()
		return Promise.resolve(this.verificationPool)
	}

	async addToPool(mailAddress: string, fingerprint: string) {
		this.verificationPool.set(mailAddress, { fingerprint: fingerprint, verified: false })

		await this.recheckPoolEntries()
		return Promise.resolve()
	}

	async removeFromPool(mailAddress: string) {
		this.verificationPool.delete(mailAddress)

		await this.recheckPoolEntries()
		return Promise.resolve()
	}

	async isVerified(mailAddress: string): Promise<boolean> {
		await this.recheckPoolEntry(mailAddress)

		// address is considered "not verified" when not a member of the pool
		const verified = this.verificationPool.get(mailAddress)?.verified ?? false
		return Promise.resolve(verified)
	}

	/**
	 * Returns a hashed concatenation of public keys associated with a given mail address
	 */
	public async getPublicKeyHash(mailAddress: string): Promise<string> {
		const keyData = createPublicKeyGetIn({
			identifier: mailAddress,
			identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,

			// Fetch the latest version
			version: null,
		})
		const publicKeyGetOut = await this.serviceExecutor.get(PublicKeyService, keyData)

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
}
