import m, { Children, Component, Vnode } from "mithril"
import { TextFieldType } from "../../../gui/base/TextField"
import { MonospaceTextDisplay } from "../../../gui/base/MonospaceTextDisplay"
import { lang, TranslationKey } from "../../../misc/LanguageViewModel"
import { KeyVerificationFacade } from "../../../api/worker/facades/lazy/KeyVerificationFacade"
import { Card } from "../../../gui/base/Card"
import { SingleLineTextField } from "../../../gui/base/SingleLineTextField"
import { Icons } from "../../../gui/base/icons/Icons"
import { ButtonColor, getColors } from "../../../gui/base/Button"
import { LoginButton } from "../../../gui/base/buttons/LoginButton"
import { noOp } from "@tutao/tutanota-utils"
import { getCleanedMailAddress } from "../../../misc/parsing/MailAddressParser"

type VerificationByTextPageAttrs = {
	keyVerificationFacade: KeyVerificationFacade
}

export class VerificationByTextPage implements Component<VerificationByTextPageAttrs> {
	private dom: HTMLElement | null = null
	private mailAddress: string = "" // TODO put this in some model
	private buttonDisabled: boolean = true

	private validateMailAddress(mailAddress: string): TranslationKey | null {
		/* TODO:
        Properly validate mail address. Only Tuta domains are reasonable for this problem space
        so only those should be considered valid. */

		// validate email address (syntactically)
		if (getCleanedMailAddress(mailAddress) == null) {
			return "mailAddressInvalid_msg"
		}

		return null // null means OK
	}

	view(vnode: Vnode<VerificationByTextPageAttrs>): Children {
		const { keyVerificationFacade } = vnode.attrs

		return m(".pt.pb.flex.col.gap-vpad", [
			m(Card, [m("", m(".h4.mb-0", "Verify with text"), m("p.mt-xs.mb-s", "Enter the Tuta email address of the contact you want to verify."))]),
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
						value: this.mailAddress, // vnode.attrs.mailAddress,
						type: TextFieldType.Text,

						oninput: async (newValue) => {
							console.log("text input, new value: ", newValue)
							this.mailAddress = newValue

							let invalidMailAddress = true

							if (this.validateMailAddress(this.mailAddress) == null) {
								invalidMailAddress = false
								// try {
								//     attrs.data.publicKeyFingerprint = assertNotNull(
								//         await keyVerificationFacade.getFingerprint(attrs.data.mailAddress, KeyVerificationSourceOfTruth.PublicKeyService),
								//     )
								//     invalidMailAddress = false
								// } catch (e) {
								//     invalidMailAddress = true
								// }
							}

							if (invalidMailAddress) {
								this.buttonDisabled = true
								// attrs.data.publicKeyFingerprint = null
							} else {
								this.buttonDisabled = false
							}

							// m.redraw()
						},
					}),
				),
			),
			this.buttonDisabled
				? null
				: m(
						Card,
						m(MonospaceTextDisplay, {
							text: "123 123", // attrs.data.publicKeyFingerprint?.fingerprint || "",
							placeholder: lang.get("keyManagement.invalidMailAddress_msg"),
							chunkSize: 4,
						}),
				  ),
			m(
				".align-self-center.full-width",
				m(LoginButton, {
					label: "keyManagement.markAsVerified_action",
					onclick: noOp,
					disabled: this.buttonDisabled,
				}),
			),
		])
	}
}

//     headerTitle(): MaybeTranslation {
//         return "keyManagement.selectMethodShort_label"
//     }
