import { TranslationKey } from "../../misc/LanguageViewModel"
import { getCleanedMailAddress } from "../../misc/parsing/MailAddressParser"
import { KeyVerificationFacade, PublicKeyFingerprint } from "../../api/worker/facades/lazy/KeyVerificationFacade"
import { assertNotNull } from "@tutao/tutanota-utils"
import { KeyVerificationMethodType, KeyVerificationResultType, KeyVerificationSourceOfTruth } from "../../api/common/TutanotaConstants"
import { MobileSystemFacade } from "../../native/common/generatedipc/MobileSystemFacade"
import { KeyVerificationUsageTestUtils } from "./KeyVerificationUsageTestUtils"

export class KeyVerificationModel {
	mailAddress: string = ""
	publicKeyFingerprint: PublicKeyFingerprint | null = null
	result: KeyVerificationResultType | undefined

	// Relevant for the regret usage test only. Can be removed after testing is done.
	chosenMethod: KeyVerificationMethodType | null = null

	constructor(
		readonly keyVerificationFacade: KeyVerificationFacade,
		readonly mobileSystemFacade: MobileSystemFacade,
		readonly test: KeyVerificationUsageTestUtils,
	) {}

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

	public async loadFingerprintFromPublicKeyService(mailAddress: string) {
		this.publicKeyFingerprint = await this.keyVerificationFacade.getFingerprint(mailAddress, KeyVerificationSourceOfTruth.PublicKeyService)
		this.mailAddress = mailAddress
	}

	public getFingerprint(): string {
		return this.publicKeyFingerprint?.fingerprint ?? ""
	}

	public async trust() {
		const fingerprint = assertNotNull(this.publicKeyFingerprint)
		await this.keyVerificationFacade.trust(this.mailAddress, fingerprint.fingerprint, fingerprint.keyVersion, fingerprint.keyPairType)
	}

	public async handleMethodSwitchForUsageTest(newMethod: KeyVerificationMethodType) {
		if (this.chosenMethod != null && this.chosenMethod !== newMethod) {
			// user regrets their previous choice
			await this.test.regret()
		}

		this.chosenMethod = newMethod
	}
}
