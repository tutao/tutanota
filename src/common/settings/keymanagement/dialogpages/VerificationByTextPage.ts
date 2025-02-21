import m, { Children, Component, Vnode } from "mithril"
import { TextFieldType } from "../../../gui/base/TextField"
import { MonospaceTextDisplay } from "../../../gui/base/MonospaceTextDisplay"
import { lang, TranslationKey } from "../../../misc/LanguageViewModel"
import { Card } from "../../../gui/base/Card"
import { SingleLineTextField } from "../../../gui/base/SingleLineTextField"
import { Icons } from "../../../gui/base/icons/Icons"
import { ButtonColor, getColors } from "../../../gui/base/Button"
import { LoginButton } from "../../../gui/base/buttons/LoginButton"
import { KeyVerificationModel } from "../KeyVerificationModel"
import { KeyVerificationSourceOfTruth } from "../../../api/common/TutanotaConstants"

type VerificationByTextPageAttrs = {
	model: KeyVerificationModel
}

export class VerificationByTextPage implements Component<VerificationByTextPageAttrs> {
	private fingerprintLoaded: boolean = false

	view(vnode: Vnode<VerificationByTextPageAttrs>): Children {
		const { model } = vnode.attrs

		const markAsVerifiedTranslationKey: TranslationKey = "keyManagement.markAsVerified_action"
		return m(".pt.pb.flex.col.gap-vpad", [
			m(Card, [
				m(
					"",
					m(".h4.mb-0", lang.get("keyManagement.textVerification_label")),
					m("p.mt-xs.mb-s", lang.get("keyManagement.verificationByTextMailAdress_label")),
				),
			]),
			m(
				Card,
				{
					style: { padding: "0" },
				},
				m(
					".flex.gap-vpad-s.items-center",
					m(SingleLineTextField, {
						ariaLabel: lang.get("mailAddress_label"),
						placeholder: lang.get("mailAddress_label"),
						disabled: false,
						leadingIcon: {
							icon: Icons.At,
							color: getColors(ButtonColor.Content).button,
						},
						value: model.mailAddress,
						type: TextFieldType.Text,

						oninput: async (newValue) => {
							model.mailAddress = newValue

							if (model.validateMailAddress(model.mailAddress) == null) {
								try {
									await model.loadFingerprint(KeyVerificationSourceOfTruth.PublicKeyService)
									this.fingerprintLoaded = true
								} catch (e) {
									// TODO recipient not found, maybe?
								}
							}
							m.redraw() // otherwise we get a very noticeable delay
						},
					}),
				),
			),
			!this.fingerprintLoaded
				? null
				: m(
						Card,
						m("", lang.get("keyManagement.verificationByText_label", { "{button}": lang.get(markAsVerifiedTranslationKey) })),
						m(MonospaceTextDisplay, {
							text: model.getFingerprint(),
							placeholder: lang.get("keyManagement.invalidMailAddress_msg"),
							chunkSize: 4,
							border: false,
						}),
				  ),
			m(
				".align-self-center.full-width",
				m(LoginButton, {
					label: markAsVerifiedTranslationKey,
					onclick: () => model.trust(), // TODO also go to results page
					disabled: !this.fingerprintLoaded,
				}),
			),
		])
	}
}
