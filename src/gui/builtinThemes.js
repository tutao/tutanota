// @flow

/**
 * @file color/theme definitions for default themes.
 */

import {getLogoSvg} from "./base/icons/Logo"
import type {Theme, ThemeId} from "./theme"
import {assertMainOrNodeBoot} from "../api/common/Env"

assertMainOrNodeBoot()

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
		navigation_menu_icon: grey,
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
		navigation_menu_icon: grey,
	})
}

