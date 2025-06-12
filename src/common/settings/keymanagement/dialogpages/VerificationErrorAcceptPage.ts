import m, { Component, Vnode } from "mithril"
import { lang } from "../../../misc/LanguageViewModel"
import { TitleSection } from "../../../gui/TitleSection"
import { Icons } from "../../../gui/base/icons/Icons"
import { theme } from "../../../gui/theme"
import { ExternalLink } from "../../../gui/base/ExternalLink"
import { Card } from "../../../gui/base/Card"

type VerificationErrorAcceptPageAttrs = {
	contactMailAddress: string
}

export class VerificationErrorAcceptPage implements Component<VerificationErrorAcceptPageAttrs> {
	view(vnode: Vnode<VerificationErrorAcceptPageAttrs>) {
		const title = lang.get("keyVerificationErrorAccept_title")
		let contactUpdatedText = lang.get("keyVerificationErrorContactUpdated_msg", { "{mailAddress}": vnode.attrs.contactMailAddress })

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
