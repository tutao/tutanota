// @flow
import o from "ospec"
import {_getSubstitutedLanguageCode, getAvailableLanguageCode, lang} from "../../../src/misc/LanguageViewModel"
// $FlowIgnore[untyped-import]
import en from "../../../src/translations/en"

o.spec("LanguageViewModelTests", function () {
	o("en is default language", browser(async function () {
		o.timeout(4500)
		await lang.init(en)
		o(lang.fallback).equals(en)
	}))

	o("getAvailableLanguage", function () {
		[
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
			["fa", "fa_ir"]
		].forEach(([k, r]) => o(getAvailableLanguageCode(k)).equals(r))
	})

	o("_getSubstitutedLanguageCode", function () {
		[
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
			["fa", "fa_ir"]
		].forEach(([k, r]) => o(_getSubstitutedLanguageCode(k)).equals(r))
	})

	o("_getSubstitutedLanguageCodeWhitelabelCustomizations", function () {
		const globalSelf = typeof global == "undefined" ? window : global
		globalSelf.whitelabelCustomizations = {germanLanguageCode: "de_sie"}
		o(_getSubstitutedLanguageCode("de")).equals("de_sie")
		globalSelf.whitelabelCustomizations = undefined
	})
})
