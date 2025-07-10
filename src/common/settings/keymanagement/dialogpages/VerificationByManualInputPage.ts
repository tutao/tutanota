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
import { IdentityKeyVerificationMethod } from "../../../api/common/TutanotaConstants"
import { getCleanedMailAddress } from "../../../misc/parsing/MailAddressParser"
import { showFingerprintMismatchRecoveryDialog } from "./FingerprintMismatchRecoverDialog"

type VerificationByTextPageAttrs = {
	model: KeyVerificationModel
	goToSuccessPage: () => void
	reload: () => void
	closeParent: () => void
}

const debouncedFingerprintRequest = debounce(500, async (model: KeyVerificationModel, mailAddress: string) => {
	await model.loadIdentityKeyForMailAddress(mailAddress)
	m.redraw()
})

export class VerificationByManualInputPage implements Component<VerificationByTextPageAttrs> {
	view(vnode: Vnode<VerificationByTextPageAttrs>): Children {
		const { model, goToSuccessPage, reload } = vnode.attrs

		const publicIdentity = model.getPublicIdentity()
		const markAsVerifiedTranslationKey: TranslationKey = "keyManagement.markAsVerified_action"
		const doNotTrustTranslationKey: TranslationKey = "keyManagement.doNotTrust_action"

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
					value: model.mailAddressInput,
					type: TextFieldType.Text,

					oninput: async (newValue) => {
						model.mailAddressInput = newValue
						const cleanMailAddress = getCleanedMailAddress(newValue)
						if (cleanMailAddress == null) {
							return "mailAddressInvalid_msg"
						} else {
							try {
								debouncedFingerprintRequest(model, cleanMailAddress)
							} catch (e) {
								console.error("error while trying to fetch the public key service: ", e)
							}
						}
					},
				}),
			),
			publicIdentity
				? m(
						Card,
						{ classes: ["flex", "flex-column", "gap-vpad"] },
						m(
							".pl-vpad-s",
							lang.get("keyManagement.verificationByText_label", {
								"{button1}": lang.get(markAsVerifiedTranslationKey),
								"{button2}": lang.get(doNotTrustTranslationKey),
							}),
						),
						m(MonospaceTextDisplay, {
							text: publicIdentity.fingerprint,
							placeholder: lang.get("keyManagement.invalidMailAddress_msg"),
							chunkSize: 4,
							border: false,
							classes: ".mb-s",
						}),
				  )
				: null,
			m(LoginButton, {
				label: markAsVerifiedTranslationKey,
				onclick: async () => {
					await model.trust(IdentityKeyVerificationMethod.text)
					goToSuccessPage()
				},
				disabled: !publicIdentity,
				icon: publicIdentity
					? m(Icon, {
							icon: Icons.Checkmark,
							class: "mr-xsm",
							style: {
								fill: theme.content_button_icon_selected,
							},
					  })
					: null,
			}),
			m(LoginButton, {
				label: doNotTrustTranslationKey,
				onclick: async () => {
					showFingerprintMismatchRecoveryDialog(
						model,
						() => reload(),
						() => vnode.attrs.closeParent(),
					)
				},
				disabled: !publicIdentity,
				icon: publicIdentity
					? m(Icon, {
							icon: Icons.X,
							class: "mr-xsm",
							style: {
								fill: theme.content_button_icon_selected,
							},
					  })
					: null,
			}),
		])
	}
}
