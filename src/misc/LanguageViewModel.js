// @flow
import {assertMainOrNodeBoot} from "../api/Env"
import {asyncImport, downcast} from "../api/common/utils/Utils"
import {client} from "./ClientDetector"
import typeof en from "../translations/en"
import type {TranslationKeyType} from "./TranslationKey"

export type TranslationKey = TranslationKeyType

assertMainOrNodeBoot()

export type Language = {code: string, textId: TranslationKey}

export const languages: Language[] = [
	{code: 'ar', textId: 'languageArabic_label'},
	{code: 'bg', textId: 'languageBulgarian_label'},
	{code: 'ca', textId: 'languageCatalan_label'},
	{code: 'cs', textId: 'languageCzech_label'},
	{code: 'da', textId: 'languageDanish_label'},
	{code: 'de', textId: 'languageGerman_label'},
	{code: 'de_sie', textId: 'languageGermanSie_label'},
	{code: 'el', textId: 'languageGreek_label'},
	{code: 'en', textId: 'languageEnglish_label'},
	{code: 'es', textId: 'languageSpanish_label'},
	{code: 'et', textId: 'languageEstonian_label'},
	{code: 'fa_ir', textId: 'languagePersian_label'},
	{code: 'fi', textId: 'languageFinnish_label'},
	{code: 'fr', textId: 'languageFrench_label'},
	{code: 'gl', textId: 'languageGalician_label'},
	{code: 'hi', textId: 'languageHindi_label'},
	{code: 'hr', textId: 'languageCroatian_label'},
	{code: 'hu', textId: 'languageHungarian_label'},
	{code: 'id', textId: 'languageIndonesian_label'},
	{code: 'it', textId: 'languageItalian_label'},
	{code: 'ja', textId: 'languageJapanese_label'},
	{code: 'lt', textId: 'languageLithuanian_label'},
	{code: 'lv', textId: 'languageLatvian_label'},
	{code: 'nl', textId: 'languageDutch_label'},
	{code: 'no', textId: 'languageNorwegian_label'},
	{code: 'pl', textId: 'languagePolish_label'},
	{code: 'pt_br', textId: 'languagePortugeseBrazil_label'},
	{code: 'pt_pt', textId: 'languagePortugesePortugal_label'},
	{code: 'ro', textId: 'languageRomanian_label'},
	{code: 'ru', textId: 'languageRussian_label'},
	{code: 'sk', textId: 'languageSlovak_label'},
	{code: 'sr', textId: 'languageSerbian_label'},
	{code: 'sv', textId: 'languageSwedish_label'},
	{code: 'tr', textId: 'languageTurkish_label'},
	{code: 'uk', textId: 'languageUkrainian_label'},
	{code: 'vi', textId: 'languageVietnamese_label'},
	{code: 'zh', textId: 'languageChineseSimplified_label'},
	{code: 'zh_tw', textId: 'languageChineseTraditional_label'}
]
export const languageByCode = languages.reduce((acc, curr) => {
	acc[curr.code] = curr
	return acc
}, {})

const infoLinks = {
	"recoverCode_link": {
		"de": "https://tutanota.com/de/howto/#reset",
		"en": "https://tutanota.com/howto/#reset"
	},
	"2FA_link": {
		"de": "https://tutanota.com/de/howto#2fa",
		"en": "https://tutanota.com/howto#2fa"
	},
	"spamRules_link": {
		"de": "https://tutanota.com/de/howto#spam",
		"en": "https://tutanota.com/howto#spam"
	},
	"domainInfo_link": {
		"de": "https://tutanota.com/de/howto/#custom-domain",
		"en": "https://tutanota.com/howto#custom-domain"
	},
	"whitelabel_link": {
		"de": "https://tutanota.com/de/howto#whitelabel",
		"en": "https://tutanota.com/howto#whitelabel"
	},
	"webview_link": {
		"de": "https://tutanota.com/howto/#webview",
		"en": "https://tutanota.com/de/howto/#webview"
	}
}

/**
 * Provides all localizations of strings on our gui.
 *
 * The translations are defined on JSON files. See the folder 'translations' for examples.
 * The actual identifier is camel case and the type is appended by an underscore.
 * Types: label, action, msg, title, alt, placeholder
 *
 * @constructor
 */
class LanguageViewModel {
	translations: Object;
	fallback: Object;
	code: string;
	languageTag: string;
	staticTranslations: Object;
	formats: {
		simpleDate: Intl.DateTimeFormat,
		dateWithMonth: Intl.DateTimeFormat,
		dateWithoutYear: Intl.DateTimeFormat,
		simpleDateWithoutYear: Intl.DateTimeFormat,
		dateWithWeekday: Intl.DateTimeFormat,
		dateWithWeekdayAndYear: Intl.DateTimeFormat,
		weekdayShort: Intl.DateTimeFormat,
		weekdayNarrow: Intl.DateTimeFormat,
		time: Intl.DateTimeFormat,
		dateTime: Intl.DateTimeFormat,
		dateTimeShort: Intl.DateTimeFormat,
		priceWithCurrency: Intl.NumberFormat,
		priceWithCurrencyWithoutFractionDigits: Intl.NumberFormat,
		priceWithoutCurrency: Intl.NumberFormat,
		priceWithoutCurrencyWithoutFractionDigits: Intl.NumberFormat,
		monthWithYear: Intl.DateTimeFormat
	};

	constructor() {
		this.translations = {}
		this.fallback = {}
		this.staticTranslations = {}
	}

	init(en): Promise<void> {
		this.translations = en
		this.fallback = en // always load english as fallback
		this.code = 'en'

		return this.setLanguage(getLanguage())
	}

	addStaticTranslation(key: string, text: string) {
		this.staticTranslations[key] = text
	}

	setLanguage(lang: {code: string, languageTag: string}): Promise<void> {
		this._setLanguageTag(lang.languageTag)
		if (this.code === lang.code) {
			return Promise.resolve()
		}
		return asyncImport(typeof module
		!== "undefined" ? module.id : __moduleName, `${env.rootPathPrefix}src/translations/${lang.code}.js`)
			.then(translations => {
				this.translations = translations
				this.code = lang.code
			})
	}

	/**
	 * must be invoked at startup from LanguageViewModel to initialize all DateTimeFormats
	 * @param codes
	 */
	_setLanguageTag(tag: string) {
		this.languageTag = tag
		if (client.dateFormat()) {
			this.formats = {
				simpleDate: new Intl.DateTimeFormat(tag, {day: 'numeric', month: 'numeric', year: 'numeric'}),
				dateWithMonth: new Intl.DateTimeFormat(tag, {
					day: 'numeric',
					month: 'short',
					year: 'numeric'
				}),
				dateWithoutYear: Intl.DateTimeFormat(tag, {day: 'numeric', month: 'short'}),
				simpleDateWithoutYear: Intl.DateTimeFormat(tag, {
					day: 'numeric', month: 'numeric'
				}),
				dateWithWeekday: new Intl.DateTimeFormat(tag, {
					weekday: 'short',
					day: 'numeric',
					month: 'short'
				}),
				dateWithWeekdayAndYear: new Intl.DateTimeFormat(tag, {
					weekday: 'short',
					day: 'numeric',
					month: 'short',
					year: 'numeric'
				}),
				time: new Intl.DateTimeFormat(tag, {hour: 'numeric', minute: 'numeric'}),
				dateTime: new Intl.DateTimeFormat(tag, {
					day: 'numeric',
					month: 'short',
					year: 'numeric',
					hour: 'numeric',
					minute: 'numeric'
				}),
				dateTimeShort: new Intl.DateTimeFormat(tag, {
					day: 'numeric',
					month: 'numeric',
					year: 'numeric',
					hour: 'numeric',
				}),
				weekdayShort: new Intl.DateTimeFormat(tag, {
					weekday: 'short'
				}),
				weekdayNarrow: new Intl.DateTimeFormat(tag, {
					weekday: 'narrow'
				}),
				priceWithCurrency: new Intl.NumberFormat(tag, {
					style: 'currency',
					currency: 'EUR',
					minimumFractionDigits: 2
				}),
				priceWithCurrencyWithoutFractionDigits: new Intl.NumberFormat(tag, {
					style: 'currency',
					currency: 'EUR',
					maximiumFractionDigits: 0,
					minimumFractionDigits: 0
				}),
				priceWithoutCurrency: new Intl.NumberFormat(tag, {
					style: 'decimal',
					minimumFractionDigits: 2
				}),
				priceWithoutCurrencyWithoutFractionDigits: new Intl.NumberFormat(tag, {
					style: 'decimal',
					maximiumFractionDigits: 0,
					minimumFractionDigits: 0
				}),
				monthWithYear: new Intl.DateTimeFormat(tag, {
					month: 'long',
					year: '2-digit'
				})
			}
		}
	}

	exists(id: TranslationKey): boolean {
		try {
			this.get(id)
			return true
		} catch (e) {
			return false
		}
	}

	/**
	 * @throws An error if there is no translation for the given id.
	 */
	get(id: TranslationKey, params: ?Object): string {
		if (id == null) {
			return ""
		}
		if (id === "emptyString_msg") {
			return "\u2008"
		}
		var text = this.translations.keys[id]
		if (!text) {
			// try fallback language
			text = this.fallback.keys[id]
			if (!text) {
				// try static definitions
				text = this.staticTranslations[id]
				if (!text) {
					throw new Error("no translation found for id " + id)
				}
			}
		}
		if (params instanceof Object) {
			for (var param in params) {
				text = text.replace(param, params[param])
			}
		}
		return text
	}

	getMaybeLazy(value: TranslationKey | lazy<string>): string {
		return typeof value === "function" ? value() : lang.get(value)
	}

	getInfoLink(id: string) {
		const code = ["de", "de_sie"].includes(this.code)
			? "de"
			: "en"
		return infoLinks[id][code]
	}

}

/**
 * Gets the default language derived from the browser language.
 * @param restrictions An array of language codes the selection should be restricted to
 */
export function getLanguage(restrictions: ?string[]): {code: string, languageTag: string} {
	// navigator.languages can be an empty array on android 5.x devices
	let languageTags
	if (typeof navigator !== 'undefined') {
		languageTags = (navigator.languages && navigator.languages.length
			> 0) ? navigator.languages : [navigator.language]
	}
	if (languageTags) {
		for (let tag of languageTags) {
			let code = _getSubstitutedLanguageCode(tag, restrictions)
			if (code) {
				return {code: code, languageTag: tag}
			}
		}
	}
	if (restrictions == null || restrictions.indexOf("en") !== -1) {
		return {code: 'en', languageTag: 'en-US'}
	} else {
		return {code: restrictions[0], languageTag: restrictions[0].replace("/_/g", "-")}
	}
}

export function _getSubstitutedLanguageCode(tag: string, restrictions: ?string[]): ?string {
	let code = tag.toLowerCase().replace("-", "_")
	let language = languages.find(l => l.code === code && (restrictions == null
		|| restrictions.indexOf(l.code) !== -1))
	if (language == null) {
		if (code === 'zh_hk') {
			language = languages.find(l => l.code === 'zh_tw')
		} else {
			let basePart = getBasePart(code)
			language = languages.find(l => getBasePart(l.code) === basePart && (restrictions == null || restrictions.indexOf(l.code) !== -1))
		}
	}
	if (language) {
		if (language.code === 'de' && typeof whitelabelCustomizations === "object" && whitelabelCustomizations && whitelabelCustomizations.germanLanguageCode) {
			return whitelabelCustomizations.germanLanguageCode
		} else {
			return language.code
		}
	} else {
		return null
	}
}

function getBasePart(code: string): string {
	const indexOfUnderscore = code.indexOf("_")
	if (indexOfUnderscore > 0) {
		return code.substring(0, indexOfUnderscore)
	} else {
		return code
	}
}

export function getAvailableLanguageCode(code: string): string {
	return _getSubstitutedLanguageCode(code, null) || "en"
}


export const assertTranslation: (id: string) => TranslationKey = downcast

export const lang: LanguageViewModel = new LanguageViewModel()
