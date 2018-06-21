// @flow
import {startsWith} from "../api/common/utils/StringUtils"
import {assertMainOrNodeBoot} from "../api/Env"
import {asyncImport} from "../api/common/utils/Utils"
import {client} from "./ClientDetector"

assertMainOrNodeBoot()

export type Language = {code: string, textId: string}

export const languages: Language[] = [
	{code: 'sq', textId: 'languageAlbanian_label'},
	{code: 'hr', textId: 'languageCroatian_label'},
	{code: 'zh_hant', textId: 'languageChineseTraditional_label'},
	{code: 'en', textId: 'languageEnglish_label'},
	{code: 'nl', textId: 'languageDutch_label'},
	{code: 'de', textId: 'languageGerman_label'},
	{code: 'de_sie', textId: 'languageGermanSie_label'},
	// { code: 'ar, textId: 'languageArabic_label' },
	{code: 'el', textId: 'languageGreek_label'},
	{code: 'fr', textId: 'languageFrench_label'},
	{code: 'it', textId: 'languageItalian_label'},
	{code: 'pl', textId: 'languagePolish_label'},
	{code: 'pt_pt', textId: 'languagePortugesePortugal_label'},
	{code: 'pt_br', textId: 'languagePortugeseBrazil_label'},
	{code: 'ro', textId: 'languageRomanian_label'},
	{code: 'ru', textId: 'languageRussian_label'},
	{code: 'es', textId: 'languageSpanish_label'},
	{code: 'tr', textId: 'languageTurkish_label'},
	{code: 'fi', textId: 'languageFinnish_label'},
	{code: 'lt_lt', textId: 'languageLithuanian_label'},
	{code: 'mk', textId: 'languageMacedonian_label'},
	{code: 'sr', textId: 'languageSerbian_label'},
	{code: 'bg_bg', textId: 'languageBulgarian_label'},
	{code: 'cs_cz', textId: 'languageCzech_label'},
	{code: 'da_dk', textId: 'languageDanish_label'},
	{code: 'et_ee', textId: 'languageEstonian_label'},
	{code: 'fil_ph', textId: 'languageFilipino_label'},
	{code: 'hu', textId: 'languageHungarian_label'},
	{code: 'id', textId: 'languageIndonesian_label'},
	{code: 'no', textId: 'languageNorwegian_label'},
	{code: 'sk_sk', textId: 'languageSlovak_label'},
	{code: 'sv', textId: 'languageSwedish_label'},
	{code: 'ta_in', textId: 'languageTamil_label'},
	{code: 'uk_ua', textId: 'languageUkrainian_label'},
	{code: 'vi', textId: 'languageVietnamese_label'},
	{code: 'ca_es', textId: 'languageCatalan_label'},
	{code: 'gl', textId: 'languageGalician_label'},
	{code: 'hi_in', textId: 'languageHindi_label'},
	{code: 'id', textId: 'languageIndonesian_label'},
	{code: 'ms', textId: 'languageMalay_label'},
	{code: 'sw', textId: 'languageSwahili_label'},
	{code: 'zh_tw', textId: 'languageChineseSimplified_label'}

]

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
		simpleDate: DateTimeFormat,
		dateWithMonth: DateTimeFormat,
		dateWithoutYear:DateTimeFormat,
		simpleDateWithoutYear:DateTimeFormat,
		dateWithWeekday: DateTimeFormat,
		dateWithWeekdayAndYear: DateTimeFormat,
		time: DateTimeFormat,
		dateTime: DateTimeFormat,
		priceWithCurrency: NumberFormat,
		priceWithCurrencyWithoutFractionDigits: NumberFormat,
		priceWithoutCurrency: NumberFormat,
		priceWithoutCurrencyWithoutFractionDigits:NumberFormat
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

		return this.setLanguage(this.getLanguage())
	}

	addStaticTranslation(key: string, text: string) {
		this.staticTranslations[key] = text
	}

	setLanguage(lang: {code: string, languageTag: string}): Promise<void> {
		this._setLanguageTag(lang.languageTag)
		if (this.code == lang.code) {
			return Promise.resolve()
		}
		return asyncImport(typeof module != "undefined" ? module.id : __moduleName, `${env.rootPathPrefix}src/translations/${lang.code}.js`).then(translations => {
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
				simpleDate: new (Intl.DateTimeFormat:any)(tag, {day: 'numeric', month: 'numeric', year: 'numeric'}),
				dateWithMonth: new (Intl.DateTimeFormat:any)(tag, {
					day: 'numeric',
					month: 'short',
					year: 'numeric'
				}),
				dateWithoutYear: new (Intl.DateTimeFormat:any)(tag, {day: 'numeric', month: 'short'}),
				simpleDateWithoutYear: new (Intl.DateTimeFormat:any)(tag, {
					day: 'numeric', month: 'numeric'
				}),
				dateWithWeekday: new (Intl.DateTimeFormat:any)(tag, {weekday: 'short', day: 'numeric', month: 'short'}),
				dateWithWeekdayAndYear: new (Intl.DateTimeFormat:any)(tag, {
					weekday: 'short',
					day: 'numeric',
					month: 'short',
					year: 'numeric'
				}),
				time: new (Intl.DateTimeFormat:any)(tag, {hour: 'numeric', minute: 'numeric'}),
				dateTime: new (Intl.DateTimeFormat:any)(tag, {
					day: 'numeric',
					month: 'short',
					year: 'numeric',
					hour: 'numeric',
					minute: 'numeric'
				}),
				priceWithCurrency: new (Intl.NumberFormat:any)(tag, {
					style: 'currency',
					currency: 'EUR',
					minimumFractionDigits: 2
				}),
				priceWithCurrencyWithoutFractionDigits: new (Intl.NumberFormat:any)(tag, {
					style: 'currency',
					currency: 'EUR',
					maximiumFractionDigits: 0,
					minimumFractionDigits: 0
				}),
				priceWithoutCurrency: new (Intl.NumberFormat:any)(tag, {
					style: 'decimal',
					minimumFractionDigits: 2
				}),
				priceWithoutCurrencyWithoutFractionDigits: new (Intl.NumberFormat:any)(tag, {
					style: 'decimal',
					maximiumFractionDigits: 0,
					minimumFractionDigits: 0
				})
			}
		}
	}

	get(id: string, params: ?Object): string {
		if (id == null) {
			return ""
		}
		if (id == "emptyString_msg") {
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


	/**
	 * Gets the default language derived from the browser language.
	 * @param restrictions An array of language codes the selection should be restricted to
	 */
	getLanguage(restrictions: ?string[]): {code: string, languageTag: string} {
		// navigator.languages can be an empty array on android 5.x devices
		let languageTags
		if (typeof navigator != 'undefined') {
			languageTags = (navigator.languages && navigator.languages.length > 0) ? navigator.languages : [navigator.language]
		}
		if (languageTags) {
			for (let tag of languageTags) {
				let code = tag.toLowerCase().replace("-", "_")
				let language = languages.find(l => l.code == code && (restrictions == null || restrictions.indexOf(l.code) != -1))
				if (language == null) {
					language = languages.find(l => startsWith(l.code, code.substring(0, 2)) && (restrictions == null || restrictions.indexOf(l.code) != -1))
				}
				if (language) {
					if (language.code == 'de' && whitelabelCustomizations && whitelabelCustomizations.germanLanguageCode) {
						return {code: whitelabelCustomizations.germanLanguageCode, languageTag: tag}
					} else {
						return {code: language.code, languageTag: tag}
					}
				}
			}
		}
		if (restrictions == null || restrictions.indexOf("en") != -1) {
			return {code: 'en', languageTag: 'en-US'}
		} else {
			return {code: restrictions[0], languageTag: restrictions[0].replace("/_/g", "-")}
		}
	}

}

export const lang: LanguageViewModel = new LanguageViewModel()