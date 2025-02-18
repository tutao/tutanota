import m, { Children, Component, Vnode } from "mithril"
import { lang } from "../../../misc/LanguageViewModel"
import { KeyVerificationWizardPage } from "../KeyVerificationWizardPage"
import { KeyVerificationModel } from "../KeyVerificationModel"
import { TitleSection } from "../../../gui/TitleSection"
import { FingerprintRow } from "../FingerprintRow"
import { assertNotNull } from "@tutao/tutanota-utils"
import { Icons } from "../../../gui/base/icons/Icons"

export class VerificationResultPage implements Component<VerificationResultPageAttrs> {
	view(vnode: Vnode<VerificationResultPageAttrs>): Children {
		const { model } = vnode.attrs

		return m(
			"section.flex.flex-column.dialog-height-small.mt",
			m(TitleSection, {
				title: lang.get("keyManagement.contactVerificationConfirmationTitle_label"),
				subTitle: lang.get("keyManagement.contactVerificationConfirmation_label"),
				icon: Icons.Fingerprint,
			}),
			m(".mb"),
			m(FingerprintRow, {
				publicKeyFingerprint: assertNotNull(model.publicKeyFingerprint),
				mailAddress: model.mailAddress,
			}),
		)
		// } else if (true) {
		// 	if (result === KeyVerificationResultType.QR_OK) {
		// 		const fingerprint = assertNotNull(publicKeyFingerprint)
		//
		// 		return m(
		// 			KeyVerificationWizardPage,
		// 			{
		// 				nextButtonLabel: lang.getTranslation("keyManagement.markAsVerified_action"),
		// 				beforeNextPageHook: async () => {
		// 					await keyVerificationFacade.trust(mailAddress, fingerprint.fingerprint, fingerprint.keyVersion, fingerprint.keyPairType)
		// 					await reloadParent()
		// 					return true
		// 				},
		// 			},
		// 			m(
		// 				"p",
		// 				lang.get("keyManagement.markAsVerifiedSuggestion_label", {
		// 					"{action_label}": lang.get("keyManagement.markAsVerified_action"),
		// 				}),
		// 			),
		// 			m("p.b.center", mailAddress),
		// 			m("hr"),
		// 			m(".small.text-break.monospace", fingerprint.fingerprint),
		// 		)
		// 	} else {
		// 		let message: TranslationKey
		//
		// 		if (result === KeyVerificationResultType.QR_MALFORMED_PAYLOAD) {
		// 			message = "keyManagement.qrCodeInvalid_msg"
		// 		} else if (result === KeyVerificationResultType.QR_MAIL_ADDRESS_NOT_FOUND) {
		// 			message = "keyManagement.qrMailAddressNotFound_msg"
		// 		} else if (result === KeyVerificationResultType.QR_FINGERPRINT_MISMATCH) {
		// 			message = "keyManagement.qrFingerprintMismatch_msg"
		// 		} else {
		// 			message = "keyManagement.qrCodeInvalid_msg"
		// 		}
		//
		// 		return m(KeyVerificationWizardPage, { nextButtonLabel: lang.getTranslation("finish_action") }, m("p", lang.get(message)))
		// 	}
	}
}

type VerificationResultPageAttrs = {
	model: KeyVerificationModel
	back: () => void
}
