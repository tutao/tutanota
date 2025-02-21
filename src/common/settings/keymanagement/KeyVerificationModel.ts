import { TranslationKey } from "../../misc/LanguageViewModel"
import { getCleanedMailAddress } from "../../misc/parsing/MailAddressParser"

export class KeyVerificationModel {
	mailAddress: string = ""

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
}
