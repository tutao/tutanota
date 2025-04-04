import { assertMainOrNodeBoot } from "../api/common/Env"
import { isColorLight } from "./base/Color"
import { logoDefaultGrey, tutaDunkel, tutaRed } from "./builtinThemes"
import { getTutaLogoSvg } from "./base/Logo.js"

assertMainOrNodeBoot()

/**
 * Unique identifier for a theme.
 * There are few built-in ones and there are whitelabel ones.
 * Whitelabel themes use domain name as an ID.
 */
export type ThemeId = "light" | "dark" | "light_secondary" | "dark_secondary" | string
export type BaseThemeId = "light" | "dark"
/**
 * This one is not attached to any single theme but is persisted and is shown to the user as a preference.
 */
export type ThemePreference = ThemeId | "auto:light|dark"
export type Theme = {
	themeId: ThemeId
	logo: string
	// Basic color tokens
	primary: string
	on_primary: string
	secondary: string
	on_secondary: string
	error: string
	surface: string
	surface_container: string
	/**
	 * @deprecated This token should not be used.
	 * It was created temporarily for the purpose of color theme migration.
	 */
	on_surface_fade: string
	on_surface: string
	on_surface_variant: string
	outline: string
	outline_variant: string
	scrim: string
	// Campaign colors
	content_bg_tuta_bday: string
	content_accent_tuta_bday: string
	content_accent_secondary_tuta_bday: string
	error_container: string
	on_error_container: string
	success: string
	success_container: string
	on_success_container: string
	tuta_color_nota: string
	highlight_bg: string
	highlight_fg: string
	// Experimental colors; using material 3 color tokens which will be introduced in the future
	experimental_primary_container: string
	experimental_on_primary_container: string
	experimental_tertiary: string
	go_european: string
	on_go_european: string
	// semantic colors
	error: string
	on_error: string
	error_container: string
	on_error_container: string
	warning: string
	on_warning: string
	warning_container: string
	on_warning_container: string
	success: string
	on_success: string
	success_container: string
	on_success_container: string
}

const themeSingleton = {}

// ThemeController.updateTheme updates the object in place, so this will always be current.
// There are few alternative ways this could have been implemented:
//  * make each property on this singleton a getter that defers to themeController
//  * make this singleton a proxy that does the same thing
// We keep this singleton available because it is convenient to refer to, and already everywhere in the code before the addition of ThemeController.
export const theme = themeSingleton as Theme

export const themeOptions = (isCalendarApp: boolean) =>
	[
		{
			name: "systemThemePref_label",
			value: "auto:light|dark",
		},
		{
			name: "light_label",
			value: "light",
		},
		{
			name: "dark_label",
			value: "dark",
		},
		{
			name: isCalendarApp ? "light_red_label" : "light_blue_label",
			value: "light_secondary",
		},
		{
			name: isCalendarApp ? "dark_red_label" : "dark_blue_label",
			value: "dark_secondary",
		},
	] as const

export function getElevatedBackground(): string {
	return isColorLight(theme.surface) ? theme.surface : theme.surface_container
}

export function getNavigationMenuBg(): string {
	return isColorLight(theme.surface) ? theme.secondary : theme.surface
}

export function isDefaultLightTheme(): boolean {
	return theme.themeId === "light" || theme.themeId === "light_secondary"
}

/**
 * @return true if the current theme is a light theme
 */
export function isLightTheme(): boolean {
	return isColorLight(theme.content_bg)
}

/**
 * @return true if the current theme is a dark theme
 */
export function isDarkTheme(): boolean {
	return !isLightTheme()
}

export function getLightOrDarkTutaLogo(isCalendarApp: boolean): string {
	// Use tuta logo with our brand colors
	const isCalendarTheme = (theme.themeId === "light" && isCalendarApp) || (theme.themeId === "light_secondary" && !isCalendarApp)
	if (isDefaultLightTheme() && !isCalendarTheme) {
		return getTutaLogoSvg(tutaRed, tutaDunkel)
	} else {
		return getTutaLogoSvg(logoDefaultGrey, logoDefaultGrey)
	}
}
