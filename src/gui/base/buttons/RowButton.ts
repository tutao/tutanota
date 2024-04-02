import m, { Component, Vnode } from "mithril"
import { BaseButton } from "./BaseButton.js"
import { AllIcons, Icon } from "../Icon.js"
import { ClickHandler } from "../GuiUtils.js"
import { AriaRole } from "../../AriaUtils.js"
import { theme } from "../../theme.js"
import { lang, TranslationText } from "../../../misc/LanguageViewModel.js"

export interface RowButtonAttrs {
	label: TranslationText
	icon?: AllIcons | "none"
	selected?: boolean
	onclick: ClickHandler
	style?: Record<string, any>
	class?: string
	role?: AriaRole
}

export class RowButton implements Component<RowButtonAttrs> {
	view(vnode: Vnode<RowButtonAttrs>) {
		const attrs = vnode.attrs
		const label = lang.getMaybeLazy(attrs.label)
		const color = attrs.selected ? theme.content_button_selected : theme.content_button
		return m(BaseButton, {
			label,
			text: m(".plr-button.text-ellipsis", { style: { color } }, label),
			role: attrs.role,
			selected: attrs.selected,
			icon:
				attrs.icon && attrs.icon !== "none"
					? m(Icon, {
							icon: attrs.icon,
							container: "div",
							class: "mr-button",
							style: { fill: color },
							large: true,
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
