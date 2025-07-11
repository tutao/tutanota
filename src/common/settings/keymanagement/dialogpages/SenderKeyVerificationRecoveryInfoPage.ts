import m, { Component, Vnode } from "mithril"
import { lang } from "../../../misc/LanguageViewModel"
import { TitleSection } from "../../../gui/TitleSection"
import { Icons } from "../../../gui/base/icons/Icons"
import { LoginButton } from "../../../gui/base/buttons/LoginButton"
import { theme } from "../../../gui/theme"
import { IdentityKeySourceOfTrust } from "../../../api/common/TutanotaConstants"
import { Card } from "../../../gui/base/Card"
import { ExternalLink } from "../../../gui/base/ExternalLink"
import { SenderKeyVerificationRecoveryModel } from "../../../misc/SenderKeyVerificationRecoveryModel"

type VerificationErrorInfoPageAttrs = {
	model: SenderKeyVerificationRecoveryModel
	sourceOfTrust: IdentityKeySourceOfTrust
	goToAcceptPage: () => void
	goToRejectPage: () => void
}

export class SenderKeyVerificationRecoveryInfoPage implements Component<VerificationErrorInfoPageAttrs> {
	view(vnode: Vnode<VerificationErrorInfoPageAttrs>) {
		const title = lang.get("keyManagement.verificationError_title")
		let subTitle =
			vnode.attrs.sourceOfTrust == IdentityKeySourceOfTrust.Manual
				? lang.get("keyVerificationErrorManual_msg")
				: IdentityKeySourceOfTrust.TOFU
				? lang.get("keyVerificationErrorTofu_msg")
				: lang.get("keyVerificationErrorGeneric_msg")

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
					m("", m.trust(lang.get("keyVerificationErrorRecommendation_msg"))),
					m(ExternalLink, {
						isCompanySite: true,
						text: lang.get("keyVerificationLearnMoreAboutContactVerificationLink_msg"),
						href: "https://tuta.com/encryption",
					}),
				]),
			),
			m(LoginButton, {
				label: "accept_action",
				onclick: async () => {
					await vnode.attrs.model.acceptAndLoadNewKey()
					vnode.attrs.goToAcceptPage()
				},
			}),
			m(LoginButton, {
				label: "reject_action",
				onclick: async () => vnode.attrs.goToRejectPage(),
			}),
		])
	}
}
