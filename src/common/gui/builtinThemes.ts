/**
 * @file color/theme definitions for default themes.
 */
import { getCalendarLogoSvg, getMailLogoSvg, getTutaLogoSvg } from "./base/Logo"
import type { Theme, ThemeId } from "./theme"
import { assertMainOrNodeBoot, isApp } from "../api/common/Env"
import { client } from "../misc/ClientDetector.js"

assertMainOrNodeBoot()

/**
 *      light theme background
 */
const light_white = "#ffffff"
const grey_lighter_4 = "#f6f6f6"
const grey_lighter_3 = "#eaeaea"
const grey_lighter_2 = "#e1e1e1"
const grey_lighter_1 = "#d5d5d5"
const grey_lighter_0 = "#b8b8b8"
const grey = "#868686"
const grey_darker_0 = "#707070"
const grey_darker_1 = "#303030"
const red = "#850122"
const secondary_red = "#FF2222"
const dunkel = "#410002"
const blue = "#013E85"
const secondary_blue = "#4282FF"
const light_blue = "#4C89FF"
const lighter_blue = "#A1C1FF"

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
const light_lighter_1 = "#DDDDDD"
const light_lighter_0 = "#aeaeae"
const light_grey = "#999999"
const dark_lighter_2 = "#4e4e4e"
const dark_lighter_1 = "#363636"
const dark_lighter_0 = "#232323"
const dark = "#222222"
const dark_darker_0 = "#111111"
const light_red = "#ff5353"
const lighter_red = "#FF6C6C"
const logo_text_bright_grey = "#c5c7c7"
const black = "#000000"

// These are constants that have been chosen because they work across themes
// This is even lighter than hover, for special cases like inactive search bar background
export const stateBgLike = "rgba(139,139,139,0.18)"
export const stateBgHover = "rgba(139,139,139,0.22)"
export const stateBgFocus = "rgba(139,139,139,0.29)"
export const stateBgActive = "rgba(139,139,139,0.38)"
export const logoDefaultGrey = logo_text_bright_grey
export const tutaRed = red
export const tutaDunkel = dunkel

type Themes = Record<ThemeId, Theme>

const getLogo = (isDark: boolean, isDefault: boolean) => {
	const isDarkOrDefault = isDark || !isDefault
	if (!isApp()) {
		return isDarkOrDefault ? getTutaLogoSvg(logo_text_bright_grey, logo_text_bright_grey) : getTutaLogoSvg(red, dunkel)
	}

	if (client.isCalendarApp()) {
		return isDarkOrDefault
			? getCalendarLogoSvg(logo_text_bright_grey, logo_text_bright_grey, logo_text_bright_grey)
			: getCalendarLogoSvg(blue, secondary_blue, black)
	}

	return isDarkOrDefault ? getMailLogoSvg(logo_text_bright_grey, logo_text_bright_grey, logo_text_bright_grey) : getMailLogoSvg(red, secondary_red, black)
}

export const themes = (): Themes => {
	const isCalendarApp = client.isCalendarApp()
	const lightRed = Object.freeze({
		themeId: !isCalendarApp ? "light" : "light_secondary",
		logo: getLogo(false, !isCalendarApp),
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
	})
	const darkRed = Object.freeze({
		themeId: !isCalendarApp ? "dark" : "dark_secondary",
		logo: getLogo(true, !isCalendarApp),
		button_bubble_bg: dark_lighter_2,
		button_bubble_fg: light_lighter_1,
		content_fg: light_lighter_1,
		content_button: light_lighter_0,
		content_button_selected: light_red,
		content_button_icon_bg: dark_lighter_2,
		content_button_icon: light_lighter_1,
		content_button_icon_selected: dark_lighter_0,
		content_accent: light_red,
		content_bg: dark_darker_0,
		content_border: dark_lighter_1,
		content_message_bg: dark_lighter_2,
		header_bg: dark,
		header_box_shadow_bg: dark_darker_0,
		header_button: light_lighter_0,
		header_button_selected: light_red,
		list_bg: dark_darker_0,
		list_alternate_bg: dark_lighter_0,
		list_accent_fg: light_red,
		list_message_bg: dark_lighter_2,
		list_border: dark_lighter_1,
		modal_bg: dark_darker_0,
		elevated_bg: dark_lighter_0,
		navigation_bg: dark_lighter_0,
		navigation_border: dark_lighter_1,
		navigation_button: light_lighter_0,
		navigation_button_icon_bg: dark_lighter_2,
		navigation_button_icon: light_lighter_1,
		navigation_button_selected: light_red,
		navigation_button_icon_selected: light_lighter_0,
		navigation_menu_bg: dark_darker_0,
		navigation_menu_icon: light_grey,
	})
	const lightBlue = Object.freeze({
		themeId: isCalendarApp ? "light" : "light_secondary",
		// blue is not really our brand color, treat blue like whitelabel color
		logo: getLogo(false, isCalendarApp),
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
	const darkBlue = Object.freeze({
		themeId: isCalendarApp ? "dark" : "dark_secondary",
		logo: getLogo(true, isCalendarApp),
		button_bubble_bg: dark_lighter_2,
		button_bubble_fg: light_lighter_1,
		content_fg: light_lighter_1,
		content_button: light_lighter_0,
		content_button_selected: light_blue,
		content_button_icon_bg: dark_lighter_2,
		content_button_icon: light_lighter_1,
		content_button_icon_selected: dark_lighter_0,
		content_accent: light_blue,
		content_bg: dark_darker_0,
		content_border: dark_lighter_1,
		content_message_bg: dark_lighter_2,
		header_bg: dark,
		header_box_shadow_bg: dark_darker_0,
		header_button: light_lighter_0,
		header_button_selected: light_blue,
		list_bg: dark_darker_0,
		list_alternate_bg: dark_lighter_0,
		list_accent_fg: light_blue,
		list_message_bg: dark_lighter_2,
		list_border: dark_lighter_1,
		modal_bg: dark_darker_0,
		elevated_bg: dark_lighter_0,
		navigation_bg: dark_lighter_0,
		navigation_border: dark_lighter_1,
		navigation_button: light_lighter_0,
		navigation_button_icon_bg: dark_lighter_2,
		navigation_button_icon: light_lighter_1,
		navigation_button_selected: light_blue,
		navigation_button_icon_selected: light_lighter_0,
		navigation_menu_bg: dark_darker_0,
		navigation_menu_icon: light_grey,
	})

	return {
		light: isCalendarApp ? lightBlue : lightRed,
		dark: isCalendarApp ? darkBlue : darkRed,
		light_secondary: isCalendarApp ? lightRed : lightBlue,
		dark_secondary: isCalendarApp ? darkRed : darkBlue,
	}
}
