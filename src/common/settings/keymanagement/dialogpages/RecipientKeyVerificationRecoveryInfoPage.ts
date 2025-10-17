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
import { OutlineButton } from "../../../gui/base/buttons/OutlineButton"

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

		return m(".pt-16.pb-16.flex.col.gap-16", [
			m(TitleSection, {
				title,
				subTitle,
			}),
			m(
				Card,
				m(".plr-12.flex.flex-column.gap-16", [
					m("", m.trust(lang.get("keyVerificationErrorWarning_msg", { "{mailAddress}": contactMailAddress }))),
					m(".b.mt-16", lang.get("keyVerificationErrorRecommendation_title")),
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
					size: IconSize.PX20,
					class: "mr-8 flex-center",
				}),
			}),
			m(OutlineButton, {
				label: "accept_action",
				onclick: async () => {
					await vnode.attrs.model.acceptAndLoadNewKey()
					vnode.attrs.goToAcceptPage()
				},
			}),
		])
	}
}
