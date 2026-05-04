import m, { Component, Vnode } from "mithril"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { TitleSection } from "../../../../ui/TitleSection"
import { Icons } from "../../../../ui/base/icons/Icons"
import { theme } from "../../../../ui/theme"
import { Card } from "../../../../ui/base/Card"
import { ExternalLink } from "../../../../ui/base/ExternalLink"
import { KeyVerificationModel } from "../KeyVerificationModel"
import { assertNotNull } from "@tutao/utils"
import { IdentityKeySourceOfTrust } from "@tutao/app-env"

type FingerprintMismatchKeepPageAttrs = {
	model: KeyVerificationModel
}

export class FingerprintMismatchKeepPage implements Component<FingerprintMismatchKeepPageAttrs> {
	view(vnode: Vnode<FingerprintMismatchKeepPageAttrs>) {
		const publicIdentity = assertNotNull(vnode.attrs.model.getPublicIdentity())
		const sourceOfTrust = publicIdentity.trustDbEntry.sourceOfTrust
		const address = publicIdentity.mailAddress
		if (sourceOfTrust !== IdentityKeySourceOfTrust.TOFU) {
			throw new Error("unsupported source of trust")
		}
		const title = lang.get("fingerprintMismatchKeepTofu_title")
		const subtitle = lang.get("fingerprintMismatchKeepTofuSubtitle_msg")
		const message = lang.get("fingerprintMismatchKeepTofu_msg", { "{mailAddress}": address })

		return m(".pt-16.pb-16.flex.col.gap-16", [
			m(TitleSection, {
				title,
				subTitle: subtitle,
				icon: Icons.ExclamationOutline,
				iconOptions: { color: theme.warning },
			}),
			m(
				Card,
				m(".plr-12.flex.flex-column.gap-16.pt-8.pb-8", [
					m("", m.trust(message)),
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
