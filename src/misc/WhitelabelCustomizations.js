// @flow
import type {BaseThemeId, Theme} from "../gui/theme"
import type {BootstrapFeatureTypeEnum} from "../api/common/TutanotaConstants"
import {assertMainOrNodeBoot} from "../api/common/Env"

assertMainOrNodeBoot()

export type ThemeCustomizations = $Shape<Theme> & { base: ?BaseThemeId, }

export type WhitelabelCustomizations = {
	theme: ?ThemeCustomizations,
	bootstrapCustomizations: BootstrapFeatureTypeEnum[],
	germanLanguageCode: string,
	registrationDomains: ?string[],
	imprintUrl: ?string,
	privacyStatementUrl: ?string,
}

/**
 * window.whitelabelCustomizations is defined when the user has logged in via a whitelabel domain. index.js is rewritten to have the definition
 * this happens at WhitelabelResourceRewriter.java
 */
export function getWhitelabelCustomizations(window: typeof window): ?WhitelabelCustomizations {
	return window.whitelabelCustomizations
}

