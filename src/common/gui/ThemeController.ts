import { DeviceConfig } from "../misc/DeviceConfig"
import type { HtmlSanitizer } from "../misc/HtmlSanitizer"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { assertMainOrNodeBoot, isApp, isDesktop } from "../api/common/Env"
import { downcast, findAndRemove, LazyLoaded, mapAndFilterNull, typedValues } from "@tutao/tutanota-utils"
import m from "mithril"
import type { BaseThemeId, Theme, ThemeId, ThemePreference } from "./theme"
import { logoDefaultGrey, themes } from "./builtinThemes"
import type { ThemeCustomizations } from "../misc/WhitelabelCustomizations"
import { getWhitelabelCustomizations } from "../misc/WhitelabelCustomizations"
import { getCalendarLogoSvg, getMailLogoSvg } from "./base/Logo"
import { ThemeFacade } from "../native/common/generatedipc/ThemeFacade"
import { AppType } from "../misc/ClientConstants.js"

assertMainOrNodeBoot()

export const defaultThemeId: ThemeId = "light"

export class ThemeController {
	private readonly theme: Theme
	_themeId: ThemeId
	private _themePreference: ThemePreference
	// Subscribe to this to get theme change events. Cannot be used to update the theme
	readonly observableThemeId: Stream<ThemeId>
	readonly initialized: Promise<any>

	constructor(
		themeSingleton: {},
		private readonly themeFacade: ThemeFacade,
		private readonly htmlSanitizer: () => Promise<HtmlSanitizer>,
		private readonly app: AppType,
	) {
		// this will be overwritten quickly
		this._themeId = defaultThemeId
		this._themePreference = "auto:light|dark"
		this.theme = Object.assign(themeSingleton, this.getDefaultTheme())
		this.observableThemeId = stream(this.themeId)
		// We run them in parallel to initialize as soon as possible
		this.initialized = Promise.all([this._initializeTheme(), this.updateSavedBuiltinThemes()])
	}

	async _initializeTheme() {
		// If being accessed from a custom domain, the definition of whitelabelCustomizations is added to index.js serverside upon request
		// see RootHandler::applyWhitelabelFileModifications.
		const whitelabelCustomizations = getWhitelabelCustomizations(window)

		if (whitelabelCustomizations && whitelabelCustomizations.theme) {
			// no need to persist anything if we are on whitelabel domain
			const assembledTheme = await this.applyCustomizations(whitelabelCustomizations.theme, false)
			this._themePreference = assembledTheme.themeId
		} else {
			// It is theme info passed from native to be applied as early as possible.
			// Important! Do not blindly apply location.search, someone could try to do prototype pollution.
			// We check environment and also filter out __proto__
			// mithril's parseQueryString does not follow standard exactly so we try to use the same thing we use on the native side
			const themeJson = window.location.href ? new URL(window.location.href).searchParams.get("theme") : null

			if ((isApp() || isDesktop()) && themeJson) {
				const parsedTheme: ThemeCustomizations = this.parseCustomizations(themeJson)

				// We also don't need to save anything in this case
				await this.applyCustomizations(parsedTheme, false)
				// If it's a first start we might get a fallback theme from native. We can apply it for a short time but we should switch to the full, resolved
				// theme after that.
				await this.setThemePreference((await this.themeFacade.getThemePreference()) ?? this._themePreference)
			} else {
				await this.reloadTheme()
			}
		}
	}

	private parseCustomizations(stringTheme: string): ThemeCustomizations {
		// Filter out __proto__ to avoid prototype pollution. We use Object.assign() which is not susceptible to it but it doesn't hurt.
		return JSON.parse(stringTheme, (k, v) => (k === "__proto__" ? undefined : v))
	}

	private async updateSavedBuiltinThemes() {
		// In case we change built-in themes we want to save new copy on the device.
		for (const theme of typedValues(themes())) {
			await this.updateSavedThemeDefinition(theme)
		}

		// Remove blue theme because we don't have it anymore
		const oldThemes = (await this.themeFacade.getThemes()) as Array<Theme>
		findAndRemove(oldThemes, (t) => t.themeId === "blue")
		await this.themeFacade.setThemes(oldThemes)

		// Check if the blue theme was selected and fallback for auto
		const themePreference = await this.themeFacade.getThemePreference()
		if (!themePreference || themePreference !== "blue") return
		await this.setThemePreference("auto:light|dark", true)
	}

	async reloadTheme() {
		const themePreference = await this.themeFacade.getThemePreference()
		if (!themePreference) return
		await this.setThemePreference(themePreference, false)
	}

	get themeId(): ThemeId {
		return this._themeId
	}

	get themePreference(): ThemePreference {
		return this._themePreference
	}

	private async getTheme(themeId: ThemeId): Promise<Theme> {
		if (themes()[themeId]) {
			// Make a defensive copy so that original theme definition is not modified.
			return Object.assign({}, themes()[themeId])
		} else {
			const loadedThemes = (await this.themeFacade.getThemes()) as ReadonlyArray<Theme>
			const customTheme = loadedThemes.find((t) => t.themeId === themeId)

			if (customTheme) {
				await this.sanitizeTheme(customTheme)
				return customTheme
			} else {
				return this.getDefaultTheme()
			}
		}
	}

	getCurrentTheme(): Theme {
		return Object.assign({}, this.theme)
	}

	/**
	 * Set the theme, if permanent is true then the locally saved theme will be updated
	 */
	async setThemePreference(newThemePreference: ThemePreference, permanent: boolean = true) {
		const themeId = await this.resolveThemePreference(newThemePreference)
		const newTheme = await this.getTheme(themeId)

		this.applyTrustedTheme(newTheme, themeId)
		this._themePreference = newThemePreference

		if (permanent) {
			await this.themeFacade.setThemePreference(newThemePreference)
		}
	}

	private async resolveThemePreference(newThemePreference: ThemePreference): Promise<ThemeId> {
		if (newThemePreference === "auto:light|dark") {
			return (await this.themeFacade.prefersDark()) ? "dark" : "light"
		} else {
			return newThemePreference
		}
	}

	private applyTrustedTheme(newTheme: Theme, newThemeId: ThemeId) {
		// Theme object is effectively a singleton and is imported everywhere. It must be updated in place.
		// see theme.js

		// Clear all the keys first.
		for (const key of Object.keys(this.theme)) {
			delete downcast(this.theme)[key]
		}
		// Write new keys on it later. First default theme as base (so that optional values are correctly filled in) and then the new theme.
		Object.assign(this.theme, this.getDefaultTheme(), newTheme)
		this._themeId = newThemeId
		this.observableThemeId(newThemeId)
		m.redraw()
	}

	/**
	 * Apply the custom theme, if permanent === true, then the new theme will be saved
	 */
	async applyCustomizations(customizations: ThemeCustomizations, permanent: boolean = true): Promise<Theme> {
		const updatedTheme = this.assembleTheme(customizations)
		// Set no logo until we sanitize it.
		const filledWithoutLogo = Object.assign({}, updatedTheme, {
			logo: "",
		})

		this.applyTrustedTheme(filledWithoutLogo, filledWithoutLogo.themeId)

		await this.sanitizeTheme(updatedTheme)

		// Now apply with the logo
		this.applyTrustedTheme(updatedTheme, filledWithoutLogo.themeId)

		if (permanent) {
			this._themePreference = updatedTheme.themeId
			await this.updateSavedThemeDefinition(updatedTheme)
			await this.themeFacade.setThemePreference(updatedTheme.themeId)
		}

		return updatedTheme
	}

	async storeCustomThemeForCustomizations(customizations: ThemeCustomizations) {
		const newTheme = this.assembleTheme(customizations)
		await this.updateSavedThemeDefinition(newTheme)
	}

	private async sanitizeTheme(theme: Theme) {
		if (theme.logo) {
			const logo = theme.logo
			const htmlSanitizer = await this.htmlSanitizer()
			theme.logo = htmlSanitizer.sanitizeHTML(logo).html
		}
	}

	/**
	 * Save theme to the storage.
	 */
	private async updateSavedThemeDefinition(updatedTheme: Theme): Promise<Theme> {
		const nonNullTheme = Object.assign({}, this.getDefaultTheme(), updatedTheme)
		await this.sanitizeTheme(nonNullTheme)
		const oldThemes = (await this.themeFacade.getThemes()) as Array<Theme>
		findAndRemove(oldThemes, (t) => t.themeId === updatedTheme.themeId)
		oldThemes.push(nonNullTheme)
		await this.themeFacade.setThemes(oldThemes)
		return nonNullTheme
	}

	getDefaultTheme(): Theme {
		return Object.assign({}, themes()[defaultThemeId])
	}

	getBaseTheme(baseId: BaseThemeId): Theme {
		// Make a defensive copy so that original theme definition is not modified.
		return Object.assign({}, themes()[baseId])
	}

	shouldAllowChangingTheme(): boolean {
		return window.whitelabelCustomizations == null
	}

	/**
	 * Assembles a new theme object from customizations.
	 */
	private assembleTheme(customizations: ThemeCustomizations): Theme {
		if (!customizations.base) {
			return Object.assign({}, customizations as Theme)
		} else if (customizations.base && customizations.logo) {
			return Object.assign({}, this.getBaseTheme(customizations.base), customizations)
		} else {
			const themeWithoutLogo = Object.assign({}, this.getBaseTheme(customizations.base), customizations)
			// This is a whitelabel theme where logo has not been overwritten.
			// Generate a logo with muted colors. We do not want to color our logo in
			// some random color.
			const grayedLogo =
				this.app === AppType.Calendar
					? getCalendarLogoSvg(logoDefaultGrey, logoDefaultGrey, logoDefaultGrey)
					: getMailLogoSvg(logoDefaultGrey, logoDefaultGrey, logoDefaultGrey)
			return { ...themeWithoutLogo, ...{ logo: grayedLogo } }
		}
	}

	async getCustomThemes(): Promise<Array<ThemeId>> {
		return mapAndFilterNull(await this.themeFacade.getThemes(), (theme) => {
			return !(theme.themeId in themes()) ? theme.themeId : null
		})
	}
}

export class NativeThemeFacade implements ThemeFacade {
	constructor(private readonly themeFacade: LazyLoaded<ThemeFacade>) {}

	async getThemePreference(): Promise<ThemeId | null> {
		const dispatcher = await this.themeFacade.getAsync()
		return dispatcher.getThemePreference()
	}

	async setThemePreference(theme: ThemeId): Promise<void> {
		const dispatcher = await this.themeFacade.getAsync()
		return dispatcher.setThemePreference(theme)
	}

	async getThemes(): Promise<Array<Theme>> {
		const dispatcher = await this.themeFacade.getAsync()
		return (await dispatcher.getThemes()) as Theme[]
	}

	async setThemes(themes: ReadonlyArray<Theme>): Promise<void> {
		const dispatcher = await this.themeFacade.getAsync()
		return dispatcher.setThemes(themes)
	}

	async prefersDark(): Promise<boolean> {
		const dispatcher = await this.themeFacade.getAsync()
		return dispatcher.prefersDark()
	}
}

export class WebThemeFacade implements ThemeFacade {
	private readonly mediaQuery: MediaQueryList | undefined = window.matchMedia?.("(prefers-color-scheme: dark)")

	constructor(private readonly deviceConfig: DeviceConfig) {}

	async getThemePreference(): Promise<ThemeId | null> {
		return this.deviceConfig.getTheme()
	}

	async setThemePreference(theme: ThemeId): Promise<void> {
		return this.deviceConfig.setTheme(theme)
	}

	async getThemes(): Promise<Array<Theme>> {
		// no-op
		return []
	}

	async setThemes(themes: ReadonlyArray<Theme>) {
		// no-op
	}

	async prefersDark(): Promise<boolean> {
		return this.mediaQuery?.matches ?? false
	}

	addDarkListener(listener: () => unknown) {
		this.mediaQuery?.addEventListener("change", listener)
	}
}
