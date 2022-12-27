import { defaultThemeId, DeviceConfig } from "../misc/DeviceConfig"
import type { HtmlSanitizer } from "../misc/HtmlSanitizer"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { assertMainOrNodeBoot, isApp, isDesktop } from "../api/common/Env"
import { downcast, findAndRemove, LazyLoaded, mapAndFilterNull, typedValues } from "@tutao/tutanota-utils"
import m from "mithril"
import type { BaseThemeId, Theme, ThemeId } from "./theme"
import { logo_text_bright_grey, logo_text_dark_grey, themes } from "./builtinThemes"
import type { ThemeCustomizations } from "../misc/WhitelabelCustomizations"
import { getWhitelabelCustomizations } from "../misc/WhitelabelCustomizations"
import { getLogoSvg } from "./base/Logo"
import { ThemeFacade } from "../native/common/generatedipc/ThemeFacade"

assertMainOrNodeBoot()

export class ThemeController {
	_theme: Theme
	_themeId: ThemeId
	// Subscribe to this to get theme change events. Cannot be used to update the theme
	themeIdChangedStream: Stream<ThemeId>
	initialized: Promise<any>

	constructor(private readonly themeFacade: ThemeFacade, private readonly htmlSanitizer: () => Promise<HtmlSanitizer>) {
		// this will change soon
		this._themeId = defaultThemeId
		this._theme = this.getDefaultTheme()
		this.themeIdChangedStream = stream(this.themeId)
		// We run them in parallel to initialize as soon as possible
		this.initialized = Promise.all([this._initializeTheme(), this._updateBuiltinThemes()])
	}

	async _initializeTheme() {
		// If being accessed from a custom domain, the definition of whitelabelCustomizations is added to index.js serverside upon request
		// see RootHandler::applyWhitelabelFileModifications.
		const whitelabelCustomizations = getWhitelabelCustomizations(window)

		if (whitelabelCustomizations && whitelabelCustomizations.theme) {
			// no need to persist anything if we are on whitelabel domain
			await this.updateCustomTheme(whitelabelCustomizations.theme, false)
		} else {
			// It is theme info passed from native to be applied as early as possible.
			// Important! Do not blindly apply location.search, someone could try to do prototype pollution.
			// We check environment and also filter out __proto__
			// mithril's parseQueryString does not follow standard exactly so we try to use the same thing we use on the native side
			const themeJson = window.location.href ? new URL(window.location.href).searchParams.get("theme") : null

			if ((isApp() || isDesktop()) && themeJson) {
				const parsedTheme: ThemeCustomizations = this._parseCustomizations(themeJson)

				// We also don't need to save anything in this case
				await this.updateCustomTheme(parsedTheme, false)
			} else {
				await this.reloadTheme()
			}
		}
	}

	_parseCustomizations(stringTheme: string): ThemeCustomizations {
		// Filter out __proto__ to avoid prototype pollution. We use Object.assign() which is not susceptible to it but it doesn't hurt.
		return JSON.parse(stringTheme, (k, v) => (k === "__proto__" ? undefined : v))
	}

	async _updateBuiltinThemes() {
		// In case we change built-in themes we want to save new copy on the device.
		for (const theme of typedValues(themes)) {
			await this.updateSavedThemeDefinition(theme)
		}
	}

	async reloadTheme() {
		const themeId = await this.themeFacade.getSelectedTheme()
		if (!themeId) return
		await this.setThemeId(themeId, false)
	}

	get themeId(): ThemeId {
		return this._themeId
	}

	async _getTheme(themeId: ThemeId): Promise<Theme> {
		if (themes[themeId]) {
			// Make a defensive copy so that original theme definition is not modified.
			return Object.assign({}, themes[themeId])
		} else {
			const loadedThemes = (await this.themeFacade.getThemes()) as ReadonlyArray<Theme>
			const customTheme = loadedThemes.find((t) => t.themeId === themeId)

			if (customTheme) {
				await this._sanitizeTheme(customTheme)
				return customTheme
			} else {
				return this.getDefaultTheme()
			}
		}
	}

	getCurrentTheme(): Theme {
		return Object.assign({}, this._theme)
	}

	/**
	 * Set the theme, if permanent is true then the locally saved theme will be updated
	 */
	async setThemeId(newThemeId: ThemeId, permanent: boolean = true) {
		const newTheme = await this._getTheme(newThemeId)

		this._applyTrustedTheme(newTheme, newThemeId)

		if (permanent) {
			await this.themeFacade.setSelectedTheme(newThemeId)
		}
	}

	_applyTrustedTheme(newTheme: Theme, newThemeId: ThemeId) {
		Object.keys(this._theme).forEach((key) => delete downcast(this._theme)[key])
		// Always overwrite light theme so that optional things are not kept when switching
		Object.assign(this._theme, this.getDefaultTheme(), newTheme)
		this._themeId = newThemeId
		this.themeIdChangedStream(newThemeId)
		m.redraw()
	}

	/**
	 * Apply the custom theme, if permanent === true, then the new theme will be saved
	 */
	async updateCustomTheme(customizations: ThemeCustomizations, permanent: boolean = true): Promise<void> {
		const updatedTheme = this.assembleTheme(customizations)
		// Set no logo until we sanitize it.
		const filledWithoutLogo = Object.assign({}, updatedTheme, {
			logo: "",
		})

		this._applyTrustedTheme(filledWithoutLogo, filledWithoutLogo.themeId)

		await this._sanitizeTheme(updatedTheme)

		// Now apply with the logo
		this._applyTrustedTheme(updatedTheme, filledWithoutLogo.themeId)

		if (permanent) {
			await this.updateSavedThemeDefinition(updatedTheme)
			await this.themeFacade.setSelectedTheme(updatedTheme.themeId)
		}
	}

	async _sanitizeTheme(theme: Theme) {
		if (theme.logo) {
			const logo = theme.logo
			const htmlSanitizer = await this.htmlSanitizer()
			theme.logo = htmlSanitizer.sanitizeHTML(logo).html
		}
	}

	/**
	 * Save theme to the storage.
	 */
	async updateSavedThemeDefinition(updatedTheme: Theme): Promise<Theme> {
		const nonNullTheme = Object.assign({}, this.getDefaultTheme(), updatedTheme)
		await this._sanitizeTheme(nonNullTheme)
		const oldThemes = (await this.themeFacade.getThemes()) as Array<Theme>
		findAndRemove(oldThemes, (t) => t.themeId === updatedTheme.themeId)
		oldThemes.push(nonNullTheme)
		await this.themeFacade.setThemes(oldThemes)
		return nonNullTheme
	}

	getDefaultTheme(): Theme {
		return Object.assign({}, themes[defaultThemeId])
	}

	getBaseTheme(baseId: BaseThemeId): Theme {
		// Make a defensive copy so that original theme definition is not modified.
		return Object.assign({}, themes[baseId])
	}

	shouldAllowChangingTheme(): boolean {
		return window.whitelabelCustomizations == null
	}

	/**
	 * Assembles a new theme object from customizations.
	 */
	assembleTheme(customizations: ThemeCustomizations): Theme {
		if (!customizations.base) {
			return Object.assign({}, customizations as Theme)
		} else if (customizations.base && customizations.logo) {
			return Object.assign({}, this.getBaseTheme(customizations.base), customizations)
		} else {
			const themeWithoutLogo = Object.assign({}, this.getBaseTheme(customizations.base), customizations)
			const coloredTutanotaLogo = getLogoSvg(
				themeWithoutLogo.content_accent,
				customizations.base === "light" ? logo_text_dark_grey : logo_text_bright_grey,
			)
			return { ...themeWithoutLogo, ...{ logo: coloredTutanotaLogo } }
		}
	}

	async getCustomThemes(): Promise<Array<ThemeId>> {
		return mapAndFilterNull(await this.themeFacade.getThemes(), (theme) => {
			return !(theme.themeId in themes) ? theme.themeId : null
		})
	}

	async removeCustomThemes() {
		await this.themeFacade.setThemes([])
		await this.setThemeId(defaultThemeId, true)
	}
}

export class NativeThemeFacade implements ThemeFacade {
	private readonly themeFacade: LazyLoaded<ThemeFacade>

	constructor() {
		this.themeFacade = new LazyLoaded<ThemeFacade>(async () => {
			const { locator } = await import("../api/main/MainLocator")
			// Theme initialization happens concurrently with locator initialization,
			// so we have to wait or native may not yet be defined when we first get here.
			// It would be nice to move all the global theme handling onto the locator as
			// well so we can have more control over this
			await locator.initialized
			return locator.themeFacade
		})
	}

	async getSelectedTheme(): Promise<ThemeId | null> {
		const dispatcher = await this.themeFacade.getAsync()
		return dispatcher.getSelectedTheme()
	}

	async setSelectedTheme(theme: ThemeId): Promise<void> {
		const dispatcher = await this.themeFacade.getAsync()
		return dispatcher.setSelectedTheme(theme)
	}

	async getThemes(): Promise<Array<Theme>> {
		const dispatcher = await this.themeFacade.getAsync()
		return (await dispatcher.getThemes()) as Theme[]
	}

	async setThemes(themes: ReadonlyArray<Theme>): Promise<void> {
		const dispatcher = await this.themeFacade.getAsync()
		return dispatcher.setThemes(themes)
	}
}

export class WebThemeFacade implements ThemeFacade {
	readonly _deviceConfig: DeviceConfig

	constructor(deviceConfig: DeviceConfig) {
		this._deviceConfig = deviceConfig
	}

	async getSelectedTheme(): Promise<ThemeId | null> {
		return this._deviceConfig.getTheme()
	}

	async setSelectedTheme(theme: ThemeId): Promise<void> {
		return this._deviceConfig.setTheme(theme)
	}

	async getThemes(): Promise<Array<Theme>> {
		// no-op
		return []
	}

	async setThemes(themes: ReadonlyArray<Theme>) {
		// no-op
	}
}
