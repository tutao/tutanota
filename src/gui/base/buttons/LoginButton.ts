import m, { _NoLifecycle, Children, Component, Vnode } from "mithril"
import { BaseButton, BaseButtonAttrs } from "./BaseButton.js"
import { lang, TranslationText } from "../../../misc/LanguageViewModel.js"

export type LoginButtonAttrs = Pick<BaseButtonAttrs, "onclick" | "class"> & { label: TranslationText }

export class LoginButton implements Component<LoginButtonAttrs> {
	view({ attrs }: Vnode<LoginButtonAttrs>): Children {
		const label = lang.getMaybeLazy(attrs.label)
		return m(BaseButton, {
			label,
			text: label,
			class: `button-content border-radius accent-bg full-width center plr-button flash ${attrs.class} `,
			onclick: attrs.onclick,
		})
	}
}
