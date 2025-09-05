import m, { Children, Component, Vnode } from "mithril"
import { IdentityKeyVerificationMethod } from "../../../api/common/TutanotaConstants"
import { RadioSelectorOption } from "../../../gui/base/RadioSelector"
import { lang, MaybeTranslation } from "../../../misc/LanguageViewModel"
import { SectionButton } from "../../../gui/base/buttons/SectionButton"
import { px, size } from "../../../gui/size"
import { Card } from "../../../gui/base/Card"
import { KeyVerificationModel } from "../KeyVerificationModel"

type MethodSelectionPageAttrs = {
	model: KeyVerificationModel
	goToEmailInputPage: () => void
	goToQrScanPage: () => void
}

const DEFAULT_HEIGHT = 666

export class MethodSelectionPage implements Component<MethodSelectionPageAttrs> {
	view(vnode: Vnode<MethodSelectionPageAttrs>): Children {
		const model = vnode.attrs.model

		const makeOption = (name: MaybeTranslation, value: IdentityKeyVerificationMethod): RadioSelectorOption<IdentityKeyVerificationMethod> => ({
			name,
			value,
		})

		return m(
			".pt-16.pb-16.flex.col.gap-16",
			{
				style: {
					height: px(DEFAULT_HEIGHT),
				},
			},
			m(
				Card,
				{ shouldDivide: true },

				m(
					"section.pt-8.pb-8",
					{
						style: {
							padding: px(size.spacing_8),
						},
					},
					[
						m(".h4.mb-0.pl-8", lang.get("keyManagement.selectMethodShort_label")),
						m(
							"p.mt-4.mb-8.pl-8",
							m.trust(
								lang.get("keyManagement.selectMethodLong_label", {
									"{compareVerificationCode}": lang.get("keyManagement.text_label"),
								}),
							),
						),
					],
				),
				[
					this.renderTextMethodButton(async () => {
						await model.handleMethodSwitch(IdentityKeyVerificationMethod.text)
						vnode.attrs.goToEmailInputPage()
					}),
					this.renderQRMethodButton(async () => {
						await model.handleMethodSwitch(IdentityKeyVerificationMethod.qr)
						vnode.attrs.goToQrScanPage()
					}),
				],
			),
		)
	}

	private renderTextMethodButton(onclick: () => void): Children {
		return m(SectionButton, {
			text: "keyManagement.text_label",
			classes: "pl-8",
			onclick,
		})
	}

	private renderQRMethodButton(onclick: () => void): Children {
		return m(SectionButton, {
			text: "keyManagement.qrCode_label",
			classes: "pl-8",
			onclick,
		})
	}
}
