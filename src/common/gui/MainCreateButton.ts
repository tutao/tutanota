import { lang, TranslationKey } from "../misc/LanguageViewModel.js"
import { ClickHandler } from "./base/GuiUtils.js"
import m, { Children, Component, Vnode } from "mithril"
import { theme } from "./theme.js"
import { component_size, px, size } from "./size.js"
import { BaseButton, BaseButtonAttrs } from "./base/buttons/BaseButton.js"
import { boxShadowLow } from "./main-styles.js"

export interface MainCreateButtonAttrs {
	label: TranslationKey
	click: ClickHandler
	class?: string
}

/**
 * Main button used to open the creation dialog for emails,contacts and events.
 */
export class MainCreateButton implements Component<MainCreateButtonAttrs> {
	view(vnode: Vnode<MainCreateButtonAttrs>): Children {
		return m(BaseButton, {
			label: vnode.attrs.label,
			text: lang.get(vnode.attrs.label),
			onclick: vnode.attrs.click,
			class: `full-width border-radius-12 center b flash ${vnode.attrs.class}`,
			style: {
				// matching toolbar
				height: px(component_size.button_height + size.spacing_4 * 2),
				"background-color": theme.primary_container,
				color: theme.on_primary_container,
				"box-shadow": boxShadowLow,
			},
		} satisfies BaseButtonAttrs)
	}
}
