import { assertMainOrNodeBoot } from "../api/common/Env"
import { isColorLight } from "./base/Color"

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
	primary_container: string
	on_primary_container: string
	secondary: string
	on_secondary: string
	secondary_container: string
	on_secondary_container: string
	tertiary: string
	on_tertiary: string
	tertiary_container: string
	on_tertiary_container: string
	surface: string
	surface_container: string
	surface_container_high: string
	surface_container_highest: string
	on_surface: string
	on_surface_variant: string
	outline: string
	outline_variant: string
	scrim: string
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
	// State colors; These are not the Material 3 color tokens. We are not following the M3 guideline to simplify state representations.
	state_bg_hover: string
	state_bg_focus: string
	state_bg_active: string
	// Campaign colors; These colors are ONLY for campaign use.
	content_bg_tuta_bday: string
	content_accent_tuta_bday: string
	content_accent_secondary_tuta_bday: string
	tuta_color_nota: string
	/**
	 * @deprecated Use not experimental color tokens instead.
	 */
	experimental_primary_container: string
	/**
	 * @deprecated Use not experimental color tokens instead.
	 */
	experimental_on_primary_container: string
	/**
	 * @deprecated Use not experimental color tokens instead.
	 */
	experimental_tertiary: string
	go_european: string
	on_go_european: string
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
	return isColorLight(theme.surface) ? theme.surface_container_high : theme.surface
}

export function isLightTheme(): boolean {
	return theme.themeId === "light" || theme.themeId === "light_secondary"
}
