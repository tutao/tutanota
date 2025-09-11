import { lang, TranslationKey } from "../misc/LanguageViewModel.js"
import { ClickHandler } from "./base/GuiUtils.js"
import m, { Children, Component, Vnode } from "mithril"
import { theme } from "./theme.js"
import { px, size } from "./size.js"
import { BaseButton, BaseButtonAttrs } from "./base/buttons/BaseButton.js"
import { boxShadowLow } from "./main-styles.js"

export interface MainCreateButtonAttrs {
	label: TranslationKey
	click: ClickHandler
	class?: string
	disabled?: boolean
}

/**
 * Main button used to open the creation dialog for emails,contacts and events.
 */
export class MainCreateButton implements Component<MainCreateButtonAttrs> {
	view(vnode: Vnode<MainCreateButtonAttrs>): Children {
		return m(BaseButton, {
			label: vnode.attrs.label,
			disabled: vnode.attrs.disabled,
			text: lang.get(vnode.attrs.label),
			onclick: vnode.attrs.click,
			class: `full-width border-radius-big center b flash ${vnode.attrs.class}`,
			style: {
				// matching toolbar
				height: px(size.button_height + size.vpad_xs * 2),
				"background-color": theme.primary_container,
				color: theme.on_primary_container,
				"box-shadow": boxShadowLow,
			},
		} satisfies BaseButtonAttrs)
	}
}
