import m, { Children, Component, Vnode } from "mithril"
import type { TranslationText } from "../../misc/LanguageViewModel"
import { lang } from "../../misc/LanguageViewModel"
import { AllIcons, Icon, IconSize } from "./Icon"
import type { ClickHandler } from "./GuiUtils"
import { assertMainOrNode } from "../../api/common/Env"
import { ButtonColor, getColors } from "./Button.js"
import { ButtonSize } from "./ButtonSize.js"
import { BaseButton, BaseButtonAttrs } from "./buttons/BaseButton.js"

assertMainOrNode()

export interface IconButtonAttrs {
	icon: AllIcons
	title: TranslationText
	click: ClickHandler
	colors?: ButtonColor
	size?: ButtonSize
	onkeydown?: (event: KeyboardEvent) => unknown
}

export class IconButton implements Component<IconButtonAttrs> {
	view({ attrs }: Vnode<IconButtonAttrs>): Children {
		return m(BaseButton, {
			label: lang.getMaybeLazy(attrs.title),
			icon: m(Icon, {
				icon: attrs.icon,
				container: "div",
				class: "center-h",
				size: attrs.size === ButtonSize.Large ? IconSize.XL : IconSize.Medium,
				style: {
					fill: getColors(attrs.colors ?? ButtonColor.Content).button,
				},
			}),
			onclick: attrs.click,
			onkeydown: attrs.onkeydown,
			class: `icon-button state-bg ${IconButton.getSizeClass(attrs.size)}`,
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
