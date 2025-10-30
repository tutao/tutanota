import m, { Children, Component, Vnode } from "mithril"
import { lang } from "../../../misc/LanguageViewModel"
import { KeyVerificationModel } from "../KeyVerificationModel"
import { TitleSection } from "../../../gui/TitleSection"
import { FingerprintRow } from "../FingerprintRow"
import { Icons } from "../../../gui/base/icons/Icons"
import { theme } from "../../../gui/theme"

export class VerificationResultPage implements Component<VerificationResultPageAttrs> {
	view(vnode: Vnode<VerificationResultPageAttrs>): Children {
		const { model } = vnode.attrs

		const publicIdentity = model.getPublicIdentity()

		return m(
			"section.flex.flex-column.mt-16",
			m(TitleSection, {
				title: lang.get("keyManagement.contactVerificationConfirmationTitle_label"),
				subTitle: lang.get("keyManagement.contactVerificationConfirmation_label"),
				icon: Icons.CheckCircleOutline,
				iconOptions: { color: theme.success },
			}),
			m(".mb-16"),
			publicIdentity === null
				? null
				: m(FingerprintRow, {
						publicKeyFingerprint: publicIdentity.fingerprint,
						publicKeyVersion: publicIdentity.trustDbEntry.publicIdentityKey.version,
						publicKeyType: publicIdentity.trustDbEntry.publicIdentityKey.object.type,
						mailAddress: publicIdentity.mailAddress,
					}),
		)
	}
}

type VerificationResultPageAttrs = {
	model: KeyVerificationModel
	close: () => void
}
