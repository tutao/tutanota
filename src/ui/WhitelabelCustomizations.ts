import { BaseThemeId, Theme } from "./theme"
import { assertMainOrNodeBoot } from "../platform-kit/app-env"

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
