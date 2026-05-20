import m, { Component, Vnode } from "mithril"
import { lang } from "../../../../../ui/utils/LanguageViewModel"
import { TitleSection } from "../../../../../ui/TitleSection"
import { Icons } from "../../../../../ui/base/icons/Icons"
import { theme } from "../../../../../ui/theme"
import { Card } from "../../../../../ui/base/Card"
import { ExternalLink } from "../../../../../ui/base/ExternalLink"
import { PrimaryButton } from "../../../../../ui/base/buttons/VariantButtons.js"

type VerificationErrorRejectPageAttrs = {
	contactMailAddress: string
	goToUnverifiedRecipientsPage?: () => void
}

export class RecipientKeyVerificationRecoveryRejectPage implements Component<VerificationErrorRejectPageAttrs> {
	view(vnode: Vnode<VerificationErrorRejectPageAttrs>) {
		const title = lang.get("keyManagement.verificationError_title")
		let contactNotUpdatedText = lang.get("keyVerificationErrorContactNotUpdated_msg", { "{mailAddress}": vnode.attrs.contactMailAddress })
		const contactMailAddress = vnode.attrs.contactMailAddress

		return m(".pt-16.pb-16.flex.col.gap-16", [
			m(TitleSection, {
				title,
				subTitle: "",
				icon: Icons.ExclamationOutline,
				iconOptions: { color: theme.warning },
			}),
			m(
				Card,
				m(".plr-12.flex.flex-column.gap-16.pt-8.pb-8", [
					m("", m.trust(contactNotUpdatedText)),
					m(ExternalLink, {
						isCompanySite: true,
						text: lang.get("keyVerificationLearnMoreAboutContactVerificationLink_msg"),
						href: "https://tuta.com/encryption",
					}),
				]),
			),
			vnode.attrs.goToUnverifiedRecipientsPage
				? m(PrimaryButton, {
						label: "continue_action",
						onclick: async () => {
							vnode.attrs.goToUnverifiedRecipientsPage?.()
						},
					})
				: null,
		])
	}
}
