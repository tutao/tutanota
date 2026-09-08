import { lang, TranslationKey } from "./utils/LanguageViewModel.js"
import { ClickHandler } from "./base/GuiUtils.js"
import m, { Children, Component, Vnode } from "mithril"
import { theme } from "./theme.js"
import { component_size, px, size } from "./size.js"
import { BaseButton, BaseButtonAttrs } from "./base/buttons/BaseButton.js"
import { boxShadowLow } from "./main-styles.js"
import { AllIcons, Icon, IconSize } from "./base/Icon"
import { ButtonColor, getColors } from "./base/Button"
import { Icons } from "./base/icons/Icons.js"

export interface MainCreateButtonAttrs {
	label: TranslationKey
	click: ClickHandler
	class?: string
	disabled?: boolean
	icon?: Icons
}

/**
 * Main button used to open the creation dialog for emails, contacts, and events.
 */
export class MainCreateButton implements Component<MainCreateButtonAttrs> {
	view(vnode: Vnode<MainCreateButtonAttrs>): Children {
		return m(BaseButton, {
			label: vnode.attrs.label,
			disabled: vnode.attrs.disabled,
			text: lang.get(vnode.attrs.label),
			onclick: vnode.attrs.click,
			icon: vnode.attrs.icon
				? m(Icon, {
						icon: vnode.attrs.icon,
						container: "div",
						class: "mr-8",
						size: IconSize.PX24,
						style: {
							fill: theme.on_primary_container,
							visibility: "visible",
						},
					})
				: null,
			class: `plr-16 border-radius-12 flex-start items-center b flash ${vnode.attrs.class}`,
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
