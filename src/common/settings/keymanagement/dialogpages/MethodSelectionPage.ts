import m, { Children, Component, Vnode } from "mithril"
import { KeyVerificationMethodType } from "../../../api/common/TutanotaConstants"
import { RadioSelectorOption } from "../../../gui/base/RadioSelector"
import { MaybeTranslation } from "../../../misc/LanguageViewModel"
import { SectionButton } from "../../../gui/base/buttons/SectionButton"
import { px } from "../../../gui/size"

type MethodSelectionPageAttrs = {
	goToEmailInputPage: () => void
	goToQrScanPage: () => void
}

const DEFAULT_HEIGHT = 666

export class MethodSelectionPage implements Component<MethodSelectionPageAttrs> {
	private dom: HTMLElement | null = null

	view(vnode: Vnode<MethodSelectionPageAttrs>): Children {
		const makeOption = (name: MaybeTranslation, value: KeyVerificationMethodType): RadioSelectorOption<KeyVerificationMethodType> => ({
			name,
			value,
		})

		return m(
			"",
			{
				style: {
					height: px(DEFAULT_HEIGHT),
				},
			},
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

//     headerTitle(): MaybeTranslation {
//         return "keyManagement.selectMethodShort_label"
//     }
