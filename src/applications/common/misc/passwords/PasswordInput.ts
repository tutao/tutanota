import m, { Children, ClassComponent, Vnode } from "mithril"
import { SingleLineTextField } from "../../../../ui/base/SingleLineTextField.js"
import { LegacyTextFieldType } from "../../../../ui/base/LegacyTextField.js"
import { IconButton } from "../../../../ui/base/IconButton.js"
import { ButtonSize } from "../../../../ui/base/ButtonSize.js"
import { Icons } from "../../../../ui/base/icons/Icons.js"
import { theme } from "../../../../ui/theme.js"
import { scaleToVisualPasswordStrength } from "./PasswordUtils.js"
import { px, size } from "../../../../ui/size.js"
import { lang, Translation } from "../../../../ui/utils/LanguageViewModel.js"

export interface PasswordInputAttributes {
	ariaLabel: Translation
	password: string
	strength: number
	oninput: (newValue: string) => unknown
	showStrength?: boolean
}

export class PasswordInput implements ClassComponent<PasswordInputAttributes> {
	private showPassword: boolean = false

	view(vnode: Vnode<PasswordInputAttributes, this>): Children {
		return m(".flex.flex-grow.full-width.justify-between.items-center.gap-8", [
			vnode.attrs.showStrength
				? m("div", {
						style: {
							width: px(size.icon_16),
							height: px(size.icon_16),
							border: `1px solid ${theme.outline}`,
							borderRadius: "50%",
							background: `conic-gradient(from .25turn, ${theme.on_surface} ${scaleToVisualPasswordStrength(
								vnode.attrs.strength,
							)}%, transparent 0%)`,
						},
					})
				: null,
			m(SingleLineTextField, {
				classes: ["flex-grow"],
				ariaLabel: vnode.attrs.ariaLabel,
				type: this.showPassword ? LegacyTextFieldType.Text : LegacyTextFieldType.Password,
				value: vnode.attrs.password,
				oninput: vnode.attrs.oninput,
				style: {
					padding: `${px(size.spacing_4)} ${px(size.spacing_8)}`,
				},
				placeholder: lang.get("password_label"),
			}),
			m(IconButton, {
				size: ButtonSize.Compact,
				title: this.showPassword ? "concealPassword_action" : "revealPassword_action",
				icon: this.showPassword ? Icons.EyeCrossedFilled : Icons.EyeFilled,
				click: () => (this.showPassword = !this.showPassword),
			}),
		])
	}
}
