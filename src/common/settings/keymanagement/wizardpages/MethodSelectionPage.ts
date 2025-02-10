import { WizardPageAttrs, WizardPageN } from "../../../gui/base/WizardDialog"
import { KeyVerificationWizardData } from "../KeyVerificationWizard"
import m, { Children, Vnode, VnodeDOM } from "mithril"
import { KeyVerificationMethodType } from "../../../api/common/TutanotaConstants"
import { RadioSelector, type RadioSelectorAttrs, RadioSelectorOption } from "../../../gui/base/RadioSelector"
import { MaybeTranslation } from "../../../misc/LanguageViewModel"
import { KeyVerificationWizardPage } from "../KeyVerificationWizardPage"
import { completeStageNow } from "./KeyVerificationWizardUtils"

export class MethodSelectionPage implements WizardPageN<KeyVerificationWizardData> {
	private dom: HTMLElement | null = null

	oncreate(vnode: VnodeDOM<WizardPageAttrs<KeyVerificationWizardData>>) {
		this.dom = vnode.dom as HTMLElement
	}

	view(vnode: Vnode<WizardPageAttrs<KeyVerificationWizardData>>): Children {
		const makeOption = (name: MaybeTranslation, value: KeyVerificationMethodType): RadioSelectorOption<KeyVerificationMethodType> => ({
			name,
			value,
		})

		const options = [
			makeOption("keyManagement.text_label", KeyVerificationMethodType.text),
			makeOption("keyManagement.qrCode_label", KeyVerificationMethodType.qr),
		] as const

		return m(
			KeyVerificationWizardPage,
			{
				beforeNextPageHook: async () => {
					const usageTest = vnode.attrs.data.usageTest
					const stageNumber = vnode.attrs.data.method === KeyVerificationMethodType.text ? 1 : 2
					const stage = usageTest.getStage(stageNumber)
					await completeStageNow(stage)
					return true
				},
			},
			m(
				"p",
				"This would be a good place to explain how this process works and ",
				"guide the user to some resources that might help them pick the right method. ",
				"We could also display a cute little graphic. Test test 123 blah blah blah.",
			), // TODO: translate
			m(RadioSelector, {
				name: "keyManagement.selectMethodLong_label",
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

	headerTitle(): MaybeTranslation {
		return "keyManagement.selectMethodShort_label"
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
