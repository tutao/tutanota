import { BaseThemeId, Theme } from "../gui/theme"
import { assertMainOrNodeBoot } from "../api/common/Env"
import type { WhitelabelConfig } from "../api/entities/sys/TypeRefs.js"
import { ThemeController } from "../gui/ThemeController.js"

assertMainOrNodeBoot()

/**
 * Whitelabel theme customizations that can be set
 */
export interface WhitelabelThemeCustomizationsButForReal {
	/**
	 * Primary color in hexadecimal
	 */
	accentColor: string

	/**
	 * Theme to use
	 */
	theme: BaseThemeId

	/**
	 * Optional logo (if unspecified, the app's respective default grayscale logo for that theme will be used)
	 */
	logo?: string
}

export type ThemeCustomizations = Partial<Theme> & {
	base: BaseThemeId | null
}
export type ThemeKey = keyof Theme
export type CustomizationKey = keyof ThemeCustomizations

export type WhitelabelCustomizations = {
	theme: ThemeCustomizations | null
	germanLanguageCode: string
	registrationDomains: string[] | null
	imprintUrl: string | null
	privacyStatementUrl: string | null
}

/**
 * window.whitelabelCustomizations is defined when the user has logged in via a whitelabel domain. index.js is rewritten to have the definition
 * this happens at WhitelabelResourceRewriter.java
 */
export function getWhitelabelCustomizations(window: Window): WhitelabelCustomizations | null {
	// @ts-ignore
	return window.whitelabelCustomizations
}

export function getThemeCustomizations(whitelabelConfig: WhitelabelConfig): ThemeCustomizations {
	return ThemeController.mapOldToNewColorTokens(JSON.parse(whitelabelConfig.jsonTheme, (k, v) => (k === "__proto__" ? undefined : v)))
}
