//@flow
import m from "mithril"
import {getLanguage, lang, languageCodeToTag, languages} from "../misc/LanguageViewModel"
import type {DropDownSelectorAttrs} from "../gui/base/DropDownSelectorN"
import {DropDownSelectorN} from "../gui/base/DropDownSelectorN"
import stream from "mithril/stream/stream.js"
import {deviceConfig} from "../misc/DeviceConfig"
import {themeId} from "../gui/theme"
import type {TimeFormatEnum, WeekStartEnum} from "../api/common/TutanotaConstants"
import {TimeFormat, WeekStart} from "../api/common/TutanotaConstants"
import {logins} from "../api/main/LoginController"
import {downcast} from "../api/common/utils/Utils"
import {load, update} from "../api/main/Entity"
import {isUpdateForTypeRef} from "../api/main/EventController"
import {UserSettingsGroupRootTypeRef} from "../api/entities/tutanota/UserSettingsGroupRoot"
import {incrementDate} from "../api/common/utils/DateUtils"
import type {CalendarViewTypeEnum} from "../calendar/CalendarView"
import {CalendarViewType} from "../calendar/CalendarView"


export class AppearanceSettingsViewer implements UpdatableSettingsViewer {
	view(): Children {
		const languageDropDownAttrs: DropDownSelectorAttrs<?string> = {
			label: "language_label",
			items: languages.map(language => {
				return {name: lang.get(language.textId), value: language.code}
			}).concat({name: lang.get("automatic_label"), value: null}),
			// DropdownSelectorN uses `===` to compare items so if the language is not set then `undefined` will not match `null`
			selectedValue: stream(deviceConfig.getLanguage() || null),
			selectionChangedHandler: (value) => {
				deviceConfig.setLanguage(value)
				if (value) {
					lang.setLanguage({code: value, languageTag: languageCodeToTag(value)}).then(m.redraw)
				} else {
					lang.setLanguage(getLanguage()).then(m.redraw)
				}
			}
		}

		const themeDropDownAttrs: DropDownSelectorAttrs<ThemeId> = {
			label: "switchColorTheme_action",
			items: [{name: "Light", value: "light"}, {name: "Dark", value: "dark"}],
			selectedValue: themeId,
			selectionChangedHandler: (value) => deviceConfig.setTheme(value)
		}

		const userSettingsGroupRoot = logins.getUserController().userSettingsGroupRoot
		const hourFormatDropDownAttrs: DropDownSelectorAttrs<TimeFormatEnum> = {
			label: "timeFormat_label",
			items: [
				{name: lang.get("timeFormatTwentyFourHour_label"), value: TimeFormat.TWENTY_FOUR_HOURS},
				{name: lang.get("timeFormatTwelveHour_label"), value: TimeFormat.TWELVE_HOURS}
			],
			selectedValue: stream(downcast(userSettingsGroupRoot.timeFormat)),
			selectionChangedHandler: (value) => {
				userSettingsGroupRoot.timeFormat = value
				update(userSettingsGroupRoot)
			}
		}

		const weekdayFormat = new Intl.DateTimeFormat(lang.languageTag, {weekday: "long"})
		const calcDate = new Date()
		const sundayName = weekdayFormat.format(incrementDate(calcDate, -calcDate.getDay())) // Sunday as reference
		const mondayName = weekdayFormat.format(incrementDate(calcDate, 1)) // Monday is one day later
		const saturdayName = weekdayFormat.format(incrementDate(calcDate, 5)) // Saturday is five days later

		const weekStartDropDownAttrs: DropDownSelectorAttrs<WeekStartEnum> = {
			label: "weekStart_label",
			items: [
				{name: mondayName, value: WeekStart.MONDAY}, 
				{name: saturdayName, value: WeekStart.SATURDAY}, 
				{name: sundayName, value: WeekStart.SUNDAY}
			],
			selectedValue: stream(downcast(userSettingsGroupRoot.startOfTheWeek)),
			selectionChangedHandler: (value) => {
				userSettingsGroupRoot.startOfTheWeek = value
				update(userSettingsGroupRoot)
			}
		}

		return m(".fill-absolute.scroll.plr-l.pb-xl", [
			m(".h4.mt-l", lang.get('settingsForDevice_label')),
			m(DropDownSelectorN, languageDropDownAttrs),
			themeId() === 'custom' ? null : m(DropDownSelectorN, themeDropDownAttrs),
			m(".h4.mt-l", lang.get('userSettings_label')),
			m(DropDownSelectorN, hourFormatDropDownAttrs),
			m(DropDownSelectorN, weekStartDropDownAttrs),
		])
	}

	entityEventsReceived(updates: $ReadOnlyArray<EntityUpdateData>): void {
		for (let update of updates) {
			if (isUpdateForTypeRef(UserSettingsGroupRootTypeRef, update)) {
				load(UserSettingsGroupRootTypeRef, update.instanceId)
					.then((settings) => {
						lang.updateFormats({hour12: settings.timeFormat === TimeFormat.TWELVE_HOURS})
						m.redraw()
					})
			}
		}
	}
}
