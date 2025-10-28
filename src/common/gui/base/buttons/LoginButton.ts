import m, { Children, Component, Vnode } from "mithril"
import { BaseButton, BaseButtonAttrs } from "./BaseButton.js"
import { lang, MaybeTranslation } from "../../../misc/LanguageViewModel.js"
import { DefaultAnimationTime } from "../../animation/Animations"

export const enum LoginButtonType {
	FullWidth = "FullWidth",
	FlexWidth = "FlexWidth",
}

export type LoginButtonAttrs = Pick<BaseButtonAttrs, "onclick" | "class"> & {
	label: MaybeTranslation
	disabled?: boolean
	discouraged?: boolean
	type?: LoginButtonType
	icon?: Children
}

export class LoginButton implements Component<LoginButtonAttrs> {
	view({ attrs }: Vnode<LoginButtonAttrs>): Children {
		let classes = this.resolveClasses(attrs)

		return m(BaseButton, {
			icon: attrs.icon,
			label: attrs.label,
			text: lang.getTranslationText(attrs.label),
			class: classes.join(" "),
			style: {
				transition: `background ${DefaultAnimationTime}ms ease-in-out, color ${DefaultAnimationTime}ms ease-in-out, opacity ${DefaultAnimationTime}ms ease-in-out`,
			},
			onclick: attrs.onclick,
			disabled: attrs.disabled,
		})
	}

	private resolveClasses(attrs: LoginButtonAttrs) {
		let classes = ["button-content", "border-radius", "center", attrs.class]

		if (attrs.disabled) {
			// This makes the button appear "disabled" (grey color, no hover) when disabled is set to true
			classes.push("disabled-button")
		} else if (attrs.discouraged) {
			// This makes the button appear outlined with a transparent background
			classes.push("tutaui-button-outline")
		} else {
			classes.push("accent-bg")
		}

		if (attrs.type === LoginButtonType.FlexWidth) {
			classes.push("plr-2l")
		} else {
			classes.push("full-width plr-button")
		}

		return classes
	}
}
