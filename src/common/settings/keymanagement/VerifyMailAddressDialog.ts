import { Dialog } from "../../gui/base/Dialog"
import { lang, TranslationKey } from "../../misc/LanguageViewModel"
import { TextField, TextFieldType } from "../../gui/base/TextField"
import m from "mithril"
import { getCleanedMailAddress } from "../../misc/parsing/MailAddressParser"
import { KeyVerificationFacade } from "../../api/worker/facades/lazy/KeyVerificationFacade"

export class VerifyMailAddressDialog {
	keyVerificationFacade: KeyVerificationFacade
	afterOk: () => Promise<void>

	constructor(keyVerificationFacade: KeyVerificationFacade, afterOk: () => Promise<void>) {
		this.keyVerificationFacade = keyVerificationFacade
		this.afterOk = afterOk
	}

	show() {
		const obj = this

		let mailAddress = ""
		let fingerprint = ""

		Dialog.showActionDialog({
			title: lang.get("keyManagement.verifyMailAddress_action"),
			child: {
				view: () => [
					m(TextField, {
						label: "mailAddress_label",
						value: mailAddress,
						type: TextFieldType.Email,
						oninput: (newValue) => (mailAddress = newValue),
					}),
					m(TextField, {
						label: "keyManagement.fingerprint_label",
						value: fingerprint,
						type: TextFieldType.Email,
						oninput: (newValue) => (fingerprint = newValue),
					}),
				],
			},
			validator: () => this.validateInputs(mailAddress, fingerprint),
			allowOkWithReturn: true,
			okAction: async (dialog: Dialog) => {
				await this.keyVerificationFacade.addToPool(mailAddress, fingerprint)

				dialog.close()
				obj.afterOk()
			},
		})
	}

	private validateInputs(mailAddress: string, fingerprint: string): TranslationKey | null {
		/* TODO:
		Properly validate mail address. Only Tuta domains are reasonable for this problem space
		so only those should be considered valid. */

		// validate email address (syntactically)
		if (getCleanedMailAddress(mailAddress) == null) {
			return "mailAddressInvalid_msg"
		}

		// validate fingerprint (syntactically): it's expected to be a 64-char hex digest
		const fingerprintRegex = /^[0-9a-f]{64}$/
		if (!fingerprintRegex.test(fingerprint)) {
			return "keyManagement.invalidFingerprint_msg"
		}

		return null // null means OK
	}
}
