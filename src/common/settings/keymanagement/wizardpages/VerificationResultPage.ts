import { WizardPageAttrs, WizardPageN } from "../../../gui/base/WizardDialog"
import { KeyVerificationWizardData } from "../KeyVerificationWizard"
import m, { Children, Vnode } from "mithril"
import { KeyVerificationMethodType, KeyVerificationResultType } from "../../../api/common/TutanotaConstants"
import { lang } from "../../../misc/LanguageViewModel"
import { KeyVerificationWizardPage } from "../KeyVerificationWizardPage"

export class VerificationResultPage implements WizardPageN<KeyVerificationWizardData> {
	view(vnode: Vnode<WizardPageAttrs<KeyVerificationWizardData>>): Children {
		const { method, mailAddress, fingerprint, result } = vnode.attrs.data
		const { keyVerificationFacade, reloadParent } = vnode.attrs.data

		if (method === KeyVerificationMethodType.text) {
			return m(
				KeyVerificationWizardPage,
				{ nextButtonLabel: "finish_action" },
				m(
					"p",
					"The following contact has been verified:", // TODO: translate
				),
				m("p.b.center", mailAddress),
				m("hr"),
				m(".small.text-break.monospace", fingerprint),
			)
		} else if (method === KeyVerificationMethodType.qr) {
			if (result === KeyVerificationResultType.QR_OK) {
				return m(
					KeyVerificationWizardPage,
					{
						nextButtonLabel: () => "Mark as verified" /* TODO: translate */,
						beforeNextPageHook: async () => {
							await keyVerificationFacade.addToPool(mailAddress, fingerprint)
							await reloadParent()
							return true
						},
					},
					m(
						"p",
						'Press "Mark as verified" to confirm that you trust:', // TODO: translate
					),
					m("p.b.center", mailAddress),
					m("hr"),
					m(".small.text-break.monospace", fingerprint),
				)
			} else if (result === KeyVerificationResultType.QR_FAIL) {
				return m(KeyVerificationWizardPage, { nextButtonLabel: "finish_action" }, m("p", lang.get("keyManagement.invalidQrCode_msg")))
			}
		}
	}
}

export class VerificationResultPageAttrs implements WizardPageAttrs<KeyVerificationWizardData> {
	data: KeyVerificationWizardData

	constructor(data: KeyVerificationWizardData) {
		this.data = data
	}

	headerTitle(): string {
		const { method } = this.data

		if (method === KeyVerificationMethodType.text) {
			return "Text-based verification" // TODO: translate
		} else if (method === KeyVerificationMethodType.qr) {
			return "QR-code verification" // TODO: translate
		} else {
			return ""
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
