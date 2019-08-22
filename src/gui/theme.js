// @flow
import {LogoSvg} from "./base/icons/Logo"
import {deviceConfig} from "../misc/DeviceConfig"
import stream from "mithril/stream/stream.js"
import {assertMainOrNodeBoot} from "../api/Env"
import DOMPurify from "dompurify"

assertMainOrNodeBoot()

export type Theme = {
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

export const themeId: Stream<ThemeId> = stream(getThemeId())
let customTheme: ?Theme = null
if (typeof whitelabelCustomizations !== "undefined" && whitelabelCustomizations && whitelabelCustomizations.theme) {
	updateCustomTheme(whitelabelCustomizations.theme)
}

export let theme: Theme = getTheme()
export const defaultTheme: Theme = getLightTheme()

themeId.map(() => {
	// Always overwrite light theme so that optional things are not kept when switching
	theme = Object.assign(getLightTheme(), getTheme())
})

function getThemeId(): ThemeId {
	if (deviceConfig.getTheme()) {
		return deviceConfig.getTheme()
	} else {
		return 'light'
	}
}

function getTheme(): Theme {
	switch (themeId()) {
		case 'custom':
			return (Object.assign({}, getLightTheme(), customTheme): any)
		case 'dark':
			return getDarkTheme()
		default:
			return getLightTheme()
	}
}

export function updateCustomTheme(updatedTheme: Object) {
	if (updatedTheme.logo) {
		updatedTheme.logo = DOMPurify.sanitize(updatedTheme.logo)
	}
	customTheme = Object.assign({}, defaultTheme, updatedTheme)
	themeId('custom')
}

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

function getLightTheme() {
	const light = '#ffffff'

	const grey_lighter_4 = '#f6f6f6'
	const grey_lighter_3 = '#eaeaea'
	const grey_lighter_2 = "#e1e1e1"
	const grey_lighter_1 = '#d5d5d5'
	const grey_lighter_0 = '#b8b8b8'
	const grey = '#868686'
	const grey_darker_0 = '#707070'
	const grey_darker_1 = '#303030'

	const red = '#840010'

	return {
		logo: LogoSvg.Red,


		button_bubble_bg: grey_lighter_3,
		button_bubble_fg: grey_darker_1,

		content_fg: grey_darker_1,
		content_button: grey_darker_0,
		content_button_selected: red,
		content_button_icon: light,
		content_button_icon_selected: light,
		content_accent: red,
		content_bg: light,
		content_border: grey_lighter_1,
		content_message_bg: grey_lighter_0,

		header_bg: light,
		header_box_shadow_bg: grey_lighter_1,
		header_button: grey_darker_0,
		header_button_selected: red,

		list_bg: light,
		list_alternate_bg: grey_lighter_4,
		list_accent_fg: red,
		list_message_bg: grey_lighter_0,
		list_border: grey_lighter_2,

		modal_bg: grey_darker_1,
		elevated_bg: light,

		navigation_bg: grey_lighter_4,
		navigation_border: grey_lighter_2,
		navigation_button: grey_darker_0,
		navigation_button_icon: light,
		navigation_button_selected: red,
		navigation_button_icon_selected: light,
		navigation_menu_bg: grey_lighter_3,
		navigation_menu_icon: grey
	}
}

function getDarkTheme(): Theme {
	// Assuming the background is black #000000 (rgb(0,0,0)) and text is white #000000 (rgb(255, 255, 255)) and recommended opacity of 87%
	// we get (x1 being foreground, x2 being background, x3 being result)
	// x3 = x2 + (x1-x2)*a1 or x3 = 0 + (255 - 0) * 0.87 = 221
	// rgb(221, 221, 221) = #DDDDDD
	// https://stackoverflow.com/questions/12228548/finding-equivalent-color-with-opacity
	const light_lighter_1 = '#DDDDDD'
	const light_lighter_0 = '#aeaeae'
	const light = '#999999'

	const dark_lighter_2 = '#4e4e4e'
	const dark_lighter_1 = "#363636"
	const dark_lighter_0 = '#232323'
	const dark = '#222222'
	const dark_darker_0 = '#111111'

	const green = '#00d2a7'

	return {
		logo: LogoSvg.Cyan,

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
		navigation_menu_icon: light,
	}
}
