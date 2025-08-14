import { assertMainOrNode } from "../../api/common/Env"
import { BaseThemeId, MATERIAL_COLORS, Theme } from "../../gui/theme"
import { clone, defer, DeferredObject, downcast } from "@tutao/tutanota-utils"
import type { DomainInfo, WhitelabelConfig } from "../../api/entities/sys/TypeRefs.js"
import { isValidColorCode } from "../../gui/base/Color"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { CustomizationKey, ThemeCustomizations, ThemeKey, WHITELABEL_CUSTOMIZATION_VERSION } from "../../misc/WhitelabelCustomizations"
import { ThemeController } from "../../gui/ThemeController"
import { EntityClient } from "../../api/common/EntityClient"
import type { LoginController } from "../../api/main/LoginController"
import type { WhitelabelThemeGenerator } from "../../gui/WhitelabelThemeGenerator"

assertMainOrNode()
export type CustomColor = {
	name: ThemeKey
	value: string
	defaultValue: string
	valid: boolean
}

export class CustomColorsEditorViewModel {
	private _customizations: ThemeCustomizations
	private readonly _whitelabelConfig: WhitelabelConfig
	private readonly _whitelabelDomainInfo: DomainInfo
	private _accentColor!: string
	private _baseTheme!: BaseThemeId
	private readonly _themeController: ThemeController
	private readonly _entityClient: EntityClient
	private readonly _loginController: LoginController
	private readonly _themeBeforePreview: Theme
	readonly builtTheme: Stream<Theme>
	private readonly inited: DeferredObject<void> = defer()

	constructor(
		currentTheme: Theme,
		themeCustomizations: ThemeCustomizations,
		whitelabelConfig: WhitelabelConfig,
		whitelabelDomainInfo: DomainInfo,
		themeController: ThemeController,
		entityClient: EntityClient,
		loginController: LoginController,
		private readonly whitelabelThemeGenerator: WhitelabelThemeGenerator,
	) {
		this._themeBeforePreview = Object.freeze(currentTheme)
		this._customizations = clone(themeCustomizations)
		this._whitelabelDomainInfo = whitelabelDomainInfo
		this._whitelabelConfig = whitelabelConfig
		this._themeController = themeController
		this._entityClient = entityClient
		this._loginController = loginController
		this.builtTheme = stream()

		const baseThemeId = themeCustomizations.base ?? "light"
		const accentColor = themeCustomizations.primary ?? this._themeController.getDefaultTheme().primary
		this.changeTheme({ accentColor, baseThemeId })
	}

	init() {
		this._applyEditedTheme()
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

	async changeAccentColor(accentColor: string) {
		await this.changeTheme({ accentColor })
	}

	async changeBaseTheme(baseThemeId: BaseThemeId) {
		await this.changeTheme({ baseThemeId })
	}

	private async changeTheme(attrs: { accentColor?: string; baseThemeId?: BaseThemeId }) {
		if (attrs.accentColor != null) {
			this._accentColor = attrs.accentColor
			this.setCustomization("primary", attrs.accentColor)
		}

		if (attrs.baseThemeId != null) {
			this._baseTheme = attrs.baseThemeId
			this.setCustomization("base", attrs.baseThemeId)
		}

		const theme = await this.whitelabelThemeGenerator.generateMaterialTheme({
			accentColor: this._accentColor,
			theme: this._baseTheme,
			logo: this.customizations.logo,
		})

		const colors = this.getColorKeys(theme)
		for (const c of colors) {
			this.setCustomization(c, theme[c])
		}

		this.setCustomization("version", WHITELABEL_CUSTOMIZATION_VERSION)

		await this._applyEditedTheme()
	}

	/**
	 * Try to save changes. if there are invalid color values in the theme doesn't save and returns false, else saves and returns true
	 */
	async save(): Promise<boolean> {
		if (!this._isValidColorValue(this.customizations.primary ?? "")) {
			return false
		}

		this.setCustomization("themeId", this._whitelabelDomainInfo.domain)
		this._whitelabelConfig.jsonTheme = JSON.stringify(ThemeController.mapNewToOldColorTokens(this.customizations))
		await this._entityClient.update(this._whitelabelConfig)

		if (!this._loginController.isWhitelabel()) {
			await this.resetActiveClientTheme()
		}

		return true
	}

	private getColorKeys(customizations: Record<string, any>): (keyof Theme)[] {
		return Object.keys(customizations).filter((name) => name === "baseTheme" || MATERIAL_COLORS.includes(name as keyof Theme)) as (keyof Theme)[]
	}

	async resetActiveClientTheme(): Promise<void> {
		await this._themeController.resetTheme(this._themeBeforePreview)
	}

	private setCustomization(nameOfKey: CustomizationKey, value: any) {
		// @ts-ignore it's pretty hard to define what we want
		this.customizations[nameOfKey] = value
	}

	private _isValidColorValue(colorValue: string): boolean {
		return isValidColorCode(colorValue.trim()) || colorValue.trim() === ""
	}

	private async _applyEditedTheme() {
		this._removeEmptyCustomizations()

		await this._themeController.applyCustomizations(this.customizations, false)
		this.inited.resolve()
	}

	_removeEmptyCustomizations() {
		this._customizations = downcast(Object.fromEntries(Object.entries(this.customizations).filter(([k, v]) => v !== "")))
	}

	async _waitInited(): Promise<void> {
		await this.inited.promise
	}
}
