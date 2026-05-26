import { assertMainOrNodeBoot } from "../../platform-kits/app-env"
import { mapNullable } from "../../platform-kits/utils"
import { UnknownThemeCustomizations, WhitelabelCustomizations } from "../WhitelabelCustomizations"

assertMainOrNodeBoot()

/**
 * window.whitelabelCustomizations is defined when the user has logged in via a whitelabel domain. index.js is rewritten to have the definition
 * this happens at WhitelabelResourceRewriter.java
 */
export function getWhitelabelCustomizations(window: Window): WhitelabelCustomizations | null {
	// @ts-ignore
	return window.whitelabelCustomizations
}

type WhitelabelConfigTheme = {
	jsonTheme: string
}
export function getThemeCustomizations(whitelabelConfig: WhitelabelConfigTheme): UnknownThemeCustomizations {
	return JSON.parse(whitelabelConfig.jsonTheme, (k, v) => (k === "__proto__" ? undefined : v))
}
export function getWhitelabelRegistrationDomains(): string[] {
	return mapNullable(getWhitelabelCustomizations(window), (c) => c.registrationDomains) || []
}
