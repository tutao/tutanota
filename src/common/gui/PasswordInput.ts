import m, { Children, ClassComponent, Vnode } from "mithril"
import { SingleLineTextField } from "./base/SingleLineTextField.js"
import { TextFieldType } from "./base/TextField.js"
import { IconButton } from "./base/IconButton.js"
import { ButtonSize } from "./base/ButtonSize.js"
import { Icons } from "./base/icons/Icons.js"
import { theme } from "./theme.js"
import { scaleToVisualPasswordStrength } from "../misc/passwords/PasswordUtils.js"
import { px, size } from "./size.js"
import { lang } from "../misc/LanguageViewModel.js"

export interface PasswordInputAttributes {
	ariaLabel: string
	password: string
	strength: number
	oninput: (newValue: string) => unknown
}

export class PasswordInput implements ClassComponent<PasswordInputAttributes> {
	private showPassword: boolean = false

	view(vnode: Vnode<PasswordInputAttributes, this>): Children {
		return m(".flex.flex-grow.full-width.justify-between.items-center.gap-vpad-s", [
			m("div", {
				style: {
					width: px(size.icon_size_medium),
					height: px(size.icon_size_medium),
					border: `1px solid ${theme.content_button}`,
					borderRadius: "50%",
					background: `conic-gradient(from .25turn, ${theme.content_button} ${scaleToVisualPasswordStrength(vnode.attrs.strength)}%, transparent 0%)`,
				},
			}),
			m(SingleLineTextField, {
				classes: ["flex-grow"],
				ariaLabel: vnode.attrs.ariaLabel,
				type: this.showPassword ? TextFieldType.Text : TextFieldType.Password,
				value: vnode.attrs.password,
				oninput: vnode.attrs.oninput,
				style: {
					padding: `${px(size.vpad_xsm)} ${px(size.vpad_small)}`,
				},
				placeholder: lang.get("password_label"),
			}),
			m(IconButton, {
				size: ButtonSize.Compact,
				title: this.showPassword ? "concealPassword_action" : "revealPassword_action",
				icon: this.showPassword ? Icons.NoEye : Icons.Eye,
				click: () => (this.showPassword = !this.showPassword),
			}),
		])
	}
}
