// @flow
import {getLogoSvg} from "./base/icons/Logo"
import {defaultThemeId, DeviceConfig, deviceConfig} from "../misc/DeviceConfig"
import stream from "mithril/stream/stream.js"
import {assertMainOrNodeBoot} from "../api/common/Env"
import {downcast} from "../api/common/utils/Utils"
import m from "mithril"

assertMainOrNodeBoot()

export type ThemeId = 'light' | 'dark' | 'blue' | 'custom'

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


class ThemeManager {

	_theme: Theme
	_themeId: ThemeId

	customTheme: ?Theme
	deviceConfig: DeviceConfig

	// Subscribe to this to get theme change events. Cannot be used to update the theme
	themeIdChangedStream: Stream<ThemeId>

	constructor(deviceConfig: DeviceConfig) {
		this.deviceConfig = deviceConfig
		this.customTheme = null

		const savedThemeId = deviceConfig.getTheme()
		this._themeId = savedThemeId
		this._theme = this._getTheme(savedThemeId)
		this.themeIdChangedStream = stream(this.themeId)

		// If being accessed from a custom domain, the definition of whitelabelCustomizations is added to index.js serverside upon request
		// see RootHandler::applyWhitelabelFileModifications.
		if (typeof whitelabelCustomizations !== "undefined" && whitelabelCustomizations && whitelabelCustomizations.theme) {
			this.updateCustomTheme(whitelabelCustomizations.theme)
		} else if (this.themeId === "custom") {
			// if they have a custom theme set but no custom theme exists, we should set them back to light theme
			this.setThemeId("light")
		}
	}

	get themeId(): ThemeId {
		return this._themeId
	}

	_getTheme(themeId: ThemeId): Theme {
		// Make a defensive copy so that original theme definition is not modified.
		switch (themeId) {
			case 'custom':
				return Object.assign({}, themes.light, this.customTheme)
			case 'dark':
				return Object.assign({}, themes.dark)
			case 'blue':
				return Object.assign({}, themes.blue)
			default:
				return Object.assign({}, themes.light)
		}
	}

	/**
	 * Set the theme, if permanent is true then the locally saved theme will be updated
	 */
	setThemeId(newThemeId: ThemeId, permanent: boolean = true) {
		// Always overwrite light theme so that optional things are not kept when switching
		Object.keys(this._theme).forEach(key => delete downcast(this._theme)[key])
		Object.assign(this._theme, themes.light, this._getTheme(newThemeId))

		this._themeId = newThemeId
		if (permanent) {
			deviceConfig.setTheme(newThemeId)
		}
		this.themeIdChangedStream(newThemeId)
	}

	/**
	 * Set the custom theme, if permanent === true, then the new theme will be saved to localStorage
	 */
	updateCustomTheme(updatedTheme: Object, permanent: boolean = true) {
		const logo = updatedTheme.logo
		// set no logo until we sanitize it
		this.customTheme = Object.assign({}, this.getDefaultTheme(), updatedTheme, {logo: ""})
		const nonNullTheme = this.customTheme
		if (logo) {
			import("dompurify").then((dompurify) => {
				nonNullTheme.logo = dompurify.default.sanitize(logo)
				this.setThemeId("custom", permanent) // let it copy attributes in .map() listener
				m.redraw()
			})
		}
		this.setThemeId('custom', permanent)
	}

	getDefaultTheme(): Theme {
		return this._getTheme(defaultThemeId)
	}
}

export const themeManager: ThemeManager = new ThemeManager(deviceConfig)

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
