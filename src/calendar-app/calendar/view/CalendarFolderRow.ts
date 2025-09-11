import { IconButton, IconButtonAttrs } from "../../../common/gui/base/IconButton"
import m, { Children, Component, Vnode } from "mithril"
import { Keys, TabIndex } from "../../../common/api/common/TutanotaConstants"
import { isKeyPressed } from "../../../common/misc/KeyManager"
import { px, size } from "../../../common/gui/size"
import { CalendarViewModel } from "./CalendarViewModel"

export type CalendarFolderRowAttrs = {
	calendarId: string
	name: string
	color: string
	isHidden: boolean
	viewModel: CalendarViewModel
	rightButton?: IconButtonAttrs | null
}

export class CalendarFolderRow implements Component<CalendarFolderRowAttrs> {
	view(vnode: Vnode<CalendarFolderRowAttrs>): Children {
		const attrs = vnode.attrs
		// const { userSettingsGroupRoot } = locator.logins.getUserController()
		// const existingGroupSettings = userSettingsGroupRoot.groupSettings.find((gc) => gc.group === calendarInfo.groupInfo.group) ?? null
		//
		// const renderInfo = this.viewModel.getCalendarModel().getCalendarRenderInfo(calendarInfo.groupInfo.group, existingGroupSettings)
		let colorValue = attrs.color
		let groupName = attrs.name
		// if (isClientOnlyCalendar(calendarInfo.group._id)) {
		// 	const clientOnlyId = calendarInfo.group._id.match(/#(.*)/)?.[1]!
		// 	const clientOnlyCalendarConfig = deviceConfig.getClientOnlyCalendars().get(calendarInfo.group._id)
		// 	colorValue = "#" + (clientOnlyCalendarConfig?.color ?? DEFAULT_CLIENT_ONLY_CALENDAR_COLORS.get(clientOnlyId))
		// 	groupName = clientOnlyCalendarConfig?.name ?? clientOnlyId
		// }

		// const lastSyncEntry = deviceConfig.getLastExternalCalendarSync().get(calendarRenderInfo.id)
		// const lastSyncDate = lastSyncEntry?.lastSuccessfulSync ? new Date(lastSyncEntry.lastSuccessfulSync) : null
		// const lastSyncStr = lastSyncDate
		// 	? lang.get("lastSync_label", { "{date}": `${formatDate(lastSyncDate)} at ${formatTime(lastSyncDate)}` })
		// 	: lang.get("iCalNotSync_msg")

		return m(".folder-row.flex-start.plr-button", [
			m(".flex.flex-grow.center-vertically.button-height", [
				m(".calendar-checkbox", {
					role: "checkbox",
					title: groupName,
					tabindex: TabIndex.Default,
					"aria-checked": (!attrs.isHidden).toString(),
					"aria-label": groupName,
					onclick: () => attrs.viewModel.toggleHiddenCalendar(attrs.calendarId),
					onkeydown: (e: KeyboardEvent) => {
						if (isKeyPressed(e.key, Keys.SPACE, Keys.RETURN)) {
							attrs.viewModel.toggleHiddenCalendar(attrs.calendarId)
							e.preventDefault()
						}
					},
					style: {
						"border-color": colorValue,
						background: attrs.isHidden ? "" : colorValue,
						transition: "all 0.3s",
						cursor: "pointer",
						marginLeft: px(size.hpad_button),
					},
				}),
				m(
					".pl-m.b.flex-grow.text-ellipsis",
					{
						style: {
							width: 0,
						},
					},
					groupName,
				),
			]),
			attrs.rightButton ? m(IconButton, attrs.rightButton) : null,
			// hasSourceUrl(existingGroupSettings) && lastSyncEntry?.lastSyncStatus === SyncStatus.Failed
			// 	? m(Icon, {
			// 			title: lastSyncStr,
			// 			icon: Icons.SyncProblem,
			// 			size: IconSize.Medium,
			// 			class: "pr-s",
			// 			style: {
			// 				fill: theme.content_button,
			// 			},
			// 		})
			// 	: null,
			// this.createCalendarActionDropdown(calendarItem, colorValue ?? defaultCalendarColor, existingGroupSettings, userSettingsGroupRoot, shared),
		])
	}
}
