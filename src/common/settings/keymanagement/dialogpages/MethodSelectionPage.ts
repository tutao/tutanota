import m, { Children, Component, Vnode } from "mithril"
import { KeyVerificationMethodType } from "../../../api/common/TutanotaConstants"
import { RadioSelectorOption } from "../../../gui/base/RadioSelector"
import { lang, MaybeTranslation } from "../../../misc/LanguageViewModel"
import { SectionButton } from "../../../gui/base/buttons/SectionButton"
import { px, size } from "../../../gui/size"
import { Card } from "../../../gui/base/Card"

type MethodSelectionPageAttrs = {
	goToEmailInputPage: () => void
	goToQrScanPage: () => void
}

const DEFAULT_HEIGHT = 666

export class MethodSelectionPage implements Component<MethodSelectionPageAttrs> {
	view(vnode: Vnode<MethodSelectionPageAttrs>): Children {
		const makeOption = (name: MaybeTranslation, value: KeyVerificationMethodType): RadioSelectorOption<KeyVerificationMethodType> => ({
			name,
			value,
		})

		return m(
			".pt.pb.flex.col.gap-vpad",
			{
				style: {
					height: px(DEFAULT_HEIGHT),
				},
			},
			m(
				Card,
				{ shouldDivide: true },

				m(
					"section.pt-s.pb-s",
					{
						style: {
							padding: px(size.vpad_small),
						},
					},
					[
						m(".h4.mb-0.pl-vpad-s", lang.get("keyManagement.selectMethodShort_label")),
						m("p.mt-xs.mb-s.pl-vpad-s", lang.get("keyManagement.selectMethodLong_label")),
					],
				),
				[this.renderTextMethodButton(() => vnode.attrs.goToEmailInputPage()), this.renderQRMethodButton(() => vnode.attrs.goToQrScanPage())],
			),
		)
	}

	private renderTextMethodButton(onclick: () => void): Children {
		return m(SectionButton, {
			text: "keyManagement.text_label",
			classes: "pl-vpad-s",
			onclick,
		})
	}

	private renderQRMethodButton(onclick: () => void): Children {
		return m(SectionButton, {
			text: "keyManagement.qrCode_label",
			classes: "pl-vpad-s",
			onclick,
		})
	}
}
