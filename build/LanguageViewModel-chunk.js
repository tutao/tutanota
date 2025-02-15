import { assertMainOrNodeBoot } from "./Env-chunk.js";
import { downcast, typedEntries } from "./dist2-chunk.js";
import { getWhitelabelCustomizations } from "./WhitelabelCustomizations-chunk.js";

//#region src/common/misc/LanguageViewModel.ts
assertMainOrNodeBoot();
const translationImportMap = {
	ar: () => import("./ar-chunk.js"),
	be: () => import("./be-chunk.js"),
	bg: () => import("./bg-chunk.js"),
	ca: () => import("./ca-chunk.js"),
	cs: () => import("./cs-chunk.js"),
	da: () => import("./da-chunk.js"),
	de: () => import("./de-chunk.js"),
	de_sie: () => import("./de_sie-chunk.js"),
	el: () => import("./el-chunk.js"),
	en: () => import("./en-chunk.js"),
	en_gb: () => import("./en-chunk.js"),
	es: () => import("./es-chunk.js"),
	et: () => import("./et-chunk.js"),
	fa_ir: () => import("./fa_ir-chunk.js"),
	fi: () => import("./fi-chunk.js"),
	fr: () => import("./fr-chunk.js"),
	gl: () => import("./gl-chunk.js"),
	he: () => import("./he-chunk.js"),
	hi: () => import("./hi-chunk.js"),
	hr: () => import("./hr-chunk.js"),
	hu: () => import("./hu-chunk.js"),
	id: () => import("./id-chunk.js"),
	it: () => import("./it-chunk.js"),
	ja: () => import("./ja-chunk.js"),
	ko: () => import("./ko-chunk.js"),
	lt: () => import("./lt-chunk.js"),
	lv: () => import("./lv-chunk.js"),
	nl: () => import("./nl-chunk.js"),
	no: () => import("./no-chunk.js"),
	pl: () => import("./pl-chunk.js"),
	pt_br: () => import("./pt_br-chunk.js"),
	pt_pt: () => import("./pt_pt-chunk.js"),
	ro: () => import("./ro-chunk.js"),
	ru: () => import("./ru-chunk.js"),
	si: () => import("./si-chunk.js"),
	sk: () => import("./sk-chunk.js"),
	sl: () => import("./sl-chunk.js"),
	sr_cyrl: () => import("./sr_cyrl-chunk.js"),
	sv: () => import("./sv-chunk.js"),
	tr: () => import("./tr-chunk.js"),
	uk: () => import("./uk-chunk.js"),
	vi: () => import("./vi-chunk.js"),
	zh: () => import("./zh-chunk.js"),
	zh_hant: () => import("./zh_hant-chunk.js")
};
const LanguageNames = Object.freeze({
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
	zh_hant: "languageChineseTraditional_label"
});
const LanguageActualNames = Object.freeze({
	ar: "العربية",
	be: "Беларуская",
	bg: "Български",
	ca: "Català",
	cs: "Čeština",
	da: "Dansk",
	de: "Deutsch",
	de_sie: "Deutsch (Sie)",
	el: "Ελληνική",
	en: "English",
	en_gb: "English (UK)",
	es: "Español",
	et: "Eesti keel",
	fa_ir: "فارسی",
	fi: "suomi",
	fr: "Français",
	gl: "Galego",
	he: "עברית",
	hi: "हिंदी",
	hr: "Hrvatski",
	hu: "Magyar",
	id: "Indonesia",
	it: "Italiano",
	ja: "日本語",
	ko: "한국어",
	lt: "Lietuvių",
	lv: "Latviešu",
	nl: "Nederlands",
	no: "Norsk",
	pl: "polski",
	pt_br: "Português, Brasil",
	pt_pt: "Português, Portugal",
	ro: "Română",
	ru: "Русский",
	si: "සිංහල",
	sk: "Slovenčina",
	sl: "slovenščina",
	sr_cyrl: "Srpski",
	sv: "Svenska",
	tr: "Türkçe",
	uk: "Українська",
	vi: "Tiếng Việt",
	zh: "简体中文",
	zh_hant: "繁體中文"
});
const languageByCode = {};
for (let [code, textId] of downcast(Object.entries(LanguageNames))) languageByCode[code] = {
	code,
	textId
};
const languages = typedEntries(LanguageNames).map(([code, textId]) => {
	return {
		code,
		textId
	};
});
const languageNative = typedEntries(LanguageActualNames).map(([code, textName]) => {
	return {
		code,
		textName
	};
});
let InfoLink = function(InfoLink$1) {
	InfoLink$1["HomePage"] = "https://tuta.com";
	InfoLink$1["About"] = "https://tuta.com/imprint";
	InfoLink$1["Terms"] = "https://tuta.com/terms";
	InfoLink$1["Privacy"] = "https://tuta.com/privacy-policy";
	InfoLink$1["GiftCardsTerms"] = "https://tuta.com/giftCardsTerms";
	InfoLink$1["RecoverCode"] = "https://tuta.com/faq#reset";
	InfoLink$1["SecondFactor"] = "https://tuta.com/faq#2fa";
	InfoLink$1["SpamRules"] = "https://tuta.com/faq#spam";
	InfoLink$1["DomainInfo"] = "https://tuta.com/faq#custom-domain";
	InfoLink$1["Whitelabel"] = "https://tuta.com/faq#whitelabel";
	InfoLink$1["ReferralLink"] = "https://tuta.com/faq#refer-a-friend";
	InfoLink$1["Webview"] = "https://tuta.com/faq#webview";
	InfoLink$1["Phishing"] = "https://tuta.com/faq#phishing";
	InfoLink$1["MailAuth"] = "https://tuta.com/faq#mail-auth";
	InfoLink$1["RunInBackground"] = "https://tuta.com/faq#tray-desktop";
	InfoLink$1["LoadImages"] = "https://tuta.com/faq#load-images";
	InfoLink$1["Usage"] = "https://tuta.com/faq#usage";
	InfoLink$1["Download"] = "https://tuta.com/#download";
	InfoLink$1["SharedMailboxes"] = "https://tuta.com/support/#shared-mailboxes";
	InfoLink$1["InactiveAccounts"] = "https://tuta.com/faq/#inactive-accounts";
	InfoLink$1["AppStorePaymentChange"] = "https://tuta.com/support/#appstore-payment-change";
	InfoLink$1["AppStorePayment"] = "https://tuta.com/support/#appstore-payments";
	InfoLink$1["AppStoreDowngrade"] = "https://tuta.com/support/#appstore-subscription-downgrade";
	InfoLink$1["PasswordGenerator"] = "https://tuta.com/faq#passphrase-generator";
	InfoLink$1["HomePageFreeSignup"] = "https://tuta.com/free-email";
	return InfoLink$1;
}({});
var LanguageViewModel = class {
	translations;
	fallback;
	code;
	languageTag;
	staticTranslations;
	formats;
	constructor() {
		this.translations = {};
		this.fallback = {};
		this.staticTranslations = {};
	}
	init(en) {
		this.translations = en;
		this.fallback = en;
		this.code = "en";
		const language = getLanguage();
		return this.setLanguage(language).catch((e) => {
			console.warn("Could not set language", language, e);
			this._setLanguageTag("en-US");
		});
	}
	addStaticTranslation(key, text) {
		this.staticTranslations[key] = text;
	}
	initWithTranslations(code, languageTag, fallBackTranslations, translations) {
		this.translations = translations;
		this.fallback = fallBackTranslations;
		this.code = code;
	}
	setLanguage(lang$1) {
		this._setLanguageTag(lang$1.languageTag);
		if (this.code === lang$1.code) return Promise.resolve();
		const code = lang$1.code.startsWith("en") ? "en" : lang$1.code;
		return translationImportMap[code]().then((translationsModule) => {
			this.translations = translationsModule.default;
			this.code = lang$1.code;
		});
	}
	/**
	* must be invoked at startup from LanguageViewModel to initialize all DateTimeFormats
	* @param tag
	*/
	_setLanguageTag(tag) {
		this.languageTag = tag;
		this.updateFormats({});
	}
	updateFormats(options) {
		const tag = this.languageTag;
		this.formats = {
			simpleDate: new Intl.DateTimeFormat(tag, {
				day: "numeric",
				month: "numeric",
				year: "numeric"
			}),
			dateWithMonth: new Intl.DateTimeFormat(tag, {
				day: "numeric",
				month: "short",
				year: "numeric"
			}),
			dateWithoutYear: Intl.DateTimeFormat(tag, {
				day: "numeric",
				month: "short"
			}),
			simpleDateWithoutYear: Intl.DateTimeFormat(tag, {
				day: "numeric",
				month: "numeric"
			}),
			dateWithWeekday: new Intl.DateTimeFormat(tag, {
				weekday: "short",
				day: "numeric",
				month: "short"
			}),
			dateWithWeekdayWoMonth: new Intl.DateTimeFormat(tag, {
				weekday: "short",
				day: "numeric"
			}),
			dateWithWeekdayAndYear: new Intl.DateTimeFormat(tag, {
				weekday: "short",
				day: "numeric",
				month: "short",
				year: "numeric"
			}),
			dateWithWeekdayAndYearLong: new Intl.DateTimeFormat(tag, {
				weekday: "long",
				day: "numeric",
				month: "long",
				year: "numeric"
			}),
			dateWithWeekdayAndTime: new Intl.DateTimeFormat(tag, Object.assign({}, {
				weekday: "short",
				day: "numeric",
				month: "short",
				hour: "numeric",
				minute: "numeric"
			}, options)),
			time: new Intl.DateTimeFormat(tag, Object.assign({}, {
				hour: "numeric",
				minute: "numeric"
			}, options)),
			shortTime: new Intl.DateTimeFormat(tag, Object.assign({}, { hour: "numeric" }, options)),
			dateTime: new Intl.DateTimeFormat(tag, Object.assign({}, {
				day: "numeric",
				month: "short",
				year: "numeric",
				hour: "numeric",
				minute: "numeric"
			}, options)),
			dateTimeShort: new Intl.DateTimeFormat(tag, Object.assign({}, {
				day: "numeric",
				month: "numeric",
				year: "numeric",
				hour: "numeric"
			}, options)),
			weekdayShort: new Intl.DateTimeFormat(tag, { weekday: "short" }),
			weekdayNarrow: new Intl.DateTimeFormat(tag, { weekday: "narrow" }),
			priceWithCurrency: new Intl.NumberFormat(tag, {
				style: "currency",
				currency: "EUR",
				minimumFractionDigits: 2
			}),
			priceWithCurrencyWithoutFractionDigits: new Intl.NumberFormat(tag, {
				style: "currency",
				currency: "EUR",
				maximumFractionDigits: 0,
				minimumFractionDigits: 0
			}),
			priceWithoutCurrency: new Intl.NumberFormat(tag, {
				style: "decimal",
				minimumFractionDigits: 2
			}),
			priceWithoutCurrencyWithoutFractionDigits: new Intl.NumberFormat(tag, {
				style: "decimal",
				maximumFractionDigits: 0,
				minimumFractionDigits: 0
			}),
			monthLong: new Intl.DateTimeFormat(tag, { month: "long" }),
			monthShort: new Intl.DateTimeFormat(tag, { month: "short" }),
			monthShortWithFullYear: new Intl.DateTimeFormat(tag, {
				month: "short",
				year: "numeric"
			}),
			monthWithYear: new Intl.DateTimeFormat(tag, {
				month: "long",
				year: "2-digit"
			}),
			monthWithFullYear: new Intl.DateTimeFormat(tag, {
				month: "long",
				year: "numeric"
			}),
			yearNumeric: new Intl.DateTimeFormat(tag, { year: "numeric" }),
			shortMonthYear2Digit: new Intl.DateTimeFormat(tag, {
				month: "2-digit",
				year: "2-digit"
			})
		};
	}
	exists(id) {
		try {
			this.get(id);
			return true;
		} catch (e) {
			return false;
		}
	}
	/**
	* Resolve TranslationKey to Translation.
	*/
	getTranslation(id, replacements) {
		return this.makeTranslation(id, this.get(id, replacements));
	}
	/**
	* Should only be used to write the text of a TranslationKey to the dom.
	*/
	getTranslationText(value) {
		return typeof value === "object" ? value.text : lang.get(value);
	}
	/**
	* Legacy. Use getTranslation instead.
	*
	* Should only be used to write the text of a TranslationKey to the dom.
	*/
	get(id, replacements) {
		if (id == null) return "";
		if (id === "emptyString_msg") return " ";
		let text = this.translations.keys[id];
		if (!text) {
			text = this.fallback.keys[id];
			if (!text) {
				text = this.staticTranslations[id];
				if (!text) throw new Error("no translation found for id " + id);
			}
		}
		for (let param in replacements) text = text.replaceAll(param, String(replacements[param]));
		return text;
	}
	getTestId(value) {
		return typeof value === "object" ? value.testId : value;
	}
	/**
	* Creates a Translation. Only to be used in rare cases where we can't use a
	* TranslationKey (e.g. rendering the name of a folder).
	* @param testId
	* @param unresolved
	*/
	makeTranslation(testId, unresolved) {
		let text = typeof unresolved === "function" ? unresolved() : unresolved;
		return {
			testId,
			text
		};
	}
};
function getLanguageNoDefault(restrictions) {
	let languageTags;
	if (typeof navigator !== "undefined") languageTags = navigator.languages && navigator.languages.length > 0 ? navigator.languages : [navigator.language];
else if (typeof process !== "undefined" && typeof process.env !== "undefined") {
		const locale = process.env.LC_ALL || process.env.LC_MESSAGES || process.env.LANG || process.env.LANGUAGE || process.env.LC_NAME;
		if (locale) languageTags = [locale.split(".")[0].replace("_", "-")];
	}
	if (languageTags) for (let tag of languageTags) {
		let code = getSubstitutedLanguageCode(tag, restrictions);
		if (code) return {
			code,
			languageTag: tag
		};
	}
	return null;
}
function getLanguage(restrictions) {
	const language = getLanguageNoDefault(restrictions);
	if (language) return language;
	if (restrictions == null || restrictions.indexOf("en") !== -1) return {
		code: "en",
		languageTag: "en-US"
	};
else return {
		code: restrictions[0],
		languageTag: restrictions[0].replace("/_/g", "-")
	};
}
function getSubstitutedLanguageCode(tag, restrictions) {
	let code = tag.toLowerCase().replace("-", "_");
	let language = languages.find((l) => l.code === code && (restrictions == null || restrictions.indexOf(l.code) !== -1));
	if (language == null) if (code === "zh_hk" || code === "zh_tw") language = languages.find((l) => l.code === "zh_hant");
else {
		let basePart = getBasePart(code);
		language = languages.find((l) => getBasePart(l.code) === basePart && (restrictions == null || restrictions.indexOf(l.code) !== -1));
	}
	if (language) {
		let customizations = null;
		if (typeof window !== "undefined") customizations = getWhitelabelCustomizations(window);
		const germanCode = customizations?.germanLanguageCode;
		if (language.code === "de" && germanCode != null) return downcast(germanCode);
else return language.code;
	} else return null;
}
function getBasePart(code) {
	const indexOfUnderscore = code.indexOf("_");
	if (indexOfUnderscore > 0) return code.substring(0, indexOfUnderscore);
else return code;
}
function getAvailableLanguageCode(code) {
	return getSubstitutedLanguageCode(code) || "en";
}
function languageCodeToTag(code) {
	if (code === "de_sie") return "de";
	const indexOfUnderscore = code.indexOf("_");
	if (indexOfUnderscore === -1) return code;
else {
		const [before, after] = code.split("_");
		return `${before}-${after.toUpperCase()}`;
	}
}
const assertTranslation = downcast;
const lang = new LanguageViewModel();

//#endregion
export { InfoLink, LanguageActualNames, LanguageNames, LanguageViewModel, assertTranslation, getAvailableLanguageCode, getLanguage, getLanguageNoDefault, getSubstitutedLanguageCode, lang, languageByCode, languageCodeToTag, languageNative, languages };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTGFuZ3VhZ2VWaWV3TW9kZWwtY2h1bmsuanMiLCJuYW1lcyI6WyJ0cmFuc2xhdGlvbkltcG9ydE1hcDogUmVjb3JkPExhbmd1YWdlQ29kZSwgKCkgPT4gUHJvbWlzZTxhbnk+PiIsIkxhbmd1YWdlTmFtZXM6IFJlY29yZDxzdHJpbmcsIFRyYW5zbGF0aW9uS2V5PiIsImxhbmd1YWdlczogUmVhZG9ubHlBcnJheTx7XG5cdGNvZGU6IExhbmd1YWdlQ29kZVxuXHR0ZXh0SWQ6IFRyYW5zbGF0aW9uS2V5XG59PiIsImxhbmd1YWdlTmF0aXZlOiBSZWFkb25seUFycmF5PHtcblx0Y29kZTogTGFuZ3VhZ2VDb2RlXG5cdHRleHROYW1lOiBzdHJpbmdcbn0+IiwiZW46IG9iamVjdCIsImtleTogc3RyaW5nIiwidGV4dDogc3RyaW5nIiwiY29kZTogTGFuZ3VhZ2VDb2RlIiwibGFuZ3VhZ2VUYWc6IHN0cmluZyIsImZhbGxCYWNrVHJhbnNsYXRpb25zOiBSZWNvcmQ8c3RyaW5nLCBhbnk+IiwidHJhbnNsYXRpb25zOiBSZWNvcmQ8c3RyaW5nLCBhbnk+IiwibGFuZzogeyBjb2RlOiBMYW5ndWFnZUNvZGU7IGxhbmd1YWdlVGFnOiBzdHJpbmcgfSIsImxhbmciLCJ0YWc6IHN0cmluZyIsIm9wdGlvbnM6IERhdGVUaW1lRm9ybWF0T3B0aW9ucyIsImlkOiBUcmFuc2xhdGlvbktleSIsInJlcGxhY2VtZW50cz86IFJlY29yZDxzdHJpbmcsIHN0cmluZyB8IG51bWJlcj4iLCJ2YWx1ZTogTWF5YmVUcmFuc2xhdGlvbiIsInRlc3RJZDogc3RyaW5nIiwidW5yZXNvbHZlZDogc3RyaW5nIHwgbGF6eTxzdHJpbmc+IiwicmVzdHJpY3Rpb25zPzogTGFuZ3VhZ2VDb2RlW10iLCJjdXN0b21pemF0aW9uczogV2hpdGVsYWJlbEN1c3RvbWl6YXRpb25zIHwgbnVsbCIsImNvZGU6IHN0cmluZyIsImFzc2VydFRyYW5zbGF0aW9uOiAoaWQ6IHN0cmluZykgPT4gVHJhbnNsYXRpb25LZXkiLCJsYW5nOiBMYW5ndWFnZVZpZXdNb2RlbCJdLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21tb24vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBkb3duY2FzdCwgbGF6eSwgdHlwZWRFbnRyaWVzIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgdHlwZSB7IFRyYW5zbGF0aW9uS2V5VHlwZSB9IGZyb20gXCIuL1RyYW5zbGF0aW9uS2V5XCJcbmltcG9ydCB7IGdldFdoaXRlbGFiZWxDdXN0b21pemF0aW9ucywgV2hpdGVsYWJlbEN1c3RvbWl6YXRpb25zIH0gZnJvbSBcIi4vV2hpdGVsYWJlbEN1c3RvbWl6YXRpb25zXCJcbmltcG9ydCB7IGFzc2VydE1haW5Pck5vZGVCb290IH0gZnJvbSBcIi4uL2FwaS9jb21tb24vRW52XCJcblxuLyoqXG4gKiBBIHRyYW5zbGF0aW9uIGtleSBpcyBhIHN0cmluZyB0aGF0IG1hcHMgdG8gYSB0cmFuc2xhdGlvbiB0ZXh0LlxuICovXG5leHBvcnQgdHlwZSBUcmFuc2xhdGlvbktleSA9IFRyYW5zbGF0aW9uS2V5VHlwZVxuXG4vKipcbiAqIExlZ2FjeSB0eXBlIHRoYXQgaXMgZWl0aGVyIGEgVHJhbnNsYXRpb25LZXkgb3IgYSBUcmFuc2xhdGlvbi5cbiAqIE5ldyBjb2RlIHNob3VsZCBlaXRoZXIgdXNlIFRyYW5zbGF0aW9uS2V5IG9yIFRyYW5zbGF0aW9uLlxuICovXG5leHBvcnQgdHlwZSBNYXliZVRyYW5zbGF0aW9uID0gVHJhbnNsYXRpb25LZXkgfCBUcmFuc2xhdGlvblxuXG4vKipcbiAqIEEgVHJhbnNsYXRpb24gaXMgYSBrZXllZCB0cmFuc2xhdGlvbiB0ZXh0LlxuICpcbiAqIEVuY2Fwc3VsYXRlcyBhIHRlc3RpZCBhbmQgdGhlIHJlc29sdmVkIHRyYW5zbGF0aW9uIHRleHQuXG4gKiBUaGUgdGVzdGlkIGlzIHRoZSB0cmFuc2xhdGlvbiBrZXkgaW4gbW9zdCBjYXNlcywgYW5kXG4gKiBpdCBpcyB1c2VkIGFzIGRhdGEtdGVzdGlkIGRvbSBhdHRyaWJ1dGUgZm9yIGFjY2VwdGFuY2UgdGVzdHMuXG4gKi9cbmV4cG9ydCB0eXBlIFRyYW5zbGF0aW9uID0ge1xuXHR0ZXN0SWQ6IFRyYW5zbGF0aW9uS2V5IHwgc3RyaW5nXG5cdHRleHQ6IHN0cmluZ1xuXG5cdC8vIGRlZmluZWQgdG8gbWFrZSB0aGUgVHJhbnNsYXRpb24gdHlwZSBjbGFzaCB3aXRoIENvbXBvbmVudC5cblx0Ly8gVGhpcyBlbnN1cmVzIHRoYXQgdHlwc2NyaXB0IGVycm9ycyBvdXQgd2hlbiB3ZSBwYXNzIGEgcmVzb2x2ZWQgdHJhbnNsYXRpb25cblx0Ly8gdG8gdGhlIG0gaHlwZXJzY3JpcHQgZnVuY3Rpb24gbGlrZSBtKCdkaXYnLCBSZXNvbHZlZFRyYW5zbGF0aW9ue3RrZXk6IFwiZHVtbXlcIiwgdGV4dDogXCJ5ZWFoXCJ9KVxuXHRvbmluaXQ/OiBvYmplY3Rcbn1cbmFzc2VydE1haW5Pck5vZGVCb290KClcbmV4cG9ydCB0eXBlIERhdGVUaW1lRm9ybWF0T3B0aW9ucyA9IHtcblx0aG91ckN5Y2xlPzogXCJoMTFcIiB8IFwiaDEyXCIgfCBcImgyM1wiIHwgXCJoMjRcIlxufVxuY29uc3QgdHJhbnNsYXRpb25JbXBvcnRNYXA6IFJlY29yZDxMYW5ndWFnZUNvZGUsICgpID0+IFByb21pc2U8YW55Pj4gPSB7XG5cdGFyOiAoKSA9PiBpbXBvcnQoXCIuLi8uLi9tYWlsLWFwcC90cmFuc2xhdGlvbnMvYXIuanNcIiksXG5cdGJlOiAoKSA9PiBpbXBvcnQoXCIuLi8uLi9tYWlsLWFwcC90cmFuc2xhdGlvbnMvYmUuanNcIiksXG5cdGJnOiAoKSA9PiBpbXBvcnQoXCIuLi8uLi9tYWlsLWFwcC90cmFuc2xhdGlvbnMvYmcuanNcIiksXG5cdGNhOiAoKSA9PiBpbXBvcnQoXCIuLi8uLi9tYWlsLWFwcC90cmFuc2xhdGlvbnMvY2EuanNcIiksXG5cdGNzOiAoKSA9PiBpbXBvcnQoXCIuLi8uLi9tYWlsLWFwcC90cmFuc2xhdGlvbnMvY3MuanNcIiksXG5cdGRhOiAoKSA9PiBpbXBvcnQoXCIuLi8uLi9tYWlsLWFwcC90cmFuc2xhdGlvbnMvZGEuanNcIiksXG5cdGRlOiAoKSA9PiBpbXBvcnQoXCIuLi8uLi9tYWlsLWFwcC90cmFuc2xhdGlvbnMvZGUuanNcIiksXG5cdGRlX3NpZTogKCkgPT4gaW1wb3J0KFwiLi4vLi4vbWFpbC1hcHAvdHJhbnNsYXRpb25zL2RlX3NpZS5qc1wiKSxcblx0ZWw6ICgpID0+IGltcG9ydChcIi4uLy4uL21haWwtYXBwL3RyYW5zbGF0aW9ucy9lbC5qc1wiKSxcblx0ZW46ICgpID0+IGltcG9ydChcIi4uLy4uL21haWwtYXBwL3RyYW5zbGF0aW9ucy9lbi5qc1wiKSxcblx0ZW5fZ2I6ICgpID0+IGltcG9ydChcIi4uLy4uL21haWwtYXBwL3RyYW5zbGF0aW9ucy9lbi5qc1wiKSxcblx0ZXM6ICgpID0+IGltcG9ydChcIi4uLy4uL21haWwtYXBwL3RyYW5zbGF0aW9ucy9lcy5qc1wiKSxcblx0ZXQ6ICgpID0+IGltcG9ydChcIi4uLy4uL21haWwtYXBwL3RyYW5zbGF0aW9ucy9ldC5qc1wiKSxcblx0ZmFfaXI6ICgpID0+IGltcG9ydChcIi4uLy4uL21haWwtYXBwL3RyYW5zbGF0aW9ucy9mYV9pci5qc1wiKSxcblx0Zmk6ICgpID0+IGltcG9ydChcIi4uLy4uL21haWwtYXBwL3RyYW5zbGF0aW9ucy9maS5qc1wiKSxcblx0ZnI6ICgpID0+IGltcG9ydChcIi4uLy4uL21haWwtYXBwL3RyYW5zbGF0aW9ucy9mci5qc1wiKSxcblx0Z2w6ICgpID0+IGltcG9ydChcIi4uLy4uL21haWwtYXBwL3RyYW5zbGF0aW9ucy9nbC5qc1wiKSxcblx0aGU6ICgpID0+IGltcG9ydChcIi4uLy4uL21haWwtYXBwL3RyYW5zbGF0aW9ucy9oZS5qc1wiKSxcblx0aGk6ICgpID0+IGltcG9ydChcIi4uLy4uL21haWwtYXBwL3RyYW5zbGF0aW9ucy9oaS5qc1wiKSxcblx0aHI6ICgpID0+IGltcG9ydChcIi4uLy4uL21haWwtYXBwL3RyYW5zbGF0aW9ucy9oci5qc1wiKSxcblx0aHU6ICgpID0+IGltcG9ydChcIi4uLy4uL21haWwtYXBwL3RyYW5zbGF0aW9ucy9odS5qc1wiKSxcblx0aWQ6ICgpID0+IGltcG9ydChcIi4uLy4uL21haWwtYXBwL3RyYW5zbGF0aW9ucy9pZC5qc1wiKSxcblx0aXQ6ICgpID0+IGltcG9ydChcIi4uLy4uL21haWwtYXBwL3RyYW5zbGF0aW9ucy9pdC5qc1wiKSxcblx0amE6ICgpID0+IGltcG9ydChcIi4uLy4uL21haWwtYXBwL3RyYW5zbGF0aW9ucy9qYS5qc1wiKSxcblx0a286ICgpID0+IGltcG9ydChcIi4uLy4uL21haWwtYXBwL3RyYW5zbGF0aW9ucy9rby5qc1wiKSxcblx0bHQ6ICgpID0+IGltcG9ydChcIi4uLy4uL21haWwtYXBwL3RyYW5zbGF0aW9ucy9sdC5qc1wiKSxcblx0bHY6ICgpID0+IGltcG9ydChcIi4uLy4uL21haWwtYXBwL3RyYW5zbGF0aW9ucy9sdi5qc1wiKSxcblx0bmw6ICgpID0+IGltcG9ydChcIi4uLy4uL21haWwtYXBwL3RyYW5zbGF0aW9ucy9ubC5qc1wiKSxcblx0bm86ICgpID0+IGltcG9ydChcIi4uLy4uL21haWwtYXBwL3RyYW5zbGF0aW9ucy9uby5qc1wiKSxcblx0cGw6ICgpID0+IGltcG9ydChcIi4uLy4uL21haWwtYXBwL3RyYW5zbGF0aW9ucy9wbC5qc1wiKSxcblx0cHRfYnI6ICgpID0+IGltcG9ydChcIi4uLy4uL21haWwtYXBwL3RyYW5zbGF0aW9ucy9wdF9ici5qc1wiKSxcblx0cHRfcHQ6ICgpID0+IGltcG9ydChcIi4uLy4uL21haWwtYXBwL3RyYW5zbGF0aW9ucy9wdF9wdC5qc1wiKSxcblx0cm86ICgpID0+IGltcG9ydChcIi4uLy4uL21haWwtYXBwL3RyYW5zbGF0aW9ucy9yby5qc1wiKSxcblx0cnU6ICgpID0+IGltcG9ydChcIi4uLy4uL21haWwtYXBwL3RyYW5zbGF0aW9ucy9ydS5qc1wiKSxcblx0c2k6ICgpID0+IGltcG9ydChcIi4uLy4uL21haWwtYXBwL3RyYW5zbGF0aW9ucy9zaS5qc1wiKSxcblx0c2s6ICgpID0+IGltcG9ydChcIi4uLy4uL21haWwtYXBwL3RyYW5zbGF0aW9ucy9zay5qc1wiKSxcblx0c2w6ICgpID0+IGltcG9ydChcIi4uLy4uL21haWwtYXBwL3RyYW5zbGF0aW9ucy9zbC5qc1wiKSxcblx0c3JfY3lybDogKCkgPT4gaW1wb3J0KFwiLi4vLi4vbWFpbC1hcHAvdHJhbnNsYXRpb25zL3NyX2N5cmwuanNcIiksXG5cdHN2OiAoKSA9PiBpbXBvcnQoXCIuLi8uLi9tYWlsLWFwcC90cmFuc2xhdGlvbnMvc3YuanNcIiksXG5cdHRyOiAoKSA9PiBpbXBvcnQoXCIuLi8uLi9tYWlsLWFwcC90cmFuc2xhdGlvbnMvdHIuanNcIiksXG5cdHVrOiAoKSA9PiBpbXBvcnQoXCIuLi8uLi9tYWlsLWFwcC90cmFuc2xhdGlvbnMvdWsuanNcIiksXG5cdHZpOiAoKSA9PiBpbXBvcnQoXCIuLi8uLi9tYWlsLWFwcC90cmFuc2xhdGlvbnMvdmkuanNcIiksXG5cdHpoOiAoKSA9PiBpbXBvcnQoXCIuLi8uLi9tYWlsLWFwcC90cmFuc2xhdGlvbnMvemguanNcIiksXG5cdHpoX2hhbnQ6ICgpID0+IGltcG9ydChcIi4uLy4uL21haWwtYXBwL3RyYW5zbGF0aW9ucy96aF9oYW50LmpzXCIpLFxufVxuXG4vKipcbiAqIExhbmd1YWdlID0ge2NvZGUsIHRleHRJZH1cbiAqIFwiY29kZVwiIGlzIHRoZSAyIGxldHRlciBhYmJyLiBvZiB0aGUgbGFuZ3VhZ2UgKFwiZW5cIiwgXCJhclwiKVxuICogXCJ0ZXh0SWRcIiBjb3JyZXNwb25kcyB0byBhIGNvZGUgKFwibGFuZ3VhZ2VFbmdsaXNoX2xhYmVsXCIsIFwibGFuZ3VhZ2VBcmFiaWNfbGFiZWxcIilcbiAqXG4gKiBsYW5nLmdldCh0ZXh0SWQpIHdpbGwgcmV0dXJuIHRoZSB0cmFuc2xhdGVkIGxhbmd1YWdlc1xuICogbGFuZ3VhZ2VCeUNvZGVbY29kZV0gd2lsbCByZXR1cm4gdGhlIHdob2xlIGxhbmd1YWdlIE9iamVjdFxuICogaW4gYWxsIGNhc2VzIGxhbmcuZ2V0KGxhbmd1YWdlQnlDb2RlW2NvZGVdLnRleHRJZCkgd2lsbCBhbHdheXMgcmV0dXJuIHRoZSB0cmFuc2xhdGVkIGxhbmd1YWdlIGZyb20gYSBjb2RlXG4gKi9cbmV4cG9ydCBjb25zdCBMYW5ndWFnZU5hbWVzOiBSZWNvcmQ8c3RyaW5nLCBUcmFuc2xhdGlvbktleT4gPSBPYmplY3QuZnJlZXplKHtcblx0YXI6IFwibGFuZ3VhZ2VBcmFiaWNfbGFiZWxcIixcblx0YmU6IFwibGFuZ3VhZ2VCZWxhcnVzaWFuX2xhYmVsXCIsXG5cdGJnOiBcImxhbmd1YWdlQnVsZ2FyaWFuX2xhYmVsXCIsXG5cdGNhOiBcImxhbmd1YWdlQ2F0YWxhbl9sYWJlbFwiLFxuXHRjczogXCJsYW5ndWFnZUN6ZWNoX2xhYmVsXCIsXG5cdGRhOiBcImxhbmd1YWdlRGFuaXNoX2xhYmVsXCIsXG5cdGRlOiBcImxhbmd1YWdlR2VybWFuX2xhYmVsXCIsXG5cdGRlX3NpZTogXCJsYW5ndWFnZUdlcm1hblNpZV9sYWJlbFwiLFxuXHRlbDogXCJsYW5ndWFnZUdyZWVrX2xhYmVsXCIsXG5cdGVuOiBcImxhbmd1YWdlRW5nbGlzaF9sYWJlbFwiLFxuXHRlbl9nYjogXCJsYW5ndWFnZUVuZ2xpc2hVa19sYWJlbFwiLFxuXHRlczogXCJsYW5ndWFnZVNwYW5pc2hfbGFiZWxcIixcblx0ZXQ6IFwibGFuZ3VhZ2VFc3Rvbmlhbl9sYWJlbFwiLFxuXHRmYV9pcjogXCJsYW5ndWFnZVBlcnNpYW5fbGFiZWxcIixcblx0Zmk6IFwibGFuZ3VhZ2VGaW5uaXNoX2xhYmVsXCIsXG5cdGZyOiBcImxhbmd1YWdlRnJlbmNoX2xhYmVsXCIsXG5cdGdsOiBcImxhbmd1YWdlR2FsaWNpYW5fbGFiZWxcIixcblx0aGU6IFwibGFuZ3VhZ2VIZWJyZXdfbGFiZWxcIixcblx0aGk6IFwibGFuZ3VhZ2VIaW5kaV9sYWJlbFwiLFxuXHRocjogXCJsYW5ndWFnZUNyb2F0aWFuX2xhYmVsXCIsXG5cdGh1OiBcImxhbmd1YWdlSHVuZ2FyaWFuX2xhYmVsXCIsXG5cdGlkOiBcImxhbmd1YWdlSW5kb25lc2lhbl9sYWJlbFwiLFxuXHRpdDogXCJsYW5ndWFnZUl0YWxpYW5fbGFiZWxcIixcblx0amE6IFwibGFuZ3VhZ2VKYXBhbmVzZV9sYWJlbFwiLFxuXHRrbzogXCJsYW5ndWFnZUtvcmVhbl9sYWJlbFwiLFxuXHRsdDogXCJsYW5ndWFnZUxpdGh1YW5pYW5fbGFiZWxcIixcblx0bHY6IFwibGFuZ3VhZ2VMYXR2aWFuX2xhYmVsXCIsXG5cdG5sOiBcImxhbmd1YWdlRHV0Y2hfbGFiZWxcIixcblx0bm86IFwibGFuZ3VhZ2VOb3J3ZWdpYW5fbGFiZWxcIixcblx0cGw6IFwibGFuZ3VhZ2VQb2xpc2hfbGFiZWxcIixcblx0cHRfYnI6IFwibGFuZ3VhZ2VQb3J0dWdlc2VCcmF6aWxfbGFiZWxcIixcblx0cHRfcHQ6IFwibGFuZ3VhZ2VQb3J0dWdlc2VQb3J0dWdhbF9sYWJlbFwiLFxuXHRybzogXCJsYW5ndWFnZVJvbWFuaWFuX2xhYmVsXCIsXG5cdHJ1OiBcImxhbmd1YWdlUnVzc2lhbl9sYWJlbFwiLFxuXHRzaTogXCJsYW5ndWFnZVNpbmhhbGVzZV9sYWJlbFwiLFxuXHRzazogXCJsYW5ndWFnZVNsb3Zha19sYWJlbFwiLFxuXHRzbDogXCJsYW5ndWFnZVNsb3Zlbmlhbl9sYWJlbFwiLFxuXHRzcl9jeXJsOiBcImxhbmd1YWdlU2VyYmlhbl9sYWJlbFwiLFxuXHRzdjogXCJsYW5ndWFnZVN3ZWRpc2hfbGFiZWxcIixcblx0dHI6IFwibGFuZ3VhZ2VUdXJraXNoX2xhYmVsXCIsXG5cdHVrOiBcImxhbmd1YWdlVWtyYWluaWFuX2xhYmVsXCIsXG5cdHZpOiBcImxhbmd1YWdlVmlldG5hbWVzZV9sYWJlbFwiLFxuXHR6aDogXCJsYW5ndWFnZUNoaW5lc2VTaW1wbGlmaWVkX2xhYmVsXCIsXG5cdHpoX2hhbnQ6IFwibGFuZ3VhZ2VDaGluZXNlVHJhZGl0aW9uYWxfbGFiZWxcIixcbn0gYXMgY29uc3QpXG5leHBvcnQgdHlwZSBMYW5ndWFnZUNvZGUgPSBrZXlvZiB0eXBlb2YgTGFuZ3VhZ2VOYW1lc1xuZXhwb3J0IHR5cGUgTGFuZ3VhZ2UgPSB7XG5cdGNvZGU6IExhbmd1YWdlQ29kZVxuXHR0ZXh0SWQ6IFRyYW5zbGF0aW9uS2V5XG59XG5cbmV4cG9ydCBjb25zdCBMYW5ndWFnZUFjdHVhbE5hbWVzID0gT2JqZWN0LmZyZWV6ZSh7XG5cdGFyOiBcItin2YTYudix2KjZitipXCIsXG5cdGJlOiBcItCR0LXQu9Cw0YDRg9GB0LrQsNGPXCIsXG5cdGJnOiBcItCR0YrQu9Cz0LDRgNGB0LrQuFwiLFxuXHRjYTogXCJDYXRhbMOgXCIsXG5cdGNzOiBcIsSMZcWhdGluYVwiLFxuXHRkYTogXCJEYW5za1wiLFxuXHRkZTogXCJEZXV0c2NoXCIsXG5cdGRlX3NpZTogXCJEZXV0c2NoIChTaWUpXCIsXG5cdGVsOiBcIs6VzrvOu863zr3Ouc66zq5cIixcblx0ZW46IFwiRW5nbGlzaFwiLFxuXHRlbl9nYjogXCJFbmdsaXNoIChVSylcIixcblx0ZXM6IFwiRXNwYcOxb2xcIixcblx0ZXQ6IFwiRWVzdGkga2VlbFwiLFxuXHRmYV9pcjogXCLZgdin2LHYs9uMXCIsXG5cdGZpOiBcInN1b21pXCIsXG5cdGZyOiBcIkZyYW7Dp2Fpc1wiLFxuXHRnbDogXCJHYWxlZ29cIixcblx0aGU6IFwi16LXkdeo15nXqlwiLFxuXHRoaTogXCLgpLngpL/gpILgpKbgpYBcIixcblx0aHI6IFwiSHJ2YXRza2lcIixcblx0aHU6IFwiTWFneWFyXCIsXG5cdGlkOiBcIkluZG9uZXNpYVwiLFxuXHRpdDogXCJJdGFsaWFub1wiLFxuXHRqYTogXCLml6XmnKzoqp5cIixcblx0a286IFwi7ZWc6rWt7Ja0XCIsXG5cdGx0OiBcIkxpZXR1dmnFs1wiLFxuXHRsdjogXCJMYXR2aWXFoXVcIixcblx0bmw6IFwiTmVkZXJsYW5kc1wiLFxuXHRubzogXCJOb3Jza1wiLFxuXHRwbDogXCJwb2xza2lcIixcblx0cHRfYnI6IFwiUG9ydHVndcOqcywgQnJhc2lsXCIsXG5cdHB0X3B0OiBcIlBvcnR1Z3XDqnMsIFBvcnR1Z2FsXCIsXG5cdHJvOiBcIlJvbcOibsSDXCIsXG5cdHJ1OiBcItCg0YPRgdGB0LrQuNC5XCIsXG5cdHNpOiBcIuC3g+C3kuC2guC3hOC2vVwiLFxuXHRzazogXCJTbG92ZW7EjWluYVwiLFxuXHRzbDogXCJzbG92ZW7FocSNaW5hXCIsXG5cdHNyX2N5cmw6IFwiU3Jwc2tpXCIsXG5cdHN2OiBcIlN2ZW5za2FcIixcblx0dHI6IFwiVMO8cmvDp2VcIixcblx0dWs6IFwi0KPQutGA0LDRl9C90YHRjNC60LBcIixcblx0dmk6IFwiVGnhur9uZyBWaeG7h3RcIixcblx0emg6IFwi566A5L2T5Lit5paHXCIsXG5cdHpoX2hhbnQ6IFwi57mB6auU5Lit5paHXCIsXG59IGFzIGNvbnN0KVxuZXhwb3J0IGNvbnN0IGxhbmd1YWdlQnlDb2RlID0ge30gYXMgUmVjb3JkPExhbmd1YWdlQ29kZSwgTGFuZ3VhZ2U+XG5cbi8vIGNhbm5vdCBpbXBvcnQgdHlwZWRFbnRyaWVzIGhlcmUgZm9yIHNvbWUgcmVhc29uXG5mb3IgKGxldCBbY29kZSwgdGV4dElkXSBvZiBkb3duY2FzdChPYmplY3QuZW50cmllcyhMYW5ndWFnZU5hbWVzKSkpIHtcblx0bGFuZ3VhZ2VCeUNvZGVbY29kZV0gPSB7XG5cdFx0Y29kZSxcblx0XHR0ZXh0SWQsXG5cdH1cbn1cblxuZXhwb3J0IGNvbnN0IGxhbmd1YWdlczogUmVhZG9ubHlBcnJheTx7XG5cdGNvZGU6IExhbmd1YWdlQ29kZVxuXHR0ZXh0SWQ6IFRyYW5zbGF0aW9uS2V5XG59PiA9IHR5cGVkRW50cmllcyhMYW5ndWFnZU5hbWVzKS5tYXAoKFtjb2RlLCB0ZXh0SWRdKSA9PiB7XG5cdHJldHVybiB7XG5cdFx0Y29kZSxcblx0XHR0ZXh0SWQsXG5cdH1cbn0pXG5cbmV4cG9ydCBjb25zdCBsYW5ndWFnZU5hdGl2ZTogUmVhZG9ubHlBcnJheTx7XG5cdGNvZGU6IExhbmd1YWdlQ29kZVxuXHR0ZXh0TmFtZTogc3RyaW5nXG59PiA9IHR5cGVkRW50cmllcyhMYW5ndWFnZUFjdHVhbE5hbWVzKS5tYXAoKFtjb2RlLCB0ZXh0TmFtZV0pID0+IHtcblx0cmV0dXJuIHtcblx0XHRjb2RlLFxuXHRcdHRleHROYW1lLFxuXHR9XG59KVxuXG5leHBvcnQgY29uc3QgZW51bSBJbmZvTGluayB7XG5cdEhvbWVQYWdlID0gXCJodHRwczovL3R1dGEuY29tXCIsXG5cdEFib3V0ID0gXCJodHRwczovL3R1dGEuY29tL2ltcHJpbnRcIixcblx0Ly90ZXJtc1xuXHRUZXJtcyA9IFwiaHR0cHM6Ly90dXRhLmNvbS90ZXJtc1wiLFxuXHRQcml2YWN5ID0gXCJodHRwczovL3R1dGEuY29tL3ByaXZhY3ktcG9saWN5XCIsXG5cdEdpZnRDYXJkc1Rlcm1zID0gXCJodHRwczovL3R1dGEuY29tL2dpZnRDYXJkc1Rlcm1zXCIsXG5cdC8vZmFxXG5cdFJlY292ZXJDb2RlID0gXCJodHRwczovL3R1dGEuY29tL2ZhcSNyZXNldFwiLFxuXHRTZWNvbmRGYWN0b3IgPSBcImh0dHBzOi8vdHV0YS5jb20vZmFxIzJmYVwiLFxuXHRTcGFtUnVsZXMgPSBcImh0dHBzOi8vdHV0YS5jb20vZmFxI3NwYW1cIixcblx0RG9tYWluSW5mbyA9IFwiaHR0cHM6Ly90dXRhLmNvbS9mYXEjY3VzdG9tLWRvbWFpblwiLFxuXHRXaGl0ZWxhYmVsID0gXCJodHRwczovL3R1dGEuY29tL2ZhcSN3aGl0ZWxhYmVsXCIsXG5cdFJlZmVycmFsTGluayA9IFwiaHR0cHM6Ly90dXRhLmNvbS9mYXEjcmVmZXItYS1mcmllbmRcIixcblx0V2VidmlldyA9IFwiaHR0cHM6Ly90dXRhLmNvbS9mYXEjd2Vidmlld1wiLFxuXHRQaGlzaGluZyA9IFwiaHR0cHM6Ly90dXRhLmNvbS9mYXEjcGhpc2hpbmdcIixcblx0TWFpbEF1dGggPSBcImh0dHBzOi8vdHV0YS5jb20vZmFxI21haWwtYXV0aFwiLFxuXHRSdW5JbkJhY2tncm91bmQgPSBcImh0dHBzOi8vdHV0YS5jb20vZmFxI3RyYXktZGVza3RvcFwiLFxuXHRMb2FkSW1hZ2VzID0gXCJodHRwczovL3R1dGEuY29tL2ZhcSNsb2FkLWltYWdlc1wiLFxuXHRVc2FnZSA9IFwiaHR0cHM6Ly90dXRhLmNvbS9mYXEjdXNhZ2VcIixcblx0RG93bmxvYWQgPSBcImh0dHBzOi8vdHV0YS5jb20vI2Rvd25sb2FkXCIsXG5cdFNoYXJlZE1haWxib3hlcyA9IFwiaHR0cHM6Ly90dXRhLmNvbS9zdXBwb3J0LyNzaGFyZWQtbWFpbGJveGVzXCIsXG5cdEluYWN0aXZlQWNjb3VudHMgPSBcImh0dHBzOi8vdHV0YS5jb20vZmFxLyNpbmFjdGl2ZS1hY2NvdW50c1wiLFxuXHRBcHBTdG9yZVBheW1lbnRDaGFuZ2UgPSBcImh0dHBzOi8vdHV0YS5jb20vc3VwcG9ydC8jYXBwc3RvcmUtcGF5bWVudC1jaGFuZ2VcIixcblx0QXBwU3RvcmVQYXltZW50ID0gXCJodHRwczovL3R1dGEuY29tL3N1cHBvcnQvI2FwcHN0b3JlLXBheW1lbnRzXCIsXG5cdEFwcFN0b3JlRG93bmdyYWRlID0gXCJodHRwczovL3R1dGEuY29tL3N1cHBvcnQvI2FwcHN0b3JlLXN1YnNjcmlwdGlvbi1kb3duZ3JhZGVcIixcblx0UGFzc3dvcmRHZW5lcmF0b3IgPSBcImh0dHBzOi8vdHV0YS5jb20vZmFxI3Bhc3NwaHJhc2UtZ2VuZXJhdG9yXCIsXG5cdEhvbWVQYWdlRnJlZVNpZ251cCA9IFwiaHR0cHM6Ly90dXRhLmNvbS9mcmVlLWVtYWlsXCIsXG59XG5cbi8qKlxuICogUHJvdmlkZXMgYWxsIGxvY2FsaXphdGlvbnMgb2Ygc3RyaW5ncyBvbiBvdXIgZ3VpLlxuICpcbiAqIFRoZSB0cmFuc2xhdGlvbnMgYXJlIGRlZmluZWQgb24gSlNPTiBmaWxlcy4gU2VlIHRoZSBmb2xkZXIgJ3RyYW5zbGF0aW9ucycgZm9yIGV4YW1wbGVzLlxuICogVGhlIGFjdHVhbCBpZGVudGlmaWVyIGlzIGNhbWVsIGNhc2UgYW5kIHRoZSB0eXBlIGlzIGFwcGVuZGVkIGJ5IGFuIHVuZGVyc2NvcmUuXG4gKiBUeXBlczogbGFiZWwsIGFjdGlvbiwgbXNnLCB0aXRsZSwgYWx0LCBwbGFjZWhvbGRlclxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5leHBvcnQgY2xhc3MgTGFuZ3VhZ2VWaWV3TW9kZWwge1xuXHR0cmFuc2xhdGlvbnM6IFJlY29yZDxzdHJpbmcsIGFueT5cblx0ZmFsbGJhY2s6IFJlY29yZDxzdHJpbmcsIGFueT5cblx0Y29kZSE6IExhbmd1YWdlQ29kZVxuXHRsYW5ndWFnZVRhZyE6IHN0cmluZ1xuXHRzdGF0aWNUcmFuc2xhdGlvbnM6IFJlY29yZDxzdHJpbmcsIGFueT5cblx0Zm9ybWF0cyE6IHtcblx0XHRzaW1wbGVEYXRlOiBJbnRsLkRhdGVUaW1lRm9ybWF0XG5cdFx0ZGF0ZVdpdGhNb250aDogSW50bC5EYXRlVGltZUZvcm1hdFxuXHRcdGRhdGVXaXRob3V0WWVhcjogSW50bC5EYXRlVGltZUZvcm1hdFxuXHRcdHNpbXBsZURhdGVXaXRob3V0WWVhcjogSW50bC5EYXRlVGltZUZvcm1hdFxuXHRcdGRhdGVXaXRoV2Vla2RheTogSW50bC5EYXRlVGltZUZvcm1hdFxuXHRcdGRhdGVXaXRoV2Vla2RheVdvTW9udGg6IEludGwuRGF0ZVRpbWVGb3JtYXRcblx0XHRkYXRlV2l0aFdlZWtkYXlBbmRZZWFyOiBJbnRsLkRhdGVUaW1lRm9ybWF0XG5cdFx0ZGF0ZVdpdGhXZWVrZGF5QW5kWWVhckxvbmc6IEludGwuRGF0ZVRpbWVGb3JtYXRcblx0XHRkYXRlV2l0aFdlZWtkYXlBbmRUaW1lOiBJbnRsLkRhdGVUaW1lRm9ybWF0XG5cdFx0d2Vla2RheVNob3J0OiBJbnRsLkRhdGVUaW1lRm9ybWF0XG5cdFx0d2Vla2RheU5hcnJvdzogSW50bC5EYXRlVGltZUZvcm1hdFxuXHRcdHRpbWU6IEludGwuRGF0ZVRpbWVGb3JtYXRcblx0XHRzaG9ydFRpbWU6IEludGwuRGF0ZVRpbWVGb3JtYXRcblx0XHRkYXRlVGltZTogSW50bC5EYXRlVGltZUZvcm1hdFxuXHRcdGRhdGVUaW1lU2hvcnQ6IEludGwuRGF0ZVRpbWVGb3JtYXRcblx0XHRwcmljZVdpdGhDdXJyZW5jeTogSW50bC5OdW1iZXJGb3JtYXRcblx0XHRwcmljZVdpdGhDdXJyZW5jeVdpdGhvdXRGcmFjdGlvbkRpZ2l0czogSW50bC5OdW1iZXJGb3JtYXRcblx0XHRwcmljZVdpdGhvdXRDdXJyZW5jeTogSW50bC5OdW1iZXJGb3JtYXRcblx0XHRwcmljZVdpdGhvdXRDdXJyZW5jeVdpdGhvdXRGcmFjdGlvbkRpZ2l0czogSW50bC5OdW1iZXJGb3JtYXRcblx0XHRtb250aExvbmc6IEludGwuRGF0ZVRpbWVGb3JtYXRcblx0XHRtb250aFNob3J0OiBJbnRsLkRhdGVUaW1lRm9ybWF0XG5cdFx0bW9udGhTaG9ydFdpdGhGdWxsWWVhcjogSW50bC5EYXRlVGltZUZvcm1hdFxuXHRcdG1vbnRoV2l0aFllYXI6IEludGwuRGF0ZVRpbWVGb3JtYXRcblx0XHRtb250aFdpdGhGdWxsWWVhcjogSW50bC5EYXRlVGltZUZvcm1hdFxuXHRcdHllYXJOdW1lcmljOiBJbnRsLkRhdGVUaW1lRm9ybWF0XG5cdFx0c2hvcnRNb250aFllYXIyRGlnaXQ6IEludGwuRGF0ZVRpbWVGb3JtYXRcblx0fVxuXG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHRoaXMudHJhbnNsYXRpb25zID0ge31cblx0XHR0aGlzLmZhbGxiYWNrID0ge31cblx0XHR0aGlzLnN0YXRpY1RyYW5zbGF0aW9ucyA9IHt9XG5cdH1cblxuXHRpbml0KGVuOiBvYmplY3QpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0aGlzLnRyYW5zbGF0aW9ucyA9IGVuXG5cdFx0dGhpcy5mYWxsYmFjayA9IGVuIC8vIGFsd2F5cyBsb2FkIGVuZ2xpc2ggYXMgZmFsbGJhY2tcblxuXHRcdHRoaXMuY29kZSA9IFwiZW5cIlxuXHRcdGNvbnN0IGxhbmd1YWdlID0gZ2V0TGFuZ3VhZ2UoKVxuXHRcdHJldHVybiB0aGlzLnNldExhbmd1YWdlKGxhbmd1YWdlKSAvLyBTZXJ2aWNlIHdvcmtlciBjdXJyZW50bHkgY2FjaGVzIG9ubHkgRW5nbGlzaC4gV2UgZG9uJ3Qgd2FudCB0aGUgd2hvbGUgYXBwIHRvIGZhaWwgaWYgd2UgY2Fubm90IGZldGNoIHRoZSBsYW5ndWFnZS5cblx0XHRcdC5jYXRjaCgoZSkgPT4ge1xuXHRcdFx0XHRjb25zb2xlLndhcm4oXCJDb3VsZCBub3Qgc2V0IGxhbmd1YWdlXCIsIGxhbmd1YWdlLCBlKVxuXG5cdFx0XHRcdHRoaXMuX3NldExhbmd1YWdlVGFnKFwiZW4tVVNcIilcblx0XHRcdH0pXG5cdH1cblxuXHRhZGRTdGF0aWNUcmFuc2xhdGlvbihrZXk6IHN0cmluZywgdGV4dDogc3RyaW5nKSB7XG5cdFx0dGhpcy5zdGF0aWNUcmFuc2xhdGlvbnNba2V5XSA9IHRleHRcblx0fVxuXG5cdGluaXRXaXRoVHJhbnNsYXRpb25zKGNvZGU6IExhbmd1YWdlQ29kZSwgbGFuZ3VhZ2VUYWc6IHN0cmluZywgZmFsbEJhY2tUcmFuc2xhdGlvbnM6IFJlY29yZDxzdHJpbmcsIGFueT4sIHRyYW5zbGF0aW9uczogUmVjb3JkPHN0cmluZywgYW55Pikge1xuXHRcdHRoaXMudHJhbnNsYXRpb25zID0gdHJhbnNsYXRpb25zXG5cdFx0dGhpcy5mYWxsYmFjayA9IGZhbGxCYWNrVHJhbnNsYXRpb25zXG5cdFx0dGhpcy5jb2RlID0gY29kZVxuXHR9XG5cblx0c2V0TGFuZ3VhZ2UobGFuZzogeyBjb2RlOiBMYW5ndWFnZUNvZGU7IGxhbmd1YWdlVGFnOiBzdHJpbmcgfSk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRoaXMuX3NldExhbmd1YWdlVGFnKGxhbmcubGFuZ3VhZ2VUYWcpXG5cblx0XHRpZiAodGhpcy5jb2RlID09PSBsYW5nLmNvZGUpIHtcblx0XHRcdHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuXHRcdH1cblxuXHRcdC8vIHdlIGRvbid0IHN1cHBvcnQgbXVsdGlwbGUgbGFuZ3VhZ2UgZmlsZXMgZm9yIGVuIHNvIGp1c3QgdXNlIHRoZSBvbmUgYW5kIG9ubHkuXG5cdFx0Y29uc3QgY29kZTogTGFuZ3VhZ2VDb2RlID0gbGFuZy5jb2RlLnN0YXJ0c1dpdGgoXCJlblwiKSA/IFwiZW5cIiA6IGxhbmcuY29kZVxuXHRcdHJldHVybiB0cmFuc2xhdGlvbkltcG9ydE1hcFtjb2RlXSgpLnRoZW4oKHRyYW5zbGF0aW9uc01vZHVsZSkgPT4ge1xuXHRcdFx0dGhpcy50cmFuc2xhdGlvbnMgPSB0cmFuc2xhdGlvbnNNb2R1bGUuZGVmYXVsdFxuXHRcdFx0dGhpcy5jb2RlID0gbGFuZy5jb2RlXG5cdFx0fSlcblx0fVxuXG5cdC8qKlxuXHQgKiBtdXN0IGJlIGludm9rZWQgYXQgc3RhcnR1cCBmcm9tIExhbmd1YWdlVmlld01vZGVsIHRvIGluaXRpYWxpemUgYWxsIERhdGVUaW1lRm9ybWF0c1xuXHQgKiBAcGFyYW0gdGFnXG5cdCAqL1xuXHRfc2V0TGFuZ3VhZ2VUYWcodGFnOiBzdHJpbmcpIHtcblx0XHR0aGlzLmxhbmd1YWdlVGFnID0gdGFnXG5cdFx0dGhpcy51cGRhdGVGb3JtYXRzKHt9KVxuXHR9XG5cblx0dXBkYXRlRm9ybWF0cyhvcHRpb25zOiBEYXRlVGltZUZvcm1hdE9wdGlvbnMpIHtcblx0XHRjb25zdCB0YWcgPSB0aGlzLmxhbmd1YWdlVGFnXG5cdFx0dGhpcy5mb3JtYXRzID0ge1xuXHRcdFx0c2ltcGxlRGF0ZTogbmV3IEludGwuRGF0ZVRpbWVGb3JtYXQodGFnLCB7XG5cdFx0XHRcdGRheTogXCJudW1lcmljXCIsXG5cdFx0XHRcdG1vbnRoOiBcIm51bWVyaWNcIixcblx0XHRcdFx0eWVhcjogXCJudW1lcmljXCIsXG5cdFx0XHR9KSxcblx0XHRcdGRhdGVXaXRoTW9udGg6IG5ldyBJbnRsLkRhdGVUaW1lRm9ybWF0KHRhZywge1xuXHRcdFx0XHRkYXk6IFwibnVtZXJpY1wiLFxuXHRcdFx0XHRtb250aDogXCJzaG9ydFwiLFxuXHRcdFx0XHR5ZWFyOiBcIm51bWVyaWNcIixcblx0XHRcdH0pLFxuXHRcdFx0ZGF0ZVdpdGhvdXRZZWFyOiBJbnRsLkRhdGVUaW1lRm9ybWF0KHRhZywge1xuXHRcdFx0XHRkYXk6IFwibnVtZXJpY1wiLFxuXHRcdFx0XHRtb250aDogXCJzaG9ydFwiLFxuXHRcdFx0fSksXG5cdFx0XHRzaW1wbGVEYXRlV2l0aG91dFllYXI6IEludGwuRGF0ZVRpbWVGb3JtYXQodGFnLCB7XG5cdFx0XHRcdGRheTogXCJudW1lcmljXCIsXG5cdFx0XHRcdG1vbnRoOiBcIm51bWVyaWNcIixcblx0XHRcdH0pLFxuXHRcdFx0ZGF0ZVdpdGhXZWVrZGF5OiBuZXcgSW50bC5EYXRlVGltZUZvcm1hdCh0YWcsIHtcblx0XHRcdFx0d2Vla2RheTogXCJzaG9ydFwiLFxuXHRcdFx0XHRkYXk6IFwibnVtZXJpY1wiLFxuXHRcdFx0XHRtb250aDogXCJzaG9ydFwiLFxuXHRcdFx0fSksXG5cdFx0XHRkYXRlV2l0aFdlZWtkYXlXb01vbnRoOiBuZXcgSW50bC5EYXRlVGltZUZvcm1hdCh0YWcsIHtcblx0XHRcdFx0d2Vla2RheTogXCJzaG9ydFwiLFxuXHRcdFx0XHRkYXk6IFwibnVtZXJpY1wiLFxuXHRcdFx0fSksXG5cdFx0XHRkYXRlV2l0aFdlZWtkYXlBbmRZZWFyOiBuZXcgSW50bC5EYXRlVGltZUZvcm1hdCh0YWcsIHtcblx0XHRcdFx0d2Vla2RheTogXCJzaG9ydFwiLFxuXHRcdFx0XHRkYXk6IFwibnVtZXJpY1wiLFxuXHRcdFx0XHRtb250aDogXCJzaG9ydFwiLFxuXHRcdFx0XHR5ZWFyOiBcIm51bWVyaWNcIixcblx0XHRcdH0pLFxuXHRcdFx0ZGF0ZVdpdGhXZWVrZGF5QW5kWWVhckxvbmc6IG5ldyBJbnRsLkRhdGVUaW1lRm9ybWF0KHRhZywge1xuXHRcdFx0XHR3ZWVrZGF5OiBcImxvbmdcIixcblx0XHRcdFx0ZGF5OiBcIm51bWVyaWNcIixcblx0XHRcdFx0bW9udGg6IFwibG9uZ1wiLFxuXHRcdFx0XHR5ZWFyOiBcIm51bWVyaWNcIixcblx0XHRcdH0pLFxuXHRcdFx0ZGF0ZVdpdGhXZWVrZGF5QW5kVGltZTogbmV3IEludGwuRGF0ZVRpbWVGb3JtYXQoXG5cdFx0XHRcdHRhZyxcblx0XHRcdFx0T2JqZWN0LmFzc2lnbihcblx0XHRcdFx0XHR7fSxcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHR3ZWVrZGF5OiBcInNob3J0XCIsXG5cdFx0XHRcdFx0XHRkYXk6IFwibnVtZXJpY1wiLFxuXHRcdFx0XHRcdFx0bW9udGg6IFwic2hvcnRcIixcblx0XHRcdFx0XHRcdGhvdXI6IFwibnVtZXJpY1wiLFxuXHRcdFx0XHRcdFx0bWludXRlOiBcIm51bWVyaWNcIixcblx0XHRcdFx0XHR9IGFzIGNvbnN0LFxuXHRcdFx0XHRcdG9wdGlvbnMsXG5cdFx0XHRcdCksXG5cdFx0XHQpLFxuXHRcdFx0dGltZTogbmV3IEludGwuRGF0ZVRpbWVGb3JtYXQoXG5cdFx0XHRcdHRhZyxcblx0XHRcdFx0T2JqZWN0LmFzc2lnbihcblx0XHRcdFx0XHR7fSxcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRob3VyOiBcIm51bWVyaWNcIixcblx0XHRcdFx0XHRcdG1pbnV0ZTogXCJudW1lcmljXCIsXG5cdFx0XHRcdFx0fSBhcyBjb25zdCxcblx0XHRcdFx0XHRvcHRpb25zLFxuXHRcdFx0XHQpLFxuXHRcdFx0KSxcblx0XHRcdHNob3J0VGltZTogbmV3IEludGwuRGF0ZVRpbWVGb3JtYXQoXG5cdFx0XHRcdHRhZyxcblx0XHRcdFx0T2JqZWN0LmFzc2lnbihcblx0XHRcdFx0XHR7fSxcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRob3VyOiBcIm51bWVyaWNcIixcblx0XHRcdFx0XHR9IGFzIGNvbnN0LFxuXHRcdFx0XHRcdG9wdGlvbnMsXG5cdFx0XHRcdCksXG5cdFx0XHQpLFxuXHRcdFx0ZGF0ZVRpbWU6IG5ldyBJbnRsLkRhdGVUaW1lRm9ybWF0KFxuXHRcdFx0XHR0YWcsXG5cdFx0XHRcdE9iamVjdC5hc3NpZ24oXG5cdFx0XHRcdFx0e30sXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0ZGF5OiBcIm51bWVyaWNcIixcblx0XHRcdFx0XHRcdG1vbnRoOiBcInNob3J0XCIsXG5cdFx0XHRcdFx0XHR5ZWFyOiBcIm51bWVyaWNcIixcblx0XHRcdFx0XHRcdGhvdXI6IFwibnVtZXJpY1wiLFxuXHRcdFx0XHRcdFx0bWludXRlOiBcIm51bWVyaWNcIixcblx0XHRcdFx0XHR9IGFzIGNvbnN0LFxuXHRcdFx0XHRcdG9wdGlvbnMsXG5cdFx0XHRcdCksXG5cdFx0XHQpLFxuXHRcdFx0ZGF0ZVRpbWVTaG9ydDogbmV3IEludGwuRGF0ZVRpbWVGb3JtYXQoXG5cdFx0XHRcdHRhZyxcblx0XHRcdFx0T2JqZWN0LmFzc2lnbihcblx0XHRcdFx0XHR7fSxcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRkYXk6IFwibnVtZXJpY1wiLFxuXHRcdFx0XHRcdFx0bW9udGg6IFwibnVtZXJpY1wiLFxuXHRcdFx0XHRcdFx0eWVhcjogXCJudW1lcmljXCIsXG5cdFx0XHRcdFx0XHRob3VyOiBcIm51bWVyaWNcIixcblx0XHRcdFx0XHR9IGFzIGNvbnN0LFxuXHRcdFx0XHRcdG9wdGlvbnMsXG5cdFx0XHRcdCksXG5cdFx0XHQpLFxuXHRcdFx0d2Vla2RheVNob3J0OiBuZXcgSW50bC5EYXRlVGltZUZvcm1hdCh0YWcsIHtcblx0XHRcdFx0d2Vla2RheTogXCJzaG9ydFwiLFxuXHRcdFx0fSksXG5cdFx0XHR3ZWVrZGF5TmFycm93OiBuZXcgSW50bC5EYXRlVGltZUZvcm1hdCh0YWcsIHtcblx0XHRcdFx0d2Vla2RheTogXCJuYXJyb3dcIixcblx0XHRcdH0pLFxuXHRcdFx0cHJpY2VXaXRoQ3VycmVuY3k6IG5ldyBJbnRsLk51bWJlckZvcm1hdCh0YWcsIHtcblx0XHRcdFx0c3R5bGU6IFwiY3VycmVuY3lcIixcblx0XHRcdFx0Y3VycmVuY3k6IFwiRVVSXCIsXG5cdFx0XHRcdG1pbmltdW1GcmFjdGlvbkRpZ2l0czogMixcblx0XHRcdH0pLFxuXHRcdFx0cHJpY2VXaXRoQ3VycmVuY3lXaXRob3V0RnJhY3Rpb25EaWdpdHM6IG5ldyBJbnRsLk51bWJlckZvcm1hdCh0YWcsIHtcblx0XHRcdFx0c3R5bGU6IFwiY3VycmVuY3lcIixcblx0XHRcdFx0Y3VycmVuY3k6IFwiRVVSXCIsXG5cdFx0XHRcdG1heGltdW1GcmFjdGlvbkRpZ2l0czogMCxcblx0XHRcdFx0bWluaW11bUZyYWN0aW9uRGlnaXRzOiAwLFxuXHRcdFx0fSksXG5cdFx0XHRwcmljZVdpdGhvdXRDdXJyZW5jeTogbmV3IEludGwuTnVtYmVyRm9ybWF0KHRhZywge1xuXHRcdFx0XHRzdHlsZTogXCJkZWNpbWFsXCIsXG5cdFx0XHRcdG1pbmltdW1GcmFjdGlvbkRpZ2l0czogMixcblx0XHRcdH0pLFxuXHRcdFx0cHJpY2VXaXRob3V0Q3VycmVuY3lXaXRob3V0RnJhY3Rpb25EaWdpdHM6IG5ldyBJbnRsLk51bWJlckZvcm1hdCh0YWcsIHtcblx0XHRcdFx0c3R5bGU6IFwiZGVjaW1hbFwiLFxuXHRcdFx0XHRtYXhpbXVtRnJhY3Rpb25EaWdpdHM6IDAsXG5cdFx0XHRcdG1pbmltdW1GcmFjdGlvbkRpZ2l0czogMCxcblx0XHRcdH0pLFxuXHRcdFx0bW9udGhMb25nOiBuZXcgSW50bC5EYXRlVGltZUZvcm1hdCh0YWcsIHtcblx0XHRcdFx0bW9udGg6IFwibG9uZ1wiLFxuXHRcdFx0fSksXG5cdFx0XHRtb250aFNob3J0OiBuZXcgSW50bC5EYXRlVGltZUZvcm1hdCh0YWcsIHtcblx0XHRcdFx0bW9udGg6IFwic2hvcnRcIixcblx0XHRcdH0pLFxuXHRcdFx0bW9udGhTaG9ydFdpdGhGdWxsWWVhcjogbmV3IEludGwuRGF0ZVRpbWVGb3JtYXQodGFnLCB7XG5cdFx0XHRcdG1vbnRoOiBcInNob3J0XCIsXG5cdFx0XHRcdHllYXI6IFwibnVtZXJpY1wiLFxuXHRcdFx0fSksXG5cdFx0XHRtb250aFdpdGhZZWFyOiBuZXcgSW50bC5EYXRlVGltZUZvcm1hdCh0YWcsIHtcblx0XHRcdFx0bW9udGg6IFwibG9uZ1wiLFxuXHRcdFx0XHR5ZWFyOiBcIjItZGlnaXRcIixcblx0XHRcdH0pLFxuXHRcdFx0bW9udGhXaXRoRnVsbFllYXI6IG5ldyBJbnRsLkRhdGVUaW1lRm9ybWF0KHRhZywge1xuXHRcdFx0XHRtb250aDogXCJsb25nXCIsXG5cdFx0XHRcdHllYXI6IFwibnVtZXJpY1wiLFxuXHRcdFx0fSksXG5cdFx0XHR5ZWFyTnVtZXJpYzogbmV3IEludGwuRGF0ZVRpbWVGb3JtYXQodGFnLCB7XG5cdFx0XHRcdHllYXI6IFwibnVtZXJpY1wiLFxuXHRcdFx0fSksXG5cdFx0XHRzaG9ydE1vbnRoWWVhcjJEaWdpdDogbmV3IEludGwuRGF0ZVRpbWVGb3JtYXQodGFnLCB7XG5cdFx0XHRcdG1vbnRoOiBcIjItZGlnaXRcIixcblx0XHRcdFx0eWVhcjogXCIyLWRpZ2l0XCIsXG5cdFx0XHR9KSxcblx0XHR9XG5cdH1cblxuXHRleGlzdHMoaWQ6IFRyYW5zbGF0aW9uS2V5KTogYm9vbGVhbiB7XG5cdFx0dHJ5IHtcblx0XHRcdHRoaXMuZ2V0KGlkKVxuXHRcdFx0cmV0dXJuIHRydWVcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogUmVzb2x2ZSBUcmFuc2xhdGlvbktleSB0byBUcmFuc2xhdGlvbi5cblx0ICovXG5cdGdldFRyYW5zbGF0aW9uKGlkOiBUcmFuc2xhdGlvbktleSwgcmVwbGFjZW1lbnRzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nIHwgbnVtYmVyPik6IFRyYW5zbGF0aW9uIHtcblx0XHRyZXR1cm4gdGhpcy5tYWtlVHJhbnNsYXRpb24oaWQsIHRoaXMuZ2V0KGlkLCByZXBsYWNlbWVudHMpKVxuXHR9XG5cblx0LyoqXG5cdCAqIFNob3VsZCBvbmx5IGJlIHVzZWQgdG8gd3JpdGUgdGhlIHRleHQgb2YgYSBUcmFuc2xhdGlvbktleSB0byB0aGUgZG9tLlxuXHQgKi9cblx0Z2V0VHJhbnNsYXRpb25UZXh0KHZhbHVlOiBNYXliZVRyYW5zbGF0aW9uKTogc3RyaW5nIHtcblx0XHRyZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiID8gKHZhbHVlIGFzIFRyYW5zbGF0aW9uKS50ZXh0IDogbGFuZy5nZXQodmFsdWUgYXMgVHJhbnNsYXRpb25LZXkpXG5cdH1cblxuXHQvKipcblx0ICogTGVnYWN5LiBVc2UgZ2V0VHJhbnNsYXRpb24gaW5zdGVhZC5cblx0ICpcblx0ICogU2hvdWxkIG9ubHkgYmUgdXNlZCB0byB3cml0ZSB0aGUgdGV4dCBvZiBhIFRyYW5zbGF0aW9uS2V5IHRvIHRoZSBkb20uXG5cdCAqL1xuXHRnZXQoaWQ6IFRyYW5zbGF0aW9uS2V5LCByZXBsYWNlbWVudHM/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmcgfCBudW1iZXI+KTogc3RyaW5nIHtcblx0XHRpZiAoaWQgPT0gbnVsbCkge1xuXHRcdFx0cmV0dXJuIFwiXCJcblx0XHR9XG5cblx0XHRpZiAoaWQgPT09IFwiZW1wdHlTdHJpbmdfbXNnXCIpIHtcblx0XHRcdHJldHVybiBcIlxcdTIwMDhcIlxuXHRcdH1cblxuXHRcdGxldCB0ZXh0ID0gdGhpcy50cmFuc2xhdGlvbnMua2V5c1tpZF1cblxuXHRcdGlmICghdGV4dCkge1xuXHRcdFx0Ly8gdHJ5IGZhbGxiYWNrIGxhbmd1YWdlXG5cdFx0XHR0ZXh0ID0gdGhpcy5mYWxsYmFjay5rZXlzW2lkXVxuXG5cdFx0XHRpZiAoIXRleHQpIHtcblx0XHRcdFx0Ly8gdHJ5IHN0YXRpYyBkZWZpbml0aW9uc1xuXHRcdFx0XHR0ZXh0ID0gdGhpcy5zdGF0aWNUcmFuc2xhdGlvbnNbaWRdXG5cblx0XHRcdFx0aWYgKCF0ZXh0KSB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFwibm8gdHJhbnNsYXRpb24gZm91bmQgZm9yIGlkIFwiICsgaWQpXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRmb3IgKGxldCBwYXJhbSBpbiByZXBsYWNlbWVudHMpIHtcblx0XHRcdHRleHQgPSB0ZXh0LnJlcGxhY2VBbGwocGFyYW0sIFN0cmluZyhyZXBsYWNlbWVudHNbcGFyYW1dKSlcblx0XHR9XG5cblx0XHRyZXR1cm4gdGV4dFxuXHR9XG5cblx0Z2V0VGVzdElkKHZhbHVlOiBNYXliZVRyYW5zbGF0aW9uKTogc3RyaW5nIHtcblx0XHRyZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiID8gKHZhbHVlIGFzIFRyYW5zbGF0aW9uKS50ZXN0SWQgOiAodmFsdWUgYXMgVHJhbnNsYXRpb25LZXkpXG5cdH1cblxuXHQvKipcblx0ICogQ3JlYXRlcyBhIFRyYW5zbGF0aW9uLiBPbmx5IHRvIGJlIHVzZWQgaW4gcmFyZSBjYXNlcyB3aGVyZSB3ZSBjYW4ndCB1c2UgYVxuXHQgKiBUcmFuc2xhdGlvbktleSAoZS5nLiByZW5kZXJpbmcgdGhlIG5hbWUgb2YgYSBmb2xkZXIpLlxuXHQgKiBAcGFyYW0gdGVzdElkXG5cdCAqIEBwYXJhbSB1bnJlc29sdmVkXG5cdCAqL1xuXHRtYWtlVHJhbnNsYXRpb24odGVzdElkOiBzdHJpbmcsIHVucmVzb2x2ZWQ6IHN0cmluZyB8IGxhenk8c3RyaW5nPik6IFRyYW5zbGF0aW9uIHtcblx0XHRsZXQgdGV4dCA9IHR5cGVvZiB1bnJlc29sdmVkID09PSBcImZ1bmN0aW9uXCIgPyB1bnJlc29sdmVkKCkgOiB1bnJlc29sdmVkXG5cdFx0cmV0dXJuIHsgdGVzdElkOiB0ZXN0SWQsIHRleHQgfVxuXHR9XG59XG5cbi8qKlxuICogR2V0cyB0aGUgZGVmYXVsdCBsYW5ndWFnZSBkZXJpdmVkIGZyb20gdGhlIGJyb3dzZXIgbGFuZ3VhZ2UuXG4gKiBAcGFyYW0gcmVzdHJpY3Rpb25zIEFuIGFycmF5IG9mIGxhbmd1YWdlIGNvZGVzIHRoZSBzZWxlY3Rpb24gc2hvdWxkIGJlIHJlc3RyaWN0ZWQgdG9cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExhbmd1YWdlTm9EZWZhdWx0KHJlc3RyaWN0aW9ucz86IExhbmd1YWdlQ29kZVtdKTogeyBjb2RlOiBMYW5ndWFnZUNvZGU7IGxhbmd1YWdlVGFnOiBzdHJpbmcgfSB8IG51bGwge1xuXHQvLyBuYXZpZ2F0b3IubGFuZ3VhZ2VzIGNhbiBiZSBhbiBlbXB0eSBhcnJheSBvbiBhbmRyb2lkIDUueCBkZXZpY2VzXG5cdGxldCBsYW5ndWFnZVRhZ3NcblxuXHRpZiAodHlwZW9mIG5hdmlnYXRvciAhPT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdGxhbmd1YWdlVGFncyA9IG5hdmlnYXRvci5sYW5ndWFnZXMgJiYgbmF2aWdhdG9yLmxhbmd1YWdlcy5sZW5ndGggPiAwID8gbmF2aWdhdG9yLmxhbmd1YWdlcyA6IFtuYXZpZ2F0b3IubGFuZ3VhZ2VdXG5cdH0gZWxzZSBpZiAodHlwZW9mIHByb2Nlc3MgIT09IFwidW5kZWZpbmVkXCIgJiYgdHlwZW9mIHByb2Nlc3MuZW52ICE9PSBcInVuZGVmaW5lZFwiKSB7XG5cdFx0Y29uc3QgbG9jYWxlID0gcHJvY2Vzcy5lbnYuTENfQUxMIHx8IHByb2Nlc3MuZW52LkxDX01FU1NBR0VTIHx8IHByb2Nlc3MuZW52LkxBTkcgfHwgcHJvY2Vzcy5lbnYuTEFOR1VBR0UgfHwgcHJvY2Vzcy5lbnYuTENfTkFNRVxuXG5cdFx0aWYgKGxvY2FsZSkge1xuXHRcdFx0bGFuZ3VhZ2VUYWdzID0gW2xvY2FsZS5zcGxpdChcIi5cIilbMF0ucmVwbGFjZShcIl9cIiwgXCItXCIpXVxuXHRcdH1cblx0fVxuXG5cdGlmIChsYW5ndWFnZVRhZ3MpIHtcblx0XHRmb3IgKGxldCB0YWcgb2YgbGFuZ3VhZ2VUYWdzKSB7XG5cdFx0XHRsZXQgY29kZSA9IGdldFN1YnN0aXR1dGVkTGFuZ3VhZ2VDb2RlKHRhZywgcmVzdHJpY3Rpb25zKVxuXG5cdFx0XHRpZiAoY29kZSkge1xuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdGNvZGU6IGNvZGUsXG5cdFx0XHRcdFx0bGFuZ3VhZ2VUYWc6IHRhZyxcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHJldHVybiBudWxsXG59XG5cbi8qKlxuICogR2V0cyB0aGUgZGVmYXVsdCBsYW5ndWFnZSBkZXJpdmVkIGZyb20gdGhlIGJyb3dzZXIgbGFuZ3VhZ2UuXG4gKiBAcGFyYW0gcmVzdHJpY3Rpb25zIEFuIGFycmF5IG9mIGxhbmd1YWdlIGNvZGVzIHRoZSBzZWxlY3Rpb24gc2hvdWxkIGJlIHJlc3RyaWN0ZWQgdG9cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExhbmd1YWdlKHJlc3RyaWN0aW9ucz86IExhbmd1YWdlQ29kZVtdKToge1xuXHRjb2RlOiBMYW5ndWFnZUNvZGVcblx0bGFuZ3VhZ2VUYWc6IHN0cmluZ1xufSB7XG5cdGNvbnN0IGxhbmd1YWdlID0gZ2V0TGFuZ3VhZ2VOb0RlZmF1bHQocmVzdHJpY3Rpb25zKVxuXHRpZiAobGFuZ3VhZ2UpIHJldHVybiBsYW5ndWFnZVxuXG5cdGlmIChyZXN0cmljdGlvbnMgPT0gbnVsbCB8fCByZXN0cmljdGlvbnMuaW5kZXhPZihcImVuXCIpICE9PSAtMSkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRjb2RlOiBcImVuXCIsXG5cdFx0XHRsYW5ndWFnZVRhZzogXCJlbi1VU1wiLFxuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0Y29kZTogcmVzdHJpY3Rpb25zWzBdLFxuXHRcdFx0bGFuZ3VhZ2VUYWc6IHJlc3RyaWN0aW9uc1swXS5yZXBsYWNlKFwiL18vZ1wiLCBcIi1cIiksXG5cdFx0fVxuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRTdWJzdGl0dXRlZExhbmd1YWdlQ29kZSh0YWc6IHN0cmluZywgcmVzdHJpY3Rpb25zPzogTGFuZ3VhZ2VDb2RlW10pOiBMYW5ndWFnZUNvZGUgfCBudWxsIHtcblx0bGV0IGNvZGUgPSB0YWcudG9Mb3dlckNhc2UoKS5yZXBsYWNlKFwiLVwiLCBcIl9cIilcblx0bGV0IGxhbmd1YWdlID0gbGFuZ3VhZ2VzLmZpbmQoKGwpID0+IGwuY29kZSA9PT0gY29kZSAmJiAocmVzdHJpY3Rpb25zID09IG51bGwgfHwgcmVzdHJpY3Rpb25zLmluZGV4T2YobC5jb2RlKSAhPT0gLTEpKVxuXG5cdGlmIChsYW5ndWFnZSA9PSBudWxsKSB7XG5cdFx0aWYgKGNvZGUgPT09IFwiemhfaGtcIiB8fCBjb2RlID09PSBcInpoX3R3XCIpIHtcblx0XHRcdGxhbmd1YWdlID0gbGFuZ3VhZ2VzLmZpbmQoKGwpID0+IGwuY29kZSA9PT0gXCJ6aF9oYW50XCIpXG5cdFx0fSBlbHNlIHtcblx0XHRcdGxldCBiYXNlUGFydCA9IGdldEJhc2VQYXJ0KGNvZGUpXG5cdFx0XHRsYW5ndWFnZSA9IGxhbmd1YWdlcy5maW5kKChsKSA9PiBnZXRCYXNlUGFydChsLmNvZGUpID09PSBiYXNlUGFydCAmJiAocmVzdHJpY3Rpb25zID09IG51bGwgfHwgcmVzdHJpY3Rpb25zLmluZGV4T2YobC5jb2RlKSAhPT0gLTEpKVxuXHRcdH1cblx0fVxuXG5cdGlmIChsYW5ndWFnZSkge1xuXHRcdGxldCBjdXN0b21pemF0aW9uczogV2hpdGVsYWJlbEN1c3RvbWl6YXRpb25zIHwgbnVsbCA9IG51bGxcblxuXHRcdC8vIGFjY2Vzc2luZyBgd2luZG93YCB0aHJvd3MgYW4gZXJyb3Igb24gZGVza3RvcCwgYW5kIHRoaXMgZmlsZSBpcyBpbXBvcnRlZCBieSBEZXNrdG9wTWFpblxuXHRcdGlmICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiKSB7XG5cdFx0XHRjdXN0b21pemF0aW9ucyA9IGdldFdoaXRlbGFiZWxDdXN0b21pemF0aW9ucyh3aW5kb3cpXG5cdFx0fVxuXG5cdFx0Y29uc3QgZ2VybWFuQ29kZSA9IGN1c3RvbWl6YXRpb25zPy5nZXJtYW5MYW5ndWFnZUNvZGVcblxuXHRcdGlmIChsYW5ndWFnZS5jb2RlID09PSBcImRlXCIgJiYgZ2VybWFuQ29kZSAhPSBudWxsKSB7XG5cdFx0XHRyZXR1cm4gZG93bmNhc3QoZ2VybWFuQ29kZSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIGxhbmd1YWdlLmNvZGVcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuIG51bGxcblx0fVxufVxuXG5mdW5jdGlvbiBnZXRCYXNlUGFydChjb2RlOiBzdHJpbmcpOiBzdHJpbmcge1xuXHRjb25zdCBpbmRleE9mVW5kZXJzY29yZSA9IGNvZGUuaW5kZXhPZihcIl9cIilcblxuXHRpZiAoaW5kZXhPZlVuZGVyc2NvcmUgPiAwKSB7XG5cdFx0cmV0dXJuIGNvZGUuc3Vic3RyaW5nKDAsIGluZGV4T2ZVbmRlcnNjb3JlKVxuXHR9IGVsc2Uge1xuXHRcdHJldHVybiBjb2RlXG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEF2YWlsYWJsZUxhbmd1YWdlQ29kZShjb2RlOiBzdHJpbmcpOiBzdHJpbmcge1xuXHRyZXR1cm4gZ2V0U3Vic3RpdHV0ZWRMYW5ndWFnZUNvZGUoY29kZSkgfHwgXCJlblwiXG59XG5cbi8qKlxuICogcHRfYnIgLT4gcHQtQlJcbiAqIEBwYXJhbSBjb2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsYW5ndWFnZUNvZGVUb1RhZyhjb2RlOiBzdHJpbmcpOiBzdHJpbmcge1xuXHRpZiAoY29kZSA9PT0gXCJkZV9zaWVcIikge1xuXHRcdHJldHVybiBcImRlXCJcblx0fVxuXG5cdGNvbnN0IGluZGV4T2ZVbmRlcnNjb3JlID0gY29kZS5pbmRleE9mKFwiX1wiKVxuXG5cdGlmIChpbmRleE9mVW5kZXJzY29yZSA9PT0gLTEpIHtcblx0XHRyZXR1cm4gY29kZVxuXHR9IGVsc2Uge1xuXHRcdGNvbnN0IFtiZWZvcmUsIGFmdGVyXSA9IGNvZGUuc3BsaXQoXCJfXCIpXG5cdFx0cmV0dXJuIGAke2JlZm9yZX0tJHthZnRlci50b1VwcGVyQ2FzZSgpfWBcblx0fVxufVxuXG5leHBvcnQgY29uc3QgYXNzZXJ0VHJhbnNsYXRpb246IChpZDogc3RyaW5nKSA9PiBUcmFuc2xhdGlvbktleSA9IGRvd25jYXN0XG5leHBvcnQgdHlwZSBMYW5ndWFnZVZpZXdNb2RlbFR5cGUgPSBMYW5ndWFnZVZpZXdNb2RlbFxuZXhwb3J0IGNvbnN0IGxhbmc6IExhbmd1YWdlVmlld01vZGVsID0gbmV3IExhbmd1YWdlVmlld01vZGVsKClcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFnQ0Esc0JBQXNCO0FBSXRCLE1BQU1BLHVCQUFpRTtDQUN0RSxJQUFJLE1BQU0sT0FBTztDQUNqQixJQUFJLE1BQU0sT0FBTztDQUNqQixJQUFJLE1BQU0sT0FBTztDQUNqQixJQUFJLE1BQU0sT0FBTztDQUNqQixJQUFJLE1BQU0sT0FBTztDQUNqQixJQUFJLE1BQU0sT0FBTztDQUNqQixJQUFJLE1BQU0sT0FBTztDQUNqQixRQUFRLE1BQU0sT0FBTztDQUNyQixJQUFJLE1BQU0sT0FBTztDQUNqQixJQUFJLE1BQU0sT0FBTztDQUNqQixPQUFPLE1BQU0sT0FBTztDQUNwQixJQUFJLE1BQU0sT0FBTztDQUNqQixJQUFJLE1BQU0sT0FBTztDQUNqQixPQUFPLE1BQU0sT0FBTztDQUNwQixJQUFJLE1BQU0sT0FBTztDQUNqQixJQUFJLE1BQU0sT0FBTztDQUNqQixJQUFJLE1BQU0sT0FBTztDQUNqQixJQUFJLE1BQU0sT0FBTztDQUNqQixJQUFJLE1BQU0sT0FBTztDQUNqQixJQUFJLE1BQU0sT0FBTztDQUNqQixJQUFJLE1BQU0sT0FBTztDQUNqQixJQUFJLE1BQU0sT0FBTztDQUNqQixJQUFJLE1BQU0sT0FBTztDQUNqQixJQUFJLE1BQU0sT0FBTztDQUNqQixJQUFJLE1BQU0sT0FBTztDQUNqQixJQUFJLE1BQU0sT0FBTztDQUNqQixJQUFJLE1BQU0sT0FBTztDQUNqQixJQUFJLE1BQU0sT0FBTztDQUNqQixJQUFJLE1BQU0sT0FBTztDQUNqQixJQUFJLE1BQU0sT0FBTztDQUNqQixPQUFPLE1BQU0sT0FBTztDQUNwQixPQUFPLE1BQU0sT0FBTztDQUNwQixJQUFJLE1BQU0sT0FBTztDQUNqQixJQUFJLE1BQU0sT0FBTztDQUNqQixJQUFJLE1BQU0sT0FBTztDQUNqQixJQUFJLE1BQU0sT0FBTztDQUNqQixJQUFJLE1BQU0sT0FBTztDQUNqQixTQUFTLE1BQU0sT0FBTztDQUN0QixJQUFJLE1BQU0sT0FBTztDQUNqQixJQUFJLE1BQU0sT0FBTztDQUNqQixJQUFJLE1BQU0sT0FBTztDQUNqQixJQUFJLE1BQU0sT0FBTztDQUNqQixJQUFJLE1BQU0s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