import m, { Component, Vnode } from "mithril"
import { lang } from "../../../misc/LanguageViewModel"
import { TitleSection } from "../../../gui/TitleSection"
import { Icons } from "../../../gui/base/icons/Icons"
import { theme } from "../../../gui/theme"
import { ExternalLink } from "../../../gui/base/ExternalLink"
import { Card } from "../../../gui/base/Card"
import { LoginButton } from "../../../gui/base/buttons/LoginButton"

type VerificationErrorAcceptPageAttrs = {
	contactMailAddress: string
	goToUnverifiedRecipientsPage?: () => void
}

export class RecipientKeyVerificationRecoveryAcceptPage implements Component<VerificationErrorAcceptPageAttrs> {
	view(vnode: Vnode<VerificationErrorAcceptPageAttrs>) {
		const title = lang.get("keyVerificationErrorAccept_title")
		let contactUpdatedText = lang.get("keyVerificationErrorContactUpdated_msg", { "{mailAddress}": vnode.attrs.contactMailAddress })
		const contactMailAddress = vnode.attrs.contactMailAddress

		return m(".pt-16.pb-16.flex.col.gap-16", [
			m(TitleSection, {
				title,
				subTitle: "",
				icon: Icons.CheckCircleOutline,
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
			vnode.attrs.goToUnverifiedRecipientsPage
				? m(LoginButton, {
						label: "continue_action",
						onclick: async () => {
							vnode.attrs.goToUnverifiedRecipientsPage?.()
						},
					})
				: null,
		])
	}
}
