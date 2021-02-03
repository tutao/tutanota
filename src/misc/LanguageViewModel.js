// @flow
import {assertMainOrNodeBoot} from "../api/common/Env"
import {downcast} from "../api/common/utils/Utils"
import {client} from "./ClientDetector"
import type {TranslationKeyType} from "./TranslationKey"

export type TranslationKey = TranslationKeyType

assertMainOrNodeBoot()

export type Language = {code: string, textId: TranslationKey}

export type DateTimeFormatOptions = {
	hourCycle?: string
}

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
	{code: 'en_gb', textId: 'languageEnglishUk_label'},
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
	{code: 'sl', textId: 'languageSlovenian_label'},
	{code: 'sr', textId: 'languageSerbian_label'},
	{code: 'sv', textId: 'languageSwedish_label'},
	{code: 'tr', textId: 'languageTurkish_label'},
	{code: 'uk', textId: 'languageUkrainian_label'},
	{code: 'vi', textId: 'languageVietnamese_label'},
	{code: 'zh', textId: 'languageChineseSimplified_label'},
	{code: 'zh_tw', textId: 'languageChineseTraditional_label'}
]

// FIXME: make flow less angry
const translationImportMap = {
	// $FlowFixMe[untyped-import]
	'ar': () => import("../translations/ar.js"),
	// $FlowFixMe[untyped-import]
	'bg': () => import("../translations/bg.js"),
	// $FlowFixMe[untyped-import]
	'ca': () => import("../translations/ca.js"),
	// $FlowFixMe[untyped-import]
	'cs': () => import("../translations/cs.js"),
	// $FlowFixMe[untyped-import]
	'da': () => import("../translations/da.js"),
	// $FlowFixMe[untyped-import]
	'de': () => import("../translations/de.js"),
	// $FlowFixMe[untyped-import]
	'de_sie': () => import("../translations/de_sie.js"),
	// $FlowFixMe[untyped-import]
	'el': () => import("../translations/el.js"),
	// $FlowFixMe[untyped-import]
	'en': () => import("../translations/en.js"),
	// $FlowFixMe[untyped-import]
	'es': () => import("../translations/es.js"),
	// $FlowFixMe[untyped-import]
	'et': () => import("../translations/et.js"),
	// $FlowFixMe[untyped-import]
	'fa_ir': () => import("../translations/fa_ir.js"),
	// $FlowFixMe[untyped-import]
	'fi': () => import("../translations/fi.js"),
	// $FlowFixMe[untyped-import]
	'fr': () => import("../translations/fr.js"),
	// $FlowFixMe[untyped-import]
	'gl': () => import("../translations/gl.js"),
	// $FlowFixMe[untyped-import]
	'hi': () => import("../translations/hi.js"),
	// $FlowFixMe[untyped-import]
	'hr': () => import("../translations/hr.js"),
	// $FlowFixMe[untyped-import]
	'hu': () => import("../translations/hu.js"),
	// $FlowFixMe[untyped-import]
	'id': () => import("../translations/id.js"),
	// $FlowFixMe[untyped-import]
	'it': () => import("../translations/it.js"),
	// $FlowFixMe[untyped-import]
	'ja': () => import("../translations/ja.js"),
	// $FlowFixMe[untyped-import]
	'lt': () => import("../translations/lt.js"),
	// $FlowFixMe[untyped-import]
	'lv': () => import("../translations/lv.js"),
	// $FlowFixMe[untyped-import]
	'nl': () => import("../translations/nl.js"),
	// $FlowFixMe[untyped-import]
	'no': () => import("../translations/no.js"),
	// $FlowFixMe[untyped-import]
	'pl': () => import("../translations/pl.js"),
	// $FlowFixMe[untyped-import]
	'pt_br': () => import("../translations/pt_br.js"),
	// $FlowFixMe[untyped-import]
	'pt_pt': () => import("../translations/pt_pt.js"),
	// $FlowFixMe[untyped-import]
	'ro': () => import("../translations/ro.js"),
	// $FlowFixMe[untyped-import]
	'ru': () => import("../translations/ru.js"),
	// $FlowFixMe[untyped-import]
	'sk': () => import("../translations/sk.js"),
	// $FlowFixMe[untyped-import]
	'sl': () => import("../translations/sl.js"),
	// $FlowFixMe[untyped-import]
	'sr': () => import("../translations/sr.js"),
	// $FlowFixMe[untyped-import]
	'sv': () => import("../translations/sv.js"),
	// $FlowFixMe[untyped-import]
	'tr': () => import("../translations/tr.js"),
	// $FlowFixMe[untyped-import]
	'uk': () => import("../translations/uk.js"),
	// $FlowFixMe[untyped-import]
	'vi': () => import("../translations/vi.js"),
	// $FlowFixMe[untyped-import]
	'zh': () => import("../translations/zh.js"),
	// $FlowFixMe[untyped-import]
	'zh_tw': () => import("../translations/zh_tw.js"),
}
export const languageByCode: {[string]: Language} = languages.reduce((acc, curr) => {
	acc[curr.code] = curr
	return acc
}, {})

const infoLinks = {
	"homePage_link": "https://tutanota.com",
	"about_link": "https://tutanota.com/imprint",
	//terms
	"terms_link": "https://tutanota.com/terms",
	"privacy_link": "https://tutanota.com/privacy",
	//howto
	"recoverCode_link": "https://tutanota.com/howto/#reset",
	"2FA_link": "https://tutanota.com/howto#2fa",
	"spamRules_link": "https://tutanota.com/howto#spam",
	"domainInfo_link": "https://tutanota.com/howto#custom-domain",
	"whitelabel_link": "https://tutanota.com/howto#whitelabel",
	"webview_link": "https://tutanota.com/de/howto/#webview",
	//faq
	"phishing_link": "https://tutanota.com/faq#phishing",
	"mailAuth_link": "https://tutanota.com/faq#mail-auth",
	"runInBackground_link": "https://tutanota.com/faq#tray",
	"giftCardsTerms_link": "https://tutanota.com/faq#gift-cards-terms",
	//blog
	"premiumProBusiness_link": "https://tutanota.com/blog/posts/premium-pro-business"
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
export class LanguageViewModel {
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
		dateWithWeekdayWoMonth: Intl.DateTimeFormat,
		dateWithWeekdayAndYear: Intl.DateTimeFormat,
		dateWithWeekdayAndTime: Intl.DateTimeFormat,
		weekdayShort: Intl.DateTimeFormat,
		weekdayNarrow: Intl.DateTimeFormat,
		time: Intl.DateTimeFormat,
		dateTime: Intl.DateTimeFormat,
		dateTimeShort: Intl.DateTimeFormat,
		priceWithCurrency: Intl.NumberFormat,
		priceWithCurrencyWithoutFractionDigits: Intl.NumberFormat,
		priceWithoutCurrency: Intl.NumberFormat,
		priceWithoutCurrencyWithoutFractionDigits: Intl.NumberFormat,
		monthLong: Intl.DateTimeFormat,
		monthWithYear: Intl.DateTimeFormat,
		monthWithFullYear: Intl.DateTimeFormat,
		yearNumeric: Intl.DateTimeFormat,
	};

	constructor() {
		this.translations = {}
		this.fallback = {}
		this.staticTranslations = {}
	}

	init(en: {}): Promise<void> {
		this.translations = en
		this.fallback = en // always load english as fallback
		this.code = 'en'

		const language = getLanguage()
		return this.setLanguage(language)
			// Service worker currently caches only English. We don't want the whole app to fail if we cannot fetch the language.
			       .catch((e) => {
				       console.warn("Could not set language", language, e)
				       this._setLanguageTag("en-US")
			       })
	}

	addStaticTranslation(key: string, text: string) {
		this.staticTranslations[key] = text
	}

	initWithTranslations(code: string, languageTag: string, fallBackTranslations: Object, translations: Object) {
		this.translations = translations
		this.fallback = fallBackTranslations
		this.code = code
	}


	setLanguage(lang: {code: string, languageTag: string}): Promise<void> {
		this._setLanguageTag(lang.languageTag)
		if (this.code === lang.code) {
			return Promise.resolve()
		}

		// we don't support multiple language files for en so just use the one and only.
		const code = lang.code.startsWith("en") ? "en" : lang.code

		return translationImportMap[code]()
			.then(translationsModule => {
				this.translations = translationsModule.default
				this.code = lang.code
			})
	}

	/**
	 * must be invoked at startup from LanguageViewModel to initialize all DateTimeFormats
	 * @param codes
	 */
	_setLanguageTag(tag: string) {
		this.languageTag = tag
		this.updateFormats({})
	}

	updateFormats(options: DateTimeFormatOptions) {
		const tag = this.languageTag
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
				dateWithWeekdayWoMonth: new Intl.DateTimeFormat(tag, {
					weekday: 'short',
					day: 'numeric',
				}),
				dateWithWeekdayAndYear: new Intl.DateTimeFormat(tag, {
					weekday: 'short',
					day: 'numeric',
					month: 'short',
					year: 'numeric'
				}),
				dateWithWeekdayAndTime: new Intl.DateTimeFormat(tag, Object.assign({}, {
					weekday: 'short',
					day: 'numeric',
					month: 'short',
					hour: 'numeric',
					minute: 'numeric'
				}, options)),
				time: new Intl.DateTimeFormat(tag, Object.assign({}, {hour: 'numeric', minute: 'numeric'}, options)),
				dateTime: new Intl.DateTimeFormat(tag, Object.assign({}, {
					day: 'numeric',
					month: 'short',
					year: 'numeric',
					hour: 'numeric',
					minute: 'numeric'
				}, options)),
				dateTimeShort: new Intl.DateTimeFormat(tag, Object.assign({}, {
					day: 'numeric',
					month: 'numeric',
					year: 'numeric',
					hour: 'numeric',
				}, options)),
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
				monthLong: new Intl.DateTimeFormat(tag, {
					month: 'long'
				}),
				monthWithYear: new Intl.DateTimeFormat(tag, {
					month: 'long',
					year: '2-digit'
				}),
				monthWithFullYear: new Intl.DateTimeFormat(tag, {
					month: 'long',
					year: 'numeric'
				}),
				yearNumeric: new Intl.DateTimeFormat(tag, {
					year: 'numeric'
				}),
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

	getInfoLink(id: string): string {
		return infoLinks[id]
	}

}

/**
 * Gets the default language derived from the browser language.
 * @param restrictions An array of language codes the selection should be restricted to
 */
export function getLanguageNoDefault(restrictions: ?string[]): ?{code: string, languageTag: string} {
	// navigator.languages can be an empty array on android 5.x devices
	let languageTags
	if (typeof navigator !== 'undefined') {
		languageTags = (navigator.languages && navigator.languages.length > 0) ? navigator.languages : [navigator.language]
	} else if (typeof process !== 'undefined' && typeof process.env !== 'undefined') {
		const locale = process.env.LC_ALL || process.env.LC_MESSAGES || process.env.LANG || process.env.LANGUAGE || process.env.LC_NAME
		if (locale) {
			languageTags = [locale.split(".")[0].replace("_", "-")]
		}
	}
	if (languageTags) {
		for (let tag of languageTags) {
			let code = _getSubstitutedLanguageCode(tag, restrictions)
			if (code) {
				return {code: code, languageTag: tag}
			}
		}
	}
	return null
}

/**
 * Gets the default language derived from the browser language.
 * @param restrictions An array of language codes the selection should be restricted to
 */
export function getLanguage(restrictions: ?string[]): {code: string, languageTag: string} {
	const language = getLanguageNoDefault(restrictions)
	if (language) return language

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
			language = languages
				.find(l => getBasePart(l.code) === basePart && (restrictions == null || restrictions.indexOf(l.code) !== -1))
		}
	}
	if (language) {
		if (language.code === 'de' && typeof whitelabelCustomizations === "object" && whitelabelCustomizations
			&& whitelabelCustomizations.germanLanguageCode) {
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

/**
 * pt_br -> pt-BR
 * @param code
 */
export function languageCodeToTag(code: string): string {
	if (code === "de_sie") {
		return "de"
	}
	const indexOfUnderscore = code.indexOf("_")
	if (indexOfUnderscore === -1) {
		return code
	} else {
		const [before, after] = code.split("_")
		return `${before}-${after.toUpperCase()}`
	}
}


export const assertTranslation: (id: string) => TranslationKey = downcast

export type LanguageViewModelType = LanguageViewModel
export const lang: LanguageViewModel = new LanguageViewModel()
