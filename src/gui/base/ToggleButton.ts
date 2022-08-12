import m, {Children, Component, Vnode} from "mithril"
import {AllIcons, Icon} from "./Icon.js"
import {lang, TranslationText} from "../../misc/LanguageViewModel.js"
import {ButtonColor, getColors} from "./Button.js"
import {ButtonSize} from "./ButtonSize.js"

export interface ToggleButtonAttrs {
	icon: AllIcons
	title: TranslationText
	selected: boolean
	onSelected: (selected: boolean, event: MouseEvent) => unknown
	colors?: ButtonColor
	size?: ButtonSize
}

export class ToggleButton implements Component<ToggleButtonAttrs> {
	view({attrs}: Vnode<ToggleButtonAttrs>): Children {
		return m("button.toggle-button.state-bg", {
			title: lang.getMaybeLazy(attrs.title),
			onclick: (e: MouseEvent) => attrs.onSelected(!attrs.selected, e),
			toggled: String(attrs.selected),
			class: attrs.size === ButtonSize.Compact ? "compact" : "",
			"aria-pressed": String(attrs.selected),
		}, m(Icon, {
			icon: attrs.icon,
			container: "div",
			class: "center-h",
			large: true,
			style: {
				fill: getColors(attrs.colors ?? ButtonColor.Content).button,
			}
		}))
	}
}