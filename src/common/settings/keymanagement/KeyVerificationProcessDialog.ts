import { Dialog } from "../../gui/base/Dialog"
import { lang, TranslationKey } from "../../misc/LanguageViewModel"
import { getCleanedMailAddress } from "../../misc/parsing/MailAddressParser"
import { KeyVerificationFacade } from "../../api/worker/facades/lazy/KeyVerificationFacade"
import m, { Children } from "mithril"
import { TextField, TextFieldType } from "../../gui/base/TextField"
import { KeyVerificationProcessModel } from "./KeyVerificationProcessModel"

export class KeyVerificationProcessDialog {
	keyVerificationFacade: KeyVerificationFacade
	model: KeyVerificationProcessModel
	reloadParent: () => Promise<void>

	constructor(keyVerificationFacade: KeyVerificationFacade, model: KeyVerificationProcessModel, reloadParent: () => Promise<void>) {
		this.keyVerificationFacade = keyVerificationFacade
		this.model = model
		this.reloadParent = reloadParent
	}

	show() {
		const obj = this

		Dialog.showActionDialog({
			title: lang.get("keyManagement.verifyMailAddress_action"),
			child: {
				view: () => this.render(),
			},
			validator: () => this.validateInputs(),
			allowOkWithReturn: true,
			okAction: async (dialog: Dialog) => {
				await this.keyVerificationFacade.addToPool(this.model.mailAddress, this.model.fingerprint)

				dialog.close()
				obj.reloadParent()
			},
		})
	}

	render(): Children {
		return [
			m(TextField, {
				label: "mailAddress_label",
				value: this.model.mailAddress,
				type: TextFieldType.Email,
				oninput: (newValue) => (this.model.mailAddress = newValue),
			}),
			m(TextField, {
				label: "keyManagement.fingerprint_label",
				value: this.model.fingerprint,
				type: TextFieldType.Email,
				oninput: (newValue) => (this.model.fingerprint = newValue),
			}),
		]
	}

	private validateInputs(): TranslationKey | null {
		/* TODO:
		Properly validate mail address. Only Tuta domains are reasonable for this problem space
		so only those should be considered valid. */

		// validate email address (syntactically)
		if (getCleanedMailAddress(this.model.mailAddress) == null) {
			return "mailAddressInvalid_msg"
		}

		// validate fingerprint (syntactically): it's expected to be a 64-char hex digest
		const fingerprintRegex = /^[0-9a-f]{64}$/
		if (!fingerprintRegex.test(this.model.fingerprint)) {
			return "keyManagement.invalidFingerprint_msg"
		}

		return null // null means OK
	}
}
