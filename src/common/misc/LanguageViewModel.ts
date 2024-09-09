import type { lazy } from "@tutao/tutanota-utils"
import { downcast, typedEntries } from "@tutao/tutanota-utils"
import type { TranslationKeyType } from "./TranslationKey"
import { getWhitelabelCustomizations, WhitelabelCustomizations } from "./WhitelabelCustomizations"
import { assertMainOrNodeBoot } from "../api/common/Env"

export type TranslationKey = TranslationKeyType
export type TranslationText = TranslationKey | lazy<string>
assertMainOrNodeBoot()
export type DateTimeFormatOptions = {
	hourCycle?: "h11" | "h12" | "h23" | "h24"
}
const translationImportMap: Record<LanguageCode, () => Promise<any>> = {
	ar: () => import("../../mail-app/translations/ar.js"),
	be: () => import("../../mail-app/translations/be.js"),
	bg: () => import("../../mail-app/translations/bg.js"),
	ca: () => import("../../mail-app/translations/ca.js"),
	cs: () => import("../../mail-app/translations/cs.js"),
	da: () => import("../../mail-app/translations/da.js"),
	de: () => import("../../mail-app/translations/de.js"),
	de_sie: () => import("../../mail-app/translations/de_sie.js"),
	el: () => import("../../mail-app/translations/el.js"),
	en: () => import("../../mail-app/translations/en.js"),
	en_gb: () => import("../../mail-app/translations/en.js"),
	es: () => import("../../mail-app/translations/es.js"),
	et: () => import("../../mail-app/translations/et.js"),
	fa_ir: () => import("../../mail-app/translations/fa_ir.js"),
	fi: () => import("../../mail-app/translations/fi.js"),
	fr: () => import("../../mail-app/translations/fr.js"),
	gl: () => import("../../mail-app/translations/gl.js"),
	he: () => import("../../mail-app/translations/he.js"),
	hi: () => import("../../mail-app/translations/hi.js"),
	hr: () => import("../../mail-app/translations/hr.js"),
	hu: () => import("../../mail-app/translations/hu.js"),
	id: () => import("../../mail-app/translations/id.js"),
	it: () => import("../../mail-app/translations/it.js"),
	ja: () => import("../../mail-app/translations/ja.js"),
	ko: () => import("../../mail-app/translations/ko.js"),
	lt: () => import("../../mail-app/translations/lt.js"),
	lv: () => import("../../mail-app/translations/lv.js"),
	nl: () => import("../../mail-app/translations/nl.js"),
	no: () => import("../../mail-app/translations/no.js"),
	pl: () => import("../../mail-app/translations/pl.js"),
	pt_br: () => import("../../mail-app/translations/pt_br.js"),
	pt_pt: () => import("../../mail-app/translations/pt_pt.js"),
	ro: () => import("../../mail-app/translations/ro.js"),
	ru: () => import("../../mail-app/translations/ru.js"),
	si: () => import("../../mail-app/translations/si.js"),
	sk: () => import("../../mail-app/translations/sk.js"),
	sl: () => import("../../mail-app/translations/sl.js"),
	sr_cyrl: () => import("../../mail-app/translations/sr_cyrl.js"),
	sv: () => import("../../mail-app/translations/sv.js"),
	tr: () => import("../../mail-app/translations/tr.js"),
	uk: () => import("../../mail-app/translations/uk.js"),
	vi: () => import("../../mail-app/translations/vi.js"),
	zh: () => import("../../mail-app/translations/zh.js"),
	zh_hant: () => import("../../mail-app/translations/zh_hant.js"),
}

/**
 * Language = {code, textId}
 * "code" is the 2 letter abbr. of the language ("en", "ar")
 * "textId" corresponds to a code ("languageEnglish_label", "languageArabic_label")
 *
 * lang.get(textId) will return the translated languages
 * languageByCode[code] will return the whole language Object
 * in all cases lang.get(languageByCode[code].textId) will always return the translated language from a code
 */
export const LanguageNames: Record<string, TranslationKey> = Object.freeze({
	ar: "languageArabic_label",
	be: "languageBelarusian_label",
	bg: "languageBulgarian_label",
	ca: "languageCatalan_label",
	cs: "languageCzech_label",
	da: "languageDanish_label",
	de: "languageGerman_label",
	de_sie: "languageGermanSie_label",
	el: "languageGreek_label",
	en: "languageEnglish_label",
	en_gb: "languageEnglishUk_label",
	es: "languageSpanish_label",
	et: "languageEstonian_label",
	fa_ir: "languagePersian_label",
	fi: "languageFinnish_label",
	fr: "languageFrench_label",
	gl: "languageGalician_label",
	he: "languageHebrew_label",
	hi: "languageHindi_label",
	hr: "languageCroatian_label",
	hu: "languageHungarian_label",
	id: "languageIndonesian_label",
	it: "languageItalian_label",
	ja: "languageJapanese_label",
	ko: "languageKorean_label",
	lt: "languageLithuanian_label",
	lv: "languageLatvian_label",
	nl: "languageDutch_label",
	no: "languageNorwegian_label",
	pl: "languagePolish_label",
	pt_br: "languagePortugeseBrazil_label",
	pt_pt: "languagePortugesePortugal_label",
	ro: "languageRomanian_label",
	ru: "languageRussian_label",
	si: "languageSinhalese_label",
	sk: "languageSlovak_label",
	sl: "languageSlovenian_label",
	sr_cyrl: "languageSerbian_label",
	sv: "languageSwedish_label",
	tr: "languageTurkish_label",
	uk: "languageUkrainian_label",
	vi: "languageVietnamese_label",
	zh: "languageChineseSimplified_label",
	zh_hant: "languageChineseTraditional_label",
} as const)
export type LanguageCode = keyof typeof LanguageNames
export type Language = {
	code: LanguageCode
	textId: TranslationKey
}
export const languageByCode = {} as Record<LanguageCode, Language>

// cannot import typedEntries here for some reason
for (let [code, textId] of downcast(Object.entries(LanguageNames))) {
	languageByCode[code] = {
		code,
		textId,
	}
}

export const languages: ReadonlyArray<{
	code: LanguageCode
	textId: TranslationKey
}> = typedEntries(LanguageNames).map(([code, textId]) => {
	return {
		code,
		textId,
	}
})

export const enum InfoLink {
	HomePage = "https://tuta.com",
	About = "https://tuta.com/imprint",
	//terms
	Terms = "https://tuta.com/terms",
	Privacy = "https://tuta.com/privacy-policy",
	GiftCardsTerms = "https://tuta.com/giftCardsTerms",
	//faq
	RecoverCode = "https://tuta.com/faq#reset",
	SecondFactor = "https://tuta.com/faq#2fa",
	SpamRules = "https://tuta.com/faq#spam",
	DomainInfo = "https://tuta.com/faq#custom-domain",
	Whitelabel = "https://tuta.com/faq#whitelabel",
	ReferralLink = "https://tuta.com/faq#refer-a-friend",
	Webview = "https://tuta.com/faq#webview",
	Phishing = "https://tuta.com/faq#phishing",
	MailAuth = "https://tuta.com/faq#mail-auth",
	RunInBackground = "https://tuta.com/faq#tray-desktop",
	LoadImages = "https://tuta.com/faq#load-images",
	Usage = "https://tuta.com/faq#usage",
	Download = "https://tuta.com/#download",
	SharedMailboxes = "https://tuta.com/support/#shared-mailboxes",
	InactiveAccounts = "https://tuta.com/faq/#inactive-accounts",
	AppStorePaymentChange = "https://tuta.com/support/#appstore-payment-change",
	AppStorePayment = "https://tuta.com/support/#appstore-payments",
	AppStoreDowngrade = "https://tuta.com/support/#appstore-subscription-downgrade",
	PasswordGenerator = "https://tuta.com/faq#passphrase-generator",
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
	translations: Record<string, any>
	fallback: Record<string, any>
	code!: LanguageCode
	languageTag!: string
	staticTranslations: Record<string, any>
	formats!: {
		simpleDate: Intl.DateTimeFormat
		dateWithMonth: Intl.DateTimeFormat
		dateWithoutYear: Intl.DateTimeFormat
		simpleDateWithoutYear: Intl.DateTimeFormat
		dateWithWeekday: Intl.DateTimeFormat
		dateWithWeekdayWoMonth: Intl.DateTimeFormat
		dateWithWeekdayAndYear: Intl.DateTimeFormat
		dateWithWeekdayAndYearLong: Intl.DateTimeFormat
		dateWithWeekdayAndTime: Intl.DateTimeFormat
		weekdayShort: Intl.DateTimeFormat
		weekdayNarrow: Intl.DateTimeFormat
		time: Intl.DateTimeFormat
		shortTime: Intl.DateTimeFormat
		dateTime: Intl.DateTimeFormat
		dateTimeShort: Intl.DateTimeFormat
		priceWithCurrency: Intl.NumberFormat
		priceWithCurrencyWithoutFractionDigits: Intl.NumberFormat
		priceWithoutCurrency: Intl.NumberFormat
		priceWithoutCurrencyWithoutFractionDigits: Intl.NumberFormat
		monthLong: Intl.DateTimeFormat
		monthShort: Intl.DateTimeFormat
		monthShortWithFullYear: Intl.DateTimeFormat
		monthWithYear: Intl.DateTimeFormat
		monthWithFullYear: Intl.DateTimeFormat
		yearNumeric: Intl.DateTimeFormat
		shortMonthYear2Digit: Intl.DateTimeFormat
	}

	constructor() {
		this.translations = {}
		this.fallback = {}
		this.staticTranslations = {}
	}

	init(en: {}): Promise<void> {
		this.translations = en
		this.fallback = en // always load english as fallback

		this.code = "en"
		const language = getLanguage()
		return this.setLanguage(language) // Service worker currently caches only English. We don't want the whole app to fail if we cannot fetch the language.
			.catch((e) => {
				console.warn("Could not set language", language, e)

				this._setLanguageTag("en-US")
			})
	}

	addStaticTranslation(key: string, text: string) {
		this.staticTranslations[key] = text
	}

	initWithTranslations(code: LanguageCode, languageTag: string, fallBackTranslations: Record<string, any>, translations: Record<string, any>) {
		this.translations = translations
		this.fallback = fallBackTranslations
		this.code = code
	}

	setLanguage(lang: { code: LanguageCode; languageTag: string }): Promise<void> {
		this._setLanguageTag(lang.languageTag)

		if (this.code === lang.code) {
			return Promise.resolve()
		}

		// we don't support multiple language files for en so just use the one and only.
		const code: LanguageCode = lang.code.startsWith("en") ? "en" : lang.code
		return translationImportMap[code]().then((translationsModule) => {
			this.translations = translationsModule.default
			this.code = lang.code
		})
	}

	/**
	 * must be invoked at startup from LanguageViewModel to initialize all DateTimeFormats
	 * @param tag
	 */
	_setLanguageTag(tag: string) {
		this.languageTag = tag
		this.updateFormats({})
	}

	updateFormats(options: DateTimeFormatOptions) {
		const tag = this.languageTag
		this.formats = {
			simpleDate: new Intl.DateTimeFormat(tag, {
				day: "numeric",
				month: "numeric",
				year: "numeric",
			}),
			dateWithMonth: new Intl.DateTimeFormat(tag, {
				day: "numeric",
				month: "short",
				year: "numeric",
			}),
			dateWithoutYear: Intl.DateTimeFormat(tag, {
				day: "numeric",
				month: "short",
			}),
			simpleDateWithoutYear: Intl.DateTimeFormat(tag, {
				day: "numeric",
				month: "numeric",
			}),
			dateWithWeekday: new Intl.DateTimeFormat(tag, {
				weekday: "short",
				day: "numeric",
				month: "short",
			}),
			dateWithWeekdayWoMonth: new Intl.DateTimeFormat(tag, {
				weekday: "short",
				day: "numeric",
			}),
			dateWithWeekdayAndYear: new Intl.DateTimeFormat(tag, {
				weekday: "short",
				day: "numeric",
				month: "short",
				year: "numeric",
			}),
			dateWithWeekdayAndYearLong: new Intl.DateTimeFormat(tag, {
				weekday: "long",
				day: "numeric",
				month: "long",
				year: "numeric",
			}),
			dateWithWeekdayAndTime: new Intl.DateTimeFormat(
				tag,
				Object.assign(
					{},
					{
						weekday: "short",
						day: "numeric",
						month: "short",
						hour: "numeric",
						minute: "numeric",
					} as const,
					options,
				),
			),
			time: new Intl.DateTimeFormat(
				tag,
				Object.assign(
					{},
					{
						hour: "numeric",
						minute: "numeric",
					} as const,
					options,
				),
			),
			shortTime: new Intl.DateTimeFormat(
				tag,
				Object.assign(
					{},
					{
						hour: "numeric",
					} as const,
					options,
				),
			),
			dateTime: new Intl.DateTimeFormat(
				tag,
				Object.assign(
					{},
					{
						day: "numeric",
						month: "short",
						year: "numeric",
						hour: "numeric",
						minute: "numeric",
					} as const,
					options,
				),
			),
			dateTimeShort: new Intl.DateTimeFormat(
				tag,
				Object.assign(
					{},
					{
						day: "numeric",
						month: "numeric",
						year: "numeric",
						hour: "numeric",
					} as const,
					options,
				),
			),
			weekdayShort: new Intl.DateTimeFormat(tag, {
				weekday: "short",
			}),
			weekdayNarrow: new Intl.DateTimeFormat(tag, {
				weekday: "narrow",
			}),
			priceWithCurrency: new Intl.NumberFormat(tag, {
				style: "currency",
				currency: "EUR",
				minimumFractionDigits: 2,
			}),
			priceWithCurrencyWithoutFractionDigits: new Intl.NumberFormat(tag, {
				style: "currency",
				currency: "EUR",
				maximumFractionDigits: 0,
				minimumFractionDigits: 0,
			}),
			priceWithoutCurrency: new Intl.NumberFormat(tag, {
				style: "decimal",
				minimumFractionDigits: 2,
			}),
			priceWithoutCurrencyWithoutFractionDigits: new Intl.NumberFormat(tag, {
				style: "decimal",
				maximumFractionDigits: 0,
				minimumFractionDigits: 0,
			}),
			monthLong: new Intl.DateTimeFormat(tag, {
				month: "long",
			}),
			monthShort: new Intl.DateTimeFormat(tag, {
				month: "short",
			}),
			monthShortWithFullYear: new Intl.DateTimeFormat(tag, {
				month: "short",
				year: "numeric",
			}),
			monthWithYear: new Intl.DateTimeFormat(tag, {
				month: "long",
				year: "2-digit",
			}),
			monthWithFullYear: new Intl.DateTimeFormat(tag, {
				month: "long",
				year: "numeric",
			}),
			yearNumeric: new Intl.DateTimeFormat(tag, {
				year: "numeric",
			}),
			shortMonthYear2Digit: new Intl.DateTimeFormat(tag, {
				month: "2-digit",
				year: "2-digit",
			}),
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
	get(id: TranslationKey, replacements?: Record<string, string | number>): string {
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

		for (let param in replacements) {
			text = text.replaceAll(param, String(replacements[param]))
		}

		return text
	}

	getMaybeLazy(value: TranslationText): string {
		return typeof value === "function" ? value() : lang.get(value)
	}
}

/**
 * Gets the default language derived from the browser language.
 * @param restrictions An array of language codes the selection should be restricted to
 */
export function getLanguageNoDefault(restrictions?: LanguageCode[]): { code: LanguageCode; languageTag: string } | null {
	// navigator.languages can be an empty array on android 5.x devices
	let languageTags

	if (typeof navigator !== "undefined") {
		languageTags = navigator.languages && navigator.languages.length > 0 ? navigator.languages : [navigator.language]
	} else if (typeof process !== "undefined" && typeof process.env !== "undefined") {
		const locale = process.env.LC_ALL || process.env.LC_MESSAGES || process.env.LANG || process.env.LANGUAGE || process.env.LC_NAME

		if (locale) {
			languageTags = [locale.split(".")[0].replace("_", "-")]
		}
	}

	if (languageTags) {
		for (let tag of languageTags) {
			let code = getSubstitutedLanguageCode(tag, restrictions)

			if (code) {
				return {
					code: code,
					languageTag: tag,
				}
			}
		}
	}

	return null
}

/**
 * Gets the default language derived from the browser language.
 * @param restrictions An array of language codes the selection should be restricted to
 */
export function getLanguage(restrictions?: LanguageCode[]): {
	code: LanguageCode
	languageTag: string
} {
	const language = getLanguageNoDefault(restrictions)
	if (language) return language

	if (restrictions == null || restrictions.indexOf("en") !== -1) {
		return {
			code: "en",
			languageTag: "en-US",
		}
	} else {
		return {
			code: restrictions[0],
			languageTag: restrictions[0].replace("/_/g", "-"),
		}
	}
}

export function getSubstitutedLanguageCode(tag: string, restrictions?: LanguageCode[]): LanguageCode | null {
	let code = tag.toLowerCase().replace("-", "_")
	let language = languages.find((l) => l.code === code && (restrictions == null || restrictions.indexOf(l.code) !== -1))

	if (language == null) {
		if (code === "zh_hk" || code === "zh_tw") {
			language = languages.find((l) => l.code === "zh_hant")
		} else {
			let basePart = getBasePart(code)
			language = languages.find((l) => getBasePart(l.code) === basePart && (restrictions == null || restrictions.indexOf(l.code) !== -1))
		}
	}

	if (language) {
		let customizations: WhitelabelCustomizations | null = null

		// accessing `window` throws an error on desktop, and this file is imported by DesktopMain
		if (typeof window !== "undefined") {
			customizations = getWhitelabelCustomizations(window)
		}

		const germanCode = customizations?.germanLanguageCode

		if (language.code === "de" && germanCode != null) {
			return downcast(germanCode)
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
	return getSubstitutedLanguageCode(code) || "en"
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
