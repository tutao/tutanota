import { TranslationKey } from "../../misc/LanguageViewModel"
import { getCleanedMailAddress } from "../../misc/parsing/MailAddressParser"
import { KeyVerificationFacade, PublicKeyFingerprint } from "../../api/worker/facades/lazy/KeyVerificationFacade"
import { assertNotNull } from "@tutao/tutanota-utils"
import { KeyVerificationResultType, KeyVerificationSourceOfTruth } from "../../api/common/TutanotaConstants"
import { MobileSystemFacade } from "../../native/common/generatedipc/MobileSystemFacade"

export class KeyVerificationModel {
	mailAddress: string = ""
	publicKeyFingerprint: PublicKeyFingerprint | null = null
	result: KeyVerificationResultType | undefined

	constructor(readonly keyVerificationFacade: KeyVerificationFacade, readonly mobileSystemFacade: MobileSystemFacade) {}

	public validateMailAddress(mailAddress: string): TranslationKey | null {
		/* TODO:
        Properly validate mail address. Only Tuta domains are reasonable for this problem space
        so only those should be considered valid. */

		// validate email address (syntactically)
		if (getCleanedMailAddress(mailAddress) == null) {
			return "mailAddressInvalid_msg"
		}

		return null // null means OK
	}

	public async loadFingerprint(source: KeyVerificationSourceOfTruth) {
		this.publicKeyFingerprint = assertNotNull(await this.keyVerificationFacade.getFingerprint(this.mailAddress, source))
	}

	public getFingerprint(): string {
		return this.publicKeyFingerprint?.fingerprint ?? ""
	}

	public async trust() {
		const fingerprint = assertNotNull(this.publicKeyFingerprint)
		await this.keyVerificationFacade.trust(this.mailAddress, fingerprint.fingerprint, fingerprint.keyVersion, fingerprint.keyPairType)
	}
}
