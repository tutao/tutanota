import m, { Children } from "mithril"
import { getLanguage, lang, LanguageCode, languageCodeToTag, languageNative } from "../misc/LanguageViewModel.js"
import { styles } from "../gui/styles.js"
import type { DropDownSelectorAttrs } from "../gui/base/DropDownSelector.js"
import { DropDownSelector, SelectorItemList } from "../gui/base/DropDownSelector.js"
import { deviceConfig } from "../misc/DeviceConfig.js"
import { TimeFormat, WeekStart } from "../api/common/TutanotaConstants.js"
import { downcast, incrementDate, noOp, ofClass, promiseMap } from "@tutao/tutanota-utils"
import { UserSettingsGroupRootTypeRef } from "../../common/api/entities/tutanota/TypeRefs.js"
import { getHourCycle } from "../../common/misc/Formatter"
import { ThemeId, themeOptions, ThemePreference } from "../../common/gui/theme"
import type { UpdatableSettingsViewer } from "./Interfaces.js"
import { locator } from "../../common/api/main/CommonLocator"
import { EntityUpdateData, isUpdateForTypeRef } from "../../common/api/common/utils/EntityUpdateUtils.js"
import { client } from "../misc/ClientDetector.js"
import { DateTime } from "../../../libs/luxon.js"
import { LockedError } from "../api/common/error/RestError"
import { LanguageDropdown } from "../gui/LanguageDropdown"

export class AppearanceSettingsViewer implements UpdatableSettingsViewer {
	private _customThemes: Array<ThemeId> | null = null
	private timeOptions: Array<{ name: string; value: number }> = []

	oncreate() {
		locator.themeController.getCustomThemes().then((themes) => {
			this._customThemes = themes
			m.redraw()
		})

		const userSettingsGroupRoot = locator.logins.getUserController().userSettingsGroupRoot
		const timeFormat = userSettingsGroupRoot.timeFormat

		for (let hour = 0; hour < 24; hour++) {
			this.timeOptions.push({
				name: DateTime.fromFormat(hour.toString(), "h").toFormat(timeFormat === TimeFormat.TWENTY_FOUR_HOURS ? "HH:mm" : "hh:mm a"),
				value: hour,
			})
		}
	}

	view(): Children {
		const userSettingsGroupRoot = locator.logins.getUserController().userSettingsGroupRoot
		const hourFormatDropDownAttrs: DropDownSelectorAttrs<TimeFormat> = {
			label: "timeFormat_label",
			items: [
				{
					name: lang.get("timeFormatTwentyFourHour_label"),
					value: TimeFormat.TWENTY_FOUR_HOURS,
				},
				{
					name: lang.get("timeFormatTwelveHour_label"),
					value: TimeFormat.TWELVE_HOURS,
				},
			],
			selectedValue: downcast(userSettingsGroupRoot.timeFormat),
			selectionChangedHandler: (value) => {
				userSettingsGroupRoot.timeFormat = value
				locator.entityClient.update(userSettingsGroupRoot).catch(ofClass(LockedError, noOp))
			},
		}
		const weekdayFormat = new Intl.DateTimeFormat(lang.languageTag, {
			weekday: "long",
		})
		const calcDate = new Date()
		const sundayName = weekdayFormat.format(incrementDate(calcDate, -calcDate.getDay())) // Sunday as reference

		const mondayName = weekdayFormat.format(incrementDate(calcDate, 1)) // Monday is one day later

		const saturdayName = weekdayFormat.format(incrementDate(calcDate, 5)) // Saturday is five days later

		const weekStartDropDownAttrs: DropDownSelectorAttrs<WeekStart> = {
			label: "weekStart_label",
			items: [
				{
					name: mondayName,
					value: WeekStart.MONDAY,
				},
				{
					name: saturdayName,
					value: WeekStart.SATURDAY,
				},
				{
					name: sundayName,
					value: WeekStart.SUNDAY,
				},
			],
			selectedValue: downcast(userSettingsGroupRoot.startOfTheWeek),
			selectionChangedHandler: (value) => {
				userSettingsGroupRoot.startOfTheWeek = value
				locator.entityClient.update(userSettingsGroupRoot).catch(ofClass(LockedError, noOp))
			},
		}
		return m(".fill-absolute.scroll.plr-l.pb-xl", [
			m("#devicesettings.h4.mt-l", lang.get("settingsForDevice_label")),
			m("#language", m(LanguageDropdown, { variant: "TextField" })),
			this._renderThemeSelector(),
			this.renderScrollTimeSelector(),
			m("#usersettings.h4.mt-l", lang.get("userSettings_label")),
			m("#hourformat", m(DropDownSelector, hourFormatDropDownAttrs)),
			m("#weekstart", m(DropDownSelector, weekStartDropDownAttrs)),
		])
	}

	_renderThemeSelector(): Children {
		if (!locator.themeController.shouldAllowChangingTheme() || this._customThemes == null) {
			return null
		}

		const customOptions = this._customThemes.map((themeId) => {
			return {
				name: themeId,
				value: themeId,
			}
		})

		const themeDropDownAttrs: DropDownSelectorAttrs<ThemePreference> = {
			label: "switchColorTheme_action",
			items: [
				...themeOptions(client.isCalendarApp()).map(({ name, value }) => ({
					name: lang.get(name),
					value: value,
				})),
				...customOptions,
			],
			selectedValue: locator.themeController.themePreference,
			selectionChangedHandler: (value) => locator.themeController.setThemePreference(value),
			dropdownWidth: 300,
		}
		return m("#colortheme", m(DropDownSelector, themeDropDownAttrs))
	}

	renderScrollTimeSelector(): Children {
		const themeDropDownAttrs: DropDownSelectorAttrs<number> = {
			label: "weekScrollTime_label",
			helpLabel: () => lang.get("weekScrollTime_msg"),
			items: this.timeOptions as SelectorItemList<number>,
			selectedValue: deviceConfig.getScrollTime(),
			selectionChangedHandler: (value) => deviceConfig.setScrollTime(value),
			dropdownWidth: 300,
		}
		return m("#weekscrolltime", m(DropDownSelector, themeDropDownAttrs))
	}

	entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		return promiseMap(updates, (update) => {
			if (isUpdateForTypeRef(UserSettingsGroupRootTypeRef, update)) {
				return locator.entityClient.load(UserSettingsGroupRootTypeRef, update.instanceId).then((settings) => {
					lang.updateFormats({
						hourCycle: getHourCycle(settings),
					})
					m.redraw()
				})
			}
		}).then(noOp)
	}
}
