import m, { Children } from "mithril"
import { Icons } from "../icons/Icons.js"
import { BootIcons } from "../icons/BootIcons.js"
import { ClickHandler } from "../GuiUtils.js"
import { px } from "../../size.js"
import { BaseButton } from "./BaseButton.js"
import { lang } from "../../../misc/LanguageViewModel.js"
import { Icon, IconSize } from "../Icon.js"
import { theme } from "../../theme.js"

export default function renderSwitchMonthArrowIcon(forward: boolean, size: number, onClick: ClickHandler): Children {
	return m(BaseButton, {
		label: forward ? lang.get("nextMonth_label") : lang.get("prevMonth_label"),
		icon: m(Icon, {
			icon: forward ? Icons.ArrowForward : BootIcons.Back,
			container: "div",
			class: "center-h",
			size: IconSize.Normal,
			style: {
				fill: theme.content_fg,
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
