import m, { Children } from "mithril"
import { IconButton } from "../IconButton.js"
import { TabIndex } from "../../../api/common/TutanotaConstants.js"
import { Icons } from "../icons/Icons.js"
import { BootIcons } from "../icons/BootIcons.js"
import { ButtonSize } from "../ButtonSize.js"
import { ButtonColor } from "../Button.js"
import { ClickHandler } from "../GuiUtils.js"
import { px } from "../../size.js"

export default function renderSwitchMonthArrowIcon(forward: boolean, size: number, onClick: ClickHandler): Children {
	return m(IconButton, {
		title: forward ? "nextMonth_label" : "prevMonth_label",
		tabIndex: TabIndex.Default,
		icon: forward ? Icons.ArrowForward : BootIcons.Back,
		size: ButtonSize.Calendar,
		class: "state-bg circle",
		style: {
			width: px(size),
			height: px(size),
		},
		colors: ButtonColor.CalendarNav,
		click: onClick,
	})
}
