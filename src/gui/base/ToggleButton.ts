import m, { Children, Component, Vnode } from "mithril"
import { AllIcons, Icon } from "./Icon.js"
import { lang, TranslationText } from "../../misc/LanguageViewModel.js"
import { ButtonColor, getColors } from "./Button.js"
import { ButtonSize } from "./ButtonSize.js"

export interface ToggleButtonAttrs {
	icon: AllIcons
	title: TranslationText
	toggled: boolean
	onToggled: (selected: boolean, event: MouseEvent) => unknown
	colors?: ButtonColor
	size?: ButtonSize
	toggledTitle?: TranslationText
	style?: Record<string, any>
}

export class ToggleButton implements Component<ToggleButtonAttrs> {
	view({ attrs }: Vnode<ToggleButtonAttrs>): Children {
		return m(
			"button.toggle-button.state-bg",
			{
				title: attrs.toggledTitle && attrs.toggled ? lang.getMaybeLazy(attrs.toggledTitle) : lang.getMaybeLazy(attrs.title),
				onclick: (e: MouseEvent) => attrs.onToggled(!attrs.toggled, e),
				toggled: String(attrs.toggled),
				class: attrs.size === ButtonSize.Compact ? "compact" : "",
				"aria-pressed": String(attrs.toggled),
				style: attrs.style,
			},
			m(Icon, {
				icon: attrs.icon,
				container: "div",
				class: "center-h",
				large: true,
				style: {
					fill: getColors(attrs.colors ?? ButtonColor.Content).button,
				},
			}),
		)
	}
}
