import m, { Component, Vnode } from "mithril"
import { lang } from "../../../../../ui/utils/LanguageViewModel"
import { SenderKeyVerificationRecoveryModel } from "../../../misc/SenderKeyVerificationRecoveryModel"
import { TitleSection } from "../../../../../ui/TitleSection"
import { Icons } from "../../../../../ui/base/icons/Icons"
import { theme } from "../../../../../ui/theme"
import { Card } from "../../../../../ui/base/Card"
import { ExternalLink } from "../../../../../ui/base/ExternalLink"

type SenderRecoverySuccessPageAttrs = {
	model: SenderKeyVerificationRecoveryModel
}

export class SenderKeyVerificationRecoverySuccessPage implements Component<SenderRecoverySuccessPageAttrs> {
	view(vnode: Vnode<SenderRecoverySuccessPageAttrs>) {
		const title = lang.get("keyVerificationErrorAccept_title")
		let contactUpdatedText = lang.get("keyVerificationErrorContactUpdated_msg", { "{mailAddress}": vnode.attrs.model.getSenderAddress() })

		return m(".pt-16.pb-16.flex.col.gap-16", [
			m(TitleSection, {
				title,
				subTitle: "",
				icon: Icons.SuccessOutline,
				iconOptions: { color: theme.success },
			}),
			m(
				Card,
				m(".plr-12.flex.flex-column.gap-16.pt-8.pb-8", [
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
