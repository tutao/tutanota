import { emitWizardEvent, WizardEventType, WizardPageAttrs, WizardPageN } from "../../../gui/base/WizardDialog"
import { KeyVerificationWizardData } from "../KeyVerificationWizard"
import m, { Children, Vnode, VnodeDOM } from "mithril"
import { LoginButton } from "../../../gui/base/buttons/LoginButton"
import { KeyVerificationResultType } from "../../../api/common/TutanotaConstants"
import { lang } from "../../../misc/LanguageViewModel"

export class VerificationResultPage implements WizardPageN<KeyVerificationWizardData> {
	private dom: HTMLElement | null = null

	oncreate(vnode: VnodeDOM<WizardPageAttrs<KeyVerificationWizardData>>) {
		this.dom = vnode.dom as HTMLElement
	}

	view(vnode: Vnode<WizardPageAttrs<KeyVerificationWizardData>>): Children {
		const result = vnode.attrs.data.result
		const doneButton = m(LoginButton, {
			label: () => "Done", // TODO: translate,
			onclick: () => {
				emitWizardEvent(this.dom, WizardEventType.CLOSE_DIALOG)
			},
		})

		if (result === KeyVerificationResultType.SUCCESS) {
			return m(
				".mb",
				m(
					"p",
					"The following contact has been pinned for verification:", // TODO: translate
				),
				m("p.b.center", vnode.attrs.data.mailAddress),
				m(
					"p",
					"Please look at the list and make sure there is a tick next to the contact.",
					"(Maybe we could already tell the user about the result here?)", // TODO: translate
				),
				doneButton,
			)
		} else if (result === KeyVerificationResultType.FAIL_TEXT) {
			/* For now there is no way that FAIL_TEXT can be issued. */
			return "FAIL_TEXT"
		} else if (result === KeyVerificationResultType.FAIL_QR) {
			return m(".mb", m("p", lang.get("keyManagement.invalidQrCode_msg")), doneButton)
		} else {
			return m(".mb", m("p", "No result type has been assigned. Please report."), doneButton)
		}
	}
}

export class VerificationResultPageAttrs implements WizardPageAttrs<KeyVerificationWizardData> {
	data: KeyVerificationWizardData

	// The process is done. We explicitly do not want the user to go back.
	readonly preventGoBack?: boolean = true

	constructor(data: KeyVerificationWizardData) {
		this.data = data
	}

	headerTitle(): string {
		if (this.data.result === KeyVerificationResultType.SUCCESS) {
			return "Verification succeeded" // TODO: translate
		} else {
			return "Verification failed"
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
