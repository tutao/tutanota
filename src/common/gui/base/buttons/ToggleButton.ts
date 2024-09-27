import m, { Children, Component, Vnode } from "mithril"
import { AllIcons, Icon, IconSize } from "../Icon.js"
import { lang, TranslationText } from "../../../misc/LanguageViewModel.js"
import { ButtonColor, getColors } from "../Button.js"
import { ButtonSize } from "../ButtonSize.js"
import { BaseButton } from "./BaseButton.js"

export interface ToggleButtonAttrs {
	icon: AllIcons
	// The title should not change on toggle. See: https://www.w3.org/WAI/ARIA/apg/patterns/button/
	title: TranslationText
	toggled: boolean
	onToggled: (selected: boolean, event: MouseEvent) => unknown
	colors?: ButtonColor
	size?: ButtonSize
	style?: Record<string, any>
}

export class ToggleButton implements Component<ToggleButtonAttrs> {
	view({ attrs }: Vnode<ToggleButtonAttrs>): Children {
		return m(BaseButton, {
			label: lang.getMaybeLazy(attrs.title),
			icon: m(Icon, {
				icon: attrs.icon,
				container: "div",
				class: "center-h",
				size: IconSize.Medium,
				style: {
					fill: getColors(attrs.colors ?? ButtonColor.Content).button,
				},
			}),
			class: `toggle-button state-bg ${attrs.size === ButtonSize.Compact ? "compact" : ""}`,
			style: attrs.style,
			pressed: attrs.toggled,
			onclick: (e: MouseEvent) => attrs.onToggled(!attrs.toggled, e),
		})
	}
}
