import { BaseThemeId, Theme } from "../gui/theme"
import { assertMainOrNodeBoot } from "../api/common/Env"
import type { WhitelabelConfig } from "../api/entities/sys/TypeRefs.js"
import { mapNullable } from "@tutao/tutanota-utils"

assertMainOrNodeBoot()

export const WHITELABEL_CUSTOMIZATION_VERSION = "1"

/** ThemeCustomizations that might be old or new. */
export type UnknownThemeCustomizations = Record<string, unknown>
export type ThemeCustomizations = Partial<Theme> & {
	version: NumberString | null
	base: BaseThemeId | null
	sourceColor: string | null
}

export type ThemeKey = keyof Theme
export type CustomizationKey = keyof ThemeCustomizations

export type WhitelabelCustomizations = {
	theme: UnknownThemeCustomizations | null
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

export function getThemeCustomizations(whitelabelConfig: WhitelabelConfig): UnknownThemeCustomizations {
	return JSON.parse(whitelabelConfig.jsonTheme, (k, v) => (k === "__proto__" ? undefined : v))
}
export function getWhitelabelRegistrationDomains(): string[] {
	return mapNullable(getWhitelabelCustomizations(window), (c) => c.registrationDomains) || []
}
