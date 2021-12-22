// @flow
import type {SettingsSection, SettingsValue} from "./SettingsModel"
import type {ThemeId} from "../../gui/theme"
import {themeController} from "../../gui/theme"
import m from "mithril"
import type {EntityUpdateData} from "../../api/main/EventController"
import {isUpdateForTypeRef} from "../../api/main/EventController"
import type {DropDownSelectorAttrs} from "../../gui/base/DropDownSelectorN"
import {DropDownSelectorN} from "../../gui/base/DropDownSelectorN"
import type {LanguageCode} from "../../misc/LanguageViewModel"
import {getLanguage, lang, languageCodeToTag, languages} from "../../misc/LanguageViewModel"
import {deviceConfig} from "../../misc/DeviceConfig"
import {isDesktop} from "../../api/common/Env"
import {styles} from "../../gui/styles"
import stream from "mithril/stream/stream.js"
import type {TimeFormatEnum, WeekStartEnum} from "../../api/common/TutanotaConstants"
import {TimeFormat, WeekStart} from "../../api/common/TutanotaConstants"
import type {UserSettingsGroupRoot} from "../../api/entities/tutanota/UserSettingsGroupRoot"
import {UserSettingsGroupRootTypeRef} from "../../api/entities/tutanota/UserSettingsGroupRoot"
import {getHourCycle} from "../../misc/Formatter"
import type {IUserController} from "../../api/main/UserController"
import {downcast, incrementDate, noOp, promiseMap} from "@tutao/tutanota-utils"
import {IMainLocator} from "../../api/main/MainLocator"
import {EntityClient} from "../../api/common/EntityClient"

export class AppearanceSettingsSection implements SettingsSection {
	heading: string
	category: string
	settingsValues: Array<SettingsValue<any>>

	customThemes: ?Array<ThemeId>
	currentLanguage: Stream<?LanguageCode>
	currentTheme: Stream<ThemeId>
	userSettingsGroupRoot: UserSettingsGroupRoot
	currentHourFormat: Stream<NumberString>
	currentWeekStart: Stream<NumberString>
	mainLocator: IMainLocator
	entityClient: EntityClient

	constructor(userController: IUserController, mainLocator: IMainLocator, entityClient: EntityClient) {
		this.heading = "Appearance"
		this.category = "Mails"
		this.mainLocator = mainLocator
		this.entityClient = entityClient
		this.settingsValues = []

		this.userSettingsGroupRoot = userController.userSettingsGroupRoot
		this.currentLanguage = stream(deviceConfig.getLanguage() || null)
		this.currentTheme = stream(themeController.themeId)
		this.currentHourFormat = stream(this.userSettingsGroupRoot.timeFormat)
		this.currentWeekStart = stream(this.userSettingsGroupRoot.startOfTheWeek)
		themeController.getCustomThemes().then(themes => {
			this.customThemes = themes
			m.redraw()
		})

		this.settingsValues.push(this.createLanguageSettings())
		this.settingsValues.push(this.createThemeSettings())
		this.settingsValues.push(this.createHourFormatSettings())
		this.settingsValues.push(this.createWeekStartSettings())
	}

	createLanguageSettings(): SettingsValue<DropDownSelectorAttrs<?LanguageCode>> {

		const languageDropDownAttrs: DropDownSelectorAttrs<?LanguageCode> = {
			label: "language_label",
			items: languages.map(language => {
				return {name: lang.get(language.textId), value: language.code}
			}).sort((l1, l2) => l1.name.localeCompare(l2.name))
			                .concat({name: lang.get("automatic_label"), value: null}),
			// DropdownSelectorN uses `===` to compare items so if the language is not set then `undefined` will not match `null`
			selectedValue: this.currentLanguage,
			selectionChangedHandler: async (value) => {
				deviceConfig.setLanguage(value)
				const newLanguage = value
					? {code: value, languageTag: languageCodeToTag(value)}
					: getLanguage()
				await lang.setLanguage(newLanguage)
				if (isDesktop()) {
					await this.mainLocator.systemApp.changeSystemLanguage(newLanguage)
				}
				styles.updateStyle("main")
				m.redraw()
			}
		}

		return {
			name: "language_label",
			component: DropDownSelectorN,
			attrs: languageDropDownAttrs
		}
	}

	createThemeSettings(): SettingsValue<DropDownSelectorAttrs<ThemeId>> {

		if (!themeController.shouldAllowChangingTheme()) {
			const themeDropDownAttrs: DropDownSelectorAttrs<ThemeId> = {
				label: "switchColorTheme_action",
				items: [
					{name: lang.get("custom_label"), value: "custom"},
				],
				disabled: true,
				selectedValue: stream("custom"),
				selectionChangedHandler: (value) => themeController.setThemeId(value),
				dropdownWidth: 300,
			}

			return {
				name: "switchColorTheme_action",
				component: DropDownSelectorN,
				attrs: themeDropDownAttrs
			}
		} else if (this.customThemes == null) {
			const themeDropDownAttrs: DropDownSelectorAttrs<ThemeId> = {
				label: "switchColorTheme_action",
				items: [
					{name: lang.get("light_label"), value: "light"},
					{name: lang.get("dark_label"), value: "dark"},
					{name: lang.get("blue_label"), value: "blue"},
				],
				selectedValue: this.currentTheme,
				selectionChangedHandler: (value) => {
					themeController.setThemeId(value)
					this.currentTheme(value)
				},
				dropdownWidth: 300,
			}

			return {
				name: "switchColorTheme_action",
				component: DropDownSelectorN,
				attrs: themeDropDownAttrs
			}
		} else {
			const customOptions = this.customThemes.map(themeId => {
				return {name: themeId, value: themeId}
			})

			const themeDropDownAttrs: DropDownSelectorAttrs<ThemeId> = {
				label: "switchColorTheme_action",
				items: [
					{name: lang.get("light_label"), value: "light"},
					{name: lang.get("dark_label"), value: "dark"},
					{name: lang.get("blue_label"), value: "blue"},
				].concat(customOptions),
				selectedValue: this.currentTheme,
				selectionChangedHandler: (value) => {
					themeController.setThemeId(value)
					this.currentTheme(value)
				},
				dropdownWidth: 300,
			}
			return {
				name: "switchColorTheme_action",
				component: DropDownSelectorN,
				attrs: themeDropDownAttrs
			}
		}
	}

	createHourFormatSettings()
		:
		SettingsValue<DropDownSelectorAttrs<TimeFormatEnum>> {

		const hourFormatDropDownAttrs
			:
			DropDownSelectorAttrs<TimeFormatEnum> = {
			label: "timeFormat_label",
			items: [
				{name: lang.get("timeFormatTwentyFourHour_label"), value: TimeFormat.TWENTY_FOUR_HOURS},
				{name: lang.get("timeFormatTwelveHour_label"), value: TimeFormat.TWELVE_HOURS}
			],
			selectedValue: downcast(this.currentHourFormat),
			selectionChangedHandler: (value) => {
				this.userSettingsGroupRoot.timeFormat = value
				this.currentHourFormat(value)
				this.entityClient.update(this.userSettingsGroupRoot)
			}
		}

		return {
			name: "timeFormat_label",
			component: DropDownSelectorN,
			attrs: hourFormatDropDownAttrs
		}
	}

	createWeekStartSettings(): SettingsValue<DropDownSelectorAttrs<WeekStartEnum>> {
		const weekdayFormat = new Intl.DateTimeFormat(lang.languageTag, {weekday: "long"})
		const calcDate = new Date()
		const sundayName = weekdayFormat.format(incrementDate(calcDate, -calcDate.getDay())) // Sunday as reference
		const mondayName = weekdayFormat.format(incrementDate(calcDate, 1)) // Monday is one day later
		const saturdayName = weekdayFormat.format(incrementDate(calcDate, 5)) // Saturday is five days later

		const weekStartDropDownAttrs
			:
			DropDownSelectorAttrs<WeekStartEnum> = {
			label: "weekStart_label",
			items: [
				{name: mondayName, value: WeekStart.MONDAY},
				{name: saturdayName, value: WeekStart.SATURDAY},
				{name: sundayName, value: WeekStart.SUNDAY}
			],
			selectedValue: downcast(this.currentWeekStart),
			selectionChangedHandler: (value) => {
				this.userSettingsGroupRoot.startOfTheWeek = value
				this.currentWeekStart(value)
				this.entityClient.update(this.userSettingsGroupRoot)
			}
		}

		return {
			name: "weekStart_label",
			component: DropDownSelectorN,
			attrs: weekStartDropDownAttrs
		}
	}

	entityEventReceived(updates: $ReadOnlyArray<EntityUpdateData>, eventOwnerGroupId: Id): Promise<mixed> {
		return promiseMap(updates, update => {
			if (isUpdateForTypeRef(UserSettingsGroupRootTypeRef, update)) {
				return this.entityClient.load(UserSettingsGroupRootTypeRef, update.instanceId)
				           .then((settings) => {
					           lang.updateFormats({hourCycle: getHourCycle(settings)})
					           m.redraw()
				           })
			}
		}).then(noOp)
	}
}