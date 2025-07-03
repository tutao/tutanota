import m, { Component, Vnode } from "mithril"
import { lang } from "../../../misc/LanguageViewModel"
import { TitleSection } from "../../../gui/TitleSection"
import { Icons } from "../../../gui/base/icons/Icons"
import { theme } from "../../../gui/theme"
import { Card } from "../../../gui/base/Card"
import { ExternalLink } from "../../../gui/base/ExternalLink"
import { IdentityKeySourceOfTrust } from "../../../api/common/TutanotaConstants"
import { KeyVerificationModel } from "../KeyVerificationModel"
import { assertNotNull } from "@tutao/tutanota-utils"

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

		return m(".pt.pb.flex.col.gap-vpad", [
			m(TitleSection, {
				title,
				subTitle: subtitle,
				icon: Icons.AlertCircleOutline,
				iconOptions: { color: theme.warning },
			}),
			m(
				Card,
				m(".plr.flex.flex-column.gap-vpad.pt-s.pb-s", [
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
