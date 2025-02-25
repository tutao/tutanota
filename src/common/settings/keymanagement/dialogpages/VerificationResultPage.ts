import m, { Children, Component, Vnode } from "mithril"
import { lang } from "../../../misc/LanguageViewModel"
import { KeyVerificationModel } from "../KeyVerificationModel"
import { TitleSection } from "../../../gui/TitleSection"
import { FingerprintRow } from "../FingerprintRow"
import { assertNotNull } from "@tutao/tutanota-utils"
import { Icons } from "../../../gui/base/icons/Icons"

export class VerificationResultPage implements Component<VerificationResultPageAttrs> {
	view(vnode: Vnode<VerificationResultPageAttrs>): Children {
		const { model } = vnode.attrs

		return m(
			"section.flex.flex-column.mt",
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
	}
}

type VerificationResultPageAttrs = {
	model: KeyVerificationModel
	close: () => void
}
