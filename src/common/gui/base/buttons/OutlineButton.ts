import m, { Children, ClassComponent, Vnode } from "mithril"
import { lang, TranslationKey, MaybeTranslation } from "../../../misc/LanguageViewModel.js"
import { ClickHandler } from "../GuiUtils.js"
import { BaseButton, BaseButtonAttrs } from "./BaseButton.js"
import { theme } from "../../theme.js"

export interface OutlineButtonAttrs {
	label: TranslationKey
	text?: MaybeTranslation
	click?: ClickHandler
	disabled?: boolean
	expanded?: boolean
}

/**
 * Simple outline button component
 * @see Component attributes: {OutlineButtonAttrs}
 * @example
 * m(OutlineButton, {
 * 	   label: button.label,
 * 	   click: button.click,
 * 	   disabled: button.isReadOnly,
 * }),
 */
export class OutlineButton implements ClassComponent<OutlineButtonAttrs> {
	view({ attrs }: Vnode<OutlineButtonAttrs>): Children {
		return m(BaseButton, {
			label: attrs.label,
			text: attrs.text ? lang.getTranslationText(attrs.text) : lang.getTranslationText(attrs.label),
			onclick: attrs.click,
			disabled: attrs.disabled,
			style: {
				borderColor: theme.content_message_bg,
				color: theme.content_button,
			},
			class: this.resolveClasses(attrs.expanded, attrs.disabled),
		} as BaseButtonAttrs)
	}

	private resolveClasses(expanded: boolean = true, disabled: boolean = false) {
		let classes = [
			"tutaui-button-outline",
			"limit-width",
			"noselect",
			"bg-transparent",
			"text-ellipsis",
			"content-accent-fg",
			"flex",
			"items-center",
			"justify-center",
		]

		if (expanded) {
			classes.push("full-width")
		}

		if (disabled) {
			classes.push("disabled", "click-disabled")
		} else {
			classes.push("flash")
		}

		return classes.join(" ")
	}
}
