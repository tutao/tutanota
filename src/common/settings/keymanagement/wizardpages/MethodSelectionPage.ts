import m, { Children, Component, Vnode } from "mithril"
import { KeyVerificationMethodType } from "../../../api/common/TutanotaConstants"
import { RadioSelectorOption } from "../../../gui/base/RadioSelector"
import { MaybeTranslation } from "../../../misc/LanguageViewModel"
import { SectionButton } from "../../../gui/base/buttons/SectionButton"

type MethodSelectionPageAttrs = {
	goToEmailInputPage: () => void
	goToQrScanPage: () => void
}

export class MethodSelectionPage implements Component<MethodSelectionPageAttrs> {
	private dom: HTMLElement | null = null

	// oncreate(vnode: VnodeDOM<WizardPageAttrs<MethodSelectionPageAttrs>>) {
	//     this.dom = vnode.dom as HTMLElement
	// }

	view(vnode: Vnode<MethodSelectionPageAttrs>): Children {
		const makeOption = (name: MaybeTranslation, value: KeyVerificationMethodType): RadioSelectorOption<KeyVerificationMethodType> => ({
			name,
			value,
		})

		return m(
			"",
			{},
			m(
				"p",
				"This would be a good place to explain how this process works and ",
				"guide the user to some resources that might help them pick the right method. ",
				"We could also display a cute little graphic. Test test 123 blah blah blah.",
			), // TODO: translate
			this.renderTextMethodButton(() => vnode.attrs.goToEmailInputPage()),
			this.renderQRMethodButton(() => vnode.attrs.goToQrScanPage()),
		)
	}

	private renderTextMethodButton(onclick: () => void): Children {
		return m(SectionButton, {
			text: "keyManagement.text_label",
			onclick,
		})
	}

	private renderQRMethodButton(onclick: () => void): Children {
		return m(SectionButton, {
			text: "keyManagement.qrCode_label",
			onclick,
		})
	}
}

// export class MethodSelectionPageAttrs implements WizardPageAttrs<KeyVerificationWizardData> {
//     data: KeyVerificationWizardData
//
//     constructor(data: KeyVerificationWizardData) {
//         this.data = data
//     }
//
//     headerTitle(): MaybeTranslation {
//         return "keyManagement.selectMethodShort_label"
//     }
//
//     isEnabled(): boolean {
//         return true
//     }
//
//     isSkipAvailable(): boolean {
//         return false
//     }
//
//     nextAction(showErrorDialog: boolean): Promise<boolean> {
//         return Promise.resolve(true)
//     }
// }
