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

// Base color name
const PEACH = "#FFF2EA"
const DARK_PEACH = "#C9C6C5"
const RED_DUNKEL = "#410002"
const RED_FIGHTER = "#D93951"

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
const blue = "#003E85"
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

// These are constants that have been chosen because they work across themes
// This is even lighter than hover, for special cases like inactive search bar background
export const stateBgLike = "rgba(210,196,186,0.20)"
export const stateBgHover = "rgb(210,196,186,0.30)"
export const stateBgFocus = "rgba(210,196,186,0.40)"
export const stateBgActive = "rgba(210,196,186,0.50)"
export const logoDefaultGrey = logo_text_bright_grey
export const tutaRed = red
export const tutaDunkel = dunkel

type Themes = Record<ThemeId, Theme>

const getLogo = (isDark: boolean, isDefault: boolean) => {
	const isDarkOrDefault = isDark || !isDefault
	if (!isApp()) {
		return isDarkOrDefault ? getTutaLogoSvg("#c4c6d0", "#c4c6d0") : getTutaLogoSvg(red, dunkel)
	}

	if (client.isCalendarApp()) {
		return isDarkOrDefault
			? getCalendarLogoSvg(logo_text_bright_grey, logo_text_bright_grey, logo_text_bright_grey)
			: getCalendarLogoSvg(blue, secondary_blue, black)
	}

	return isDarkOrDefault ? getMailLogoSvg(logo_text_bright_grey, logo_text_bright_grey, logo_text_bright_grey) : getMailLogoSvg(red, secondary_red, black)
}

/**
 * Color token definitions for each built-in theme.
 * We follow the color roles from Material 3 to define the names of the tokens,
 * the following link might be helpful to know which color token should be used in which situation.
 * https://m3.material.io/styles/color/roles
 *
 * When a new color role is needed, please follow the instructions below.
 * https://m3.material.io/styles/color/advanced/define-new-colors#baed14ce-4be8-46aa-8223-ace5d45af005
 */
export const themes = (): Themes => {
	const isCalendarApp = client.isCalendarApp()
	const lightRed = Object.freeze({
		themeId: !isCalendarApp ? "light" : "light_secondary",
		logo: getLogo(false, !isCalendarApp),
		// Campaign colors
		tuta_color_nota: red_nota,
		content_accent_tuta_bday: dark_purple,
		content_accent_secondary_tuta_bday: light_purple,
		content_bg_tuta_bday: dark,
		// Basic color tokens
		primary: "#8F4A4E",
		on_primary: "#FFFFFF",
		primary_container: "#FFDADA",
		on_primary_container: "#733337",
		secondary: "#7F5610",
		on_secondary: "#FFFFFF",
		secondary_container: "#FFDDB2",
		on_secondary_container: "#624000",
		tertiary: "#63568F",
		on_tertiary: "#FFFFFF",
		tertiary_container: "#E7DEFF",
		on_tertiary_container: "#4B3E76",
		error: "#BA1A1A",
		surface: "#FFFFFF",
		surface_dim: "#FBEBE1",
		on_surface: "#221A14",
		surface_container: "#fcf9f6",
		surface_container_high: "#f5eeea",
		on_surface_variant: "#524343",
		on_surface_fade: "#857373", // neutral-variant-50
		outline: "#857373",
		outline_variant: "#D7C1C1",
		scrim: "#000000",
		experimental_primary_container: PEACH,
		experimental_on_primary_container: RED_DUNKEL,
		experimental_tertiary: RED_FIGHTER,
	})
	const darkRed = Object.freeze({
		themeId: !isCalendarApp ? "dark" : "dark_secondary",
		logo: getLogo(true, !isCalendarApp),
		// Campaign colors
		tuta_color_nota: red_nota,
		content_accent_tuta_bday: light_purple,
		content_accent_secondary_tuta_bday: dark_purple,
		content_bg_tuta_bday: light_white,
		// Basic color tokens
		primary: "#FFB3B5",
		on_primary: "#561D22",
		primary_container: "#733337",
		on_primary_container: "#FFDADA",
		secondary: "#F3BD6E",
		on_secondary: "#442B00",
		secondary_container: "#624000",
		on_secondary_container: "#FFDDB2",
		tertiary: "#CDBDFF",
		on_tertiary: "#34275E",
		tertiary_container: "#4B3E76",
		on_tertiary_container: "#E7DEFF",
		error: "#FFB4AB",
		surface: "#111111",
		surface_dim: "#000000",
		surface_container: "#19120C",
		surface_container_high: "#261E18",
		on_surface_fade: "#EFE0D5",
		on_surface: "#EFE0D5",
		on_surface_variant: "#D7C1C1",
		outline: "#9F8C8C",
		outline_variant: "#524343",
		scrim: "#000000",
		experimental_primary_container: DARK_PEACH,
		experimental_on_primary_container: dark_lighter_0,
		experimental_tertiary: RED_FIGHTER,
	})
	const lightBlue = Object.freeze({
		themeId: isCalendarApp ? "light" : "light_secondary",
		// blue is not really our brand color, treat blue like whitelabel color
		logo: getLogo(false, isCalendarApp),
		// Campaign colors
		tuta_color_nota: red_nota,
		content_accent_tuta_bday: dark_purple,
		content_accent_secondary_tuta_bday: light_purple,
		content_bg_tuta_bday: dark,
		// Basic color tokens
		primary: "#435E91",
		on_primary: "#FFFFFF",
		primary_container: "#D7E2FF",
		on_primary_container: "#2A4678",
		secondary: "#7F4D7B",
		on_secondary: "#FFFFFF",
		secondary_container: "#FFD6F7",
		on_secondary_container: "#643662",
		tertiary: "#006A65",
		on_tertiary: "#FFFFFF",
		tertiary_container: "#9DF2EA",
		on_tertiary_container: "#00504C",
		error: "#BA1A1A",
		surface: "#FFFFFF",
		surface_dim: "#f7f9ff",
		surface_container: "#f7f9ff",
		surface_container_high: "#ebeef3",
		on_surface_fade: "#221A14",
		on_surface: "#221A14",
		on_surface_variant: "#44474E",
		outline: "#74777F",
		outline_variant: "#C4C6D0",
		scrim: "#000000",
		experimental_primary_container: PEACH,
		experimental_on_primary_container: BLUE_DUNKEL,
		experimental_tertiary: BLUE_FIGHTER,
	})
	const darkBlue = Object.freeze({
		themeId: isCalendarApp ? "dark" : "dark_secondary",
		logo: getLogo(true, isCalendarApp),
		// Campaign colors
		tuta_color_nota: red_nota,
		content_accent_tuta_bday: light_purple,
		content_accent_secondary_tuta_bday: dark_purple,
		content_bg_tuta_bday: light_white,
		// Basic color tokens
		primary: "#ACC7FF",
		on_primary: "#0E2F60",
		primary_container: "#2A4678",
		on_primary_container: "#D7E2FF",
		secondary: "#F0B3E8",
		on_secondary: "#4B1F4A",
		secondary_container: "#643662",
		on_secondary_container: "#FFD6F7",
		tertiary: "#81D5CE",
		on_tertiary: "#003734",
		tertiary_container: "#00504C",
		on_tertiary_container: "#9DF2EA",
		error: "#FFB4AB",
		surface: "#111111",
		surface_dim: "#000000",
		surface_container: "#19120C",
		surface_container_high: "#261E18",
		on_surface_fade: "#EFE0D5",
		on_surface: "#EFE0D5",
		on_surface_variant: "#C4C6D0",
		outline: "#8E9099",
		outline_variant: "#44474E",
		scrim: "#000000",
		experimental_primary_container: DARK_PEACH,
		experimental_on_primary_container: dark_lighter_0,
		experimental_tertiary: BLUE_FIGHTER,
	})

	return {
		light: isCalendarApp ? lightBlue : lightRed,
		dark: isCalendarApp ? darkBlue : darkRed,
		light_secondary: isCalendarApp ? lightRed : lightBlue,
		dark_secondary: isCalendarApp ? darkRed : darkBlue,
	}
}
