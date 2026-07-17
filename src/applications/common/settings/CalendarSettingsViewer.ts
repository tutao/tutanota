import type { UpdatableSettingsViewer } from "./Interfaces"
import m, { Children, Vnode } from "mithril"
import { TimeFormat, WeekStart } from "@tutao/app-env"
import { downcast, incrementDate, noOp, ofClass } from "@tutao/utils"
import * as RestError from "@tutao/rest-client/error"
import { deviceConfig } from "../misc/DeviceConfig"
import { EntityClient } from "../../../platform-kit/network/EntityClient"
import { UserSettingsGroupRootTypeRef } from "@tutao/entities/tutanota"
import { DateTime } from "luxon"
import { lang } from "../../../ui/utils/LanguageViewModel"
import { DropDownSelector, DropDownSelectorAttrs, SelectorItemList } from "../../../ui/base/DropDownSelector"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { CalendarViewType } from "../api/common/utils/CommonCalendarUtils"
import { locator } from "../api/main/CommonLocator"
import { UserController } from "../api/main/UserController"
import { elementIdToId } from "@tutao/meta"

export class CalendarSettingsViewer implements UpdatableSettingsViewer {
	private scrollTimeOptions: Array<{ name: string; value: number }> = []

	constructor(
		private readonly entityClient: EntityClient,
		private readonly userController: UserController,
	) {
		const timeFormat = this.userController.userSettingsGroupRoot.timeFormat
		this.updateScrollTimeOptions(timeFormat)
	}

	view(vnode: Vnode): Children {
		return m(".fill-absolute.scroll.plr-24.pb-48", [
			m("#calendarview.h4.mt-32", lang.getTranslation("calendar_label").text),
			m("#weekstart", m(DropDownSelector, this.makeWeekStartDropdownAttrs())),
			m("#devicesettings.h4.mt-32", lang.getTranslation("settingsForDevice_label").text),
			m("#weekscrolltime", m(DropDownSelector, this.makeScrollTimeDropdownAttrs())),
			m("#defaultcalendarview", m(DropDownSelector, this.makeDefaultCalendarViewDropdownAttrs())),
		])
	}

	private makeScrollTimeDropdownAttrs(): DropDownSelectorAttrs<number> {
		return {
			label: "weekScrollTime_label",
			helpLabel: () => lang.getTranslation("weekScrollTime_msg").text,
			items: this.scrollTimeOptions as SelectorItemList<number>,
			selectedValue: deviceConfig.getScrollTime(),
			selectionChangedHandler: (value) => deviceConfig.setScrollTime(value),
			dropdownWidth: 300,
		}
	}

	private makeWeekStartDropdownAttrs(): DropDownSelectorAttrs<WeekStart> {
		const weekdayFormatter = new Intl.DateTimeFormat(lang.languageTag, {
			weekday: "long",
		})
		const today = new Date()
		const sunday = incrementDate(new Date(today), -today.getDay())

		const getWeekdayName = (offset: number): string => weekdayFormatter.format(incrementDate(new Date(sunday), offset))

		const sundayName = getWeekdayName(0)
		const mondayName = getWeekdayName(1)
		const saturdayName = getWeekdayName(6)

		const weekStartDropDownAttrs: DropDownSelectorAttrs<WeekStart> = {
			label: "weekStart_label",
			items: [
				{
					name: mondayName,
					value: WeekStart.MONDAY,
				},
				{
					name: sundayName,
					value: WeekStart.SUNDAY,
				},
				{
					name: saturdayName,
					value: WeekStart.SATURDAY,
				},
			],
			selectedValue: downcast(this.userController.userSettingsGroupRoot.startOfTheWeek),
			selectionChangedHandler: (value) => {
				this.userController.userSettingsGroupRoot.startOfTheWeek = value
				this.entityClient.update(this.userController.userSettingsGroupRoot).catch(ofClass(RestError.LockedError, noOp))
			},
		}
		return weekStartDropDownAttrs
	}

	private makeDefaultCalendarViewDropdownAttrs(): DropDownSelectorAttrs<CalendarViewType | null> {
		return {
			label: "defaultCalendarView_label",
			items: [
				{ name: lang.getTranslationText("lastSelected_label"), value: null },
				{ name: lang.getTranslationText("agenda_label"), value: CalendarViewType.AGENDA },
				{ name: lang.getTranslationText("day_label"), value: CalendarViewType.DAY },
				{ name: lang.getTranslationText("threeDays_label"), value: CalendarViewType.THREE_DAY },
				{ name: lang.getTranslationText("week_label"), value: CalendarViewType.WEEK },
				{ name: lang.getTranslationText("month_label"), value: CalendarViewType.MONTH },
			],
			selectedValue: deviceConfig.getDefaultCalenderViewSetting(elementIdToId(locator.logins.getUserController().user._id)),
			selectionChangedHandler: (value: CalendarViewType | null) => {
				deviceConfig.setDefaultCalendarViewSetting(elementIdToId(locator.logins.getUserController().user._id), value)
			},
		}
	}

	private updateScrollTimeOptions(timeFormat: string) {
		this.scrollTimeOptions = []
		for (let hour = 0; hour < 24; hour++) {
			this.scrollTimeOptions.push({
				name: DateTime.fromFormat(hour.toString(), "h").toFormat(timeFormat === TimeFormat.TWENTY_FOUR_HOURS ? "HH:mm" : "hh:mm a"),
				value: hour,
			})
		}
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		for (const update of updates) {
			if (isUpdateForTypeRef(UserSettingsGroupRootTypeRef, update)) {
				this.updateScrollTimeOptions(this.userController.userSettingsGroupRoot.timeFormat)
				m.redraw()
			}
		}
	}
}
