import { WizardPageAttrs, WizardPageN } from "../../../gui/base/WizardDialog"
import { KeyVerificationWizardData } from "../KeyVerificationWizard"
import m, { Children, Vnode } from "mithril"
import { KeyVerificationMethodType, KeyVerificationResultType } from "../../../api/common/TutanotaConstants"
import { lang, MaybeTranslation, TranslationKey } from "../../../misc/LanguageViewModel"
import { KeyVerificationWizardPage } from "../KeyVerificationWizardPage"
import { assertNotNull } from "@tutao/tutanota-utils"

export class VerificationResultPage implements WizardPageN<KeyVerificationWizardData> {
	view(vnode: Vnode<WizardPageAttrs<KeyVerificationWizardData>>): Children {
		const { method, mailAddress, publicKeyFingerprint, result } = vnode.attrs.data
		const { keyVerificationFacade, reloadParent } = vnode.attrs.data

		if (method === KeyVerificationMethodType.text) {
			return m(
				KeyVerificationWizardPage,
				{ nextButtonLabel: lang.getTranslation("finish_action") },
				m("p", lang.get("keyManagement.contactVerificationConfirmation_label")),
				m("p.b.center", mailAddress),
				m("hr"),
				m(".small.text-break.monospace", publicKeyFingerprint?.fingerprint),
			)
		} else if (method === KeyVerificationMethodType.qr) {
			if (result === KeyVerificationResultType.QR_OK) {
				const fingerprint = assertNotNull(publicKeyFingerprint)

				return m(
					KeyVerificationWizardPage,
					{
						nextButtonLabel: lang.getTranslation("keyManagement.markAsVerified_action"),
						beforeNextPageHook: async () => {
							await keyVerificationFacade.trust(mailAddress, fingerprint.fingerprint, fingerprint.keyVersion, fingerprint.keyPairType)
							await reloadParent()
							return true
						},
					},
					m(
						"p",
						lang.get("keyManagement.markAsVerifiedSuggestion_label", {
							"{action_label}": lang.get("keyManagement.markAsVerified_action"),
						}),
					),
					m("p.b.center", mailAddress),
					m("hr"),
					m(".small.text-break.monospace", fingerprint.fingerprint),
				)
			} else {
				let message: TranslationKey

				if (result === KeyVerificationResultType.QR_MALFORMED_PAYLOAD) {
					message = "keyManagement.qrCodeInvalid_msg"
				} else if (result === KeyVerificationResultType.QR_MAIL_ADDRESS_NOT_FOUND) {
					message = "keyManagement.qrMailAddressNotFound_msg"
				} else if (result === KeyVerificationResultType.QR_FINGERPRINT_MISMATCH) {
					message = "keyManagement.qrFingerprintMismatch_msg"
				} else {
					message = "keyManagement.qrCodeInvalid_msg"
				}

				return m(KeyVerificationWizardPage, { nextButtonLabel: lang.getTranslation("finish_action") }, m("p", lang.get(message)))
			}
		}
	}
}

export class VerificationResultPageAttrs implements WizardPageAttrs<KeyVerificationWizardData> {
	data: KeyVerificationWizardData

	constructor(data: KeyVerificationWizardData) {
		this.data = data
	}

	headerTitle(): MaybeTranslation {
		const { method } = this.data

		if (method === KeyVerificationMethodType.text) {
			return "keyManagement.textVerification_label"
		} else if (method === KeyVerificationMethodType.qr) {
			return "keyManagement.qrVerification_label"
		} else {
			return "keyManagement.keyVerification_label"
		}
	}

	isEnabled(): boolean {
		return true
	}

	isSkipAvailable(): boolean {
		return false
	}

	nextAction(showErrorDialog: boolean): Promise<boolean> {
		return Promise.resolve(true)
	}
}
