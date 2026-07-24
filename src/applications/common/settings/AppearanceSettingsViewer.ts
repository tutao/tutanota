import m, { Children } from "mithril"
import { TimeFormat } from "@tutao/app-env"
import { downcast, noOp, ofClass, promiseMap } from "@tutao/utils"
import type { UpdatableSettingsViewer } from "./Interfaces.js"
import { locator } from "../api/main/CommonLocator"
import * as restError from "@tutao/rest-client/error"
import { LanguageDropdown } from "../gui/LanguageDropdown"
import { DropDownSelector, DropDownSelectorAttrs } from "../../../ui/base/DropDownSelector"
import { ThemeId, themeOptions, ThemePreference } from "../../../ui/theme"
import { lang } from "../../../ui/utils/LanguageViewModel"
import { ClientDetector } from "../../../platform-kit/app-env/boot/ClientDetector"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { getHourCycle } from "../../../entities/tutanota/Utils"
import { UserSettingsGroupRootTypeRef } from "@tutao/entities/tutanota"
import { deviceConfig } from "../misc/DeviceConfig"
import { idToElementId } from "@tutao/meta"

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
			m("#language", m(LanguageDropdown, { variant: "TextField", deviceConfig })),
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
				...themeOptions(ClientDetector.get().isCalendarApp()).map(({ name, value }) => ({
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

	entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		return promiseMap(updates, (update) => {
			if (isUpdateForTypeRef(UserSettingsGroupRootTypeRef, update)) {
				return locator.entityClient.load(UserSettingsGroupRootTypeRef, idToElementId(update.instanceId)).then((settings) => {
					lang.updateFormats({
						hourCycle: getHourCycle(settings),
					})
					m.redraw()
				})
			}
			return Promise.resolve()
		}).then(noOp)
	}
}
