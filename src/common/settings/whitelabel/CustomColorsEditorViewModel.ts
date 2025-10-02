import { assertMainOrNode } from "../../api/common/Env"
import { BaseThemeId, MATERIAL_COLORS, Theme } from "../../gui/theme"
import { clone, downcast } from "@tutao/tutanota-utils"
import type { DomainInfo, WhitelabelConfig } from "../../api/entities/sys/TypeRefs.js"
import { hexToRgba, isValidSolidColorCode, rgbaToHex } from "../../gui/base/Color"
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
	private _sourceColor!: string
	private _baseTheme!: BaseThemeId
	private readonly _themeController: ThemeController
	private readonly _entityClient: EntityClient
	private readonly _loginController: LoginController
	private readonly _themeBeforePreview: Theme
	readonly builtTheme: Stream<Theme>
	private readonly whitelabelThemeGenerator: WhitelabelThemeGenerator

	constructor(
		currentTheme: Theme,
		themeCustomizations: ThemeCustomizations,
		whitelabelConfig: WhitelabelConfig,
		whitelabelDomainInfo: DomainInfo,
		themeController: ThemeController,
		entityClient: EntityClient,
		loginController: LoginController,
		whitelabelThemeGenerator: WhitelabelThemeGenerator,
	) {
		this.whitelabelThemeGenerator = whitelabelThemeGenerator
		this._themeBeforePreview = Object.freeze(currentTheme)
		this._customizations = clone(themeCustomizations)
		this._whitelabelDomainInfo = whitelabelDomainInfo
		this._whitelabelConfig = whitelabelConfig
		this._themeController = themeController
		this._entityClient = entityClient
		this._loginController = loginController
		this.builtTheme = stream()
	}

	async init() {
		const baseThemeId = this._customizations.base ?? "light"
		const sourceColor = this._customizations.sourceColor ?? this._themeController.getDefaultTheme().primary
		await this.changeTheme({ sourceColor, baseThemeId })
	}

	get sourceColor(): string {
		return this._sourceColor
	}

	get customizations(): ThemeCustomizations {
		return this._customizations
	}

	get baseThemeId(): BaseThemeId {
		return this._baseTheme
	}

	async changeSourceColor(sourceColor: string) {
		await this.changeTheme({ sourceColor })
	}

	async changeBaseTheme(baseThemeId: BaseThemeId) {
		await this.changeTheme({ baseThemeId })
	}

	private async changeTheme(attrs: { sourceColor?: string; baseThemeId?: BaseThemeId }) {
		if (attrs.sourceColor != null) {
			this._sourceColor = attrs.sourceColor
			this.setCustomization("sourceColor", attrs.sourceColor)
		}

		if (attrs.baseThemeId != null) {
			this._baseTheme = attrs.baseThemeId
			this.setCustomization("base", attrs.baseThemeId)
		}

		const theme = await this.whitelabelThemeGenerator.generateMaterialPalette({
			sourceColor: this._sourceColor,
			theme: this._baseTheme,
		})

		for (const color of MATERIAL_COLORS) {
			this.setCustomization(color, theme[color])
		}

		this.setStateBgColors(theme.outline_variant)
		this.setCustomization("version", WHITELABEL_CUSTOMIZATION_VERSION)

		await this._applyEditedTheme()
	}

	/**
	 * For state colors, we don't use Material 3 color tokens (done this way to simplify state representations)
	 * For builtin themes, state colors are based on outline_variant with varying alphas
	 */
	private setStateBgColors(baseColorHex: string): void {
		const baseTheme = this._themeController.getBaseTheme(this._baseTheme)

		const baseColor = hexToRgba(baseColorHex)
		// We use the same alpha values as the base theme
		const hoverAlpha = hexToRgba(baseTheme.state_bg_hover).a
		const focusAlpha = hexToRgba(baseTheme.state_bg_focus).a
		const activeAlpha = hexToRgba(baseTheme.state_bg_active).a

		this.setCustomization("state_bg_hover", rgbaToHex({ ...baseColor, a: hoverAlpha }))
		this.setCustomization("state_bg_focus", rgbaToHex({ ...baseColor, a: focusAlpha }))
		this.setCustomization("state_bg_active", rgbaToHex({ ...baseColor, a: activeAlpha }))
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

	async resetActiveClientTheme(): Promise<void> {
		await this._themeController.resetTheme(this._themeBeforePreview)
	}

	private setCustomization(nameOfKey: CustomizationKey, value: any) {
		// @ts-ignore it's pretty hard to define what we want
		this.customizations[nameOfKey] = value
	}

	private _isValidColorValue(colorValue: string): boolean {
		return isValidSolidColorCode(colorValue.trim()) || colorValue.trim() === ""
	}

	private async _applyEditedTheme() {
		this._removeEmptyCustomizations()

		await this._themeController.applyCustomizations(this.customizations, false)
	}

	_removeEmptyCustomizations() {
		this._customizations = downcast(Object.fromEntries(Object.entries(this.customizations).filter(([_, v]) => v != null && v !== "")))
	}
}
