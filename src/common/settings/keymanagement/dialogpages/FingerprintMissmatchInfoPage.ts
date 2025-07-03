import m, { Component, Vnode } from "mithril"
import { lang } from "../../../misc/LanguageViewModel"
import { TitleSection } from "../../../gui/TitleSection"
import { Icons } from "../../../gui/base/icons/Icons"
import { theme } from "../../../gui/theme"
import { Card } from "../../../gui/base/Card"
import { ExternalLink } from "../../../gui/base/ExternalLink"
import { LoginButton } from "../../../gui/base/buttons/LoginButton"
import { FingerprintMissmatchRecoverModel } from "../FingerprintMissmatchRecoverModel"

type VerificationErrorInfoPageAttrs = {
	model: FingerprintMissmatchRecoverModel
	goToDeletePage: () => void
	goToKeepPage: () => void
}

export class FingerprintMissmatchInfoPage implements Component<VerificationErrorInfoPageAttrs> {
	view(vnode: Vnode<VerificationErrorInfoPageAttrs>) {
		const title = lang.get("keyManagement.verificationError_title")
		//TODO different message for different source of trust
		let subTitle = lang.get("fingerprintMissmatch_msg")

		return m(".pt.pb.flex.col.gap-vpad", [
			m(TitleSection, {
				title,
				subTitle,
				icon: Icons.AlertCircle,
				iconOptions: { color: theme.error_color },
			}),
			m(
				Card,
				m(".plr.flex.flex-column.gap-vpad", [
					m("", m.trust(lang.get("keyVerificationErrorWarning_msg"))),
					m(".b.mt", lang.get("keyVerificationErrorRecommendation_title")),
					//TODO have a different message/recomendation depending on the source of trust of tha saved key?
					m("", m.trust(lang.get("fingerprintMissmatchRecommendation_msg"))),
					m(ExternalLink, {
						isCompanySite: true,
						text: lang.get("keyVerificationLearnMoreAboutContactVerificationLink_msg"),
						href: "https://tuta.com/encryption",
					}),
				]),
			),
			m(LoginButton, {
				label: "deleteKey_action",
				onclick: async () => {
					await vnode.attrs.model.deleteTrustedKey()
					vnode.attrs.goToDeletePage()
				},
			}),
			m(LoginButton, {
				label: "keepKey_action",
				onclick: async () => vnode.attrs.goToKeepPage(),
			}),
		])
	}
}
