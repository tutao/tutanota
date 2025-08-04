import m, { Component, Vnode } from "mithril"
import { lang } from "../../../misc/LanguageViewModel"
import { TitleSection } from "../../../gui/TitleSection"
import { Icons } from "../../../gui/base/icons/Icons"
import { LoginButton } from "../../../gui/base/buttons/LoginButton"
import { theme } from "../../../gui/theme"
import { IdentityKeySourceOfTrust } from "../../../api/common/TutanotaConstants"
import { RecipientKeyVerificationRecoveryModel } from "../../../misc/RecipientKeyVerificationRecoveryModel"
import { Card } from "../../../gui/base/Card"
import { ExternalLink } from "../../../gui/base/ExternalLink"
import { Icon, IconSize } from "../../../gui/base/Icon"

type VerificationErrorInfoPageAttrs = {
	model: RecipientKeyVerificationRecoveryModel
	sourceOfTrust: IdentityKeySourceOfTrust
	goToAcceptPage: () => void
	goToRejectPage: () => void
}

export class RecipientKeyVerificationRecoveryInfoPage implements Component<VerificationErrorInfoPageAttrs> {
	view(vnode: Vnode<VerificationErrorInfoPageAttrs>) {
		const title = lang.get("keyManagement.verificationError_title")
		const contactMailAddress = vnode.attrs.model.getCurrentRecipientAddress()
		let subTitle =
			vnode.attrs.sourceOfTrust === IdentityKeySourceOfTrust.Manual
				? lang.get("keyVerificationErrorManual_msg")
				: lang.get("keyVerificationErrorGeneric_msg")

		return m(".pt.pb.flex.col.gap-vpad", [
			m(TitleSection, {
				title,
				subTitle,
				icon: Icons.AlertCircleOutline,
				iconOptions: { color: theme.warning },
			}),
			m(
				Card,
				m(".plr.flex.flex-column.gap-vpad", [
					m("", m.trust(lang.get("keyVerificationErrorWarning_msg", { "{mailAddress}": contactMailAddress }))),
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
				class: "flex-center row center-vertically",
				label: lang.makeTranslation("reject_recommended", `${lang.get("reject_action")} (${lang.get("recommended_action")})`),
				onclick: async () => vnode.attrs.goToRejectPage(),
				icon: m(Icon, {
					icon: Icons.XCheckmark,
					size: IconSize.Large,
					class: "mr-s flex-center",
				}),
			}),
			m(LoginButton, {
				label: "accept_action",
				onclick: async () => {
					await vnode.attrs.model.acceptAndLoadNewKey()
					vnode.attrs.goToAcceptPage()
				},
				discouraged: true,
			}),
		])
	}
}
