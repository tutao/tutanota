import m, { Children, Component, Vnode } from "mithril"
import type { MaybeTranslation } from "../../misc/LanguageViewModel"
import { AllIcons, Icon, IconSize } from "./Icon"
import type { ClickHandler } from "./GuiUtils"
import { assertMainOrNode } from "../../api/common/Env"
import { ButtonColor, getColors } from "./Button.js"
import { ButtonSize } from "./ButtonSize.js"
import { BaseButton, BaseButtonAttrs } from "./buttons/BaseButton.js"

assertMainOrNode()

export interface IconButtonAttrs {
	icon: AllIcons
	title: MaybeTranslation
	click: ClickHandler
	colors?: ButtonColor
	size?: ButtonSize
	onkeydown?: (event: KeyboardEvent) => unknown
	hidden?: boolean
	disabled?: boolean
}

export class IconButton implements Component<IconButtonAttrs> {
	view({ attrs }: Vnode<IconButtonAttrs>): Children {
		return m(BaseButton, {
			label: attrs.title,
			icon: m(Icon, {
				icon: attrs.icon,
				container: "div",
				class: "center-h",
				size: attrs.size === ButtonSize.Large ? IconSize.PX32 : IconSize.PX24,
				style: {
					fill: getColors(attrs.colors ?? ButtonColor.Content).button,
					visibility: attrs.hidden ? "hidden" : "visible",
				},
			}),
			onclick: attrs.click,
			onkeydown: attrs.onkeydown,
			class: `icon-button ${attrs.disabled ? "disabled" : "state-bg"} ${IconButton.getSizeClass(attrs.size)}`,
			disabled: attrs.hidden || attrs.disabled,
			style: {
				visibility: attrs.hidden ? "hidden" : "visible",
			},
		} satisfies BaseButtonAttrs)
	}

	private static getSizeClass(size: ButtonSize | undefined) {
		switch (size) {
			case ButtonSize.Compact:
				return "compact"
			case ButtonSize.Large:
				return "large"
			case ButtonSize.Normal:
			default:
				return ""
		}
	}
}
