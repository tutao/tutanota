import { IconButtonAttrs } from "../../../common/gui/base/IconButton.js"
import m, { Children, Component, Vnode } from "mithril"
import { Icons } from "../../../common/gui/base/icons/Icons.js"
import { BaseButton } from "../../../common/gui/base/buttons/BaseButton.js"
import { Icon, IconSize } from "../../../common/gui/base/Icon.js"
import { theme } from "../../../common/gui/theme.js"

type TodayIconButtonAttrs = Pick<IconButtonAttrs, "click">

/**
 * Button that has a current day number displayed in it.
 */
export class TodayIconButton implements Component<TodayIconButtonAttrs> {
	view({ attrs }: Vnode<TodayIconButtonAttrs>): Children {
		return m(BaseButton, {
			label: "today_label",
			onclick: attrs.click,
			icon: m(Icon, {
				container: "div",
				class: "center-h svg-text-content-bg",
				size: IconSize.PX24,
				svgParameters: { date: new Date().getDate().toString() },
				icon: Icons.Today,
				style: {
					fill: theme.on_surface_variant,
				},
			}),
			class: "icon-button state-bg",
		})
	}
}
