import m, { Children } from "mithril"
import { Icons } from "../icons/Icons.js"
import { ClickHandler } from "../GuiUtils.js"
import { px } from "../../size.js"
import { BaseButton } from "./BaseButton.js"
import { Icon } from "../Icon.js"
import { theme } from "../../theme.js"

export default function renderSwitchMonthArrowIcon(forward: boolean, size: number, onClick: ClickHandler): Children {
	return m(BaseButton, {
		label: forward ? "nextMonth_label" : "prevMonth_label",
		icon: m(Icon, {
			icon: forward ? Icons.ChevronRight : Icons.ChevronLeft,
			container: "div",
			class: "center-h",
			style: {
				fill: theme.on_surface,
			},
		}),
		style: {
			width: px(size),
			height: px(size),
		},
		class: "state-bg circle",
		onclick: onClick,
	})
}
