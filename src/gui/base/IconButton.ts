import m, {Children, Component, Vnode} from "mithril"
import type {TranslationText} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import type {AllIcons} from "./Icon"
import {Icon} from "./Icon"
import type {clickHandler} from "./GuiUtils"
import {assertMainOrNode} from "../../api/common/Env"
import {ButtonColor, getColors} from "./Button.js"
import {assertNotNull} from "@tutao/tutanota-utils"
import {ButtonSize} from "./ButtonSize.js"

assertMainOrNode()

export interface IconButtonAttrs {
	icon: AllIcons
	title: TranslationText,
	click: clickHandler
	colors?: ButtonColor
	size?: ButtonSize
}

export class IconButton implements Component<IconButtonAttrs> {
	private dom: HTMLElement | null = null

	view({attrs}: Vnode<IconButtonAttrs>): Children {
		return m("button.icon-button.state-bg", {
			oncreate: ({dom}) => {
				this.dom = dom as HTMLElement
			},
			onclick: (e: MouseEvent) => attrs.click(e, assertNotNull(this.dom)),
			title: lang.getMaybeLazy(attrs.title),
			class: attrs.size === ButtonSize.Compact ? "compact" : "",
		}, m(Icon, {
			icon: attrs.icon,
			container: "div",
			class: "center-h",
			large: true,
			style: {
				fill: getColors(attrs.colors ?? ButtonColor.Content).button,
			},
		}))
	}
}