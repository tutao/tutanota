import { assertWorkerOrNode } from "../../../common/Env"
import { CryptoFacade } from "../../crypto/CryptoFacade"

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

	cryptoFacade: CryptoFacade

	constructor(cryptoFacade: CryptoFacade) {
		this.cryptoFacade = cryptoFacade

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
		const serverFingerprint = await this.cryptoFacade.getPublicKeyHash(mailAddress)
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
}
