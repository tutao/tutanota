import o from "@tutao/otest"
import { getAvailableLanguageCode, getSubstitutedLanguageCode, lang } from "../../../src/common/misc/LanguageViewModel.js"
// @ts-ignore[untyped-import]
import en from "../../../src/mail-app/translations/en.js"

o.spec("LanguageViewModelTests", function () {
	o(
		"en is default language",
		browser(async function () {
			o.timeout(4500)
			await lang.init(en)
			o(lang.fallback).equals(en)
		}),
	)
	o("getAvailableLanguage", function () {
		const cases = [
			["en", "en"],
			["zh_CN", "zh"],
			["zh_Hant", "zh_hant"],
			["zh_HK", "zh_hant"],
			["zh_TW", "zh_hant"],
			["uk_ua", "uk"],
			["de", "de"],
			["a", "en"],
			["clingon", "en"],
			["pt_pt", "pt_pt"],
			["pt_br", "pt_br"],
			["fi", "fi"],
			["fa", "fa_ir"],
		]
		for (const [k, r] of cases) o(getAvailableLanguageCode(k)).equals(r)
	})
	o("_getSubstitutedLanguageCode", function () {
		const cases: [string, string | null][] = [
			["en", "en"],
			["zh_hant", "zh_hant"],
			["zh_HK", "zh_hant"],
			["uk_ua", "uk"],
			["de", "de"],
			["a", null],
			["clingon", null],
			["pt_pt", "pt_pt"],
			["pt_br", "pt_br"],
			["fi", "fi"],
			["fa", "fa_ir"],
		]
		for (const [k, r] of cases) {
			o(getSubstitutedLanguageCode(k)).equals(r)
		}
	})
	o("_getSubstitutedLanguageCodeWhitelabelCustomizations", function () {
		const globalSelf = typeof window == "undefined" ? global : window
		globalSelf.whitelabelCustomizations = {
			germanLanguageCode: "de_sie",
		}
		o(getSubstitutedLanguageCode("de")).equals("de_sie")
		globalSelf.whitelabelCustomizations = undefined
	})
})
