import m, { Children, Component, Vnode } from "mithril"
import { TextFieldType } from "../../../gui/base/TextField"
import { MonospaceTextDisplay } from "../../../gui/base/MonospaceTextDisplay"
import { lang } from "../../../misc/LanguageViewModel"
import { KeyVerificationFacade } from "../../../api/worker/facades/lazy/KeyVerificationFacade"
import { Card } from "../../../gui/base/Card"
import { SingleLineTextField } from "../../../gui/base/SingleLineTextField"
import { Icons } from "../../../gui/base/icons/Icons"
import { ButtonColor, getColors } from "../../../gui/base/Button"
import { LoginButton } from "../../../gui/base/buttons/LoginButton"
import { noOp } from "@tutao/tutanota-utils"

type VerificationByTextPageAttrs = {
	keyVerificationFacade: KeyVerificationFacade
}

export class VerificationByTextPage implements Component<VerificationByTextPageAttrs> {
	private dom: HTMLElement | null = null

	view(vnode: Vnode<VerificationByTextPageAttrs>): Children {
		const { keyVerificationFacade } = vnode.attrs
		let mailAddress: string = "" // TODO put this in some model
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
						classes: ["mb"],
						ariaLabel: lang.get("mailAddress_label"),
						placeholder: lang.get("mailAddress_label"),
						disabled: false,
						leadingIcon: {
							icon: Icons.At,
							color: getColors(ButtonColor.Content).button,
						},
						value: mailAddress, // vnode.attrs.mailAddress,
						type: TextFieldType.Text,

						oninput: async (newValue) => {
							console.log("text input, new value: ", newValue)
							mailAddress = newValue
							// attrs.data.mailAddress = newValue
							//
							// let invalidMailAddress = true
							//
							// if (this.validateMailAddress(attrs.data.mailAddress) == null) {
							//     try {
							//         attrs.data.publicKeyFingerprint = assertNotNull(
							//             await keyVerificationFacade.getFingerprint(attrs.data.mailAddress, KeyVerificationSourceOfTruth.PublicKeyService),
							//         )
							//         invalidMailAddress = false
							//     } catch (e) {
							//         invalidMailAddress = true
							//     }
							// }
							//
							// if (invalidMailAddress) {
							//     this.disableNextButton = true
							//     attrs.data.publicKeyFingerprint = null
							// } else {
							//     this.disableNextButton = false
							// }
							//
							// m.redraw()
						},
					}),
				),
			),
			m(
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
				}),
			),
		])
	}
}

//     headerTitle(): MaybeTranslation {
//         return "keyManagement.selectMethodShort_label"
//     }
