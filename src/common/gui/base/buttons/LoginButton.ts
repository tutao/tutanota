import m, { Children, Component, Vnode } from "mithril"
import { BaseButton, BaseButtonAttrs } from "./BaseButton.js"
import { lang, MaybeTranslation } from "../../../misc/LanguageViewModel.js"

export const enum LoginButtonType {
	FullWidth = "FullWidth",
	FlexWidth = "FlexWidth",
}

export type LoginButtonAttrs = Pick<BaseButtonAttrs, "onclick" | "class"> & {
	label: MaybeTranslation
	disabled?: boolean
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

			onclick: attrs.onclick,
			disabled: attrs.disabled,
		})
	}

	private resolveClasses(attrs: LoginButtonAttrs) {
		let classes = [
			"button-content",
			"border-radius",
			"center",
			// This makes the button appear "disabled" (grey color, no hover) when disabled is set to true
			attrs.disabled ? "button-bg" : `accent-bg`,
			"flash",
			attrs.class,
		]

		if (attrs.type === LoginButtonType.FlexWidth) {
			classes.push("plr-2l")
		} else {
			classes.push("full-width plr-button")
		}

		return classes
	}
}
