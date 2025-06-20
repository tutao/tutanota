import m, { Component, Vnode } from "mithril"
import { lang } from "../../../misc/LanguageViewModel"
import { TitleSection } from "../../../gui/TitleSection"
import { Icons } from "../../../gui/base/icons/Icons"
import { LoginButton } from "../../../gui/base/buttons/LoginButton"
import { theme } from "../../../gui/theme"
import { IdentityKeySourceOfTrust } from "../../../api/common/TutanotaConstants"
import { KeyVerificationErrorModel } from "../../../misc/KeyVerificationErrorModel"
import { Card } from "../../../gui/base/Card"

type VerificationErrorInfoPageAttrs = {
	model: KeyVerificationErrorModel
	sourceOfTrust: IdentityKeySourceOfTrust
	goToAcceptPage: () => void
	goToRejectPage: () => void
}

export class VerificationErrorInfoPage implements Component<VerificationErrorInfoPageAttrs> {
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
			m(Card, lang.get("keyVerificationErrorWarning_msg")),
			m(Card, lang.get("keyVerificationErrorRecommendation_msg")),
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
