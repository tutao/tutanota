import type { KeyVerificationFacade } from "../../api/worker/facades/lazy/KeyVerificationFacade"

export class FingerprintMismatchRecoverModel {
	constructor(private readonly keyVerificationFacade: KeyVerificationFacade, private readonly address: string) {}

	async deleteTrustedKey() {
		await this.keyVerificationFacade.untrust(this.address)
	}

	getAddress() {
		return this.address
	}
}
