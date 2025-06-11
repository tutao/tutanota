/**
 * @file color/theme definitions for default themes.
 */
import { getCalendarLogoSvg, getMailLogoSvg, getTutaLogoSvg } from "./base/Logo"
import type { Theme, ThemeId } from "./theme"
import { assertMainOrNodeBoot, isApp } from "../api/common/Env"
import { client } from "../misc/ClientDetector.js"

assertMainOrNodeBoot()

/**
 * semantic colors light as defined in Figma primitives
 */
const SONNE = "#FFCB00"
/**
 * semantic colors dark as defined in Figma primitives
 */
const SONNE_70 = "#FFECB7"
/**
 * semantic error ghost color light as defined in Figma primitives
 */
const SONNE_GHOST = "#FFCB007F" //7F = 50% from 255
/**
 * semantic error ghost color dark as defined in Figma primitives
 */
const SONNE_GHOST_70 = "#FFECB7D9" //D9 = 85% from 255
/**
 * Highlight color
 */
const highlight = "#FFDDB2"

/*
 * Semantic success color light as defined in figma primitives
 */
const GREEN = "#39D9C1"
/*
 * Semantic ghost success color light as defined in figma primitives
 */
const GREEN_GHOST = "#39D9C166" //66 = 40% from 255
/*
 * Semantic success color dark as defined in figma primitives
 */
const GREEN_70 = "#99D2C5"
/*
 * Semantic success color dark as defined in figma primitives
 */
const GREEN_GHOST_70 = "#99D2C5E5" //E5 = 90% from 255

// Base color name
const PEACH = "#FFF2EA"
const DARK_PEACH = "#C9C6C5"
const RED_DUNKEL = "#410002"
const RED_NOTA = "#D93951"

const BLUE_DUNKEL = "#001641"
const BLUE_FIGHTER = "#0040FF"

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
const red_nota = "#d93951"
const dunkel = "#410002"
const blue = "#013E85"
const secondary_blue = "#4282FF"
const blue_nota = "#3964d9"
const light_blue = "#ACC7FF"
const dark_purple = "#AC3E80"
const light_purple = "#FCBFDE"

/**
 *      dark theme background
 *
 *      Assuming the background is black #000000 (rgb(0,0,0)) and text is white #000000 (rgb(255, 255, 255)) and recommended opacity of 87%
 *        we get (x1 being foreground, x2 being background, x3 being result)
 *        x3 = x2 + (x1-x2)*a1 or x3 = 0 + (255 - 0) * 0.87 = 221
 *        rgb(221, 221, 221) = #DDDDDD
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
const light_red = "#E99497"
const logo_text_bright_grey = "#c5c7c7"
const black = "#000000"

// Secondary colors
export const secondary_fixed = "#FFDDB2"
export const on_secondary_fixed = "#291800"

// These are constants that have been chosen because they work across themes
// This is even lighter than hover, for special cases like inactive search bar background
export const stateBgLike = "rgba(139,139,139,0.18)"
export const stateBgHover = "rgba(139,139,139,0.22)"
export const stateBgFocus = "rgba(139,139,139,0.29)"
export const stateBgActive = "rgba(139,139,139,0.38)"
export const logoDefaultGrey = logo_text_bright_grey
export const tutaRed = red
export const tutaDunkel = dunkel
export const goEuropeanBlue = blue

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
	const lightRed = Object.freeze<Theme>({
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
		error_color: SONNE,
		error_container_color: SONNE_GHOST,
		on_error_container_color: dark_lighter_0,
		tuta_color_nota: red_nota,
		experimental_primary_container: PEACH,
		experimental_on_primary_container: RED_DUNKEL,
		experimental_tertiary: RED_NOTA,
		highlight_bg: highlight,
		highlight_fg: black,
		outline_variant: grey_lighter_1,
		go_european: goEuropeanBlue,
		on_go_european: light_white,
		success_color: GREEN,
		success_container_color: GREEN_GHOST_70,
		on_success_container_color: dark_lighter_0
	})
	const darkRed = Object.freeze<Theme>({
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
		error_color: SONNE_70,
		error_container_color: SONNE_GHOST_70,
		on_error_container_color: dark_lighter_0,
		tuta_color_nota: red_nota,
		experimental_primary_container: DARK_PEACH,
		experimental_on_primary_container: dark_lighter_0,
		experimental_tertiary: RED_NOTA,
		highlight_bg: highlight,
		highlight_fg: black,
		outline_variant: grey_darker_0,
		go_european: light_blue,
		on_go_european: dark_darker_0,
		success_color: GREEN_70,
		success_container_color: GREEN_GHOST_70,
		on_success_container_color: dark_lighter_0
	})
	const lightBlue = Object.freeze<Theme>({
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
		error_color: SONNE,
		error_container_color: SONNE_GHOST,
		on_error_container_color: dark_lighter_0,
		tuta_color_nota: blue_nota,
		experimental_primary_container: PEACH,
		experimental_on_primary_container: BLUE_DUNKEL,
		experimental_tertiary: BLUE_FIGHTER,
		highlight_bg: highlight,
		highlight_fg: black,
		outline_variant: grey_lighter_1,
		go_european: goEuropeanBlue,
		on_go_european: light_white,
		success_color: GREEN,
		success_container_color: GREEN_GHOST,
		on_success_container_color: dark_lighter_0
	})
	const darkBlue = Object.freeze<Theme>({
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
		error_color: SONNE_70,
		error_container_color: SONNE_GHOST_70,
		on_error_container_color: dark_lighter_0,
		tuta_color_nota: blue_nota,
		experimental_primary_container: DARK_PEACH,
		experimental_on_primary_container: dark_lighter_0,
		experimental_tertiary: BLUE_FIGHTER,
		highlight_bg: highlight,
		highlight_fg: black,
		outline_variant: grey_darker_0,
		go_european: light_blue,
		on_go_european: dark_darker_0,
		success_color: GREEN_70,
		success_container_color: GREEN_GHOST_70,
		on_success_container_color: dark_lighter_0
	})

	return {
		light: isCalendarApp ? lightBlue : lightRed,
		dark: isCalendarApp ? darkBlue : darkRed,
		light_secondary: isCalendarApp ? lightRed : lightBlue,
		dark_secondary: isCalendarApp ? darkRed : darkBlue,
	}
}
