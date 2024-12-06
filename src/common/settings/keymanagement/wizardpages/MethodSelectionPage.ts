import { emitWizardEvent, WizardEventType, WizardPageAttrs, WizardPageN } from "../../../gui/base/WizardDialog"
import { KeyVerificationWizardData } from "../KeyVerificationWizard"
import m, { Children, Vnode, VnodeDOM } from "mithril"
import { KeyVerificationMethodType } from "../../../api/common/TutanotaConstants"
import { LoginButton } from "../../../gui/base/buttons/LoginButton"

export class MethodSelectionPage implements WizardPageN<KeyVerificationWizardData> {
	private dom: HTMLElement | null = null

	oncreate(vnode: VnodeDOM<WizardPageAttrs<KeyVerificationWizardData>>) {
		this.dom = vnode.dom as HTMLElement
	}

	view(vnode: Vnode<WizardPageAttrs<KeyVerificationWizardData>>): Children {
		return [
			m(
				"p",
				"This would be a good place to explain how this process works and ",
				"guide the user to some resources that might help them pick the right method. ",
				"We could also display a cute little graphic. Test test 123 blah blah blah.",
			), // TODO: translate
			m(
				".pb",
				m(LoginButton, {
					label: () => "Text", // TODO: translate
					onclick: () => {
						vnode.attrs.data.method = KeyVerificationMethodType.text
						emitWizardEvent(this.dom as HTMLElement, WizardEventType.SHOW_NEXT_PAGE)
					},
				}),
			),
			m(
				".pb",
				m(LoginButton, {
					label: () => "QR code", // TODO: translate
					onclick: () => {
						vnode.attrs.data.method = KeyVerificationMethodType.qr
						emitWizardEvent(this.dom as HTMLElement, WizardEventType.SHOW_NEXT_PAGE)
					},
				}),
			),
		]
	}
}

export class MethodSelectionPageAttrs implements WizardPageAttrs<KeyVerificationWizardData> {
	data: KeyVerificationWizardData

	constructor(data: KeyVerificationWizardData) {
		this.data = data
	}

	headerTitle(): string {
		return "Select a method" // TODO: translate
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
