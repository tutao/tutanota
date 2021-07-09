// @flow
import {getLogoSvg} from "./base/icons/Logo"
import {defaultThemeId, deviceConfig, DeviceConfig} from "../misc/DeviceConfig"
import stream from "mithril/stream/stream.js"
import {assertMainOrNodeBoot, isApp, isDesktop, isTest} from "../api/common/Env"
import {downcast, typedValues} from "../api/common/utils/Utils"
import m from "mithril"
import typeof {Request} from "../api/common/WorkerProtocol"
import {findAndRemove, mapAndFilterNull} from "../api/common/utils/ArrayUtils"
import type {HtmlSanitizer} from "../misc/HtmlSanitizer"

assertMainOrNodeBoot()

/**
 * Unique identifier for a theme.
 * There are few built-in ones and there are whitelabel ones.
 * Whitelabel themes use domain name as an ID.
 */
export type ThemeId = 'light' | 'dark' | 'blue' | string

export type Theme = {
	themeId: ThemeId,
	logo: string,

	button_bubble_bg: string,
	button_bubble_fg: string,

	content_bg: string,
	content_fg: string,
	content_button: string,
	content_button_selected: string,
	content_button_icon: string,
	content_button_icon_selected: string,
	content_button_icon_bg?: string,
	content_accent: string,
	content_border: string,
	content_message_bg: string,


	header_bg: string,
	header_box_shadow_bg: string,
	header_button: string,
	header_button_selected: string,

	list_bg: string,
	list_alternate_bg: string,
	list_accent_fg: string,
	list_message_bg: string,
	list_border: string,

	modal_bg: string,
	elevated_bg?: string,

	navigation_bg: string,
	navigation_border: string,
	navigation_button: string,
	navigation_button_icon_bg?: string,
	navigation_button_selected: string,
	navigation_button_icon: string,
	navigation_button_icon_selected: string,
	navigation_menu_bg?: string,
	navigation_menu_icon?: string
}

/**
 *      light theme background
 */

const light_white = '#ffffff'

const grey_lighter_4 = '#f6f6f6'
const grey_lighter_3 = '#eaeaea'
const grey_lighter_2 = "#e1e1e1"
const grey_lighter_1 = '#d5d5d5'
const grey_lighter_0 = '#b8b8b8'
const grey = '#868686'
const grey_darker_0 = '#707070'
const grey_darker_1 = '#303030'

const red = '#840010'
const blue = '#005885'
const logo_text_dark_grey = '#4a4a4a'

/**
 *      dark theme background
 *
 *      Assuming the background is black #000000 (rgb(0,0,0)) and text is white #000000 (rgb(255, 255, 255)) and recommended opacity of 87%
 *	    we get (x1 being foreground, x2 being background, x3 being result)
 *		x3 = x2 + (x1-x2)*a1 or x3 = 0 + (255 - 0) * 0.87 = 221
 *		rgb(221, 221, 221) = #DDDDDD
 *      https://stackoverflow.com/questions/12228548/finding-equivalent-color-with-opacity
 *
 */


const light_lighter_1 = '#DDDDDD'
const light_lighter_0 = '#aeaeae'
const light_grey = '#999999'

const dark_lighter_2 = '#4e4e4e'
const dark_lighter_1 = "#363636"
const dark_lighter_0 = '#232323'
const dark = '#222222'
const dark_darker_0 = '#111111'

const green = '#00d2a7'
const logo_text_bright_grey = '#c5c7c7'

type Themes = {
	[ThemeId]: Theme
}

export const themes: Themes = {

	light: Object.freeze({
		themeId: 'light',
		logo: getLogoSvg(red, logo_text_dark_grey),

		button_bubble_bg: grey_lighter_3,
		button_bubble_fg: grey_darker_1,

		content_fg: grey_darker_1,
		content_button: grey_darker_0,
		content_button_selected: red,
		content_button_icon: light_white,
		content_button_icon_selected: light_white,
		content_accent: red,
		content_bg: light_white,
		content_border: grey_lighter_1,
		content_message_bg: grey_lighter_0,

		header_bg: light_white,
		header_box_shadow_bg: grey_lighter_1,
		header_button: grey_darker_0,
		header_button_selected: red,

		list_bg: light_white,
		list_alternate_bg: grey_lighter_4,
		list_accent_fg: red,
		list_message_bg: grey_lighter_0,
		list_border: grey_lighter_2,

		modal_bg: grey_darker_1,
		elevated_bg: light_white,

		navigation_bg: grey_lighter_4,
		navigation_border: grey_lighter_2,
		navigation_button: grey_darker_0,
		navigation_button_icon: light_white,
		navigation_button_selected: red,
		navigation_button_icon_selected: light_white,
		navigation_menu_bg: grey_lighter_3,
		navigation_menu_icon: grey
	}),

	dark: Object.freeze({

		themeId: 'dark',
		logo: getLogoSvg(green, logo_text_bright_grey),

		button_bubble_bg: dark_lighter_2,
		button_bubble_fg: light_lighter_1,

		content_fg: light_lighter_1,
		content_button: light_lighter_0,
		content_button_selected: green,
		content_button_icon_bg: dark_lighter_2,
		content_button_icon: light_lighter_1,
		content_button_icon_selected: dark_lighter_0,
		content_accent: green,
		content_bg: dark_darker_0,
		content_border: dark_lighter_1,
		content_message_bg: dark_lighter_2,


		header_bg: dark,
		header_box_shadow_bg: dark_darker_0,
		header_button: light_lighter_0,
		header_button_selected: green,

		list_bg: dark_darker_0,
		list_alternate_bg: dark_lighter_0,
		list_accent_fg: green,
		list_message_bg: dark_lighter_2,
		list_border: dark_lighter_1,

		modal_bg: dark_darker_0,
		elevated_bg: dark_lighter_0,

		navigation_bg: dark_lighter_0,
		navigation_border: dark_lighter_1,
		navigation_button: light_lighter_0,
		navigation_button_icon_bg: dark_lighter_2,
		navigation_button_icon: light_lighter_1,
		navigation_button_selected: green,
		navigation_button_icon_selected: light_lighter_0,
		navigation_menu_bg: dark_darker_0,
		navigation_menu_icon: light_grey,
	}),

	blue: Object.freeze({

		themeId: 'blue',
		logo: getLogoSvg(blue, logo_text_dark_grey),

		button_bubble_bg: grey_lighter_3,
		button_bubble_fg: grey_darker_1,

		content_fg: grey_darker_1,
		content_button: grey_darker_0,
		content_button_selected: blue,
		content_button_icon: light_white,
		content_button_icon_selected: light_white,
		content_accent: blue,
		content_bg: light_white,
		content_border: grey_lighter_1,
		content_message_bg: grey_lighter_0,

		header_bg: light_white,
		header_box_shadow_bg: grey_lighter_1,
		header_button: grey_darker_0,
		header_button_selected: blue,

		list_bg: light_white,
		list_alternate_bg: grey_lighter_4,
		list_accent_fg: blue,
		list_message_bg: grey_lighter_0,
		list_border: grey_lighter_2,

		modal_bg: grey_darker_1,
		elevated_bg: light_white,

		navigation_bg: grey_lighter_4,
		navigation_border: grey_lighter_2,
		navigation_button: grey_darker_0,
		navigation_button_icon: light_white,
		navigation_button_selected: blue,
		navigation_button_icon_selected: light_white,
		navigation_menu_bg: grey_lighter_3,
		navigation_menu_icon: grey
	})
}

export interface ThemeStorage {
	getSelectedTheme(): Promise<?ThemeId>;

	setSelectedTheme(theme: ThemeId): Promise<void>;

	getThemes(): Promise<Array<Theme>>;

	setThemes(themes: $ReadOnlyArray<Theme>): Promise<void>;
}

export class ThemeManager {

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
		if (typeof whitelabelCustomizations !== "undefined" && whitelabelCustomizations && whitelabelCustomizations.theme) {
			// no need to persist anything if we are on whitelabel domain
			await this.updateCustomTheme(whitelabelCustomizations.theme, false)
		} else {
			// It is theme info passed from native to be applied as early as possible.
			// Important! Do not blindly apply location.search, someone could try to do prototype pollution.
			// We check environment and also filter out __proto__
			// mithril's parseQueryString does not follow standard exactly so we try to use the same thing we use on the native side
			const themeJson = window.location.href ? new URL(window.location.href).searchParams.get("theme") : null
			if ((isApp() || isDesktop()) && themeJson) {
				const parsedTheme: Theme = this._parseTheme(themeJson)
				// We also don't need to save anything in this case
				await this.updateCustomTheme(parsedTheme, false)
			} else {
				await this._applySavedTheme()
			}
		}
	}

	_parseTheme(stringTheme: string): Theme {
		// Filter out __proto__ to avoid prototype pollution. We use Object.assign() which is not susceptible to it but it doesn't hurt.
		return JSON.parse(stringTheme, (k, v) => k === "__proto__" ? undefined : v)
	}

	async _updateBuiltinThemes() {
		// In case we change built-in themes we want to save new copy on the device.
		for (const theme of typedValues(themes)) {
			await this.updateSavedThemeDefinition(theme)
		}
	}

	async _applySavedTheme() {
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
			const themes = await this._themeStorage.getThemes()
			const customTheme = themes.find(t => t.themeId === themeId)
			if (customTheme) {
				await this._sanitizeTheme(customTheme)
				return customTheme
			} else {
				return this.getDefaultTheme()
			}
		}
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
	async updateCustomTheme(updatedTheme: $Shape<Theme>, permanent: boolean = true) {
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

	shouldAllowChangingTheme(): boolean {
		return window.whitelabelCustomizations == null
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

class WebThemeStorage implements ThemeStorage {
	+_deviceConfig: DeviceConfig;

	constructor(deviceConfig: DeviceConfig) {
		this._deviceConfig = deviceConfig
	}

	async getSelectedTheme(): Promise<?ThemeId> {
		return this._deviceConfig.getTheme()
	}

	async setSelectedTheme(theme: ThemeId) {
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

const selectedThemeStorage = isApp() || isDesktop() ? new NativeThemeStorage() : new WebThemeStorage(deviceConfig)

// We need it because we want to run tests in node and real HTMLSanitizer does not work there.
const sanitizerStub = {
	sanitize: () => {
		return {
			text: "",
			externalContent: [],
			inlineImageCids: [],
			links: [],
		}
	}
}
export const themeManager: ThemeManager = new ThemeManager(
	selectedThemeStorage,
	isTest()
		? () => Promise.resolve(downcast<HtmlSanitizer>(sanitizerStub))
		: () => import("../misc/HtmlSanitizer").then(({htmlSanitizer}) => htmlSanitizer)
)

// ThemeManager.updateTheme updates the object in place, so this will always be current
// We keep this singleton available because it is convenient to refer to, and already everywhere in the code before the addition of ThemeManager
export const theme = themeManager._theme

export function getContentButtonIconBackground(): string {
	return theme.content_button_icon_bg || theme.content_button // fallback for the new color content_button_icon_bg
}

export function getNavButtonIconBackground(): string {
	return theme.navigation_button_icon_bg || theme.navigation_button // fallback for the new color content_button_icon_bg
}

export function getElevatedBackground(): string {
	return theme.elevated_bg || theme.content_bg
}

export function getNavigationMenuBg(): string {
	return theme.navigation_menu_bg || theme.navigation_bg
}

export function getNavigationMenuIcon(): string {
	return theme.navigation_menu_icon || theme.navigation_button_icon
}
