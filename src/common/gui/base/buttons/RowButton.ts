import m, { Component, Vnode } from "mithril"
import { BaseButton } from "./BaseButton.js"
import { AllIcons, Icon, IconSize } from "../Icon.js"
import { ClickHandler } from "../GuiUtils.js"
import { AriaRole } from "../../AriaUtils.js"
import { theme } from "../../theme.js"
import { lang, TranslationText } from "../../../misc/LanguageViewModel.js"

export interface RowButtonAttrs {
	/** accessibility & tooltip description */
	label: TranslationText
	/** visible text inside button */
	text?: TranslationText
	icon?: AllIcons | "none"
	selected?: boolean
	onclick: ClickHandler
	style?: Record<string, any>
	class?: string
	role?: AriaRole
}

/** A button that is styled the same as a `NavButton`. */
export class RowButton implements Component<RowButtonAttrs> {
	view(vnode: Vnode<RowButtonAttrs>) {
		const attrs = vnode.attrs
		const label = lang.getMaybeLazy(attrs.label)
		const text = lang.getMaybeLazy(attrs.text ?? attrs.label)
		const color = attrs.selected ? theme.content_button_selected : theme.content_button
		return m(BaseButton, {
			label,
			text: m(".plr-button.text-ellipsis", { style: { color } }, text),
			role: attrs.role,
			selected: attrs.selected,
			icon:
				attrs.icon && attrs.icon !== "none"
					? m(Icon, {
							icon: attrs.icon,
							container: "div",
							class: "mr-button",
							style: { fill: color },
							size: IconSize.Medium,
					  })
					: attrs.icon === "none"
					? m(".icon-large.mr-button")
					: null,
			class: "flex items-center state-bg button-content plr-button " + attrs.class,
			style: {
				...attrs.style,
				color,
			},
			onclick: attrs.onclick,
		})
	}
}
