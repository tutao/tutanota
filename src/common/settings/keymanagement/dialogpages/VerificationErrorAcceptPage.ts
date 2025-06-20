import m, { Component, Vnode } from "mithril"
import { lang } from "../../../misc/LanguageViewModel"
import { TitleSection } from "../../../gui/TitleSection"
import { Icons } from "../../../gui/base/icons/Icons"
import { theme } from "../../../gui/theme"

type VerificationErrorAcceptPageAttrs = {}

export class VerificationErrorAcceptPage implements Component<VerificationErrorAcceptPageAttrs> {
	view(vnode: Vnode<VerificationErrorAcceptPageAttrs>) {
		const title = lang.get("keyManagement.verificationError_title")
		let subTitle = lang.get("keyVerificationErrorContactUpdated_msg")

		return m(".pt.pb.flex.col.gap-vpad", [
			m(TitleSection, {
				title,
				subTitle,
				icon: Icons.Fingerprint,
				iconOptions: { color: theme.content_accent },
			}),
		])
	}
}
