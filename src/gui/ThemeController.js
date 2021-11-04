//@flow
import {defaultThemeId, DeviceConfig} from "../misc/DeviceConfig";
import type {HtmlSanitizer} from "../misc/HtmlSanitizer";
import stream from "mithril/stream/stream.js";
import {assertMainOrNodeBoot, isApp, isDesktop} from "../api/common/Env";
import {downcast, neverNull, typedValues} from "../api/common/utils/Utils";
import m from "mithril";
import {findAndRemove, mapAndFilterNull} from "../api/common/utils/ArrayUtils";
import type {BaseThemeId, Theme, ThemeId} from "./theme";
import {themes} from "./builtinThemes";
import {getWhitelabelCustomizations} from "../misc/WhitelabelCustomizations"
import type {ThemeCustomizations} from "../misc/WhitelabelCustomizations"
import {getLogoSvg} from "./base/icons/Logo"
import {VALID_HEX_CODE_FORMAT} from "./base/Color"

assertMainOrNodeBoot()

export interface ThemeStorage {
	getSelectedTheme(): Promise<?ThemeId>;

	setSelectedTheme(theme: ThemeId): Promise<void>;

	getThemes(): Promise<Array<Theme>>;

	setThemes(themes: $ReadOnlyArray<Theme>): Promise<void>;
}

export class ThemeController {

	_theme: Theme
	_themeId: ThemeId

	+_themeStorage: ThemeStorage
	+_htmlSanitizer: () => Promise<HtmlSanitizer>

	// Subscribe to this to get theme change events. Cannot be used to update the theme
	themeIdChangedStream: Stream<ThemeId>

	initialized: Promise<*>

	constructor(themeStorage: ThemeStorage, htmlSanitizer: () => Promise<HtmlSanitizer>) {
		this._themeStorage = themeStorage
		this._htmlSanitizer = htmlSanitizer

		// this will change soon
		this._themeId = defaultThemeId
		this._theme = this.getDefaultTheme()
		this.themeIdChangedStream = stream(this.themeId)
		// We run them in parallel to initialize as soon as possible
		this.initialized = Promise.all([
			this._initializeTheme(),
			this._updateBuiltinThemes()
		])
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
		return JSON.parse(stringTheme, (k, v) => k === "__proto__" ? undefined : v)
	}

	async _updateBuiltinThemes() {
		// In case we change built-in themes we want to save new copy on the device.
		for (const theme of typedValues(themes)) {
			await this.updateSavedThemeDefinition(theme)
		}
	}

	async reloadTheme() {
		const themeId = await this._themeStorage.getSelectedTheme()
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
			const loadedThemes = await this._themeStorage.getThemes()
			const customTheme = loadedThemes.find(t => t.themeId === themeId)
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
			await this._themeStorage.setSelectedTheme(newThemeId)
		}
	}

	_applyTrustedTheme(newTheme: Theme, newThemeId: ThemeId) {
		Object.keys(this._theme).forEach(key => delete downcast(this._theme)[key])
		// Always overwrite light theme so that optional things are not kept when switching
		Object.assign(this._theme, this.getDefaultTheme(), newTheme)

		this._themeId = newThemeId
		this.themeIdChangedStream(newThemeId)
		m.redraw()
	}

	/**
	 * Set the custom theme, if permanent === true, then the new theme will be saved
	 */
	async updateCustomTheme(customizations: ThemeCustomizations, permanent: boolean = true): Promise<void> {

		const updatedTheme = this.assembleTheme(customizations)
		// Set no logo until we sanitize it.
		const filledWithoutLogo = Object.assign({}, updatedTheme, {logo: ""})
		this._applyTrustedTheme(filledWithoutLogo, filledWithoutLogo.themeId)

		await this._sanitizeTheme(updatedTheme)
		// Now apply with the logo
		this._applyTrustedTheme(updatedTheme, filledWithoutLogo.themeId)

		if (permanent) {
			await this.updateSavedThemeDefinition(updatedTheme)

			await this._themeStorage.setSelectedTheme(updatedTheme.themeId)
		}
	}

	async _sanitizeTheme(theme: Theme) {
		if (theme.logo) {
			const logo = theme.logo
			const htmlSanitizer = await this._htmlSanitizer()
			theme.logo = htmlSanitizer.sanitize(logo).text
		}
	}

	async updateSavedThemeDefinition(updatedTheme: Theme): Promise<Theme> {
		const nonNullTheme = Object.assign({}, this.getDefaultTheme(), updatedTheme)
		await this._sanitizeTheme(nonNullTheme)
		const oldThemes = await this._themeStorage.getThemes()
		findAndRemove(oldThemes, t => t.themeId === updatedTheme.themeId)
		oldThemes.push(nonNullTheme)
		await this._themeStorage.setThemes(oldThemes)
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
			return Object.assign({}, customizations)
		} else if (customizations.base && customizations.logo) {
			return Object.assign({}, this.getBaseTheme(customizations.base), customizations)
		} else {
			const coloredTutanotaLogo = {
				logo: getLogoSvg(customizations.content_accent, customizations.base === "light" ? '#4a4a4a' : '#c5c7c7')
			}
			return Object.assign({}, this.getBaseTheme(neverNull(customizations.base)), customizations, coloredTutanotaLogo)
		}
	}

	async getCustomThemes(): Promise<Array<ThemeId>> {
		return mapAndFilterNull(await this._themeStorage.getThemes(), (theme) => {
			return !(theme.themeId in themes) ? theme.themeId : null
		})
	}

	async removeCustomThemes() {
		await this._themeStorage.setThemes([])
		await this.setThemeId(defaultThemeId, true)
	}
}

export class NativeThemeStorage implements ThemeStorage {
	async getSelectedTheme(): Promise<?ThemeId> {
		return this._callWith("getSelectedTheme", [])
	}

	async setSelectedTheme(theme: ThemeId): Promise<void> {
		return this._callWith("setSelectedTheme", [theme])
	}

	async getThemes(): Promise<Array<Theme>> {
		return this._callWith("getThemes", [])
	}

	async setThemes(themes: $ReadOnlyArray<Theme>): Promise<void> {
		return this._callWith("setThemes", [themes])
	}

	async _callWith<R>(method: NativeRequestType, args: $ReadOnlyArray<mixed>): Promise<R> {
		const {nativeApp} = await import("../native/common/NativeWrapper")
		const {Request} = await import("../api/common/WorkerProtocol")
		await nativeApp.initialized()
		return nativeApp.invokeNative(new Request(method, args))
	}
}

export class WebThemeStorage implements ThemeStorage {
	+_deviceConfig: DeviceConfig;

	constructor(deviceConfig: DeviceConfig) {
		this._deviceConfig = deviceConfig
	}

	async getSelectedTheme(): Promise<?ThemeId> {
		return this._deviceConfig.getTheme()
	}

	async setSelectedTheme(theme: ThemeId): Promise<void> {
		return this._deviceConfig.setTheme(theme)
	}

	async getThemes(): Promise<Array<Theme>> {
		// no-op
		return []
	}

	async setThemes(themes: $ReadOnlyArray<Theme>) {
		// no-op
	}
}