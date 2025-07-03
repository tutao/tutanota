import m, { Component, Vnode } from "mithril"
import { lang } from "../../../misc/LanguageViewModel"
import { SenderKeyVerificationRecoveryModel } from "../../../misc/SenderKeyVerificationRecoveryModel"
import { TitleSection } from "../../../gui/TitleSection"
import { Icons } from "../../../gui/base/icons/Icons"
import { theme } from "../../../gui/theme"
import { Card } from "../../../gui/base/Card"
import { ExternalLink } from "../../../gui/base/ExternalLink"

type SenderRecoverySuccessPageAttrs = {
	model: SenderKeyVerificationRecoveryModel
}

export class SenderKeyVerificationRecoverySuccessPage implements Component<SenderRecoverySuccessPageAttrs> {
	view(vnode: Vnode<SenderRecoverySuccessPageAttrs>) {
		const title = lang.get("keyVerificationErrorAccept_title")
		let contactUpdatedText = lang.get("keyVerificationErrorContactUpdated_msg", { "{mailAddress}": vnode.attrs.model.getSenderAddress() })

		return m(".pt.pb.flex.col.gap-vpad", [
			m(TitleSection, {
				title,
				subTitle: "",
				icon: Icons.Fingerprint,
				iconOptions: { color: theme.content_accent },
			}),
			m(
				Card,
				m(".plr.flex.flex-column.gap-vpad.pt-s.pb-s", [
					m("", m.trust(contactUpdatedText)),
					m(ExternalLink, {
						isCompanySite: true,
						text: lang.get("keyVerificationLearnMoreAboutContactVerificationLink_msg"),
						href: "https://tuta.com/encryption",
					}),
				]),
			),
		])
	}
}
