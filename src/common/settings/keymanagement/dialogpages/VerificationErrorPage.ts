import m, { Component, Vnode } from "mithril"
import { KeyVerificationModel } from "../KeyVerificationModel"
import { lang } from "../../../misc/LanguageViewModel"
import { TitleSection } from "../../../gui/TitleSection"
import { Icons } from "../../../gui/base/icons/Icons"
import { LoginButton } from "../../../gui/base/buttons/LoginButton"
import { theme } from "../../../gui/theme"

type VerificationErrorPageAttrs = {
	model: KeyVerificationModel
	retryAction: () => void
}

export class VerificationErrorPage implements Component<VerificationErrorPageAttrs> {
	view(vnode: Vnode<VerificationErrorPageAttrs>) {
		return m(".pt.pb.flex.col.gap-vpad", [
			m(TitleSection, {
				title: lang.get("keyManagement.verificationErrorTitle_label"),
				subTitle: lang.get("keyManagement.qrFingerprintMismatch_msg"),
				icon: Icons.AlertCircle,
				iconOptions: { color: theme.error_color },
			}),
			m(LoginButton, {
				label: "retry_action",
				onclick: () => vnode.attrs.retryAction(),
			}),
		])
	}
}
