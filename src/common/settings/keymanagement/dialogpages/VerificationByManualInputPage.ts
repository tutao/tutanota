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
import { Icon } from "../../../gui/base/Icon"
import { theme } from "../../../gui/theme"
import { debounce } from "@tutao/tutanota-utils"
import { KeyVerificationMethodType } from "../../../api/common/TutanotaConstants"

type VerificationByTextPageAttrs = {
	model: KeyVerificationModel
	goToSuccessPage: () => void
}

function isFingerprintMissing(model: KeyVerificationModel): boolean {
	return model.getFingerprint() === ""
}

const debouncedFingerprintRequest = debounce(500, async (model: KeyVerificationModel, mailAddress: string) => {
	const result = await model.loadFingerprintFromPublicKeyService(mailAddress)
	m.redraw()
	return result
})

export class VerificationByManualInputPage implements Component<VerificationByTextPageAttrs> {
	view(vnode: Vnode<VerificationByTextPageAttrs>): Children {
		const { model, goToSuccessPage } = vnode.attrs

		const markAsVerifiedTranslationKey: TranslationKey = "keyManagement.markAsVerified_action"
		return m(".pt.pb.flex.col.gap-vpad", [
			m(Card, [
				m(
					"",
					m(".h4.mb-0.pl-vpad-s", lang.get("keyManagement.textVerification_label")),
					m("p.mt-xs.mb-s.pl-vpad-s", lang.get("keyManagement.verificationByTextMailAdress_label")),
				),
			]),
			m(
				Card,
				{
					style: { padding: "0" },
				},
				m(SingleLineTextField, {
					ariaLabel: lang.get("mailAddress_label"),
					placeholder: lang.get("mailAddress_label"),
					disabled: false,
					classes: ["flex", "gap-vpad-s", "items-center", "pl-vpad-s"],
					leadingIcon: {
						icon: Icons.At,
						color: getColors(ButtonColor.Content).button,
					},
					value: model.mailAddress,
					type: TextFieldType.Text,

					oninput: async (newValue) => {
						model.mailAddress = newValue

						if (model.validateMailAddress(newValue) == null) {
							try {
								await debouncedFingerprintRequest(model, newValue)
							} catch (e) {
								console.error("error while trying to fetch the public key service: ", e)
							}
						}
					},
				}),
			),
			isFingerprintMissing(model)
				? null
				: m(
						Card,
						{ classes: ["flex", "flex-column", "gap-vpad"] },
						m(".pl-vpad-s", lang.get("keyManagement.verificationByText_label", { "{button}": lang.get(markAsVerifiedTranslationKey) })),
						m(MonospaceTextDisplay, {
							text: model.getFingerprint(),
							placeholder: lang.get("keyManagement.invalidMailAddress_msg"),
							chunkSize: 4,
							border: false,
							classes: ".mb-s",
						}),
					),
			m(
				".align-self-center.full-width",
				m(LoginButton, {
					label: markAsVerifiedTranslationKey,
					onclick: async () => {
						await model.trust()
						await model.test.verified(KeyVerificationMethodType.text)
						goToSuccessPage()
					},
					disabled: isFingerprintMissing(model),
					icon: isFingerprintMissing(model)
						? undefined
						: m(Icon, {
								icon: Icons.Checkmark,
								class: "mr-xsm",
								style: {
									fill: theme.surface,
								},
							}),
				}),
			),
		])
	}
}
