import { Keys, TabIndex } from "../../../common/api/common/TutanotaConstants"
import m, { Component, Vnode } from "mithril"
import { isKeyPressed } from "../../../common/misc/KeyManager"
import { px, size } from "../../../common/gui/size"
import { Icon, IconAttrs, IconSize } from "../../../common/gui/base/Icon"
import { theme } from "../../../common/gui/theme"
import { CalendarInfoBase } from "../model/CalendarModel"
import { IconButton } from "../../../common/gui/base/IconButton"
import { ButtonColor } from "../../../common/gui/base/Button"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { ButtonSize } from "../../../common/gui/base/ButtonSize"
import { createDropdown, DropdownChildAttrs } from "../../../common/gui/base/Dropdown"

export type CalendarSidebarRowIconData = Pick<IconAttrs, "icon" | "title">
export type CalendarSidebarRowAttrs = Omit<CalendarInfoBase, "type"> & {
	isHidden: boolean
	toggleHiddenCalendar: (calendarId: string) => void
	rightIcon?: CalendarSidebarRowIconData
	actions: ReadonlyArray<DropdownChildAttrs>
}

export class CalendarSidebarRow implements Component<CalendarSidebarRowAttrs> {
	view(vnode: Vnode<CalendarSidebarRowAttrs>) {
		const { id, name, color, isHidden, toggleHiddenCalendar, rightIcon, actions } = vnode.attrs
		return m(".folder-row.flex-start.plr-8", [
			m(".flex.flex-grow.center-vertically.button-height", [
				m(".calendar-checkbox", {
					role: "checkbox",
					title: name,
					tabindex: TabIndex.Default,
					"aria-checked": (!isHidden).toString(),
					"aria-label": name,
					onclick: () => toggleHiddenCalendar(id),
					onkeydown: (e: KeyboardEvent) => {
						if (isKeyPressed(e.key, Keys.SPACE, Keys.RETURN)) {
							toggleHiddenCalendar(id)
							e.preventDefault()
						}
					},
					style: {
						"border-color": `#${color}`,
						background: isHidden ? "" : `#${color}`,
						transition: "all 0.3s",
						cursor: "pointer",
						marginLeft: px(size.spacing_4),
					},
				}),
				m(
					".pl-12.b.flex-grow.text-ellipsis",
					{
						style: {
							width: 0,
						},
					},
					name,
				),
			]),
			rightIcon
				? m(Icon, {
						title: rightIcon.title,
						icon: rightIcon.icon,
						size: IconSize.PX24,
						class: "pr-4",
						style: {
							fill: theme.on_surface_variant,
						},
					})
				: null,
			m(IconButton, {
				title: "more_label",
				colors: ButtonColor.Nav,
				icon: Icons.More,
				size: ButtonSize.Compact,
				click: createDropdown({
					lazyButtons: () => actions,
				}),
			}),
		])
	}
}
