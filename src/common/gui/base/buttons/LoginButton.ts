import m, { Children, Component, Vnode } from "mithril"
import { BaseButton, BaseButtonAttrs } from "./BaseButton.js"
import { lang, TranslationText } from "../../../misc/LanguageViewModel.js"

export type LoginButtonAttrs = Pick<BaseButtonAttrs, "onclick" | "class"> & { label: TranslationText; disabled?: boolean }

export class LoginButton implements Component<LoginButtonAttrs> {
	view({ attrs }: Vnode<LoginButtonAttrs>): Children {
		const label = lang.getMaybeLazy(attrs.label)
		return m(BaseButton, {
			label,
			text: label,

			// This makes the button appear "disabled" (grey color, no hover) when disabled is set to true
			class: `button-content border-radius ${attrs.disabled ? "button-bg" : "accent-bg"} full-width center plr-button flash ${attrs.class} `,
			onclick: attrs.onclick,
			disabled: attrs.disabled,
		})
	}
}
