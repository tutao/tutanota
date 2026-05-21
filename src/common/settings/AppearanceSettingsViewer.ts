import m, { Children } from "mithril"
import { lang } from "../misc/LanguageViewModel.js"
import type { DropDownSelectorAttrs } from "../gui/base/DropDownSelector.js"
import { DropDownSelector } from "../gui/base/DropDownSelector.js"
import { TimeFormat } from "@tutao/app-env"
import { downcast, noOp, ofClass, promiseMap } from "@tutao/utils"
import { entityUpdateUtils, tutanotaTypeRefs } from "@tutao/typerefs"
import { getHourCycle } from "../../common/misc/Formatter"
import { ThemeId, themeOptions, ThemePreference } from "../../common/gui/theme"
import type { UpdatableSettingsViewer } from "./Interfaces.js"
import { locator } from "../../common/api/main/CommonLocator"
import { client } from "../misc/ClientDetector.js"
import * as restError from "@tutao/rest-client/error"
import { LanguageDropdown } from "../gui/LanguageDropdown"

export class AppearanceSettingsViewer implements UpdatableSettingsViewer {
	private _customThemes: Array<ThemeId> | null = null

	oncreate() {
		locator.themeController.getCustomThemes().then((themes) => {
			this._customThemes = themes
			m.redraw()
		})
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
				locator.entityClient.update(userSettingsGroupRoot).catch(ofClass(restError.LockedError, noOp))
			},
		}
		return m(".fill-absolute.scroll.plr-24.pb-48", [
			m("#devicesettings.h4.mt-32", lang.get("settingsForDevice_label")),
			m("#language", m(LanguageDropdown, { variant: "TextField" })),
			this._renderThemeSelector(),
			m("#usersettings.h4.mt-32", lang.get("userSettings_label")),
			m("#hourformat", m(DropDownSelector, hourFormatDropDownAttrs)),
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

	entityEventsReceived(updates: ReadonlyArray<entityUpdateUtils.EntityUpdateData>): Promise<void> {
		return promiseMap(updates, (update) => {
			if (entityUpdateUtils.isUpdateForTypeRef(tutanotaTypeRefs.UserSettingsGroupRootTypeRef, update)) {
				return locator.entityClient.load(tutanotaTypeRefs.UserSettingsGroupRootTypeRef, update.instanceId).then((settings) => {
					lang.updateFormats({
						hourCycle: getHourCycle(settings),
					})
					m.redraw()
				})
			}
		}).then(noOp)
	}
}
