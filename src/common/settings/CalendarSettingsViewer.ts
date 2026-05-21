import type { UpdatableSettingsViewer } from "./Interfaces"
import { EntityUpdateData } from "../../typerefs/EntityUpdateUtils"
import m, { Children, Vnode } from "mithril"
import { lang } from "../misc/LanguageViewModel"
import { DropDownSelector, DropDownSelectorAttrs, SelectorItemList } from "../gui/base/DropDownSelector"
import { TimeFormat, WeekStart } from "@tutao/app-env"
import { downcast, incrementDate, noOp, ofClass } from "@tutao/utils"
import { EntityClient } from "../api/common/EntityClient"
import { tutanotaTypeRefs } from "@tutao/typerefs"
import * as RestError from "@tutao/rest-client/error"
import { deviceConfig } from "../misc/DeviceConfig"
import { DateTime } from "../../../libs/luxon"

export class CalendarSettingsViewer implements UpdatableSettingsViewer {
	private scrollTimeOptions: Array<{ name: string; value: number }> = []

	constructor(
		private readonly entityClient: EntityClient,
		private readonly userSettingsGroupRoot: tutanotaTypeRefs.UserSettingsGroupRoot,
	) {}

	async oninit(vnode: Vnode): Promise<void> {
		const timeFormat = this.userSettingsGroupRoot.timeFormat
		for (let hour = 0; hour < 24; hour++) {
			this.scrollTimeOptions.push({
				name: DateTime.fromFormat(hour.toString(), "h").toFormat(timeFormat === TimeFormat.TWENTY_FOUR_HOURS ? "HH:mm" : "hh:mm a"),
				value: hour,
			})
		}
	}

	view(vnode: Vnode): Children {
		return m(".fill-absolute.scroll.plr-24.pb-48", [
			m("#calendarview.h4.mt-32", lang.getTranslation("calendar_label").text),
			m("#weekstart", m(DropDownSelector, this.makeWeekStartDropdownAttrs())),
			m("#devicesettings.h4.mt-32", lang.getTranslation("settingsForDevice_label").text),
			m("#weekscrolltime", m(DropDownSelector, this.makeScrollTimeDropdownAttrs())),
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
					name: saturdayName,
					value: WeekStart.SATURDAY,
				},
				{
					name: sundayName,
					value: WeekStart.SUNDAY,
				},
				{
					name: mondayName,
					value: WeekStart.MONDAY,
				},
			],
			selectedValue: downcast(this.userSettingsGroupRoot.startOfTheWeek),
			selectionChangedHandler: (value) => {
				this.userSettingsGroupRoot.startOfTheWeek = value
				this.entityClient.update(this.userSettingsGroupRoot).catch(ofClass(RestError.LockedError, noOp))
			},
		}
		return weekStartDropDownAttrs
	}

	entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<unknown> {
		return Promise.resolve(undefined)
	}
}
