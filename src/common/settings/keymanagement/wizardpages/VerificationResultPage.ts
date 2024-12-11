import { WizardPageAttrs, WizardPageN } from "../../../gui/base/WizardDialog"
import { KeyVerificationWizardData } from "../KeyVerificationWizard"
import m, { Children, Vnode, VnodeDOM } from "mithril"
import { KeyVerificationMethodType, KeyVerificationResultType } from "../../../api/common/TutanotaConstants"
import { lang } from "../../../misc/LanguageViewModel"
import { KeyVerificationWizardPage } from "../KeyVerificationWizardPage"

export class VerificationResultPage implements WizardPageN<KeyVerificationWizardData> {
	private dom: HTMLElement | null = null
	private contactFingerprint: string | null = null

	oncreate(vnode: VnodeDOM<WizardPageAttrs<KeyVerificationWizardData>>) {
		this.dom = vnode.dom as HTMLElement
	}

	view(vnode: Vnode<WizardPageAttrs<KeyVerificationWizardData>>): Children {
		if (vnode.attrs.data.method === KeyVerificationMethodType.text) {
			const contactFingerprint = vnode.attrs.data.fingerprint
			return m(
				KeyVerificationWizardPage,
				{ nextButtonLabel: "finish_action" },
				m(
					"p",
					"The following contact has been verified:", // TODO: translate
				),
				m("p.b.center", vnode.attrs.data.mailAddress),
				m("hr"),
				m(".small.text-break.monospace", contactFingerprint),
			)
		} else if (vnode.attrs.data.method === KeyVerificationMethodType.qr) {
			const result = vnode.attrs.data.result
			const contactFingerprint = vnode.attrs.data.fingerprint

			if (result === KeyVerificationResultType.SUCCESS) {
				return m(
					KeyVerificationWizardPage,
					{
						nextButtonLabel: () => "Mark as verified" /* TODO: translate */,
						beforeNextPageHook: async () => {
							await vnode.attrs.data.keyVerificationFacade.addToPool(vnode.attrs.data.mailAddress, vnode.attrs.data.fingerprint)
							await vnode.attrs.data.reloadParent()
							return true
						},
					},
					m(
						"p",
						'Press "Mark as verified" to confirm that you trust:', // TODO: translate
					),
					m("p.b.center", vnode.attrs.data.mailAddress),
					m("hr"),
					m(".small.text-break.monospace", contactFingerprint),
				)
			} else if (result === KeyVerificationResultType.FAIL_QR) {
				return m(KeyVerificationWizardPage, { nextButtonLabel: "finish_action" }, m("p", lang.get("keyManagement.invalidQrCode_msg")))
			}
		}
	}
}

export class VerificationResultPageAttrs implements WizardPageAttrs<KeyVerificationWizardData> {
	data: KeyVerificationWizardData

	// The process is done. We explicitly do not want the user to go back.
	//readonly preventGoBack?: boolean = true

	constructor(data: KeyVerificationWizardData) {
		this.data = data
	}

	headerTitle(): string {
		if (this.data.method === KeyVerificationMethodType.text) {
			return "Text-based verification" // TODO: translate
		} else if (this.data.method === KeyVerificationMethodType.qr) {
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
