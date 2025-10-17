import m, { Component, Vnode } from "mithril"
import { lang } from "../../../misc/LanguageViewModel"
import { TitleSection } from "../../../gui/TitleSection"
import { Icons } from "../../../gui/base/icons/Icons"
import { theme } from "../../../gui/theme"
import { Card } from "../../../gui/base/Card"
import { ExternalLink } from "../../../gui/base/ExternalLink"
import { LoginButton } from "../../../gui/base/buttons/LoginButton"
import { IdentityKeySourceOfTrust } from "../../../api/common/TutanotaConstants"
import { KeyVerificationModel } from "../KeyVerificationModel"
import { assertNotNull } from "@tutao/tutanota-utils"
import { Icon, IconSize } from "../../../gui/base/Icon"

type VerificationErrorInfoPageAttrs = {
	model: KeyVerificationModel
	goToDeletePage: () => void
}

export class FingerprintMismatchInfoPage implements Component<VerificationErrorInfoPageAttrs> {
	view(vnode: Vnode<VerificationErrorInfoPageAttrs>) {
		const sourceOfTrust = assertNotNull(vnode.attrs.model.getPublicIdentity()).trustDbEntry.sourceOfTrust
		let subTitle
		let warning
		const recommendation = lang.get("fingerprintMismatchRecommendation_msg")
		const title = lang.get("keyManagement.verificationError_title")
		if (sourceOfTrust === IdentityKeySourceOfTrust.Manual) {
			subTitle = lang.get("fingerprintMismatchManual_msg")
			warning = lang.get("fingerprintMismatchManualWarning_msg")
		} else if (sourceOfTrust === IdentityKeySourceOfTrust.TOFU) {
			subTitle = lang.get("fingerprintMismatchTofu_msg", {
				"{mailAddress}": assertNotNull(vnode.attrs.model.getPublicIdentity()).mailAddress,
			})
			warning = lang.get("fingerprintMismatchTofuWarning_msg")
		} else {
			throw new Error("unsupported source of trust")
		}

		return m(".pt-16.pb-16.flex.col.gap-16", [
			m(TitleSection, {
				title,
				subTitle: m.trust(subTitle),
				icon: Icons.CloseCircleOutline,
				iconOptions: { color: theme.error },
			}),
			m(
				Card,
				m(".plr-12.flex.flex-column.gap-16", [
					m("", m.trust(warning)),
					m(".b.mt-16", lang.get("keyVerificationErrorRecommendation_title")),
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
					await vnode.attrs.model.deleteAndReloadTrustedKey()
					vnode.attrs.goToDeletePage()
				},
				class: "flex-center row center-vertically",
				icon: m(Icon, {
					icon: Icons.Trash,
					size: IconSize.PX24,
					class: "mr-8 flex-center",
					style: {
						fill: theme.on_primary,
					},
				}),
			}),
		])
	}
}
