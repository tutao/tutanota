import m, { Children, Component, Vnode } from "mithril"
import { TextField, TextFieldType } from "../../../gui/base/TextField"
import { MonospaceTextDisplay } from "../../../gui/base/MonospaceTextDisplay"
import { lang } from "../../../misc/LanguageViewModel"
import { KeyVerificationFacade } from "../../../api/worker/facades/lazy/KeyVerificationFacade"
import { TitleSection } from "../../../gui/TitleSection"
import { Icons } from "../../../gui/base/icons/Icons"

type VerificationByTextPageAttrs = {
	keyVerificationFacade: KeyVerificationFacade
}

export class VerificationByTextPage implements Component<VerificationByTextPageAttrs> {
	private dom: HTMLElement | null = null

	view(vnode: Vnode<VerificationByTextPageAttrs>): Children {
		const { keyVerificationFacade } = vnode.attrs

		return m(
			".pb",
			m(TitleSection, { title: "Verify with text", subTitle: "Enter the Tuta email address of the contact you want to verify." }),
			m(TextField, {
				class: "mb",
				label: "mailAddress_label",
				value: "", // vnode.attrs.mailAddress,
				type: TextFieldType.Email,
				oninput: async (newValue) => {
					console.log("text input, new value: ", newValue)
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
			m(MonospaceTextDisplay, {
				text: "123 123", // attrs.data.publicKeyFingerprint?.fingerprint || "",
				placeholder: lang.get("keyManagement.invalidMailAddress_msg"),
				chunkSize: 4,
			}),
		)
	}
}

//     headerTitle(): MaybeTranslation {
//         return "keyManagement.selectMethodShort_label"
//     }
