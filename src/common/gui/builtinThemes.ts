/**
 * @file color/theme definitions for default themes.
 */
import type { Theme, ThemeId } from "./theme"
import { assertMainOrNodeBoot } from "../api/common/Env"
import { getAppLogo } from "./base/Logo.js"
import { client } from "../misc/ClientDetector"

assertMainOrNodeBoot()

type Themes = Record<ThemeId, Theme>

const semanticColorsLight = {
	// Semantic colors
	error: "#DE3730",
	on_error: "#FFFFFF",
	error_container: "#FFEDEA",
	on_error_container: "#A80710",
	warning: "#8D7426",
	on_warning: "#FFFFFF",
	warning_container: "#FFEFCC",
	on_warning_container: "#655000",
	success: "#44845E",
	on_success: "#FFFFFF",
	success_container: "#E9FFED",
	on_success_container: "#2B5E3C",
}
const semanticColorsDark = {
	// Semantic colors
	error: "#FF5449",
	on_error: "#2D0001",
	error_container: "#690005",
	on_error_container: "#FFB4AB",
	warning: "#FFE089",
	on_warning: "#171000",
	warning_container: "#655000",
	on_warning_container: "#FFEFCC",
	success: "#5E9E77",
	on_success: "#001509",
	success_container: "#003920",
	on_success_container: "#93D5AA",
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
	const lightRed = Object.freeze<Theme>({
		...semanticColorsLight,
		themeId: isCalendarApp ? "light_secondary" : "light",
		logo: getAppLogo(),
		// Basic color tokens
		primary: "#8F4A4E",
		on_primary: "#FFFFFF",
		primary_container: "#F4D2D2",
		on_primary_container: "#733337",
		secondary: "#87521B",
		on_secondary: "#FFFFFF",
		secondary_container: "#FFDCC1",
		on_secondary_container: "#6B3B04",
		tertiary: "#63568F",
		on_tertiary: "#FFFFFF",
		tertiary_container: "#E7DEFF",
		on_tertiary_container: "#4B3E76",
		surface: "#FFFFFF",
		on_surface: "#221A14",
		surface_container: "#FCF9F6",
		surface_container_high: "#F5EEEA",
		surface_container_highest: "#e7e2de",
		on_surface_variant: "#4e4545",
		outline: "#7f7575",
		outline_variant: "#d0c4c4",
		scrim: "#000000",
		experimental_primary_container: "#FFF2EA",
		experimental_on_primary_container: "#410002",
		experimental_tertiary: "#D93951",
		// state colors; based on outline_variant, with alpha
		state_bg_hover: "#D7C1C144",
		state_bg_focus: "#D7C1C155",
		state_bg_active: "#D7C1C166",
		// Campaign colors
		tuta_color_nota: "#D93951",
		content_accent_tuta_bday: "#AC3E80",
		content_accent_secondary_tuta_bday: "#FCBFDE",
		content_bg_tuta_bday: "#222222",
		go_european: goEuropeanBlue,
		on_go_european: "#FFFFFF",
	})
	const darkRed = Object.freeze<Theme>({
		...semanticColorsDark,
		themeId: isCalendarApp ? "dark_secondary" : "dark",
		logo: getAppLogo("#9F8C8CAA"),
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
		surface: "#181212",
		surface_container: "#241e1e",
		surface_container_high: "#2f2828",
		surface_container_highest: "#3d3434",
		on_surface: "#f3ecec",
		on_surface_variant: "#d0c4c4",
		outline: "#998e8e",
		outline_variant: "#4e4545",
		scrim: "#000000",
		experimental_primary_container: "#C9C6C5",
		experimental_on_primary_container: "#232323",
		experimental_tertiary: "#D93951",
		// state colors; based on outline_variant, with alpha
		state_bg_hover: "#52434377",
		state_bg_focus: "#52434399",
		state_bg_active: "#524343AA",
		// Campaign colors
		tuta_color_nota: "#D93951",
		content_accent_tuta_bday: "#FCBFDE",
		content_accent_secondary_tuta_bday: "#AC3E80",
		content_bg_tuta_bday: "#FFFFFF",
		go_european: goEuropeanLightBlue,
		on_go_european: "#111111",
	})
	const lightBlue = Object.freeze<Theme>({
		...semanticColorsLight,
		themeId: isCalendarApp ? "light" : "light_secondary",
		logo: getAppLogo(isCalendarApp ? undefined : "#C4C6D0EE"),
		// Basic color tokens
		primary: "#435E91",
		on_primary: "#FFFFFF",
		primary_container: "#D2DAF3",
		on_primary_container: "#2A4678",
		secondary: "#7F4D7B",
		on_secondary: "#FFFFFF",
		secondary_container: "#FFD6F7",
		on_secondary_container: "#643662",
		tertiary: "#006A65",
		on_tertiary: "#FFFFFF",
		tertiary_container: "#9DF2EA",
		on_tertiary_container: "#00504C",
		surface: "#FFFFFF",
		surface_container: "#F7F9FC",
		surface_container_high: "#edf0f6",
		surface_container_highest: "#E0E3E8",
		on_surface: "#221A14",
		on_surface_variant: "#44474E",
		outline: "#74777F",
		outline_variant: "#C4C6D0",
		scrim: "#000000",
		experimental_primary_container: "#FFF2EA",
		experimental_on_primary_container: "#001641",
		experimental_tertiary: "#0040FF",
		// state colors; based on outline_variant, with alpha
		state_bg_hover: "#C4C6D044",
		state_bg_focus: "#C4C6D055",
		state_bg_active: "#C4C6D066",
		// Campaign colors
		tuta_color_nota: "#d93951",
		content_accent_tuta_bday: "#AC3E80",
		content_accent_secondary_tuta_bday: "#FCBFDE",
		content_bg_tuta_bday: "#222222",
		go_european: goEuropeanBlue,
		on_go_european: "#FFFFFF",
	})
	const darkBlue = Object.freeze<Theme>({
		...semanticColorsDark,
		themeId: isCalendarApp ? "dark" : "dark_secondary",
		logo: getAppLogo("#8E9099AA"),
		// Basic color tokens
		primary: "#ACC7FF",
		on_primary: "#0E2F60",
		primary_container: "#244173",
		on_primary_container: "#D7E2FF",
		secondary: "#F0B3E8",
		on_secondary: "#4B1F4A",
		secondary_container: "#643662",
		on_secondary_container: "#FFD6F7",
		tertiary: "#81D5CE",
		on_tertiary: "#003734",
		tertiary_container: "#00504C",
		on_tertiary_container: "#9DF2EA",
		surface: "#101418",
		surface_container: "#1C2024",
		surface_container_high: "#272A2F",
		surface_container_highest: "#33373D",
		on_surface: "#eceef4",
		on_surface_variant: "#c4c6d0",
		outline: "#8f919a",
		outline_variant: "#44474e",
		scrim: "#000000",
		experimental_primary_container: "#C9C6C5",
		experimental_on_primary_container: "#232323",
		experimental_tertiary: "#0040FF",
		// state colors; based on outline_variant, with alpha
		state_bg_hover: "#44474E77",
		state_bg_focus: "#44474E99",
		state_bg_active: "#44474EAA",
		// Campaign colors
		tuta_color_nota: "#D93951",
		content_accent_tuta_bday: "#FCBFDE",
		content_accent_secondary_tuta_bday: "#AC3E80",
		content_bg_tuta_bday: "#FFFFFF",
		go_european: goEuropeanLightBlue,
		on_go_european: "#111111",
	})

	return {
		light: isCalendarApp ? lightBlue : lightRed,
		dark: isCalendarApp ? darkBlue : darkRed,
		light_secondary: isCalendarApp ? lightRed : lightBlue,
		dark_secondary: isCalendarApp ? darkRed : darkBlue,
	}
}

// Fixed campaign colors
export const goEuropeanBlue = "#003E85"
export const goEuropeanLightBlue = "#ACC7FF"
