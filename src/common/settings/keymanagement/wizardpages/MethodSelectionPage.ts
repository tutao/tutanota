import { WizardPageAttrs, WizardPageN } from "../../../gui/base/WizardDialog"
import { KeyVerificationWizardData } from "../KeyVerificationWizard"
import m, { Children, Vnode, VnodeDOM } from "mithril"
import { KeyVerificationMethodType } from "../../../api/common/TutanotaConstants"
import { RadioSelector, type RadioSelectorAttrs, RadioSelectorOption } from "../../../gui/base/RadioSelector"
import { TranslationText } from "../../../misc/LanguageViewModel"
import { KeyVerificationWizardPage } from "../KeyVerificationWizardPage"

export class MethodSelectionPage implements WizardPageN<KeyVerificationWizardData> {
	private dom: HTMLElement | null = null

	oncreate(vnode: VnodeDOM<WizardPageAttrs<KeyVerificationWizardData>>) {
		this.dom = vnode.dom as HTMLElement
	}

	view(vnode: Vnode<WizardPageAttrs<KeyVerificationWizardData>>): Children {
		const makeOption = (name: TranslationText, value: KeyVerificationMethodType): RadioSelectorOption<KeyVerificationMethodType> => ({
			name,
			value,
		})

		const options = [
			makeOption(() => "Text", KeyVerificationMethodType.text), // TODO: translate
			makeOption(() => "QR code", KeyVerificationMethodType.qr), // TODO: translate
		] as const

		return m(
			KeyVerificationWizardPage,
			{},
			m(
				"p",
				"This would be a good place to explain how this process works and ",
				"guide the user to some resources that might help them pick the right method. ",
				"We could also display a cute little graphic. Test test 123 blah blah blah.",
			), // TODO: translate
			m(RadioSelector, {
				name: () => "Select a verification method",
				options,
				selectedOption: vnode.attrs.data.method,
				onOptionSelected: (methodType: KeyVerificationMethodType) => {
					vnode.attrs.data.method = methodType
				},
			} satisfies RadioSelectorAttrs<KeyVerificationMethodType>),
		)
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
