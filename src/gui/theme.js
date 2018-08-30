// @flow
import {Logo} from "./base/icons/Logo"
import {deviceConfig} from "../misc/DeviceConfig"
import stream from "mithril/stream/stream.js"
import {assertMainOrNodeBoot} from "../api/Env"

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

	navigation_bg: string,
	navigation_border: string,
	navigation_button: string,
	navigation_button_selected: string,
	navigation_button_icon: string,
	navigation_button_icon_selected: string,
}

let customTheme: ?Theme = typeof whitelabelCustomizations !== "undefined" && whitelabelCustomizations
&& whitelabelCustomizations.theme ? whitelabelCustomizations.theme : null
export const themeId: stream<ThemeId> = stream(getThemeId())
export var theme: Theme = getTheme()
export var defaultTheme: Theme = getLightTheme()

themeId.map(() => {
	theme = Object.assign(theme, getTheme())
})

function getThemeId(): ThemeId {
	if (customTheme && Object.keys(customTheme).length > 0) {
		return 'custom'
	} else {
		if (deviceConfig.getTheme()) {
			return deviceConfig.getTheme()
		} else {
			return 'light'
		}
	}
}

function getTheme(): Theme {
	switch (themeId()) {
		case 'custom':
			return (Object.assign({}, getLightTheme(), customTheme): any)
		case 'dark':
			return getDarkTheme() // getD()
		default:
			return getLightTheme()
	}
}

export function updateCustomTheme(updatedTheme: ?Object) {
	customTheme = Object.assign({}, defaultTheme, updatedTheme)
	themeId('custom')
}


function getLightTheme() {
	const light = '#ffffff'

	const grey_lightest = '#f6f6f6'
	const grey_lighter = '#eaeaea'
	const grey_dark = '#d5d5d5'
	const grey = '#909090'
	const grey_darker = '#707070'
	//const grey_darkest = '#4A4A4A'
	const grey_darkest = '#303030'

	const red = '#840010'

	return {
		logo: Logo.Red,


		button_bubble_bg: grey_lighter,
		button_bubble_fg: grey_darkest,

		content_fg: grey_darkest,
		content_button: grey_darker,
		content_button_selected: red,
		content_button_icon: light,
		content_button_icon_selected: light,
		content_accent: red,
		content_bg: light,
		content_border: grey_dark,
		content_message_bg: grey_lightest,

		header_bg: light,
		header_box_shadow_bg: grey_dark,
		header_button: grey_darker,
		header_button_selected: red,

		list_bg: grey_lightest,
		list_alternate_bg: light,
		list_accent_fg: red,
		list_message_bg: light,
		list_border: grey_dark,

		modal_bg: grey_darkest,

		navigation_bg: grey_lighter,
		navigation_border: grey_dark,
		navigation_button: grey_darker,
		navigation_button_icon: light,
		navigation_button_selected: red,
		navigation_button_icon_selected: light
	}
}

function getDarkTheme(): Theme {

	const lightest = '#fff'
	const lighter = '#c5c7c7'
	const light = '#B0B0B0'
	const grey = '#909090'

	const dark_lightest = '#5e5c5c'
	const dark_lighter = '#4a4a4a'
	const dark = '#3b3a3a'
	const dark_darkest = '#222222'

	const cyan = '#76cbda'

	return {
		logo: Logo.Cyan,


		button_bubble_bg: dark_lighter,
		button_bubble_fg: lighter,

		content_fg: lighter,
		content_button: light,
		content_button_selected: cyan,
		content_button_icon: dark_lighter,
		content_button_icon_selected: lightest,
		content_accent: cyan,
		content_bg: dark_lighter,
		content_border: light,
		content_message_bg: dark_lightest,


		header_bg: dark,
		header_box_shadow_bg: dark_darkest,
		header_button: light,
		header_button_selected: cyan,

		list_bg: dark,
		list_alternate_bg: dark_lighter,
		list_accent_fg: cyan,
		list_message_bg: dark_lightest,
		list_border: dark,

		modal_bg: lighter,

		navigation_bg: dark_lightest,
		navigation_border: dark,
		navigation_button: light,
		navigation_button_icon: dark_lighter,
		navigation_button_selected: cyan,
		navigation_button_icon_selected: lightest,
	}
}
