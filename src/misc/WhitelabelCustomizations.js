// @flow
import type {Theme} from "../gui/theme"
import type {BootstrapFeatureTypeEnum} from "../api/common/TutanotaConstants"

export type WhitelabelCustomizations = {
	theme: ?Theme,
	bootstrapCustomizations: BootstrapFeatureTypeEnum[],
	germanLanguageCode: string,
	registrationDomains: ?string[],
	imprintUrl: ?string,
	privacyStatementUrl: ?string,
}

export function getWhitelabelCustomizations(window: typeof window): ?WhitelabelCustomizations {
	return window.whitelabelCustomizations
}

