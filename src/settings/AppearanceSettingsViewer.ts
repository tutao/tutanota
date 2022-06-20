import m, {Children} from "mithril"
import type {LanguageCode} from "../misc/LanguageViewModel"
import {getLanguage, lang, languageCodeToTag, languages} from "../misc/LanguageViewModel"
import {styles} from "../gui/styles"
import type {DropDownSelectorAttrs} from "../gui/base/DropDownSelectorN"
import {DropDownSelectorN, SelectorItemList} from "../gui/base/DropDownSelectorN"
import {deviceConfig} from "../misc/DeviceConfig"
import {TimeFormat, WeekStart} from "../api/common/TutanotaConstants"
import {logins} from "../api/main/LoginController"
import {downcast, incrementDate, noOp, promiseMap} from "@tutao/tutanota-utils"
import type {EntityUpdateData} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"
import {UserSettingsGroupRootTypeRef} from "../api/entities/tutanota/TypeRefs.js"
import {getHourCycle} from "../misc/Formatter"
import type {ThemeId} from "../gui/theme"
import {themeController} from "../gui/theme"
import type {UpdatableSettingsViewer} from "./SettingsView"
import {isDesktop} from "../api/common/Env"
import {locator} from "../api/main/MainLocator"

export class AppearanceSettingsViewer implements UpdatableSettingsViewer {
	private _customThemes: Array<ThemeId> | null = null

	oncreate() {
		themeController.getCustomThemes().then(themes => {
			this._customThemes = themes
			m.redraw()
		})
	}

	view(): Children {
		const actualLanguageItems: SelectorItemList<LanguageCode | null> = languages
			.map(language => {
				return {
					name: lang.get(language.textId),
					value: language.code,
				}
			})
			.sort((l1, l2) => l1.name.localeCompare(l2.name))
		const languageItems: SelectorItemList<LanguageCode | null> = actualLanguageItems
			.concat({
				name: lang.get("automatic_label"),
				value: null,
			})

		const languageDropDownAttrs: DropDownSelectorAttrs<LanguageCode | null> = {
			label: "language_label",
			items: languageItems,
			// DropdownSelectorN uses `===` to compare items so if the language is not set then `undefined` will not match `null`
			selectedValue: deviceConfig.getLanguage() || null,
			selectionChangedHandler: async value => {
				deviceConfig.setLanguage(value)
				const newLanguage = value
					? {
						code: value,
						languageTag: languageCodeToTag(value),
					}
					: getLanguage()
				await lang.setLanguage(newLanguage)

				if (isDesktop()) {
					await locator.desktopSettingsFacade.changeLanguage(newLanguage.code, newLanguage.languageTag)
				}

				styles.updateStyle("main")
				m.redraw()
			},
		}
		const userSettingsGroupRoot = logins.getUserController().userSettingsGroupRoot
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
			selectionChangedHandler: value => {
				userSettingsGroupRoot.timeFormat = value
				locator.entityClient.update(userSettingsGroupRoot)
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
			selectionChangedHandler: value => {
				userSettingsGroupRoot.startOfTheWeek = value
				locator.entityClient.update(userSettingsGroupRoot)
			},
		}
		return m(".fill-absolute.scroll.plr-l.pb-xl", [
			m(".h4.mt-l", lang.get("settingsForDevice_label")),
			m(DropDownSelectorN, languageDropDownAttrs),
			this._renderThemeSelector(),
			m(".h4.mt-l", lang.get("userSettings_label")),
			m(DropDownSelectorN, hourFormatDropDownAttrs),
			m(DropDownSelectorN, weekStartDropDownAttrs),
		])
	}

	_renderThemeSelector(): Children {
		if (!themeController.shouldAllowChangingTheme() || this._customThemes == null) {
			return null
		}

		const customOptions = this._customThemes.map(themeId => {
			return {
				name: themeId,
				value: themeId,
			}
		})

		const themeDropDownAttrs: DropDownSelectorAttrs<ThemeId> = {
			label: "switchColorTheme_action",
			items: [
				{
					name: lang.get("light_label"),
					value: "light",
				},
				{
					name: lang.get("dark_label"),
					value: "dark",
				},
				{
					name: lang.get("blue_label"),
					value: "blue",
				},
			].concat(customOptions),
			selectedValue: themeController.themeId,
			selectionChangedHandler: value => themeController.setThemeId(value),
			dropdownWidth: 300,
		}
		return m(DropDownSelectorN, themeDropDownAttrs)
	}

	entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		return promiseMap(updates, update => {
			if (isUpdateForTypeRef(UserSettingsGroupRootTypeRef, update)) {
				return locator.entityClient.load(UserSettingsGroupRootTypeRef, update.instanceId).then(settings => {
					lang.updateFormats({
						hourCycle: getHourCycle(settings),
					})
					m.redraw()
				})
			}
		}).then(noOp)
	}
}