import m, { Component, Vnode } from "mithril"
import { lang } from "../../../misc/LanguageViewModel"
import { TitleSection } from "../../../gui/TitleSection"
import { Icons } from "../../../gui/base/icons/Icons"
import { theme } from "../../../gui/theme"
import { Card } from "../../../gui/base/Card"
import { ExternalLink } from "../../../gui/base/ExternalLink"
import { LoginButton } from "../../../gui/base/buttons/LoginButton"
import { FingerprintMissmatchRecoverModel } from "../FingerprintMissmatchRecoverModel"
import { IdentityKeySourceOfTrust } from "../../../api/common/TutanotaConstants"

type VerificationErrorInfoPageAttrs = {
	model: FingerprintMissmatchRecoverModel
	goToDeletePage: () => void
	goToKeepPage: () => void
	sourceOfTrust: IdentityKeySourceOfTrust
}

export class FingerprintMissmatchInfoPage implements Component<VerificationErrorInfoPageAttrs> {
	view(vnode: Vnode<VerificationErrorInfoPageAttrs>) {
		const title = lang.get("keyManagement.verificationError_title")
		let subTitle
		let warning
		let recommendation
		if (vnode.attrs.sourceOfTrust === IdentityKeySourceOfTrust.Manual) {
			subTitle = lang.get("fingerprintMissmatchManual_msg")
			warning = lang.get("fingerprintMissmatchManualWarning_msg")
			recommendation = lang.get("fingerprintMissmatchRecommendationManual_msg")
		} else if (vnode.attrs.sourceOfTrust === IdentityKeySourceOfTrust.TOFU) {
			subTitle = lang.get("fingerprintMissmatchTofu_msg", {
				"{mailAddress}": vnode.attrs.model.getAddress(),
			})
			warning = lang.get("fingerprintMissmatchTofuWarning_msg")
			recommendation = lang.get("fingerprintMissmatchRecommendationTofu_msg")
		} else {
			subTitle = lang.get("fingerprintMissmatch_msg")
			warning = lang.get("keyVerificationErrorWarning_msg")
			recommendation = lang.get("fingerprintMissmatchRecommendation_msg")
		}

		return m(".pt.pb.flex.col.gap-vpad", [
			m(TitleSection, {
				title,
				subTitle: m.trust(subTitle),
				icon: Icons.AlertCircle,
				iconOptions: { color: theme.error_color },
			}),
			m(
				Card,
				m(".plr.flex.flex-column.gap-vpad", [
					m("", m.trust(warning)),
					m(".b.mt", lang.get("keyVerificationErrorRecommendation_title")),
					m("", m.trust(recommendation)),
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
