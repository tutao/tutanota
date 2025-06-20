import m, { Component, Vnode } from "mithril"
import { lang } from "../../../misc/LanguageViewModel"
import { TitleSection } from "../../../gui/TitleSection"
import { Icons } from "../../../gui/base/icons/Icons"
import { theme } from "../../../gui/theme"

type VerificationErrorRejectPageAttrs = {}

export class VerificationErrorRejectPage implements Component<VerificationErrorRejectPageAttrs> {
	view(vnode: Vnode<VerificationErrorRejectPageAttrs>) {
		const title = lang.get("keyManagement.verificationError_title")
		let subTitle = lang.get("keyVerificationErrorContactNotUpdated_msg")

		return m(".pt.pb.flex.col.gap-vpad", [
			m(TitleSection, {
				title,
				subTitle,
				icon: Icons.AlertCircle,
				iconOptions: { color: theme.error_color },
			}),
		])
	}
}
