import { lang, TranslationKey } from "../misc/LanguageViewModel.js"
import { ClickHandler } from "./base/GuiUtils.js"
import m, { Children } from "mithril"
import { theme } from "./theme.js"
import { px, size } from "./size.js"
import { BaseButton, BaseButtonAttrs } from "./base/buttons/BaseButton.js"

export interface MainCreateButtonAttrs {
	label: TranslationKey
	click: ClickHandler
	class?: string
}

/**
 * Main button used to open the creation dialog for emails,contacts and events.
 */
export const MainCreateButton = (buttonAttrs: MainCreateButtonAttrs): Children => {
	const label = lang.get(buttonAttrs.label)
	return m(BaseButton, {
		label,
		text: label,
		onclick: buttonAttrs.click,
		class: `full-width border-radius-big center b flash ${buttonAttrs.class}`,
		style: {
			border: `2px solid ${theme.content_accent}`,
			// matching toolbar
			height: px(size.button_height + size.vpad_xs * 2),
			color: theme.content_accent,
		},
	} satisfies BaseButtonAttrs)
}
