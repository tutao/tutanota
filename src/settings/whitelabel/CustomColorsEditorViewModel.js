// @flow

import {assertMainOrNode} from "../../api/common/Env"
import type {BaseThemeId, Theme} from "../../gui/theme"
import {assertNotNull, clone, debounceStart, downcast} from "../../api/common/utils/Utils"
import type {WhitelabelConfig} from "../../api/entities/sys/WhitelabelConfig"
import type {DomainInfo} from "../../api/entities/sys/DomainInfo"
import {VALID_HEX_CODE_FORMAT} from "../../gui/base/Color"
import stream from "mithril/stream/stream.js"
import type {ThemeCustomizations} from "../../misc/WhitelabelCustomizations"
import {ThemeController} from "../../gui/ThemeController"
import {EntityClient} from "../../api/common/EntityClient"
import type {LoginController} from "../../api/main/LoginController"

assertMainOrNode()

export type CustomColor = {name: string, value: string, defaultValue: string, valid: boolean}

export class CustomColorsEditorViewModel {
	_customizations: ThemeCustomizations
	+_whitelabelConfig: WhitelabelConfig
	+_whitelabelDomainInfo: DomainInfo
	_accentColor: string
	_baseTheme: BaseThemeId
	_themeController: ThemeController
	_entityClient: EntityClient
	_loginController: LoginController
	+_themeBeforePreview: Theme
	+builtTheme: Stream<Theme>

	constructor(currentTheme: Theme, themeCustomizations: ThemeCustomizations, whitelabelConfig: WhitelabelConfig,
	            whitelabelDomainInfo: DomainInfo, themeController: ThemeController, entityClient: EntityClient, loginController: LoginController) {
		this._themeBeforePreview = Object.freeze(currentTheme)
		this._customizations = clone(themeCustomizations)
		this._whitelabelDomainInfo = whitelabelDomainInfo
		this._whitelabelConfig = whitelabelConfig
		this._themeController = themeController
		this._entityClient = entityClient
		this._loginController = loginController
		this.builtTheme = stream()

		const baseThemeId = themeCustomizations.base ?? "light"
		const accentColor = themeCustomizations.content_accent ?? this._themeController.getDefaultTheme().content_accent

		this.changeBaseTheme(baseThemeId)
		this.changeAccentColor(accentColor)
	}

	init() {
		this._applyEditedTheme()
	}

	get customColors(): $ReadOnlyArray<CustomColor> {
		const base = this._themeController.getBaseTheme(this.baseThemeId)

		return Object.keys(base)
		             .filter(name => !this._shallBeExcluded(name))
		             .sort((a, b) => a.localeCompare(b))
		             .map((key) => {
			             const value = this._customizations[key] ?? ""
			             return {name: key, value, defaultValue: assertNotNull(base[key]), valid: this._isValidColorValue(value)}
		             })
	}

	get accentColor(): string {
		return this._accentColor
	}

	get customizations(): ThemeCustomizations {
		return this._customizations
	}

	get baseThemeId(): BaseThemeId {
		return this._baseTheme
	}

	getDefaultColor(colorName: string): string {
		return this._themeController.getBaseTheme(this.baseThemeId)[colorName]
	}

	changeAccentColor(accentColor: string) {
		this._accentColor = accentColor
		this.addCustomization("list_accent_fg", accentColor)
		this.addCustomization("content_accent", accentColor)
		this.addCustomization("content_button_selected", accentColor)
		this.addCustomization("navigation_button_selected", accentColor)
		this.addCustomization("header_button_selected", accentColor)

		this._applyEditedTheme()
	}

	changeBaseTheme(baseThemeId: BaseThemeId) {
		this._baseTheme = baseThemeId

		this.addCustomization("base", baseThemeId)

		this._applyEditedTheme()
	}

	/**
	 * Try to save changes. if there are invalid color values in the theme doesn't save and returns false, else saves and returns true
	 */
	async save(): Promise<boolean> {
		const colors = Object.keys(this.customizations)
		                     .filter(name => name !== "logo" && name !== "themeId" && name !== "base")
		for (let i = 0; i < colors.length; i++) {
			if (!this._isValidColorValue(this.customizations[downcast(colors[i])])) {
				return false
			}
		}
		this.addCustomization("themeId", this._whitelabelDomainInfo.domain)
		this._whitelabelConfig.jsonTheme = JSON.stringify(this.customizations)
		await this._entityClient.update(this._whitelabelConfig)
		if (!this._loginController.isWhitelabel()) {
			await this.resetActiveClientTheme()
		}
		return true
	}

	async resetActiveClientTheme(): Promise<void> {
		return this._themeController.updateCustomTheme(downcast(Object.assign({}, {base: null}, this._themeBeforePreview)), false)
	}


	addCustomization(nameOfKey: string, colorValue: string) {
		this.customizations[nameOfKey] = colorValue
		this._applyEditedTheme()
	}

	_isValidColorValue(colorValue: string): boolean {
		return VALID_HEX_CODE_FORMAT.test(colorValue.trim()) || colorValue.trim() === ""
	}

	/**
	 * These values shall be excluded when rendering the advanced TextFields
	 * @return boolean, true iff provided parameter 'name' shall be excluded
	 */
	_shallBeExcluded(name: string): boolean {
		const excludedColors = [
			"logo",
			"themeId",
			"base",
			"list_accent_fg",
			"content_button_selected",
			"navigation_button_selected",
			"header_button_selected",
			"content_accent"
		]

		return excludedColors.includes(name)
	}

	_applyEditedTheme: () => void = debounceStart(100, () => {
		this._removeEmptyCustomizations()
		this._themeController.updateCustomTheme(this._filterAndReturnCustomizations(), false)
	})

	_removeEmptyCustomizations() {
		this._customizations = downcast(Object.fromEntries(Object.entries(this.customizations)
		                                                         .filter(([k, v]) => v !== "")))
	}

	/**
	 *  filters out all invalid color values from ThemeCustomizations whilst keeping logo, base and themeId
	 */
	_filterAndReturnCustomizations(): ThemeCustomizations {
		const colorValues = Object.entries(this.customizations).filter(([n, v]) => n !== "themeId" && n !== "base" && n !== "logo")
		const filteredColorValues = colorValues.filter(([n, v]) => this._isValidColorValue(downcast(v)))
		Object.entries(this.customizations)
		      .forEach(([n, v]) => {
			      if (n === "themeId" || n === "base" || n === "logo") {
				      filteredColorValues.push([n, v])
			      }
		      })

		return downcast(Object.fromEntries(filteredColorValues))
	}

}