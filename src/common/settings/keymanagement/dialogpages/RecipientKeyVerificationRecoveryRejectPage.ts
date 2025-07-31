import m, { Component, Vnode } from "mithril"
import { lang } from "../../../misc/LanguageViewModel"
import { TitleSection } from "../../../gui/TitleSection"
import { Icons } from "../../../gui/base/icons/Icons"
import { theme } from "../../../gui/theme"
import { Card } from "../../../gui/base/Card"
import { ExternalLink } from "../../../gui/base/ExternalLink"
import { LoginButton } from "../../../gui/base/buttons/LoginButton"

type VerificationErrorRejectPageAttrs = {
	contactMailAddress: string
	goToUnverifiedRecipientsPage?: () => void
}

export class RecipientKeyVerificationRecoveryRejectPage implements Component<VerificationErrorRejectPageAttrs> {
	view(vnode: Vnode<VerificationErrorRejectPageAttrs>) {
		const title = lang.get("keyManagement.verificationError_title")
		let contactNotUpdatedText = lang.get("keyVerificationErrorContactNotUpdated_msg", { "{mailAddress}": vnode.attrs.contactMailAddress })
		const contactMailAddress = vnode.attrs.contactMailAddress

		return m(".pt.pb.flex.col.gap-vpad", [
			m(TitleSection, {
				title,
				subTitle: "",
				icon: Icons.AlertCircleOutline,
				iconOptions: { color: theme.warning },
			}),
			m(
				Card,
				m(".plr.flex.flex-column.gap-vpad.pt-s.pb-s", [
					m("", m.trust(contactNotUpdatedText)),
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
