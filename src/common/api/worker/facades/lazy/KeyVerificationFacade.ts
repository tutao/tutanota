import { assertWorkerOrNode } from "../../../common/Env"

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

	constructor() {
		// TODO: this should not be hardcoded
		this.verificationPool.set("freepancakes@tutanota.com", {
			fingerprint: "a69589448040836f526eb01263605b2c2d58b849f796ab1ee96e4bd87010e849",
			verified: false,
		})
	}

	async getPool(): Promise<Map<MailAddress, KeyVerificationDetails>> {
		return Promise.resolve(this.verificationPool)
	}

	async addToPool(mailAddress: string, fingerprint: string) {
		this.verificationPool.set(mailAddress, { fingerprint: fingerprint, verified: false })
		return Promise.resolve()
	}

	async removeFromPool(mailAddress: string) {
		this.verificationPool.delete(mailAddress)
		return Promise.resolve()
	}
}
